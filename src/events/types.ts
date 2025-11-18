/**
 * Domain event types for the sync bot
 */

export interface DomainEvent {
  type: string;
  timestamp: Date;
  aggregateId: string;
  payload: any;
}

// ============================================================================
// SYNC RULE EVENTS
// ============================================================================

export interface SyncRuleCreatedEvent extends DomainEvent {
  type: 'SyncRuleCreated';
  payload: {
    ruleId: string;
    name: string;
    notionDatabaseId: string;
    targetType: string;
  };
}

export interface SyncRuleUpdatedEvent extends DomainEvent {
  type: 'SyncRuleUpdated';
  payload: {
    ruleId: string;
    changes: Record<string, any>;
  };
}

export interface SyncRuleDeletedEvent extends DomainEvent {
  type: 'SyncRuleDeleted';
  payload: {
    ruleId: string;
    name: string;
  };
}

export interface SyncRuleActivatedEvent extends DomainEvent {
  type: 'SyncRuleActivated';
  payload: {
    ruleId: string;
    name: string;
  };
}

export interface SyncRuleDeactivatedEvent extends DomainEvent {
  type: 'SyncRuleDeactivated';
  payload: {
    ruleId: string;
    name: string;
  };
}

// ============================================================================
// SYNC EXECUTION EVENTS
// ============================================================================

export interface SyncExecutionStartedEvent extends DomainEvent {
  type: 'SyncExecutionStarted';
  payload: {
    executionId: string;
    ruleId: string;
    triggeredBy: string;
  };
}

export interface SyncExecutionCompletedEvent extends DomainEvent {
  type: 'SyncExecutionCompleted';
  payload: {
    executionId: string;
    ruleId: string;
    durationMs: number;
    pagesProcessed: number;
    pagesSucceeded: number;
    pagesFailed: number;
  };
}

export interface SyncExecutionFailedEvent extends DomainEvent {
  type: 'SyncExecutionFailed';
  payload: {
    executionId: string;
    ruleId: string;
    error: string;
    errorStack?: string;
  };
}

export interface PageSyncedEvent extends DomainEvent {
  type: 'PageSynced';
  payload: {
    executionId: string;
    ruleId: string;
    pageId: string;
    eventType: string;
    success: boolean;
  };
}

export interface BatchSyncedEvent extends DomainEvent {
  type: 'BatchSynced';
  payload: {
    executionId: string;
    ruleId: string;
    batchSize: number;
    successCount: number;
    failureCount: number;
  };
}

// ============================================================================
// NOTIFICATION EVENTS
// ============================================================================

export interface NotificationTriggeredEvent extends DomainEvent {
  type: 'NotificationTriggered';
  payload: {
    notificationId: string;
    channelId: string;
    notificationType: string;
    severity: string;
  };
}

export interface NotificationSentEvent extends DomainEvent {
  type: 'NotificationSent';
  payload: {
    notificationId: string;
    channelId: string;
    success: boolean;
  };
}

// ============================================================================
// UNION TYPE
// ============================================================================

export type SyncBotEvent =
  | SyncRuleCreatedEvent
  | SyncRuleUpdatedEvent
  | SyncRuleDeletedEvent
  | SyncRuleActivatedEvent
  | SyncRuleDeactivatedEvent
  | SyncExecutionStartedEvent
  | SyncExecutionCompletedEvent
  | SyncExecutionFailedEvent
  | PageSyncedEvent
  | BatchSyncedEvent
  | NotificationTriggeredEvent
  | NotificationSentEvent;
