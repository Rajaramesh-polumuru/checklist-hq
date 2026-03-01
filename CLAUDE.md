# Checklist HQ — AI Agent Guide

**Project:** Checklist HQ ("GitHub for Process")
**Description:** A version-controlled process management platform. Think Git, but the "commits" are snapshots of Standard Operating Procedures (checklists), and the "branches" are teams running those checklists with human and AI agents.

> **CRITICAL INSTRUCTION FOR AI:**
> This is NOT a standard CRUD app. It is a **Version Control System for checklists**. Edits to checklist content **must always create a new Commit** row — never update existing content in place. Read `ARCHITECTURE.md` and `DESIGN_PHILOSOPHY.md` before making significant changes.

---

## 🛠 Commands

| Command | Action | Notes |
| :--- | :--- | :--- |
| `npm run dev` | Start dev server | Vite at `http://localhost:5173` |
| `npm run build` | Production build | `tsc -b && vite build` |
| `npm run build:mcp` | Build MCP CLI | Outputs to `dist-mcp/` |
| `npm run lint` | Lint code | ESLint (stylistic + functional rules) |
| `npm run preview` | Preview build | Local production preview |
| `npm run db:push` | Push DB migrations | Runs `./scripts/push-migrations.sh` |

> **No test framework is configured.** Describe manual verification steps in PR descriptions.

---

## 🏗 Tech Stack (Actual Versions)

| Category | Library | Version |
| :--- | :--- | :--- |
| Framework | React | 19.2.0 |
| Language | TypeScript (Strict) | 5.9.3 |
| Build | Vite | 7.2.4 |
| Routing | react-router-dom | 7.13.0 |
| Styling | Tailwind CSS 4 + clsx + tailwind-merge + CVA | 4.1.18 |
| UI Primitives | Radix UI (via shadcn patterns) | Various |
| Icons | @hugeicons/react | 1.1.4 |
| Animation | framer-motion | 12.30.0 |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable | 6.3.1 / 10.0.0 |
| Toast | sonner | 2.0.7 |
| Client State | zustand | 5.0.10 |
| Backend | Supabase (PostgreSQL, Auth, RLS) | 2.93.3 |
| Local AI | @huggingface/transformers | 3.8.1 |
| MCP Server | @modelcontextprotocol/sdk | 1.26.0 |
| Onboarding | nextstepjs | 2.2.0 |
| Analytics | @vercel/speed-insights + @vercel/analytics | — |
| UUID | uuid | 13.0.0 |

---

## 📂 Project Structure (Actual)

```
checklist-hq/
├── src/
│   ├── App.tsx                  # Root router, lazy-loaded pages, auth guard
│   ├── main.tsx                 # App entry point
│   ├── index.css                # Global styles (Tailwind directives)
│   ├── fonts.css                # Font definitions (Inter, Outfit/brand)
│   ├── vite-env.d.ts
│   │
│   ├── pages/                   # Route-level page components
│   │   ├── Home.tsx             # Public landing page
│   │   ├── DashboardPage.tsx    # Authenticated user dashboard
│   │   ├── Editor.tsx           # Checklist editor (create/edit)
│   │   ├── RunMode.tsx          # Checklist execution page
│   │   ├── ViewRepository.tsx   # Public repo view (for forking)
│   │   ├── ViewVersion.tsx      # Read-only commit snapshot
│   │   ├── Explore.tsx          # Public checklist discovery
│   │   ├── Marketplace.tsx      # Agent store / public SOPs
│   │   ├── MarketplaceListing.tsx
│   │   ├── OrganizationDashboard.tsx
│   │   ├── TeamDashboard.tsx
│   │   ├── AgentsDashboard.tsx
│   │   ├── RunHistory.tsx
│   │   ├── RunAnalytics.tsx     # NOTE: Default export (only page using it)
│   │   ├── ActiveRuns.tsx
│   │   ├── Activity.tsx
│   │   ├── Profile.tsx
│   │   ├── TodosPage.tsx
│   │   ├── Login.tsx / Signup.tsx / AuthCallback.tsx / SlackCallback.tsx
│   │   └── dashboard/           # Dashboard sub-components (stats, cards, lists)
│   │
│   ├── components/
│   │   ├── ui/                  # Atomic Radix/shadcn primitives
│   │   │   ├── button.tsx, card.tsx, dialog.tsx, input.tsx, etc.
│   │   │   ├── empty-state.tsx  # Standardized empty state component
│   │   │   ├── icon.tsx         # Wrapper for @hugeicons/react
│   │   │   └── ...
│   │   ├── editor/              # Editor-specific components
│   │   ├── run/                 # Run execution components
│   │   ├── run-mode/            # Run mode UI
│   │   ├── agent/               # Agent config, cards, output viewer
│   │   ├── auth/                # Auth-specific components
│   │   ├── layout/              # Layout components (PageContainer, etc.)
│   │   ├── organization/        # Org management components
│   │   ├── team/                # Team components
│   │   ├── settings/            # Settings components
│   │   ├── marketplace/         # Marketplace components
│   │   ├── Layout.tsx           # App shell (sidebar + main content)
│   │   ├── Sidebar.tsx          # Collapsible sidebar + mobile drawer
│   │   ├── ChecklistEditor.tsx  # Core checklist edit surface
│   │   ├── ChecklistItem.tsx    # Individual item component
│   │   ├── SortableItem.tsx     # DnD-kit sortable wrapper
│   │   ├── ErrorBoundary.tsx    # React Error Boundary
│   │   ├── ErrorBanner.tsx      # Inline error display (used for save failures)
│   │   ├── VersionHistory.tsx   # Commit history list + diff view
│   │   ├── DiffView.tsx         # Item-level diff display
│   │   ├── SyncIndicator.tsx    # Auto-save status indicator
│   │   ├── Onboarding.tsx       # nextstepjs onboarding provider/tour
│   │   └── ...
│   │
│   ├── stores/                  # Zustand global client state
│   │   ├── auth-store.ts        # User, session, auth actions
│   │   ├── checklist-store.ts   # Editor state (current items, mode)
│   │   ├── theme-store.ts       # Dark/light mode preference
│   │   ├── permission-store.ts  # Cached RBAC permissions
│   │   └── agent-settings-store.ts # Agent configuration state
│   │
│   ├── services/                # Pure async functions — direct Supabase calls
│   │   ├── repository.ts        # getRepository, createRepository, forkRepo, etc.
│   │   ├── run.ts               # startRun, updateRunProgress, completeRun, etc.
│   │   ├── organization.ts      # Org CRUD
│   │   ├── team.ts              # Team CRUD, member management
│   │   ├── agent.ts             # Agent registration, execution
│   │   ├── analytics.ts         # Run analytics queries
│   │   ├── audit.ts             # Audit log writes
│   │   ├── collaboration.ts     # Real-time collaboration helpers
│   │   ├── composed-run.ts      # Hybrid human+agent run orchestration
│   │   ├── export.ts            # Export run results
│   │   ├── gdpr.ts              # GDPR data export/deletion
│   │   ├── integrations.ts      # Webhook & external integrations
│   │   ├── ipAllowlist.ts       # IP allowlist management
│   │   ├── retention.ts         # Data retention policies
│   │   ├── runNotifications.ts  # Run event notifications
│   │   ├── slack.ts             # Slack OAuth + notifications
│   │   ├── sso.ts               # SAML/SSO configuration
│   │   ├── backgroundJobs.ts    # Background job scheduling
│   │   └── activity.ts          # Activity feed
│   │
│   ├── hooks/                   # Reusable React hooks
│   │   ├── useDebounce.ts       # Debounce hook (used for auto-save)
│   │   ├── useMobile.ts         # Breakpoint detection (isMobile, isTablet, etc.)
│   │   ├── usePermissions.ts    # RBAC permission checks
│   │   ├── useRunOrchestrator.ts # Manages run execution flow
│   │   ├── useRunSync.ts        # Supabase Realtime run sync
│   │   ├── useAgentRunner.ts    # Agent step execution
│   │   ├── useLocalModel.ts     # HuggingFace local model loader
│   │   ├── useOnboarding.ts     # Onboarding tour state
│   │   ├── useCountUp.ts        # Animated number counter
│   │   ├── useLongPress.ts      # Long press gesture detection
│   │   ├── useReducedMotion.ts  # prefers-reduced-motion hook
│   │   ├── use-interaction.ts   # Generic interaction state
│   │   └── useToast.tsx         # Toast helper (wraps sonner)
│   │
│   ├── lib/                     # Utilities, constants, clients
│   │   ├── utils.ts             # cn() — clsx + tailwind-merge
│   │   ├── supabase.ts          # Supabase client singleton
│   │   ├── constants.ts         # App-wide constants
│   │   ├── cache.ts             # React Query cache helpers
│   │   ├── cachedQueries.ts     # Pre-built cached query wrappers
│   │   ├── responsive.ts        # TOUCH_TARGETS, DIALOG, container constants
│   │   ├── motion.ts            # Shared framer-motion variants
│   │   ├── date-utils.ts        # Date formatting helpers
│   │   ├── rich-text.tsx        # Rich text rendering utilities
│   │   ├── dashboard-utils.tsx  # Dashboard-specific helpers
│   │   ├── checklist-markdown.ts # Checklist ↔ Markdown conversion
│   │   └── local-model/         # HuggingFace model loading utilities
│   │
│   ├── types/
│   │   ├── database.ts          # Supabase-generated DB types
│   │   └── checklist.ts         # ChecklistContent, ChecklistItem types
│   │
│   ├── mcp/                     # MCP server (CLI, runs via stdio)
│   │   ├── index.ts             # Server entry point
│   │   ├── cli.ts               # CLI binary wrapper
│   │   ├── server.ts            # MCP server setup
│   │   ├── tools.ts             # MCP tool definitions
│   │   ├── resources.ts         # MCP resource definitions
│   │   ├── auth.ts              # API key validation
│   │   ├── validation.ts        # Input validation
│   │   ├── types.ts             # MCP-specific types
│   │   └── README.md            # MCP server documentation
│   │
│   ├── workers/                 # Web Workers (used by local AI)
│   ├── mocks/                   # Module mocks (next-navigation for nextstepjs)
│   └── design-system/           # Design system exports
│
├── supabase/
│   ├── migrations/              # Chronological SQL migrations (20240131 → 20240211)
│   └── functions/               # Supabase Edge Functions
│
├── scripts/
│   └── push-migrations.sh       # DB migration runner
│
├── public/                      # Static assets
├── dist-mcp/                    # Built MCP CLI binary
├── docs/                        # Additional documentation
│
├── ARCHITECTURE.md              # Data models, Git-for-Process algorithms, RLS
├── DESIGN_PHILOSOPHY.md         # Design tokens, accessibility, responsive rules
├── ROADMAP.md                   # Phase roadmap (Phase 4 active — Q1 2026)
├── UI_REFACTOR_ROADMAP.md       # Active UI refactor task list
├── AGENTS.md                    # Agent-specific guidelines (this sister doc)
├── GEMINI.md                    # Gemini-specific guidelines
├── MANIFESTO.md                 # Product philosophy
└── vite.config.ts               # Vite + Tailwind + chunk splitting config
```

---

## 🗺 Route Map

| Path | Page | Auth |
| :--- | :--- | :--- |
| `/` | Home | Public |
| `/explore` | Explore public checklists | Public |
| `/marketplace` | Agent store | Public |
| `/marketplace/:listingId` | Listing detail | Public |
| `/repo/:repoId` | View repository (for forking) | Public |
| `/login` / `/signup` | Auth pages | Public |
| `/auth/callback` | OAuth callback | Public |
| `/integrations/slack/callback` | Slack OAuth | Protected |
| `/app` | User dashboard | Protected |
| `/app/repo/:repoId` | Editor | Protected |
| `/app/new` | New checklist | Protected |
| `/app/run/:runId` | Run execution | Protected |
| `/app/run/start/:repoId` | Start a run | Protected |
| `/app/repo/:repoId/version/:commitId` | Read-only commit view | Protected |
| `/app/history` | Run history | Protected |
| `/app/runs` | Active runs | Protected |
| `/app/activity` | Activity feed | Protected |
| `/app/analytics` | Global analytics | Protected |
| `/app/repo/:repoId/analytics` | Per-repo analytics | Protected |
| `/app/todos` | Todos page | Protected |
| `/app/profile` | User profile | Protected |
| `/app/orgs` | Organizations list | Protected |
| `/app/orgs/new` | Create organization | Protected |
| `/app/orgs/:orgId` | Organization dashboard | Protected |
| `/app/orgs/:orgId/teams/:teamId` | Team dashboard | Protected |
| `/app/orgs/:orgId/agents` | Agents dashboard | Protected |

---

## 🧠 Coding Standards

### 1. Imports

Use the `@/` absolute alias exclusively. Organize in this order:

```typescript
// 1. External libraries
import { useEffect } from 'react'
import { motion } from 'framer-motion'

// 2. Absolute project imports
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { ChecklistItem } from '@/types/checklist'

// 3. Relative imports (only for co-located files)
import { ItemActions } from './ItemActions'
```

### 2. Component Architecture

Use **Component Composition** — avoid monolithic props:

```typescript
// Bad
<Card title="Foo" description="Bar" />

// Good
<Card.Root>
  <Card.Title>Foo</Card.Title>
  <Card.Description>Bar</Card.Description>
</Card.Root>
```

- **Named Exports only** — no default exports (exception: `RunAnalytics` page uses default for lazy loading compatibility).
- **Colocation:** keep types and helpers next to the component that uses them.

### 3. Styling (Tailwind 4)

```typescript
// ALWAYS use cn() for any conditional or merged classes
<div className={cn("flex flex-col gap-4", isActive && "bg-accent", className)}>

// Use semantic color tokens — never raw colors for semantic purposes
"bg-primary text-primary-foreground"   // ✅ CTA button
"bg-blue-500"                          // ❌ breaks dark mode

// Use design tokens — no magic numbers
"p-4 gap-6 text-sm rounded-md"        // ✅
"p-[13px]"                             // ❌
```

**Semantic color tokens:** `bg-primary`, `bg-secondary`, `bg-destructive`, `bg-muted`, `bg-accent`, `bg-card`, `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `border-input`.

### 4. State Management

| State Type | Tool | Pattern |
| :--- | :--- | :--- |
| Server data | React Query (`useQuery` / `useMutation`) | Never use `useEffect` + `useState` for server data |
| Global UI state | Zustand stores | Sidebar, editor mode, theme, permissions |
| Form state | react-hook-form + zod | Validation at the form level |
| Real-time | Supabase Realtime + React Query | See `useRunSync.ts` |

```typescript
// Service layer (pure function, no React)
// src/services/repository.ts
export async function getRepository(id: string) {
  const { data, error } = await supabase
    .from('repositories')
    .select('*, commits(id, created_at, message)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Hook layer (React Query integration)
// src/hooks/useRepository.ts
export function useRepository(id: string) {
  return useQuery({
    queryKey: ['repository', id],
    queryFn: () => getRepository(id),
    enabled: !!id,
  })
}
```

### 5. Naming Conventions

| Layer | Pattern | Example |
| :--- | :--- | :--- |
| Components | PascalCase | `ChecklistItem`, `RunCard` |
| Hooks | `use` + PascalCase | `useDebounce`, `usePermissions` |
| Services | camelCase, verb+noun | `getRepository`, `createCommit` |
| Stores | camelCase + `-store` suffix | `auth-store`, `checklist-store` |
| Mutations (hook) | `use` + Verb + Noun | `useCreateCommit`, `useForkRepo` |
| Query keys | `[noun, ...identifiers]` | `['repository', id]` |
| Types/Interfaces | PascalCase | `ChecklistItem`, `TeamMember` |
| DB types | Suffixed from DB schema | `TeamInsert`, `RunUpdate` |

### 6. Database & Backend

- **All IDs are UUIDs** (string). Never use integer IDs.
- **RLS is the security boundary.** Client-side checks are cosmetic only.
- **Commits are immutable.** Never `UPDATE` a commit's `content`. Create a new row.
- **Audit events** for all significant mutations:

```typescript
logAuditEvent({
  organizationId: team.organization_id,
  action: 'team.created',
  resourceType: 'team',
  resourceId: teamId,
  newValues: params,
}).catch(err => console.error('Audit log failed:', err))
```

- **Check session before mutations:**

```typescript
const { session } = useAuthStore.getState()
if (!session) throw new Error('Not authenticated')
```

- **Error mapping:**

```typescript
if (error.code === '23505') throw new Error('A team with this slug already exists.')
if (error.code === 'PGRST116') return null // Not found — not an error
throw error
```

### 7. Icons

```typescript
import { Settings01Icon } from '@hugeicons/core-free-icons'

// Standard sizing
<Settings01Icon className="size-4 stroke-[1.5] text-muted-foreground" />

// Icon-only buttons require aria-label
<button aria-label="Settings" className="p-2 rounded-md hover:bg-accent">
  <Settings01Icon className="size-4 stroke-[1.5]" />
</button>
```

Standard sizes: `size-4` (16px) or `size-5` (20px). Standard stroke: `stroke-[1.5]`.

### 8. Animations & Motion

```typescript
// Framer Motion for layout reorders
<motion.div layout>

// Standard CSS transitions
"transition-all duration-200 ease-in-out"

// Always respect prefers-reduced-motion
const prefersReducedMotion = useReducedMotion()
```

### 9. Responsive / Mobile-First

- Write mobile CSS first, layer desktop with `md:` / `lg:` prefixes.
- Use `useMobile()` only when **behavior** differs (not just styling).
- Touch targets: `h-11 md:h-9` (44px on mobile, 36px on desktop) — non-negotiable.
- Inputs: `text-base md:text-sm` — prevents iOS Safari zoom.

```typescript
const { isMobile } = useMobile()

// Hover actions: always visible on mobile, hover-only on desktop
onMouseEnter={() => !isMobile && setIsHovered(true)}
```

### 10. Error Handling & UX States

**Every data view must handle 3 states:**

```typescript
// Loading
<div className="h-12 rounded-md bg-muted animate-pulse" />

// Error (inline — NOT toast for data fetches)
<div className="flex items-center gap-2 p-4 rounded-md bg-destructive/10 text-destructive text-sm">
  <AlertCircle className="size-4 shrink-0" />
  <span>Failed to load. Please try again.</span>
  <Button variant="ghost" size="sm" onClick={refetch}>Retry</Button>
</div>

// Empty state
<div className="flex flex-col items-center justify-center py-10 text-center">
  <IconComponent className="size-10 text-muted-foreground mb-4" />
  <p className="text-sm font-medium">No items yet</p>
  <p className="text-sm text-muted-foreground mt-1">Create your first checklist.</p>
  <Button className="mt-4" size="sm">Create</Button>
</div>
```

**Toast (sonner) is for mutation results only:**

```typescript
toast.success("Checklist saved.")
toast.error("Failed to save changes. Please try again.")
```

**Auto-save errors use `<ErrorBanner>` (inline), not toast** — users must know their work isn't saved.

### 11. Destructive Actions

Always use `AlertDialog` for confirmation:

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Delete this checklist?</AlertDialogTitle>
    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive">Delete Checklist</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 🏛 Core Architecture: Git for Process

This is the foundational mental model. Read `ARCHITECTURE.md` for full details.

### Data Model Summary

| Table | Role | Key Rule |
| :--- | :--- | :--- |
| `repositories` | Container for a process + its history | Has `upstream_repo_id` for forks |
| `commits` | **Immutable** snapshot of checklist JSON | NEVER update. Always INSERT new row. |
| `runs` | Execution instance of a specific commit | Pinned to `commit_id` at creation |
| `run_events` | Append-only audit log for each run step | NEVER update or delete |

### The Checklist JSON Schema

```typescript
type ChecklistContent = {
  version: "1.0";
  metadata?: { estimated_duration_minutes?: number; tags?: string[] };
  items: Record<string, ChecklistItem>; // Keyed by UUID (normalized map, not array)
}

type ChecklistItem = {
  id: string;          // UUID
  text: string;
  parent: string | null; // UUID of parent (null = root)
  order: number;         // Use gaps of 100 (0, 100, 200...)
  description?: string;
  required?: boolean;
  assignee_type?: "human" | "agent" | "any";
  agent_config?: { action_type: "manual" | "browse" | "api" | "script"; ... };
}
```

Items use a **normalized map** (not an array) for O(1) lookups and clean diffs.

### Auto-Save Flow

```
User Types → Zustand (instant, no latency)
           → useDebounce (2 second wait)
           → Diff Check (compare vs. HEAD commit)
           → If changed: INSERT new commit row
           → If unchanged: do nothing
           → If fail: retry once after 3s, then show <ErrorBanner>
```

### React Query Cache Keys

| Event | Invalidate |
| :--- | :--- |
| New commit | `['commits', repoId]` |
| Run status changed | `['runs', repoId]` |
| Repository forked | `['repositories']` |
| Repository settings | `['repository', repoId]` |

---

## 🤖 MCP Server

The project includes a full **Model Context Protocol** server (`src/mcp/`) that allows AI assistants (Claude Desktop, Cursor, Windsurf) to interact with checklists programmatically.

**Build:** `npm run build:mcp` → outputs to `dist-mcp/`

**Run locally:**
```bash
export CHQ_API_KEY="chq_..."
export CHQ_SUPABASE_URL="https://..."
export CHQ_SUPABASE_ANON_KEY="..."
npx tsx src/mcp/index.ts
```

**Available MCP Tools:** `list_repositories`, `get_checklist`, `start_run`, `update_item`, `get_run_status`, `create_repository`, `commit_changes`

**Available MCP Resources:** `checklist://repos`, `checklist://repo/{id}/latest`, `checklist://repo/{id}/history`, `checklist://run/{id}/status`

See `src/mcp/README.md` for full API documentation.

---

## 📊 Current Roadmap Status

**Phase 4 (UX Polish — Q1 2026 — ACTIVE):** Core UX improvements: undo/redo, save feedback, onboarding tour, item details with Markdown, due dates.

**Phase 5 (Agent Protocol — Q2 2026):** Structured action types, agent API endpoints, proof-of-work verification.

**Phase 6 (Hybrid Teams — Q3 2026):** Mixed human+agent runs, delegation, public agent store.

**Phase 7 (Enterprise — Q4 2026):** Immutable audit logs, policy-as-code, self-hosted agents.

There is also an **active UI Refactor** (`UI_REFACTOR_ROADMAP.md`) covering responsive/mobile-first layout fixes across all pages.

---

## 📝 Key Documents

| File | Contents |
| :--- | :--- |
| `ARCHITECTURE.md` | Full data model, forking algorithm, auto-save loop, RLS policies, React Query config |
| `DESIGN_PHILOSOPHY.md` | Every design token, spacing scale, typography, responsive rules, component patterns |
| `ROADMAP.md` | Feature phases and product vision |
| `UI_REFACTOR_ROADMAP.md` | Active responsive refactor checklist and patterns |
| `AGENTS.md` | Condensed agent-specific quick reference |
| `src/mcp/README.md` | MCP server API documentation |
