import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/*
 * Job Processor Edge Function
 *
 * Triggered on a schedule (e.g. every 10 s via Supabase Cron or an external
 * pinger).  Picks up to `BATCH_SIZE` pending/retryable jobs, runs them, and
 * updates their status.
 *
 * Dispatchers map job.type → handler.
 * Each handler receives the raw payload and returns { success, result?, error? }.
 */

const BATCH_SIZE = 10 // how many jobs to process per invocation

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ──────────────────────────────────────────────
// Handlers
// ──────────────────────────────────────────────

type HandlerResult = { success: boolean; result?: object; error?: string }
type Handler = (payload: Record<string, unknown>, supabase: ReturnType<typeof createClient>) => Promise<HandlerResult>

/** webhook.deliver – reuse the logic from the webhook-deliver function */
async function handleWebhookDeliver(
  payload: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>
): Promise<HandlerResult> {
  const { webhookId, event, data } = payload as {
    webhookId: string; event: string; data: Record<string, unknown>
  }

  // Fetch webhook row
  const { data: webhook } = await supabase
    .from("webhooks")
    .select("*")
    .eq("id", webhookId)
    .single()

  if (!webhook || !webhook.is_active) {
    return { success: false, error: "Webhook not found or inactive" }
  }
  if (!webhook.events.includes(event)) {
    return { success: true, result: { skipped: "event not subscribed" } }
  }

  const deliveryBody = {
    id: crypto.randomUUID(),
    event,
    timestamp: new Date().toISOString(),
    data,
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Checklist-HQ/1.0",
    "X-Checklist-Event": event,
  }

  // Sign if secret present
  if (webhook.secret) {
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(webhook.secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    )
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(JSON.stringify(deliveryBody)))
    headers["X-Checklist-Signature"] =
      "sha256=" + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("")
  }

  const res = await fetch(webhook.url, {
    method: "POST",
    headers,
    body: JSON.stringify(deliveryBody),
  })

  // Update stats
  const now = new Date().toISOString()
  await supabase.from("webhooks").update(
    res.ok
      ? { last_success_at: now, last_triggered_at: now, failure_count: 0 }
      : { last_failure_at: now, last_triggered_at: now, failure_count: (webhook.failure_count || 0) + 1 }
  ).eq("id", webhookId)

  return res.ok
    ? { success: true, result: { status: res.status } }
    : { success: false, error: `HTTP ${res.status}` }
}

/** slack.notify – send a formatted message */
async function handleSlackNotify(
  payload: Record<string, unknown>,
): Promise<HandlerResult> {
  const { connectionToken, channelId, message } = payload as {
    connectionToken: string; channelId: string; message: object
  }

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${connectionToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel: channelId, ...message }),
  })

  const json = await res.json()
  return json.ok
    ? { success: true, result: { ts: json.ts } }
    : { success: false, error: `Slack: ${json.error}` }
}

/** audit.log – write an audit entry (fire-and-forget style) */
async function handleAuditLog(
  payload: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>
): Promise<HandlerResult> {
  const { error } = await supabase
    .from("audit_logs")
    .insert(payload as Record<string, unknown>)

  return error
    ? { success: false, error: error.message }
    : { success: true }
}

// ──────────────────────────────────────────────
// Dispatcher registry
// ──────────────────────────────────────────────

const HANDLERS: Record<string, Handler> = {
  "webhook.deliver": handleWebhookDeliver,
  "slack.notify":    handleSlackNotify,
  "audit.log":       handleAuditLog,
}

// ──────────────────────────────────────────────
// Main loop
// ──────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  const now = new Date().toISOString()

  // ── 1. Claim pending jobs ─────────────────
  // Pick jobs that are pending OR failed-and-due-for-retry.
  const { data: jobs } = await supabase
    .from("background_jobs")
    .select("*")
    .or(`status.eq.pending,and(status.eq.failed,next_retry_at.lte.${now})`)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE)

  if (!jobs || jobs.length === 0) {
    return new Response(
      JSON.stringify({ processed: 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  // Mark all claimed jobs as running
  const jobIds = jobs.map((j: { id: string }) => j.id)
  await supabase
    .from("background_jobs")
    .update({ status: "running", started_at: now })
    .in("id", jobIds)

  // ── 2. Process each job ───────────────────
  const results: { id: string; status: string; error?: string }[] = []

  for (const job of jobs) {
    const handler = HANDLERS[job.type]

    if (!handler) {
      // Unknown type – fail permanently
      await supabase
        .from("background_jobs")
        .update({ status: "failed", error_message: `Unknown job type: ${job.type}`, completed_at: new Date().toISOString() })
        .eq("id", job.id)
      results.push({ id: job.id, status: "failed", error: "unknown type" })
      continue
    }

    try {
      const outcome = await handler(job.payload, supabase)

      if (outcome.success) {
        await supabase
          .from("background_jobs")
          .update({ status: "completed", result: outcome.result, completed_at: new Date().toISOString() })
          .eq("id", job.id)
        results.push({ id: job.id, status: "completed" })
      } else {
        const newAttempt = (job.attempt || 0) + 1
        const exhausted = newAttempt >= (job.max_attempts || 3)

        // Exponential back-off: 10 s, 40 s, 160 s …
        const backoffMs = 10_000 * Math.pow(4, newAttempt - 1)
        const retryAt = new Date(Date.now() + backoffMs).toISOString()

        await supabase
          .from("background_jobs")
          .update({
            status: exhausted ? "failed" : "failed",
            attempt: newAttempt,
            error_message: outcome.error,
            next_retry_at: exhausted ? null : retryAt,
            completed_at: exhausted ? new Date().toISOString() : null,
          })
          .eq("id", job.id)

        results.push({ id: job.id, status: exhausted ? "failed" : "will-retry", error: outcome.error })
      }
    } catch (err) {
      // Unexpected crash – mark failed
      await supabase
        .from("background_jobs")
        .update({
          status: "failed",
          error_message: err instanceof Error ? err.message : "Unexpected error",
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id)
      results.push({ id: job.id, status: "failed", error: "crash" })
    }
  }

  return new Response(
    JSON.stringify({ processed: results.length, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  )
})
