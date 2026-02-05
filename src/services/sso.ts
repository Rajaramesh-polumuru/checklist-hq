import { supabase } from '@/lib/supabase'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface SSOConfiguration {
  id: string
  organization_id: string
  supabase_provider_id: string | null
  idp_entity_id: string
  idp_sso_url: string
  idp_certificate: string
  domains: string[]
  is_active: boolean
  is_verified: boolean
  configured_by: string | null
  created_at: string
  updated_at: string
}

export interface SSODomainLookup {
  organization_id: string
  organization_name: string
  supabase_provider_id: string | null
  is_active: boolean
}

// ──────────────────────────────────────────────
// CRUD – org admin panel
// ──────────────────────────────────────────────

/** Get the SSO config for one org (null if none). */
export async function getSSOConfig(organizationId: string): Promise<SSOConfiguration | null> {
  const { data, error } = await supabase
    .from('sso_configurations')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw error
  }
  return data as SSOConfiguration
}

/** Create or replace the SSO config for an org. */
export async function upsertSSOConfig(params: {
  organizationId: string
  idpEntityId: string
  idpSsoUrl: string
  idpCertificate: string
  domains: string[]
}): Promise<SSOConfiguration> {
  const { organizationId, idpEntityId, idpSsoUrl, idpCertificate, domains } = params

  // Normalise domains: lowercase, strip leading dots / whitespace
  const cleanDomains = domains
    .map(d => d.trim().toLowerCase().replace(/^\./, ''))
    .filter(Boolean)

  if (cleanDomains.length === 0) {
    throw new Error('At least one email domain is required.')
  }

  const row = {
    organization_id: organizationId,
    idp_entity_id: idpEntityId,
    idp_sso_url: idpSsoUrl,
    idp_certificate: idpCertificate,
    domains: cleanDomains,
    is_active: true,           // optimistic; Edge Fn can flip to false on sync failure
    updated_at: new Date().toISOString(),
  }

  // upsert on organization_id unique constraint
  const { data, error } = await supabase
    .from('sso_configurations')
    .upsert(row, { onConflict: 'organization_id' })
    .select()
    .single()

  if (error) throw error
  return data as SSOConfiguration
}

/** Delete (disable) the SSO config for an org. */
export async function deleteSSOConfig(organizationId: string): Promise<void> {
  const { error } = await supabase
    .from('sso_configurations')
    .delete()
    .eq('organization_id', organizationId)

  if (error) throw error
}

// ──────────────────────────────────────────────
// Login-page helper – domain lookup
// ──────────────────────────────────────────────

/**
 * Given an email, check whether its domain has an active SSO provider.
 * Returns the lookup result or null.
 */
export async function lookupSSOByEmail(email: string): Promise<SSODomainLookup | null> {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null

  const { data, error } = await supabase.rpc('get_sso_by_domain', { p_domain: domain })
  if (error) return null
  return (data as SSODomainLookup[])?.[0] ?? null
}

// ──────────────────────────────────────────────
// Trigger the actual SSO login
// ──────────────────────────────────────────────

/**
 * Kick off a SAML login.  `providerId` is the Supabase SAML provider UUID.
 * After this call the browser navigates away to the IdP.
 */
export async function signInWithSSO(providerId: string): Promise<void> {
  const { error } = await supabase.auth.signInWithSSO({
    providerId,
  })
  if (error) throw error
  // Supabase redirects the browser; this line is only reached on error.
}
