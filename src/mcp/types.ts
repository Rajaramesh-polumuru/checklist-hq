/**
 * MCP Server Types for Checklist HQ
 * Model Context Protocol integration
 */

export interface MCPResourceRequest {
  uri: string;
  userId: string;
}

export interface MCPToolRequest {
  name: string;
  arguments: Record<string, unknown>;
  userId: string;
}

export interface ListRepositoriesArgs {
  limit?: number;
  query?: string;
}

export interface StartRunArgs {
  repo_id: string;
  run_name?: string;
}

export interface UpdateItemArgs {
  run_id: string;
  item_id: string;
  completed: boolean;
  note?: string;
  output?: Record<string, unknown>;
}

export interface CreateRepositoryArgs {
  title: string;
  description?: string;
}

export interface CommitChangesArgs {
  repo_id: string;
  parent_commit_id: string;
  content_json: string;
  message: string;
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}
