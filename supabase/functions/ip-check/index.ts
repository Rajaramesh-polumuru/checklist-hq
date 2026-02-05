import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/*
 * IP-Check Edge Function
 *
 * Called by other Edge Functions (or an API gateway) to decide whether
 * an incoming request is allowed under the organisation's IP allowlist.
 *
 * Body   { organizationId: string }
 * Header X-Forwarded-For  (or falls back to the Deno request IP)
 *
 * Response  { allowed: boolean, ip: string, reason?: string }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-forwarded-for",
};

/** Extract the client IP from headers (reverse-proxy aware). */
function getClientIP(req: Request): string {
  // X-Forwarded-For may contain a comma-separated list; first entry is the client.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();

  // Fallback – Deno doesn't expose remoteAddr on Request directly in
  // production, but some runtimes set it.  Return a safe default.
  return "0.0.0.0";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { organizationId } = await req.json();
    if (!organizationId) {
      throw new Error("organizationId is required");
    }

    const clientIP = getClientIP(req);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── delegate to the PostgreSQL helper ──────────────────
    const { data, error } = await supabase.rpc("check_ip_allowed", {
      p_organization_id: organizationId,
      p_ip: clientIP,
    });

    if (error) {
      throw new Error(`DB check failed: ${error.message}`);
    }

    const allowed = data === true;

    return new Response(
      JSON.stringify({
        allowed,
        ip: clientIP,
        reason: allowed ? undefined : "IP not in organisation allowlist",
      }),
      {
        status: allowed ? 200 : 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        allowed: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
