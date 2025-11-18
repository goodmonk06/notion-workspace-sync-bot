import { Client } from '@notionhq/client';
import { env } from './env';

// Notionクライアントのシングルトンインスタンス
let notionClient: Client | null = null;

export function getNotionClient(): Client {
  if (!notionClient) {
    notionClient = new Client({
      auth: env.notionApiKey,
    });
  }
  return notionClient;
}
