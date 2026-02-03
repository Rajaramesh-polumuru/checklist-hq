import { supabase } from '@/lib/supabase'

// ============================================
// Types
// ============================================

export interface UserRunStats {
  total_runs: number
  completed_runs: number
  active_runs: number
  paused_runs: number
  completion_rate: number | null
  avg_duration_seconds: number | null
  total_time_spent_seconds: number
  runs_this_week: number
  runs_this_month: number
}

export interface RepoRunStats {
  total_runs: number
  completed_runs: number
  unique_users: number
  avg_completion_rate: number | null
  avg_duration_seconds: number | null
}

export interface ItemAnalytics {
  item_id: string
  item_text: string | null
  total_completions: number
  avg_completion_order: number | null
  avg_time_to_complete_seconds: number | null
}

export interface RunTemplate {
  id: string
  repo_id: string
  user_id: string
  name: string
  description: string | null
  name_pattern: string
  default_participants: string[]
  item_assignments: Record<string, string>
  use_count: number
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export interface ScheduledRun {
  id: string
  template_id: string
  user_id: string
  cron_expression: string
  timezone: string
  next_run_at: string
  last_run_at: string | null
  last_run_id: string | null
  is_active: boolean
  run_count: number
  max_runs: number | null
  created_at: string
  updated_at: string
}

// ============================================
// User Statistics
// ============================================

/**
 * Get run statistics for the current user
 */
export async function getUserRunStats(userId?: string): Promise<UserRunStats | null> {
  const { data, error } = await supabase.rpc('get_user_run_stats', {
    p_user_id: userId || null,
  })

  if (error) throw error
  return data?.[0] || null
}

/**
 * Get run statistics for a specific repository
 */
export async function getRepoRunStats(repoId: string): Promise<RepoRunStats | null> {
  const { data, error } = await supabase.rpc('get_repo_run_stats', {
    p_repo_id: repoId,
  })

  if (error) throw error
  return data?.[0] || null
}

/**
 * Get item completion analytics for a repository
 */
export async function getItemAnalytics(repoId: string): Promise<ItemAnalytics[]> {
  const { data, error } = await supabase.rpc('get_item_analytics', {
    p_repo_id: repoId,
  })

  if (error) throw error
  return (data || []) as ItemAnalytics[]
}

// ============================================
// Run Templates
// ============================================

/**
 * Get all templates for the current user
 */
export async function getTemplates(): Promise<RunTemplate[]> {
  const { data, error } = await supabase
    .from('run_templates')
    .select('*')
    .order('last_used_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as RunTemplate[]
}

/**
 * Get templates for a specific repository
 */
export async function getTemplatesForRepo(repoId: string): Promise<RunTemplate[]> {
  const { data, error } = await supabase
    .from('run_templates')
    .select('*')
    .eq('repo_id', repoId)
    .order('last_used_at', { ascending: false, nullsFirst: false })

  if (error) throw error
  return (data || []) as RunTemplate[]
}

/**
 * Get a single template by ID
 */
export async function getTemplate(templateId: string): Promise<RunTemplate | null> {
  const { data, error } = await supabase
    .from('run_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as RunTemplate
}

/**
 * Create a new run template
 */
export async function createTemplate(params: {
  repoId: string
  name: string
  description?: string
  namePattern?: string
  defaultParticipants?: string[]
  itemAssignments?: Record<string, string>
}): Promise<RunTemplate> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('run_templates')
    .insert({
      repo_id: params.repoId,
      user_id: user.id,
      name: params.name,
      description: params.description || null,
      name_pattern: params.namePattern || '{repo} - {date}',
      default_participants: params.defaultParticipants || [],
      item_assignments: params.itemAssignments || {},
    })
    .select()
    .single()

  if (error) throw error
  return data as RunTemplate
}

/**
 * Update a template
 */
export async function updateTemplate(
  templateId: string,
  updates: Partial<{
    name: string
    description: string | null
    namePattern: string
    defaultParticipants: string[]
    itemAssignments: Record<string, string>
  }>
): Promise<RunTemplate> {
  const updateData: Record<string, unknown> = {}

  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.namePattern !== undefined) updateData.name_pattern = updates.namePattern
  if (updates.defaultParticipants !== undefined) updateData.default_participants = updates.defaultParticipants
  if (updates.itemAssignments !== undefined) updateData.item_assignments = updates.itemAssignments

  const { data, error } = await supabase
    .from('run_templates')
    .update(updateData)
    .eq('id', templateId)
    .select()
    .single()

  if (error) throw error
  return data as RunTemplate
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  const { error } = await supabase
    .from('run_templates')
    .delete()
    .eq('id', templateId)

  if (error) throw error
}

/**
 * Create a run from a template
 */
export async function createRunFromTemplate(
  templateId: string,
  customName?: string
): Promise<string> {
  const { data, error } = await supabase.rpc('create_run_from_template', {
    p_template_id: templateId,
    p_run_name: customName || null,
  })

  if (error) throw error
  return data as string
}

// ============================================
// Scheduled Runs
// ============================================

/**
 * Get all scheduled runs for the current user
 */
export async function getScheduledRuns(): Promise<ScheduledRun[]> {
  const { data, error } = await supabase
    .from('scheduled_runs')
    .select('*')
    .order('next_run_at', { ascending: true })

  if (error) throw error
  return (data || []) as ScheduledRun[]
}

/**
 * Get scheduled runs for a specific template
 */
export async function getScheduledRunsForTemplate(templateId: string): Promise<ScheduledRun[]> {
  const { data, error } = await supabase
    .from('scheduled_runs')
    .select('*')
    .eq('template_id', templateId)
    .order('next_run_at', { ascending: true })

  if (error) throw error
  return (data || []) as ScheduledRun[]
}

/**
 * Create a scheduled run
 */
export async function createScheduledRun(params: {
  templateId: string
  cronExpression: string
  timezone?: string
  maxRuns?: number
}): Promise<ScheduledRun> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Calculate next run time based on cron expression
  // For now, set it to now + 1 hour as a placeholder
  // In production, you'd use a cron parser library
  const nextRunAt = new Date()
  nextRunAt.setHours(nextRunAt.getHours() + 1)

  const { data, error } = await supabase
    .from('scheduled_runs')
    .insert({
      template_id: params.templateId,
      user_id: user.id,
      cron_expression: params.cronExpression,
      timezone: params.timezone || 'UTC',
      next_run_at: nextRunAt.toISOString(),
      max_runs: params.maxRuns || null,
    })
    .select()
    .single()

  if (error) throw error
  return data as ScheduledRun
}

/**
 * Update a scheduled run
 */
export async function updateScheduledRun(
  scheduleId: string,
  updates: Partial<{
    cronExpression: string
    timezone: string
    isActive: boolean
    maxRuns: number | null
  }>
): Promise<ScheduledRun> {
  const updateData: Record<string, unknown> = {}

  if (updates.cronExpression !== undefined) updateData.cron_expression = updates.cronExpression
  if (updates.timezone !== undefined) updateData.timezone = updates.timezone
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive
  if (updates.maxRuns !== undefined) updateData.max_runs = updates.maxRuns

  const { data, error } = await supabase
    .from('scheduled_runs')
    .update(updateData)
    .eq('id', scheduleId)
    .select()
    .single()

  if (error) throw error
  return data as ScheduledRun
}

/**
 * Delete a scheduled run
 */
export async function deleteScheduledRun(scheduleId: string): Promise<void> {
  const { error } = await supabase
    .from('scheduled_runs')
    .delete()
    .eq('id', scheduleId)

  if (error) throw error
}

/**
 * Toggle scheduled run active state
 */
export async function toggleScheduledRun(scheduleId: string, isActive: boolean): Promise<ScheduledRun> {
  return updateScheduledRun(scheduleId, { isActive })
}

// ============================================
// Dashboard Statistics
// ============================================

/**
 * Get aggregated dashboard statistics for the current user
 */
export async function getDashboardStats(): Promise<{
  userStats: UserRunStats | null
  recentRuns: number
  totalTemplates: number
  activeSchedules: number
}> {
  const [
    userStatsResult,
    templatesResult,
    schedulesResult,
  ] = await Promise.all([
    getUserRunStats(),
    supabase.from('run_templates').select('*', { count: 'exact', head: true }),
    supabase.from('scheduled_runs').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])

  return {
    userStats: userStatsResult,
    recentRuns: userStatsResult?.runs_this_week || 0,
    totalTemplates: templatesResult.count || 0,
    activeSchedules: schedulesResult.count || 0,
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === 0) return '-'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

/**
 * Format completion rate to percentage string
 */
export function formatCompletionRate(rate: number | null): string {
  if (rate === null) return '-'
  return `${rate.toFixed(1)}%`
}
