/**
 * MCP Server for Checklist HQ
 * 
 * Entry point for Model Context Protocol integration
 * Exposes checklists as resources and tools for AI agents
 */

export { createMCPServer, runMCPServer } from './server';
export { handleResourceRequest, listResources } from './resources';
export { handleToolRequest, listTools } from './tools';
export {
  validateChecklistContent,
  validateChecklistContentFull,
  createEmptyChecklistContent,
} from './validation';
export type * from './types';
