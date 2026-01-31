# Architecture: The "GitHub for Process" Model

This document details the technical architecture required to support the "Forking" mechanic, providing specific database schemas and JSON structures optimized for a React/Supabase stack.

## 1. The Database Paradigm: Relational vs. Document
We utilize **PostgreSQL (via Supabase)**.
- **Referential Integrity**: Strict foreign keys are required to track lineage (`origin_id`, `upstream_id`).
- **JSONB**: We use Postgres's best-in-class JSON support to store checklist content as immutable snapshots while keeping metadata relational.

### Core Entities

#### Repositories (The Container)
Represents the abstract concept of the "Checklist."
- **`upstream_repo_id`**: Points to the parent repository (if forked).
- **`origin_repo_id`**: Points to the original root repository.

#### Commits (The Version)
Represents a specific state of the checklist at a specific point in time.
- **`content`**: A `JSONB` column containing the entire tree of items.
- **Immutable**: Once written, a commit is never changed. Edits create new commits.

#### Runs (The Instance)
Represents an execution of a specific Commit.
- **`progress`**: Validates the completion state of items without modifying the definition.

## 2. Schema Design (SQL)

```sql
-- 1. REPOSITORIES
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  upstream_repo_id UUID REFERENCES repositories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COMMITS
CREATE TABLE commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repositories(id) NOT NULL,
  content JSONB NOT NULL, -- The Snapshot
  parent_commit_id UUID REFERENCES commits(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RUNS
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repositories(id) NOT NULL,
  commit_id UUID REFERENCES commits(id) NOT NULL,
  progress JSONB DEFAULT '{}', -- { "item_uuid": { "completed": true } }
  status TEXT DEFAULT 'active'
);
```

## 3. The JSON Data Structure
To support consistent diffing and merging, we use a **normalized** map structure rather than a nested array. This prevents "array index shift" issues during diffs.

```json
{
  "items": {
    "uuid-1": { 
      "id": "uuid-1", 
      "text": "Step 1", 
      "parent": null, 
      "order": 0 
    },
    "uuid-2": { 
      "id": "uuid-2", 
      "text": "Step 1.1", 
      "parent": "uuid-1", 
      "order": 0 
    }
  }
}
```

## 4. The Forking Mechanic
When a user "Forks":
1.  **Create Repository**: A new row in `repositories` linked to the `upstream_repo_id`.
2.  **Deep Copy**: The latest `JSONB` content from the upstream repo is copied and inserted as the *first* commit of the new repo.
    *   *Why Deep Copy?* Users must be able to edit their fork independently.
    *   *Why Link?* To enable future "Upstream Merge" features.

## 5. Strategic Decisions
- **Zustand over Context**: For the Editor, we use Zustand to avoid re-rendering the entire list on every keystroke.
- **UUIDs everywhere**: Every item gets a UUID. Array indices are never used as identifiers.
