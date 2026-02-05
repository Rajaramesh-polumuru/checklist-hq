import { supabase } from '@/lib/supabase'

export interface Webhook {
  id: string
  url: string
  events: string[]
  is_active: boolean
  secret?: string
  last_triggered_at: string | null
  last_success_at: string | null
  last_failure_at: string | null
  failure_count: number
  created_at: string
}

export async function getWebhooks(params: {
  repoId?: string
  orgId?: string
}): Promise<Webhook[]> {
  const { repoId, orgId } = params
  let query = supabase.from('webhooks').select('*').order('created_at', { ascending: false })

  if (repoId) {
    query = query.eq('repository_id', repoId)
  } else if (orgId) {
    query = query.eq('organization_id', orgId)
  } else {
    throw new Error('Must provide repoId or orgId')
  }

  const { data, error } = await query
  if (error) throw error
  return data as Webhook[]
}

export async function createWebhook(params: {
  repoId?: string
  orgId?: string
  url: string
  events: string[]
  secret?: string
}): Promise<Webhook> {
  const { repoId, orgId, url, events, secret } = params
  
  if (!repoId && !orgId) throw new Error('Must provide repoId or orgId')

  const { data, error } = await supabase
    .from('webhooks')
    .insert({
      repository_id: repoId,
      organization_id: orgId,
      url,
      events,
      secret,
    })
    .select()
    .single()

  if (error) throw error
  return data as Webhook
}

export async function deleteWebhook(id: string): Promise<void> {
  const { error } = await supabase
    .from('webhooks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function testWebhook(id: string): Promise<{ success: boolean; status: number; body: string }> {
  // Call Edge Function to send test webhook
  const testPayload = {
    event: 'webhook.test',
    data: {
      timestamp: new Date().toISOString(),
      message: 'Test webhook delivery',
    },
  }

  try {
    const response = await supabase.functions.invoke('webhook-deliver', {
      body: {
        webhookId: id,
        event: 'webhook.test',
        payload: testPayload,
      },
    })
    
    return {
      success: response.data?.success,
      status: response.data?.status || 200,
      body: response.data?.body || 'Test sent',
    }
  } catch (err) {
    return {
      success: false,
      status: 0,
      body: err instanceof Error ? err.message : 'Failed to test webhook',
    }
  }
}
