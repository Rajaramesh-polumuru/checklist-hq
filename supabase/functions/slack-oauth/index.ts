import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { code, redirectUri, orgId, userId } = await req.json();

    if (!code) {
      throw new Error("Missing auth code");
    }

    const clientId = Deno.env.get("SLACK_CLIENT_ID");
    const clientSecret = Deno.env.get("SLACK_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // 1. Verify the user (Manual Auth Check)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      throw new Error("Invalid or expired token");
    }

    if (user.id !== userId) {
      throw new Error("User ID mismatch");
    }

    if (!clientId || !clientSecret) {
      throw new Error("Slack credentials not configured on server");
    }

    // Exchange code for token
    const formData = new FormData();
    formData.append("client_id", clientId);
    formData.append("client_secret", clientSecret);
    formData.append("code", code);
    formData.append("redirect_uri", redirectUri);

    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      body: formData,
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      throw new Error(`Slack OAuth failed: ${tokenData.error}`);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store connection
    // Note: Assuming 'slack_connections' schema matches what we need.
    // We store bot_token, team_id, user_id (installer), etc.
    
    /* 
      Expected tokenData structure for bot token:
      {
        "ok": true,
        "access_token": "xoxb-...",
        "token_type": "bot",
        "scope": "...",
        "bot_user_id": "...",
        "app_id": "...",
        "team": { "name": "...", "id": "..." },
        "enterprise": { "name": "...", "id": "..." },
        "authed_user": { "id": "...", "scope": "...", "access_token": "..." }
      }
    */

    // Incoming Webhooks logic (if scope incoming-webhook was requested, which is deprecated but common)
    // For modern apps, we use chat:write with the bot token.
    // The previous implementation seemed to expect a specific channel ID.
    // If the user didn't install to a specific channel (which they do for Incoming Webhooks), we might not get a channel ID here directly.
    // However, the `slack-notify` function expects `slack_channel_id`.
    // If we rely on `chat:write`, we need to know WHICH channel to post to.
    // The Slack OAuth flow for `chat:write` installs the app to the WORKSPACE, not a specific channel (unless using incoming webhooks).
    // If we want channel selection, we should use Incoming Webhooks or ask the user to pick a channel afterward.
    // For now, let's store what we have. If `incoming_webhook` is present, use that channel. 
    // Otherwise, we might default to 'general' or null and let user pick later.
    
    const incomingWebhook = tokenData.incoming_webhook;
    const channelId = incomingWebhook ? incomingWebhook.channel_id : null;
    const channelName = incomingWebhook ? incomingWebhook.channel : null;

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from("slack_connections")
      .select("id")
      .eq("slack_team_id", tokenData.team.id)
      .eq("organization_id", orgId) // Scoped to org
      .single();

    let result;
    if (existingConnection) {
        // Update existing
        result = await supabase
            .from("slack_connections")
            .update({
                bot_token: tokenData.access_token,
                slack_team_name: tokenData.team.name,
                slack_channel_id: channelId || 'general', // Fallback or handle null in UI
                slack_channel_name: channelName || 'general',
                user_id: userId, // The user who authorized it
                updated_at: new Date().toISOString(),
                is_active: true
            })
            .eq("id", existingConnection.id)
            .select()
            .single();
    } else {
        // Create new
        result = await supabase
            .from("slack_connections")
            .insert({
                organization_id: orgId,
                user_id: userId,
                slack_team_id: tokenData.team.id,
                slack_team_name: tokenData.team.name,
                slack_channel_id: channelId || 'general', // Fallback
                slack_channel_name: channelName || 'general',
                bot_token: tokenData.access_token,
                is_active: true
            })
            .select()
            .single();
    }

    if (result.error) {
       throw result.error;
    }

    return new Response(
      JSON.stringify({ success: true, data: result.data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
