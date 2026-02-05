import { supabase } from '@/lib/supabase'

export interface SlackConnection {
  id: string
  slack_team_id: string
  slack_team_name: string
  slack_channel_id: string
  slack_channel_name: string
  is_active: boolean
  last_message_at: string | null
  created_at: string
}

/**
 * Get Slack connections for user or organization
 */
export async function getSlackConnections(params: {
  userId?: string
  orgId?: string
}): Promise<SlackConnection[]> {
  const { userId, orgId } = params
  
  let query = supabase
    .from('slack_connections')
    .select('id, slack_team_id, slack_team_name, slack_channel_id, slack_channel_name, is_active, last_message_at, created_at')
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.eq('user_id', userId)
  } else if (orgId) {
    query = query.eq('organization_id', orgId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as SlackConnection[]
}

/**
 * Create a Slack connection after OAuth callback
 */
export async function createSlackConnection(params: {
  slackTeamId: string
  slackTeamName: string
  slackChannelId: string
  slackChannelName: string
  botToken: string
  organizationId?: string
}): Promise<SlackConnection> {
  const { data, error } = await supabase
    .from('slack_connections')
    .insert({
      slack_team_id: params.slackTeamId,
      slack_team_name: params.slackTeamName,
      slack_channel_id: params.slackChannelId,
      slack_channel_name: params.slackChannelName,
      bot_token: params.botToken,
      organization_id: params.organizationId,
    })
    .select()
    .single()

  if (error) throw error
  return data as SlackConnection
}

/**
 * Delete a Slack connection
 */
export async function deleteSlackConnection(id: string): Promise<void> {
  const { error } = await supabase
    .from('slack_connections')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Test a Slack connection by sending a test message
 */
export async function testSlackConnection(connectionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await supabase.functions.invoke('slack-notify', {
      body: {
        slackConnectionId: connectionId,
        event: 'test.message',
        payload: {
          checklist: 'Slack Integration Test',
          status: '✅ Connection Successful',
          completedAt: new Date().toISOString(),
          itemsCompleted: 1,
          itemsTotal: 1,
        },
      },
    })
    
    if (response.error) {
      return { success: false, error: response.error.message }
    }
    
    return { success: response.data?.success ?? true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Send a message to Slack via Edge Function
 * This would typically be called from a webhook handler or event trigger
 */
export async function sendSlackMessage(params: {
  connectionId: string
  event: string
  payload: any
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await supabase.functions.invoke('slack-notify', {
      body: {
        slackConnectionId: params.connectionId,
        event: params.event,
        payload: params.payload,
      },
    })
    
    if (response.error) {
      return { success: false, error: response.error.message }
    }
    
    return { success: response.data?.success ?? true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
