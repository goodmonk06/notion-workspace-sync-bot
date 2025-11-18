import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as controller from './syncLogsController';

const router = Router();

// GET /api/sync-logs - SyncLogの一覧取得
router.get('/', asyncHandler(controller.listSyncLogs));

// GET /api/sync-logs/:id - SyncLogの詳細取得
router.get('/:id', asyncHandler(controller.getSyncLog));

export default router;
