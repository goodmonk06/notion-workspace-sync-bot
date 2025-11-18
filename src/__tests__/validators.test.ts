import { describe, it, expect } from 'vitest';
import {
  createSyncRuleSchema,
  updateSyncRuleSchema,
} from '../validators/syncRule';

describe('SyncRule Validators', () => {
  describe('createSyncRuleSchema', () => {
    it('should validate a valid SyncRule creation input', () => {
      const validInput = {
        name: 'Test Rule',
        notionDatabaseId: 'abc123',
        direction: 'ONE_WAY' as const,
        targetType: 'WEBHOOK' as const,
        targetConfig: {
          url: 'https://example.com/webhook',
          headers: {
            Authorization: 'Bearer token',
          },
        },
        isActive: true,
      };

      const result = createSyncRuleSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject input with missing required fields', () => {
      const invalidInput = {
        name: 'Test Rule',
        // notionDatabaseId is missing
      };

      const result = createSyncRuleSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject input with empty name', () => {
      const invalidInput = {
        name: '',
        notionDatabaseId: 'abc123',
        targetConfig: { url: 'https://example.com' },
      };

      const result = createSyncRuleSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should apply default values for optional fields', () => {
      const input = {
        name: 'Test Rule',
        notionDatabaseId: 'abc123',
        targetConfig: { url: 'https://example.com' },
      };

      const result = createSyncRuleSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.direction).toBe('ONE_WAY');
        expect(result.data.targetType).toBe('WEBHOOK');
        expect(result.data.isActive).toBe(true);
      }
    });
  });

  describe('updateSyncRuleSchema', () => {
    it('should validate partial updates', () => {
      const validInput = {
        name: 'Updated Name',
      };

      const result = updateSyncRuleSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should allow updating multiple fields', () => {
      const validInput = {
        name: 'Updated Name',
        isActive: false,
      };

      const result = updateSyncRuleSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should allow empty object (no updates)', () => {
      const result = updateSyncRuleSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
