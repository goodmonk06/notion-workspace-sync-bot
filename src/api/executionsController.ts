import { Request, Response } from 'express';
import { getPrismaClient } from '../config/db';
import { AppError } from '../middleware/errorHandler';

/**
 * List executions with filtering
 */
export async function listExecutions(req: Request, res: Response) {
  const prisma = getPrismaClient();
  const { ruleId, status, limit = '50', offset = '0' } = req.query;

  const where: any = {};
  if (ruleId) where.ruleId = ruleId as string;
  if (status) where.status = status as string;

  const executions = await prisma.syncRuleExecution.findMany({
    where,
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
    orderBy: { startedAt: 'desc' },
    include: {
      syncRule: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const total = await prisma.syncRuleExecution.count({ where });

  res.json({
    success: true,
    data: {
      executions,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    },
  });
}

/**
 * Get execution details
 */
export async function getExecution(req: Request, res: Response) {
  const prisma = getPrismaClient();
  const { id } = req.params;

  const execution = await prisma.syncRuleExecution.findUnique({
    where: { id },
    include: {
      syncRule: true,
    },
  });

  if (!execution) {
    throw new AppError(404, `Execution with id ${id} not found`);
  }

  res.json({
    success: true,
    data: execution,
  });
}

/**
 * Get execution statistics
 */
export async function getExecutionStats(req: Request, res: Response) {
  const prisma = getPrismaClient();
  const { ruleId } = req.query;

  const where: any = {};
  if (ruleId) where.ruleId = ruleId as string;

  const stats = await prisma.syncRuleExecution.aggregate({
    where,
    _count: {
      id: true,
    },
    _sum: {
      pagesProcessed: true,
      pagesSucceeded: true,
      pagesFailed: true,
      durationMs: true,
    },
    _avg: {
      durationMs: true,
      pagesProcessed: true,
    },
  });

  // Count by status
  const byStatus = await prisma.syncRuleExecution.groupBy({
    by: ['status'],
    where,
    _count: {
      status: true,
    },
  });

  res.json({
    success: true,
    data: {
      summary: {
        totalExecutions: stats._count.id,
        totalPagesProcessed: stats._sum.pagesProcessed || 0,
        totalPagesSucceeded: stats._sum.pagesSucceeded || 0,
        totalPagesFailed: stats._sum.pagesFailed || 0,
        avgDurationMs: Math.round(stats._avg.durationMs || 0),
        avgPagesPerExecution: Math.round(stats._avg.pagesProcessed || 0),
      },
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
    },
  });
}
