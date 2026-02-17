/**
 * Agent Protocol Schemas
 * Zod validation for runtime safety when agents submit content
 */
import { z } from 'zod';
/**
 * Agent Config Schema
 */
export declare const agentConfigSchema: z.ZodObject<{
    action_type: z.ZodEnum<{
        manual: "manual";
        browse: "browse";
        api_call: "api_call";
        code: "code";
        approve: "approve";
    }>;
    assignee: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"human">, z.ZodLiteral<"any_agent">, z.ZodString]>>;
    timeout_ms: z.ZodOptional<z.ZodNumber>;
    fallback_assignee: z.ZodOptional<z.ZodLiteral<"human">>;
    enabled: z.ZodOptional<z.ZodBoolean>;
    provider: z.ZodOptional<z.ZodEnum<{
        openai: "openai";
        anthropic: "anthropic";
    }>>;
    model: z.ZodOptional<z.ZodString>;
    system_prompt: z.ZodOptional<z.ZodString>;
    input_schema: z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"object">;
        properties: z.ZodRecord<z.ZodString, z.ZodObject<{
            type: z.ZodEnum<{
                string: "string";
                number: "number";
                boolean: "boolean";
                url: "url";
            }>;
            description: z.ZodString;
            required: z.ZodOptional<z.ZodBoolean>;
            default: z.ZodOptional<z.ZodUnknown>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    output_schema: z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"object">;
        properties: z.ZodRecord<z.ZodString, z.ZodObject<{
            type: z.ZodEnum<{
                string: "string";
                number: "number";
                boolean: "boolean";
                json: "json";
            }>;
            description: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    verification: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<{
            none: "none";
            human_review: "human_review";
            artifact: "artifact";
            assertion: "assertion";
        }>;
        artifact_type: z.ZodOptional<z.ZodEnum<{
            file: "file";
            screenshot: "screenshot";
            log: "log";
        }>>;
        assertion: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * Item Progress Schema
 */
export declare const itemProgressSchema: z.ZodObject<{
    completed: z.ZodBoolean;
    timestamp: z.ZodOptional<z.ZodString>;
    user_id: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
    completed_by: z.ZodOptional<z.ZodString>;
    completed_by_type: z.ZodOptional<z.ZodEnum<{
        human: "human";
        agent: "agent";
    }>>;
    completed_by_name: z.ZodOptional<z.ZodString>;
    agent_output: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    duration_ms: z.ZodOptional<z.ZodNumber>;
    attempt_count: z.ZodOptional<z.ZodNumber>;
    verification_status: z.ZodOptional<z.ZodEnum<{
        pending: "pending";
        verified: "verified";
        rejected: "rejected";
    }>>;
    verified_by: z.ZodOptional<z.ZodString>;
    artifacts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            file: "file";
            url: "url";
            screenshot: "screenshot";
            log: "log";
        }>;
        url: z.ZodString;
        description: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
/**
 * Checklist Item Schema
 */
export declare const checklistItemSchema: z.ZodObject<{
    id: z.ZodString;
    text: z.ZodString;
    parent: z.ZodNullable<z.ZodString>;
    order: z.ZodNumber;
    type: z.ZodOptional<z.ZodEnum<{
        note: "note";
        task: "task";
        header: "header";
    }>>;
    details: z.ZodOptional<z.ZodString>;
    agent_config: z.ZodOptional<z.ZodObject<{
        action_type: z.ZodEnum<{
            manual: "manual";
            browse: "browse";
            api_call: "api_call";
            code: "code";
            approve: "approve";
        }>;
        assignee: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"human">, z.ZodLiteral<"any_agent">, z.ZodString]>>;
        timeout_ms: z.ZodOptional<z.ZodNumber>;
        fallback_assignee: z.ZodOptional<z.ZodLiteral<"human">>;
        enabled: z.ZodOptional<z.ZodBoolean>;
        provider: z.ZodOptional<z.ZodEnum<{
            openai: "openai";
            anthropic: "anthropic";
        }>>;
        model: z.ZodOptional<z.ZodString>;
        system_prompt: z.ZodOptional<z.ZodString>;
        input_schema: z.ZodOptional<z.ZodObject<{
            type: z.ZodLiteral<"object">;
            properties: z.ZodRecord<z.ZodString, z.ZodObject<{
                type: z.ZodEnum<{
                    string: "string";
                    number: "number";
                    boolean: "boolean";
                    url: "url";
                }>;
                description: z.ZodString;
                required: z.ZodOptional<z.ZodBoolean>;
                default: z.ZodOptional<z.ZodUnknown>;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
        output_schema: z.ZodOptional<z.ZodObject<{
            type: z.ZodLiteral<"object">;
            properties: z.ZodRecord<z.ZodString, z.ZodObject<{
                type: z.ZodEnum<{
                    string: "string";
                    number: "number";
                    boolean: "boolean";
                    json: "json";
                }>;
                description: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
        verification: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<{
                none: "none";
                human_review: "human_review";
                artifact: "artifact";
                assertion: "assertion";
            }>;
            artifact_type: z.ZodOptional<z.ZodEnum<{
                file: "file";
                screenshot: "screenshot";
                log: "log";
            }>>;
            assertion: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * Checklist Content Schema
 */
export declare const checklistContentSchema: z.ZodObject<{
    version: z.ZodString;
    items: z.ZodRecord<z.ZodString, z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        parent: z.ZodNullable<z.ZodString>;
        order: z.ZodNumber;
        type: z.ZodOptional<z.ZodEnum<{
            note: "note";
            task: "task";
            header: "header";
        }>>;
        details: z.ZodOptional<z.ZodString>;
        agent_config: z.ZodOptional<z.ZodObject<{
            action_type: z.ZodEnum<{
                manual: "manual";
                browse: "browse";
                api_call: "api_call";
                code: "code";
                approve: "approve";
            }>;
            assignee: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"human">, z.ZodLiteral<"any_agent">, z.ZodString]>>;
            timeout_ms: z.ZodOptional<z.ZodNumber>;
            fallback_assignee: z.ZodOptional<z.ZodLiteral<"human">>;
            enabled: z.ZodOptional<z.ZodBoolean>;
            provider: z.ZodOptional<z.ZodEnum<{
                openai: "openai";
                anthropic: "anthropic";
            }>>;
            model: z.ZodOptional<z.ZodString>;
            system_prompt: z.ZodOptional<z.ZodString>;
            input_schema: z.ZodOptional<z.ZodObject<{
                type: z.ZodLiteral<"object">;
                properties: z.ZodRecord<z.ZodString, z.ZodObject<{
                    type: z.ZodEnum<{
                        string: "string";
                        number: "number";
                        boolean: "boolean";
                        url: "url";
                    }>;
                    description: z.ZodString;
                    required: z.ZodOptional<z.ZodBoolean>;
                    default: z.ZodOptional<z.ZodUnknown>;
                }, z.core.$strip>>;
            }, z.core.$strip>>;
            output_schema: z.ZodOptional<z.ZodObject<{
                type: z.ZodLiteral<"object">;
                properties: z.ZodRecord<z.ZodString, z.ZodObject<{
                    type: z.ZodEnum<{
                        string: "string";
                        number: "number";
                        boolean: "boolean";
                        json: "json";
                    }>;
                    description: z.ZodString;
                }, z.core.$strip>>;
            }, z.core.$strip>>;
            verification: z.ZodOptional<z.ZodObject<{
                type: z.ZodEnum<{
                    none: "none";
                    human_review: "human_review";
                    artifact: "artifact";
                    assertion: "assertion";
                }>;
                artifact_type: z.ZodOptional<z.ZodEnum<{
                    file: "file";
                    screenshot: "screenshot";
                    log: "log";
                }>>;
                assertion: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * Validate checklist content with full type safety
 */
export declare function validateChecklistContent(json: unknown): {
    success: boolean;
    data?: z.infer<typeof checklistContentSchema>;
    errors?: z.ZodIssue[];
};
/**
 * Validate agent config only
 */
export declare function validateAgentConfig(config: unknown): {
    success: boolean;
    data?: z.infer<typeof agentConfigSchema>;
    errors?: z.ZodIssue[];
};
/**
 * Helper: Format validation errors for display
 */
export declare function formatValidationErrors(errors: z.ZodIssue[]): string;
export type AgentConfig = z.infer<typeof agentConfigSchema>;
export type ChecklistItem = z.infer<typeof checklistItemSchema>;
export type ChecklistContent = z.infer<typeof checklistContentSchema>;
export type ItemProgress = z.infer<typeof itemProgressSchema>;
//# sourceMappingURL=schemas.d.ts.map