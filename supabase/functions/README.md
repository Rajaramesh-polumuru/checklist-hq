# Checklist HQ Edge Functions

Supabase Edge Functions for webhook delivery, Slack notifications, and event handling.

## Functions Overview

### 1. `webhook-deliver`

**Purpose**: Deliver webhook payloads to registered endpoints

**Invocation**:
```typescript
await supabase.functions.invoke('webhook-deliver', {
  body: {
    webhookId: 'uuid',
    event: 'run.completed',
    payload: { /* event data */ }
  }
})
```

**Features**:
- HTTP POST to webhook URL
- Optional HMAC-SHA256 signature (if secret provided)
- Headers: `X-Checklist-Event`, `X-Checklist-ID`, `X-Checklist-Signature`
- Updates webhook stats: `last_success_at`, `failure_count`
- Event filtering: only sends if webhook subscribes to event

**Environment**:
```
SUPABASE_URL=<your-url>
SUPABASE_SERVICE_ROLE_KEY=<your-key>
```

### 2. `slack-notify`

**Purpose**: Send formatted notifications to Slack

**Invocation**:
```typescript
await supabase.functions.invoke('slack-notify', {
  body: {
    slackConnectionId: 'uuid',
    event: 'run.completed',
    payload: {
      checklist: 'My Checklist',
      status: 'completed',
      itemsCompleted: 5,
      itemsTotal: 5,
      completedAt: '2026-02-05T...'
    }
  }
})
```

**Supported Events**:
- `run.completed` - Run finished, shows progress
- `run.started` - Run initiated
- `item.checked` - Individual item completed

**Features**:
- Rich Slack Block Kit formatting
- Updates connection stats: `last_message_at`
- Handles Slack API errors gracefully
- Requires valid `slack_connections` record with `bot_token`

**Environment**:
```
SUPABASE_URL=<your-url>
SUPABASE_SERVICE_ROLE_KEY=<your-key>
```

## Deployment

### Local Development

```bash
# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Start Supabase locally
supabase start

# Deploy functions locally
supabase functions deploy webhook-deliver --no-verify-jwt
supabase functions deploy slack-notify --no-verify-jwt
```

### Production Deployment

```bash
# Link to your Supabase project
supabase link --project-ref <project-ref>

# Deploy functions
supabase functions deploy webhook-deliver
supabase functions deploy slack-notify
```

## Testing

### Test Webhook Delivery

```bash
curl -X POST http://localhost:54321/functions/v1/webhook-deliver \
  -H "Authorization: Bearer $(supabase auth get-jwt)" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookId": "your-webhook-id",
    "event": "run.completed",
    "payload": { "checklist": "Test", "status": "completed" }
  }'
```

### Test Slack Notification

```bash
curl -X POST http://localhost:54321/functions/v1/slack-notify \
  -H "Authorization: Bearer $(supabase auth get-jwt)" \
  -H "Content-Type: application/json" \
  -d '{
    "slackConnectionId": "your-connection-id",
    "event": "run.completed",
    "payload": {
      "checklist": "Daily Standup",
      "itemsCompleted": 3,
      "itemsTotal": 3,
      "completedAt": "2026-02-05T20:00:00Z"
    }
  }'
```

## Event Payload Structures

### Run Completed Event

```javascript
{
  event: 'run.completed',
  payload: {
    runId: string,
    runName: string,
    checklist: string,          // checklist name
    status: 'completed',
    completedAt: ISO8601,
    itemsCompleted: number,
    itemsTotal: number
  }
}
```

### Run Started Event

```javascript
{
  event: 'run.started',
  payload: {
    runId: string,
    runName: string,
    checklist: string,
    status: 'started',
    startedAt: ISO8601
  }
}
```

### Item Checked Event

```javascript
{
  event: 'item.checked',
  payload: {
    runId: string,
    itemName: string,
    itemIndex: number,
    checklist: string
  }
}
```

## Monitoring & Debugging

### Check Function Logs

```bash
supabase functions logs webhook-deliver
supabase functions logs slack-notify
```

### Monitor Database Stats

```sql
-- Webhook delivery stats
SELECT id, url, last_success_at, last_failure_at, failure_count 
FROM webhooks 
ORDER BY last_triggered_at DESC LIMIT 10;

-- Slack connection stats
SELECT id, slack_team_name, last_message_at 
FROM slack_connections 
ORDER BY last_message_at DESC LIMIT 10;
```

## Error Handling

Both functions return standardized error responses:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

Common errors:
- `Webhook not found` - Invalid webhookId
- `Event not subscribed` - Webhook doesn't listen to that event
- `Slack connection is inactive` - Connection disabled
- `Slack API error: ...` - Slack responded with error

## Rate Limiting

Functions currently have no built-in rate limiting. Consider adding:
- Per-webhook request throttling
- Slack API rate limit handling (120 requests/min)
- Webhook retry with exponential backoff on failure

## Future Enhancements

- [ ] Webhook delivery retry queue (on 5xx errors)
- [ ] Request timeout configuration
- [ ] Slack thread replies (keep conversation in one thread)
- [ ] Custom message templates per webhook
- [ ] Zapier/Make integration webhooks
- [ ] Email notification delivery
- [ ] Webhook signature verification on inbound requests
