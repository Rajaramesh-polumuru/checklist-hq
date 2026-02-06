# Frontend Design Architecture & Philosophy

This document outlines the core principles driving the user interface and experience of Checklist HQ. It serves as the source of truth for design decisions and frontend architectural standards.

## Core Design Principles

### 1. Progressive Disclosure
**Principle:** Minimize cognitive load by presenting information gradually. Show only what is immediately necessary for the user's current task.
**Application:**
-   Prioritize primary actions; tuck secondary actions into menus or hover states.
-   Use collapsible sections for dense information.
-   Maintain clean default states to avoid overwhelming new users.

### 2. Immediate Feedback (The 100ms Rule)
**Principle:** The interface must feel physical and responsive. Perceived latency should be near zero.
**Application:**
-   **Optimistic UI:** Update state immediately on user action, revert on failure.
-   **Active States:** Buttons and interactive elements must have instant "pressed" states.
-   **Loading:** Use skeleton screens for initial loads; never block the UI for async operations without feedback.

### 3. Consistency & Predictability
**Principle:** Predictability builds trust. Leveraging established patterns is superior to inventing novel ones.
**Application:**
-   Adhere strictly to the Component Library/Design System.
-   Use standard icons and terminology.
-   Do not deviate from established navigation patterns.

### 4. Accessibility as a Foundation (WCAG AA+)
**Principle:** Accessibility is not a feature; it is a constraint of the medium. The product must be usable by everyone.
**Application:**
-   **Semantic HTML:** Use correct tags (`<button>`, `<nav>`, `<main>`) for screen readers.
-   **Keyboard First:** Ensure all interactions are navigable via Tab, Enter, and Space.
-   **Focus Management:** Visible focus indicators are mandatory.
-   **Motion:** Respect 'prefers-reduced-motion'.

### 5. Performance as UX
**Principle:** Performance is a feature. Slow interfaces break flow and reduce trust.
**Application:**
-   **RAIL Model:** Target <100ms response, 60fps animation.
-   **Optimization:** Use `React.memo` for list virtualization, `will-change` for complex animations, and lazy load routes/heavy components.

## Technical Architecture

### Core Foundation
-   **Framework:** React 19 (leveraging concurrent features)
-   **Language:** TypeScript (Strict mode enabled)
-   **Build System:** Vite
-   **Styling Engine:** Tailwind CSS 4 (Atomic CSS architecture)

### State Management Strategy
-   **Local/UI State:** `React.useState` / `useReducer`
-   **Global Client State:** Zustand (for complex cross-component state like 'Editor Store')
-   **Server State:** TanStack Query (React Query) - cache, synchronization, and optimistic updates
-   **Database:** Supabase (PostgreSQL + RLS)

### Component Architecture
-   **Headless Primitives:** Radix UI (Dialogs, Popovers, Accessibility roots)
-   **Styling Composition:** `class-variance-authority` (CVA) + `clsx` + `tailwind-merge`
-   **Icons:** `@hugeicons/react` (Standardized stroke width and sizing)
-   **Motion:** Framer Motion (Declarative animations, layout transitions)
-   **Drag & Drop:** `@dnd-kit` (Accessible, collision-detection based)

### Interaction Patterns
-   **Feedback:** Sonner (Stacked toasts)
-   **Onboarding:** NextStep.js (Tour guides)

---
*This document is a living standard. Updates should be proposed via pull request.*
