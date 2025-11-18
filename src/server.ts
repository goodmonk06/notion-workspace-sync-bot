import express, { Request, Response } from 'express';
import { validateEnv, env } from './config/env';
import { getPrismaClient } from './config/db';

const app = express();

app.use(express.json());

// ヘルスチェックエンドポイント
app.get('/health', async (req: Request, res: Response) => {
  try {
    // DB接続チェック
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'notion-workspace-sync-bot',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Webhook受信エンドポイント（将来的な拡張用）
app.post('/webhook/notion', async (req: Request, res: Response) => {
  try {
    console.log('[Server] Received Notion webhook:', req.body);

    // TODO: Webhook処理のロジックを実装
    // 現在はポーリング方式なので、このエンドポイントは予約のみ

    res.json({
      received: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Server] Webhook processing error:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

// サーバー起動
async function startServer() {
  try {
    // 環境変数を検証
    validateEnv();
    console.log('✓ Environment variables validated');

    // サーバー起動
    app.listen(env.port, () => {
      console.log(`✓ Server is running on port ${env.port}`);
      console.log(`  - Health check: http://localhost:${env.port}/health`);
      console.log(`  - Webhook endpoint: http://localhost:${env.port}/webhook/notion`);
    });
  } catch (error: any) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

startServer();
