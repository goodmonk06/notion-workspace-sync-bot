import axios from 'axios';
import { INotificationAdapter, NotificationPayload } from './types';
import { logger } from '../lib/logger';

interface SlackConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

/**
 * Slack Notification Adapter
 * Sends notifications to Slack via webhook
 */
export class SlackNotificationAdapter implements INotificationAdapter {
  private config: SlackConfig;

  constructor(config: SlackConfig) {
    this.config = config;
  }

  async send(notification: NotificationPayload): Promise<void> {
    logger.info('[SlackNotificationAdapter] Sending notification to Slack', {
      title: notification.title,
      severity: notification.severity,
    });

    const slackMessage = this.formatSlackMessage(notification);

    try {
      await axios.post(this.config.webhookUrl, slackMessage, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });

      logger.info('[SlackNotificationAdapter] Successfully sent to Slack');
    } catch (error: any) {
      logger.error('[SlackNotificationAdapter] Failed to send to Slack', error);
      throw new Error(`Slack notification failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const testMessage = {
        text: 'Test notification from Notion Sync Bot',
      };

      await axios.post(this.config.webhookUrl, testMessage, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });

      return true;
    } catch (error) {
      logger.error('[SlackNotificationAdapter] Connection test failed', error);
      return false;
    }
  }

  private formatSlackMessage(notification: NotificationPayload): any {
    const color = this.getSeverityColor(notification.severity);
    const emoji = this.getSeverityEmoji(notification.severity);

    return {
      username: this.config.username || 'Notion Sync Bot',
      icon_emoji: this.config.iconEmoji || ':robot_face:',
      channel: this.config.channel,
      attachments: [
        {
          color,
          title: `${emoji} ${notification.title}`,
          text: notification.message,
          fields: notification.metadata
            ? Object.entries(notification.metadata).map(([key, value]) => ({
                title: key,
                value: String(value),
                short: true,
              }))
            : [],
          footer: 'Notion Sync Bot',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'INFO':
        return '#36a64f'; // Green
      case 'WARNING':
        return '#ff9900'; // Orange
      case 'ERROR':
        return '#ff0000'; // Red
      case 'CRITICAL':
        return '#990000'; // Dark red
      default:
        return '#cccccc'; // Gray
    }
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'INFO':
        return 'ℹ️';
      case 'WARNING':
        return '⚠️';
      case 'ERROR':
        return '❌';
      case 'CRITICAL':
        return '🚨';
      default:
        return '📢';
    }
  }
}
