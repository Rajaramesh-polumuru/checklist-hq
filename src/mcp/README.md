## Checklist HQ MCP Server

Model Context Protocol (MCP) server for Checklist HQ. Allows AI assistants like Claude Desktop, Cursor, and Windsurf to interact with your checklists.

### Features

- **Resources**: Read-only access to repositories, commits, and run status
- **Tools**: Create, modify, and execute checklists programmatically
- **Prompts**: Pre-built templates for common AI tasks
- **Authentication**: API key-based security with user isolation

---

## Quick Start

### 1. Generate an API Key

1. Open Checklist HQ web app
2. Go to Settings → API Keys
3. Click "Generate New Key"
4. Copy the key (starts with `chq_`)

### 2. Configure Your AI Client

#### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "checklist-hq": {
      "command": "npx",
      "args": ["-y", "tsx", "/path/to/checklist-hq/src/mcp/index.ts"],
      "env": {
        "CHQ_API_KEY": "chq_your_api_key_here",
        "CHQ_SUPABASE_URL": "your_supabase_url",
        "CHQ_SUPABASE_ANON_KEY": "your_supabase_anon_key"
      }
    }
  }
}
```

#### Cursor / Windsurf

Similar configuration in their respective MCP settings.

### 3. Test the Connection

In Claude Desktop:
- Open a new chat
- Type: "List my checklists"
- Claude should call the `list_repositories` tool

---

## Available Resources

Resources provide read-only access to your data.

| URI                                  | Description                |
| :----------------------------------- | :------------------------- |
| `checklist://repos`                  | List all repositories      |
| `checklist://repo/{id}/latest`       | Latest commit (Markdown)   |
| `checklist://repo/{id}/history`      | Commit history (JSON)      |
| `checklist://run/{id}/status`        | Run progress status (JSON) |

**Example:**
```
Read checklist://repos
```

---

## Available Tools

Tools allow AI agents to modify data and execute operations.

### list_repositories

Search and filter your checklists.

**Arguments:**
- `query` (string, optional): Search filter
- `limit` (number, optional): Max results (default: 20, max: 100)
- `tag` (string, optional): Filter by tag

**Example:**
```json
{
  "query": "deployment",
  "limit": 10
}
```

---

### get_checklist

Get full checklist structure.

**Arguments:**
- `repo_id` (string, required): Repository UUID

**Returns:** Repository + latest commit content

---

### start_run

Begin executing a checklist.

**Arguments:**
- `repo_id` (string, required): Repository to execute
- `name` (string, optional): Run name/label

**Returns:** `run_id`

---

### update_item

Mark a checklist item as complete.

**Arguments:**
- `run_id` (string, required): Run UUID
- `item_id` (string, required): Item ID
- `completed` (boolean, required): Completion status
- `note` (string, optional): Completion note
- `output` (object, optional): Structured output data

**Example:**
```json
{
  "run_id": "uuid",
  "item_id": "item-1",
  "completed": true,
  "note": "Deployed successfully",
  "output": {
    "status_code": 200,
    "deployment_url": "https://app.example.com"
  }
}
```

---

### get_run_status

Check execution progress.

**Arguments:**
- `run_id` (string, required): Run UUID

**Returns:** Status, progress percentage, item details

---

### create_repository

Create a new checklist.

**Arguments:**
- `title` (string, required): Checklist title
- `description` (string, optional): Description
- `items` (object, optional): Initial checklist structure

**Returns:** `repo_id` and `commit_id`

---

### commit_changes

Update checklist structure (versioned).

**Arguments:**
- `repo_id` (string, required): Repository UUID
- `parent_commit_id` (string, required): Current HEAD commit
- `content` (string, required): JSON string of `ChecklistContent`
- `message` (string, required): Commit message

**Returns:** `commit_id`

**Important:** This uses Git-like versioning. If `parent_commit_id` doesn't match HEAD, the commit is rejected (prevents conflicts).

---

## Available Prompts

Prompts provide ready-to-use instructions for AI agents.

### execute_checklist

Full instructions for executing a checklist.

**Arguments:**
- `repo_id` (string, required)
- `run_id` (string, optional): Resume existing run

**Use Case:** "Execute my deployment checklist step-by-step"

---

### review_checklist

Get quality review instructions.

**Arguments:**
- `repo_id` (string, required)

**Use Case:** "Review my onboarding checklist for gaps"

---

### convert_to_checklist

Convert raw text into structured checklist.

**Arguments:**
- `raw_text` (string, required): SOP, documentation, etc.

**Use Case:** "Convert this process doc into a checklist"

---

## Architecture

```
┌─────────────────┐
│  AI Client      │
│ (Claude, etc.)  │
└────────┬────────┘
         │ MCP Protocol (stdio)
┌────────▼────────┐
│  MCP Server     │
│  (index.ts)     │
├─────────────────┤
│ • Resources     │ Read-only data
│ • Tools         │ Actions
│ • Prompts       │ Templates
└────────┬────────┘
         │
┌────────▼────────┐
│  Authentication │ API Key validation
│  (auth.ts)      │ User context
└────────┬────────┘
         │
┌────────▼────────┐
│  Supabase       │ PostgreSQL + RLS
│  Database       │ Multi-tenant
└─────────────────┘
```

---

## Security

### API Keys

- Stored hashed (SHA-256) in the database
- Never exposed in plaintext
- RLS policies ensure user isolation
- Automatically update `last_used` timestamp

### Rate Limiting

- 100 requests per minute per user
- In-memory tracking (upgrade to Redis for production)

### Input Validation

- All UUIDs validated
- String inputs sanitized
- Size limits enforced (e.g., search queries ≤ 200 chars)

### Row-Level Security (RLS)

- All Supabase queries respect RLS policies
- Users can only access their own data
- API keys scoped to single user

---

## Development

### Running Locally

```bash
# Set environment variables
export CHQ_API_KEY="chq_..."
export CHQ_SUPABASE_URL="https://..."
export CHQ_SUPABASE_ANON_KEY="..."

# Run via tsx
npx tsx src/mcp/index.ts
```

### Debugging

The server logs to stderr (not stdout, per MCP spec):

```bash
[MCP] Checklist HQ MCP Server starting...
[MCP] Authenticated as: user@example.com
[MCP] User ID: uuid
[MCP] Server ready and listening on stdio
[MCP] Listing resources...
[MCP] Executing tool: start_run
```

### Testing

```bash
# Test via MCP inspector
npx @modelcontextprotocol/inspector npx tsx src/mcp/index.ts
```

---

## Troubleshooting

### "CHQ_API_KEY environment variable is required"

Generate a key in the web app: Settings → API Keys

### "Invalid API key"

- Check the key is copied correctly (no extra spaces)
- Ensure the key hasn't been revoked
- Verify environment variables are set in the MCP config

### "Repository not found or access denied"

- Check the `repo_id` is correct
- Ensure the repository belongs to your user account
- Verify RLS policies are applied (Supabase dashboard)

### "Conflict: parent_commit_id does not match current HEAD"

Someone else (or another process) committed to the repository. Fetch the latest commit and retry.

---

## Roadmap

- [ ] SSE transport (in addition to stdio)
- [ ] Redis-backed rate limiting
- [ ] Webhook notifications for run completion
- [ ] Enhanced prompts with few-shot examples
- [ ] Support for organization-level API keys
- [ ] Audit log for all MCP operations

---

## License

Part of Checklist HQ. See main project LICENSE.
