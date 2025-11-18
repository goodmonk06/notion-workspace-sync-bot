import { IChannelAdapter } from './types';
import { WebhookChannel } from '../channels/webhookChannel';
import { DatabaseChannel } from './databaseChannel';
import { QueueChannel } from './queueChannel';
import { StorageChannel } from './storageChannel';
import { logger } from '../lib/logger';

/**
 * Factory for creating channel adapters based on configuration
 */
export function createChannelAdapter(
  targetType: string,
  targetConfig: any
): IChannelAdapter {
  logger.debug('[ChannelFactory] Creating channel adapter', {
    targetType,
  });

  switch (targetType) {
    case 'WEBHOOK':
      return new WebhookChannel(targetConfig);

    case 'DATABASE':
      return new DatabaseChannel(targetConfig);

    case 'QUEUE':
      return new QueueChannel(targetConfig);

    case 'STORAGE':
      return new StorageChannel(targetConfig);

    case 'EMAIL':
    case 'API':
      // These would be implemented similarly
      throw new Error(`Channel type ${targetType} is not yet implemented`);

    default:
      throw new Error(`Unknown channel type: ${targetType}`);
  }
}

/**
 * Registry for custom channel adapters
 * Allows plugins to register their own channel types
 */
class ChannelAdapterRegistry {
  private adapters: Map<string, (config: any) => IChannelAdapter> = new Map();

  /**
   * Register a custom channel adapter
   */
  register(
    type: string,
    factory: (config: any) => IChannelAdapter
  ): void {
    this.adapters.set(type.toUpperCase(), factory);
    logger.info('[ChannelRegistry] Registered custom channel adapter', { type });
  }

  /**
   * Create a channel adapter (checks custom registry first)
   */
  create(type: string, config: any): IChannelAdapter {
    const upperType = type.toUpperCase();

    if (this.adapters.has(upperType)) {
      const factory = this.adapters.get(upperType)!;
      return factory(config);
    }

    // Fall back to built-in factory
    return createChannelAdapter(upperType, config);
  }

  /**
   * List all registered channel types
   */
  listTypes(): string[] {
    return Array.from(this.adapters.keys());
  }
}

// Global registry instance
export const channelRegistry = new ChannelAdapterRegistry();
