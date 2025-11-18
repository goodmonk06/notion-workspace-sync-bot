/**
 * Adapter interfaces for extensibility
 */

import { NotionPageEvent } from '../sync/types';

// ============================================================================
// CHANNEL ADAPTERS
// ============================================================================

export interface IChannelAdapter {
  /**
   * Send an event to the external system
   */
  send(event: NotionPageEvent): Promise<void>;

  /**
   * Test the connection to the external system
   */
  testConnection?(): Promise<boolean>;

  /**
   * Get adapter metadata
   */
  getMetadata(): ChannelAdapterMetadata;
}

export interface ChannelAdapterMetadata {
  name: string;
  type: string;
  version: string;
  description: string;
}

// ============================================================================
// NOTIFICATION ADAPTERS
// ============================================================================

export interface INotificationAdapter {
  /**
   * Send a notification
   */
  send(notification: NotificationPayload): Promise<void>;

  /**
   * Test the notification channel
   */
  testConnection?(): Promise<boolean>;
}

export interface NotificationPayload {
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  metadata?: Record<string, any>;
}

// ============================================================================
// TRANSFORMATION ADAPTERS
// ============================================================================

export interface ITransformationAdapter {
  /**
   * Transform data from Notion format to target format
   */
  transform(input: any): Promise<any>;

  /**
   * Validate transformed output
   */
  validate?(output: any): Promise<boolean>;

  /**
   * Get transformation metadata
   */
  getMetadata(): TransformationAdapterMetadata;
}

export interface TransformationAdapterMetadata {
  name: string;
  type: string;
  version: string;
  description: string;
}

// ============================================================================
// FILTER ADAPTERS
// ============================================================================

export interface IFilterAdapter {
  /**
   * Test if a Notion page matches the filter criteria
   */
  matches(page: any): Promise<boolean>;

  /**
   * Get filter metadata
   */
  getMetadata(): FilterAdapterMetadata;
}

export interface FilterAdapterMetadata {
  name: string;
  type: string;
  description: string;
}
