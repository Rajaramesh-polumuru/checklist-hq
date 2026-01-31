# Checklist HQ

"GitHub for Process" - A platform that applies version control concepts (commits, forking, merging) to Standard Operating Procedures and business processes.

## Quick Start

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Production build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4
- **UI Components**: shadcn/ui, Radix UI, Lucide icons
- **State Management**: Zustand
- **Drag & Drop**: @dnd-kit
- **Backend**: Supabase (PostgreSQL with RLS)

## Project Structure

```
src/
├── pages/           # Route components (Dashboard, Editor, RunMode, etc.)
├── components/      # Reusable components
│   └── ui/          # shadcn/ui base components
├── stores/          # Zustand stores (auth-store, checklist-store)
├── services/        # Supabase API layer (repository, run, activity)
├── types/           # TypeScript definitions
├── lib/             # Utilities (supabase client, utils)
└── hooks/           # Custom React hooks

supabase/
└── migrations/      # Database schema with RLS policies
```

## Key Concepts

- **Repositories**: Process containers with fork lineage (upstream_repo_id, origin_repo_id)
- **Commits**: Immutable version snapshots storing checklist content as JSONB
- **Runs**: Executable instances with progress tracking and status (active/completed/archived)
- **Forking**: Deep copy with independent edits but linked to source for future merging

## Architecture Patterns

### Checklist Data Structure
Items stored as normalized map for O(1) lookups:
```typescript
{
  content: {
    version: '1.0',
    items: { [id: string]: { id, text, parent, order } }
  }
}
```

### State Management
- Zustand for local editor state (items, dirty flag, focus)
- Edit locally → mark dirty → save creates new commit (immutable history)

### Database Security
- Row Level Security (RLS) on all tables
- Public repos viewable by all; users can only modify their own
- Runs visible only to their owner

## Path Alias

`@/` maps to `src/` - use for imports: `import { cn } from '@/lib/utils'`

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Important Files

- `src/stores/checklist-store.ts` - Editor state with add/update/delete/indent/outdent/move operations
- `src/services/repository.ts` - Repo CRUD, commits, forking logic
- `src/services/run.ts` - Run lifecycle management
- `supabase/migrations/20240131000000_schema.sql` - Database schema with functions

## Coding Conventions

- UUIDs for all entity identifiers (not array indices)
- Immutable commits - never modify existing, always create new
- Strong TypeScript types throughout
- Tailwind for styling with shadcn/ui component patterns
