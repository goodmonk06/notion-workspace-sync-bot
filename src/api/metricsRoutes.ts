import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as controller from './metricsController';

const router = Router();

// GET /metrics - Prometheus format
router.get('/', asyncHandler(controller.getPrometheusMetrics));

// GET /metrics/json - JSON format
router.get('/json', asyncHandler(controller.getMetricsJSON));

// POST /metrics/reset - Reset metrics (for testing)
router.post('/reset', asyncHandler(controller.resetMetrics));

export default router;
