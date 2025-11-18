import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '../events/eventBus';
import type {
  SyncRuleCreatedEvent,
  SyncExecutionStartedEvent,
  PageSyncedEvent,
} from '../events/types';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  it('should emit and handle events', async () => {
    const handler = vi.fn();

    eventBus.on('SyncRuleCreated', handler);

    const event: SyncRuleCreatedEvent = {
      type: 'SyncRuleCreated',
      timestamp: new Date(),
      aggregateId: 'test-rule-1',
      payload: {
        ruleId: 'test-rule-1',
        name: 'Test Rule',
        notionDatabaseId: 'db-123',
        targetType: 'WEBHOOK',
      },
    };

    await eventBus.emit(event);

    expect(handler).toHaveBeenCalledWith(event);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple handlers for the same event', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    eventBus.on('SyncRuleCreated', handler1);
    eventBus.on('SyncRuleCreated', handler2);

    const event: SyncRuleCreatedEvent = {
      type: 'SyncRuleCreated',
      timestamp: new Date(),
      aggregateId: 'test-rule-1',
      payload: {
        ruleId: 'test-rule-1',
        name: 'Test Rule',
        notionDatabaseId: 'db-123',
        targetType: 'WEBHOOK',
      },
    };

    await eventBus.emit(event);

    expect(handler1).toHaveBeenCalledWith(event);
    expect(handler2).toHaveBeenCalledWith(event);
  });

  it('should handle different event types independently', async () => {
    const createdHandler = vi.fn();
    const startedHandler = vi.fn();

    eventBus.on('SyncRuleCreated', createdHandler);
    eventBus.on('SyncExecutionStarted', startedHandler);

    const createdEvent: SyncRuleCreatedEvent = {
      type: 'SyncRuleCreated',
      timestamp: new Date(),
      aggregateId: 'test-rule-1',
      payload: {
        ruleId: 'test-rule-1',
        name: 'Test Rule',
        notionDatabaseId: 'db-123',
        targetType: 'WEBHOOK',
      },
    };

    await eventBus.emit(createdEvent);

    expect(createdHandler).toHaveBeenCalledTimes(1);
    expect(startedHandler).not.toHaveBeenCalled();

    const startedEvent: SyncExecutionStartedEvent = {
      type: 'SyncExecutionStarted',
      timestamp: new Date(),
      aggregateId: 'exec-1',
      payload: {
        executionId: 'exec-1',
        ruleId: 'test-rule-1',
        triggeredBy: 'MANUAL',
      },
    };

    await eventBus.emit(startedEvent);

    expect(createdHandler).toHaveBeenCalledTimes(1);
    expect(startedHandler).toHaveBeenCalledTimes(1);
  });

  it('should handle async event handlers', async () => {
    const handler = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    eventBus.on('PageSynced', handler);

    const event: PageSyncedEvent = {
      type: 'PageSynced',
      timestamp: new Date(),
      aggregateId: 'page-1',
      payload: {
        executionId: 'exec-1',
        ruleId: 'rule-1',
        pageId: 'page-1',
        eventType: 'page.updated',
        success: true,
      },
    };

    await eventBus.emit(event);

    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should handle errors in event handlers gracefully', async () => {
    const errorHandler = vi.fn(() => {
      throw new Error('Handler error');
    });
    const successHandler = vi.fn();

    eventBus.on('SyncRuleCreated', errorHandler);
    eventBus.on('SyncRuleCreated', successHandler);

    const event: SyncRuleCreatedEvent = {
      type: 'SyncRuleCreated',
      timestamp: new Date(),
      aggregateId: 'test-rule-1',
      payload: {
        ruleId: 'test-rule-1',
        name: 'Test Rule',
        notionDatabaseId: 'db-123',
        targetType: 'WEBHOOK',
      },
    };

    // Should not throw even if a handler fails
    await eventBus.emit(event);

    expect(errorHandler).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalled();
  });

  it('should do nothing when emitting event with no handlers', async () => {
    const event: SyncRuleCreatedEvent = {
      type: 'SyncRuleCreated',
      timestamp: new Date(),
      aggregateId: 'test-rule-1',
      payload: {
        ruleId: 'test-rule-1',
        name: 'Test Rule',
        notionDatabaseId: 'db-123',
        targetType: 'WEBHOOK',
      },
    };

    // Should not throw
    await eventBus.emit(event);
  });
});
