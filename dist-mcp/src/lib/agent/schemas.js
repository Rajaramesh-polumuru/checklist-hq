/**
 * Agent Protocol Schemas
 * Zod validation for runtime safety when agents submit content
 */
import { z } from 'zod';
/**
 * Input Property Schema (no 'json' type)
 */
const inputPropertySchema = z.object({
    type: z.enum(['string', 'number', 'boolean', 'url']),
    description: z.string(),
    required: z.boolean().optional(),
    default: z.unknown().optional(),
});
/**
 * Output Property Schema (includes 'json' type)
 */
const outputPropertySchema = z.object({
    type: z.enum(['string', 'number', 'boolean', 'json']),
    description: z.string(),
});
/**
 * Input Schema (what data the step needs)
 */
const inputSchemaObj = z.object({
    type: z.literal('object'),
    properties: z.record(z.string(), inputPropertySchema),
});
/**
 * Output Schema (what data the step produces)
 */
const outputSchemaObj = z.object({
    type: z.literal('object'),
    properties: z.record(z.string(), outputPropertySchema),
});
/**
 * Verification Schema
 */
const verificationSchema = z.object({
    type: z.enum(['none', 'human_review', 'artifact', 'assertion']),
    artifact_type: z.enum(['screenshot', 'log', 'file']).optional(),
    assertion: z.string().optional(), // e.g., "output.status_code === 200"
});
/**
 * Agent Config Schema
 */
export const agentConfigSchema = z.object({
    // Execution
    action_type: z.enum(['manual', 'browse', 'api_call', 'code', 'approve']),
    assignee: z.union([
        z.literal('human'),
        z.literal('any_agent'),
        z.string().uuid(),
    ]).optional(),
    timeout_ms: z.number().int().positive().optional(),
    fallback_assignee: z.literal('human').optional(),
    // Auto-Pilot (backward compat)
    enabled: z.boolean().optional(),
    provider: z.enum(['openai', 'anthropic']).optional(),
    model: z.string().optional(),
    system_prompt: z.string().optional(),
    // Input/Output
    input_schema: inputSchemaObj.optional(),
    output_schema: outputSchemaObj.optional(),
    // Verification
    verification: verificationSchema.optional(),
});
/**
 * Artifact Schema
 */
const artifactSchema = z.object({
    type: z.enum(['screenshot', 'log', 'file', 'url']),
    url: z.string().url(),
    description: z.string(),
});
/**
 * Item Progress Schema
 */
export const itemProgressSchema = z.object({
    completed: z.boolean(),
    timestamp: z.string().optional(),
    user_id: z.string().optional(),
    note: z.string().optional(),
    // Agent tracking
    completed_by: z.string().optional(),
    completed_by_type: z.enum(['human', 'agent']).optional(),
    completed_by_name: z.string().optional(),
    agent_output: z.record(z.string(), z.unknown()).optional(),
    // Traceability
    duration_ms: z.number().optional(),
    attempt_count: z.number().optional(),
    verification_status: z.enum(['pending', 'verified', 'rejected']).optional(),
    verified_by: z.string().optional(),
    artifacts: z.array(artifactSchema).optional(),
});
/**
 * Checklist Item Schema
 */
export const checklistItemSchema = z.object({
    id: z.string().uuid(),
    text: z.string(),
    parent: z.string().uuid().nullable(),
    order: z.number().int().min(0),
    type: z.enum(['task', 'header', 'note']).optional(),
    details: z.string().optional(),
    agent_config: agentConfigSchema.optional(),
});
/**
 * Checklist Content Schema
 */
export const checklistContentSchema = z.object({
    version: z.string().regex(/^\d+\.\d+(\.\d+)?$/), // e.g., "1.0" or "1.0.0"
    items: z.record(z.string().uuid(), checklistItemSchema),
});
/**
 * Validate checklist content with full type safety
 */
export function validateChecklistContent(json) {
    const result = checklistContentSchema.safeParse(json);
    if (result.success) {
        return {
            success: true,
            data: result.data,
        };
    }
    else {
        return {
            success: false,
            errors: result.error.issues,
        };
    }
}
/**
 * Validate agent config only
 */
export function validateAgentConfig(config) {
    const result = agentConfigSchema.safeParse(config);
    if (result.success) {
        return {
            success: true,
            data: result.data,
        };
    }
    else {
        return {
            success: false,
            errors: result.error.issues,
        };
    }
}
/**
 * Helper: Format validation errors for display
 */
export function formatValidationErrors(errors) {
    return errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');
}
//# sourceMappingURL=schemas.js.map