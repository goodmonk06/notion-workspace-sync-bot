import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, validateQuery } from '../middleware/validator';
import {
  createSyncRuleSchema,
  updateSyncRuleSchema,
  listSyncRulesQuerySchema,
} from '../validators/syncRule';
import * as controller from './syncRulesController';

const router = Router();

// GET /api/sync-rules - SyncRuleの一覧取得
router.get(
  '/',
  validateQuery(listSyncRulesQuerySchema),
  asyncHandler(controller.listSyncRules)
);

// GET /api/sync-rules/:id - SyncRuleの詳細取得
router.get('/:id', asyncHandler(controller.getSyncRule));

// POST /api/sync-rules - SyncRuleの作成
router.post(
  '/',
  validateBody(createSyncRuleSchema),
  asyncHandler(controller.createSyncRule)
);

// PUT /api/sync-rules/:id - SyncRuleの更新
router.put(
  '/:id',
  validateBody(updateSyncRuleSchema),
  asyncHandler(controller.updateSyncRule)
);

// DELETE /api/sync-rules/:id - SyncRuleの削除
router.delete('/:id', asyncHandler(controller.deleteSyncRule));

// POST /api/sync-rules/:id/execute - SyncRuleの手動実行
router.post('/:id/execute', asyncHandler(controller.executeSyncRule));

export default router;
