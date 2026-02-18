## ChecklistHQ: Multi-Tenant Collaboration System
### Systems Architecture & Implementation Guide

***

## 1. System Purpose & Vision

**Core Goal**: Transform ChecklistHQ from a single-user "Git for Process" tool into a collaborative platform where teams execute, iterate, and automate operational procedures with AI agents.

**Key Differentiators**:
- **Version Control for Operations**: Every process change is tracked, auditable, and revertable
- **Agent-Ready Execution**: Checklists can be executed by humans OR AI agents with the same fidelity
- **Permission Granularity**: From public open-source checklists to secret executive procedures
- **Real-Time Collaboration**: Multiple team members can execute and modify procedures simultaneously

***

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  React 19 + TypeScript + Zustand + TanStack Query          │
│  (Progressive Web App with offline support)                  │
└─────────────────────────────────────────────────────────────┘
                           ↕ REST + WebSocket
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                        │
│  Next.js App Router / Hono + Rate Limiting + Auth           │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌──────────────┬──────────────┬──────────────┬───────────────┐
│   Auth       │   Core API   │  Realtime    │  Background   │
│   Service    │   Service    │  Service     │  Workers      │
│  (Supabase)  │  (Edge Fn)   │  (WebSocket) │  (Inngest)    │
└──────────────┴──────────────┴──────────────┴───────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  PostgreSQL (Supabase) + Redis (Cache) + S3 (Assets)       │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                   Analytics & Monitoring                     │
│  PostHog (Product) + Sentry (Errors) + Axiom (Logs)        │
└─────────────────────────────────────────────────────────────┘
```

***

## 3. Rethought Data Architecture

### 3.1 Core Entities (Revised)

```typescript
// ═══════════════════════════════════════════════════════════
// LAYER 1: IDENTITY & ACCESS
// ═══════════════════════════════════════════════════════════

type Organization = {
  id: string;                    // UUID
  slug: string;                  // URL-safe unique identifier
  name: string;
  avatar_url: string | null;
  
  // Ownership
  created_by: string;            // FK: auth.users.id
  
  // Configuration
  settings: {
    // Defaults
    default_repo_visibility: VisibilityLevel;
    default_team_visibility: TeamVisibility;
    
    // Features (for tiered pricing)
    features: {
      max_teams: number | null;           // null = unlimited
      max_repos: number | null;
      max_private_repos: number | null;
      ai_agent_runs_per_month: number | null;
      sso_enabled: boolean;
      audit_log_retention_days: number;
      custom_roles: boolean;
    };
    
    // Security
    require_2fa: boolean;
    allowed_email_domains: string[];     // ["@acme.com"]
    session_timeout_hours: number;
  };
  
  // Metadata
  created_at: timestamp;
  updated_at: timestamp;
  deleted_at: timestamp | null;          // Soft delete
};

type Team = {
  id: string;
  org_id: string;                        // FK: organizations.id
  slug: string;                          // Unique within org
  name: string;
  description: string | null;
  avatar_url: string | null;
  
  // Visibility
  visibility: "secret" | "private" | "public";
  
  // Permissions
  default_member_role: TeamRole;
  permissions: {
    can_create_repos: boolean;
    can_fork_external: boolean;          // Fork from other orgs
    can_make_public: boolean;
    require_approval_for_runs: boolean;  // QA/Compliance teams
  };
  
  // Metadata
  created_by: string;
  created_at: timestamp;
  updated_at: timestamp;
  archived_at: timestamp | null;
};

type TeamRole = "owner" | "maintainer" | "contributor" | "executor" | "viewer";

type TeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  
  // Invitations
  invited_by: string | null;
  invitation_accepted_at: timestamp | null;
  
  // Activity tracking
  last_active_at: timestamp;
  joined_at: timestamp;
};

type OrgMember = {
  id: string;
  org_id: string;
  user_id: string;
  role: "owner" | "admin" | "billing" | "member";
  
  // SSO mapping
  sso_identity: string | null;           // External IdP user ID
  
  joined_at: timestamp;
  last_active_at: timestamp;
};

// ═══════════════════════════════════════════════════════════
// LAYER 2: CONTENT (Git Model)
// ═══════════════════════════════════════════════════════════

type Repository = {
  id: string;
  
  // Ownership (Polymorphic)
  owner_type: "user" | "team" | "org";
  owner_id: string;                      // FK to respective table
  
  // Hierarchy context
  org_id: string | null;                 // Always set for team/org repos
  team_id: string | null;                // Set for team repos
  
  // Identity
  slug: string;                          // Unique within owner
  name: string;
  description: string | null;
  
  // Visibility & Access
  visibility: "private" | "team" | "org" | "public";
  
  // Git-like metadata
  default_branch: string;                // "main", allows branching
  upstream_repo_id: string | null;       // Parent if forked
  origin_repo_id: string | null;         // Root ancestor
  fork_count: number;                    // Denormalized for UI
  star_count: number;                    // User favorites
  
  // Stats (denormalized for performance)
  total_commits: number;
  total_runs: number;
  last_commit_at: timestamp | null;
  last_run_at: timestamp | null;
  
  // Configuration
  settings: {
    allow_forking: boolean;
    allow_public_runs: boolean;          // Show run stats publicly
    require_approval: boolean;            // All runs need approval
    auto_archive_runs_days: number;      // Clean up old runs
    
    // AI Agent config
    agent_enabled: boolean;
    agent_schedule: string | null;       // Cron expression
    agent_config: Record<string, any>;   // Agent-specific params
  };
  
  created_at: timestamp;
  updated_at: timestamp;
  archived_at: timestamp | null;
};

type Commit = {
  id: string;
  repo_id: string;
  
  // Lineage
  parent_commit_id: string | null;       // Previous version
  branch: string;                        // "main", "staging", etc.
  
  // Content (JSONB)
  content: ChecklistContent;
  content_hash: string;                  // SHA-256 for deduplication
  
  // Attribution
  author_id: string;                     // FK: auth.users.id
  author_type: "human" | "ai_agent";
  commit_message: string;
  
  // Metadata
  created_at: timestamp;
  
  // Statistics (computed from content)
  stats: {
    total_items: number;
    total_depth: number;                 // Max nesting level
    estimated_duration_minutes: number | null;
  };
};

type ChecklistContent = {
  version: "2.0";                        // Schema version
  metadata: {
    title: string;
    description: string;
    tags: string[];
    estimated_duration_minutes: number | null;
  };
  items: Record<string, ChecklistItem>;  // UUID-keyed map
  item_order: string[];                  // Root-level ordering
};

type ChecklistItem = {
  id: string;
  text: string;
  
  // Hierarchy
  parent_id: string | null;
  children: string[];                    // Ordered array of child IDs
  
  // UI State
  collapsed: boolean;
  
  // Validation
  validation: {
    type: "none" | "text_input" | "file_upload" | "approval" | "api_check";
    required: boolean;
    config: Record<string, any>;
  };
  
  // AI Agent Integration
  agent_config: {
    executable: boolean;                 // Can agent run this?
    action_type: "manual" | "browse" | "api" | "code";
    parameters: Record<string, any>;     // JSON Schema
    expected_output: Record<string, any>;
    retry_policy: {
      max_attempts: number;
      backoff_seconds: number;
    };
  } | null;
  
  // Metadata
  estimated_duration_minutes: number | null;
  created_at: timestamp;
  updated_at: timestamp;
};

// ═══════════════════════════════════════════════════════════
// LAYER 3: EXECUTION
// ═══════════════════════════════════════════════════════════

type Run = {
  id: string;
  repo_id: string;
  commit_id: string;                     // Immutable snapshot
  
  // Execution context
  runner_type: "human" | "ai_agent";
  runner_id: string;                     // User ID or agent ID
  
  // Team context
  team_id: string | null;
  org_id: string | null;
  
  // Visibility (can differ from repo)
  visibility: "private" | "team" | "org" | "public";
  
  // State
  status: "not_started" | "in_progress" | "paused" | "completed" | "failed" | "cancelled";
  
  // Progress tracking (JSONB)
  progress: {
    completed_items: Set<string>;        // Item IDs
    skipped_items: Set<string>;
    failed_items: Set<string>;
    item_results: Record<string, {
      completed_at: timestamp;
      completed_by: string;              // User or agent ID
      validation_data: any;
      notes: string | null;
      attachments: string[];             // S3 URLs
    }>;
    
    // Real-time stats
    completion_percentage: number;
    current_item_id: string | null;
  };
  
  // Metadata
  started_at: timestamp;
  completed_at: timestamp | null;
  paused_at: timestamp | null;
  
  // Assignment (for team runs)
  assigned_to: string[];                 // User IDs
  
  // Context data
  metadata: Record<string, any>;         // Custom fields per run
};

type RunEvent = {
  id: string;
  run_id: string;
  
  // Event data
  event_type: "started" | "item_completed" | "item_failed" | "paused" | "resumed" | "completed" | "cancelled" | "comment_added";
  
  item_id: string | null;                // If item-specific
  actor_id: string;                      // Who triggered
  actor_type: "human" | "ai_agent";
  
  payload: Record<string, any>;          // Event-specific data
  
  created_at: timestamp;
};

// ═══════════════════════════════════════════════════════════
// LAYER 4: COLLABORATION
// ═══════════════════════════════════════════════════════════

type RepositoryCollaborator = {
  id: string;
  repo_id: string;
  user_id: string;
  role: "admin" | "write" | "read";
  
  // Invitation
  invited_by: string;
  accepted_at: timestamp | null;
  
  added_at: timestamp;
};

type Comment = {
  id: string;
  
  // Polymorphic target
  target_type: "repo" | "commit" | "run" | "run_item";
  target_id: string;
  
  // For run item comments
  run_id: string | null;
  item_id: string | null;
  
  author_id: string;
  content: string;                       // Markdown
  
  // Threading
  parent_comment_id: string | null;
  
  created_at: timestamp;
  updated_at: timestamp;
  deleted_at: timestamp | null;
};

type Activity = {
  id: string;
  org_id: string;
  team_id: string | null;
  
  // Actor
  actor_id: string;
  actor_type: "human" | "ai_agent" | "system";
  
  // Action
  action: "repo.created" | "repo.forked" | "commit.created" | "run.started" | "run.completed" | "team.created" | "member.added" | "member.removed";
  
  // Target
  resource_type: "repo" | "commit" | "run" | "team" | "user";
  resource_id: string;
  
  // Details
  metadata: Record<string, any>;
  
  created_at: timestamp;
};

// ═══════════════════════════════════════════════════════════
// LAYER 5: SYSTEM
// ═══════════════════════════════════════════════════════════

type AuditLog = {
  id: string;
  org_id: string;
  
  actor_id: string;
  actor_ip: string;
  actor_user_agent: string;
  
  action: string;                        // Enum of all sensitive actions
  resource_type: string;
  resource_id: string;
  
  // Change tracking
  changes: {
    before: Record<string, any> | null;
    after: Record<string, any> | null;
  };
  
  // Context
  request_id: string;                    // Trace across services
  
  created_at: timestamp;
};

type Notification = {
  id: string;
  user_id: string;
  
  type: "run_completed" | "run_failed" | "mention" | "team_invite" | "repo_shared";
  
  title: string;
  message: string;
  
  // Action link
  action_url: string | null;
  
  // State
  read_at: timestamp | null;
  archived_at: timestamp | null;
  
  created_at: timestamp;
};
```

***

## 4. Data Flow Patterns

### 4.1 Feature Flow: Create Team Run (AI-Assisted)

```
USER INPUT
  │
  ├─→ POST /api/teams/:teamId/repos/:repoId/runs
  │   Body: { commit_id, runner_type: "ai_agent", metadata }
  │
  ↓
AUTHORIZATION CHECK (Edge Function)
  │
  ├─→ Check: User is team member (role >= "executor")
  ├─→ Check: Repo is accessible to team
  ├─→ Check: User has AI agent quota remaining
  │
  ↓
CREATE RUN RECORD
  │
  ├─→ Insert into runs table (status: "not_started")
  ├─→ Emit event to Redis pub/sub: "run.created"
  │
  ↓
BACKGROUND WORKER (Inngest)
  │
  ├─→ Subscribe to "run.created" event
  ├─→ Fetch commit content from DB
  ├─→ Parse checklist items with agent_config
  │
  ↓
AI AGENT ORCHESTRATION
  │
  ├─→ For each executable item:
  │   ├─→ Invoke AI agent (Claude API / OpenAI)
  │   ├─→ Execute action_type (browse, api, code)
  │   ├─→ Validate output against expected_output schema
  │   ├─→ Update run progress in DB
  │   ├─→ Emit WebSocket event: "run.item.completed"
  │   │
  │   └─→ If validation fails:
  │       ├─→ Apply retry_policy
  │       └─→ Mark item as "failed" after max_attempts
  │
  ↓
REAL-TIME UPDATES (WebSocket)
  │
  ├─→ Client subscribed to "runs/:runId"
  ├─→ Receives progress updates (item completions)
  ├─→ UI updates progress bar, highlights current item
  │
  ↓
RUN COMPLETION
  │
  ├─→ Worker marks run status: "completed"
  ├─→ Insert run_event: "completed"
  ├─→ Create notifications for assigned_to users
  ├─→ Emit analytics event to PostHog
  ├─→ Update repo.last_run_at
  │
  ↓
CLIENT NOTIFICATION
  │
  └─→ Toast: "✓ Deploy Production completed by AI Agent"
      └─→ Link to run details page
```

### 4.2 Feature Flow: Cross-Team Fork with Modifications

```
USER ACTION
  │
  ├─→ Clicks "Fork to QA Team" on Engineering's repo
  │
  ↓
FRONTEND MODAL
  │
  ├─→ Show target selection:
  │   ├─→ Personal
  │   └─→ Teams (user is maintainer of)
  │
  ├─→ User selects "QA Team"
  ├─→ User sets visibility: "team"
  │
  ↓
POST /api/repos/:repoId/fork
  │
  ├─→ Body: { target_owner_type: "team", target_owner_id, visibility }
  │
  ↓
VALIDATION LAYER
  │
  ├─→ Check: Source repo allows forking
  ├─→ Check: User is member of target team (role >= "contributor")
  ├─→ Check: Source visibility permits target visibility
  │   (e.g., can't fork secret repo to public)
  │
  ↓
TRANSACTIONAL FORK
  │
  ├─→ BEGIN TRANSACTION
  │
  ├─→ Create new repository:
  │   ├─→ owner_type: "team"
  │   ├─→ owner_id: qaTeamId
  │   ├─→ upstream_repo_id: engineeringRepoId
  │   ├─→ origin_repo_id: engineeringRepoId (or existing origin)
  │   └─→ visibility: "team"
  │
  ├─→ Copy HEAD commit content:
  │   ├─→ Fetch latest commit from source repo
  │   ├─→ Create new commit in target repo:
  │       ├─→ parent_commit_id: NULL (fresh history)
  │       ├─→ content: DEEP_CLONE(source_commit.content)
  │       ├─→ commit_message: "Forked from @engineering/deploy-prod"
  │       └─→ author_id: current_user
  │
  ├─→ Increment source repo.fork_count
  │
  ├─→ Create activity log:
  │   ├─→ action: "repo.forked"
  │   └─→ metadata: { source_repo_id, target_repo_id }
  │
  ├─→ COMMIT TRANSACTION
  │
  ↓
CACHE INVALIDATION
  │
  ├─→ Invalidate: team repos list
  ├─→ Invalidate: source repo stats
  │
  ↓
RETURN TO CLIENT
  │
  └─→ Redirect to /teams/qa/repos/:newRepoSlug
```

***

## 5. Technology Stack (Revised)

### 5.1 Frontend Architecture

| Layer | Technology | Rationale |
|:---|:---|:---|
| **Framework** | React 19 + TypeScript | Already in use, supports concurrent features [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/51475661/30923caa-8cfe-445d-a446-87c0a8f493c7/CLAUDE.md) |
| **State Management** | Zustand (UI) + TanStack Query (Server) | Existing stack, minimal re-architecture [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/51475661/30923caa-8cfe-445d-a446-87c0a8f493c7/CLAUDE.md) |
| **Styling** | Tailwind CSS 4 + Radix UI | Design system in place [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/51475661/00ed3823-c27b-4eb7-b813-0aa6bea730a2/DESIGN_PHILOSOPHY.md) |
| **Real-Time** | Supabase Realtime (WebSocket) | Built-in, no additional infra |
| **Offline Support** | TanStack Query Persist + IndexedDB | Enable runs without internet |
| **Forms** | React Hook Form + Zod | Existing pattern [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/51475661/30923caa-8cfe-445d-a446-87c0a8f493c7/CLAUDE.md) |

**New Additions**:
- **Collaboration**: Liveblocks for real-time presence ("Alex is viewing this run")
- **Rich Text**: Tiptap for markdown comments with mentions
- **Drag & Drop**: dnd-kit for reordering checklist items
- **Charts**: Recharts for team analytics dashboards

### 5.2 Backend Architecture

| Layer | Technology | Rationale |
|:---|:---|:---|
| **Primary DB** | PostgreSQL 16 (Supabase) | Existing, excellent JSONB support [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/51475661/71e86d10-7cbd-4018-b237-f1a3ee3b68fb/ARCHITECTURE.md) |
| **Cache** | Redis (Upstash) | Sub-millisecond reads for hot data |
| **Queue** | Inngest | Type-safe background jobs, retries |
| **Storage** | Supabase Storage (S3) | Run attachments, avatars |
| **Search** | PostgreSQL Full-Text + pg_trgm | Start simple, migrate to Meilisearch if needed |
| **API** | Supabase Edge Functions + Hono | Extend existing REST API |
| **Real-Time** | Supabase Realtime | WebSocket channels for live updates |

**Architecture Patterns**:
- **Event-Driven**: Emit domain events (run.started, commit.created) to Redis pub/sub
- **CQRS-Lite**: Separate read models (cached, denormalized) from write models
- **Idempotency**: All mutations accept `idempotency_key` header

### 5.3 Caching Strategy

```typescript
// Cache layers (ordered by speed)
const CACHE_STRATEGY = {
  // L1: React Query (in-memory, per-user)
  client: {
    staleTime: 5 * 60 * 1000,      // 5 minutes
    cacheTime: 30 * 60 * 1000,     // 30 minutes
  },
  
  // L2: Redis (shared, cross-user)
  redis: {
    // Hot data (frequently accessed)
    hot: {
      ttl: 60 * 60,                 // 1 hour
      keys: [
        "org:{orgId}:teams",
        "team:{teamId}:members",
        "repo:{repoId}:head",
        "user:{userId}:permissions",
      ],
    },
    
    // Warm data (occasionally accessed)
    warm: {
      ttl: 24 * 60 * 60,            // 24 hours
      keys: [
        "repo:{repoId}:commits",
        "team:{teamId}:repos",
        "org:{orgId}:activity",
      ],
    },
  },
  
  // L3: Database (source of truth)
  postgres: {
    // Use materialized views for expensive aggregations
    materializedViews: [
      "team_stats",                 // Total runs, completion rate
      "repo_fork_graph",            // Full fork network
      "user_activity_summary",
    ],
  },
};

// Cache invalidation rules
const INVALIDATION_MAP = {
  "commit.created": [
    "repo:{repoId}:head",
    "repo:{repoId}:commits",
    "team:{teamId}:activity",
  ],
  "run.completed": [
    "repo:{repoId}:stats",
    "team:{teamId}:runs:active",
    "user:{userId}:notifications",
  ],
  "member.added": [
    "team:{teamId}:members",
    "user:{userId}:teams",
    "org:{orgId}:members",
  ],
};
```

***

## 6. Permission System (RBAC + ABAC Hybrid)

### 6.1 Role Hierarchy

```typescript
// Organization Roles
const ORG_PERMISSIONS = {
  owner: ["*"],  // Full access
  admin: [
    "org.settings.update",
    "org.teams.create",
    "org.teams.delete",
    "org.members.invite",
    "org.members.remove",
    "org.billing.view",
  ],
  billing: ["org.billing.*"],
  member: [
    "org.teams.view",  // Non-secret teams
    "org.repos.create",  // Personal repos
  ],
};

// Team Roles (more granular)
const TEAM_PERMISSIONS = {
  owner: ["team.*"],
  maintainer: [
    "team.repos.create",
    "team.repos.delete",
    "team.members.invite",
    "team.settings.update",
    "team.runs.approve",
  ],
  contributor: [
    "team.repos.create",
    "team.repos.fork",
    "team.commits.create",
    "team.runs.create",
  ],
  executor: [
    "team.runs.create",
    "team.runs.execute",
    "team.repos.view",
  ],
  viewer: [
    "team.repos.view",
    "team.runs.view",
  ],
};

// Repository Collaborator Roles
const REPO_PERMISSIONS = {
  admin: [
    "repo.delete",
    "repo.transfer",
    "repo.settings.*",
    "repo.collaborators.*",
  ],
  write: [
    "repo.commits.create",
    "repo.runs.create",
    "repo.comments.create",
  ],
  read: [
    "repo.view",
    "repo.runs.view",
  ],
};
```

### 6.2 Attribute-Based Access Control (ABAC)

```typescript
// Dynamic permission checks based on resource state
type AccessPolicy = {
  resource: "repo" | "run" | "team";
  action: string;
  conditions: Condition[];
};

// Example: "Can user start a run on this repo?"
const CAN_START_RUN: AccessPolicy = {
  resource: "run",
  action: "create",
  conditions: [
    // User must be org member
    { type: "org_member", org_id: repo.org_id },
    
    // Repo must be accessible
    OR([
      { type: "repo_public" },
      { type: "team_member", team_id: repo.team_id },
      { type: "repo_collaborator", repo_id: repo.id },
    ]),
    
    // User must have quota
    { type: "quota_available", quota_type: "runs_per_month" },
    
    // If repo requires approval
    IF(repo.settings.require_approval, [
      { type: "team_role", min_role: "maintainer" },
    ]),
  ],
};

// Implementation as PostgreSQL function
CREATE OR REPLACE FUNCTION can_start_run(
  p_user_id UUID,
  p_repo_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check org membership
  IF NOT EXISTS (
    SELECT 1 FROM org_members om
    JOIN repositories r ON r.org_id = om.org_id
    WHERE om.user_id = p_user_id AND r.id = p_repo_id
  ) THEN RETURN FALSE;
  END IF;
  
  -- Check repo access
  IF NOT EXISTS (
    SELECT 1 FROM repositories r
    LEFT JOIN team_members tm ON r.team_id = tm.team_id
    LEFT JOIN repository_collaborators rc ON r.id = rc.repo_id
    WHERE r.id = p_repo_id
      AND (
        r.visibility = 'public'
        OR tm.user_id = p_user_id
        OR rc.user_id = p_user_id
      )
  ) THEN RETURN FALSE;
  END IF;
  
  -- Additional checks...
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

***

## 7. Scaling Strategy

### 7.1 Database Optimization

**Indexing Strategy**:
```sql
-- Composite indexes for common queries
CREATE INDEX idx_repos_owner_visibility 
  ON repositories (owner_type, owner_id, visibility);

CREATE INDEX idx_runs_team_status 
  ON runs (team_id, status) 
  WHERE team_id IS NOT NULL;

CREATE INDEX idx_commits_repo_branch 
  ON commits (repo_id, branch, created_at DESC);

-- Partial indexes for active data
CREATE INDEX idx_runs_active 
  ON runs (team_id, started_at) 
  WHERE status IN ('in_progress', 'paused');

-- GIN index for JSONB search
CREATE INDEX idx_commits_content_gin 
  ON commits USING GIN (content jsonb_path_ops);

-- Full-text search
CREATE INDEX idx_repos_search 
  ON repositories USING GIN (
    to_tsvector('english', name || ' ' || description)
  );
```

**Partitioning** (for high-volume tables):
```sql
-- Partition runs by month (for compliance/archival)
CREATE TABLE runs (
  id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  -- other columns
) PARTITION BY RANGE (created_at);

CREATE TABLE runs_2026_02 PARTITION OF runs
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Auto-create partitions with pg_cron
SELECT cron.schedule(
  'create-monthly-partition',
  '0 0 1 * *',
  $$ SELECT create_next_month_partition('runs'); $$
);
```

### 7.2 Read Scaling (Caching + CDN)

```typescript
// Tiered caching with automatic invalidation
class CacheManager {
  async get<T>(key: string): Promise<T | null> {
    // L1: In-memory (React Query)
    const memCache = queryClient.getQueryData([key]);
    if (memCache) return memCache;
    
    // L2: Redis
    const redisCache = await redis.get(key);
    if (redisCache) {
      queryClient.setQueryData([key], redisCache);
      return JSON.parse(redisCache);
    }
    
    // L3: Database
    const dbResult = await fetchFromDatabase(key);
    if (dbResult) {
      await redis.setex(key, TTL, JSON.stringify(dbResult));
      queryClient.setQueryData([key], dbResult);
      return dbResult;
    }
    
    return null;
  }
  
  async invalidate(pattern: string) {
    // Invalidate all layers
    await redis.del(await redis.keys(pattern));
    queryClient.invalidateQueries({ queryKey: [pattern] });
  }
}

// Automatic cache warming for critical paths
async function warmCache(orgId: string) {
  await Promise.all([
    cacheManager.set(`org:${orgId}:teams`, fetchTeams(orgId)),
    cacheManager.set(`org:${orgId}:repos:recent`, fetchRecentRepos(orgId)),
    cacheManager.set(`org:${orgId}:activity`, fetchActivity(orgId)),
  ]);
}
```

### 7.3 Write Scaling (Event Sourcing)

```typescript
// Event-driven architecture for high-write scenarios
type DomainEvent = {
  id: string;
  type: string;
  aggregate_type: "repo" | "run" | "team";
  aggregate_id: string;
  payload: Record<string, any>;
  metadata: {
    user_id: string;
    org_id: string;
    timestamp: Date;
  };
};

// Event store (append-only)
class EventStore {
  async append(event: DomainEvent) {
    // Write to PostgreSQL events table
    await db.insert('events').values(event);
    
    // Publish to Redis for real-time subscribers
    await redis.publish(`events:${event.aggregate_type}`, event);
    
    // Async projections (update read models)
    await inngest.send({
      name: `event/${event.type}`,
      data: event,
    });
  }
}

// Example: Run completion triggers multiple projections
inngest.createFunction(
  { id: "project-run-completion" },
  { event: "event/run.completed" },
  async ({ event }) => {
    await Promise.all([
      // Update repo stats
      db.update('repositories')
        .set({ total_runs: sql`total_runs + 1`, last_run_at: new Date() })
        .where(eq('id', event.data.repo_id)),
      
      // Update team leaderboard
      incrementTeamStat(event.data.team_id, 'completed_runs'),
      
      // Create notifications
      createNotifications(event.data.assigned_to, event.data.run_id),
      
      // Analytics
      posthog.capture('run_completed', event.data),
    ]);
  }
);
```

***

## 8. Security Architecture

### 8.1 Multi-Layer Defense

```typescript
// Layer 1: Network (Cloudflare)
// - DDoS protection
// - Rate limiting (per IP)
// - WAF rules (SQL injection, XSS)

// Layer 2: API Gateway (Edge Functions)
const securityMiddleware = [
  // Authentication
  async (req) => {
    const token = req.headers.get('Authorization')?.split(' ') [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/51475661/30923caa-8cfe-445d-a446-87c0a8f493c7/CLAUDE.md);
    const session = await supabase.auth.getSession(token);
    if (!session) throw new UnauthorizedError();
    req.user = session.user;
  },
  
  // Rate limiting (per user)
  async (req) => {
    const key = `ratelimit:${req.user.id}:${req.route}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 60);
    if (count > RATE_LIMITS[req.route]) throw new RateLimitError();
  },
  
  // Input validation
  async (req) => {
    const schema = ROUTE_SCHEMAS[req.route];
    const result = schema.safeParse(req.body);
    if (!result.success) throw new ValidationError(result.error);
    req.validatedData = result.data;
  },
  
  // Authorization
  async (req) => {
    const hasPermission = await checkPermission(
      req.user.id,
      req.params.resourceId,
      req.method
    );
    if (!hasPermission) throw new ForbiddenError();
  },
];

// Layer 3: Database (Row Level Security)
-- Secret team repos are invisible to non-members
CREATE POLICY "secret_team_repos_hidden"
ON repositories FOR SELECT
USING (
  NOT (
    visibility = 'team' 
    AND team_id IN (
      SELECT id FROM teams 
      WHERE visibility = 'secret'
    )
  )
  OR team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid()
  )
);

-- Users can only update runs they started or are assigned to
CREATE POLICY "run_updates_restricted"
ON runs FOR UPDATE
USING (
  runner_id = auth.uid() 
  OR auth.uid() = ANY(assigned_to)
  OR EXISTS (
    SELECT 1 FROM team_members tm
    JOIN repositories r ON r.team_id = tm.team_id
    WHERE r.id = runs.repo_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'maintainer')
  )
);

// Layer 4: Application (ABAC)
// - Dynamic permission checks based on resource state
// - Quota enforcement
// - Audit logging
```

### 8.2 Data Protection

```typescript
// Encryption at rest (database-level)
// - Supabase handles transparent encryption
// - Additional column-level encryption for sensitive data

// Encryption in transit
// - TLS 1.3 for all connections
// - Certificate pinning for mobile apps

// PII Protection
const SENSITIVE_FIELDS = ['email', 'ip_address', 'user_agent'];

async function logAuditEvent(event: AuditLog) {
  // Hash PII before storing
  const sanitized = {
    ...event,
    actor_ip: hashIP(event.actor_ip),
    actor_user_agent: hashUserAgent(event.actor_user_agent),
  };
  
  await db.insert('audit_logs').values(sanitized);
}

// Data retention policies
SELECT cron.schedule(
  'archive-old-runs',
  '0 2 * * *',  -- 2 AM daily
  $$
    UPDATE runs 
    SET archived_at = NOW()
    WHERE completed_at < NOW() - INTERVAL '90 days'
      AND archived_at IS NULL;
  $$
);
```

***

## 9. Monitoring & Observability

### 9.1 Metrics Dashboard

```typescript
// Key Performance Indicators (tracked in real-time)
const METRICS = {
  // System health
  "db.query_duration_p95": "< 100ms",
  "api.response_time_p99": "< 500ms",
  "cache.hit_rate": "> 80%",
  
  // Business metrics
  "runs.daily_active": "count",
  "runs.completion_rate": "percentage",
  "ai_agent.success_rate": "percentage",
  "teams.monthly_active": "count",
  
  // User engagement
  "users.dau": "count",
  "users.retention_d7": "percentage",
  "repos.fork_rate": "ratio",
};

// Alerting rules (PagerDuty)
const ALERTS = {
  critical: [
    { metric: "db.connections", threshold: "> 80%", action: "scale_up" },
    { metric: "api.error_rate", threshold: "> 5%", action: "page_oncall" },
    { metric: "auth.login_failures", threshold: "> 100/min", action: "security_team" },
  ],
  warning: [
    { metric: "cache.hit_rate", threshold: "< 70%", action: "investigate" },
    { metric: "runs.completion_rate", threshold: "< 85%", action: "review_ux" },
  ],
};
```

### 9.2 Distributed Tracing

```typescript
// OpenTelemetry integration
import { trace } from '@opentelemetry/api';

async function startRun(repoId: string, userId: string) {
  const span = trace.getTracer('checklisthq').startSpan('run.start');
  
  try {
    span.setAttributes({
      'user.id': userId,
      'repo.id': repoId,
      'team.id': await getTeamId(repoId),
    });
    
    // Permission check (child span)
    const authSpan = trace.getTracer('checklisthq').startSpan('auth.check');
    const canStart = await can_start_run(userId, repoId);
    authSpan.end();
    
    if (!canStart) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: 'Unauthorized' });
      throw new ForbiddenError();
    }
    
    // Create run (child span)
    const dbSpan = trace.getTracer('checklisthq').startSpan('db.insert');
    const run = await db.insert('runs').values({...});
    dbSpan.end();
    
    span.setStatus({ code: SpanStatusCode.OK });
    return run;
  } finally {
    span.end();
  }
}

// Trace across services
// API Gateway → Background Worker → AI Agent
// All linked by `trace_id` header
```

***

## 10. Developer Experience (DX)

### 10.1 Local Development

```bash
# One-command setup
npm run dev:full

# What it does:
# 1. Starts Supabase local (Docker)
# 2. Runs database migrations
# 3. Seeds test data (orgs, teams, users)
# 4. Starts Redis (Upstash local)
# 5. Starts Inngest dev server
# 6. Starts Vite dev server
# 7. Opens browser to http://localhost:5173
```

### 10.2 Type Safety (End-to-End)

```typescript
// Generate types from database schema
npm run db:types

// Generates: src/types/database.ts
export type Repository = Database['public']['Tables']['repositories']['Row'];
export type RepositoryInsert = Database['public']['Tables']['repositories']['Insert'];

// API type safety with Hono + Zod
const api = new Hono()
  .post('/repos/:repoId/fork', 
    zValidator('json', ForkRepoSchema),
    async (c) => {
      const body = c.req.valid('json');  // Fully typed
      // TypeScript knows: body.target_owner_type, body.visibility, etc.
    }
  );

// Frontend type safety with TanStack Query
const useForkRepo = () => {
  return useMutation({
    mutationFn: (data: ForkRepoInput) => 
      api.repos.$post({ json: data }),  // Type-checked!
  });
};
```

### 10.3 Testing Strategy

```typescript
// Unit tests (Vitest)
describe('Permission System', () => {
  it('denies access to secret team repos', async () => {
    const user = await createTestUser();
    const secretTeam = await createTestTeam({ visibility: 'secret' });
    const repo = await createTestRepo({ team_id: secretTeam.id });
    
    const canView = await checkPermission(user.id, repo.id, 'read');
    expect(canView).toBe(false);
  });
});

// Integration tests (Playwright)
test('fork repository to team', async ({ page }) => {
  await page.goto('/repos/engineering/deploy-prod');
  await page.click('button:text("Fork")');
  await page.selectOption('select[name="target"]', 'team:qa');
  await page.click('button:text("Create Fork")');
  
  await expect(page).toHaveURL('/teams/qa/repos/deploy-prod');
  await expect(page.locator('text="Forked from"')).toBeVisible();
});

// Load tests (k6)
import http from 'k6/http';
export default function () {
  const res = http.post('/api/runs', JSON.stringify({
    repo_id: __ENV.TEST_REPO_ID,
    runner_type: 'human',
  }));
  check(res, { 'status is 201': (r) => r.status === 201 });
}
```

***

## 11. Migration Path (Existing → Multi-Tenant)

### Phase 1: Schema Evolution (Week 1-2)
```sql
-- Add new columns (nullable)
ALTER TABLE repositories ADD COLUMN owner_type TEXT;
ALTER TABLE repositories ADD COLUMN team_id UUID REFERENCES teams(id);
ALTER TABLE repositories ADD COLUMN org_id UUID REFERENCES organizations(id);

-- Backfill existing data as "user" owned
UPDATE repositories SET owner_type = 'user', owner_id = owner_id_old;

-- Make constraints non-null
ALTER TABLE repositories ALTER COLUMN owner_type SET NOT NULL;
```

### Phase 2: Feature Flags (Week 3)
```typescript
// Gradual rollout
const features = {
  teams_enabled: await posthog.isFeatureEnabled('teams', user.id),
  orgs_enabled: await posthog.isFeatureEnabled('orgs', user.id),
};

// UI conditionally shows team features
{features.teams_enabled && <CreateTeamButton />}
```

### Phase 3: Data Migration (Week 4)
```typescript
// Migrate existing power users to orgs
const POWER_USERS = await db
  .select()
  .from('users')
  .where(sql`(SELECT COUNT(*) FROM repositories WHERE owner_id = users.id) > 10`);

for (const user of POWER_USERS) {
  // Create personal org
  const org = await createOrganization({
    name: `${user.name}'s Workspace`,
    owner_id: user.id,
  });
  
  // Transfer repos
  await db.update('repositories')
    .set({ owner_type: 'org', owner_id: org.id, org_id: org.id })
    .where(eq('owner_id', user.id));
}
```

***

## 12. Future Roadmap

### Q2 2026: Foundation
- ✅ Multi-tenant data model
- ✅ Teams & organizations
- ✅ Permission system
- 🔄 Real-time collaboration

### Q3 2026: AI Integration
- 🔮 AI agent execution engine
- 🔮 Natural language checklist generation
- 🔮 Auto-suggest next steps
- 🔮 Anomaly detection in runs

### Q4 2026: Enterprise
- 🔮 SSO (SAML/OIDC)
- 🔮 Advanced audit logs
- 🔮 Custom roles & permissions
- 🔮 SLA guarantees

### 2027: Platform
- 🔮 Public API + SDK
- 🔮 Marketplace for checklist templates
- 🔮 Third-party integrations (Slack, Jira, etc.)
- 🔮 White-label deployments

***

This architecture scales from 10 users to 10,000+ orgs while maintaining the core "Git for Process" philosophy. Every decision prioritizes developer experience and maintains your existing design principles. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/51475661/30923caa-8cfe-445d-a446-87c0a8f493c7/CLAUDE.md)