import { SyncRule } from '@prisma/client';

// NotionのPage変更イベント
export interface NotionPageEvent {
  id: string;
  type: 'page.created' | 'page.updated' | 'page.deleted';
  page: any; // Notionのページオブジェクト
  timestamp: string;
}

// Channelインターフェース
export interface IChannel {
  send(event: NotionPageEvent): Promise<void>;
}

// SyncRuleとChannelの組み合わせ
export interface SyncRuleWithChannel {
  rule: SyncRule;
  channel: IChannel;
}
