import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as controller from './executionsController';

const router = Router();

// GET /api/executions - List executions
router.get('/', asyncHandler(controller.listExecutions));

// GET /api/executions/stats - Get execution statistics
router.get('/stats', asyncHandler(controller.getExecutionStats));

// GET /api/executions/:id - Get single execution
router.get('/:id', asyncHandler(controller.getExecution));

export default router;
