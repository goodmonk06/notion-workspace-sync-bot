import { SyncRule } from '@prisma/client';
import { IChannel } from '../sync/types';
import { WebhookChannel } from './webhookChannel';

/**
 * SyncRuleからChannelインスタンスを生成
 */
export function createChannel(rule: SyncRule): IChannel {
  switch (rule.targetType) {
    case 'WEBHOOK':
      return new WebhookChannel(rule.targetConfig as any);

    case 'DATABASE':
    case 'API':
      // 将来的な拡張ポイント
      throw new Error(`Target type ${rule.targetType} is not yet implemented`);

    default:
      throw new Error(`Unknown target type: ${rule.targetType}`);
  }
}
