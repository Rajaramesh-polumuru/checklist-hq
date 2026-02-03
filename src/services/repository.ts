import { supabase } from '@/lib/supabase'
import type {
  Repository,
  RepositoryInsert,
  RepositoryUpdate,
  Commit,
  CommitInsert,
  ChecklistContent,
  Tag,
  RepositoryWithTags,
} from '@/types/database'

// ============================================
// Repository Operations
// ============================================

export async function createRepository(
  data: RepositoryInsert
): Promise<Repository> {
  const { data: repo, error } = await supabase
    .from('repositories')
    .insert(data as unknown as Record<string, unknown>)
    .select()
    .single()

  if (error) throw error
  return repo as Repository
}

export async function getRepository(id: string): Promise<Repository | null> {
  const { data, error } = await supabase
    .from('repositories')
    .select()
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data as Repository
}

export async function getUserRepositories(userId: string): Promise<Repository[]> {
  const { data, error } = await supabase
    .from('repositories')
    .select()
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data || []) as Repository[]
}

export async function updateRepository(
  id: string,
  updates: RepositoryUpdate
): Promise<Repository> {
  const { data, error } = await supabase
    .from('repositories')
    .update(updates as unknown as Record<string, unknown>)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Repository
}

export async function deleteRepository(id: string): Promise<void> {
  const { error } = await supabase
    .from('repositories')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// Commit Operations
// ============================================

export async function createCommit(data: CommitInsert): Promise<Commit> {
  const { data: commit, error } = await supabase
    .from('commits')
    .insert(data as unknown as Record<string, unknown>)
    .select()
    .single()

  if (error) throw error
  return commit as Commit
}

export async function getLatestCommit(repoId: string): Promise<Commit | null> {
  const { data, error } = await supabase
    .from('commits')
    .select()
    .eq('repo_id', repoId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data as Commit
}

export async function getCommitHistory(repoId: string): Promise<Commit[]> {
  const { data, error } = await supabase
    .from('commits')
    .select()
    .eq('repo_id', repoId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as Commit[]
}

export async function getCommit(commitId: string): Promise<Commit | null> {
  const { data, error } = await supabase
    .from('commits')
    .select()
    .eq('id', commitId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data as Commit
}

/**
 * Restore a repository to a specific commit version
 * Creates a new commit with the content from the specified commit
 */
export async function restoreToCommit(params: {
  repoId: string
  commitId: string
  latestCommitId?: string
}): Promise<Commit> {
  const { repoId, commitId, latestCommitId } = params

  // Get the commit to restore from
  const sourceCommit = await getCommit(commitId)
  if (!sourceCommit) {
    throw new Error('Commit not found')
  }

  // Create a new commit with the restored content
  const commit = await createCommit({
    repo_id: repoId,
    content: sourceCommit.content,
    message: `Restored to version from ${new Date(sourceCommit.created_at).toLocaleDateString()}`,
    parent_commit_id: latestCommitId,
  })

  return commit
}

// ============================================
// Combined Operations
// ============================================

/**
 * Create a new repository with an initial commit
 */
export async function createRepositoryWithCommit(params: {
  ownerId: string
  title: string
  description?: string
  isPublic?: boolean
  content: ChecklistContent
  message?: string
}): Promise<{ repository: Repository; commit: Commit }> {
  const { ownerId, title, description, isPublic = false, content, message = 'Initial commit' } = params

  // Create the repository
  const repository = await createRepository({
    owner_id: ownerId,
    title,
    description,
    is_public: isPublic,
  })

  // Create the initial commit
  const commit = await createCommit({
    repo_id: repository.id,
    content,
    message,
  })

  return { repository, commit }
}

/**
 * Save changes to a repository (creates a new commit)
 */
export async function saveRepositoryChanges(params: {
  repoId: string
  content: ChecklistContent
  message?: string
  parentCommitId?: string
}): Promise<Commit> {
  const { repoId, content, message = 'Update checklist', parentCommitId } = params

  const commit = await createCommit({
    repo_id: repoId,
    content,
    message,
    parent_commit_id: parentCommitId,
  })

  return commit
}

/**
 * Fork a repository (uses the database function)
 */
export async function forkRepository(params: {
  sourceRepoId: string
  newOwnerId: string
  newTitle?: string
}): Promise<string> {
  const { sourceRepoId, newOwnerId, newTitle } = params

  const { data, error } = await supabase.rpc('fork_repository', {
    source_repo_id: sourceRepoId,
    new_owner_id: newOwnerId,
    new_title: newTitle ?? null,
  })

  if (error) throw error
  return data as string // Returns the new repo ID
}

// ============================================
// Public Repository Operations (Explore)
// ============================================

export async function getPublicRepositories(params?: {
  limit?: number
  offset?: number
  orderBy?: 'fork_count' | 'created_at' | 'updated_at'
}): Promise<Repository[]> {
  const { limit = 20, offset = 0, orderBy = 'fork_count' } = params || {}

  const { data, error } = await supabase
    .from('repositories')
    .select()
    .eq('is_public', true)
    .order(orderBy, { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return (data || []) as Repository[]
}

export async function searchPublicRepositories(query: string): Promise<Repository[]> {
  const { data, error } = await supabase
    .from('repositories')
    .select()
    .eq('is_public', true)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('fork_count', { ascending: false })
    .limit(20)

  if (error) throw error
  return (data || []) as Repository[]
}

// ============================================
// Tag Operations
// ============================================

/**
 * Get all available tags
 */
export async function getAllTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select()
    .order('category')
    .order('name')

  if (error) throw error
  return (data || []) as Tag[]
}

/**
 * Get tags grouped by category
 */
export async function getTagsByCategory(): Promise<Record<string, Tag[]>> {
  const tags = await getAllTags()
  return tags.reduce((acc, tag) => {
    const category = tag.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(tag)
    return acc
  }, {} as Record<string, Tag[]>)
}

/**
 * Get tags for a specific repository
 */
export async function getRepositoryTags(repoId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('repository_tags')
    .select('tag_id, tags(*)')
    .eq('repository_id', repoId)

  if (error) throw error

  // Extract tags from the join result
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((rt: any) => rt.tags).filter(Boolean) as Tag[]
}

/**
 * Get public repositories with their tags
 */
export async function getPublicRepositoriesWithTags(params?: {
  limit?: number
  offset?: number
  orderBy?: 'fork_count' | 'created_at' | 'updated_at'
  tagSlug?: string
}): Promise<RepositoryWithTags[]> {
  const { limit = 20, offset = 0, orderBy = 'fork_count', tagSlug } = params || {}

  // If filtering by tag, we need a different query
  if (tagSlug) {
    // First get the tag ID
    const { data: tagData, error: tagError } = await supabase
      .from('tags')
      .select('id')
      .eq('slug', tagSlug)
      .single()

    if (tagError) {
      if (tagError.code === 'PGRST116') return [] // Tag not found
      throw tagError
    }

    // Get repositories that have this tag
    const { data: repoTagData, error: repoTagError } = await supabase
      .from('repository_tags')
      .select('repository_id')
      .eq('tag_id', tagData.id)

    if (repoTagError) throw repoTagError

    const repoIds = (repoTagData || []).map(rt => rt.repository_id)
    if (repoIds.length === 0) return []

    // Get the repositories
    const { data, error } = await supabase
      .from('repositories')
      .select()
      .eq('is_public', true)
      .in('id', repoIds)
      .order(orderBy, { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Fetch tags for each repository
    const repos = (data || []) as Repository[]
    return await attachTagsToRepositories(repos)
  }

  // No tag filter - get all public repos
  const { data, error } = await supabase
    .from('repositories')
    .select()
    .eq('is_public', true)
    .order(orderBy, { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  const repos = (data || []) as Repository[]
  return await attachTagsToRepositories(repos)
}

/**
 * Search public repositories with tags
 */
export async function searchPublicRepositoriesWithTags(query: string): Promise<RepositoryWithTags[]> {
  const repos = await searchPublicRepositories(query)
  return await attachTagsToRepositories(repos)
}

/**
 * Helper function to attach tags to repositories
 */
async function attachTagsToRepositories(repos: Repository[]): Promise<RepositoryWithTags[]> {
  if (repos.length === 0) return []

  const repoIds = repos.map(r => r.id)

  // Get all repository_tags for these repos
  const { data: repoTagsData, error: repoTagsError } = await supabase
    .from('repository_tags')
    .select('repository_id, tag_id, tags(*)')
    .in('repository_id', repoIds)

  if (repoTagsError) throw repoTagsError

  // Group tags by repository ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tagsByRepoId = (repoTagsData || []).reduce((acc: Record<string, Tag[]>, rt: any) => {
    if (!acc[rt.repository_id]) acc[rt.repository_id] = []
    if (rt.tags) acc[rt.repository_id].push(rt.tags)
    return acc
  }, {} as Record<string, Tag[]>)

  // Attach tags to each repository
  return repos.map(repo => ({
    ...repo,
    tags: tagsByRepoId[repo.id] || [],
  }))
}

/**
 * Add a tag to a repository (for future use when users can tag their repos)
 */
export async function addTagToRepository(repoId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from('repository_tags')
    .insert({ repository_id: repoId, tag_id: tagId })

  if (error && error.code !== '23505') throw error // Ignore duplicate key errors
}

/**
 * Remove a tag from a repository
 */
export async function removeTagFromRepository(repoId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from('repository_tags')
    .delete()
    .eq('repository_id', repoId)
    .eq('tag_id', tagId)

  if (error) throw error
}
