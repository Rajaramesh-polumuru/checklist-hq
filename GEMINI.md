# Checklist HQ Agent Guide

**Project:** Checklist HQ ("GitHub for Process")
**Description:** A process management platform leveraging version control concepts (commits, forks, merges) for Standard Operating Procedures.

> **CRITICAL INSTRUCTION FOR AI:**
> This project follows strict architectural and design patterns. You MUST read `DESIGN_PHILOSOPHY.md` and `ARCHITECTURE.md` before proposing significantly complex changes.

## 🛠 Usage & Commands

| Command | Action | Implementation Details |
| :--- | :--- | :--- |
| `npm run dev` | Start Server | Vite dev server at `http://localhost:5173` |
| `npm run build` | Production Build | `tsc -b && vite build` |
| `npm run lint` | Lint Code | ESLint (stylistic + functional rules) |
| `npm run preview` | Preview Build | Local production preview |

## 🏗 Tech Stack

- **Framework:** `React 19` (Latest)
- **Language:** `TypeScript 5` (Strict Mode)
- **Build:** `Vite`
- **Styling:** `Tailwind CSS 4` + `clsx` + `tailwind-merge` + `class-variance-authority` (CVA)
- **UI Libs:** `shadcn/ui` (Radix Primitives), `@hugeicons/react`, `sonner` (Toast)
- **Animation:** `framer-motion` (Layout animations), `tailwindcss-animate`
- **State:** `zustand` (Client), `tanstack/react-query` (Server), `Context` (Compound Components only)
- **Backend:** `Supabase` (PostgreSQL, Auth, RLS)

## 🧠 Coding Standards & AI Behaviors

### 1. Component Architecture
- **Structure:** Use the "Component Composition" pattern. Avoid monolithic props.
  - *Bad:* `<Card title="Foo" description="Bar" />`
  - *Good:* `<Card.Root><Card.Title>Foo</Card.Title><Card.Description>Bar</Card.Description></Card.Root>`
- **Colocation:** Keep styles, types, and logic co-located.
- **Exports:** Use Named Exports (`export const Foo = ...`). Avoid Default Exports.

### 2. Styling Rules (Tailwind 4)
- **Zero Magic Numbers:** ALways use design tokens (e.g., `p-4`, `gap-6`, `text-xl`) defined in `DESIGN_PHILOSOPHY.md`.
- **Merging:** ALWAYS use `cn()` (clsx + tailwind-merge) for conditional classes.
- **Semantic Colors:** Use `bg-primary`, `text-muted-foreground`, etc., not raw colors like `bg-blue-500` (unless explicitly for accent).

### 3. State Management
- **Server State:** Use `useQuery` / `useMutation` via React Query. Do not store server data in useEffect/useState.
- **Client State:** Use `Zustand` for complex global UI state (e.g., Sidebar, Editor Mode).
- **Form State:** Use `react-hook-form` + `zod` for validation.

### 4. Database & Backend
- **Identifiers:** ALL IDs are **UUIDs**. Never use integer incrementing IDs.
- **Safety:** RLS (Row Level Security) is mandatory. Assume the client is untrusted.
- **Mutations:** Edits to specific checklist content MUST create a new **Commit** (Immutable history). Do not update content in place.

## 📂 Project Map

- `src/components/ui/` - Shadcn/Radix primitives (Atomic).
- `src/components/[Feature]/` - Feature-specific logic (e.g., `src/components/Editor/`).
- `src/stores/` - Global Zustand stores.
- `src/services/` - Direct Supabase API calls (Pure functions).
- `src/lib/` - Shared utilities and constants.
- `src/hooks/` - Reusable React hooks.

## 📝 Documentation References
- **[DESIGN_PHILOSOPHY.md](./DESIGN_PHILOSOPHY.md)**: Visual language, accessibility rules, and token definitions.
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Data models, "Git for Process" logic, and schema.
- **[ROADMAP.md](./ROADMAP.md)**: Current phase usage and future planning.
