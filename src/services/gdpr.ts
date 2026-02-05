import { supabase } from '@/lib/supabase'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type GdprRequestType = 'export' | 'deletion'
export type GdprRequestStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface GdprDataRequest {
  id: string
  user_id: string
  request_type: GdprRequestType
  status: GdprRequestStatus
  download_url: string | null
  download_expires_at: string | null
  error_message: string | null
  reason: string | null
  requested_at: string
  processed_at: string | null
  completed_at: string | null
}

// ──────────────────────────────────────────────
// Create requests
// ──────────────────────────────────────────────

/**
 * Submit a data-export request.
 * Returns the new request ID; the Edge Function picks it up.
 */
export async function requestDataExport(reason?: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_gdpr_request', {
    p_request_type: 'export',
    p_reason: reason ?? null,
  })
  if (error) throw error
  return data as string
}

/**
 * Submit an account-deletion request.
 * The Edge Function / admin flow handles the actual wipe.
 */
export async function requestAccountDeletion(reason?: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_gdpr_request', {
    p_request_type: 'deletion',
    p_reason: reason ?? null,
  })
  if (error) throw error
  return data as string
}

/**
 * Cancel a pending request.
 */
export async function cancelGdprRequest(id: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_gdpr_request', { p_id: id })
  if (error) throw error
}

// ──────────────────────────────────────────────
// Query requests
// ──────────────────────────────────────────────

/**
 * Fetch the current user's GDPR requests (most recent first).
 */
export async function getGdprRequests(): Promise<GdprDataRequest[]> {
  const { data, error } = await supabase
    .from('gdpr_data_requests')
    .select('*')
    .order('requested_at', { ascending: false })

  if (error) throw error
  return (data || []) as GdprDataRequest[]
}

/**
 * Poll a single request until terminal state or timeout.
 * Returns the latest row.
 */
export async function pollGdprRequest(id: string): Promise<GdprDataRequest> {
  const { data, error } = await supabase
    .from('gdpr_data_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as GdprDataRequest
}

// ──────────────────────────────────────────────
// Kick off processing
// ──────────────────────────────────────────────

/**
 * Invoke the gdpr-export Edge Function for a given request.
 * Call this right after creating an export request.
 */
export async function triggerExport(requestId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('gdpr-export', {
    body: { requestId },
  })
  if (error) throw error
}
