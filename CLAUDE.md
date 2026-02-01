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

## Features & Capabilities

### Repository Management
- Create, edit, and delete checklist repositories
- Public/private visibility settings
- Fork repositories with linked lineage tracking
- View fork network and upstream relationships
- Version history with commit browsing

### Checklist Editor
- **Rich Editing**: Hierarchical checklist items with unlimited nesting
- **Keyboard Shortcuts**: Full keyboard navigation (Tab/Shift+Tab for indent/outdent, arrows for navigation)
- **Auto-Save**: Silent, debounced saving with visual status indicators (Saving, Saved, Unsaved, Error)
- **Drag & Drop**: Reorder items with visual feedback
- **Empty State**: Helpful tips and quick start guide for new checklists
- **Unsaved Changes**: Clear indicators before leaving with unsaved work
- **Metadata Editing**: Update title and visibility without creating new commits

### Run Mode (Execution)
- Execute checklists with progress tracking
- Check off items as you complete them
- Save progress and resume later
- Run history with completed/archived runs
- Visual progress indicators

### Version Control
- Immutable commit history
- View and restore previous versions
- Time-travel through checklist changes
- Commit metadata (timestamp, author)

### Activity & Discovery
- Activity feed showing recent changes
- Explore public repositories
- Search and filter repositories
- User profiles with repository listings

### Accessibility Features
- WCAG AAA compliant (44px touch targets)
- Full keyboard navigation support
- Screen reader optimized with ARIA labels
- Respects `prefers-reduced-motion` preference
- Skip-to-content navigation
- High contrast, readable color palette

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
│                    # All pages use lazy loading with React.lazy() and Suspense
├── components/      # Reusable components
│   ├── ui/          # shadcn/ui base components (dialog, badge, skeleton, progress, etc.)
│   ├── ErrorBanner.tsx       # Accessible error/success notifications
│   ├── KeyboardShortcuts.tsx # Keyboard shortcut help modal
│   └── ShareSettingsModal.tsx # Repository sharing settings
├── stores/          # Zustand stores (auth-store, checklist-store)
├── services/        # Supabase API layer (repository, run, activity)
├── types/           # TypeScript definitions
├── lib/             # Utilities (supabase client, utils, date-utils, constants)
└── hooks/           # Custom React hooks (useDebounce, etc.)

supabase/
└── migrations/      # Database schema with RLS policies
```

## UI Components & Utilities

### shadcn/ui Components
- **Dialog**: Full-featured modal system with backdrop, overlay, and accessibility
- **Badge**: Semantic status badges (default, secondary, success, warning, destructive, outline)
- **Skeleton**: Loading placeholders with variants (text, circular, rectangular) and pre-built layouts
- **Progress**: Percentage-based progress bar with size variants (sm, default, lg)
- **Button, Input, Textarea, Card**: Base components for consistent UI

### Feature Components
- **ErrorBanner/SuccessBanner**: Accessible notifications with ARIA live regions and dismissible UI
- **KeyboardShortcuts**: Help modal documenting 12+ keyboard shortcuts (Editor, Global, Navigation)
- **ChecklistEditor**: Enhanced with empty state, interactive styling, and keyboard navigation
- **ChecklistItem**: Hover/focus states, drag indicators, smooth transitions

### Custom Hooks
- **useDebounce**: Generic debounce hook for delayed value updates (used in auto-save)
- Standard hooks: useState, useEffect, useCallback, useMemo

### Utilities & Design Tokens

#### Design Tokens (`src/lib/constants.ts`)
- **Spacing**: Item indentation (24px/level), container padding, section spacing
- **Layout**: Max widths, header height, z-index layers
- **Animation**: Duration constants (fast:100ms, default:200ms, slow:300ms)
- **Touch Targets**: WCAG AAA compliance (44px minimum)
- **Auto-Save Config**: Debounce (2000ms), throttle (5000ms)
- **Keyboard Shortcuts Config**: Mapped shortcuts for all operations

#### Date Utilities (`src/lib/date-utils.ts`)
- `formatRelativeTime()` - "2 hours ago", "yesterday"
- `formatCompactTime()` - "2h", "3d", "May 15"
- `formatDate()` - "January 31, 2026"
- `formatDateTime()` - "Jan 31, 2:45 PM"

#### CSS Utilities (`src/index.css`)
- **Animations**: `.animate-fade-in`, `.animate-slide-up`, `.animate-skeleton`
- **Accessibility**: `.sr-only`, `.sr-only-focusable`, `.skip-link`
- **Effects**: `.elevation-1` through `.elevation-5`, `.hover-lift`, `.focus-ring`
- **Colors**: CSS variables for background, primary (teal), status colors, shadows
- Respects `prefers-reduced-motion` for accessibility

#### Color System
- **Background**: Warm slate (hsl 30° 20% 99%) - soft, warm white
- **Foreground**: Dark slate (hsl 220° 12% lightness) - readable text
- **Primary**: Teal (hsl 172° 66% 36%) - brand accent color
- **Status Colors**:
  - Success: Green for completed actions
  - Warning: Orange for caution states
  - Destructive: Red for errors/deletions
  - Info: Blue for informational messages
- **Shadows**: 5-level elevation system with progressive opacity
- All colors defined as CSS variables for consistency and easy theming

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
- Separate tracking for content vs. metadata changes

### Auto-Save & Change Tracking
- **Auto-Save**: Debounced (2s) content changes create new commits automatically
- **Unsaved Changes UI**: Status badges (Saving, Saved, Error, Unsaved) in editor header
- **Metadata vs Content**: Title/visibility changes update metadata without creating commits
- **Manual Save**: Keyboard shortcut (Cmd/Ctrl+S) always available
- **Error Handling**: Error banner with dismissible notifications

### Performance Optimizations
- **Lazy Loading**: All pages use `React.lazy()` with Suspense for code splitting
- **Skeleton Screens**: Loading states with pre-built skeleton layouts
- **Memoization**: ChecklistItem uses React.memo with custom comparison
- **Debounced Updates**: Auto-save and search use debouncing to reduce API calls

### Database Security
- Row Level Security (RLS) on all tables
- Public repos viewable by all; users can only modify their own
- Runs visible only to their owner

## Keyboard Shortcuts

All shortcuts are documented in the [KeyboardShortcuts.tsx](src/components/KeyboardShortcuts.tsx) component and accessible via `?` key:

### Editor Shortcuts
- **Enter** - Create new item below current
- **Tab** - Indent current item (increase nesting)
- **Shift + Tab** - Outdent current item (decrease nesting)
- **Backspace** - Delete empty item (or remove last character)
- **↑/↓ Arrows** - Navigate between items
- **Cmd/Ctrl + S** - Save changes manually
- **Escape** - Close modal/dialog

### Global Shortcuts
- **?** - Show keyboard shortcuts help
- **Tab / Shift + Tab** - Navigate between interactive elements

### Navigation
All pages and modals support keyboard navigation with focus management.

## Path Alias

`@/` maps to `src/` - use for imports: `import { cn } from '@/lib/utils'`

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Important Files

### Core State & Services
- [src/stores/checklist-store.ts](src/stores/checklist-store.ts) - Editor state with add/update/delete/indent/outdent/move operations
- [src/stores/auth-store.ts](src/stores/auth-store.ts) - Authentication state management
- [src/services/repository.ts](src/services/repository.ts) - Repo CRUD, commits, forking logic
- [src/services/run.ts](src/services/run.ts) - Run lifecycle management
- [src/services/activity.ts](src/services/activity.ts) - Activity feed and notifications

### Key Pages
- [src/pages/Editor.tsx](src/pages/Editor.tsx) - Main editor with auto-save, unsaved changes UI, keyboard shortcuts
- [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) - Repository dashboard with skeleton loading
- [src/pages/RunMode.tsx](src/pages/RunMode.tsx) - Interactive checklist execution mode
- [src/App.tsx](src/App.tsx) - Route configuration with lazy loading and protected routes

### Components & UI
- [src/components/ChecklistEditor.tsx](src/components/ChecklistEditor.tsx) - Enhanced empty state with tips and keyboard shortcuts
- [src/components/ChecklistItem.tsx](src/components/ChecklistItem.tsx) - Interactive item with hover/focus states
- [src/components/KeyboardShortcuts.tsx](src/components/KeyboardShortcuts.tsx) - Keyboard shortcut help modal
- [src/components/ErrorBanner.tsx](src/components/ErrorBanner.tsx) - Accessible notification system

### Utilities & Config
- [src/lib/constants.ts](src/lib/constants.ts) - Design tokens, spacing, animation, auto-save config
- [src/lib/date-utils.ts](src/lib/date-utils.ts) - Date formatting utilities (relative, compact, full)
- [src/index.css](src/index.css) - Global styles, animations, accessibility utilities, color system

### Database
- `supabase/migrations/20240131000000_schema.sql` - Database schema with RLS policies and functions

## Coding Conventions

### Data & State
- **UUIDs** for all entity identifiers (not array indices)
- **Immutable commits** - never modify existing, always create new
- **Strong TypeScript types** throughout - no implicit any
- **Separate concerns** - content changes create commits, metadata updates don't

### UI & Styling
- **Tailwind CSS** for styling with shadcn/ui component patterns
- **Design tokens** - use constants from `src/lib/constants.ts` for spacing, timing, etc.
- **CSS utilities** - use built-in animations (`.animate-fade-in`, `.animate-slide-up`)
- **Consistent spacing** - 24px per indentation level, use design tokens
- **Color system** - use CSS variables (`--primary`, `--background`, etc.)

### Accessibility (WCAG AAA)
- **Semantic HTML** - proper heading hierarchy, ARIA roles
- **Keyboard navigation** - all interactive elements keyboard accessible
- **Touch targets** - 44px minimum for buttons/interactive elements
- **Screen readers** - ARIA live regions for notifications, proper labels
- **Motion** - respect `prefers-reduced-motion` for animations
- **Focus management** - visible focus rings, skip-to-content links

### Performance
- **Lazy loading** - use `React.lazy()` and `Suspense` for pages
- **Code splitting** - automatic via lazy loading
- **Debouncing** - use `useDebounce` hook for auto-save and search
- **Memoization** - `React.memo` for expensive components with custom comparison
- **Skeleton screens** - show loading states instead of spinners where appropriate

### User Experience
- **Empty states** - provide helpful tips and clear calls-to-action
- **Loading states** - skeleton screens or branded loaders with icons
- **Error handling** - accessible error banners with clear messages
- **Keyboard shortcuts** - document in KeyboardShortcuts component
- **Auto-save** - silent, debounced, with clear status indicators
- **Unsaved changes** - visual indicators before leaving/closing
