/**
 * Centralized logging utility with contextual information
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  ruleId?: string;
  executionId?: string;
  userId?: string;
  traceId?: string;
  [key: string]: any;
}

export class Logger {
  private context: LogContext = {};

  /**
   * Set contextual information that will be included in all logs
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.setContext({ ...this.context, ...context });
    return childLogger;
  }

  private log(level: LogLevel, message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...this.context,
      ...(meta && { meta }),
    };

    const output = JSON.stringify(logEntry);

    switch (level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.log(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
        console.error(output);
        break;
    }
  }

  debug(message: string, meta?: any): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: any): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log('warn', message, meta);
  }

  error(message: string, error?: Error | any): void {
    const meta = error instanceof Error
      ? { error: error.message, stack: error.stack }
      : { error };
    this.log('error', message, meta);
  }
}

// Global logger instance
export const logger = new Logger();

// Helper to create scoped loggers
export function createLogger(context: LogContext): Logger {
  return logger.child(context);
}
