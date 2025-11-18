import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from '../lib/logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger = new Logger();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  it('should log info messages with correct format', () => {
    logger.info('Test message');

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const logOutput = consoleLogSpy.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);

    expect(parsed.level).toBe('INFO');
    expect(parsed.message).toBe('Test message');
    expect(parsed.timestamp).toBeDefined();
  });

  it('should log error messages with correct format', () => {
    logger.error('Error message', { code: 'TEST_ERROR' });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logOutput = consoleErrorSpy.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);

    expect(parsed.level).toBe('ERROR');
    expect(parsed.message).toBe('Error message');
    expect(parsed.meta.error.code).toBe('TEST_ERROR');
  });

  it('should log warn messages with correct format', () => {
    logger.warn('Warning message');

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    const logOutput = consoleWarnSpy.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);

    expect(parsed.level).toBe('WARN');
    expect(parsed.message).toBe('Warning message');
  });

  it('should log debug messages with correct format', () => {
    logger.debug('Debug message', { detail: 'test' });

    expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
    const logOutput = consoleDebugSpy.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);

    expect(parsed.level).toBe('DEBUG');
    expect(parsed.message).toBe('Debug message');
    expect(parsed.meta.detail).toBe('test');
  });

  it('should include context in log messages', () => {
    logger.setContext({ ruleId: 'rule-123', userId: 'user-456' });
    logger.info('Message with context');

    const logOutput = consoleLogSpy.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);

    expect(parsed.ruleId).toBe('rule-123');
    expect(parsed.userId).toBe('user-456');
    expect(parsed.message).toBe('Message with context');
  });

  it('should merge additional metadata with log message', () => {
    logger.info('Test message', { requestId: 'req-789', duration: 123 });

    const logOutput = consoleLogSpy.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);

    expect(parsed.message).toBe('Test message');
    expect(parsed.meta.requestId).toBe('req-789');
    expect(parsed.meta.duration).toBe(123);
  });

  it('should create child logger with inherited context', () => {
    logger.setContext({ ruleId: 'rule-123' });
    const child = logger.child({ executionId: 'exec-456' });

    child.info('Child message');

    const logOutput = consoleLogSpy.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);

    expect(parsed.ruleId).toBe('rule-123');
    expect(parsed.executionId).toBe('exec-456');
    expect(parsed.message).toBe('Child message');
  });

  it('should not modify parent logger when child context is set', () => {
    logger.setContext({ ruleId: 'rule-123' });
    const child = logger.child({ executionId: 'exec-456' });

    child.setContext({ pageId: 'page-789' });
    logger.info('Parent message');

    const logOutput = consoleLogSpy.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);

    expect(parsed.ruleId).toBe('rule-123');
    expect(parsed.executionId).toBeUndefined();
    expect(parsed.pageId).toBeUndefined();
  });

  it('should handle Error objects in metadata', () => {
    const error = new Error('Test error');
    logger.error('Error occurred', error);

    const logOutput = consoleErrorSpy.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);

    expect(parsed.level).toBe('ERROR');
    expect(parsed.message).toBe('Error occurred');
    expect(parsed.meta.error).toBeDefined();
  });

  it('should include timestamp in ISO format', () => {
    logger.info('Test message');

    const logOutput = consoleLogSpy.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);

    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
