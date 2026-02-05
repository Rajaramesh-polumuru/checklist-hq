import { supabase } from '@/lib/supabase'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type JobType =
  | 'webhook.deliver'
  | 'slack.notify'
  | 'gdpr.export'
  | 'audit.log'

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface BackgroundJob {
  id: string
  type: JobType
  payload: Record<string, unknown>
  status: JobStatus
  attempt: number
  max_attempts: number
  next_retry_at: string | null
  result: Record<string, unknown> | null
  error_message: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  user_id: string | null
}

// ──────────────────────────────────────────────
// Enqueue
// ──────────────────────────────────────────────

/**
 * Push a new job into the queue.  The `job-processor` Edge Function will
 * pick it up on its next poll cycle.
 */
export async function enqueueJob(params: {
  type: JobType
  payload: Record<string, unknown>
  maxAttempts?: number
}): Promise<string> {
  const { data, error } = await supabase.rpc('enqueue_job', {
    p_type: params.type,
    p_payload: params.payload,
    p_max_attempts: params.maxAttempts ?? 3,
  })

  if (error) throw error
  return data as string  // job UUID
}

// ──────────────────────────────────────────────
// Convenience enqueue helpers
// ──────────────────────────────────────────────

/** Enqueue a webhook delivery. */
export async function enqueueWebhookDelivery(params: {
  webhookId: string
  event: string
  data: Record<string, unknown>
}): Promise<string> {
  return enqueueJob({
    type: 'webhook.deliver',
    payload: params,
  })
}

/** Enqueue a Slack notification. */
export async function enqueueSlackNotification(params: {
  connectionToken: string
  channelId: string
  message: Record<string, unknown>
}): Promise<string> {
  return enqueueJob({
    type: 'slack.notify',
    payload: params,
  })
}

/** Enqueue an audit-log write (fire-and-forget). */
export async function enqueueAuditLog(params: Record<string, unknown>): Promise<string> {
  return enqueueJob({
    type: 'audit.log',
    payload: params,
    maxAttempts: 5,   // audit logs are important – retry more
  })
}

// ──────────────────────────────────────────────
// Query
// ──────────────────────────────────────────────

/** Get the current user's recent jobs (most recent first). */
export async function getMyJobs(params: {
  limit?: number
  status?: JobStatus
  type?: JobType
} = {}): Promise<BackgroundJob[]> {
  let query = supabase
    .from('background_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(params.limit ?? 50)

  if (params.status) query = query.eq('status', params.status)
  if (params.type)   query = query.eq('type', params.type)

  const { data, error } = await query
  if (error) throw error
  return (data || []) as BackgroundJob[]
}

/** Poll a single job until it reaches a terminal state or timeout. */
export async function pollJob(id: string): Promise<BackgroundJob> {
  const { data, error } = await supabase
    .from('background_jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as BackgroundJob
}

// ──────────────────────────────────────────────
// Cancel
// ──────────────────────────────────────────────

export async function cancelJob(id: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_job', { p_id: id })
  if (error) throw error
}

// ──────────────────────────────────────────────
// Trigger the processor (manual kick)
// ──────────────────────────────────────────────

/**
 * Manually invoke the job-processor Edge Function.
 * In production this runs on a cron schedule, but you can also
 * call it manually after enqueuing a job to get immediate processing.
 */
export async function kickProcessor(): Promise<{ processed: number }> {
  const { data, error } = await supabase.functions.invoke('job-processor', {
    body: {},
  })

  if (error) throw error
  return data as { processed: number }
}
