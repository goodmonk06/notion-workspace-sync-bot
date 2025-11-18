# notion-workspace-sync-bot

Notionデータベースを監視し、変更をWebhookで他システムへ同期するボットフレームワーク。

## Overview

このプロジェクトは、Notion Databaseの変更を検知して外部システムへ自動送信する同期ボットです。ポーリング方式でNotion APIから差分を取得し、設定されたWebhookへイベントを送信します。将来的には双方向同期やリアルタイム同期にも対応可能な拡張可能な設計になっています。

**主な機能：**
- REST API経由での同期ルール（SyncRule）管理（CRUD）
- ポーリング方式でのNotion Database監視
- Webhookによる外部システムへのイベント送信
- 同期履歴のログ記録と閲覧
- カーソル管理による差分同期
- 型安全なバリデーション（Zod）

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express
- **Database**: PostgreSQL + Prisma ORM
- **Validation**: Zod
- **Testing**: Vitest
- **Containerization**: Docker / Docker Compose

## Architecture

```
src/
  ├── api/              # REST APIコントローラーとルート
  │   ├── syncRulesController.ts
  │   ├── syncRulesRoutes.ts
  │   ├── syncLogsController.ts
  │   └── syncLogsRoutes.ts
  ├── config/           # 環境変数、クライアント設定
  │   ├── env.ts
  │   ├── notionClient.ts
  │   └── db.ts
  ├── sync/             # 同期ロジック（SyncRule、SyncRunner）
  │   ├── types.ts
  │   ├── syncRules.ts
  │   └── syncRunner.ts
  ├── channels/         # 外部送信チャンネル（Webhook等）
  │   ├── webhookChannel.ts
  │   └── channelFactory.ts
  ├── validators/       # リクエストバリデーション
  │   └── syncRule.ts
  ├── middleware/       # ミドルウェア
  │   ├── errorHandler.ts
  │   └── validator.ts
  ├── cli/              # CLIコマンド
  │   └── syncOnce.ts
  └── server.ts         # Expressサーバー
```

## Domain Model

### Core Entities

**SyncRule** - 同期ルールの定義
- Notion DatabaseとWebhook送信先のマッピング
- 同期方向（片方向/双方向）の指定
- アクティブ/非アクティブ状態の管理
- カーソル位置の保持（差分同期用）

**SyncLog** - 同期実行の履歴
- 各イベントの処理結果を記録
- 成功/失敗ステータスとエラー詳細
- ペイロードの保存

### Relationships

```
SyncRule (1) ---< (N) SyncLog
```

## Getting Started

### Requirements

- Node.js 20+
- PostgreSQL 16+
- Docker & Docker Compose（推奨）

### Setup with Docker（推奨）

```bash
# 1. リポジトリをクローン
git clone <repository-url>
cd notion-workspace-sync-bot

# 2. 環境変数を設定
cp .env.example .env
# .envファイルを編集し、NOTION_API_KEYを設定

# 3. Docker Composeで起動
docker compose up -d

# 4. マイグレーション実行
docker compose exec app npx prisma migrate deploy

# 5. Seedデータを投入（オプション）
docker compose exec app npm run db:seed
```

サーバーは `http://localhost:3000` で起動します。

### Setup without Docker

```bash
# 1. 依存パッケージをインストール
npm install

# 2. 環境変数を設定
cp .env.example .env
# .envファイルを編集:
#   - NOTION_API_KEY: Notion Integration Token
#   - DATABASE_URL: PostgreSQL接続URL

# 3. データベースセットアップ
npm run db:migrate  # マイグレーション実行
npm run db:seed     # デモデータ投入

# 4. サーバー起動
npm run dev
```

### Notion Integration作成

1. [Notion Integrations](https://www.notion.so/my-integrations)で新しいIntegrationを作成
2. Integration Tokenを取得し、`.env`の`NOTION_API_KEY`に設定
3. 同期したいNotionデータベースに、作成したIntegrationをコネクト（「共有」から追加）

## Example Flow（垂直スライス）

このセクションでは、エンドツーエンドで動作する基本的なフローを説明します。

### 1. SyncRuleの作成（API）

```bash
curl -X POST http://localhost:3000/api/sync-rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Tasks to Slack",
    "notionDatabaseId": "YOUR_NOTION_DATABASE_ID",
    "direction": "ONE_WAY",
    "targetType": "WEBHOOK",
    "targetConfig": {
      "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
      "headers": {
        "Content-Type": "application/json"
      }
    },
    "isActive": true
  }'
```

レスポンス例：
```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "name": "My Tasks to Slack",
    "notionDatabaseId": "YOUR_NOTION_DATABASE_ID",
    "direction": "ONE_WAY",
    "targetType": "WEBHOOK",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. SyncRuleの一覧取得

```bash
curl http://localhost:3000/api/sync-rules
```

### 3. 同期の手動実行

```bash
# 特定のルールを実行
curl -X POST http://localhost:3000/api/sync-rules/{id}/execute

# または、全てのアクティブなルールを実行
npm run sync:once
```

### 4. 同期ログの確認

```bash
# 全てのログを取得
curl http://localhost:3000/api/sync-logs

# 特定のルールのログを取得
curl "http://localhost:3000/api/sync-logs?ruleId=clx123abc"

# 失敗したログのみ取得
curl "http://localhost:3000/api/sync-logs?status=FAILED"
```

### 5. SyncRuleの更新・削除

```bash
# 更新
curl -X PUT http://localhost:3000/api/sync-rules/{id} \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'

# 削除
curl -X DELETE http://localhost:3000/api/sync-rules/{id}
```

## API Reference

### SyncRules API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sync-rules` | SyncRuleの一覧取得 |
| GET | `/api/sync-rules/:id` | SyncRuleの詳細取得 |
| POST | `/api/sync-rules` | SyncRuleの新規作成 |
| PUT | `/api/sync-rules/:id` | SyncRuleの更新 |
| DELETE | `/api/sync-rules/:id` | SyncRuleの削除 |
| POST | `/api/sync-rules/:id/execute` | SyncRuleの手動実行 |

### SyncLogs API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sync-logs` | SyncLogの一覧取得 |
| GET | `/api/sync-logs/:id` | SyncLogの詳細取得 |

クエリパラメータ：
- `ruleId`: 特定のSyncRuleのログのみ取得
- `status`: ステータスでフィルタ（`SUCCESS`, `FAILED`, `PENDING`）
- `limit`: 取得件数（デフォルト: 50）
- `offset`: オフセット

## Available Scripts

```bash
# 開発
npm run dev          # 開発サーバー起動
npm run build        # TypeScriptビルド
npm start            # 本番サーバー起動

# テスト
npm test             # テスト実行
npm run test:watch   # テストをウォッチモードで実行
npm run test:ui      # Vitest UIで実行

# リント
npm run lint         # 型チェック

# データベース
npm run db:migrate   # マイグレーション実行
npm run db:push      # スキーマをDBに反映（開発用）
npm run db:generate  # Prismaクライアント生成
npm run db:studio    # Prisma Studio起動
npm run db:seed      # Seedデータ投入

# 同期
npm run sync:once    # 全ルールを一度だけ実行
```

## Testing

```bash
# 全テストを実行
npm test

# ウォッチモードで開発
npm run test:watch

# カバレッジ付きで実行
npm test -- --coverage
```

テストファイルは `src/__tests__/` に配置されています。

## Database Schema

### SyncRule

| カラム            | 型        | 説明                                    |
|-------------------|-----------|----------------------------------------|
| id                | String    | 一意ID（CUID）                          |
| name              | String    | ルール名（ユニーク）                    |
| notionDatabaseId  | String    | Notion Database ID                      |
| direction         | Enum      | ONE_WAY / TWO_WAY                       |
| targetType        | Enum      | WEBHOOK / DATABASE / API                |
| targetConfig      | JSON      | 送信先の設定情報                        |
| isActive          | Boolean   | アクティブ/非アクティブ                 |
| lastCursor        | String?   | 前回同期のカーソル                      |
| createdAt         | DateTime  | 作成日時                                |
| updatedAt         | DateTime  | 更新日時                                |

### SyncLog

| カラム    | 型       | 説明                                       |
|-----------|----------|--------------------------------------------|
| id        | String   | 一意ID（CUID）                             |
| ruleId    | String   | 関連するSyncRule ID                        |
| eventType | String   | イベントタイプ（page.created等）           |
| payload   | JSON     | Notionから取得したデータ                   |
| status    | Enum     | PENDING / SUCCESS / FAILED                 |
| error     | JSON?    | エラー情報                                 |
| createdAt | DateTime | 作成日時                                   |

## Deployment

### Docker本番デプロイ

```bash
# イメージをビルド
docker build -t notion-sync-bot .

# コンテナ実行
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NOTION_API_KEY="secret_..." \
  notion-sync-bot
```

### Cron設定（定期実行）

cronやKubernetes CronJobで定期的に`npm run sync:once`を実行することで、ポーリング同期を実現できます。

**crontab例（5分ごと）：**

```cron
*/5 * * * * cd /path/to/notion-workspace-sync-bot && npm run sync:once >> /var/log/notion-sync.log 2>&1
```

## Seed Data

デモ用のSyncRuleとSyncLogを投入できます：

```bash
npm run db:seed
```

以下のデータが作成されます：
- **3つのSyncRule**（2つアクティブ、1つ非アクティブ）
  - `Demo: Tasks to Webhook`
  - `Demo: Projects to External API`
  - `Demo: Inactive Rule`
- **3つのSyncLog**（成功2件、失敗1件）

これらのデータを使ってAPIの動作を確認できます。

## 同期の仕組み

1. **ポーリング方式**: Notion APIの`databases.query`で変更を検知
2. **カーソル管理**: `lastCursor`を保存し、次回実行時に差分のみ取得
3. **チャンネル送信**: 検知したイベントを設定されたチャンネル（Webhook等）へ送信
4. **ログ記録**: 各イベントの処理結果を`SyncLog`に保存
5. **エラーハンドリング**: 失敗したイベントはログに記録し、次回も再試行可能

## Future Extensions

今後の拡張予定：

- **Notion Webhook対応**: リアルタイム同期の実装
- **双方向同期**: 外部システムからNotionへの逆同期
- **複数チャンネルタイプ**: Database、REST API、Queue（SQS/RabbitMQ）等
- **フィルタリング機能**: 特定プロパティの変更のみ同期
- **リトライ機能の強化**: Exponential backoff、Dead Letter Queue
- **バッチ処理**: 複数イベントのバッチ送信
- **通知機能**: 同期失敗時のSlack/Email通知
- **Web UI**: 管理画面の追加

## License

MIT
