# notion-workspace-sync-bot

Notionデータベースを監視し、変更をWebhookで他システムへ同期するボット。双方向同期の骨格も用意。

## Tech Stack

Node.js, TypeScript, Notion API, PostgreSQL

## Architecture

```
src/
  ├── config/           # 環境変数、Notion/DBクライアント
  ├── sync/             # 同期ロジック（SyncRule、SyncRunner）
  ├── channels/         # 外部送信チャンネル（Webhook等）
  ├── cli/              # CLIコマンド
  └── server.ts         # Expressサーバー（ヘルスチェック/Webhook受信）
```

## Getting Started

### 1. 環境構築

```bash
# 依存パッケージをインストール
npm install

# 環境変数を設定
cp .env.example .env
# .envファイルを編集し、NOTION_API_KEYとDATABASE_URLを設定
```

### 2. Notion Integration作成

1. [Notion Integrations](https://www.notion.so/my-integrations)で新しいIntegrationを作成
2. Integration Tokenを取得し、`.env`の`NOTION_API_KEY`に設定
3. 同期したいNotionデータベースに、作成したIntegrationをコネクト

### 3. データベースセットアップ

```bash
# PostgreSQLデータベースを用意し、マイグレーション実行
npm run db:migrate

# Prisma Studioでデータベースを確認（オプション）
npm run db:studio
```

### 4. 同期ルールの登録

Prisma StudioまたはSQLで、`SyncRule`テーブルにレコードを追加します。

**登録例（SQL）：**

```sql
INSERT INTO "SyncRule" (
  id, name, "notionDatabaseId", direction, "targetType", "targetConfig", "isActive", "createdAt", "updatedAt"
) VALUES (
  'rule_001',
  'MyDatabase to Webhook',
  'your_notion_database_id_here',
  'ONE_WAY',
  'WEBHOOK',
  '{"url": "https://example.com/webhook", "headers": {"Authorization": "Bearer token123"}}',
  true,
  NOW(),
  NOW()
);
```

**設定項目：**

- `name`: ルールの識別名
- `notionDatabaseId`: NotionのDatabase ID（URLから取得）
- `direction`: `ONE_WAY`（片方向）または `TWO_WAY`（双方向、将来実装）
- `targetType`: `WEBHOOK`、`DATABASE`、`API`（現在はWEBHOOKのみ対応）
- `targetConfig`: JSON形式の送信先設定
  - Webhookの場合: `{"url": "送信先URL", "headers": {...}}`
- `isActive`: `true`でアクティブ、`false`で無効化

### 5. 同期実行

#### ワンショット実行（手動）

```bash
npm run sync:once
```

全てのアクティブな同期ルールを一度だけ実行します。

#### サーバー起動

```bash
# 開発モード
npm run dev

# 本番モード（ビルド後）
npm run build
npm start
```

ヘルスチェック: `http://localhost:3000/health`

#### Cron設定（定期実行）

cronやKubernetes CronJobで定期的に`npm run sync:once`を実行することで、ポーリング同期を実現できます。

**crontab例（5分ごと）：**

```cron
*/5 * * * * cd /path/to/notion-workspace-sync-bot && npm run sync:once >> /var/log/notion-sync.log 2>&1
```

## 同期の仕組み

1. **ポーリング方式**: Notion APIの`databases.query`で変更を検知
2. **カーソル管理**: `lastCursor`を保存し、次回実行時に差分のみ取得
3. **チャンネル送信**: 検知したイベントを設定されたチャンネル（Webhook等）へ送信
4. **ログ記録**: 各イベントの処理結果を`SyncLog`に保存

## Database Schema

### SyncRule

| カラム            | 型        | 説明                                    |
|-------------------|-----------|----------------------------------------|
| id                | String    | 一意ID                                  |
| name              | String    | ルール名（ユニーク）                    |
| notionDatabaseId  | String    | Notion Database ID                      |
| direction         | Enum      | ONE_WAY / TWO_WAY                       |
| targetType        | Enum      | WEBHOOK / DATABASE / API                |
| targetConfig      | JSON      | 送信先の設定情報                        |
| isActive          | Boolean   | アクティブ/非アクティブ                 |
| lastCursor        | String?   | 前回同期のカーソル                      |

### SyncLog

| カラム    | 型       | 説明                                       |
|-----------|----------|--------------------------------------------|
| id        | String   | 一意ID                                     |
| ruleId    | String   | 関連するSyncRule ID                        |
| eventType | String   | イベントタイプ（page.created等）           |
| payload   | JSON     | Notionから取得したデータ                   |
| status    | Enum     | PENDING / SUCCESS / FAILED                 |
| error     | JSON?    | エラー情報                                 |
| createdAt | DateTime | 作成日時                                   |

## 今後の拡張

- Notion Webhook対応（リアルタイム同期）
- 双方向同期の実装
- 複数のチャンネルタイプ追加（Database、REST API等）
- フィルタリング機能（特定プロパティの変更のみ同期）
- リトライ機能の強化

## License

MIT
