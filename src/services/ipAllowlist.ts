import { supabase } from '@/lib/supabase'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface IPAllowlistEntry {
  id: string
  organization_id: string
  cidr: string          // e.g. "10.0.0.0/24"
  label: string | null  // e.g. "Corporate HQ"
  is_active: boolean
  created_by: string | null
  created_at: string
}

// ──────────────────────────────────────────────
// CRUD – entries
// ──────────────────────────────────────────────

export async function getIPAllowlist(organizationId: string): Promise<IPAllowlistEntry[]> {
  const { data, error } = await supabase
    .from('ip_allowlist')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as IPAllowlistEntry[]
}

export async function addIPEntry(params: {
  organizationId: string
  cidr: string
  label?: string
}): Promise<IPAllowlistEntry> {
  const { organizationId, cidr, label } = params

  const { data, error } = await supabase
    .from('ip_allowlist')
    .insert({
      organization_id: organizationId,
      cidr,
      label: label || null,
    })
    .select()
    .single()

  if (error) throw error
  return data as IPAllowlistEntry
}

export async function toggleIPEntry(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('ip_allowlist')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) throw error
}

export async function deleteIPEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('ip_allowlist')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ──────────────────────────────────────────────
// Enforcement toggle
// ──────────────────────────────────────────────

/** Read current enforcement state from the organisations row. */
export async function getEnforcementEnabled(organizationId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('organizations')
    .select('ip_allowlist_enabled')
    .eq('id', organizationId)
    .single()

  if (error) throw error
  return (data as { ip_allowlist_enabled: boolean })?.ip_allowlist_enabled ?? false
}

/** Toggle enforcement.  Throws if trying to enable with zero active entries. */
export async function setEnforcementEnabled(organizationId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase.rpc('set_ip_allowlist_enabled', {
    p_organization_id: organizationId,
    p_enabled: enabled,
  })
  if (error) throw error
}

// ──────────────────────────────────────────────
// Utility – fetch the caller's public IP
// ──────────────────────────────────────────────

/** Returns the current user's public-facing IP address (best-effort). */
export async function getMyPublicIP(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    const json = await res.json()
    return json.ip as string
  } catch {
    return 'unknown'
  }
}
