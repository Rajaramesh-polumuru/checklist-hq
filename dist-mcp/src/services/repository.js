import { supabase } from '@/lib/supabase';
// ============================================
// Repository Operations
// ============================================
export async function createRepository(data) {
    const { data: repo, error } = await supabase
        .from('repositories')
        .insert(data)
        .select()
        .single();
    if (error)
        throw error;
    return repo;
}
export async function getRepository(id) {
    const { data, error } = await supabase
        .from('repositories')
        .select()
        .eq('id', id)
        .single();
    if (error) {
        if (error.code === 'PGRST116')
            return null; // Not found
        throw error;
    }
    return data;
}
export async function getUserRepositories(userId) {
    const { data, error } = await supabase
        .from('repositories')
        .select()
        .eq('owner_id', userId)
        .order('updated_at', { ascending: false });
    if (error)
        throw error;
    const repos = (data || []);
    return await attachTagsToRepositories(repos);
}
export async function getOrganizationRepositories(orgId) {
    const { data, error } = await supabase
        .from('repositories')
        .select()
        .eq('organization_id', orgId)
        .order('updated_at', { ascending: false });
    if (error)
        throw error;
    const repos = (data || []);
    return await attachTagsToRepositories(repos);
}
export async function updateRepository(id, updates) {
    const { data, error } = await supabase
        .from('repositories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
export async function deleteRepository(id) {
    const { error } = await supabase
        .from('repositories')
        .delete()
        .eq('id', id);
    if (error)
        throw error;
}
// ============================================
// Commit Operations
// ============================================
export async function createCommit(data) {
    const { data: commit, error } = await supabase
        .from('commits')
        .insert(data)
        .select()
        .single();
    if (error)
        throw error;
    return commit;
}
export async function getLatestCommit(repoId) {
    const { data, error } = await supabase
        .from('commits')
        .select()
        .eq('repo_id', repoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (error) {
        if (error.code === 'PGRST116')
            return null; // Not found
        throw error;
    }
    return data;
}
export async function getCommitHistory(repoId) {
    const { data, error } = await supabase
        .from('commits')
        .select()
        .eq('repo_id', repoId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return (data || []);
}
export async function getCommit(commitId) {
    const { data, error } = await supabase
        .from('commits')
        .select()
        .eq('id', commitId)
        .single();
    if (error) {
        if (error.code === 'PGRST116')
            return null; // Not found
        throw error;
    }
    return data;
}
/**
 * Restore a repository to a specific commit version
 * Creates a new commit with the content from the specified commit
 */
export async function restoreToCommit(params) {
    const { repoId, commitId, latestCommitId } = params;
    // Get the commit to restore from
    const sourceCommit = await getCommit(commitId);
    if (!sourceCommit) {
        throw new Error('Commit not found');
    }
    // Create a new commit with the restored content
    const commit = await createCommit({
        repo_id: repoId,
        content: sourceCommit.content,
        message: `Restored to version from ${new Date(sourceCommit.created_at).toLocaleDateString()}`,
        parent_commit_id: latestCommitId,
    });
    return commit;
}
// ============================================
// Combined Operations
// ============================================
/**
 * Create a new repository with an initial commit
 */
export async function createRepositoryWithCommit(params) {
    const { ownerId, title, description, isPublic = false, content, message = 'Initial commit' } = params;
    // Create the repository
    const repository = await createRepository({
        owner_id: ownerId,
        title,
        description,
        is_public: isPublic,
    });
    // Create the initial commit
    const commit = await createCommit({
        repo_id: repository.id,
        content,
        message,
    });
    return { repository, commit };
}
/**
 * Save changes to a repository (creates a new commit)
 */
export async function saveRepositoryChanges(params) {
    const { repoId, content, message = 'Update checklist', parentCommitId } = params;
    const commit = await createCommit({
        repo_id: repoId,
        content,
        message,
        parent_commit_id: parentCommitId,
    });
    return commit;
}
/**
 * Fork a repository (uses the database function)
 */
export async function forkRepository(params) {
    const { sourceRepoId, newOwnerId, newTitle } = params;
    const { data, error } = await supabase.rpc('fork_repository', {
        source_repo_id: sourceRepoId,
        new_owner_id: newOwnerId,
        new_title: newTitle ?? null,
    });
    if (error)
        throw error;
    return data; // Returns the new repo ID
}
/**
 * Fork a repository to a team (creates a team-owned repository)
 * This creates a fork that belongs to the team's organization
 */
export async function forkRepositoryToTeam(params) {
    const { sourceRepoId, targetTeamId, newTitle } = params;
    // First, get the source repository and its latest commit
    const sourceRepo = await getRepository(sourceRepoId);
    if (!sourceRepo) {
        throw new Error('Source repository not found');
    }
    const latestCommit = await getLatestCommit(sourceRepoId);
    if (!latestCommit) {
        throw new Error('Source repository has no commits');
    }
    // Get the team to find the organization
    const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, organization_id, name')
        .eq('id', targetTeamId)
        .single();
    if (teamError || !team) {
        throw new Error('Team not found');
    }
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Not authenticated');
    }
    // Create the forked repository with organization and team association
    const title = newTitle || sourceRepo.title;
    const originId = sourceRepo.origin_repo_id || sourceRepo.id;
    const { data: newRepo, error: repoError } = await supabase
        .from('repositories')
        .insert({
        owner_id: user.id,
        title,
        description: sourceRepo.description,
        is_public: false, // Team forks are private by default
        origin_repo_id: originId,
        upstream_repo_id: sourceRepo.id,
        organization_id: team.organization_id,
    })
        .select()
        .single();
    if (repoError)
        throw repoError;
    // Create the initial commit with the forked content
    const { error: commitError } = await supabase
        .from('commits')
        .insert({
        repo_id: newRepo.id,
        content: latestCommit.content,
        message: `Forked from ${sourceRepo.title} to ${team.name}`,
        parent_commit_id: null,
    });
    if (commitError)
        throw commitError;
    // Grant the team access to the repository
    const { error: accessError } = await supabase
        .from('repository_team_access')
        .insert({
        repository_id: newRepo.id,
        team_id: targetTeamId,
        permission: 'admin',
        granted_by: user.id,
    });
    if (accessError) {
        console.error('Failed to grant team access:', accessError);
        // Don't throw - the fork was still created successfully
    }
    // Update fork count on source repo
    await supabase
        .from('repositories')
        .update({ fork_count: (sourceRepo.fork_count || 0) + 1 })
        .eq('id', sourceRepoId);
    return newRepo.id;
}
// ============================================
// Public Repository Operations (Explore)
// ============================================
export async function getPublicRepositories(params) {
    const { limit = 20, offset = 0, orderBy = 'fork_count' } = params || {};
    const { data, error } = await supabase
        .from('repositories')
        .select()
        .eq('is_public', true)
        .order(orderBy, { ascending: false })
        .range(offset, offset + limit - 1);
    if (error)
        throw error;
    return (data || []);
}
export async function searchPublicRepositories(query) {
    const { data, error } = await supabase
        .from('repositories')
        .select()
        .eq('is_public', true)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('fork_count', { ascending: false })
        .limit(20);
    if (error)
        throw error;
    return (data || []);
}
// ============================================
// Tag Operations
// ============================================
/**
 * Get all available tags
 */
export async function getAllTags() {
    const { data, error } = await supabase
        .from('tags')
        .select()
        .order('category')
        .order('name');
    if (error)
        throw error;
    return (data || []);
}
/**
 * Get tags grouped by category
 */
export async function getTagsByCategory() {
    const tags = await getAllTags();
    return tags.reduce((acc, tag) => {
        const category = tag.category || 'other';
        if (!acc[category])
            acc[category] = [];
        acc[category].push(tag);
        return acc;
    }, {});
}
/**
 * Get tags for a specific repository
 */
export async function getRepositoryTags(repoId) {
    const { data, error } = await supabase
        .from('repository_tags')
        .select('tag_id, tags(*)')
        .eq('repository_id', repoId);
    if (error)
        throw error;
    // Extract tags from the join result
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((rt) => rt.tags).filter(Boolean);
}
/**
 * Get public repositories with their tags
 */
export async function getPublicRepositoriesWithTags(params) {
    const { limit = 20, offset = 0, orderBy = 'fork_count', tagSlug } = params || {};
    // If filtering by tag, we need a different query
    if (tagSlug) {
        // First get the tag ID
        const { data: tagData, error: tagError } = await supabase
            .from('tags')
            .select('id')
            .eq('slug', tagSlug)
            .single();
        if (tagError) {
            if (tagError.code === 'PGRST116')
                return []; // Tag not found
            throw tagError;
        }
        // Get repositories that have this tag
        const { data: repoTagData, error: repoTagError } = await supabase
            .from('repository_tags')
            .select('repository_id')
            .eq('tag_id', tagData.id);
        if (repoTagError)
            throw repoTagError;
        const repoIds = (repoTagData || []).map(rt => rt.repository_id);
        if (repoIds.length === 0)
            return [];
        // Get the repositories
        const { data, error } = await supabase
            .from('repositories')
            .select()
            .eq('is_public', true)
            .in('id', repoIds)
            .order(orderBy, { ascending: false })
            .range(offset, offset + limit - 1);
        if (error)
            throw error;
        // Fetch tags for each repository
        const repos = (data || []);
        return await attachTagsToRepositories(repos);
    }
    // No tag filter - get all public repos
    const { data, error } = await supabase
        .from('repositories')
        .select()
        .eq('is_public', true)
        .order(orderBy, { ascending: false })
        .range(offset, offset + limit - 1);
    if (error)
        throw error;
    const repos = (data || []);
    return await attachTagsToRepositories(repos);
}
/**
 * Search public repositories with tags
 */
export async function searchPublicRepositoriesWithTags(query) {
    const repos = await searchPublicRepositories(query);
    return await attachTagsToRepositories(repos);
}
/**
 * Helper function to attach tags to repositories
 */
async function attachTagsToRepositories(repos) {
    if (repos.length === 0)
        return [];
    const repoIds = repos.map(r => r.id);
    // Get all repository_tags for these repos
    const { data: repoTagsData, error: repoTagsError } = await supabase
        .from('repository_tags')
        .select('repository_id, tag_id, tags(*)')
        .in('repository_id', repoIds);
    if (repoTagsError)
        throw repoTagsError;
    // Group tags by repository ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tagsByRepoId = (repoTagsData || []).reduce((acc, rt) => {
        if (!acc[rt.repository_id])
            acc[rt.repository_id] = [];
        if (rt.tags)
            acc[rt.repository_id].push(rt.tags);
        return acc;
    }, {});
    // Attach tags to each repository
    return repos.map(repo => ({
        ...repo,
        tags: tagsByRepoId[repo.id] || [],
    }));
}
/**
 * Add a tag to a repository (for future use when users can tag their repos)
 */
export async function addTagToRepository(repoId, tagId) {
    const { error } = await supabase
        .from('repository_tags')
        .insert({ repository_id: repoId, tag_id: tagId });
    if (error && error.code !== '23505')
        throw error; // Ignore duplicate key errors
}
/**
 * Remove a tag from a repository
 */
export async function removeTagFromRepository(repoId, tagId) {
    const { error } = await supabase
        .from('repository_tags')
        .delete()
        .eq('repository_id', repoId)
        .eq('tag_id', tagId);
    if (error)
        throw error;
}
/**
 * Get teams with access to a repository
 */
export async function getRepositoryTeams(repoId) {
    const { data, error } = await supabase
        .from('repository_team_access')
        .select(`
      id,
      repository_id,
      team_id,
      permission,
      team:teams (
        id,
        name,
        slug
      )
    `)
        .eq('repository_id', repoId);
    if (error)
        throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []);
}
/**
 * Grant team access to a repository
 */
export async function addTeamAccess(repoId, teamId, permission) {
    const { error } = await supabase
        .from('repository_team_access')
        .insert({
        repository_id: repoId,
        team_id: teamId,
        permission
    });
    if (error)
        throw error;
}
/**
 * Update team access permission
 */
export async function updateTeamAccess(repoId, teamId, permission) {
    const { error } = await supabase
        .from('repository_team_access')
        .update({ permission })
        .eq('repository_id', repoId)
        .eq('team_id', teamId);
    if (error)
        throw error;
}
/**
 * Remove team access from a repository
 */
export async function removeTeamAccess(repoId, teamId) {
    const { error } = await supabase
        .from('repository_team_access')
        .delete()
        .eq('repository_id', repoId)
        .eq('team_id', teamId);
    if (error)
        throw error;
}
//# sourceMappingURL=repository.js.map