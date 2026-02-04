import { supabase } from '@/lib/supabase'

// ============================================
// Types
// ============================================

export interface RunParticipant {
  id: string
  run_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  invited_by: string | null
  invited_at: string
  joined_at: string | null
  // Joined data
  user?: {
    email?: string
    full_name?: string
    avatar_url?: string
  }
}

export interface ItemAssignment {
  id: string
  run_id: string
  item_id: string
  assigned_to: string
  assigned_by: string
  assigned_at: string
  notes: string | null
  // Joined data
  assignee?: {
    email?: string
    full_name?: string
    avatar_url?: string
  }
}

export interface RunComment {
  id: string
  run_id: string
  item_id: string | null
  user_id: string
  content: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Joined data
  user?: {
    email?: string
    full_name?: string
    avatar_url?: string
  }
}

// ============================================
// Share Token Operations
// ============================================

/**
 * Generate a share token for a run
 */
export async function generateShareToken(runId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_run_share_token', {
    p_run_id: runId,
  })

  if (error) throw error
  return data as string
}

/**
 * Revoke a share token
 */
export async function revokeShareToken(runId: string): Promise<void> {
  const { error } = await supabase.rpc('revoke_run_share_token', {
    p_run_id: runId,
  })

  if (error) throw error
}

/**
 * Get run info by share token
 */
export async function getRunByShareToken(token: string): Promise<{
  id: string
  name: string | null
  repo_id: string
  status: string
  is_collaborative: boolean
} | null> {
  const { data, error } = await supabase.rpc('get_run_by_share_token', {
    p_token: token,
  })

  if (error) throw error
  return data?.[0] || null
}

/**
 * Join a run via share token
 */
export async function joinRunViaToken(token: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_run_via_token', {
    p_token: token,
  })

  if (error) throw error
  return data as string
}

/**
 * Get share link URL for a run
 */
export function getShareLinkUrl(token: string): string {
  return `${window.location.origin}/shared/run/${token}`
}

// ============================================
// Participant Operations
// ============================================

/**
 * Add a participant to a run
 */
export async function addParticipant(
  runId: string,
  userId: string,
  role: 'editor' | 'viewer' = 'editor'
): Promise<string> {
  const { data, error } = await supabase.rpc('add_run_participant', {
    p_run_id: runId,
    p_user_id: userId,
    p_role: role,
  })

  if (error) throw error
  return data as string
}

/**
 * Remove a participant from a run
 */
export async function removeParticipant(runId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('run_participants')
    .delete()
    .eq('run_id', runId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Update participant role
 */
export async function updateParticipantRole(
  runId: string,
  userId: string,
  role: 'editor' | 'viewer'
): Promise<void> {
  const { error } = await supabase
    .from('run_participants')
    .update({ role })
    .eq('run_id', runId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Get all participants for a run
 */
export async function getParticipants(runId: string): Promise<RunParticipant[]> {
  const { data, error } = await supabase
    .from('run_participants')
    .select('*')
    .eq('run_id', runId)
    .order('role', { ascending: true })
    .order('joined_at', { ascending: true })

  if (error) throw error
  return (data || []) as RunParticipant[]
}

/**
 * Check if current user is a participant
 */
export async function getMyParticipation(runId: string): Promise<RunParticipant | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('run_participants')
    .select('*')
    .eq('run_id', runId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as RunParticipant
}

// ============================================
// Item Assignment Operations
// ============================================

/**
 * Assign an item to a user
 */
export async function assignItem(
  runId: string,
  itemId: string,
  assignedTo: string,
  notes?: string
): Promise<ItemAssignment> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('run_item_assignments')
    .upsert({
      run_id: runId,
      item_id: itemId,
      assigned_to: assignedTo,
      assigned_by: user.id,
      notes,
    }, {
      onConflict: 'run_id,item_id',
    })
    .select()
    .single()

  if (error) throw error
  return data as ItemAssignment
}

/**
 * Remove an item assignment
 */
export async function unassignItem(runId: string, itemId: string): Promise<void> {
  const { error } = await supabase
    .from('run_item_assignments')
    .delete()
    .eq('run_id', runId)
    .eq('item_id', itemId)

  if (error) throw error
}

/**
 * Get all assignments for a run
 */
export async function getAssignments(runId: string): Promise<ItemAssignment[]> {
  const { data, error } = await supabase
    .from('run_item_assignments')
    .select('*')
    .eq('run_id', runId)

  if (error) throw error
  return (data || []) as ItemAssignment[]
}

/**
 * Get assignments for a specific user in a run
 */
export async function getMyAssignments(runId: string): Promise<ItemAssignment[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('run_item_assignments')
    .select('*')
    .eq('run_id', runId)
    .eq('assigned_to', user.id)

  if (error) throw error
  return (data || []) as ItemAssignment[]
}

// ============================================
// Comment Operations
// ============================================

/**
 * Add a comment to a run or item
 */
export async function addComment(
  runId: string,
  content: string,
  itemId?: string
): Promise<RunComment> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('run_comments')
    .insert({
      run_id: runId,
      item_id: itemId || null,
      user_id: user.id,
      content,
    })
    .select()
    .single()

  if (error) throw error
  return data as RunComment
}

/**
 * Update a comment
 */
export async function updateComment(commentId: string, content: string): Promise<RunComment> {
  const { data, error } = await supabase
    .from('run_comments')
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select()
    .single()

  if (error) throw error
  return data as RunComment
}

/**
 * Delete a comment (soft delete)
 */
export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('run_comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId)

  if (error) throw error
}

/**
 * Get all comments for a run
 */
export async function getComments(runId: string, itemId?: string): Promise<RunComment[]> {
  let query = supabase
    .from('run_comments')
    .select('*')
    .eq('run_id', runId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (itemId !== undefined) {
    if (itemId === null) {
      query = query.is('item_id', null)
    } else {
      query = query.eq('item_id', itemId)
    }
  }

  const { data, error } = await query

  if (error) throw error
  return (data || []) as RunComment[]
}

/**
 * Get comment count for an item
 */
export async function getCommentCount(runId: string, itemId: string): Promise<number> {
  const { count, error } = await supabase
    .from('run_comments')
    .select('*', { count: 'exact', head: true })
    .eq('run_id', runId)
    .eq('item_id', itemId)
    .is('deleted_at', null)

  if (error) throw error
  return count || 0
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if user can edit a run (owner or editor)
 */
export async function canEditRun(runId: string): Promise<boolean> {
  const participation = await getMyParticipation(runId)

  // Check if owner of the run itself
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: run } = await supabase
    .from('runs')
    .select('user_id')
    .eq('id', runId)
    .single()

  if (run?.user_id === user.id) return true

  // Check participant role
  return participation?.role === 'owner' || participation?.role === 'editor'
}

/**
 * Search users by email (for inviting)
 */
export async function searchUsersByEmail(_email: string): Promise<{
  id: string
  email: string
}[]> {
  // Note: This requires a custom function or view in Supabase
  // to search auth.users safely. For now, return empty array.
  void _email // Suppress unused variable warning
  // In production, you'd create a secure function for this.
  console.warn('searchUsersByEmail not implemented - requires custom Supabase function')
  return []
}
