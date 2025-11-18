import axios from 'axios';
import { IChannel, NotionPageEvent } from '../sync/types';
import { IChannelAdapter, ChannelAdapterMetadata } from '../adapters/types';

interface WebhookConfig {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Webhook経由で外部システムへイベントを送信するChannel
 */
export class WebhookChannel implements IChannel, IChannelAdapter {
  private config: WebhookConfig;

  constructor(config: WebhookConfig) {
    this.config = {
      timeout: 10000, // デフォルト10秒
      ...config,
    };
  }

  async send(event: NotionPageEvent): Promise<void> {
    try {
      console.log(`[WebhookChannel] Sending event to ${this.config.url}`);

      const response = await axios.post(
        this.config.url,
        {
          event_type: event.type,
          page_id: event.id,
          timestamp: event.timestamp,
          data: event.page,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...this.config.headers,
          },
          timeout: this.config.timeout,
        }
      );

      console.log(
        `[WebhookChannel] Successfully sent event. Status: ${response.status}`
      );
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Webhook request failed: ${error.message}. ` +
          `URL: ${this.config.url}, ` +
          `Status: ${error.response?.status || 'N/A'}`
        );
      }
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test with a minimal payload
      await axios.post(
        this.config.url,
        { test: true },
        {
          headers: {
            'Content-Type': 'application/json',
            ...this.config.headers,
          },
          timeout: this.config.timeout,
        }
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  getMetadata(): ChannelAdapterMetadata {
    return {
      name: 'Webhook Channel',
      type: 'WEBHOOK',
      version: '1.0.0',
      description: 'Sends events to external systems via HTTP POST',
    };
  }
}
