/**
 * MCP Tools (Actions)
 *
 * Tools allow AI clients to modify checklist data and execute operations.
 */
import type { AuthContext } from './types.js';
/**
 * List all available tools
 */
export declare function listTools(): Promise<{
    tools: ({
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                query: {
                    type: string;
                    description: string;
                };
                limit: {
                    type: string;
                    description: string;
                    default: number;
                };
                tag: {
                    type: string;
                    description: string;
                };
                repo_id?: undefined;
                name?: undefined;
                run_id?: undefined;
                item_id?: undefined;
                completed?: undefined;
                note?: undefined;
                output?: undefined;
                title?: undefined;
                description?: undefined;
                items?: undefined;
                parent_commit_id?: undefined;
                content?: undefined;
                message?: undefined;
            };
            required?: undefined;
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                repo_id: {
                    type: string;
                    description: string;
                };
                query?: undefined;
                limit?: undefined;
                tag?: undefined;
                name?: undefined;
                run_id?: undefined;
                item_id?: undefined;
                completed?: undefined;
                note?: undefined;
                output?: undefined;
                title?: undefined;
                description?: undefined;
                items?: undefined;
                parent_commit_id?: undefined;
                content?: undefined;
                message?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                repo_id: {
                    type: string;
                    description: string;
                };
                name: {
                    type: string;
                    description: string;
                };
                query?: undefined;
                limit?: undefined;
                tag?: undefined;
                run_id?: undefined;
                item_id?: undefined;
                completed?: undefined;
                note?: undefined;
                output?: undefined;
                title?: undefined;
                description?: undefined;
                items?: undefined;
                parent_commit_id?: undefined;
                content?: undefined;
                message?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                run_id: {
                    type: string;
                    description: string;
                };
                item_id: {
                    type: string;
                    description: string;
                };
                completed: {
                    type: string;
                    description: string;
                };
                note: {
                    type: string;
                    description: string;
                };
                output: {
                    type: string;
                    description: string;
                };
                query?: undefined;
                limit?: undefined;
                tag?: undefined;
                repo_id?: undefined;
                name?: undefined;
                title?: undefined;
                description?: undefined;
                items?: undefined;
                parent_commit_id?: undefined;
                content?: undefined;
                message?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                run_id: {
                    type: string;
                    description: string;
                };
                query?: undefined;
                limit?: undefined;
                tag?: undefined;
                repo_id?: undefined;
                name?: undefined;
                item_id?: undefined;
                completed?: undefined;
                note?: undefined;
                output?: undefined;
                title?: undefined;
                description?: undefined;
                items?: undefined;
                parent_commit_id?: undefined;
                content?: undefined;
                message?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                title: {
                    type: string;
                    description: string;
                };
                description: {
                    type: string;
                    description: string;
                };
                items: {
                    type: string;
                    description: string;
                };
                query?: undefined;
                limit?: undefined;
                tag?: undefined;
                repo_id?: undefined;
                name?: undefined;
                run_id?: undefined;
                item_id?: undefined;
                completed?: undefined;
                note?: undefined;
                output?: undefined;
                parent_commit_id?: undefined;
                content?: undefined;
                message?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                repo_id: {
                    type: string;
                    description: string;
                };
                parent_commit_id: {
                    type: string;
                    description: string;
                };
                content: {
                    type: string;
                    description: string;
                };
                message: {
                    type: string;
                    description: string;
                };
                query?: undefined;
                limit?: undefined;
                tag?: undefined;
                name?: undefined;
                run_id?: undefined;
                item_id?: undefined;
                completed?: undefined;
                note?: undefined;
                output?: undefined;
                title?: undefined;
                description?: undefined;
                items?: undefined;
            };
            required: string[];
        };
    })[];
}>;
/**
 * Execute a tool by name
 */
export declare function executeTool(toolName: string, args: Record<string, unknown>, authContext: AuthContext): Promise<{
    content: {
        type: string;
        text: string;
    }[];
}>;
//# sourceMappingURL=tools.d.ts.map