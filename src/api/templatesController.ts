import { Request, Response } from 'express';
import { getPrismaClient } from '../config/db';
import { AppError } from '../middleware/errorHandler';

/**
 * List all sync rule templates
 */
export async function listTemplates(req: Request, res: Response) {
  const prisma = getPrismaClient();
  const { category, isOfficial } = req.query;

  const where: any = {};
  if (category) where.category = category as string;
  if (isOfficial !== undefined) where.isOfficial = isOfficial === 'true';

  const templates = await prisma.syncRuleTemplate.findMany({
    where,
    orderBy: [{ isOfficial: 'desc' }, { usageCount: 'desc' }, { name: 'asc' }],
  });

  res.json({
    success: true,
    data: templates,
  });
}

/**
 * Get a single template
 */
export async function getTemplate(req: Request, res: Response) {
  const prisma = getPrismaClient();
  const { id } = req.params;

  const template = await prisma.syncRuleTemplate.findUnique({
    where: { id },
    include: {
      _count: {
        select: { syncRules: true },
      },
    },
  });

  if (!template) {
    throw new AppError(404, `Template with id ${id} not found`);
  }

  res.json({
    success: true,
    data: template,
  });
}

/**
 * Create a new template
 */
export async function createTemplate(req: Request, res: Response) {
  const prisma = getPrismaClient();
  const input = req.body;

  const template = await prisma.syncRuleTemplate.create({
    data: {
      name: input.name,
      description: input.description,
      category: input.category,
      targetType: input.targetType,
      configSchema: input.configSchema,
      defaultConfig: input.defaultConfig,
      version: input.version || '1.0.0',
      author: input.author,
      tags: input.tags || [],
      isOfficial: input.isOfficial || false,
    },
  });

  res.status(201).json({
    success: true,
    data: template,
  });
}

/**
 * Create a SyncRule from a template
 */
export async function instantiateTemplate(req: Request, res: Response) {
  const prisma = getPrismaClient();
  const { id } = req.params;
  const { name, notionDatabaseId, configOverrides } = req.body;

  // Get template
  const template = await prisma.syncRuleTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    throw new AppError(404, `Template with id ${id} not found`);
  }

  // Merge default config with overrides
  const targetConfig = {
    ...(template.defaultConfig as object),
    ...(configOverrides || {}),
  };

  // Create SyncRule from template
  const syncRule = await prisma.syncRule.create({
    data: {
      name,
      notionDatabaseId,
      targetType: template.targetType,
      targetConfig,
      templateId: template.id,
      description: `Created from template: ${template.name}`,
    },
  });

  // Increment usage count
  await prisma.syncRuleTemplate.update({
    where: { id: template.id },
    data: { usageCount: { increment: 1 } },
  });

  res.status(201).json({
    success: true,
    data: syncRule,
  });
}
