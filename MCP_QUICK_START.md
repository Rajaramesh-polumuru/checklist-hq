# MCP Server Quick Start Guide

## 🚀 Get Your User ID

**Option 1: Browser Console**
```javascript
// Open Checklist HQ → F12 → Console
const token = localStorage.getItem('supabase.auth.token');
const user = JSON.parse(token);
console.log(user.user.id); // Copy this!
```

**Option 2: Supabase Dashboard**
```sql
SELECT id FROM auth.users WHERE email = 'your@email.com';
```

## 🔧 Configure Claude Desktop

**Location:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "checklist-hq": {
      "command": "node",
      "args": [
        "/Users/YOU/Desktop/checklist-hq/src/mcp/cli.ts",
        "--user-id",
        "paste-your-user-id-here"
      ],
      "env": {
        "VITE_SUPABASE_URL": "https://yourproject.supabase.co",
        "VITE_SUPABASE_ANON_KEY": "your-anon-key-from-env"
      }
    }
  }
}
```

**Get Supabase credentials:**
```bash
# From your .env or .env.local file
cat /Users/YOU/Desktop/checklist-hq/.env
```

## ✅ Test It

1. Restart Claude Desktop completely (Cmd+Q, reopen)
2. Start a new conversation
3. Ask: **"List my checklists"**

If it works, you'll see your repositories!

## 🎯 Example Prompts

```
"List my checklists"
→ Shows all your repositories

"Start a run for the deployment checklist"
→ Creates a new run

"Show me the status of run abc-123"
→ Reads checklist://runs/abc-123/status

"Read the latest version of repository xyz-456"
→ Reads checklist://xyz-456/latest

"Mark item def-789 as complete in run abc-123"
→ Calls update_item tool
```

## 🐛 Troubleshooting

**Server won't start?**
```bash
# Test manually
export VITE_SUPABASE_URL="https://yourproject.supabase.co"
export VITE_SUPABASE_ANON_KEY="your-key"
export CHECKLIST_USER_ID="your-user-id"
node /Users/YOU/Desktop/checklist-hq/src/mcp/cli.ts

# Should output: "Checklist HQ MCP server running on stdio"
# Press Ctrl+C to stop
```

**"Access denied" errors?**
- Double-check your user ID matches your Supabase auth user
- Verify you own the repositories you're trying to access

**Claude doesn't see the tools?**
- Restart Claude Desktop completely (not just close the window)
- Check `~/Library/Logs/Claude/mcp*.log` for errors
- Verify the path in config points to the correct file

## 📚 Available Commands

### Resources
- `checklist://{repo_id}/latest` - Read checklist as Markdown
- `checklist://runs/{run_id}/status` - Get run progress JSON

### Tools
- `list_repositories` - List your checklists
- `start_run` - Begin a new execution
- `update_item` - Mark steps complete

## 🔒 Security Notes

- The server has **full access** to your checklists
- Only configure it with your own user ID
- Keep credentials secure (never commit to git)
- Each server instance serves one user only

## 📖 Full Documentation

See `/src/mcp/README.md` for complete API reference.
