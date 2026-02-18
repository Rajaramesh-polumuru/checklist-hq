# UI Refactor Roadmap

> **Goal:** Complete layout and responsiveness overhaul following DESIGN_PHILOSOPHY.md principles. Mobile-first, accessible, consistent.

**Status:** Active Implementation  
**Last Updated:** 2026-02-18  
**Priority:** Critical Path

---

## Quick Reference: Design Tokens

Based on DESIGN_PHILOSOPHY.md Section 2 & 3:

### Breakpoints
- Mobile: 0px (default)
- Tablet: `sm:` 640px
- Desktop: `md:` 768px
- Wide: `lg:` 1024px
- Ultra: `xl:` 1280px

### Touch Targets (WCAG AAA)
- Mobile: `h-11 min-h-[44px] min-w-[44px]`
- Desktop: Scale down with `md:h-9`

### Container Widths
- Page: `max-w-6xl px-4 md:px-6`
- Form: `max-w-2xl`
- Dialog: `max-w-[calc(100vw-2rem)] sm:max-w-lg`

### Grid Patterns
```tsx
// Cards
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6

// Stats
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4

// Two-column layout
flex flex-col lg:flex-row gap-6 md:gap-8
```

---

## Phase 0: Foundation (Prerequisites)

### 0.1 Create Responsive Utilities
**Files:**
- `src/lib/responsive.ts` (NEW)
- `src/components/layout/PageContainer.tsx` (NEW)

**Key Constants:**
```typescript
export const TOUCH_TARGETS = {
  mobile: 'h-11 min-h-[44px] min-w-[44px]',
  desktop: 'md:h-9',
  button: 'h-11 md:h-9 px-4',
}

export const DIALOG = {
  container: 'max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto',
  padding: 'p-4 sm:p-6',
  footer: 'flex flex-col-reverse sm:flex-row sm:justify-end gap-2',
}
```

**Time:** 30 min | **Dependencies:** None

---

## Phase 1: Layout Foundation

### 1.1 Fix Layout.tsx
**File:** `src/components/Layout.tsx`

**Changes:**
```tsx
// Line 56: Remove overflow-hidden
<div className="flex min-h-screen bg-background relative">

// Line 79: Add safe-area support
<header className="... safe-area-inset-top">

// Line 93-100: Fix scroll handling
<main className="flex-1 relative scroll-smooth bg-background/50">
  <div className="w-full min-h-[calc(100vh-3.5rem)] md:min-h-screen">
```

**Testing:**
- [ ] No content clipping on long pages
- [ ] Mobile header displays correctly
- [ ] Sidebar works smoothly

**Time:** 45 min | **Dependencies:** 0.1

### 1.2 Add CSS Safe Areas
**File:** `src/index.css`

```css
@layer utilities {
  .safe-area-inset-top { padding-top: env(safe-area-inset-top); }
  .safe-area-inset-bottom { padding-bottom: env(safe-area-inset-bottom); }
}
```

**Time:** 10 min | **Dependencies:** None

---

## Phase 2: Sidebar

### 2.1 Mobile Drawer Improvements
**File:** `src/components/Sidebar.tsx` (Lines 204-372)

**Changes:**
```tsx
// Better dialog styling
<DialogContent
  className={cn(
    "fixed inset-y-0 left-0 z-50 h-full w-[85%] max-w-[320px]",
    "data-[state=open]:animate-in data-[state=open]:slide-in-from-left-full",
    "rounded-none border-none p-0"
  )}
>
```

**Testing:**
- [ ] Smooth slide animation
- [ ] Organization list scrolls
- [ ] Backdrop tap closes

**Time:** 1 hour | **Dependencies:** 1.1

### 2.2 Add Keyboard Shortcuts
**File:** `src/components/Sidebar.tsx`

```typescript
// Persist state
useEffect(() => {
  localStorage.setItem('sidebar-collapsed', String(collapsed))
}, [collapsed])

// Cmd/Ctrl+B toggle
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault()
      setCollapsed(prev => !prev)
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

**Time:** 20 min | **Dependencies:** None

---

## Phase 3: Dashboard

### 3.1 Layout Fixes
**File:** `src/pages/DashboardPage.tsx`

**Changes:**
```tsx
// Use PageContainer
<PageContainer width="wide">

// Two-column layout
<div className="flex flex-col lg:flex-row gap-6 md:gap-8">
  <main className="flex-1 min-w-0">...</main>
  <aside className="w-full lg:w-80 shrink-0">...</aside>
</div>
```

**Time:** 45 min | **Dependencies:** 0.1

### 3.2 Stats Grid
**File:** `src/pages/dashboard/DashboardStats.tsx`

```tsx
// Consistent grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

// Loading skeleton matches layout
```

**Time:** 30 min | **Dependencies:** 0.1

---

## Phase 4: Repository Cards

### 4.1 RepositoryCard Component
**File:** `src/pages/dashboard/RepositoryCard.tsx`

**Changes:**
```tsx
// Consistent height
<Card className="h-full min-h-[200px]">

// Actions always visible on mobile
<Button className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100">

// Responsive footer
<CardFooter className="flex flex-col sm:flex-row gap-2">
```

**Testing:**
- [ ] Actions visible without hover on mobile
- [ ] Consistent card heights
- [ ] 44px touch targets

**Time:** 45 min | **Dependencies:** None

### 4.2 Repository Grid
**File:** `src/pages/dashboard/RepositoryList.tsx`

```tsx
// Explicit responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
```

**Time:** 15 min | **Dependencies:** 0.1

---

## Phase 5: Explore Page

### 5.1 Hero Section
**File:** `src/pages/Explore.tsx` (Lines 196-317)

**Changes:**
```tsx
// Responsive typography
className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight"

// Search with padding
className="w-full max-w-lg mx-auto px-4"
```

**Time:** 30 min | **Dependencies:** 0.1

### 5.2 Filter Bar
**File:** `src/pages/Explore.tsx` (Lines 320-371)

**Changes:**
```tsx
// Scrollable with fade indicators
<div className="overflow-x-auto scrollbar-hide">
  <div className="flex gap-2">
    {tags.map(tag => <Button className="h-10 sm:h-8 shrink-0">...</Button>)}
  </div>
</div>
<div className="absolute left-0 w-4 bg-gradient-to-r from-background" /> // fade
```

**Time:** 45 min | **Dependencies:** 0.1

### 5.3 Template Grid
**File:** `src/pages/Explore.tsx` (Lines 459-589)

```tsx
// Consistent grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
```

**Time:** 20 min | **Dependencies:** 0.1

---

## Phase 6: Team Dashboard

### 6.1 Tab Navigation
**File:** `src/pages/TeamDashboard.tsx` (Lines 231-237)

```tsx
<TabsList className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
```

**Time:** 20 min | **Dependencies:** None

### 6.2 Repository Grid
**File:** `src/pages/TeamDashboard.tsx` (Lines 265-323)

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
```

**Time:** 15 min | **Dependencies:** 0.1

---

## Phase 7: Home Page

### 7.1 Hero Section
**File:** `src/pages/Home.tsx` (Lines 167-350)

**Changes:**
```tsx
// Scale down typography
className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold"

// Hide floating cards on smaller screens
className="hidden 2xl:block"

// Proper button stacking
<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
```

**Time:** 30 min | **Dependencies:** 0.1

### 7.2 Feature Grid
**File:** `src/pages/Home.tsx` (Lines 365-416)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
```

**Time:** 15 min | **Dependencies:** None

---

## Phase 8: Auth Pages

### 8.1 Login Page
**File:** `src/pages/Login.tsx`

```tsx
// Constrained form
<div className="w-full max-w-md mx-auto px-4 sm:px-6">

// iOS-safe inputs
<Input className="text-base md:text-sm h-11 md:h-10">

// Responsive buttons
<Button className="w-full sm:w-auto h-11 md:h-10">
```

**Time:** 20 min | **Dependencies:** None

### 8.2 Signup Page
**File:** `src/pages/Signup.tsx`

Apply same changes as Login.

**Time:** 20 min | **Dependencies:** 8.1

---

## Phase 9: Editor Page

### 9.1 Editor Layout
**File:** `src/pages/Editor.tsx`

**Required Changes:**
- [ ] Mobile drawer for config panel
- [ ] Collapse toolbar to "More" menu on mobile
- [ ] Touch-friendly checklist items (44px targets)
- [ ] Readable indentation on small screens

**Time:** 3 hours | **Dependencies:** 0.1, 2.1

---

## Phase 10: Modals & Dialogs

### 10.1 Dialog Component
**File:** `src/components/ui/dialog.tsx`

```tsx
<DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto p-4 sm:p-6">

<DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
```

**Time:** 30 min | **Dependencies:** 0.1

### 10.2 Sheet Component
**File:** `src/components/ui/sheet.tsx`

```tsx
// Full width on mobile
className="w-full sm:max-w-lg"

// Add swipe-to-close if needed
```

**Time:** 30 min | **Dependencies:** None

---

## Testing Checklist

### Responsive Breakpoints
- [ ] **320px** (iPhone SE) - No overflow, readable text
- [ ] **375px** (iPhone 14) - Full functionality
- [ ] **768px** (iPad Mini) - Layout transitions work
- [ ] **1024px** (Desktop) - Sidebar visible
- [ ] **1440px** (Wide) - Max-width containers work

### Touch & Accessibility
- [ ] All buttons 44x44px minimum on touch
- [ ] Inputs 16px font-size (no iOS zoom)
- [ ] Focus visible on all interactive elements
- [ ] Keyboard navigation works
- [ ] Screen reader labels present

### Interaction Patterns
- [ ] Hover actions visible on mobile
- [ ] Dialogs don't touch screen edges
- [ ] Scrollable areas indicated
- [ ] Loading states match final layout

### Performance
- [ ] No layout thrashing during resize
- [ ] Animations respect prefers-reduced-motion
- [ ] Images lazy-loaded
- [ ] No FOUC (Flash of Unstyled Content)

---

## Implementation Order

1. **Phase 0** (Foundation) - 30 min
2. **Phase 1** (Layout) - 55 min
3. **Phase 2** (Sidebar) - 80 min
4. **Phase 3** (Dashboard) - 75 min
5. **Phase 4** (Cards) - 60 min
6. **Phase 5** (Explore) - 95 min
7. **Phase 6** (Team) - 35 min
8. **Phase 7** (Home) - 45 min
9. **Phase 8** (Auth) - 40 min
10. **Phase 9** (Editor) - 180 min
11. **Phase 10** (Modals) - 60 min

**Total Estimated Time:** ~13 hours

---

## Success Criteria

All phases complete when:
- [ ] Zero horizontal scroll on all screen sizes
- [ ] All touch targets meet WCAG AAA (44px)
- [ ] Typography scales appropriately across breakpoints
- [ ] Layouts adapt gracefully without content loss
- [ ] All interactions work with keyboard only
- [ ] Screen readers can navigate all content
- [ ] Dark mode works on all refactored components
- [ ] `npm run lint` passes without errors
