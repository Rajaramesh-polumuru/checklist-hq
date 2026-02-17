/**
 * MCP Tool Handlers
 * Expose Checklist HQ actions as callable tools
 */

import { supabase } from '@/lib/supabase';
import { startRunFromLatestCommit } from '@/services/run';
import { updateRunProgress } from '@/services/run';
import { validateChecklistContentFull, createEmptyChecklistContent } from './validation';
import type {
  ListRepositoriesArgs,
  StartRunArgs,
  UpdateItemArgs,
  CreateRepositoryArgs,
  CommitChangesArgs,
  MCPTool,
} from './types';

/**
 * Tool: list_repositories
 * List available checklists for the user
 */
export async function listRepositories(
  args: ListRepositoriesArgs,
  userId: string
): Promise<Array<{ id: string; title: string; description: string | null }>> {
  const limit = args.limit || 50;
  const query = args.query || '';

  let dbQuery = supabase
    .from('repositories')
    .select('id, title, description')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  // Add search filter if query provided
  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
  }

  const { data, error } = await dbQuery;

  if (error) {
    throw new Error(`Failed to list repositories: ${error.message}`);
  }

  return data || [];
}

/**
 * Tool: start_run
 * Start a new execution of a specific checklist
 */
export async function startRun(
  args: StartRunArgs,
  userId: string
): Promise<{ run_id: string; message: string }> {
  const { repo_id, run_name } = args;

  // Verify repository exists and user owns it
  const { data: repo, error: repoError } = await supabase
    .from('repositories')
    .select('id, title, owner_id')
    .eq('id', repo_id)
    .single();

  if (repoError || !repo) {
    throw new Error(`Repository not found: ${repo_id}`);
  }

  if (repo.owner_id !== userId) {
    throw new Error('Access denied: Repository not owned by user');
  }

  // Start run from latest commit
  const run = await startRunFromLatestCommit(repo_id, userId);

  // Update run name if provided
  if (run_name) {
    await supabase
      .from('runs')
      .update({ name: run_name })
      .eq('id', run.id);
  }

  return {
    run_id: run.id,
    message: `Started run for "${repo.title}"${run_name ? ` (${run_name})` : ''}`,
  };
}

/**
 * Tool: update_item
 * Mark a step as complete or update its status
 */
export async function updateItem(
  args: UpdateItemArgs,
  userId: string
): Promise<{ success: boolean; message: string }> {
  const { run_id, item_id, completed, note, output } = args;

  // Verify run exists and user owns it
  const { data: run, error: runError } = await supabase
    .from('runs')
    .select('*, repositories(owner_id)')
    .eq('id', run_id)
    .single();

  if (runError || !run) {
    throw new Error(`Run not found: ${run_id}`);
  }

  const repository = run.repositories as unknown as { owner_id: string };
  if (repository.owner_id !== userId) {
    throw new Error('Access denied: Run not owned by user');
  }

  // Update item progress
  await updateRunProgress(run_id, item_id, completed, note);

  // If output is provided, store it in the progress metadata
  if (output && completed) {
    const currentProgress = run.progress || {};
    const updatedProgress = {
      ...currentProgress,
      [item_id]: {
        ...currentProgress[item_id],
        completed,
        timestamp: new Date().toISOString(),
        user_id: userId,
        note,
        output, // Store agent output
      },
    };

    await supabase
      .from('runs')
      .update({ progress: updatedProgress })
      .eq('id', run_id);
  }

  return {
    success: true,
    message: `Item ${completed ? 'completed' : 'uncompleted'}: ${item_id}`,
  };
}

/**
 * Tool: create_repository
 * Create a new blank checklist process
 */
export async function createRepository(
  args: CreateRepositoryArgs,
  userId: string
): Promise<{ repo_id: string; message: string }> {
  const { title, description } = args;

  // Create repository
  const { data: repo, error: repoError } = await supabase
    .from('repositories')
    .insert({
      title,
      description: description || null,
      owner_id: userId,
    })
    .select()
    .single();

  if (repoError || !repo) {
    throw new Error(`Failed to create repository: ${repoError?.message}`);
  }

  // Create initial empty commit
  const emptyContent = createEmptyChecklistContent();
  
  const { error: commitError } = await supabase
    .from('commits')
    .insert({
      repo_id: repo.id,
      content: emptyContent,
      message: 'Initial commit',
      parent_commit_id: null,
    });

  if (commitError) {
    // Rollback repository creation
    await supabase.from('repositories').delete().eq('id', repo.id);
    throw new Error(`Failed to create initial commit: ${commitError.message}`);
  }

  return {
    repo_id: repo.id,
    message: `Created repository "${title}" with initial commit`,
  };
}

/**
 * Tool: commit_changes
 * Update the structure of a checklist (the core edit loop)
 */
export async function commitChanges(
  args: CommitChangesArgs,
  userId: string
): Promise<{ commit_id: string; message: string }> {
  const { repo_id, parent_commit_id, content_json, message } = args;

  // Verify repository exists and user owns it
  const { data: repo, error: repoError } = await supabase
    .from('repositories')
    .select('id, title, owner_id')
    .eq('id', repo_id)
    .single();

  if (repoError || !repo) {
    throw new Error(`Repository not found: ${repo_id}`);
  }

  if (repo.owner_id !== userId) {
    throw new Error('Access denied: Repository not owned by user');
  }

  // Parse and validate content JSON
  let parsedContent;
  try {
    parsedContent = JSON.parse(content_json);
  } catch (error) {
    throw new Error('Invalid JSON in content_json parameter');
  }

  const validation = validateChecklistContentFull(parsedContent);
  if (!validation.valid) {
    throw new Error(`Content validation failed: ${validation.errors.join(', ')}`);
  }

  // Verify parent commit is the latest (concurrency check)
  const { data: latestCommit, error: commitError } = await supabase
    .from('commits')
    .select('id')
    .eq('repo_id', repo_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (commitError) {
    throw new Error(`Failed to fetch latest commit: ${commitError.message}`);
  }

  if (latestCommit.id !== parent_commit_id) {
    throw new Error(
      `Concurrency conflict: Parent commit ${parent_commit_id} is not the latest. Current HEAD is ${latestCommit.id}.`
    );
  }

  // Insert new commit
  const { data: newCommit, error: insertError } = await supabase
    .from('commits')
    .insert({
      repo_id,
      content: validation.data,
      message,
      parent_commit_id,
    })
    .select()
    .single();

  if (insertError || !newCommit) {
    throw new Error(`Failed to create commit: ${insertError?.message}`);
  }

  return {
    commit_id: newCommit.id,
    message: `Committed changes to "${repo.title}": ${message}`,
  };
}

/**
 * List available tools for discovery
 */
export function listTools(): MCPTool[] {
  return [
    {
      name: 'list_repositories',
      description: 'List available checklists for the user',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of repositories to return (default: 50)',
          },
          query: {
            type: 'string',
            description: 'Search query to filter repositories by title or description',
          },
        },
        required: [],
      },
    },
    {
      name: 'start_run',
      description: 'Start a new execution of a specific checklist',
      inputSchema: {
        type: 'object',
        properties: {
          repo_id: {
            type: 'string',
            description: 'ID of the repository to run',
          },
          run_name: {
            type: 'string',
            description: 'Optional name for the run (e.g., "Production Deploy 2024-02-17")',
          },
        },
        required: ['repo_id'],
      },
    },
    {
      name: 'update_item',
      description: 'Mark a checklist step as complete or update its status',
      inputSchema: {
        type: 'object',
        properties: {
          run_id: {
            type: 'string',
            description: 'ID of the run',
          },
          item_id: {
            type: 'string',
            description: 'ID of the checklist item',
          },
          completed: {
            type: 'boolean',
            description: 'Whether the item is completed',
          },
          note: {
            type: 'string',
            description: 'Optional note about the completion',
          },
          output: {
            type: 'object',
            description: 'Optional structured output from agent execution',
          },
        },
        required: ['run_id', 'item_id', 'completed'],
      },
    },
    {
      name: 'create_repository',
      description: 'Create a new blank checklist process',
      inputSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Title of the checklist (e.g., "Production Deployment")',
          },
          description: {
            type: 'string',
            description: 'Optional description of what this checklist is for',
          },
        },
        required: ['title'],
      },
    },
    {
      name: 'commit_changes',
      description: 'Update the structure of a checklist (commit a new version)',
      inputSchema: {
        type: 'object',
        properties: {
          repo_id: {
            type: 'string',
            description: 'ID of the repository to update',
          },
          parent_commit_id: {
            type: 'string',
            description: 'ID of the parent commit (must be the current HEAD)',
          },
          content_json: {
            type: 'string',
            description: 'JSON string of the new ChecklistContent structure',
          },
          message: {
            type: 'string',
            description: 'Commit message describing the changes (e.g., "Added deployment steps")',
          },
        },
        required: ['repo_id', 'parent_commit_id', 'content_json', 'message'],
      },
    },
  ];
}

/**
 * Main tool handler router
 */
export async function handleToolRequest(
  toolName: string,
  args: Record<string, unknown>,
  userId: string
): Promise<unknown> {
  switch (toolName) {
    case 'list_repositories':
      return listRepositories(args as unknown as ListRepositoriesArgs, userId);
    case 'start_run':
      return startRun(args as unknown as StartRunArgs, userId);
    case 'update_item':
      return updateItem(args as unknown as UpdateItemArgs, userId);
    case 'create_repository':
      return createRepository(args as unknown as CreateRepositoryArgs, userId);
    case 'commit_changes':
      return commitChanges(args as unknown as CommitChangesArgs, userId);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
