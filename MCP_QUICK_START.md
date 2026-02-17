# MCP Quick Start Guide

## What is MCP?

Model Context Protocol (MCP) is a standard that allows AI assistants to interact with external data sources and tools. This Checklist HQ MCP server exposes your checklists to AI tools like Claude Desktop, Cursor, and Windsurf.

---

## Prerequisites

1. ✅ Checklist HQ account
2. ✅ API key generated (Settings → API Keys)
3. ✅ Claude Desktop, Cursor, or Windsurf installed

---

## Setup (5 minutes)

### Step 1: Generate API Key

1. Open Checklist HQ
2. Navigate to **Settings → API Keys**
3. Click "Generate New Key"
4. Name it (e.g., "Claude Desktop")
5. Copy the key (starts with `chq_`)

⚠️ **Important**: Save this key now! You won't be able to see it again.

---

### Step 2: Configure Claude Desktop

**macOS/Linux:**
Edit `~/.config/Claude/claude_desktop_config.json`

**Windows:**
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

**Important**:
- Replace `/absolute/path/to/checklist-hq` with your actual project path
- Replace the API key and Supabase credentials with your real values
- Use absolute paths (not `~` or `./`)

---

### Step 3: Restart Claude Desktop

1. Quit Claude Desktop completely
2. Relaunch it
3. Open a new chat

---

### Step 4: Test the Connection

Try these commands in Claude:

```
List my checklists
```

```
Show me the latest version of my deployment checklist
```

```
Create a new checklist for customer onboarding
```

If everything is working, Claude will use the MCP tools to interact with your checklists!

---

## Example Workflows

### Workflow 1: Execute a Checklist

**You:** "Start executing my 'Deploy to Production' checklist"

**Claude will:**
1. Call `list_repositories` to find your checklist
2. Call `start_run` to begin execution
3. Call `update_item` for each completed step
4. Provide real-time progress updates

---

### Workflow 2: Review a Process

**You:** "Review my onboarding checklist for gaps"

**Claude will:**
1. Use the `review_checklist` prompt
2. Analyze completeness, clarity, order
3. Suggest improvements
4. Recommend automation opportunities

---

### Workflow 3: Convert Documentation

**You:** "Convert this SOP into a checklist: [paste text]"

**Claude will:**
1. Use the `convert_to_checklist` prompt
2. Parse the text into structured steps
3. Call `create_repository` to save it
4. Return the new checklist ID

---

## Troubleshooting

### "API key is invalid"

- Check you copied the full key (no spaces)
- Verify the key hasn't been revoked in Settings
- Ensure `CHQ_API_KEY` is set in the config

### "Command not found: npx"

Install Node.js and npm:
- macOS: `brew install node`
- Windows: Download from nodejs.org
- Linux: `sudo apt install nodejs npm`

### "Module not found: @modelcontextprotocol/sdk"

Run in your project directory:
```bash
npm install @modelcontextprotocol/sdk
```

### "ENOENT: no such file or directory"

- Use absolute paths in the MCP config (not relative)
- Check the path exists: `ls /path/to/checklist-hq/src/mcp/index.ts`

### "Supabase credentials missing"

- Copy `.env` values to the MCP config
- Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

---

## Advanced: Cursor / Windsurf

The setup is similar, but each tool has its own MCP configuration location:

**Cursor:**
- Settings → Extensions → MCP
- Add server configuration (same JSON format)

**Windsurf:**
- Settings → AI → MCP Servers
- Add server configuration

---

## Security Notes

- ✅ API keys are hashed in the database (never stored in plaintext)
- ✅ Rate limited: 100 requests/minute per user
- ✅ Row-level security ensures data isolation
- ⚠️ Keep your API key secret (treat it like a password)
- ⚠️ Never commit API keys to Git

---

## What's Next?

### Explore Available Tools

Try:
```
What tools are available in Checklist HQ?
```

### Get Help

```
How do I update a checklist item?
```

### Automate Workflows

```
Execute my deployment checklist and notify me when done
```

---

**Need help?** Check the full documentation at `/src/mcp/README.md`
