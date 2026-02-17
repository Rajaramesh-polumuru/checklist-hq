#!/usr/bin/env node
/**
 * Checklist HQ MCP Server
 *
 * Exposes Checklist HQ as a Model Context Protocol server for AI assistants.
 * Compatible with Claude Desktop, Cursor, Windsurf, and other MCP clients.
 *
 * Usage:
 *   npx tsx src/mcp/index.ts
 *
 * Environment Variables:
 *   CHQ_API_KEY - API key for authentication (required)
 *   CHQ_SUPABASE_URL - Supabase project URL (optional, falls back to env)
 *   CHQ_SUPABASE_ANON_KEY - Supabase anon key (optional)
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { initializeAuth } from './auth.js';
import { listResources, readResource } from './resources.js';
import { listTools, executeTool } from './tools.js';
import { listPrompts, getPrompt } from './server.js';
const SERVER_NAME = 'checklist-hq';
const SERVER_VERSION = '1.0.0';
/**
 * Main MCP Server Entry Point
 */
async function main() {
    console.error('[MCP] Checklist HQ MCP Server starting...');
    // Validate environment
    const apiKey = process.env.CHQ_API_KEY;
    if (!apiKey) {
        console.error('[MCP] ERROR: CHQ_API_KEY environment variable is required');
        console.error('[MCP] Generate an API key at: Checklist HQ → Settings → API Keys');
        process.exit(1);
    }
    // Initialize authentication
    let authContext = await initializeAuth(apiKey);
    if (!authContext) {
        console.error('[MCP] ERROR: Invalid API key');
        process.exit(1);
    }
    console.error(`[MCP] Authenticated as: ${authContext.user.email}`);
    console.error(`[MCP] User ID: ${authContext.user.id}`);
    // Create MCP server instance
    const server = new Server({
        name: SERVER_NAME,
        version: SERVER_VERSION,
    }, {
        capabilities: {
            resources: {},
            tools: {},
            prompts: {},
        },
    });
    /**
     * Handler: List available resources
     */
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
        console.error('[MCP] Listing resources...');
        if (!authContext)
            throw new Error('Not authenticated');
        return await listResources(authContext);
    });
    /**
     * Handler: Read a specific resource
     */
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        console.error(`[MCP] Reading resource: ${request.params.uri}`);
        if (!authContext)
            throw new Error('Not authenticated');
        return await readResource(request.params.uri, authContext);
    });
    /**
     * Handler: List available tools
     */
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        console.error('[MCP] Listing tools...');
        return await listTools();
    });
    /**
     * Handler: Execute a tool
     */
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        console.error(`[MCP] Executing tool: ${request.params.name}`);
        if (!authContext)
            throw new Error('Not authenticated');
        return await executeTool(request.params.name, request.params.arguments || {}, authContext);
    });
    /**
     * Handler: List available prompts
     */
    server.setRequestHandler(ListPromptsRequestSchema, async () => {
        console.error('[MCP] Listing prompts...');
        return await listPrompts();
    });
    /**
     * Handler: Get a specific prompt
     */
    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
        console.error(`[MCP] Getting prompt: ${request.params.name}`);
        if (!authContext)
            throw new Error('Not authenticated');
        return await getPrompt(request.params.name, request.params.arguments || {}, authContext);
    });
    // Start stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('[MCP] Server ready and listening on stdio');
    console.error('[MCP] Waiting for client connections...');
}
// Run the server
main().catch((error) => {
    console.error('[MCP] Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map