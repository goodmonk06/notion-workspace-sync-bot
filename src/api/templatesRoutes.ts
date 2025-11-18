import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as controller from './templatesController';

const router = Router();

// GET /api/templates - List all templates
router.get('/', asyncHandler(controller.listTemplates));

// GET /api/templates/:id - Get single template
router.get('/:id', asyncHandler(controller.getTemplate));

// POST /api/templates - Create new template
router.post('/', asyncHandler(controller.createTemplate));

// POST /api/templates/:id/instantiate - Create SyncRule from template
router.post('/:id/instantiate', asyncHandler(controller.instantiateTemplate));

export default router;
