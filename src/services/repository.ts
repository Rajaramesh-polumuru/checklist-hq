import { supabase } from '@/lib/supabase'
import type {
  Repository,
  RepositoryInsert,
  RepositoryUpdate,
  Commit,
  CommitInsert,
  ChecklistContent,
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
}): Promise<{ repository: Repository; commit: Commit }> {
  const { ownerId, title, description, isPublic = false, content } = params

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
    message: 'Initial commit',
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
