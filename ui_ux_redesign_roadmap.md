# UI/UX Redesign Roadmap & Design System

> **Role:** Chief Design Officer (CDO)
> **Objective:** Transform Checklist HQ into a premium, accessible, and performant product.

## 1. Design Philosophy & Principles

### CDO Design Principles
1.  **Progressive Disclosure**
    *   **Rule:** Show only what is needed for the current context.
    *   **Implementation:** Use collapsible sections, hover reveals for secondary actions, and clean default states.
2.  **Feedback Immediacy**
    *   **Rule:** Every user action must trigger a visible reaction within 100ms.
    *   **Implementation:** Optimistic UI updates, instant active states on buttons, skeletal loaders for async data.
3.  **Consistency Over Novelty**
    *   **Rule:** Reuse proven patterns; do not invent new UI paradigms unless absolutely necessary.
    *   **Implementation:** Strict adherence to the Design System component library.
4.  **Accessibility by Default**
    *   **Rule:** WCAG AA+ compliance is non-negotiable.
    *   **Implementation:** Semantic HTML, full keyboard navigation, aria-labels, and reduced motion support from Day 1.
5.  **Performance is a Feature**
    *   **Rule:** 60fps animations and <100ms interaction latency.
    *   **Implementation:** CSS-based animations where possible, `will-change` optimization, heavy use of `React.memo` and virtualization.

### Technical Stack
*   **Core:** React 19.2, TypeScript, Tailwind CSS 4
*   **State:** Zustand 5 (Client), Supabase (Server), React Query (Async)
*   **Primitives:** Radix UI (Dialog, Dropdown, Select, Checkbox, Tabs, Tooltip)
*   **Motion:** Framer Motion 12 (Layout, Gestures)
*   **Styling:** CVA (Class Variance Authority), clsx, tailwind-merge
*   **Drag & Drop:** @dnd-kit (Core, Sortable, Modifiers)
*   **Icons:** @hugeicons/react
*   **Feedback:** Sonner (Toasts), NextStep.js (Onboarding)

---

## 2. Design Token System (Mandatory)

All "magic numbers" are banned. We use a strict token system.

### Color Semantics (Not Literals)
*   Define roles, not colors (e.g., `bg-surface-primary`, `text-content-subtle`, `border-interactive-focus`).
*   **Palette:**
    *   `primary`: Brand action color
    *   `surface`: Background layers (0-3)
    *   `success` / `danger` / `warning` / `info`: Semantic feedback

### Spacing Scale
*   Base unit: 4px
*   Scale: `0` (0px), `1` (4px), `2` (8px), `3` (12px), `4` (16px), `6` (24px), `8` (32px), `12` (48px)...

### Motion Timing
*   **Instant:** `0ms` (States that must feel immediate)
*   **Fast:** `100ms` (Micro-interactions, hover)
*   **Normal:** `200ms` (UI layout changes, standard transitions)
*   **Slow:** `300ms` (Large movement, entrance animations)

### Easing Curves
*   **Default:** `[0.4, 0, 0.2, 1]` (Standard ease-out)
*   **Bounce:** `[0.34, 1.56, 0.64, 1]` (Playful, emphasized actions)

### Elevation (Shadows)
*   `elevation-0`: Flat
*   `elevation-1`: Tooltips, hover states (`shadow-sm`)
*   `elevation-2`: Dropdowns, popovers (`shadow-md`)
*   `elevation-3`: Modals, dragging items (`shadow-lg`)

---

## 3. Phased Execution Roadmap

Execute these phases strictly sequentially. Do not jump ahead.

### Phase 0: Foundation
*Goal: Establish the constraints and tokens that will govern the UI.*

1.  **[x] Design Tokens Setup**
    *   Create `/src/design-system/tokens.ts`.
    *   Define colors, spacing, motion, and typography constants.
2.  **[x] Global CSS Configuration**
    *   Update `globals.css` to map CSS Custom Properties to the Design Tokens.
    *   Configure Tailwind 4 theme to use these variables.
3.  **[x] Component Inventory & Audit**
    *   Audit existing `/components`.
    *   Flag duplicates, hardcoded values, and non-accessible elements.

### Phase 1: Primitives
*Goal: Build the "LEGO bricks" of the application using polymorphic, accessible designs.*

4.  **[x] Button Component**
    *   **Tech:** CVA + Framer Motion (`whileTap`, `whileHover`).
    *   **Variants:** `primary`, `secondary`, `ghost`, `danger`.
    *   **Sizes:** `sm`, `md`, `lg`.
    *   **Features:** Loading spinner state, icon support, `asChild` (Slot).
5.  **[x] Input Field System**
    *   **Tech:** Composition pattern (`Root`, `Label`, `Input`, `Error`, `Help`).
    *   **Features:** Focus rings, validation styling, disabled states.
6.  **[x] Card Primitive**
    *   **Structure:** `Card.Root`, `Card.Header`, `Card.Content`, `Card.Footer`.
    *   **Props:** `elevation` (0-3), `interactive` (hover effects).
7.  **[x] Icon Wrapper**
    *   **Tech:** Wrapper around `@hugeicons/react`.
    *   **Tokens:** Map size props (`sm`, `md`...) to standard px values.

### Phase 2: Motion System
*Goal: Make the app feel "alive" and responsive.*

8.  **[x] Motion Utilities**
    *   Create `/lib/motion.ts`.
    *   Export standard `variants` (fade, slideUp, scaleIn) and `transitions`.
9.  **[x] Page Transition Wrapper**
    *   Implement `AnimatePresence` layout for route changes.
    *   Standard `slideUp` + `fade` entrance.
10. **[x] Micro-interaction Hooks**
    *   `useButtonInteraction`: Standardize press/hover scales.
    *   `useListItemInteraction`: Standardize list item hover/focus physics.
11. **[x] DnD Enhancement**
    *   Create `SortableItem` wrapper.
    *   **Physics:** Scale up on drag start, shadow elevation change.
    *   **Layout:** Smooth reordering animations.

### Phase 3: Composites
*Goal: Assemble primitives into complex, interactive UI features.*

12. **[x] Dialog (Modal) System**
    *   **Base:** Radix UI Dialog.
    *   **UX:** Overlay blur, scale+fade entrance, strictly managed focus trap.
13. **[x] Dropdown Menus**
    *   **Base:** Radix UI DropdownMenu.
    *   **Motion:** Staggered entrance for children items, origin-aware expansion.
14. **[x] Toast System**
    *   **Base:** Sonner.
    *   **Theming:** Custom styling to match design tokens (Success, Error, Info, Action).
15. **[x] Checklist Item (The Core)**
    *   **States:** Default, Hover, Editing, Completed, Dragging.
    *   **Visuals:** Animated SVG checkbox check, strikethrough transition.
16. **[x] Checklist Container**
    *   **Features:** Empty state illustration, skeleton loading, independent scroll areas.

### Phase 4: Shell & Layout
*Goal: Create the frame that holds the application together.*

17. **[x] App Shell**
    *   **Sidebar:** Collapsible (240px -> 64px) with smooth width transition.
    *   **Mobile:** Drawer variant for small screens.
    *   **Header:** Sticky context bar.
18. **[x] Navigation**
    *   **Active State:** "Pill" highlight background + border accent.
    *   **Hover:** Subtle background fade.
19. **[x] Breadcrumb Navigation**
    *   **Pattern:** Home > Parent > [Current].
    *   **Style:** Current item is text (non-clickable), ancestors are muted links.

### Phase 5: Feedback & Onboarding
*Goal: Guide the user and handle edge cases gracefully.*

20. **[x] Skeleton Loading System**
    *   **Variants:** `Text`, `Card`, `Circle`, `List`.
    *   **Animation:** Standardized shimmer effect (sync speed with design tokens).
21. **[x] Empty States**
    *   **Pattern:** Illustration -> Headline -> Description -> Call to Action (CTA).
22. **[x] User Onboarding**
    *   **Tech:** NextStep.js.
    *   **Features:** Contextual tour steps, persistence via Supabase/Zustand.

### Phase 6: Polish & Refinement
*Goal: The final 10% that differentiates "good" from "premium".*

23. **[x] Reduced Motion Support**
    *   Hook: `useReducedMotion`.
    *   Logic: Disable layout animations and transform transitions if system pref is set.
24. **[x] Dark Mode Perfection**
    *   Verify all color tokens in Dark context.
    *   Persist preference to local storage/user profile.
25. **[x] Accessibility & Focus Review**
    *   **Focus:** Ensure highly visible focus rings (blue/brand color) on all standard inputs.
    *   **Management:** Test focus restoration when closing all modals/drawers.

---

## 4. Code Quality Standards

For every deliverable, we verify:
1.  **No Magic Values:** All colors/spacing use `tokens.ts`.
2.  **Strict Types:** No `any`. CVA variants must be inferred.
3.  **A11y:** All interactive elements must work with `Tab` and `Enter/Space`.
4.  **Colocation:** Variants defined with the component or in a dedicated definition file.
5.  **Clean DOM:** No unnecessary nesting of `div` soup. Use Fragments.

## 5. Delivrable Format

Each task completion must include:
*   Updated Component Code (`.tsx`)
*   Variant Definitions (if applicable)
*   Animation Variants (if applicable)
*   Short usage example code block (or Story update)
