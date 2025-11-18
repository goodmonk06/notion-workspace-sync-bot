import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 既存のデータをクリーンアップ（開発環境のみ）
  if (process.env.NODE_ENV !== 'production') {
    console.log('Cleaning up existing data...');
    await prisma.syncLog.deleteMany();
    await prisma.syncRule.deleteMany();
  }

  // デモ用のSyncRuleを作成
  const demoRule1 = await prisma.syncRule.create({
    data: {
      name: 'Demo: Tasks to Webhook',
      notionDatabaseId: 'demo-database-id-1',
      direction: 'ONE_WAY',
      targetType: 'WEBHOOK',
      targetConfig: {
        url: 'https://webhook.site/your-unique-url',
        headers: {
          'X-Demo-Header': 'demo-value',
        },
      },
      isActive: true,
    },
  });
  console.log(`✓ Created SyncRule: ${demoRule1.name}`);

  const demoRule2 = await prisma.syncRule.create({
    data: {
      name: 'Demo: Projects to External API',
      notionDatabaseId: 'demo-database-id-2',
      direction: 'ONE_WAY',
      targetType: 'WEBHOOK',
      targetConfig: {
        url: 'https://httpbin.org/post',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo-token-12345',
        },
      },
      isActive: true,
    },
  });
  console.log(`✓ Created SyncRule: ${demoRule2.name}`);

  const inactiveRule = await prisma.syncRule.create({
    data: {
      name: 'Demo: Inactive Rule',
      notionDatabaseId: 'demo-database-id-3',
      direction: 'TWO_WAY',
      targetType: 'WEBHOOK',
      targetConfig: {
        url: 'https://example.com/webhook',
      },
      isActive: false,
    },
  });
  console.log(`✓ Created SyncRule: ${inactiveRule.name} (inactive)`);

  // デモ用のSyncLogを作成
  await prisma.syncLog.createMany({
    data: [
      {
        ruleId: demoRule1.id,
        eventType: 'page.created',
        payload: {
          page_id: 'page-001',
          title: 'Sample Task 1',
          status: 'In Progress',
        },
        status: 'SUCCESS',
      },
      {
        ruleId: demoRule1.id,
        eventType: 'page.updated',
        payload: {
          page_id: 'page-001',
          title: 'Sample Task 1',
          status: 'Done',
        },
        status: 'SUCCESS',
      },
      {
        ruleId: demoRule2.id,
        eventType: 'page.created',
        payload: {
          page_id: 'page-002',
          title: 'Sample Project',
        },
        status: 'FAILED',
        error: {
          message: 'Network timeout',
          code: 'TIMEOUT',
        },
      },
    ],
  });
  console.log('✓ Created demo SyncLogs');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\nDemo data created:');
  console.log(`  - ${3} SyncRules (2 active, 1 inactive)`);
  console.log(`  - ${3} SyncLogs (2 successful, 1 failed)`);
  console.log('\nYou can now:');
  console.log('  1. Start the server: npm run dev');
  console.log('  2. View SyncRules: GET http://localhost:3000/api/sync-rules');
  console.log('  3. View SyncLogs: GET http://localhost:3000/api/sync-logs');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
