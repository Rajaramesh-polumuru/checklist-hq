import { supabase } from '@/lib/supabase'
import { sendSlackMessage } from './slack'

/**
 * Trigger notifications when a run completes
 * Called from the run completion handler
 */
export async function notifyRunCompletion(params: {
  repositoryId: string
  organizationId?: string
  runId: string
  runName: string
  checklistName: string
  itemsCompleted: number
  itemsTotal: number
  completedAt: string
}) {
  const {
    repositoryId,
    organizationId,
    runId,
    runName,
    checklistName,
    itemsCompleted,
    itemsTotal,
    completedAt,
  } = params

  try {
    // 1. Find and trigger webhooks
    const webhookFilter = organizationId ?
      { organization_id: organizationId } :
      { repository_id: repositoryId }

    const { data: webhooks } = await supabase
      .from('webhooks')
      .select('*')
      .match(webhookFilter)
      .eq('is_active', true)

    if (webhooks && webhooks.length > 0) {
      const payload = {
        runId,
        runName,
        checklist: checklistName,
        status: 'completed',
        completedAt,
        itemsCompleted,
        itemsTotal,
      }

      // Trigger webhook delivery for each webhook
      for (const webhook of webhooks) {
        if (webhook.events.includes('run.completed')) {
          // Call Edge Function asynchronously (fire and forget)
          supabase.functions.invoke('webhook-deliver', {
            body: {
              webhookId: webhook.id,
              event: 'run.completed',
              payload,
            },
          }).catch(err => console.error('Webhook delivery failed:', err))
        }
      }
    }

    // 2. Find and trigger Slack notifications
    const { data: slackNotifs } = await supabase
      .from('slack_notifications')
      .select('*, slack_connections!inner(*)')
      .match({
        ...(organizationId ? { organization_id: organizationId } : { repository_id: repositoryId }),
        is_active: true,
      })

    if (slackNotifs && slackNotifs.length > 0) {
      const slackPayload = {
        runId,
        runName,
        checklist: checklistName,
        status: 'completed',
        completedAt,
        itemsCompleted,
        itemsTotal,
      }

      for (const notif of (slackNotifs as any[])) {
        if (notif.slack_connections?.is_active && notif.events?.includes('run.completed')) {
          await sendSlackMessage({
            connectionId: notif.slack_connection_id,
            event: 'run.completed',
            payload: slackPayload,
          }).catch(err => console.error('Slack notification failed:', err))
        }
      }
    }
  } catch (err) {
    console.error('Error sending notifications:', err)
  }
}

/**
 * Trigger notifications when a run starts
 */
export async function notifyRunStart(params: {
  repositoryId: string
  organizationId?: string
  runId: string
  runName: string
  checklistName: string
  startedAt: string
}) {
  const {
    repositoryId,
    organizationId,
    runId,
    runName,
    checklistName,
    startedAt,
  } = params

  try {
    // Webhooks
    const webhookFilter = organizationId ?
      { organization_id: organizationId } :
      { repository_id: repositoryId }

    const { data: webhooks } = await supabase
      .from('webhooks')
      .select('*')
      .match(webhookFilter)
      .eq('is_active', true)

    if (webhooks && webhooks.length > 0) {
      const payload = {
        runId,
        runName,
        checklist: checklistName,
        status: 'started',
        startedAt,
      }

      for (const webhook of webhooks) {
        if (webhook.events.includes('run.started')) {
          supabase.functions.invoke('webhook-deliver', {
            body: {
              webhookId: webhook.id,
              event: 'run.started',
              payload,
            },
          }).catch(err => console.error('Webhook delivery failed:', err))
        }
      }
    }

    // Slack
    const { data: slackNotifs } = await supabase
      .from('slack_notifications')
      .select('*, slack_connections!inner(*)')
      .match({
        ...(organizationId ? { organization_id: organizationId } : { repository_id: repositoryId }),
        is_active: true,
      })

    if (slackNotifs && slackNotifs.length > 0) {
      const slackPayload = {
        runId,
        runName,
        checklist: checklistName,
        status: 'started',
        startedAt,
      }

      for (const notif of (slackNotifs as any[])) {
        if (notif.slack_connections?.is_active && notif.events?.includes('run.started')) {
          await sendSlackMessage({
            connectionId: notif.slack_connection_id,
            event: 'run.started',
            payload: slackPayload,
          }).catch(err => console.error('Slack notification failed:', err))
        }
      }
    }
  } catch (err) {
    console.error('Error sending notifications:', err)
  }
}
