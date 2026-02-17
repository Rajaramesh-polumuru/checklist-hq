/**
 * MCP Resource Handlers
 * Expose Checklist HQ data as readable resources
 */

import { supabase } from '@/lib/supabase';
import { generateAgentContext } from '@/lib/agent/prompt-transformer';
import type { Repository, Commit } from '@/types/database';
import type { MCPResourceRequest } from './types';

/**
 * Read a checklist resource
 * URI format: checklist://{repo_id}/latest
 */
export async function readChecklistResource(
  request: MCPResourceRequest
): Promise<{ content: string; mimeType: string }> {
  const uriParts = request.uri.replace('checklist://', '').split('/');
  const repoId = uriParts[0];
  // const version = uriParts[1]; // 'latest' or commit_id - for future use

  // Fetch repository
  const { data: repo, error: repoError } = await supabase
    .from('repositories')
    .select('*')
    .eq('id', repoId)
    .single();

  if (repoError || !repo) {
    throw new Error(`Repository not found: ${repoId}`);
  }

  // Verify ownership/access
  if (repo.owner_id !== request.userId) {
    throw new Error('Access denied: Repository not owned by user');
  }

  // Fetch latest commit
  const { data: commit, error: commitError } = await supabase
    .from('commits')
    .select('*')
    .eq('repo_id', repoId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (commitError || !commit) {
    throw new Error(`No commits found for repository: ${repoId}`);
  }

  // Generate agent-friendly context
  const content = generateAgentContext(repo as Repository, commit as Commit);

  return {
    content,
    mimeType: 'text/markdown',
  };
}

/**
 * Read run status resource
 * URI format: checklist://runs/{run_id}/status
 */
export async function readRunStatusResource(
  request: MCPResourceRequest
): Promise<{ content: string; mimeType: string }> {
  const uriParts = request.uri.replace('checklist://runs/', '').split('/');
  const runId = uriParts[0];

  // Fetch run
  const { data: run, error: runError } = await supabase
    .from('runs')
    .select('*, repositories(owner_id)')
    .eq('id', runId)
    .single();

  if (runError || !run) {
    throw new Error(`Run not found: ${runId}`);
  }

  // Verify ownership/access
  const repository = run.repositories as unknown as { owner_id: string };
  if (repository.owner_id !== request.userId) {
    throw new Error('Access denied: Run not owned by user');
  }

  // Return progress as JSON
  return {
    content: JSON.stringify(run.progress, null, 2),
    mimeType: 'application/json',
  };
}

/**
 * Main resource handler router
 */
export async function handleResourceRequest(
  request: MCPResourceRequest
): Promise<{ content: string; mimeType: string }> {
  if (request.uri.startsWith('checklist://runs/')) {
    return readRunStatusResource(request);
  } else if (request.uri.startsWith('checklist://')) {
    return readChecklistResource(request);
  } else {
    throw new Error(`Unsupported resource URI: ${request.uri}`);
  }
}

/**
 * List available resources for discovery
 */
export function listResources(_userId: string): Array<{
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}> {
  return [
    {
      uri: 'checklist://{repo_id}/latest',
      name: 'Checklist (Latest Version)',
      description: 'Read the latest version of a checklist in agent-friendly format',
      mimeType: 'text/markdown',
    },
    {
      uri: 'checklist://runs/{run_id}/status',
      name: 'Run Status',
      description: 'Get the current progress of a checklist execution',
      mimeType: 'application/json',
    },
  ];
}
