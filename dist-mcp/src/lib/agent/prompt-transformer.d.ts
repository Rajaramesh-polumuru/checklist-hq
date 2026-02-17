import type { Repository, Commit, Run } from '@/types/database';
export interface AgentContextOptions {
    format?: 'markdown' | 'json' | 'xml';
    includeMetadata?: boolean;
    maxTokens?: number;
    onlyIncomplete?: boolean;
}
/**
 * Generates a dense, token-efficient format optimized for LLMs.
 * Supports multiple output formats for different LLM preferences.
 */
export declare function generateAgentContext(repo: Repository, commit: Commit, run?: Run, options?: AgentContextOptions): string;
/**
 * Generates an execution-focused prompt with instructions for the agent.
 */
export declare function generateExecutionPrompt(repo: Repository, commit: Commit, run?: Run, options?: AgentContextOptions): string;
//# sourceMappingURL=prompt-transformer.d.ts.map