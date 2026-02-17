/**
 * MCP Tools (Actions)
 *
 * Tools allow AI clients to modify checklist data and execute operations.
 */
import { getSupabaseClient } from './auth.js';
import { validateChecklistContent } from '../lib/agent/schemas.js';
const supabase = getSupabaseClient();
/**
 * List all available tools
 */
export async function listTools() {
    return {
        tools: [
            {
                name: 'list_repositories',
                description: 'Search and list available checklists',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'Search query to filter repositories by title',
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results (default: 20, max: 100)',
                            default: 20,
                        },
                        tag: {
                            type: 'string',
                            description: 'Filter by tag',
                        },
                    },
                },
            },
            {
                name: 'get_checklist',
                description: 'Get full checklist content in structured format',
                inputSchema: {
                    type: 'object',
                    properties: {
                        repo_id: {
                            type: 'string',
                            description: 'Repository ID',
                        },
                    },
                    required: ['repo_id'],
                },
            },
            {
                name: 'start_run',
                description: 'Begin executing a checklist',
                inputSchema: {
                    type: 'object',
                    properties: {
                        repo_id: {
                            type: 'string',
                            description: 'Repository ID to execute',
                        },
                        name: {
                            type: 'string',
                            description: 'Optional name for this run',
                        },
                    },
                    required: ['repo_id'],
                },
            },
            {
                name: 'update_item',
                description: 'Mark a checklist item as complete or incomplete',
                inputSchema: {
                    type: 'object',
                    properties: {
                        run_id: {
                            type: 'string',
                            description: 'Run ID',
                        },
                        item_id: {
                            type: 'string',
                            description: 'Item ID to update',
                        },
                        completed: {
                            type: 'boolean',
                            description: 'Whether the item is completed',
                        },
                        note: {
                            type: 'string',
                            description: 'Optional note about completion',
                        },
                        output: {
                            type: 'object',
                            description: 'Optional structured output data from the step',
                        },
                    },
                    required: ['run_id', 'item_id', 'completed'],
                },
            },
            {
                name: 'get_run_status',
                description: 'Check execution progress for a run',
                inputSchema: {
                    type: 'object',
                    properties: {
                        run_id: {
                            type: 'string',
                            description: 'Run ID',
                        },
                    },
                    required: ['run_id'],
                },
            },
            {
                name: 'create_repository',
                description: 'Create a new checklist',
                inputSchema: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                            description: 'Checklist title',
                        },
                        description: {
                            type: 'string',
                            description: 'Optional description',
                        },
                        items: {
                            type: 'object',
                            description: 'Optional initial checklist structure',
                        },
                    },
                    required: ['title'],
                },
            },
            {
                name: 'commit_changes',
                description: 'Update checklist structure (create a new version)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        repo_id: {
                            type: 'string',
                            description: 'Repository ID',
                        },
                        parent_commit_id: {
                            type: 'string',
                            description: 'Parent commit ID (must match current HEAD)',
                        },
                        content: {
                            type: 'string',
                            description: 'JSON string of ChecklistContent',
                        },
                        message: {
                            type: 'string',
                            description: 'Commit message describing changes',
                        },
                    },
                    required: ['repo_id', 'parent_commit_id', 'content', 'message'],
                },
            },
        ],
    };
}
/**
 * Execute a tool by name
 */
export async function executeTool(toolName, args, authContext) {
    switch (toolName) {
        case 'list_repositories':
            return await toolListRepositories(args, authContext);
        case 'get_checklist':
            return await toolGetChecklist(args, authContext);
        case 'start_run':
            return await toolStartRun(args, authContext);
        case 'update_item':
            return await toolUpdateItem(args, authContext);
        case 'get_run_status':
            return await toolGetRunStatus(args, authContext);
        case 'create_repository':
            return await toolCreateRepository(args, authContext);
        case 'commit_changes':
            return await toolCommitChanges(args, authContext);
        default:
            throw new Error(`Unknown tool: ${toolName}`);
    }
}
/**
 * Tool: list_repositories
 */
async function toolListRepositories(args, authContext) {
    const query = args.query;
    const limit = Math.min(args.limit || 20, 100);
    // const tag = args.tag as string | undefined; // TODO: implement tag filtering
    let queryBuilder = supabase
        .from('repositories')
        .select('id, title, description, is_public, created_at, updated_at')
        .eq('owner_id', authContext.userId)
        .order('updated_at', { ascending: false })
        .limit(limit);
    if (query) {
        queryBuilder = queryBuilder.ilike('title', `%${query}%`);
    }
    const { data: repos, error } = await queryBuilder;
    if (error)
        throw error;
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(repos, null, 2),
            },
        ],
    };
}
/**
 * Tool: get_checklist
 */
async function toolGetChecklist(args, authContext) {
    const repoId = args.repo_id;
    // Verify ownership
    const { data: repo, error: repoError } = await supabase
        .from('repositories')
        .select('*')
        .eq('id', repoId)
        .eq('owner_id', authContext.userId)
        .single();
    if (repoError || !repo) {
        throw new Error('Repository not found or access denied');
    }
    // Get latest commit
    const { data: commit, error: commitError } = await supabase
        .from('commits')
        .select('*')
        .eq('repo_id', repoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (commitError || !commit) {
        throw new Error('No commits found for this repository');
    }
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ repository: repo, commit }, null, 2),
            },
        ],
    };
}
/**
 * Tool: start_run
 */
async function toolStartRun(args, authContext) {
    const repoId = args.repo_id;
    // const runName = args.name as string | undefined; // TODO: implement run naming
    // Verify ownership and get latest commit
    const { data: repo, error: repoError } = await supabase
        .from('repositories')
        .select('id, title')
        .eq('id', repoId)
        .eq('owner_id', authContext.userId)
        .single();
    if (repoError || !repo) {
        throw new Error('Repository not found or access denied');
    }
    const { data: commit, error: commitError } = await supabase
        .from('commits')
        .select('id')
        .eq('repo_id', repoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (commitError || !commit) {
        throw new Error('No commits found for this repository');
    }
    // Create run
    const { data: run, error: runError } = await supabase
        .from('runs')
        .insert({
        repo_id: repoId,
        commit_id: commit.id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        runner_id: authContext.userId,
        progress: {},
    })
        .select()
        .single();
    if (runError || !run) {
        throw new Error('Failed to create run');
    }
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ run_id: run.id, repository: repo.title }, null, 2),
            },
        ],
    };
}
/**
 * Tool: update_item
 */
async function toolUpdateItem(args, authContext) {
    const runId = args.run_id;
    const itemId = args.item_id;
    const completed = args.completed;
    const note = args.note;
    const output = args.output;
    // Get run and verify ownership
    const { data: run, error: runError } = await supabase
        .from('runs')
        .select('*, repository:repositories(owner_id)')
        .eq('id', runId)
        .single();
    if (runError || !run) {
        throw new Error('Run not found');
    }
    if (run.repository.owner_id !== authContext.userId) {
        throw new Error('Access denied');
    }
    // Update progress
    const currentProgress = run.progress || {};
    currentProgress[itemId] = {
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        completed_by: authContext.userId,
        completed_by_type: 'agent',
        completed_by_name: 'MCP Client',
        note,
        agent_output: output,
    };
    const { error: updateError } = await supabase
        .from('runs')
        .update({ progress: currentProgress })
        .eq('id', runId);
    if (updateError) {
        throw new Error('Failed to update item');
    }
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ success: true, item_id: itemId, completed }, null, 2),
            },
        ],
    };
}
/**
 * Tool: get_run_status
 */
async function toolGetRunStatus(args, authContext) {
    const runId = args.run_id;
    const { data: run, error } = await supabase
        .from('runs')
        .select(`
      *,
      repository:repositories(id, title, owner_id)
    `)
        .eq('id', runId)
        .single();
    if (error || !run) {
        throw new Error('Run not found');
    }
    if (run.repository.owner_id !== authContext.userId) {
        throw new Error('Access denied');
    }
    const progress = run.progress || {};
    const total = Object.keys(progress).length;
    const completed = Object.values(progress).filter((p) => p.completed).length;
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    run_id: run.id,
                    repository: run.repository.title,
                    status: run.status,
                    total_items: total,
                    completed_items: completed,
                    progress_percent: total > 0 ? Math.round((completed / total) * 100) : 0,
                }, null, 2),
            },
        ],
    };
}
/**
 * Tool: create_repository
 */
async function toolCreateRepository(args, authContext) {
    const title = args.title;
    const description = args.description;
    const items = args.items;
    // Create repository
    const { data: repo, error: repoError } = await supabase
        .from('repositories')
        .insert({
        title,
        description,
        owner_id: authContext.userId,
        is_public: false,
    })
        .select()
        .single();
    if (repoError || !repo) {
        throw new Error('Failed to create repository');
    }
    // Create initial commit
    let content;
    if (items) {
        const validationResult = validateChecklistContent(items);
        if (!validationResult.success) {
            throw new Error(`Invalid checklist content: ${JSON.stringify(validationResult.errors)}`);
        }
        if (!validationResult.data) {
            throw new Error('Validation succeeded but no data returned');
        }
        content = validationResult.data;
    }
    else {
        content = {
            version: '2.0',
            items: {
                root: {
                    id: 'root',
                    text: '',
                    parent: null,
                    order: 0,
                },
            },
        };
    }
    const { data: commit, error: commitError } = await supabase
        .from('commits')
        .insert({
        repo_id: repo.id,
        message: 'Initial commit',
        author_id: authContext.userId,
        content,
    })
        .select()
        .single();
    if (commitError || !commit) {
        throw new Error('Failed to create initial commit');
    }
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ repo_id: repo.id, commit_id: commit.id }, null, 2),
            },
        ],
    };
}
/**
 * Tool: commit_changes
 */
async function toolCommitChanges(args, authContext) {
    const repoId = args.repo_id;
    const parentCommitId = args.parent_commit_id;
    const contentJson = args.content;
    const message = args.message;
    // Verify ownership
    const { data: repo, error: repoError } = await supabase
        .from('repositories')
        .select('id')
        .eq('id', repoId)
        .eq('owner_id', authContext.userId)
        .single();
    if (repoError || !repo) {
        throw new Error('Repository not found or access denied');
    }
    // Verify parent commit is latest
    const { data: latestCommit, error: commitError } = await supabase
        .from('commits')
        .select('id')
        .eq('repo_id', repoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (commitError || !latestCommit) {
        throw new Error('No commits found for this repository');
    }
    if (latestCommit.id !== parentCommitId) {
        throw new Error('Conflict: parent_commit_id does not match current HEAD');
    }
    // Parse and validate content
    let content;
    try {
        const parsed = JSON.parse(contentJson);
        const validationResult = validateChecklistContent(parsed);
        if (!validationResult.success) {
            throw new Error(`Invalid checklist content: ${JSON.stringify(validationResult.errors)}`);
        }
        if (!validationResult.data) {
            throw new Error('Validation succeeded but no data returned');
        }
        content = validationResult.data;
    }
    catch (error) {
        throw new Error(`Invalid content JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
    // Create new commit
    const { data: newCommit, error: newCommitError } = await supabase
        .from('commits')
        .insert({
        repo_id: repoId,
        parent_id: parentCommitId,
        message,
        author_id: authContext.userId,
        content,
    })
        .select()
        .single();
    if (newCommitError || !newCommit) {
        throw new Error('Failed to create commit');
    }
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ commit_id: newCommit.id }, null, 2),
            },
        ],
    };
}
//# sourceMappingURL=tools.js.map