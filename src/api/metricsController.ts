import { Request, Response } from 'express';
import { metrics } from '../lib/metrics';
import { getPrismaClient } from '../config/db';

/**
 * Get metrics in Prometheus text format
 */
export async function getPrometheusMetrics(req: Request, res: Response) {
  const metricsText = metrics.getMetrics();

  res.setHeader('Content-Type', 'text/plain');
  res.send(metricsText);
}

/**
 * Get metrics in JSON format
 */
export async function getMetricsJSON(req: Request, res: Response) {
  const metricsData = metrics.getMetricsJSON();

  // Add some database-derived metrics
  const prisma = getPrismaClient();

  const activeSyncRules = await prisma.syncRule.count({
    where: { isActive: true },
  });

  const recentFailures = await prisma.syncLog.count({
    where: {
      status: 'FAILED',
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      },
    },
  });

  const runningExecutions = await prisma.syncRuleExecution.count({
    where: { status: 'RUNNING' },
  });

  res.json({
    success: true,
    data: {
      ...metricsData,
      gauges: {
        ...metricsData.gauges,
        active_sync_rules: activeSyncRules,
        recent_failures_1h: recentFailures,
        running_executions: runningExecutions,
      },
    },
  });
}

/**
 * Reset metrics (for testing/debugging)
 */
export async function resetMetrics(req: Request, res: Response) {
  metrics.reset();

  res.json({
    success: true,
    message: 'Metrics reset successfully',
  });
}
