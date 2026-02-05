import { supabase } from '@/lib/supabase'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface RetentionPolicy {
  id: string
  organization_id: string
  audit_log_days: number       // 0 = forever
  run_history_days: number
  job_history_days: number
  webhook_log_days: number
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface RetentionPreview {
  organization_id: string
  audit_log_days: number
  audit_logs_to_delete: number
  run_history_days: number
  runs_to_delete: number
  job_history_days: number
  jobs_to_delete: number
}

// ──────────────────────────────────────────────
// Read
// ──────────────────────────────────────────────

/** Get the retention policy for one org (null if never configured → defaults apply). */
export async function getRetentionPolicy(organizationId: string): Promise<RetentionPolicy | null> {
  const { data, error } = await supabase
    .from('retention_policies')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as RetentionPolicy
}

/** Preview how many rows the next cleanup sweep would delete. */
export async function getRetentionPreview(organizationId: string): Promise<RetentionPreview | null> {
  const { data, error } = await supabase
    .from('retention_preview')     // the VIEW we created
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as RetentionPreview
}

// ──────────────────────────────────────────────
// Write
// ──────────────────────────────────────────────

/** Create or update the policy for one org.  All fields are optional; omitted ones keep their current value. */
export async function upsertRetentionPolicy(params: {
  organizationId: string
  auditLogDays?: number
  runHistoryDays?: number
  jobHistoryDays?: number
  webhookLogDays?: number
}): Promise<RetentionPolicy> {
  // Read current to fill defaults for omitted fields
  const current = await getRetentionPolicy(params.organizationId)

  const { error } = await supabase.rpc('upsert_retention_policy', {
    p_organization_id:  params.organizationId,
    p_audit_log_days:   params.auditLogDays    ?? current?.audit_log_days    ?? 90,
    p_run_history_days: params.runHistoryDays  ?? current?.run_history_days  ?? 180,
    p_job_history_days: params.jobHistoryDays  ?? current?.job_history_days  ?? 30,
    p_webhook_log_days: params.webhookLogDays  ?? current?.webhook_log_days  ?? 60,
  })

  if (error) throw error

  // Re-read to return the full row
  return (await getRetentionPolicy(params.organizationId))!
}

// ──────────────────────────────────────────────
// Trigger cleanup manually
// ──────────────────────────────────────────────

export async function runCleanupNow(organizationId?: string): Promise<{
  summary: { organization_id: string; audit_logs_deleted: number; runs_deleted: number; jobs_deleted: number }[]
}> {
  const { data, error } = await supabase.functions.invoke('retention-cleanup', {
    body: organizationId ? { organizationId } : {},
  })

  if (error) throw error
  return data as { summary: { organization_id: string; audit_logs_deleted: number; runs_deleted: number; jobs_deleted: number }[] }
}
