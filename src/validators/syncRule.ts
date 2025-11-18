import { z } from 'zod';

// SyncRule作成時のバリデーションスキーマ
export const createSyncRuleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  notionDatabaseId: z.string().min(1, 'Notion Database ID is required'),
  direction: z.enum(['ONE_WAY', 'TWO_WAY']).default('ONE_WAY'),
  targetType: z.enum(['WEBHOOK', 'DATABASE', 'API']).default('WEBHOOK'),
  targetConfig: z.record(z.any()).refine(
    (config) => {
      // Webhookの場合、urlが必須
      if (config.targetType === 'WEBHOOK') {
        return typeof config.url === 'string' && config.url.length > 0;
      }
      return true;
    },
    { message: 'Webhook targetConfig must include a valid url' }
  ),
  isActive: z.boolean().default(true),
});

// SyncRule更新時のバリデーションスキーマ
export const updateSyncRuleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  notionDatabaseId: z.string().min(1).optional(),
  direction: z.enum(['ONE_WAY', 'TWO_WAY']).optional(),
  targetType: z.enum(['WEBHOOK', 'DATABASE', 'API']).optional(),
  targetConfig: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});

// クエリパラメータのバリデーション
export const listSyncRulesQuerySchema = z.object({
  isActive: z.string().transform((val) => val === 'true').optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).optional(),
  offset: z.string().transform((val) => parseInt(val, 10)).optional(),
});

export type CreateSyncRuleInput = z.infer<typeof createSyncRuleSchema>;
export type UpdateSyncRuleInput = z.infer<typeof updateSyncRuleSchema>;
export type ListSyncRulesQuery = z.infer<typeof listSyncRulesQuerySchema>;
