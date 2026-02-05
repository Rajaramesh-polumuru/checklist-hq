import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── bootstrap ────────────────────────────────────────────
    const { requestId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // ── fetch the request row (service-role bypass RLS) ──────
    const { data: gdprReq, error: reqErr } = await supabase
      .from("gdpr_data_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (reqErr || !gdprReq) {
      throw new Error("GDPR request not found");
    }

    if (gdprReq.status !== "pending") {
      throw new Error(`Request is already ${gdprReq.status}`);
    }

    const userId = gdprReq.user_id;

    // ── mark processing ──────────────────────────────────────
    await supabase
      .from("gdpr_data_requests")
      .update({ status: "processing", processed_at: new Date().toISOString() })
      .eq("id", requestId);

    // ══════════════════════════════════════════════════════════
    // GATHER ALL USER DATA
    // ══════════════════════════════════════════════════════════

    // 1. Profile / auth metadata
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);

    const profile = {
      id: authUser?.id,
      email: authUser?.email,
      created_at: authUser?.created_at,
      last_sign_in_at: authUser?.last_sign_in_at,
      user_metadata: authUser?.user_metadata,
    };

    // 2. Repositories
    const { data: repositories } = await supabase
      .from("repositories")
      .select("id, title, description, is_public, created_at, updated_at")
      .eq("owner_id", userId);

    // 3. Commits (full checklist history)
    const repoIds = (repositories || []).map((r: any) => r.id);

    let commits: any[] = [];
    if (repoIds.length > 0) {
      const { data } = await supabase
        .from("commits")
        .select("*")
        .in("repository_id", repoIds)
        .order("created_at", { ascending: true });
      commits = data || [];
    }

    // 4. Runs
    let runs: any[] = [];
    if (repoIds.length > 0) {
      const { data } = await supabase
        .from("runs")
        .select("*")
        .in("repo_id", repoIds)
        .order("started_at", { ascending: false });
      runs = data || [];
    }

    // 5. Organizations the user belongs to
    const { data: orgMemberships } = await supabase
      .from("organization_members")
      .select("organization_id, role, created_at")
      .eq("user_id", userId);

    // 6. Audit logs (their own actions)
    const { data: auditLogs } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5000); // cap for size

    // 7. API keys (names / prefixes only – never hashes)
    const { data: apiKeys } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, scopes, created_at, last_used_at, revoked_at")
      .eq("user_id", userId);

    // 8. Slack connections (no tokens)
    const { data: slackConns } = await supabase
      .from("slack_connections")
      .select("id, slack_team_id, slack_team_name, slack_channel_name, is_active, created_at")
      .eq("user_id", userId);

    // ══════════════════════════════════════════════════════════
    // ASSEMBLE EXPORT BUNDLE
    // ══════════════════════════════════════════════════════════

    const bundle = {
      _meta: {
        format: "checklist-hq-gdpr-export",
        version: "1.0",
        generated_at: new Date().toISOString(),
        user_id: userId,
      },
      profile,
      repositories: repositories || [],
      commits,
      runs,
      organization_memberships: orgMemberships || [],
      audit_logs: auditLogs || [],
      api_keys: apiKeys || [],
      slack_connections: slackConns || [],
    };

    // ── store in Supabase Storage ─────────────────────────────
    const filename = `gdpr-exports/${userId}/${requestId}.json`;
    const payload = JSON.stringify(bundle, null, 2);

    const { error: uploadErr } = await supabase.storage
      .from("gdpr-exports")
      .upload(filename, payload, {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadErr) {
      throw new Error(`Upload failed: ${uploadErr.message}`);
    }

    // ── generate signed URL (24 h) ────────────────────────────
    const { data: signedUrlData, error: signErr } = await supabase.storage
      .from("gdpr-exports")
      .createSignedUrl(filename, 86400); // 24 hours

    if (signErr || !signedUrlData) {
      throw new Error("Failed to generate download URL");
    }

    const expiresAt = new Date(Date.now() + 86400 * 1000).toISOString();

    // ── mark completed ────────────────────────────────────────
    await supabase
      .from("gdpr_data_requests")
      .update({
        status: "completed",
        download_url: signedUrlData.signedUrl,
        download_expires_at: expiresAt,
        completed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    return new Response(
      JSON.stringify({ success: true, downloadUrl: signedUrlData.signedUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    // ══════════════════════════════════════════════════════════
  } catch (error) {
    // ── mark failed ───────────────────────────────────────────
    try {
      const supabase2 = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      // best-effort update – requestId may not be in scope if parsing failed
      const { requestId: rid } = await (async () => {
        try { return JSON.parse(await new Request(req).text()); } catch { return {}; }
      })();
      if (rid) {
        await supabase2
          .from("gdpr_data_requests")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
          })
          .eq("id", rid);
      }
    } catch { /* swallow */ }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
