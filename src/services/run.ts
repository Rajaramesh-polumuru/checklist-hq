import { supabase } from '@/lib/supabase'
import type {
  Run,
  RunInsert,
  RunUpdate,
  RunProgress,
  Commit,
} from '@/types/database'

// ============================================
// Run Operations
// ============================================

export async function createRun(data: RunInsert): Promise<Run> {
  const { data: run, error } = await supabase
    .from('runs')
    .insert({
      ...data,
      progress: data.progress || {},
      status: data.status || 'active',
    } as unknown as Record<string, unknown>)
    .select()
    .single()

  if (error) throw error
  return run as Run
}

export async function getRun(id: string): Promise<Run | null> {
  const { data, error } = await supabase
    .from('runs')
    .select()
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data as Run
}

export async function getRunWithDetails(id: string): Promise<{
  run: Run
  commit: Commit
} | null> {
  const { data, error } = await supabase
    .from('runs')
    .select(`
      *,
      commits (*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  const runData = data as Run & { commits: Commit }
  return {
    run: {
      id: runData.id,
      repo_id: runData.repo_id,
      commit_id: runData.commit_id,
      progress: runData.progress,
      status: runData.status,
      started_at: runData.started_at,
      completed_at: runData.completed_at,
    },
    commit: runData.commits,
  }
}

export async function updateRun(id: string, updates: RunUpdate): Promise<Run> {
  const { data, error } = await supabase
    .from('runs')
    .update(updates as unknown as Record<string, unknown>)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Run
}

export async function updateRunProgress(
  id: string,
  itemId: string,
  completed: boolean,
  userId?: string
): Promise<Run> {
  // First get current progress
  const run = await getRun(id)
  if (!run) throw new Error('Run not found')

  const newProgress: RunProgress = {
    ...run.progress,
    [itemId]: {
      completed,
      timestamp: new Date().toISOString(),
      user_id: userId,
    },
  }

  return updateRun(id, { progress: newProgress })
}

export async function completeRun(id: string): Promise<Run> {
  return updateRun(id, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  })
}

export async function archiveRun(id: string): Promise<Run> {
  return updateRun(id, { status: 'archived' })
}

export async function deleteRun(id: string): Promise<void> {
  const { error } = await supabase
    .from('runs')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// Query Operations
// ============================================

export async function getActiveRunsForRepo(repoId: string): Promise<Run[]> {
  const { data, error } = await supabase
    .from('runs')
    .select()
    .eq('repo_id', repoId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })

  if (error) throw error
  return (data || []) as Run[]
}

export async function getAllRunsForRepo(repoId: string): Promise<Run[]> {
  const { data, error } = await supabase
    .from('runs')
    .select()
    .eq('repo_id', repoId)
    .order('started_at', { ascending: false })

  if (error) throw error
  return (data || []) as Run[]
}

export async function getUserActiveRuns(userId: string): Promise<Run[]> {
  // Get runs for repositories owned by the user
  const { data, error } = await supabase
    .from('runs')
    .select(`
      *,
      repositories!inner (owner_id)
    `)
    .eq('repositories.owner_id', userId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })

  if (error) throw error
  return (data || []).map((d) => ({
    id: d.id,
    repo_id: d.repo_id,
    commit_id: d.commit_id,
    progress: d.progress,
    status: d.status,
    started_at: d.started_at,
    completed_at: d.completed_at,
  })) as Run[]
}

// ============================================
// Combined Operations
// ============================================

/**
 * Start a new run from the latest commit of a repository
 */
export async function startRunFromLatestCommit(repoId: string): Promise<Run> {
  // Get the latest commit
  const { data: commit, error: commitError } = await supabase
    .from('commits')
    .select()
    .eq('repo_id', repoId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (commitError) {
    if (commitError.code === 'PGRST116') {
      throw new Error('No commits found for this repository')
    }
    throw commitError
  }

  // Create the run
  return createRun({
    repo_id: repoId,
    commit_id: commit.id,
    progress: {},
    status: 'active',
  })
}

/**
 * Calculate completion percentage for a run
 */
export function calculateRunProgress(
  progress: RunProgress,
  totalItems: number
): number {
  if (totalItems === 0) return 0
  const completedCount = Object.values(progress).filter((p) => p.completed).length
  return Math.round((completedCount / totalItems) * 100)
}
