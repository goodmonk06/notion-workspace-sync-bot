import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsCollector } from '../lib/metrics';

describe('MetricsCollector', () => {
  let metrics: MetricsCollector;

  beforeEach(() => {
    metrics = new MetricsCollector();
  });

  describe('Counter metrics', () => {
    it('should increment counter', () => {
      metrics.incrementCounter('test_counter');
      metrics.incrementCounter('test_counter');

      const metricsJSON = metrics.getMetricsJSON();
      expect(metricsJSON.counters.test_counter).toBe(2);
    });

    it('should increment counter with custom value', () => {
      metrics.incrementCounter('test_counter', {}, 5);
      metrics.incrementCounter('test_counter', {}, 3);

      const metricsJSON = metrics.getMetricsJSON();
      expect(metricsJSON.counters.test_counter).toBe(8);
    });

    it('should track counters with different labels separately', () => {
      metrics.incrementCounter('http_requests', { method: 'GET', status: '200' });
      metrics.incrementCounter('http_requests', { method: 'POST', status: '201' });
      metrics.incrementCounter('http_requests', { method: 'GET', status: '200' });

      const metricsJSON = metrics.getMetricsJSON();
      expect(metricsJSON.counters['http_requests{method="GET",status="200"}']).toBe(2);
      expect(metricsJSON.counters['http_requests{method="POST",status="201"}']).toBe(1);
    });
  });

  describe('Gauge metrics', () => {
    it('should set gauge value', () => {
      metrics.setGauge('active_connections', 10);

      const metricsJSON = metrics.getMetricsJSON();
      expect(metricsJSON.gauges.active_connections).toBe(10);
    });

    it('should update gauge value', () => {
      metrics.setGauge('active_connections', 10);
      metrics.setGauge('active_connections', 15);

      const metricsJSON = metrics.getMetricsJSON();
      expect(metricsJSON.gauges.active_connections).toBe(15);
    });

    it('should track gauges with different labels separately', () => {
      metrics.setGauge('queue_size', 100, { queue: 'high_priority' });
      metrics.setGauge('queue_size', 50, { queue: 'low_priority' });

      const metricsJSON = metrics.getMetricsJSON();
      expect(metricsJSON.gauges['queue_size{queue="high_priority"}']).toBe(100);
      expect(metricsJSON.gauges['queue_size{queue="low_priority"}']).toBe(50);
    });
  });

  describe('Histogram metrics', () => {
    it('should record histogram values', () => {
      metrics.recordHistogram('request_duration', 100);
      metrics.recordHistogram('request_duration', 200);
      metrics.recordHistogram('request_duration', 150);

      const metricsJSON = metrics.getMetricsJSON();
      expect(metricsJSON.histograms.request_duration).toBeDefined();
      expect(metricsJSON.histograms.request_duration.count).toBe(3);
      expect(metricsJSON.histograms.request_duration.sum).toBe(450);
    });

    it('should calculate histogram statistics correctly', () => {
      const values = [10, 20, 30, 40, 50];
      values.forEach((v) => metrics.recordHistogram('test_histogram', v));

      const metricsJSON = metrics.getMetricsJSON();
      const histogram = metricsJSON.histograms.test_histogram;

      expect(histogram.count).toBe(5);
      expect(histogram.sum).toBe(150);
      expect(histogram.min).toBe(10);
      expect(histogram.max).toBe(50);
      expect(histogram.avg).toBe(30);
    });

    it('should track histograms with different labels separately', () => {
      metrics.recordHistogram('api_latency', 100, { endpoint: '/api/sync' });
      metrics.recordHistogram('api_latency', 200, { endpoint: '/api/sync' });
      metrics.recordHistogram('api_latency', 50, { endpoint: '/api/health' });

      const metricsJSON = metrics.getMetricsJSON();
      expect(metricsJSON.histograms['api_latency{endpoint="/api/sync"}'].count).toBe(2);
      expect(metricsJSON.histograms['api_latency{endpoint="/api/health"}'].count).toBe(1);
    });
  });

  describe('Prometheus format', () => {
    it('should export metrics in Prometheus text format', () => {
      metrics.incrementCounter('sync_total', { status: 'success' }, 10);
      metrics.setGauge('active_syncs', 5);
      metrics.recordHistogram('sync_duration_ms', 123);

      const prometheusText = metrics.getMetrics();

      expect(prometheusText).toContain('sync_total{status="success"} 10');
      expect(prometheusText).toContain('active_syncs 5');
      expect(prometheusText).toContain('sync_duration_ms_count 1');
      expect(prometheusText).toContain('sync_duration_ms_sum 123');
    });
  });

  describe('Reset functionality', () => {
    it('should reset all metrics', () => {
      metrics.incrementCounter('test_counter');
      metrics.setGauge('test_gauge', 100);
      metrics.recordHistogram('test_histogram', 50);

      metrics.reset();

      const metricsJSON = metrics.getMetricsJSON();
      expect(Object.keys(metricsJSON.counters).length).toBe(0);
      expect(Object.keys(metricsJSON.gauges).length).toBe(0);
      expect(Object.keys(metricsJSON.histograms).length).toBe(0);
    });
  });

  describe('JSON format', () => {
    it('should export metrics in JSON format', () => {
      metrics.incrementCounter('test_counter', {}, 5);
      metrics.setGauge('test_gauge', 42);

      const metricsJSON = metrics.getMetricsJSON();

      expect(metricsJSON).toHaveProperty('counters');
      expect(metricsJSON).toHaveProperty('gauges');
      expect(metricsJSON).toHaveProperty('histograms');
      expect(metricsJSON.counters.test_counter).toBe(5);
      expect(metricsJSON.gauges.test_gauge).toBe(42);
    });
  });
});
