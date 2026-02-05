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
    const { webhookId, event, payload } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch webhook details
    const { data: webhook, error: webhookError } = await supabase
      .from("webhooks")
      .select("*")
      .eq("id", webhookId)
      .single();

    if (webhookError || !webhook) {
      throw new Error(`Webhook not found: ${webhookId}`);
    }

    if (!webhook.is_active) {
      return new Response(
        JSON.stringify({ success: false, reason: "Webhook is inactive" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if webhook subscribes to this event
    if (!webhook.events.includes(event)) {
      return new Response(
        JSON.stringify({ success: false, reason: "Event not subscribed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare payload
    const deliveryPayload = {
      id: crypto.randomUUID(),
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    };

    // Sign payload if secret exists
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Checklist-HQ/1.0",
      "X-Checklist-Event": event,
      "X-Checklist-ID": deliveryPayload.id,
    };

    if (webhook.secret) {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(deliveryPayload));
      const signature = await crypto.subtle.sign(
        "HMAC",
        await crypto.subtle.importKey("raw", encoder.encode(webhook.secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]),
        data
      );
      const signatureHex = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      headers["X-Checklist-Signature"] = `sha256=${signatureHex}`;
    }

    // Send to webhook URL
    const deliveryResponse = await fetch(webhook.url, {
      method: "POST",
      headers,
      body: JSON.stringify(deliveryPayload),
    });

    const success = deliveryResponse.ok;
    const responseBody = await deliveryResponse.text();

    // Update webhook stats
    const now = new Date().toISOString();
    if (success) {
      await supabase
        .from("webhooks")
        .update({
          last_success_at: now,
          last_triggered_at: now,
          failure_count: 0,
        })
        .eq("id", webhookId);
    } else {
      await supabase
        .from("webhooks")
        .update({
          last_failure_at: now,
          last_triggered_at: now,
          failure_count: (webhook.failure_count || 0) + 1,
        })
        .eq("id", webhookId);
    }

    return new Response(
      JSON.stringify({
        success,
        status: deliveryResponse.status,
        body: responseBody.substring(0, 500), // Truncate for logging
      }),
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
