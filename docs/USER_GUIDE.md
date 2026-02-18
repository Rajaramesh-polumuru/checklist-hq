# Checklist HQ User Guide

A complete guide to using Checklist HQ - from basic usage to advanced features.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Organizations & Teams](#2-organizations--teams)
3. [Checklists (Repositories)](#3-checklists-repositories)
4. [Running Checklists](#4-running-checklists)
5. [AI & Integrations](#5-ai--integrations)
6. [Developer Commands](#6-developer-commands)

---

## 1. Getting Started

### 1.1 Sign Up & Login

- **Standard:** Sign up via email/password at `/signup`
- **Magic Links:** Passwordless login via Supabase Auth
- **OAuth:** Sign in with Google or GitHub (if configured)

### 1.2 Creating Your First Checklist

1. Go to your dashboard
2. Click **"New Project"**
3. Choose:
   - **Blank Project** - Start with a "Hello World" template
   - **Smart Import** - Paste existing docs, let AI convert them
   - **Fork** - Copy an existing checklist

---

## 2. Organizations & Teams

### 2.1 Organizations

An organization groups teams and checklists together (e.g., "Engineering Team", "Marketing").

**Creating an Organization:**
1. Go to `/new-org`
2. Enter a name (e.g., "Engineering Team")
3. System creates a URL-friendly slug (e.g., `engineering-team`)
4. You become the **Owner**

**Organization Roles:**
| Role | Permissions |
|------|-------------|
| Owner | Full control, billing, delete organization |
| Admin | Manage settings, teams, members |
| Member | Create/edit checklists, run checklists |
| Viewer | Read-only access |

### 2.2 Teams

Teams organize members within an organization and simplify permissions.

**Creating a Team:**
1. Organization Dashboard → **Teams** tab
2. Click **"Create Team"**
3. Set name and visibility:
   - **Public** - All org members can see
   - **Private** - Only team members can see

**Team Roles:**
| Role | Permissions |
|------|-------------|
| Owner | Full team control |
| Maintainer | Manage repos, members, settings |
| Contributor | Create commits, start runs |
| Executor | Execute runs |
| Viewer | View-only access |

---

## 3. Checklists (Repositories)

Checklists in Checklist HQ work like Git repositories - every change creates an immutable snapshot (commit).

### 3.1 Creating a Checklist

1. Organization Dashboard → **New Project**
2. Choose template type
3. Enter name and description
4. Set visibility: Public / Team / Private

### 3.2 The Commit Model

**Key Principle:** Checklists are never edited in place. Every save creates a new **Commit**.

```
User edits checklist
       ↓
Local changes (draft state)
       ↓
User clicks "Save Version"
       ↓
New commit created with message
       ↓
Active runs continue on OLD commit
       ↓
New runs use NEW commit
```

This ensures:
- Historical runs are always accurate
- You can revert to any previous version
- Full audit trail of changes

### 3.3 Forking

Fork a checklist to create your own copy:

1. Open any accessible checklist
2. Click **Fork**
3. Select destination (your account or a team)
4. The fork links back to the original

Forks are independent - changes to one don't affect the other.

### 3.4 Editor Features

**Item Types:**
- **Task** - Checkable item
- **Header** - Section divider (collapsible)
- **Note** - Informational text (markdown supported)

**Actions:**
- Add items with `+` button or `Enter` key
- Drag to reorder
- Indent/outdent for hierarchy
- Add rich descriptions, code blocks, images

---

## 4. Running Checklists

### 4.1 Starting a Run

1. Open a checklist
2. Click **"Start Run"**
3. Select version (defaults to latest)
4. Optionally assign a runner

A run is tied to a specific **Commit**, not just the checklist - so historical runs always reflect what was actually executed.

### 4.2 Run Experience

- **Focused UI** - Distraction-free execution
- **Check items** - Mark as complete
- **Add notes** - Add evidence/comments to steps
- **Keyboard shortcuts:**
  - `J` / `K` - Navigate up/down
  - `Space` - Toggle completion

### 4.3 Multi-Player Runs

Multiple users can work on the same run simultaneously. You'll see real-time cursor presence and updates.

### 4.4 Sub-Runs

If an item references another checklist:
1. Click **"Spawn Sub-Run"**
2. Creates a linked child run
3. Parent item auto-completes when child finishes

### 4.5 Exporting Results

- **Markdown** - Copy to clipboard
- **PDF** - Download official record (planned)
- **Jira** - Create issues from failed runs (planned)

---

## 5. AI & Integrations

### 5.1 Smart Import

Convert existing documentation into checklists:

1. **New Project** → **Smart Import**
2. Paste text (PDF, Notion, Slack thread)
3. Select AI provider (OpenAI/Anthropic)
4. AI parses and structures the content
5. Review and adjust the hierarchy
6. Create your checklist

### 5.2 AI Agent Execution (MCP)

AI agents can execute checklists autonomously. See [MCP_GUIDE.md](./MCP_GUIDE.md) for setup.

**Available Tools:**
- `list_repositories` - Find available checklists
- `start_run` - Begin execution
- `update_run_item` - Mark progress
- `read_run_status` - Monitor status

### 5.3 Slack Integration

1. Organization Settings → **Integrations**
2. Click **"Connect Slack"**
3. Authorize with Slack

**Features:**
- Run notifications
- Completion alerts
- Failure alerts

### 5.4 Webhooks

1. Organization Settings → **Webhooks**
2. Add endpoint URL
3. Select events:
   - `run.started`
   - `run.completed`
   - `repo.updated`

---

## 6. Developer Commands

These commands are for contributors working on the Checklist HQ codebase.

### 6.1 Development

```bash
npm run dev           # Start dev server (http://localhost:5173)
npm run build         # Production build (tsc + vite)
npm run preview       # Preview production build locally
npm run lint          # Run ESLint
npm run db:push       # Push database migrations
npm run build:mcp     # Build MCP server
```

### 6.2 Architecture Overview

The codebase follows the "Git for Process" model:

| Concept | Implementation |
|---------|----------------|
| Repository | Checklist storage |
| Commit | Immutable save snapshot |
| Fork | Copy for customization |
| Run | Executing a specific commit |

### 6.3 Key Technologies

- **Frontend:** React 19, TypeScript, Tailwind CSS 4
- **State:** Zustand (client), TanStack Query (server)
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **UI:** Radix primitives, @hugeicons/react, framer-motion

---

## Security Features

### Enterprise SSO (SAML/OIDC)

Organization Settings → **Security** tab:
1. Copy ACS URL and Entity ID
2. Configure your IdP (Okta, Azure AD, Google)
3. Import IdP metadata XML
4. Set allowed domains

### IP Allowlisting

1. Organization Settings → **Security** → **IP Allowlist**
2. Enter CIDR range (e.g., `192.168.1.0/24`)
3. Requests outside this range are blocked

### API Keys

1. Organization Settings → **API Keys**
2. Click "Generate New Key"
3. Copy immediately (shown once)
4. Use in MCP or custom integrations

---

*For technical architecture details, see [ORGS_ARCHITECTURE.md](./ORGS_ARCHITECTURE.md)*
