import { DomainEvent, SyncBotEvent } from './types';
import { logger } from '../lib/logger';

/**
 * Event handler function type
 */
export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void> | void;

/**
 * Simple in-memory event bus for domain events
 * In production, this could be replaced with a message queue (RabbitMQ, SQS, etc.)
 */
export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Register an event handler for a specific event type
   */
  on<T extends SyncBotEvent>(eventType: T['type'], handler: EventHandler<T>): void {
    const existingHandlers = this.handlers.get(eventType) || [];
    existingHandlers.push(handler as EventHandler);
    this.handlers.set(eventType, existingHandlers);

    logger.debug(`Registered event handler for ${eventType}`, {
      handlerCount: existingHandlers.length,
    });
  }

  /**
   * Remove an event handler
   */
  off<T extends SyncBotEvent>(eventType: T['type'], handler: EventHandler<T>): void {
    const existingHandlers = this.handlers.get(eventType) || [];
    const filtered = existingHandlers.filter((h) => h !== handler);
    this.handlers.set(eventType, filtered);

    logger.debug(`Removed event handler for ${eventType}`, {
      handlerCount: filtered.length,
    });
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit<T extends SyncBotEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];

    logger.debug(`Emitting event: ${event.type}`, {
      aggregateId: event.aggregateId,
      handlerCount: handlers.length,
    });

    // Execute all handlers in parallel, wrapping each in a promise to catch sync throws
    const results = await Promise.allSettled(
      handlers.map((handler) =>
        Promise.resolve().then(() => handler(event))
      )
    );

    // Log any handler failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error(`Event handler failed for ${event.type}`, result.reason);
      }
    });
  }

  /**
   * Emit an event synchronously (fire and forget)
   */
  emitSync<T extends SyncBotEvent>(event: T): void {
    this.emit(event).catch((error) => {
      logger.error(`Failed to emit event ${event.type}`, error);
    });
  }

  /**
   * Get the number of handlers for an event type
   */
  getHandlerCount(eventType: string): number {
    return (this.handlers.get(eventType) || []).length;
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Global event bus instance
export const eventBus = new EventBus();
