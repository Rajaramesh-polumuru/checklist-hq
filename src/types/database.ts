// Database types matching the PostgreSQL schema from the blueprint

export interface Repository {
  id: string
  owner_id: string
  title: string
  description: string | null
  is_public: boolean
  origin_repo_id: string | null  // The "Grandparent" (Where it started)
  upstream_repo_id: string | null  // The immediate parent (Where it was forked from)
  fork_count: number
  created_at: string
  updated_at: string
  organization_id: string | null
  // Polymorphic ownership (ORGS.md)
  owner_type?: 'user' | 'team' | 'org'
  team_id?: string | null
}

export interface Commit {
  id: string
  repo_id: string
  content: ChecklistContent  // The JSON snapshot of the checklist
  message: string | null  // e.g., "Added deployment step"
  parent_commit_id: string | null  // The linked list of history
  created_at: string
}

export interface Run {
  id: string
  repo_id: string
  commit_id: string  // Links to the VERSION used
  user_id?: string // Who started the run
  progress: RunProgress  // Status of each item
  status: 'active' | 'paused' | 'completed' | 'archived'
  started_at: string
  completed_at: string | null
  // Phase 1 enhancements
  name?: string | null  // User-defined run name
  description?: string | null  // Optional description
  paused_at?: string | null  // When the run was paused
  total_active_time_seconds?: number  // Accumulated active time
  last_activity_at?: string  // Last user interaction
  notes?: string | null  // Notes taken during the run
  device_id?: string | null  // Current device identifier
  device_name?: string | null  // Human-readable device name
  // Phase 2 enhancements
  sync_version?: number  // For conflict detection
  last_synced_at?: string  // Last sync timestamp
  // Phase 3 enhancements
  is_collaborative?: boolean  // Multi-user mode enabled
  share_token?: string | null  // Shareable link token
  share_expires_at?: string | null  // When share link expires
  // Team/Org context (ORGS.md)
  team_id?: string | null
  organization_id?: string | null
}

// Time segment for accurate duration tracking
export interface RunTimeSegment {
  id: string
  run_id: string
  started_at: string
  ended_at: string | null
  device_id?: string | null
  device_name?: string | null
}

// The normalized JSON structure for checklist content
// This structure is optimized for diffing and merging
export interface ChecklistItem {
  id: string
  text: string
  parent: string | null  // null means root level
  order: number
  type?: 'task' | 'header' | 'note'
  details?: string

  // Agent execution configuration (Phase 6: AI Agent Integration)
  agent_config?: {
    action_type: 'manual' | 'browse' | 'api' | 'approve'
    assignee?: string // Agent ID or 'human' or 'any'
    parameters?: Record<string, unknown>
    expected_output?: Record<string, unknown>
    timeout_ms?: number
    fallback_assignee?: string // If agent fails
  }
}

export interface ChecklistContent {
  version: string  // Schema version for migrations
  items: Record<string, ChecklistItem>  // Normalized: keyed by UUID
}

// Progress tracking for runs
export interface ItemProgress {
  completed: boolean
  timestamp?: string
  user_id?: string
  note?: string  // Optional note added when completing the item

  // Agent execution tracking (Phase 6: AI Agent Integration)
  completed_by?: string // User ID or Agent ID
  completed_by_type?: 'human' | 'agent'
  agent_output?: Record<string, unknown> // Structured output from agent
}

export type RunProgress = Record<string, ItemProgress>

// Tags for categorizing repositories
export interface Tag {
  id: string
  name: string
  slug: string
  description: string | null
  category: string | null  // e.g., 'engineering', 'health', 'business'
  color: string  // For UI display
  icon: string | null  // Lucide icon name
  created_at: string
}

// Junction table for repository-tag relationships
export interface RepositoryTag {
  id: string
  repository_id: string
  tag_id: string
  created_at: string
}

// Organization types (Phase 5)
export interface Organization {
  id: string
  slug: string
  name: string
  description: string | null
  avatar_url: string | null
  plan: 'free' | 'pro' | 'team' | 'enterprise'
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  invited_by: string | null
  invited_at: string | null
  joined_at: string
}

export interface OrganizationInsert {
  name: string
  slug: string
  description?: string | null
}

// Team types
export interface Team {
  id: string
  organization_id: string
  slug: string
  name: string
  description: string | null
  visibility: 'visible' | 'secret'
  default_permission: 'read' | 'write' | 'admin'
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'maintainer' | 'member'
  added_at: string
  added_by: string | null
}

export interface RepositoryTeamAccess {
  id: string
  repository_id: string
  team_id: string
  permission: 'read' | 'write' | 'admin'
  granted_at: string
  granted_by: string | null
}

export interface TeamInsert {
  organization_id: string
  slug: string
  name: string
  description?: string | null
  visibility?: 'visible' | 'secret'
  default_permission?: 'read' | 'write' | 'admin'
  settings?: Record<string, unknown>
}

export interface TeamUpdate {
  slug?: string
  name?: string
  description?: string | null
  visibility?: 'visible' | 'secret'
  default_permission?: 'read' | 'write' | 'admin'
  settings?: Record<string, unknown>
}

// ==================== AI Agent Types ====================

export type AgentType = 'claude' | 'custom' | 'webhook'

export interface Agent {
  id: string
  organization_id: string
  name: string
  description: string | null
  agent_type: AgentType
  capabilities: string[] | null // What actions this agent can perform
  api_key_hash: string | null // For authentication
  created_by: string
  created_at: string
  last_active_at: string | null
}

export interface AgentTeamMembership {
  agent_id: string
  team_id: string
  permissions: Record<string, unknown> | null // Specific allowed actions
  created_at: string
}

export interface AgentInsert {
  organization_id: string
  name: string
  description?: string | null
  agent_type: AgentType
  capabilities?: string[] | null
  api_key_hash?: string | null
}

export interface AgentUpdate {
  name?: string
  description?: string | null
  capabilities?: string[] | null
}

// Repository with tags (for display purposes)
export interface RepositoryWithTags extends Repository {
  tags?: Tag[]
}

// Insert types (without auto-generated fields)
export interface RepositoryInsert {
  owner_id: string
  title: string
  description?: string | null
  is_public?: boolean
  origin_repo_id?: string | null
  upstream_repo_id?: string | null
  organization_id?: string | null
  // Polymorphic ownership (ORGS.md)
  owner_type?: 'user' | 'team' | 'org'
  team_id?: string | null
}

export interface CommitInsert {
  repo_id: string
  content: ChecklistContent
  message?: string | null
  parent_commit_id?: string | null
}

export interface RunInsert {
  repo_id: string
  commit_id: string
  user_id?: string
  progress?: RunProgress
  status?: 'active' | 'paused' | 'completed' | 'archived'
  name?: string | null
  description?: string | null
  device_id?: string | null
  device_name?: string | null
  // Team/Org context (ORGS.md)
  team_id?: string | null
  organization_id?: string | null
}

// Update types
export interface RepositoryUpdate {
  title?: string
  description?: string | null
  is_public?: boolean
  organization_id?: string | null
}

export interface RunUpdate {
  progress?: RunProgress
  status?: 'active' | 'paused' | 'completed' | 'archived'
  completed_at?: string | null
  name?: string | null
  description?: string | null
  paused_at?: string | null
  total_active_time_seconds?: number
  last_activity_at?: string
  notes?: string | null
  device_id?: string | null
  device_name?: string | null
}

export interface RunTimeSegmentInsert {
  run_id: string
  started_at?: string
  device_id?: string | null
  device_name?: string | null
}

// ==================== Activity & Notifications (ORGS.md) ====================

export type NotificationType =
  | 'run_completed'
  | 'run_failed'
  | 'run_assigned'
  | 'mention'
  | 'comment'
  | 'team_invite'
  | 'org_invite'
  | 'repo_shared'
  | 'repo_forked'
  | 'system'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string | null
  action_url: string | null
  resource_type: string | null
  resource_id: string | null
  read_at: string | null
  archived_at: string | null
  created_at: string
}

export type ActivityActorType = 'human' | 'agent' | 'system'

export interface Activity {
  id: string
  organization_id: string | null
  team_id: string | null
  actor_id: string
  actor_type: ActivityActorType
  action: string
  resource_type: string
  resource_id: string
  resource_name: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface NotificationInsert {
  user_id: string
  type: NotificationType
  title: string
  message?: string | null
  action_url?: string | null
  resource_type?: string | null
  resource_id?: string | null
}

export interface ActivityInsert {
  organization_id?: string | null
  team_id?: string | null
  actor_id: string
  actor_type?: ActivityActorType
  action: string
  resource_type: string
  resource_id: string
  resource_name?: string | null
  metadata?: Record<string, unknown>
}

// Supabase database schema type
export interface Database {
  public: {
    Tables: {
      repositories: {
        Row: Repository
        Insert: RepositoryInsert
        Update: RepositoryUpdate
      }
      commits: {
        Row: Commit
        Insert: CommitInsert
        Update: never  // Commits are immutable
      }
      runs: {
        Row: Run
        Insert: RunInsert
        Update: RunUpdate
      }
      run_time_segments: {
        Row: RunTimeSegment
        Insert: RunTimeSegmentInsert
        Update: { ended_at?: string | null }
      }
      tags: {
        Row: Tag
        Insert: never  // Tags are seeded, not user-created
        Update: never
      }
      repository_tags: {
        Row: RepositoryTag
        Insert: { repository_id: string; tag_id: string }
        Update: never
      }
      organizations: {
        Row: Organization
        Insert: OrganizationInsert
        Update: Partial<Omit<OrganizationInsert, 'slug'>> // Slug usually shouldn't change
      }
      organization_members: {
        Row: OrganizationMember
        Insert: Omit<OrganizationMember, 'id' | 'joined_at' | 'invited_at'>
        Update: Pick<OrganizationMember, 'role'>
      }
      teams: {
        Row: Team
        Insert: TeamInsert
        Update: TeamUpdate
      }
      team_members: {
        Row: TeamMember
        Insert: Omit<TeamMember, 'id' | 'added_at'>
        Update: Pick<TeamMember, 'role'>
      }
      repository_team_access: {
        Row: RepositoryTeamAccess
        Insert: Omit<RepositoryTeamAccess, 'id' | 'granted_at'>
        Update: Pick<RepositoryTeamAccess, 'permission'>
      }
    }
  }
}
