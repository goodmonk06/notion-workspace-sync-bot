import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookChannel } from '../channels/webhookChannel';
import { NotionPageEvent } from '../sync/types';
import axios from 'axios';

// Axiosをモック
vi.mock('axios');

describe('WebhookChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send event to webhook URL', async () => {
    const mockPost = vi.mocked(axios.post);
    mockPost.mockResolvedValue({ status: 200, data: { success: true } });

    const channel = new WebhookChannel({
      url: 'https://example.com/webhook',
    });

    const event: NotionPageEvent = {
      id: 'page-123',
      type: 'page.updated',
      page: { id: 'page-123', properties: {} },
      timestamp: '2024-01-01T00:00:00Z',
    };

    await channel.send(event);

    expect(mockPost).toHaveBeenCalledWith(
      'https://example.com/webhook',
      expect.objectContaining({
        event_type: 'page.updated',
        page_id: 'page-123',
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('should include custom headers in request', async () => {
    const mockPost = vi.mocked(axios.post);
    mockPost.mockResolvedValue({ status: 200, data: {} });

    const channel = new WebhookChannel({
      url: 'https://example.com/webhook',
      headers: {
        Authorization: 'Bearer secret-token',
        'X-Custom-Header': 'value',
      },
    });

    const event: NotionPageEvent = {
      id: 'page-123',
      type: 'page.created',
      page: { id: 'page-123' },
      timestamp: '2024-01-01T00:00:00Z',
    };

    await channel.send(event);

    expect(mockPost).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer secret-token',
          'X-Custom-Header': 'value',
        }),
      })
    );
  });

  it('should throw error when webhook request fails', async () => {
    const mockPost = vi.mocked(axios.post);
    mockPost.mockRejectedValue({
      isAxiosError: true,
      message: 'Network Error',
      response: { status: 500 },
    });

    const channel = new WebhookChannel({
      url: 'https://example.com/webhook',
    });

    const event: NotionPageEvent = {
      id: 'page-123',
      type: 'page.updated',
      page: {},
      timestamp: '2024-01-01T00:00:00Z',
    };

    await expect(channel.send(event)).rejects.toThrow();
  });

  it('should respect custom timeout', async () => {
    const mockPost = vi.mocked(axios.post);
    mockPost.mockResolvedValue({ status: 200, data: {} });

    const customTimeout = 5000;
    const channel = new WebhookChannel({
      url: 'https://example.com/webhook',
      timeout: customTimeout,
    });

    const event: NotionPageEvent = {
      id: 'page-123',
      type: 'page.updated',
      page: {},
      timestamp: '2024-01-01T00:00:00Z',
    };

    await channel.send(event);

    expect(mockPost).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({
        timeout: customTimeout,
      })
    );
  });
});
