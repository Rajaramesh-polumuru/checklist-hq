/**
 * MCP Prompts - Pre-Built Templates
 * Provides ready-to-use prompts for common agent workflows
 */
export interface PromptTemplate {
    name: string;
    description: string;
    arguments: Array<{
        name: string;
        description: string;
        required: boolean;
    }>;
}
/**
 * List available prompt templates
 */
export declare function listPrompts(): PromptTemplate[];
/**
 * Generate prompt content from template
 */
export declare function getPrompt(name: string, args: Record<string, string>, userId: string): Promise<string>;
//# sourceMappingURL=prompts.d.ts.map