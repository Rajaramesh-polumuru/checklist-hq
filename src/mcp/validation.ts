/**
 * Validation Schemas for Agent-Authored Content
 * Uses Zod to ensure checklist structure integrity
 */

import { z } from 'zod';

/**
 * ChecklistItem schema
 * Matches the database structure from types/database.ts
 */
export const ChecklistItemSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  parent: z.string().uuid().nullable(),
  order: z.number().int().min(0),
  type: z.enum(['task', 'header', 'note']).optional(),
  details: z.string().optional(),
  agent_config: z
    .object({
      action_type: z.enum(['manual', 'browse', 'api', 'approve']),
      assignee: z.string().optional(),
      parameters: z.record(z.string(), z.unknown()).optional(),
      expected_output: z.record(z.string(), z.unknown()).optional(),
      timeout_ms: z.number().int().positive().optional(),
      fallback_assignee: z.string().optional(),
    })
    .optional(),
});

/**
 * ChecklistContent schema
 * The root structure stored in commits
 */
export const ChecklistContentSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/), // Semantic versioning
  items: z.record(z.string().uuid(), ChecklistItemSchema),
});

/**
 * Validate checklist content JSON
 * @throws {z.ZodError} If validation fails
 */
export function validateChecklistContent(content: unknown): {
  version: string;
  items: Record<string, z.infer<typeof ChecklistItemSchema>>;
} {
  return ChecklistContentSchema.parse(content);
}

/**
 * Create minimal valid checklist content
 * Useful for creating empty repositories
 */
export function createEmptyChecklistContent(): {
  version: string;
  items: Record<string, never>;
} {
  return {
    version: '1.0.0',
    items: {},
  };
}

/**
 * Validate that all parent references exist
 * Ensures no orphaned items
 */
export function validateItemReferences(
  items: Record<string, z.infer<typeof ChecklistItemSchema>>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const itemIds = new Set(Object.keys(items));

  for (const [id, item] of Object.entries(items)) {
    // Check parent exists
    if (item.parent && !itemIds.has(item.parent)) {
      errors.push(`Item ${id} has invalid parent: ${item.parent}`);
    }

    // Check for circular references (simple check)
    if (item.parent === id) {
      errors.push(`Item ${id} cannot be its own parent`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate checklist content with full validation
 * Includes schema validation + reference checks
 */
export function validateChecklistContentFull(content: unknown): {
  valid: boolean;
  errors: string[];
  data?: {
    version: string;
    items: Record<string, z.infer<typeof ChecklistItemSchema>>;
  };
} {
  try {
    const validated = validateChecklistContent(content);
    const refCheck = validateItemReferences(validated.items);

    if (!refCheck.valid) {
      return {
        valid: false,
        errors: refCheck.errors,
      };
    }

    return {
      valid: true,
      errors: [],
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      };
    }
    return {
      valid: false,
      errors: ['Unknown validation error'],
    };
  }
}
