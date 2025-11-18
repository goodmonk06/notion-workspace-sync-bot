import { Request, Response } from 'express';
import { getPrismaClient } from '../config/db';

/**
 * SyncLogの一覧取得
 */
export async function listSyncLogs(req: Request, res: Response) {
  const prisma = getPrismaClient();
  const { ruleId, status } = req.query;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const where: any = {};
  if (ruleId) where.ruleId = ruleId as string;
  if (status) where.status = status as string;

  const syncLogs = await prisma.syncLog.findMany({
    where,
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' },
    include: {
      syncRule: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const total = await prisma.syncLog.count({ where });

  res.json({
    success: true,
    data: {
      syncLogs,
      pagination: {
        total,
        limit,
        offset,
      },
    },
  });
}

/**
 * SyncLogの詳細取得
 */
export async function getSyncLog(req: Request, res: Response) {
  const prisma = getPrismaClient();
  const { id } = req.params;

  const syncLog = await prisma.syncLog.findUnique({
    where: { id },
    include: {
      syncRule: true,
    },
  });

  if (!syncLog) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `SyncLog with id ${id} not found`,
      },
    });
    return;
  }

  res.json({
    success: true,
    data: syncLog,
  });
}
