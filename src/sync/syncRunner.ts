import { SyncRule } from '@prisma/client';
import { getNotionClient } from '../config/notionClient';
import {
  getActiveSyncRules,
  updateSyncRuleCursor,
  createSyncLog,
} from './syncRules';
import { NotionPageEvent, IChannel } from './types';
import { createChannel } from '../channels/channelFactory';

/**
 * 単一の同期ルールを実行
 */
export async function runSyncRule(rule: SyncRule): Promise<void> {
  console.log(`[SyncRunner] Running sync rule: ${rule.name} (${rule.id})`);

  try {
    const notion = getNotionClient();
    const channel = createChannel(rule);

    // Notion Database から変更を取得（ポーリング方式）
    const response = await notion.databases.query({
      database_id: rule.notionDatabaseId,
      start_cursor: rule.lastCursor || undefined,
      page_size: 100,
    });

    console.log(`[SyncRunner] Found ${response.results.length} pages for rule: ${rule.name}`);

    // 各ページをイベントとして処理
    for (const page of response.results) {
      const event: NotionPageEvent = {
        id: page.id,
        type: 'page.updated', // ポーリングなので更新として扱う
        page,
        timestamp: new Date().toISOString(),
      };

      try {
        // チャンネル経由で外部へ送信
        await channel.send(event);

        // 成功ログを記録
        await createSyncLog(rule.id, event.type, event.page, 'SUCCESS');
      } catch (error: any) {
        console.error(`[SyncRunner] Failed to send event for page ${page.id}:`, error);

        // 失敗ログを記録
        await createSyncLog(
          rule.id,
          event.type,
          event.page,
          'FAILED',
          { message: error.message, stack: error.stack }
        );
      }
    }

    // カーソルを更新（次回実行時に使用）
    if (response.has_more && response.next_cursor) {
      await updateSyncRuleCursor(rule.id, response.next_cursor);
      console.log(`[SyncRunner] Updated cursor for rule: ${rule.name}`);
    } else {
      // 全件取得完了したらカーソルをリセット
      await updateSyncRuleCursor(rule.id, '');
      console.log(`[SyncRunner] Completed sync for rule: ${rule.name}`);
    }
  } catch (error: any) {
    console.error(`[SyncRunner] Error running sync rule ${rule.name}:`, error);
    throw error;
  }
}

/**
 * 全てのアクティブな同期ルールを実行
 */
export async function runAllSyncRules(): Promise<void> {
  const rules = await getActiveSyncRules();
  console.log(`[SyncRunner] Found ${rules.length} active sync rules`);

  for (const rule of rules) {
    try {
      await runSyncRule(rule);
    } catch (error) {
      console.error(`[SyncRunner] Failed to run sync rule ${rule.name}:`, error);
      // 続行して次のルールを実行
    }
  }

  console.log('[SyncRunner] Completed all sync rules');
}
