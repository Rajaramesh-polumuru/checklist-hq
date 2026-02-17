/**
 * MCP Resources (Read-Only Data Exposure)
 *
 * Resources allow AI clients to read checklist data without modifying it.
 */
import { getSupabaseClient } from './auth.js';
import { generateAgentContext } from '../lib/agent/prompt-transformer.js';
const supabase = getSupabaseClient();
/**
 * List all available resources for the authenticated user
 */
export async function listResources(authContext) {
    const { data: repos } = await supabase
        .from('repositories')
        .select('id, title')
        .eq('owner_id', authContext.userId)
        .order('updated_at', { ascending: false })
        .limit(50);
    const resources = [
        {
            uri: 'checklist://repos',
            name: 'All Repositories',
            description: 'List of all your checklists',
            mimeType: 'application/json',
        },
    ];
    // Add per-repo resources
    if (repos) {
        for (const repo of repos) {
            resources.push({
                uri: `checklist://repo/${repo.id}/latest`,
                name: `${repo.title} (Latest)`,
                description: `Latest version of ${repo.title}`,
                mimeType: 'text/markdown',
            }, {
                uri: `checklist://repo/${repo.id}/history`,
                name: `${repo.title} (History)`,
                description: `Commit history for ${repo.title}`,
                mimeType: 'application/json',
            });
        }
    }
    return { resources };
}
/**
 * Read a specific resource by URI
 */
export async function readResource(uri, authContext) {
    // Parse URI
    if (uri === 'checklist://repos') {
        return await getRepositoryList(authContext);
    }
    const repoLatestMatch = uri.match(/^checklist:\/\/repo\/([^/]+)\/latest$/);
    if (repoLatestMatch) {
        return await getLatestCommit(repoLatestMatch[1], authContext);
    }
    const repoHistoryMatch = uri.match(/^checklist:\/\/repo\/([^/]+)\/history$/);
    if (repoHistoryMatch) {
        return await getCommitHistory(repoHistoryMatch[1], authContext);
    }
    const runStatusMatch = uri.match(/^checklist:\/\/run\/([^/]+)\/status$/);
    if (runStatusMatch) {
        return await getRunStatus(runStatusMatch[1], authContext);
    }
    throw new Error(`Unknown resource URI: ${uri}`);
}
/**
 * Get list of all repositories
 */
async function getRepositoryList(authContext) {
    const { data: repos, error } = await supabase
        .from('repositories')
        .select('id, title, description, is_public, created_at, updated_at')
        .eq('owner_id', authContext.userId)
        .order('updated_at', { ascending: false });
    if (error)
        throw error;
    return {
        contents: [
            {
                uri: 'checklist://repos',
                mimeType: 'application/json',
                text: JSON.stringify(repos, null, 2),
            },
        ],
    };
}
/**
 * Get latest commit for a repository
 */
async function getLatestCommit(repoId, authContext) {
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
    // Generate agent-optimized context
    const markdownContext = generateAgentContext(repo, commit, undefined, {
        format: 'markdown',
        includeMetadata: true,
    });
    return {
        contents: [
            {
                uri: `checklist://repo/${repoId}/latest`,
                mimeType: 'text/markdown',
                text: markdownContext,
            },
        ],
    };
}
/**
 * Get commit history for a repository
 */
async function getCommitHistory(repoId, authContext) {
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
    // Get commit history
    const { data: commits, error } = await supabase
        .from('commits')
        .select('id, message, created_at, author_id')
        .eq('repo_id', repoId)
        .order('created_at', { ascending: false })
        .limit(50);
    if (error)
        throw error;
    return {
        contents: [
            {
                uri: `checklist://repo/${repoId}/history`,
                mimeType: 'application/json',
                text: JSON.stringify(commits, null, 2),
            },
        ],
    };
}
/**
 * Get run status
 */
async function getRunStatus(runId, authContext) {
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
    // Verify ownership
    if (run.repository.owner_id !== authContext.userId) {
        throw new Error('Access denied');
    }
    // Calculate progress stats
    const progress = run.progress || {};
    const total = Object.keys(progress).length;
    const completed = Object.values(progress).filter((p) => p.completed).length;
    const status = {
        run_id: run.id,
        repository: run.repository.title,
        status: run.status,
        started_at: run.started_at,
        completed_at: run.completed_at,
        total_items: total,
        completed_items: completed,
        progress_percent: total > 0 ? Math.round((completed / total) * 100) : 0,
        items: progress,
    };
    return {
        contents: [
            {
                uri: `checklist://run/${runId}/status`,
                mimeType: 'application/json',
                text: JSON.stringify(status, null, 2),
            },
        ],
    };
}
//# sourceMappingURL=resources.js.map