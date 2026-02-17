# Checklist HQ MCP Server

This directory contains the Model Context Protocol (MCP) server implementation for Checklist HQ. It allows AI agents (like Claude Desktop, Cursor, Windsurf) to interact with your checklists programmatically.

## What is MCP?

Model Context Protocol is a standard for exposing data and tools to AI applications. It allows agents to:
- Read your checklists in a format optimized for LLMs
- Start new checklist runs
- Update item completion status
- Query run progress

## Resources

### `checklist://{repo_id}/latest`
- **Type:** Read-only
- **Format:** Markdown
- **Description:** Get the latest version of a checklist in agent-friendly format

### `checklist://runs/{run_id}/status`
- **Type:** Read-only
- **Format:** JSON
- **Description:** Get the current progress of a checklist execution

## Tools

### `list_repositories`
List available checklists for the user.

**Arguments:**
- `limit` (optional): Maximum number to return (default: 50)
- `query` (optional): Search query for filtering

**Returns:** Array of `{ id, title, description }`

### `start_run`
Start a new execution of a specific checklist.

**Arguments:**
- `repo_id` (required): ID of the repository to run
- `run_name` (optional): Name for the run

**Returns:** `{ run_id, message }`

### `update_item`
Mark a checklist step as complete or update its status.

**Arguments:**
- `run_id` (required): ID of the run
- `item_id` (required): ID of the checklist item
- `completed` (required): Whether the item is completed
- `note` (optional): Note about the completion
- `output` (optional): Structured output from agent execution

**Returns:** `{ success, message }`

## Setup

### For Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "checklist-hq": {
      "command": "node",
      "args": [
        "/path/to/checklist-hq/src/mcp/cli.ts",
        "--user-id",
        "YOUR_USER_ID"
      ],
      "env": {
        "VITE_SUPABASE_URL": "https://your-project.supabase.co",
        "VITE_SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}
```

### For Cursor / Windsurf

Add to your MCP settings:

```json
{
  "name": "checklist-hq",
  "type": "stdio",
  "command": "node /path/to/checklist-hq/src/mcp/cli.ts --user-id YOUR_USER_ID",
  "env": {
    "VITE_SUPABASE_URL": "https://your-project.supabase.co",
    "VITE_SUPABASE_ANON_KEY": "your-anon-key"
  }
}
```

## Getting Your User ID

1. Open Checklist HQ in your browser
2. Open browser console (F12)
3. Run: `localStorage.getItem('supabase.auth.token')`
4. Parse the JSON and find the `user.id` field

Or query Supabase directly:
```sql
SELECT id FROM auth.users WHERE email = 'your@email.com';
```

## Usage Example

Once configured, you can ask Claude Desktop:

> "List my checklists"
> "Start a run for the deployment checklist"
> "Mark item abc-123 as complete in run xyz-456"
> "What's the current status of run xyz-456?"

## Security

⚠️ **Important:** The MCP server has full access to your checklists. Only configure it with:
- Your own user ID
- Trusted AI applications
- Secure environment variables

## Development

Run the server directly for testing:

```bash
export VITE_SUPABASE_URL="https://your-project.supabase.co"
export VITE_SUPABASE_ANON_KEY="your-anon-key"
export CHECKLIST_USER_ID="your-user-id"

node src/mcp/cli.ts
```

The server runs on stdio and communicates via JSON-RPC.

## Architecture

```
src/mcp/
├── cli.ts          # Command-line entry point
├── server.ts       # MCP server implementation
├── resources.ts    # Resource handlers (read checklists, runs)
├── tools.ts        # Tool handlers (list, start, update)
├── types.ts        # TypeScript type definitions
└── README.md       # This file
```

## Troubleshooting

**Server won't start:**
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Verify your user ID is correct
- Ensure Node.js is installed and accessible

**Tools not working:**
- Verify you have access to the repositories
- Check Supabase RLS policies allow your user to access data
- Review error logs in Claude Desktop / Cursor console

**"Access denied" errors:**
- The server only allows access to repositories you own
- Check that the user ID matches your Supabase auth user

## Future Enhancements

- [ ] Support for team-owned repositories
- [ ] Webhook integration for real-time updates
- [ ] Batch operations (complete multiple items at once)
- [ ] Advanced querying (filter runs by status, date, etc.)
- [ ] Export/import checklist templates
