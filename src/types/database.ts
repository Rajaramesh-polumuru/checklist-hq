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
  progress: RunProgress  // Status of each item
  status: 'active' | 'completed' | 'archived'
  started_at: string
  completed_at: string | null
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
}

export type RunProgress = Record<string, ItemProgress>

// Insert types (without auto-generated fields)
export interface RepositoryInsert {
  owner_id: string
  title: string
  description?: string | null
  is_public?: boolean
  origin_repo_id?: string | null
  upstream_repo_id?: string | null
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
  progress?: RunProgress
  status?: 'active' | 'completed' | 'archived'
}

// Update types
export interface RepositoryUpdate {
  title?: string
  description?: string | null
  is_public?: boolean
}

export interface RunUpdate {
  progress?: RunProgress
  status?: 'active' | 'completed' | 'archived'
  completed_at?: string | null
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
    }
  }
}
