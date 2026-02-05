import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SlackMessage {
  text?: string;
  blocks?: object[];
}

function buildSlackMessage(event: string, payload: any): SlackMessage {
  const { runId, runName, checklist, status, completedAt, itemsCompleted, itemsTotal } = payload;

  switch (event) {
    case "run.completed": {
      const percentage = itemsTotal > 0 ? Math.round((itemsCompleted / itemsTotal) * 100) : 0;
      return {
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "✅ Checklist Run Completed",
              emoji: true,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Checklist:*\n${checklist}`,
              },
              {
                type: "mrkdwn",
                text: `*Status:*\n${status}`,
              },
              {
                type: "mrkdwn",
                text: `*Progress:*\n${itemsCompleted}/${itemsTotal} (${percentage}%)`,
              },
              {
                type: "mrkdwn",
                text: `*Completed:*\n${new Date(completedAt).toLocaleString()}`,
              },
            ],
          },
        ],
      };
    }

    case "run.started": {
      return {
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "🚀 Checklist Run Started",
              emoji: true,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${checklist}* run has started.`,
            },
          },
        ],
      };
    }

    case "item.checked": {
      const { itemName, itemIndex } = payload;
      return {
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `✓ *${itemName}* (item ${itemIndex}) checked off in *${checklist}*`,
            },
          },
        ],
      };
    }

    default: {
      return {
        text: `Event: ${event}`,
      };
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { slackConnectionId, event, payload } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch Slack connection
    const { data: connection, error: connError } = await supabase
      .from("slack_connections")
      .select("*")
      .eq("id", slackConnectionId)
      .single();

    if (connError || !connection) {
      throw new Error(`Slack connection not found: ${slackConnectionId}`);
    }

    if (!connection.is_active) {
      return new Response(
        JSON.stringify({ success: false, reason: "Slack connection is inactive" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Slack message
    const slackMessage = buildSlackMessage(event, payload);

    // Send to Slack
    const slackResponse = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connection.bot_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: connection.slack_channel_id,
        ...slackMessage,
      }),
    });

    const slackData = await slackResponse.json();

    if (!slackData.ok) {
      // Update failure stat
      await supabase
        .from("slack_connections")
        .update({
          last_triggered_at: new Date().toISOString(),
        })
        .eq("id", slackConnectionId);

      throw new Error(`Slack API error: ${slackData.error}`);
    }

    // Update success stat
    await supabase
      .from("slack_connections")
      .update({
        last_message_at: new Date().toISOString(),
        last_triggered_at: new Date().toISOString(),
      })
      .eq("id", slackConnectionId);

    return new Response(
      JSON.stringify({
        success: true,
        slackTs: slackData.ts,
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
