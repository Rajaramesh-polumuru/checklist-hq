import { supabase } from '@/lib/supabase'
import type {
  Run,
  RunInsert,
  RunUpdate,
  RunProgress,
  Commit,
  RunTimeSegment,
} from '@/types/database'

// ============================================
// Device Identification
// ============================================

/**
 * Get or create a unique device ID for this browser/device
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem('checklist_device_id')
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem('checklist_device_id', deviceId)
  }
  return deviceId
}

/**
 * Get a human-readable device name based on user agent
 */
export function getDeviceName(): string {
  const ua = navigator.userAgent
  if (/iPhone/i.test(ua)) return 'iPhone'
  if (/iPad/i.test(ua)) return 'iPad'
  if (/Android/i.test(ua)) return 'Android'
  if (/Macintosh/i.test(ua)) return 'Mac'
  if (/Windows/i.test(ua)) return 'Windows PC'
  if (/Linux/i.test(ua)) return 'Linux'
  return 'Unknown Device'
}

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
      user_id: runData.user_id,
      progress: runData.progress,
      status: runData.status,
      started_at: runData.started_at,
      completed_at: runData.completed_at,
      // Phase 1 fields
      name: runData.name,
      description: runData.description,
      paused_at: runData.paused_at,
      total_active_time_seconds: runData.total_active_time_seconds,
      last_activity_at: runData.last_activity_at,
      notes: runData.notes,
      device_id: runData.device_id,
      device_name: runData.device_name,
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
  userId?: string,
  note?: string
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
      ...(note && { note }),
    },
  }

  return updateRun(id, { progress: newProgress })
}

export async function completeRun(id: string): Promise<Run> {
  // End any active time segment
  await endCurrentTimeSegment(id)

  return updateRun(id, {
    status: 'completed',
    completed_at: new Date().toISOString(),
    last_activity_at: new Date().toISOString(),
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

export async function getMyActiveRuns(userId: string): Promise<(Run & { repository: { title: string; owner_id: string } })[]> {
  const { data, error } = await supabase
    .from('runs')
    .select(`
      *,
      repositories (title, owner_id)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })

  if (error) throw error
  return (data || []).map((d: Run & { repositories: { title: string; owner_id: string } }) => ({
    ...d,
    repository: d.repositories
  }))
}

export async function getMyCompletedRuns(userId: string): Promise<(Run & { repository: { title: string; owner_id: string } })[]> {
  const { data, error } = await supabase
    .from('runs')
    .select(`
      *,
      repositories (title, owner_id)
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  if (error) throw error
  return (data || []).map((d: Run & { repositories: { title: string; owner_id: string } }) => ({
    ...d,
    repository: d.repositories
  }))
}

// ============================================
// Combined Operations
// ============================================

/**
 * Start a new run from the latest commit of a repository
 */
export async function startRunFromLatestCommit(repoId: string, userId?: string): Promise<Run> {
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

  const deviceId = getDeviceId()
  const deviceName = getDeviceName()

  // Create the run with device tracking
  const run = await createRun({
    repo_id: repoId,
    commit_id: commit.id,
    progress: {},
    status: 'active',
    user_id: userId,
    device_id: deviceId,
    device_name: deviceName,
  })

  // Start initial time segment for duration tracking
  await startTimeSegment(run.id)

  return run
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

// ============================================
// Time Segment Operations
// ============================================

/**
 * Start a new time segment for a run
 */
export async function startTimeSegment(runId: string): Promise<RunTimeSegment> {
  const { data, error } = await supabase
    .from('run_time_segments')
    .insert({
      run_id: runId,
      started_at: new Date().toISOString(),
      device_id: getDeviceId(),
      device_name: getDeviceName(),
    } as unknown as Record<string, unknown>)
    .select()
    .single()

  if (error) throw error
  return data as RunTimeSegment
}

/**
 * End the current active time segment for a run
 */
export async function endCurrentTimeSegment(runId: string): Promise<void> {
  const { error } = await supabase
    .from('run_time_segments')
    .update({ ended_at: new Date().toISOString() })
    .eq('run_id', runId)
    .is('ended_at', null)

  if (error) throw error
}

/**
 * Get all time segments for a run
 */
export async function getTimeSegments(runId: string): Promise<RunTimeSegment[]> {
  const { data, error } = await supabase
    .from('run_time_segments')
    .select()
    .eq('run_id', runId)
    .order('started_at', { ascending: true })

  if (error) throw error
  return (data || []) as RunTimeSegment[]
}

/**
 * Calculate total duration in milliseconds from time segments
 */
export async function calculateRunDuration(runId: string): Promise<number> {
  const segments = await getTimeSegments(runId)

  return segments.reduce((total, segment) => {
    const start = new Date(segment.started_at).getTime()
    const end = segment.ended_at
      ? new Date(segment.ended_at).getTime()
      : Date.now()
    return total + (end - start)
  }, 0)
}

// ============================================
// Pause & Resume Operations
// ============================================

/**
 * Pause an active run
 */
export async function pauseRun(id: string): Promise<Run> {
  const run = await getRun(id)
  if (!run) throw new Error('Run not found')
  if (run.status !== 'active') throw new Error('Run is not active')

  // End current time segment
  await endCurrentTimeSegment(id)

  const now = new Date().toISOString()

  return updateRun(id, {
    status: 'paused',
    paused_at: now,
    last_activity_at: now,
  })
}

/**
 * Resume a paused run
 */
export async function resumeRun(id: string): Promise<Run> {
  const run = await getRun(id)
  if (!run) throw new Error('Run not found')
  if (run.status !== 'paused') throw new Error('Run is not paused')

  // Start new time segment
  await startTimeSegment(id)

  const now = new Date().toISOString()

  return updateRun(id, {
    status: 'active',
    paused_at: null,
    last_activity_at: now,
    device_id: getDeviceId(),
    device_name: getDeviceName(),
  })
}

// ============================================
// Named Run Operations
// ============================================

/**
 * Start a new named run from the latest commit of a repository
 */
export async function startNamedRun(
  repoId: string,
  name: string,
  userId?: string,
  description?: string
): Promise<Run> {
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

  const deviceId = getDeviceId()
  const deviceName = getDeviceName()

  // Create the run
  const run = await createRun({
    repo_id: repoId,
    commit_id: commit.id,
    user_id: userId,
    name,
    description,
    progress: {},
    status: 'active',
    device_id: deviceId,
    device_name: deviceName,
  })

  // Start initial time segment
  await startTimeSegment(run.id)

  return run
}

/**
 * Update run name
 */
export async function updateRunName(id: string, name: string): Promise<Run> {
  return updateRun(id, {
    name,
    last_activity_at: new Date().toISOString(),
  })
}

/**
 * Update run notes
 */
export async function updateRunNotes(id: string, notes: string): Promise<Run> {
  return updateRun(id, {
    notes,
    last_activity_at: new Date().toISOString(),
  })
}

// ============================================
// Enhanced Query Operations
// ============================================

/**
 * Get runs with duration calculated
 */
export async function getMyRunsWithDuration(
  userId: string,
  status?: 'active' | 'paused' | 'completed' | 'archived'
): Promise<(Run & { repository: { title: string; owner_id: string }; duration_ms?: number })[]> {
  let query = supabase
    .from('runs')
    .select(`
      *,
      repositories (title, owner_id)
    `)
    .eq('user_id', userId)
    .order('last_activity_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw error

  // Calculate duration for each run
  const runsWithDuration = await Promise.all(
    (data || []).map(async (d: Run & { repositories: { title: string; owner_id: string } }) => {
      const duration_ms = await calculateRunDuration(d.id)
      return {
        ...d,
        repository: d.repositories,
        duration_ms,
      }
    })
  )

  return runsWithDuration
}

/**
 * Get paused runs for a user
 */
export async function getMyPausedRuns(userId: string): Promise<(Run & { repository: { title: string; owner_id: string } })[]> {
  const { data, error } = await supabase
    .from('runs')
    .select(`
      *,
      repositories (title, owner_id)
    `)
    .eq('user_id', userId)
    .eq('status', 'paused')
    .order('paused_at', { ascending: false })

  if (error) throw error
  return (data || []).map((d: Run & { repositories: { title: string; owner_id: string } }) => ({
    ...d,
    repository: d.repositories
  }))
}

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${seconds}s`
}
