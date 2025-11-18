/**
 * Simple metrics collection abstraction
 * In production, this would integrate with Prometheus, StatsD, or similar
 */

interface MetricLabels {
  [key: string]: string | number;
}

interface CounterMetric {
  name: string;
  value: number;
  labels: MetricLabels;
  timestamp: Date;
}

interface GaugeMetric {
  name: string;
  value: number;
  labels: MetricLabels;
  timestamp: Date;
}

interface HistogramMetric {
  name: string;
  value: number;
  labels: MetricLabels;
  timestamp: Date;
}

export class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, labels: MetricLabels = {}, value: number = 1): void {
    const key = this.getMetricKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  /**
   * Set a gauge metric (absolute value)
   */
  setGauge(name: string, value: number, labels: MetricLabels = {}): void {
    const key = this.getMetricKey(name, labels);
    this.gauges.set(key, value);
  }

  /**
   * Record a histogram value (for latencies, sizes, etc.)
   */
  recordHistogram(name: string, value: number, labels: MetricLabels = {}): void {
    const key = this.getMetricKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  /**
   * Record the duration of an operation
   */
  async recordDuration<T>(
    name: string,
    operation: () => Promise<T>,
    labels: MetricLabels = {}
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - start;
      this.recordHistogram(name, duration, labels);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.recordHistogram(name, duration, { ...labels, status: 'error' });
      throw error;
    }
  }

  /**
   * Get all metrics in Prometheus text format
   */
  getMetrics(): string {
    const lines: string[] = [];

    // Counters
    for (const [key, value] of this.counters.entries()) {
      lines.push(`${key} ${value}`);
    }

    // Gauges
    for (const [key, value] of this.gauges.entries()) {
      lines.push(`${key} ${value}`);
    }

    // Histograms (simplified: just report count and sum)
    for (const [key, values] of this.histograms.entries()) {
      const count = values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = count > 0 ? sum / count : 0;
      lines.push(`${key}_count ${count}`);
      lines.push(`${key}_sum ${sum}`);
      lines.push(`${key}_avg ${avg}`);
    }

    return lines.join('\n');
  }

  /**
   * Get metrics as JSON
   */
  getMetricsJSON(): any {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([key, values]) => [
          key,
          {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            avg: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
            min: values.length > 0 ? Math.min(...values) : 0,
            max: values.length > 0 ? Math.max(...values) : 0,
          },
        ])
      ),
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  private getMetricKey(name: string, labels: MetricLabels): string {
    if (Object.keys(labels).length === 0) {
      return name;
    }
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }
}

// Global metrics collector
export const metrics = new MetricsCollector();

// Common metric names as constants
export const METRIC_NAMES = {
  SYNC_EXECUTION_TOTAL: 'sync_execution_total',
  SYNC_EXECUTION_DURATION_MS: 'sync_execution_duration_ms',
  SYNC_PAGES_PROCESSED: 'sync_pages_processed',
  SYNC_PAGES_FAILED: 'sync_pages_failed',
  CHANNEL_REQUEST_TOTAL: 'channel_request_total',
  CHANNEL_REQUEST_DURATION_MS: 'channel_request_duration_ms',
  CHANNEL_REQUEST_BYTES: 'channel_request_bytes',
  NOTION_API_CALLS: 'notion_api_calls',
  NOTION_API_ERRORS: 'notion_api_errors',
  ACTIVE_SYNC_RULES: 'active_sync_rules',
  QUEUE_DEPTH: 'queue_depth',
};
