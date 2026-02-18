# MCP Integration Guide

Connect AI assistants (Claude Desktop, Cursor, Windsurf) to your Checklist HQ data.

---

## What is MCP?

Model Context Protocol (MCP) lets AI assistants interact with your checklists directly. They can:
- List and search your checklists
- Start and track runs
- Create new checklists from text
- Review and analyze processes

---

## Setup (5 minutes)

### Step 1: Generate API Key

1. Open Checklist HQ
2. Go to **Settings → API Keys**
3. Click **"Generate New Key"**
4. Name it (e.g., "Claude Desktop")
5. Copy the key (starts with `chq_`)

> ⚠️ **Save this key now** - you won't see it again!

### Step 2: Configure Your AI Tool

**Claude Desktop (macOS/Linux):**
Edit `~/.config/Claude/claude_desktop_config.json`

**Claude Desktop (Windows):**
Edit `%APPDATA%\Claude\claude_desktop_config.json`

**Add this configuration:**

```json
{
  "mcpServers": {
    "checklist-hq": {
      "command": "npx",
      "args": ["-y", "tsx", "/absolute/path/to/checklist-hq/src/mcp/index.ts"],
      "env": {
        "CHQ_API_KEY": "chq_your_actual_key_here",
        "CHQ_SUPABASE_URL": "https://your-project.supabase.co",
        "CHQ_SUPABASE_ANON_KEY": "your_supabase_anon_key"
      }
    }
  }
}
```

> **Important:** Use absolute paths (not `~` or `./`)

### Step 3: Restart & Test

1. Quit your AI tool completely
2. Relaunch it
3. Try: `List my checklists`

---

## Example Workflows

### Execute a Checklist

> "Start executing my 'Deploy to Production' checklist"

Claude will:
1. Find your checklist
2. Start a new run
3. Update items as completed
4. Report progress

### Review a Process

> "Review my onboarding checklist for gaps"

Claude will:
1. Read the checklist content
2. Analyze completeness and clarity
3. Suggest improvements

### Create from Text

> "Convert this SOP into a checklist: [paste text]"

Claude will:
1. Parse the text into steps
2. Create a new repository
3. Return the checklist link

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "API key invalid" | Check you copied the full key; verify in Settings it wasn't revoked |
| "npx not found" | Install Node.js: `brew install node` (macOS) |
| "Module not found" | Run `npm install` in your project directory |
| "ENOENT error" | Use absolute path in config; verify file exists |
| "Supabase missing" | Copy values from `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

---

## Security

- ✅ API keys are hashed (never stored in plaintext)
- ✅ Rate limited: 100 requests/minute
- ✅ Row-level security enforces data isolation
- ⚠️ Keep your key secret (treat like a password)
- ⚠️ Never commit keys to Git

---

## Available Tools

Once connected, your AI assistant has access to:

- `list_repositories` - List your checklists
- `get_repository` - Get checklist details
- `list_commits` - View version history
- `start_run` - Begin execution
- `update_run_item` - Mark items complete
- `read_run_status` - Check progress
- `create_repository` - Make new checklists
- `review_checklist` - Analyze for gaps

---

*For full MCP server documentation, see `src/mcp/README.md`*
