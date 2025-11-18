import { SyncRule } from '@prisma/client';
import { getPrismaClient } from '../config/db';

/**
 * アクティブな同期ルールを全て取得
 */
export async function getActiveSyncRules(): Promise<SyncRule[]> {
  const prisma = getPrismaClient();
  return await prisma.syncRule.findMany({
    where: {
      isActive: true,
    },
  });
}

/**
 * 特定の同期ルールを取得
 */
export async function getSyncRuleById(id: string): Promise<SyncRule | null> {
  const prisma = getPrismaClient();
  return await prisma.syncRule.findUnique({
    where: { id },
  });
}

/**
 * 同期ルールのカーソルを更新
 */
export async function updateSyncRuleCursor(
  ruleId: string,
  cursor: string
): Promise<void> {
  const prisma = getPrismaClient();
  await prisma.syncRule.update({
    where: { id: ruleId },
    data: { lastCursor: cursor },
  });
}

/**
 * 同期ログを作成
 */
export async function createSyncLog(
  ruleId: string,
  eventType: string,
  payload: any,
  status: 'PENDING' | 'SUCCESS' | 'FAILED',
  error?: any
): Promise<void> {
  const prisma = getPrismaClient();
  await prisma.syncLog.create({
    data: {
      ruleId,
      eventType,
      payload,
      status,
      error: error || null,
    },
  });
}
