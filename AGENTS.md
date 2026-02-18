# Checklist HQ - Agent Guidelines

> This file provides guidance for AI agents working on this codebase.

## Build & Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start Vite dev server at http://localhost:5173 |
| `npm run build` | Production build: `tsc -b && vite build` |
| `npm run build:mcp` | Build MCP CLI binary |
| `npm run lint` | Run ESLint (stylistic + functional) |
| `npm run preview` | Preview production build locally |
| `npm run db:push` | Push database migrations |

**No test framework configured** - Write manual verification steps in PR descriptions.

## Tech Stack

- React 19 + TypeScript 5 (Strict Mode)
- Vite for build
- Tailwind CSS 4 + clsx + tailwind-merge + CVA
- Radix UI primitives (shadcn/ui)
- @hugeicons/react for icons
- framer-motion for animations
- zustand for client state
- Supabase (PostgreSQL, Auth, RLS)

## Project Structure

```
src/
├── components/ui/     # Shadcn/Radix primitives (atomic)
├── components/[Feature]/  # Feature-specific logic
├── stores/            # Zustand stores
├── services/          # Supabase API calls (pure functions)
├── lib/               # Utilities and constants
├── hooks/             # Reusable React hooks
└── types/             # TypeScript types (database types)
```

## Code Style Guidelines

### Imports

Use absolute imports with `@/` alias:

```typescript
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Team } from '@/types/database'
```

Organize imports in this order:
1. External libraries (react, @radix-ui/*, framer-motion)
2. Absolute imports (@/components, @/lib, @/hooks, @/services, @/types)
3. Relative imports (../, ./)

### Component Architecture

Use **Component Composition** pattern - avoid monolithic props:

```typescript
// Bad
<Card title="Foo" description="Bar" />

// Good
<Card.Root>
  <Card.Title>Foo</Card.Title>
  <Card.Description>Bar</Card.Description>
</Card.Root>
```

Use **Named Exports** only:

```typescript
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(...)
export { Button, buttonVariants }
```

### Styling with Tailwind

- Use `cn()` (clsx + tailwind-merge) for conditional classes
- Use semantic colors: `bg-primary`, `text-muted-foreground`, `bg-destructive`
- Avoid raw colors like `bg-blue-500` unless for accent
- Use design tokens from DESIGN_PHILOSOPHY.md - no magic numbers

```typescript
<div className={cn("flex flex-col gap-4", className)}>
```

### Types

- All database IDs are **UUIDs** (string)
- Use explicit return types for service functions
- Colocate types with components when possible

```typescript
export interface TeamMemberWithUser extends TeamMember {
  user: {
    id: string
    email: string
  }
}
```

### Error Handling

Services throw errors with user-friendly messages:

```typescript
if (error.code === '23505') {
  throw new Error('A team with this slug already exists in this organization.')
}
if (error.code === 'PGRST116') return null // Not found
throw error
```

Always check session before mutations:

```typescript
const { session } = useAuthStore.getState()
if (!session) {
  throw new Error('Not authenticated')
}
```

### Naming Conventions

- **Components**: PascalCase (`Button`, `CardRoot`)
- **Hooks**: camelCase with `use` prefix (`useDebounce`, `usePermissions`)
- **Services**: camelCase, noun-based (`getTeam`, `createTeam`)
- **Stores**: camelCase with `-store` suffix (`authStore`, `checklistStore`)
- **Types/Interfaces**: PascalCase (`Team`, `TeamInsert`)

### State Management

- **Server State**: Use React Query patterns (direct service calls, no useEffect)
- **Client UI State**: Use Zustand stores
- **Form State**: Use react-hook-form + zod for validation

### Database & Backend

- **RLS is mandatory** - Assume client is untrusted
- **Immutable commits** - Edits to checklist content must create new commits, not update in place
- Log audit events for all mutations:

```typescript
logAuditEvent({
  organizationId: team.organization_id,
  action: 'team.created',
  resourceType: 'team',
  resourceId: teamId,
  newValues: params,
}).catch(err => console.error('Audit log failed:', err))
```

### Animations & Motion

Use framer-motion for layout animations with `layout` prop:

```typescript
<motion.div layout>
```

Standard transitions: `transition-all duration-200 ease-in-out`

### Icons

Use @hugeicons/react with standard sizing:

```typescript
import { Settings01Icon } from '@hugeicons/core-free-icons'
<Settings01Icon className="size-4 stroke-[1.5] text-muted-foreground" />
```

## Key Files to Read First

- `DESIGN_PHILOSOPHY.md` - Visual language and token system
- `ARCHITECTURE.md` - Data models and "Git for Process" logic
- `CLAUDE.md` - Project overview (this file provides additional context)
- `.cursorrules` - Additional AI agent rules

## Working with This Codebase

1. Read relevant documentation before making significant changes
2. Follow existing patterns in the codebase
3. Run `npm run lint` before committing
4. Use type-safe Supabase queries with TypeScript
5. Test changes locally with `npm run dev`
