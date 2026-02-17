/**
 * MCP Prompts (Pre-Built Templates)
 *
 * Prompts provide ready-to-use instructions for common AI tasks.
 */
import type { AuthContext } from './types.js';
/**
 * List all available prompts
 */
export declare function listPrompts(): Promise<{
    prompts: {
        name: string;
        description: string;
        arguments: {
            name: string;
            description: string;
            required: boolean;
        }[];
    }[];
}>;
/**
 * Get a specific prompt with arguments filled in
 */
export declare function getPrompt(promptName: string, args: Record<string, unknown>, authContext: AuthContext): Promise<{
    description: string;
    messages: {
        role: string;
        content: {
            type: string;
            text: string;
        };
    }[];
}>;
//# sourceMappingURL=server.d.ts.map