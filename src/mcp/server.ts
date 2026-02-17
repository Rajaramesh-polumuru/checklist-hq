/**
 * MCP Server Implementation for Checklist HQ
 * Exposes checklists as a Model Context Protocol server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { handleResourceRequest, listResources } from './resources';
import { handleToolRequest, listTools } from './tools';

/**
 * Create and configure the MCP server
 */
export function createMCPServer(userId: string) {
  const server = new Server(
    {
      name: 'checklist-hq',
      version: '1.0.0',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: listResources(userId),
    };
  });

  // Read a specific resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const result = await handleResourceRequest({ uri, userId });

    return {
      contents: [
        {
          uri,
          mimeType: result.mimeType,
          text: result.content,
        },
      ],
    };
  });

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: listTools(),
    };
  });

  // Call a tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const result = await handleToolRequest(name, args || {}, userId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  });

  return server;
}

/**
 * Run the MCP server with stdio transport
 * This is the main entry point for the MCP server process
 */
export async function runMCPServer(userId: string) {
  const server = createMCPServer(userId);
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error('Checklist HQ MCP server running on stdio');
}
