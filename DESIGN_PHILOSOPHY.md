# Frontend Design Architecture & Philosophy

> **Guideline Goal:** Zero ambiguity in visual implementation.

## 1. Core Design Principles

### Progressive Disclosure
- **Rule:** Show only what is needed for the current context.
- **Why:** Reduces cognitive load for complex checklist operations.
- **Pattern:** Use `Collapsible` for nested sub-tasks; hide delete/archive actions behind hover or specific "Edit Mode".

### Feedback Immediacy (The 100ms Rule)
- **Rule:** Interface must react instantly (<100ms).
- **Implementation:**
  - **Click:** Always use `active:scale-95` on actionable buttons.
  - **Fetch:** Show standard Skeleton (`h-4 w-32 animate-pulse`) immediately.
  - **Mutation:** Use Optimistic Updates in React Query.

### Accessibility as a Foundation (WCAG AA+)
- **Semantic HTML:** `<button>` for actions, `<a>` for navigation.
- **Focus:** All interactive elements MUST have `focus-visible:ring-2 focus-visible:ring-ring`.
- **Keyboard:** Ensure `Tab` flow is logical. Use `radix-ui` primitives to guarantee this.

## 2. Design Token System

**Do not use magic numbers.** Use the following standardized Tailwind classes.

### Spacing Scale
| Size | Class | Pixels | Usage |
| :--- | :--- | :--- | :--- |
| **None** | `0` | 0px | Reset |
| **XS** | `1` | 4px | Tight elements (tags, badges) |
| **Small** | `2` | 8px | Button padding, icon spacing |
| **Medium** | `4` | 16px | Card padding, standard gap |
| **Large** | `6` | 24px | Section separation |
| **X-Large** | `10` | 40px | Major page dividers |

### Typography (Inter)
- **Headings:** `text-2xl font-bold tracking-tight` (H1), `text-xl font-semibold` (H2)
- **Body:** `text-sm text-foreground` (Default), `text-sm text-muted-foreground` (Secondary)
- **Small:** `text-xs font-medium` (Metadata, badges)

### Animation & Motion
- **Hover:** `transition-all duration-200 ease-in-out`
- **Enter:** `animate-in fade-in zoom-in-95 duration-200`
- **Exit:** `animate-out fade-out zoom-out-95 duration-100`

### Colors (Semantic Mapping)
- **Primary:** `bg-primary text-primary-foreground` (Main Actions)
- **Destructive:** `bg-destructive text-destructive-foreground` (Hiding/Deleting)
- **Muted:** `bg-muted text-muted-foreground` (Secondary info, backgrounds)
- **Border:** `border-border` (Standard borders)
- **Input:** `border-input` (Form controls)

## 3. Component Implementation Rules

### 1. Radix UI Primitives
Always use Headless UI (Radix) for complex interactions.
- **Dropdowns:** `DropdownMenu`
- **Modals:** `Dialog`
- **Tooltips:** `Tooltip`
- **Toggles:** `Switch`

### 2. Styling Composition
Use `cn()` for every logical class grouping.
```tsx
// Good
<div className={cn("flex flex-col gap-4", className)}>...</div>
```

### 3. Iconography
Use `@hugeicons/react`.
- **Size:** Standard size is `size-4` (16px) or `size-5` (20px).
- **Stroke:** Standard stroke width is `stroke-[1.5]`.
```tsx
<Settings01Icon className="size-4 stroke-[1.5] text-muted-foreground" />
```
