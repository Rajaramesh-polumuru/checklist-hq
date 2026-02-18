# Frontend Design Architecture & Philosophy

> **Guideline Goal:** Zero ambiguity in visual implementation. Every design decision is documented, every pattern is reusable, every edge case is accounted for.

---

## 1. Core Design Principles

### 1.1 Progressive Disclosure

- **Rule:** Show only what is needed for the current context.
- **Why:** Reduces cognitive load for complex checklist operations.
- **Pattern:** Use `Collapsible` for nested sub-tasks; hide delete/archive actions behind hover or a specific "Edit Mode."
- **Example:** A checklist item shows only its title by default. On hover: action icons appear. On click: details expand. On "Edit Mode": drag handles, reorder controls, and delete buttons appear.

### 1.2 Feedback Immediacy (The 100ms Rule)

- **Rule:** Interface must react instantly (<100ms for local actions, <300ms for network actions with optimistic UI).
- **Implementation:**
  - **Click:** Always use `active:scale-95` on actionable buttons.
  - **Fetch:** Show standard Skeleton (`h-4 w-32 animate-pulse`) immediately.
  - **Mutation:** Use Optimistic Updates in React Query — update the UI before the server confirms.
  - **Navigation:** Use route prefetching for predictable next-page transitions.

### 1.3 Accessibility as a Foundation (WCAG AA+)

- **Semantic HTML:** `<button>` for actions, `<a>` for navigation. Never use `<div onClick>`.
- **Focus:** All interactive elements MUST have `focus-visible:ring-2 focus-visible:ring-ring`.
- **Keyboard:** Ensure `Tab` flow is logical. Use `radix-ui` primitives to guarantee this.
- **ARIA:** Provide `aria-label` for icon-only buttons. Use `aria-live="polite"` for dynamic status updates.
- **Contrast:** All text must meet WCAG AA minimum (4.5:1 for body text, 3:1 for large text and UI elements).
- **Motion:** Respect `prefers-reduced-motion`. Wrap all animations in a media query check or use Framer Motion's `useReducedMotion`.

### 1.4 Consistency Over Cleverness

- **Rule:** Use existing patterns before inventing new ones.
- **Why:** Users build muscle memory. Every novel interaction pattern adds learning cost.
- **Pattern:** Before creating a new component or interaction, check if an existing one can be extended.

---

## 2. Design Token System

**Do not use magic numbers.** Use the following standardized Tailwind classes exclusively.

### 2.1 Spacing Scale

| Size        | Class | Pixels | Usage                              |
| :---------- | :---- | :----- | :--------------------------------- |
| **None**    | `0`   | 0px    | Reset                              |
| **2XS**     | `0.5` | 2px    | Tight inner padding                |
| **XS**      | `1`   | 4px    | Tight elements (tags, badges)      |
| **Small**   | `2`   | 8px    | Button padding, icon spacing       |
| **Medium**  | `4`   | 16px   | Card padding, standard gap         |
| **Large**   | `6`   | 24px   | Section separation                 |
| **X-Large** | `8`   | 32px   | Major section dividers             |
| **2X-Large**| `10`  | 40px   | Page-level spacing                 |

### 2.2 Typography (Inter)

| Level          | Classes                                  | Usage                            |
| :------------- | :--------------------------------------- | :------------------------------- |
| **Brand**      | `font-brand` (Outfit)                    | Logo and primary brand headers   |
| **Page Title** | `text-2xl font-bold tracking-tight`      | H1 — one per page               |
| **Section**    | `text-xl font-semibold`                  | H2 — major sections             |
| **Subsection** | `text-lg font-medium`                    | H3 — subsections                |
| **Body**       | `text-sm text-foreground`                | Default body text                |
| **Secondary**  | `text-sm text-muted-foreground`          | Supporting/descriptive text      |
| **Small**      | `text-xs font-medium`                    | Metadata, badges, timestamps     |
| **Mono**       | `text-xs font-mono`                      | Code, IDs, technical values      |

### 2.3 Animation & Motion

| Type         | Classes                                            | Usage                     |
| :----------- | :------------------------------------------------- | :------------------------ |
| **Hover**    | `transition-all duration-200 ease-in-out`          | Color/opacity changes     |
| **Enter**    | `animate-in fade-in zoom-in-95 duration-200`       | Element appearing         |
| **Exit**     | `animate-out fade-out zoom-out-95 duration-100`    | Element disappearing      |
| **Slide In** | `animate-in slide-in-from-bottom-2 duration-200`   | Dropdowns, toasts         |
| **Layout**   | Framer Motion `layout` prop                        | Reordering, list changes  |
| **Skeleton** | `animate-pulse`                                    | Loading placeholders      |

**Reduced Motion:** Always wrap non-essential animations:
```tsx
const prefersReducedMotion = useReducedMotion();
// Skip layout animations if user prefers reduced motion
```

### 2.4 Colors (Semantic Mapping)

| Token              | Classes                                    | Usage                          |
| :----------------- | :----------------------------------------- | :----------------------------- |
| **Primary**        | `bg-primary text-primary-foreground`       | Main CTAs, active states       |
| **Secondary**      | `bg-secondary text-secondary-foreground`   | Secondary actions              |
| **Destructive**    | `bg-destructive text-destructive-foreground` | Delete, remove, danger       |
| **Muted**          | `bg-muted text-muted-foreground`           | Backgrounds, secondary info    |
| **Accent**         | `bg-accent text-accent-foreground`         | Highlights, hover states       |
| **Border**         | `border-border`                            | Standard dividers              |
| **Input**          | `border-input`                             | Form control borders           |
| **Success**        | `text-green-600 dark:text-green-400`       | Completed states               |
| **Warning**        | `text-yellow-600 dark:text-yellow-400`     | Caution states                 |
| **Info**           | `text-blue-600 dark:text-blue-400`         | Informational states           |

**Rule:** Never use raw Tailwind colors (`bg-blue-500`) for semantic purposes. Only use semantic tokens. Raw colors are acceptable only for decorative/accent elements that don't carry meaning.

### 2.5 Shadows & Elevation

| Level        | Class          | Usage                                |
| :----------- | :------------- | :----------------------------------- |
| **None**     | `shadow-none`  | Flat elements                        |
| **Small**    | `shadow-sm`    | Cards, subtle depth                  |
| **Medium**   | `shadow-md`    | Dropdowns, popovers                  |
| **Large**    | `shadow-lg`    | Modals, dialogs                      |

### 2.6 Border Radius

| Type        | Class         | Usage                               |
| :---------- | :------------ | :---------------------------------- |
| **Small**   | `rounded-sm`  | Badges, tags                        |
| **Default** | `rounded-md`  | Buttons, inputs, cards              |
| **Large**   | `rounded-lg`  | Dialogs, large cards                |
| **Full**    | `rounded-full` | Avatars, circular buttons          |

### 2.7 Z-Index Scale

| Level        | Class     | Usage                                      |
| :----------- | :-------- | :----------------------------------------- |
| **Base**     | `z-0`     | Default stacking                           |
| **Dropdown** | `z-10`    | Dropdown menus, popovers                   |
| **Sticky**   | `z-20`    | Sticky headers, fixed sidebars             |
| **Overlay**  | `z-30`    | Backdrop overlays                          |
| **Modal**    | `z-40`    | Dialog/modal content                       |
| **Toast**    | `z-50`    | Toast notifications (always on top)        |

**Rule:** Never use arbitrary z-index values. Always use this scale.

---

## 3. Layout System & Responsive Design

> **Core Rule:** Mobile-first, always. Write the mobile layout as the default, then layer complexity upward with breakpoint prefixes. Never design desktop-first and "fix" mobile later.

### 3.1 Responsive Breakpoints

| Breakpoint  | Prefix | Min Width | Hook Value                  | Usage                          |
| :---------- | :----- | :-------- | :-------------------------- | :----------------------------- |
| **Mobile**  | (none) | 0px       | `isMobile: true`            | Default — single column, stacked |
| **Tablet**  | `sm:`  | 640px     | `isTablet: true`            | Two-column grids, wider cards  |
| **Desktop** | `md:`  | 768px     | —                           | Sidebar visible, compact sizing |
| **Wide**    | `lg:`  | 1024px    | `isDesktop: true`           | Multi-column layouts           |
| **Ultra**   | `xl:`  | 1280px    | —                           | Max-width containers fill      |

**Hook Usage:** Use `useMobile()` from `src/hooks/useMobile.ts` when breakpoint-dependent logic is needed in JS (not just CSS):

```tsx
const { isMobile, isTablet, isDesktop, isTouchDevice } = useMobile();

// Use for JS logic (conditional rendering, event handlers)
onMouseEnter={() => !isMobile && setIsHovered(true)}

// Use Tailwind prefixes for CSS-only responsiveness
<div className="px-4 md:px-6 py-4 md:py-6">
```

**Rule:** Prefer Tailwind breakpoint prefixes for layout/styling. Only use `useMobile()` when you need to change behavior (e.g., different event handlers, conditional component rendering, different animation parameters).

### 3.2 App Shell Structure

The app uses a **sidebar + main content** layout with a mobile drawer fallback:

```
┌──────────────────────────────────────────────┐
│ Desktop (md+)                                │
│ ┌──────────┬───────────────────────────────┐ │
│ │ Sidebar  │  Main Content                 │ │
│ │ 80/250px │  flex-1, min-w-0              │ │
│ │ (toggle) │  overflow-y-auto              │ │
│ └──────────┴───────────────────────────────┘ │
│                                              │
│ Mobile (<md)                                 │
│ ┌──────────────────────────────────────────┐ │
│ │ Sticky Header (h-14, hamburger + logo)   │ │
│ ├──────────────────────────────────────────┤ │
│ │ Full-width Content                       │ │
│ │ overflow-y-auto                          │ │
│ └──────────────────────────────────────────┘ │
│ + Drawer (Dialog, slides from left, w-3/4)   │
└──────────────────────────────────────────────┘
```

- **Sidebar:** `hidden md:flex` — completely hidden on mobile, replaced by drawer.
- **Mobile Header:** `md:hidden` — sticky top bar with hamburger trigger.
- **Drawer:** Auto-closes on route change via `useEffect` on `location.pathname`.

### 3.3 Grid Patterns

```tsx
// Standard card grid — the primary pattern for listings
// Auto-fits cards between 250px-300px, centers when few items
<div className="grid grid-cols-[repeat(auto-fit,minmax(250px,300px))] gap-6 justify-center">

// Explicit responsive grid (when card count is predictable)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Two-column page layout (content + aside)
<div className="flex flex-col lg:flex-row gap-8">
  <main className="flex-1 min-w-0">...</main>
  <aside className="w-full lg:w-80 shrink-0">...</aside>
</div>

// Stacking filters/actions (row on desktop, column on mobile)
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
```

**Rule:** Use the `auto-fit` grid as the default for card layouts. It eliminates the need for manual breakpoint management and handles edge cases (1 item, 20 items) gracefully.

### 3.4 Container Widths

| Context       | Max Width    | Padding                   | Usage                         |
| :------------ | :----------- | :------------------------ | :---------------------------- |
| **Page**      | `max-w-6xl`  | `px-4 md:px-6`            | Standard page content         |
| **Form**      | `max-w-2xl`  | `px-4 md:px-6`            | Forms, settings panels        |
| **Dialog**    | `max-w-lg`   | `p-4 sm:p-6`              | Modal dialogs                 |
| **Narrow**    | `max-w-md`   | `px-4`                    | Auth pages, confirmations     |
| **Full Bleed**| `max-w-none` | `px-4 md:px-6`            | Dashboards, wide tables       |

### 3.5 Responsive Spacing

Spacing should breathe on larger screens and compact on smaller ones:

```tsx
// Page container
<div className="container mx-auto px-4 md:px-6 py-4 md:py-6">

// Section gaps
<div className="space-y-6 md:space-y-8">

// Card padding
<div className="p-4 md:p-6">
```

### 3.6 Touch Targets (WCAG AAA)

All interactive elements must meet minimum touch target sizes on mobile:

| Element         | Mobile Size  | Desktop Size | Standard                    |
| :-------------- | :----------- | :----------- | :-------------------------- |
| **Buttons**     | `h-11` (44px)| `h-9` (36px) | `h-11 md:h-9`              |
| **Small Button**| `h-11` (44px)| `h-8` (32px) | `h-11 md:h-8`              |
| **Icon Button** | `44x44px`    | `36x36px`    | `h-11 w-11 md:h-9 md:w-9`  |
| **List Items**  | `py-4`       | `py-2.5`     | Adequate vertical tap area  |
| **Checkboxes**  | `size-5`     | `size-4`     | With surrounding padding    |

**Rule:** The minimum touch target is **44x44px** on touch devices. This is non-negotiable. Use the responsive height pattern (`h-11 md:h-9`) on all interactive elements.

### 3.7 Responsive Typography

Prevent iOS Safari auto-zoom by ensuring inputs are at least 16px on mobile:

```tsx
// Inputs — 16px base prevents iOS zoom, 14px on desktop
<input className="text-base md:text-sm" />

// Page titles scale down on mobile
<h1 className="text-xl md:text-2xl font-bold tracking-tight">

// Body text stays consistent
<p className="text-sm">
```

### 3.8 Responsive Component Adaptations

#### Navigation & Actions

| Pattern              | Mobile                              | Desktop                              |
| :------------------- | :---------------------------------- | :----------------------------------- |
| **Primary Nav**      | Drawer (slide from left)            | Sidebar (collapsible)                |
| **Page Actions**     | Full-width stacked buttons          | Inline row of buttons                |
| **Filters**          | Stacked vertically, full-width      | Horizontal row                       |
| **Search**           | Full-width                          | Fixed-width (`w-64` or similar)      |
| **Context Menus**    | Bottom sheet or centered modal      | Inline dropdown                      |

#### Content Display

| Pattern              | Mobile                              | Desktop                              |
| :------------------- | :---------------------------------- | :----------------------------------- |
| **Card Grids**       | Single column                       | Auto-fit 2-4 columns                |
| **Tables**           | Scroll horizontally (`overflow-auto`) | Full-width                         |
| **Two-Pane Layout**  | Stacked vertically                  | Side by side (`flex-col lg:flex-row`)|
| **Sidebar + Content**| Content only, sidebar in drawer     | Side-by-side                         |
| **Metadata/Badges**  | Below title, wrapped                | Inline with title                    |

#### Interaction Patterns

| Pattern              | Mobile (Touch)                      | Desktop (Mouse)                      |
| :------------------- | :---------------------------------- | :----------------------------------- |
| **Hover Actions**    | Always visible                      | Show on hover                        |
| **Drag Handles**     | Larger (`w-10 h-10`)               | Standard (`w-6 h-6`)                |
| **Item Actions**     | "More" (⋮) button → modal menu     | Inline icon buttons                  |
| **Tooltips**         | Hidden (use `aria-label` instead)   | Show on hover after delay            |
| **Click Feedback**   | `active:scale-95` + haptic (OS)     | `hover:bg-accent` + `active:scale-95`|

```tsx
// Conditional hover behavior pattern
<div
  onMouseEnter={() => !isMobile && setIsHovered(true)}
  onMouseLeave={() => !isMobile && setIsHovered(false)}
>
  {/* On mobile: always show actions. On desktop: show on hover */}
  {(isMobile || isHovered) && <ActionButtons />}
</div>
```

### 3.9 Dialog & Modal Responsiveness

Dialogs must breathe on mobile — never touch screen edges or overflow viewport:

```tsx
// Dialog content
<DialogContent className={cn(
  "max-w-[calc(100vw-2rem)] sm:max-w-lg",  // 1rem margin on each side
  "max-h-[calc(100vh-2rem)] overflow-y-auto", // Scrollable if tall
  "p-4 sm:p-6"                                // Less padding on mobile
)}>
```

**Rules:**
- Dialogs use `max-w-[calc(100vw-2rem)]` on mobile for breathing room.
- Dialog content is scrollable (`overflow-y-auto`) with `max-h-[calc(100vh-2rem)]`.
- Footer buttons stack on mobile: `flex flex-col-reverse sm:flex-row sm:justify-end gap-2`.

### 3.10 Responsive Images & Media

```tsx
// Responsive image (fills container, maintains aspect)
<img className="w-full h-auto rounded-md object-cover" />

// Constrained media with aspect ratio
<div className="aspect-video w-full rounded-lg overflow-hidden">
  <img className="w-full h-full object-cover" />
</div>

// Avatar sizing
<Avatar className="size-8 md:size-10" />
```

### 3.11 Overflow & Scrolling

- **Horizontal Scroll:** Use `overflow-x-auto` for tables and wide content. Add `-webkit-overflow-scrolling: touch` via Tailwind.
- **Vertical Scroll:** Main content areas use `overflow-y-auto`. Never use `overflow: hidden` on body.
- **Scroll Snap:** Use `snap-x snap-mandatory` for horizontal carousels on mobile.
- **Min Width Guard:** Always add `min-w-0` on flex children to prevent content from blowing out the container.

```tsx
// Table wrapper for mobile
<div className="overflow-x-auto -mx-4 px-4">
  <table className="w-full min-w-[600px]">...</table>
</div>

// Flex child overflow protection
<div className="flex gap-4">
  <div className="flex-1 min-w-0 truncate">Long text that won't overflow</div>
</div>
```

### 3.12 Testing Checklist

Before shipping any component, verify these responsive behaviors:

- [ ] **320px** — Nothing overflows, all content is readable
- [ ] **375px** — Standard mobile (iPhone SE) — full functionality
- [ ] **768px** — Tablet — layout transitions work (sidebar appears, grids adjust)
- [ ] **1024px** — Desktop — all features accessible
- [ ] **1440px** — Wide — content doesn't stretch too wide (max-width applied)
- [ ] **Touch targets** — All buttons/links are at least 44x44px on mobile
- [ ] **Inputs** — No iOS zoom on focus (font-size >= 16px on mobile)
- [ ] **Dialogs** — Don't touch edges, are scrollable, footer buttons stack
- [ ] **Text** — No horizontal scroll, long text truncates with `truncate` or wraps
- [ ] **Orientation** — Works in both portrait and landscape on mobile

---

## 4. Component Implementation Rules

### 4.1 Radix UI Primitives

Always use Headless UI (Radix) for complex interactions. Never build custom implementations of:

- **Dropdowns:** `DropdownMenu`
- **Modals:** `Dialog`
- **Tooltips:** `Tooltip`
- **Toggles:** `Switch`
- **Tabs:** `Tabs`
- **Accordion:** `Accordion` / `Collapsible`
- **Select:** `Select`
- **Context Menu:** `ContextMenu`

### 4.2 Styling Composition

Use `cn()` for every logical class grouping.

```tsx
// Good — composable, overridable
<div className={cn("flex flex-col gap-4", className)}>...</div>

// Good — conditional styling
<button className={cn(
  "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
  variant === "primary" && "bg-primary text-primary-foreground",
  variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
  disabled && "opacity-50 pointer-events-none"
)}>

// Bad — string concatenation
<div className={"flex flex-col gap-4 " + className}>...</div>
```

### 4.3 Iconography

Use `@hugeicons/react`.

- **Size:** Standard size is `size-4` (16px) or `size-5` (20px).
- **Stroke:** Standard stroke width is `stroke-[1.5]`.
- **Color:** Icons inherit text color. Use `text-muted-foreground` for secondary icons.

```tsx
// Standard icon usage
<Settings01Icon className="size-4 stroke-[1.5] text-muted-foreground" />

// Icon button (always provide aria-label)
<button aria-label="Settings" className="p-2 rounded-md hover:bg-accent">
  <Settings01Icon className="size-4 stroke-[1.5]" />
</button>
```

---

## 5. State Patterns

### 5.1 Loading States

Always show immediate feedback. Never leave the user staring at a blank screen.

```tsx
// Skeleton pattern for lists
<div className="space-y-2">
  {[1, 2, 3].map((i) => (
    <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
  ))}
</div>

// Skeleton pattern for text
<div className="space-y-2">
  <div className="h-4 w-48 rounded bg-muted animate-pulse" />
  <div className="h-4 w-32 rounded bg-muted animate-pulse" />
</div>

// Inline loading for buttons
<Button disabled>
  <Loader2 className="size-4 animate-spin mr-2" />
  Saving...
</Button>
```

### 5.2 Empty States

Every list/collection view must handle the empty case with a clear message and a call to action.

```tsx
// Standard empty state
<div className="flex flex-col items-center justify-center py-10 text-center">
  <IconComponent className="size-10 text-muted-foreground mb-4" />
  <p className="text-sm font-medium text-foreground">No items yet</p>
  <p className="text-sm text-muted-foreground mt-1">
    Create your first checklist to get started.
  </p>
  <Button className="mt-4" size="sm">Create Checklist</Button>
</div>
```

### 5.3 Error States

Errors should be specific, actionable, and non-destructive.

```tsx
// Inline error (for failed data fetches)
<div className="flex items-center gap-2 p-4 rounded-md bg-destructive/10 text-destructive text-sm">
  <AlertCircle className="size-4 shrink-0" />
  <span>Failed to load checklists. Please try again.</span>
  <Button variant="ghost" size="sm" onClick={refetch}>Retry</Button>
</div>

// Toast (for mutation failures) — use sonner
toast.error("Failed to save changes. Please try again.");
```

### 5.4 Confirmation Patterns

Destructive actions always require confirmation.

```tsx
// Use AlertDialog (Radix) for destructive confirmations
// Pattern: Verb + Object in the confirm button
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this checklist?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. All versions and run history will be permanently removed.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive">Delete Checklist</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 6. Form Design

### 6.1 Layout Rules

- Labels above inputs (not inline, not floating).
- Error messages below the input, in `text-destructive text-xs`.
- Required fields marked with `*` after the label.
- Group related fields with a `<fieldset>` and visible section heading.

### 6.2 Validation Feedback

- Validate on blur for individual fields.
- Validate on submit for the full form.
- Show errors inline — never in alerts or toasts for validation.

### 6.3 Submit Button States

| State        | Appearance                                          |
| :----------- | :-------------------------------------------------- |
| **Default**  | Enabled, primary color                              |
| **Loading**  | Disabled, spinner icon, text changes to "Saving..."  |
| **Success**  | Brief checkmark animation, then reset               |
| **Error**    | Re-enable button, show error toast                  |

---

## 7. Dark Mode

- All components must work in both light and dark mode.
- Use semantic color tokens (`bg-background`, `text-foreground`, `border-border`) — these automatically adapt.
- Never hardcode light-only colors. If a specific color is needed, always provide the `dark:` variant.
- Test every new component in both modes before considering it complete.

```tsx
// Good — adapts automatically
<div className="bg-card text-card-foreground border-border">

// Good — explicit dark variant when needed
<span className="text-green-600 dark:text-green-400">

// Bad — hardcoded, breaks in dark mode
<div className="bg-white text-gray-900">
```
