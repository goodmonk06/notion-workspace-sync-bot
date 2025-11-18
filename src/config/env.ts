import dotenv from 'dotenv';

dotenv.config();

export const env = {
  notionApiKey: process.env.NOTION_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
};

// 環境変数のバリデーション
export function validateEnv(): void {
  const required = ['NOTION_API_KEY', 'DATABASE_URL'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check .env.example for reference.'
    );
  }
}
