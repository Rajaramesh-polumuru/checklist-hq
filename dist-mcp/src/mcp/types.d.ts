/**
 * MCP Server Type Definitions
 */
import type { User } from '@supabase/supabase-js';
/**
 * Authentication context for MCP requests
 */
export interface AuthContext {
    user: User;
    apiKey: string;
    userId: string;
}
/**
 * API Key record (from Supabase)
 */
export interface ApiKey {
    id: string;
    user_id: string;
    key_hash: string;
    name: string;
    last_used: string | null;
    created_at: string;
}
/**
 * Resource URI patterns
 */
export type ResourceUri = 'checklist://repos' | `checklist://repo/${string}/latest` | `checklist://repo/${string}/history` | `checklist://run/${string}/status`;
/**
 * Tool argument types
 */
export interface ListRepositoriesArgs {
    query?: string;
    limit?: number;
    tag?: string;
}
export interface GetChecklistArgs {
    repo_id: string;
}
export interface StartRunArgs {
    repo_id: string;
    name?: string;
}
export interface UpdateItemArgs {
    run_id: string;
    item_id: string;
    completed: boolean;
    note?: string;
    output?: Record<string, unknown>;
}
export interface GetRunStatusArgs {
    run_id: string;
}
export interface CreateRepositoryArgs {
    title: string;
    description?: string;
    items?: Record<string, unknown>;
}
export interface CommitChangesArgs {
    repo_id: string;
    parent_commit_id: string;
    content: string;
    message: string;
}
/**
 * Prompt argument types
 */
export interface ExecuteChecklistPromptArgs {
    repo_id: string;
    run_id?: string;
}
export interface ReviewChecklistPromptArgs {
    repo_id: string;
}
export interface ConvertToChecklistPromptArgs {
    raw_text: string;
}
//# sourceMappingURL=types.d.ts.map