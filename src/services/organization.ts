import { supabase } from '@/lib/supabase'
import { logAuditEvent } from '@/services/audit'
import type { Organization, OrganizationMember, Team } from '@/types/database'

import { useAuthStore } from '@/stores/auth-store'

/**
 * OrganizationMember with user details joined
 */
export interface OrganizationMemberWithUser extends OrganizationMember {
  user: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
      name?: string
    }
  }
}

/**
 * Create a new organization using the RPC function.
 * This automatically adds the current user as the owner.
 */
export async function createOrganization(params: {
  name: string
  slug: string
  description?: string | null
}): Promise<string> {
  const { name, slug, description } = params
  
  const { session } = useAuthStore.getState()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase.rpc('create_organization', {
    p_name: name,
    p_slug: slug,
    p_description: description ?? null,
  })

  if (error) {
    // Handle specific error cases
    if (error.code === '23505') {
      throw new Error('An organization with this slug already exists. Please choose a different one.')
    }
    if (error.message.includes('Invalid slug format')) {
      throw new Error('Invalid slug format. Use lowercase letters, numbers, and hyphens only.')
    }
    throw error
  }

  const orgId = data as string
  
  // Log audit event
  logAuditEvent({
    organizationId: orgId,
    action: 'organization.created',
    resourceType: 'organization',
    resourceId: orgId,
    newValues: { name, slug, description },
  }).catch((err: any) => console.error('Audit log failed:', err))

  return orgId
}

/**
 * Get an organization by ID
 */
export async function getOrganization(id: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select()
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data as Organization
}

/**
 * Get an organization by slug
 */
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select()
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data as Organization
}

/**
 * Get organizations for the current user
 */
export async function getMyOrganizations(): Promise<(Organization & { role: string })[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      role,
      organizations (*)
    `)

  if (error) throw error

  // Transform the data to include role with organization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((m: any) => ({
    ...m.organizations,
    role: m.role,
  })) as (Organization & { role: string })[]
}

/**
 * Get organization members
 * Note: auth.users is not directly accessible via PostgREST.
 * To get user profiles, create a profiles table with a trigger on auth.users.
 */
export async function getOrganizationMembers(
  organizationId: string
): Promise<OrganizationMemberWithUser[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('*')
    .eq('organization_id', organizationId)
    .order('joined_at', { ascending: true })

  if (error) throw error

  // Return members with placeholder user data
  // TODO: Join with a profiles table when available
  return (data || []).map((item) => ({
    id: item.id,
    organization_id: item.organization_id,
    user_id: item.user_id,
    role: item.role as 'owner' | 'admin' | 'member' | 'viewer',
    invited_by: item.invited_by,
    invited_at: item.invited_at,
    joined_at: item.joined_at,
    user: {
      id: item.user_id,
      email: '', // Not available without profiles table
      user_metadata: {},
    },
  }))
}

/**
 * Update organization details
 */
export async function updateOrganization(
  id: string,
  updates: Partial<Pick<Organization, 'name' | 'description' | 'avatar_url'>>
): Promise<Organization> {

  const { session } = useAuthStore.getState()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  
  // Log audit event
  logAuditEvent({
    organizationId: id,
    action: 'organization.updated',
    resourceType: 'organization',
    resourceId: id,
    newValues: updates,
    changes: Object.keys(updates).reduce(
      (acc, key) => ({
        ...acc,
        [key]: { old: '***', new: updates[key as keyof typeof updates] },
      }),
      {}
    ),
  }).catch(err => console.error('Audit log failed:', err))
  
  return data as Organization
}

/**
 * Delete an organization (only owners can do this)
 */
export async function deleteOrganization(id: string): Promise<void> {

  const { session } = useAuthStore.getState()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', id)

  if (error) throw error
  
  // Log audit event
  logAuditEvent({
    organizationId: id,
    action: 'organization.deleted',
    resourceType: 'organization',
    resourceId: id,
  }).catch(err => console.error('Audit log failed:', err))
}

/**
 * Check if a slug is available
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single()

  if (error?.code === 'PGRST116') return true // Not found = available
  if (error) throw error
  return !data
}

/**
 * Get teams for an organization
 */
export async function getOrganizationTeams(organizationId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select()
    .eq('organization_id', organizationId)
    .order('name')

  if (error) throw error
  return (data || []) as Team[]
}

/**
 * Create a new team within an organization
 */
export async function createTeam(params: {
  organizationId: string
  name: string
  slug: string
  description?: string
  visibility?: 'visible' | 'secret'
}): Promise<string> {
  const { organizationId, name, slug, description, visibility = 'visible' } = params

  const { data, error } = await supabase.rpc('create_team', {
    p_organization_id: organizationId,
    p_name: name,
    p_slug: slug,
    p_description: description ?? null,
    p_visibility: visibility,
  })

  if (error) throw error
  return data as string // Returns the new team ID
}

/**
 * Add a member to an organization by email
 */
export async function addMemberByEmail(
  organizationId: string,
  email: string,
  role: 'admin' | 'member' | 'viewer' = 'member'
): Promise<{ success: boolean; message?: string }> {

  const { session } = useAuthStore.getState()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase.rpc('add_member_by_email', {
    p_organization_id: organizationId,
    p_email: email,
    p_role: role,
  })

  if (error) throw error
  return data as { success: boolean; message?: string }
}

/**
 * Transfer a repository to an organization
 */
export async function transferRepoToOrg(repoId: string, orgId: string): Promise<void> {
  const { error } = await supabase
    .from('repositories')
    .update({ organization_id: orgId })
    .eq('id', repoId)

  if (error) throw error
}
