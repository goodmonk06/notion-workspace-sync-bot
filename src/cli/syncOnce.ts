#!/usr/bin/env node

import { validateEnv } from '../config/env';
import { runAllSyncRules } from '../sync/syncRunner';
import { disconnectDB } from '../config/db';

/**
 * 全ての同期ルールを一度だけ実行するCLIコマンド
 */
async function main() {
  try {
    console.log('=== Notion Sync Bot - Sync Once ===\n');

    // 環境変数を検証
    validateEnv();
    console.log('✓ Environment variables validated\n');

    // 全ての同期ルールを実行
    await runAllSyncRules();

    console.log('\n✓ Sync completed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('\n✗ Sync failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    // DB接続をクリーンアップ
    await disconnectDB();
  }
}

main();
