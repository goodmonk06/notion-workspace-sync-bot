import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseChannel } from '../adapters/databaseChannel';
import { QueueChannel } from '../adapters/queueChannel';
import { StorageChannel } from '../adapters/storageChannel';
import { SlackNotificationAdapter } from '../adapters/slackNotificationAdapter';
import { createChannelAdapter } from '../adapters/channelFactory';
import type { NotionPageEvent } from '../sync/types';
import type { NotificationPayload } from '../adapters/types';
import axios from 'axios';

// Mock axios to avoid making real HTTP requests
vi.mock('axios');

describe('Channel Adapters', () => {
  const mockEvent: NotionPageEvent = {
    id: 'page-123',
    type: 'page.updated',
    timestamp: new Date().toISOString(),
    page: {
      id: 'page-123',
      properties: {
        Name: {
          id: 'title',
          type: 'title',
          title: [{ type: 'text', text: { content: 'Test Page' }, plain_text: 'Test Page' }],
        },
      },
    } as any,
  };

  const mockNotification: NotificationPayload = {
    title: 'Test Notification',
    message: 'This is a test notification',
    severity: 'INFO',
    metadata: { test: true },
  };

  describe('DatabaseChannel', () => {
    it('should create instance with valid config', () => {
      const channel = new DatabaseChannel({
        connectionString: 'postgresql://localhost:5432/test',
        tableName: 'pages',
      });

      expect(channel).toBeDefined();
      expect(channel.getMetadata().type).toBe('DATABASE');
    });

    it('should return metadata', () => {
      const channel = new DatabaseChannel({
        connectionString: 'postgresql://localhost:5432/test',
        tableName: 'pages',
      });

      const metadata = channel.getMetadata();
      expect(metadata.name).toBe('Database Channel');
      expect(metadata.type).toBe('DATABASE');
      expect(metadata.version).toBe('1.0.0');
    });

    it('should handle send operation without throwing', async () => {
      const channel = new DatabaseChannel({
        connectionString: 'postgresql://localhost:5432/test',
        tableName: 'pages',
      });

      // In stub implementation, should not throw
      await expect(channel.send(mockEvent)).resolves.not.toThrow();
    });
  });

  describe('QueueChannel', () => {
    it('should create instance with valid config', () => {
      const channel = new QueueChannel({
        queueType: 'SQS',
        queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
      });

      expect(channel).toBeDefined();
      expect(channel.getMetadata().type).toBe('QUEUE');
    });

    it('should return metadata', () => {
      const channel = new QueueChannel({
        queueType: 'RabbitMQ',
        queueUrl: 'amqp://localhost',
      });

      const metadata = channel.getMetadata();
      expect(metadata.name).toBe('Queue Channel');
      expect(metadata.type).toBe('QUEUE');
      expect(metadata.version).toBe('1.0.0');
    });

    it('should handle send operation without throwing', async () => {
      const channel = new QueueChannel({
        queueType: 'Kafka',
        queueUrl: 'localhost:9092',
      });

      await expect(channel.send(mockEvent)).resolves.not.toThrow();
    });
  });

  describe('StorageChannel', () => {
    it('should create instance with valid config', () => {
      const channel = new StorageChannel({
        storageType: 'S3',
        bucketName: 'my-bucket',
      });

      expect(channel).toBeDefined();
      expect(channel.getMetadata().type).toBe('STORAGE');
    });

    it('should return metadata', () => {
      const channel = new StorageChannel({
        storageType: 'GCS',
        bucketName: 'my-bucket',
      });

      const metadata = channel.getMetadata();
      expect(metadata.name).toBe('Storage Channel');
      expect(metadata.type).toBe('STORAGE');
      expect(metadata.version).toBe('1.0.0');
    });

    it('should handle send operation without throwing', async () => {
      const channel = new StorageChannel({
        storageType: 'S3',
        bucketName: 'my-bucket',
      });

      await expect(channel.send(mockEvent)).resolves.not.toThrow();
    });
  });

  describe('SlackNotificationAdapter', () => {
    beforeEach(() => {
      // Mock axios.post to avoid real HTTP requests
      vi.mocked(axios.post).mockResolvedValue({ status: 200, data: 'ok' });
    });

    it('should create instance with valid config', () => {
      const adapter = new SlackNotificationAdapter({
        webhookUrl: 'https://hooks.slack.com/services/TEST/WEBHOOK/URL',
        channel: '#alerts',
      });

      expect(adapter).toBeDefined();
    });

    it('should send notification successfully', async () => {
      const adapter = new SlackNotificationAdapter({
        webhookUrl: 'https://hooks.slack.com/services/TEST/WEBHOOK/URL',
        username: 'Sync Bot',
      });

      await expect(adapter.send(mockNotification)).resolves.not.toThrow();
      expect(axios.post).toHaveBeenCalled();
    });

    it('should format notification with correct severity', async () => {
      const adapter = new SlackNotificationAdapter({
        webhookUrl: 'https://hooks.slack.com/services/TEST/WEBHOOK/URL',
      });

      await adapter.send(mockNotification);

      const callArgs = vi.mocked(axios.post).mock.calls[0];
      const messagePayload = callArgs[1] as any;

      expect(messagePayload).toHaveProperty('attachments');
      expect(messagePayload.attachments[0]).toHaveProperty('title');
      expect(messagePayload.attachments[0].title).toContain('Test Notification');
    });
  });

  describe('Channel Factory', () => {
    it('should create webhook channel', () => {
      const channel = createChannelAdapter('WEBHOOK', {
        url: 'https://example.com/webhook',
      });

      expect(channel).toBeDefined();
      expect(channel.getMetadata().type).toBe('WEBHOOK');
    });

    it('should create database channel', () => {
      const channel = createChannelAdapter('DATABASE', {
        connectionString: 'postgresql://localhost:5432/test',
        tableName: 'pages',
      });

      expect(channel).toBeDefined();
      expect(channel.getMetadata().type).toBe('DATABASE');
    });

    it('should create queue channel', () => {
      const channel = createChannelAdapter('QUEUE', {
        queueType: 'SQS',
        queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
      });

      expect(channel).toBeDefined();
      expect(channel.getMetadata().type).toBe('QUEUE');
    });

    it('should create storage channel', () => {
      const channel = createChannelAdapter('STORAGE', {
        storageType: 'S3',
        bucketName: 'my-bucket',
      });

      expect(channel).toBeDefined();
      expect(channel.getMetadata().type).toBe('STORAGE');
    });

    it('should throw error for unknown channel type', () => {
      expect(() => {
        createChannelAdapter('UNKNOWN' as any, {});
      }).toThrow('Unknown channel type: UNKNOWN');
    });
  });
});
