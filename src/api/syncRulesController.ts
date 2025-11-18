import { Request, Response } from 'express';
import { getPrismaClient } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import {
  CreateSyncRuleInput,
  UpdateSyncRuleInput,
  ListSyncRulesQuery,
} from '../validators/syncRule';

/**
 * SyncRuleの一覧取得
 */
export async function listSyncRules(req: Request, res: Response) {
  const prisma = getPrismaClient();
  const query = req.query as unknown as ListSyncRulesQuery;

  const where: any = {};
  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  const syncRules = await prisma.syncRule.findMany({
    where,
    take: query.limit || 100,
    skip: query.offset || 0,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { syncLogs: true },
      },
    },
  });

  const total = await prisma.syncRule.count({ where });

  res.json({
    success: true,
    data: {
      syncRules,
      pagination: {
        total,
        limit: query.limit || 100,
        offset: query.offset || 0,
      },
    },
  });
}

/**
 * SyncRuleの詳細取得
 */
export async function getSyncRule(req: Request, res: Response) {
  const prisma = getPrismaClient();
  const { id } = req.params;

  const syncRule = await prisma.syncRule.findUnique({
    where: { id },
    include: {
      syncLogs: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { syncLogs: true },
      },
    },
  });

  if (!syncRule) {
    throw new AppError(404, `SyncRule with id ${id} not found`);
  }

  res.json({
    success: true,
    data: syncRule,
  });
}

/**
 * SyncRuleの作成
 */
export async function createSyncRule(req: Request, res: Response) {
  const prisma = getPrismaClient();
  const input = req.body as CreateSyncRuleInput;

  const syncRule = await prisma.syncRule.create({
    data: {
      name: input.name,
      notionDatabaseId: input.notionDatabaseId,
      direction: input.direction,
      targetType: input.targetType,
      targetConfig: input.targetConfig,
      isActive: input.isActive,
    },
  });

  res.status(201).json({
    success: true,
    data: syncRule,
  });
}

/**
 * SyncRuleの更新
 */
export async function updateSyncRule(req: Request, res: Response) {
  const prisma = getPrismaClient();
  const { id } = req.params;
  const input = req.body as UpdateSyncRuleInput;

  // 存在確認
  const existing = await prisma.syncRule.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, `SyncRule with id ${id} not found`);
  }

  const syncRule = await prisma.syncRule.update({
    where: { id },
    data: input,
  });

  res.json({
    success: true,
    data: syncRule,
  });
}

/**
 * SyncRuleの削除
 */
export async function deleteSyncRule(req: Request, res: Response) {
  const prisma = getPrismaClient();
  const { id } = req.params;

  // 存在確認
  const existing = await prisma.syncRule.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, `SyncRule with id ${id} not found`);
  }

  await prisma.syncRule.delete({ where: { id } });

  res.json({
    success: true,
    message: `SyncRule ${id} deleted successfully`,
  });
}

/**
 * 特定のSyncRuleを手動実行
 */
export async function executeSyncRule(req: Request, res: Response) {
  const prisma = getPrismaClient();
  const { id } = req.params;

  const syncRule = await prisma.syncRule.findUnique({ where: { id } });
  if (!syncRule) {
    throw new AppError(404, `SyncRule with id ${id} not found`);
  }

  if (!syncRule.isActive) {
    throw new AppError(400, 'Cannot execute inactive SyncRule');
  }

  // 同期を非同期で実行（別途インポート）
  const { runSyncRule } = await import('../sync/syncRunner');

  // バックグラウンドで実行
  runSyncRule(syncRule).catch((error) => {
    console.error(`[API] Failed to execute sync rule ${id}:`, error);
  });

  res.json({
    success: true,
    message: `SyncRule ${id} execution started`,
  });
}
