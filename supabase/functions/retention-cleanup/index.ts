import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/*
 * Retention Cleanup Edge Function
 *
 * Designed to run on a daily cron (e.g. 02:00 UTC).
 * Reads every row in retention_policies and hard-deletes rows that have
 * exceeded the configured window.
 *
 * Body (optional)  { organizationId?: string }
 *   – If provided, only that org is cleaned.  Otherwise all orgs run.
 *
 * Returns a summary of how many rows were deleted per category.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Optional filter to a single org
  let targetOrgId: string | null = null
  try {
    const body = await req.json()
    targetOrgId = body?.organizationId ?? null
  } catch { /* no body – run all */ }

  // ── Fetch all retention policies ───────────
  let policyQuery = supabase.from("retention_policies").select("*")
  if (targetOrgId) policyQuery = policyQuery.eq("organization_id", targetOrgId)

  const { data: policies } = await policyQuery
  if (!policies || policies.length === 0) {
    return new Response(
      JSON.stringify({ summary: [], message: "No retention policies found" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  // ──────────────────────────────────────────────
  const summary: {
    organization_id: string
    audit_logs_deleted: number
    runs_deleted: number
    jobs_deleted: number
  }[] = []

  for (const policy of policies) {
    const orgId = policy.organization_id
    let auditDeleted = 0
    let runsDeleted = 0
    let jobsDeleted = 0

    // ── Audit logs ──────────────────────────
    if (policy.audit_log_days > 0) {
      const cutoff = new Date(
        Date.now() - policy.audit_log_days * 86_400_000
      ).toISOString()

      const { count, error } = await supabase
        .from("audit_logs")
        .delete({ count: true })
        .eq("organization_id", orgId)
        .lt("created_at", cutoff)

      if (!error) auditDeleted = count ?? 0
    }

    // ── Completed runs ─────────────────────
    if (policy.run_history_days > 0) {
      const cutoff = new Date(
        Date.now() - policy.run_history_days * 86_400_000
      ).toISOString()

      // First get repo IDs that belong to this org
      const { data: repos } = await supabase
        .from("repositories")
        .select("id")
        .eq("organization_id", orgId)

      const repoIds = (repos || []).map((r: { id: string }) => r.id)

      if (repoIds.length > 0) {
        const { count, error } = await supabase
          .from("runs")
          .delete({ count: true })
          .in("repo_id", repoIds)
          .eq("status", "completed")
          .lt("completed_at", cutoff)

        if (!error) runsDeleted = count ?? 0
      }
    }

    // ── Background job history ─────────────
    if (policy.job_history_days > 0) {
      const cutoff = new Date(
        Date.now() - policy.job_history_days * 86_400_000
      ).toISOString()

      // Get member user_ids for this org
      const { data: members } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", orgId)

      const userIds = (members || []).map((m: { user_id: string }) => m.user_id)

      if (userIds.length > 0) {
        const { count, error } = await supabase
          .from("background_jobs")
          .delete({ count: true })
          .in("user_id", userIds)
          .in("status", ["completed", "failed", "cancelled"])
          .lt("completed_at", cutoff)

        if (!error) jobsDeleted = count ?? 0
      }
    }

    summary.push({ organization_id: orgId, audit_logs_deleted: auditDeleted, runs_deleted: runsDeleted, jobs_deleted: jobsDeleted })
  }

  return new Response(
    JSON.stringify({ summary, ran_at: new Date().toISOString() }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  )
})
