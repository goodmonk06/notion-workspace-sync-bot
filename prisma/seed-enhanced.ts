import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting enhanced Phase 3 seed...');

  // Clean up existing data (development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Cleaning up existing data...');
    await prisma.notification.deleteMany();
    await prisma.notificationChannel.deleteMany();
    await prisma.transformationRule.deleteMany();
    await prisma.syncFilter.deleteMany();
    await prisma.syncRuleExecution.deleteMany();
    await prisma.syncLog.deleteMany();
    await prisma.syncRule.deleteMany();
    await prisma.syncRuleTemplate.deleteMany();
  }

  // ====================================================================
  // 1. SYNC RULE TEMPLATES
  // ====================================================================
  console.log('\n📋 Creating SyncRule Templates...');

  const slackTemplate = await prisma.syncRuleTemplate.create({
    data: {
      name: 'Slack Notifications',
      description: 'Send Notion database changes to Slack channel',
      category: 'Communication',
      targetType: 'WEBHOOK',
      configSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri' },
          channel: { type: 'string' },
        },
        required: ['url'],
      },
      defaultConfig: {
        url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      version: '1.0.0',
      author: 'Notion Sync Bot Team',
      tags: ['slack', 'notifications', 'communication'],
      isOfficial: true,
    },
  });
  console.log(`✓ Created template: ${slackTemplate.name}`);

  const airtableTemplate = await prisma.syncRuleTemplate.create({
    data: {
      name: 'Airtable Sync',
      description: 'Synchronize Notion database with Airtable base',
      category: 'Database',
      targetType: 'API',
      configSchema: {
        type: 'object',
        properties: {
          apiKey: { type: 'string' },
          baseId: { type: 'string' },
          tableName: { type: 'string' },
        },
        required: ['apiKey', 'baseId', 'tableName'],
      },
      defaultConfig: {
        apiKey: 'YOUR_AIRTABLE_API_KEY',
        baseId: 'YOUR_BASE_ID',
        tableName: 'YOUR_TABLE_NAME',
      },
      version: '1.0.0',
      author: 'Notion Sync Bot Team',
      tags: ['airtable', 'database', 'sync'],
      isOfficial: true,
    },
  });
  console.log(`✓ Created template: ${airtableTemplate.name}`);

  const dataWarehouseTemplate = await prisma.syncRuleTemplate.create({
    data: {
      name: 'Data Warehouse Export',
      description: 'Export Notion data to PostgreSQL/MySQL data warehouse',
      category: 'Analytics',
      targetType: 'DATABASE',
      configSchema: {
        type: 'object',
        properties: {
          connectionString: { type: 'string' },
          tableName: { type: 'string' },
          schemaMapping: { type: 'object' },
        },
        required: ['connectionString', 'tableName'],
      },
      defaultConfig: {
        connectionString: 'postgresql://user:password@localhost:5432/warehouse',
        tableName: 'notion_pages',
        schemaMapping: {},
      },
      version: '1.0.0',
      author: 'Notion Sync Bot Team',
      tags: ['analytics', 'database', 'warehouse'],
      isOfficial: true,
    },
  });
  console.log(`✓ Created template: ${dataWarehouseTemplate.name}`);

  // ====================================================================
  // 2. SYNC FILTERS
  // ====================================================================
  console.log('\n🔍 Creating Sync Filters...');

  const publishedFilter = await prisma.syncFilter.create({
    data: {
      name: 'Only Published Pages',
      description: 'Sync only pages with Status = Published',
      filterType: 'PROPERTY',
      filterConfig: {
        property: 'Status',
        operator: 'equals',
        value: 'Published',
      },
      conditions: [
        {
          property: 'Status',
          operator: 'equals',
          value: 'Published',
        },
      ],
      logicOperator: 'AND',
      isActive: true,
    },
  });
  console.log(`✓ Created filter: ${publishedFilter.name}`);

  const highPriorityFilter = await prisma.syncFilter.create({
    data: {
      name: 'High Priority Tasks',
      description: 'Sync only high priority tasks',
      filterType: 'COMPOSITE',
      filterConfig: {
        conditions: [
          { property: 'Priority', operator: 'equals', value: 'High' },
          { property: 'Status', operator: 'not_equals', value: 'Done' },
        ],
        logic: 'AND',
      },
      conditions: [
        { property: 'Priority', operator: 'equals', value: 'High' },
        { property: 'Status', operator: 'not_equals', value: 'Done' },
      ],
      logicOperator: 'AND',
      isActive: true,
    },
  });
  console.log(`✓ Created filter: ${highPriorityFilter.name}`);

  // ====================================================================
  // 3. TRANSFORMATION RULES
  // ====================================================================
  console.log('\n🔄 Creating Transformation Rules...');

  const basicTransform = await prisma.transformationRule.create({
    data: {
      name: 'Notion to Slack Format',
      description: 'Transform Notion page to Slack message format',
      transformType: 'TEMPLATE',
      transformConfig: {
        template: '{title}: {status} - {url}',
      },
      fieldMappings: [
        { source: 'properties.Name.title[0].plain_text', target: 'title' },
        { source: 'properties.Status.select.name', target: 'status' },
        { source: 'url', target: 'url' },
      ],
      isActive: true,
    },
  });
  console.log(`✓ Created transformation: ${basicTransform.name}`);

  // ====================================================================
  // 4. NOTIFICATION CHANNELS
  // ====================================================================
  console.log('\n📢 Creating Notification Channels...');

  const slackNotifChannel = await prisma.notificationChannel.create({
    data: {
      name: 'Slack Alerts',
      description: 'Send alerts to Slack #alerts channel',
      channelType: 'SLACK',
      channelConfig: {
        webhookUrl: 'https://hooks.slack.com/services/YOUR/ALERT/WEBHOOK',
        channel: '#alerts',
        username: 'Sync Bot Alerts',
      },
      isActive: true,
      throttleMinutes: 30,
      alertOn: {
        failureCount: 3,
        errorRate: 0.5,
      },
    },
  });
  console.log(`✓ Created notification channel: ${slackNotifChannel.name}`);

  const emailNotifChannel = await prisma.notificationChannel.create({
    data: {
      name: 'Email Alerts',
      description: 'Send critical alerts via email',
      channelType: 'EMAIL',
      channelConfig: {
        to: 'admin@example.com',
        from: 'sync-bot@example.com',
        smtpHost: 'smtp.example.com',
      },
      isActive: true,
      throttleMinutes: 60,
      alertOn: {
        failureCount: 5,
        criticalError: true,
      },
    },
  });
  console.log(`✓ Created notification channel: ${emailNotifChannel.name}`);

  // ====================================================================
  // 5. SYNC RULES (Enhanced)
  // ====================================================================
  console.log('\n⚙️  Creating Enhanced Sync Rules...');

  const rule1 = await prisma.syncRule.create({
    data: {
      name: 'Production Tasks to Slack',
      description: 'Notify Slack when production tasks are updated',
      notionDatabaseId: 'demo-prod-tasks-db',
      direction: 'ONE_WAY',
      targetType: 'WEBHOOK',
      targetConfig: {
        url: 'https://webhook.site/unique-url-1',
        headers: { 'X-Environment': 'production' },
      },
      isActive: true,
      tags: ['production', 'tasks', 'slack'],
      priority: 9,
      rateLimitPerMin: 60,
      templateId: slackTemplate.id,
      filterId: highPriorityFilter.id,
    },
  });
  console.log(`✓ Created rule: ${rule1.name}`);

  const rule2 = await prisma.syncRule.create({
    data: {
      name: 'Published Content to Analytics',
      description: 'Export published content to data warehouse',
      notionDatabaseId: 'demo-content-db',
      direction: 'ONE_WAY',
      targetType: 'DATABASE',
      targetConfig: {
        connectionString: 'postgresql://user:password@localhost:5432/analytics',
        tableName: 'notion_content',
      },
      isActive: true,
      tags: ['analytics', 'content', 'published'],
      priority: 7,
      templateId: dataWarehouseTemplate.id,
      filterId: publishedFilter.id,
    },
  });
  console.log(`✓ Created rule: ${rule2.name}`);

  const rule3 = await prisma.syncRule.create({
    data: {
      name: 'CRM Contacts Sync',
      description: 'Bidirectional sync with CRM system',
      notionDatabaseId: 'demo-crm-db',
      direction: 'TWO_WAY',
      targetType: 'API',
      targetConfig: {
        apiUrl: 'https://api.crm-system.com',
        apiKey: 'demo-api-key',
      },
      isActive: false, // Two-way sync not fully implemented yet
      tags: ['crm', 'contacts', 'bidirectional'],
      priority: 5,
      metadata: {
        syncInterval: '15min',
        conflictResolution: 'last-write-wins',
      },
    },
  });
  console.log(`✓ Created rule: ${rule3.name}`);

  // ====================================================================
  // 6. SYNC EXECUTIONS
  // ====================================================================
  console.log('\n🚀 Creating Sync Executions...');

  const execution1 = await prisma.syncRuleExecution.create({
    data: {
      ruleId: rule1.id,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      completedAt: new Date(Date.now() - 3540000),
      durationMs: 60000,
      pagesProcessed: 45,
      pagesSucceeded: 45,
      pagesFailed: 0,
      bytesTransferred: 125000,
      startCursor: 'cursor-start-1',
      endCursor: 'cursor-end-1',
      triggeredBy: 'SCHEDULED',
    },
  });
  console.log(`✓ Created execution (COMPLETED): ${execution1.id}`);

  const execution2 = await prisma.syncRuleExecution.create({
    data: {
      ruleId: rule1.id,
      status: 'FAILED',
      startedAt: new Date(Date.now() - 1800000), // 30 min ago
      completedAt: new Date(Date.now() - 1740000),
      durationMs: 60000,
      pagesProcessed: 12,
      pagesSucceeded: 10,
      pagesFailed: 2,
      errorMessage: 'Webhook timeout after 3 retries',
      triggeredBy: 'MANUAL',
      triggeredByUser: 'admin@example.com',
    },
  });
  console.log(`✓ Created execution (FAILED): ${execution2.id}`);

  const execution3 = await prisma.syncRuleExecution.create({
    data: {
      ruleId: rule2.id,
      status: 'RUNNING',
      startedAt: new Date(),
      pagesProcessed: 5,
      pagesSucceeded: 5,
      pagesFailed: 0,
      triggeredBy: 'API',
    },
  });
  console.log(`✓ Created execution (RUNNING): ${execution3.id}`);

  // ====================================================================
  // 7. SYNC LOGS
  // ====================================================================
  console.log('\n📝 Creating Sync Logs...');

  await prisma.syncLog.createMany({
    data: [
      {
        ruleId: rule1.id,
        executionId: execution1.id,
        eventType: 'page.updated',
        payload: { page_id: 'page-001', title: 'Deploy v2.0' },
        status: 'SUCCESS',
      },
      {
        ruleId: rule1.id,
        executionId: execution2.id,
        eventType: 'page.updated',
        payload: { page_id: 'page-002', title: 'Fix bug in auth' },
        status: 'FAILED',
        error: { message: 'Webhook timeout', code: 'ETIMEDOUT' },
        retryCount: 3,
      },
      {
        ruleId: rule2.id,
        executionId: execution3.id,
        eventType: 'page.created',
        payload: { page_id: 'page-003', title: 'New blog post' },
        status: 'SUCCESS',
      },
    ],
  });
  console.log('✓ Created 3 sync logs');

  // ====================================================================
  // 8. NOTIFICATIONS
  // ====================================================================
  console.log('\n📬 Creating Notifications...');

  await prisma.notification.create({
    data: {
      channelId: slackNotifChannel.id,
      notificationType: 'SYNC_FAILED',
      severity: 'ERROR',
      title: 'Sync Failed: Production Tasks to Slack',
      message: `Sync execution ${execution2.id.substring(0, 8)} failed after processing 12 pages. 2 pages failed to sync due to webhook timeout.`,
      metadata: {
        executionId: execution2.id,
        ruleId: rule1.id,
        failedPages: 2,
      },
      status: 'SENT',
      sentAt: new Date(Date.now() - 1740000),
      deliveredAt: new Date(Date.now() - 1739000),
    },
  });
  console.log('✓ Created notification');

  // ====================================================================
  // SUMMARY
  // ====================================================================
  console.log('\n🎉 Enhanced seed completed successfully!');
  console.log('\nData created:');
  console.log(`  - ${3} SyncRule Templates`);
  console.log(`  - ${2} Sync Filters`);
  console.log(`  - ${1} Transformation Rules`);
  console.log(`  - ${2} Notification Channels`);
  console.log(`  - ${3} Sync Rules`);
  console.log(`  - ${3} Sync Executions`);
  console.log(`  - ${3} Sync Logs`);
  console.log(`  - ${1} Notifications`);

  console.log('\nYou can now:');
  console.log('  1. Start the server: npm run dev');
  console.log('  2. View templates: GET http://localhost:3000/api/templates');
  console.log('  3. View executions: GET http://localhost:3000/api/executions');
  console.log('  4. View stats: GET http://localhost:3000/api/executions/stats');
  console.log('  5. View metrics: GET http://localhost:3000/metrics/json');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
