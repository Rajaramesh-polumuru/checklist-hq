# Checklist HQ

**The GitHub for Process** - Don't write checklists. Fork them.

Checklist HQ is a platform that applies the GitHub paradigm of version control, forking, and merging to business processes and SOPs.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL + Auth)
- **Drag & Drop**: @dnd-kit

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── ChecklistEditor.tsx
│   ├── ChecklistItem.tsx
│   └── Layout.tsx
├── lib/
│   ├── supabase.ts      # Supabase client
│   └── utils.ts         # Utility functions
├── pages/
│   ├── AuthCallback.tsx
│   ├── Dashboard.tsx
│   ├── Editor.tsx
│   ├── Explore.tsx
│   └── Home.tsx
├── stores/
│   ├── auth-store.ts    # Auth state
│   └── checklist-store.ts # Checklist editor state
├── types/
│   └── database.ts      # TypeScript types
├── App.tsx
└── main.tsx

supabase/
└── migrations/
    └── 001_initial_schema.sql  # Database schema
```

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql` in the SQL Editor
3. Enable Google OAuth in Authentication > Providers
4. Copy your project URL and anon key

### 3. Configure Environment

Create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

## Key Features

### MVP (Phase 1)
- Checklist editor with keyboard shortcuts (Enter, Tab, Shift+Tab)
- Drag-and-drop reordering
- Fork public checklists
- Version history (commits)
- Run mode for executing checklists

### Planned (Phase 2+)
- Team workspaces
- Upstream merge (sync with original)
- Public library with ranking
- Verified creators
- Enterprise compliance features

## Database Schema

The schema follows a "Git-like" model:

- **repositories**: The checklist container with forking lineage
- **commits**: Immutable snapshots of checklist content
- **runs**: Execution instances with progress tracking

See [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql) for details.

## Keyboard Shortcuts (Editor)

| Key | Action |
|-----|--------|
| `Enter` | Add new item |
| `Tab` | Indent item |
| `Shift+Tab` | Outdent item |
| `Backspace` (empty) | Delete item |
| `Arrow Up/Down` | Navigate items |

## License

MIT
