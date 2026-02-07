# UI/UX Redesign Roadmap: Organization Dashboard & Navigation

> **Objective:** Redesign the core navigation and organization dashboard to match the *Checklist HQ* design philosophy: "Zero ambiguity", "Premium Aesthetics", and "Fluid Interactions".

## 📅 Phases Overview

| Phase | Focus | Status |
| :--- | :--- | :--- |
| **Phase 1** | **Navigation Architecture (Sidebar)** | ⬜ Pending |
| **Phase 2** | **Hero Section Overhaul** | ⬜ Pending |
| **Phase 3** | **Content Composition (Dashboard)** | ⬜ Pending |
| **Phase 4** | **Global Polish & Animations** | ⬜ Pending |

---

## 🏗 Phase 1: Navigation Architecture (Sidebar)

**Goal:** Transform the sidebar from a simple list into a robust *Command Center*.

### 1.1 Visual Refinement (Glassmorphism & Depth)
- [ ] **Background:** Implement `backdrop-filter: blur(20px)` with a subtle `bg-sidebar/80` (requires defining `sidebar` color semantic token).
- [ ] **Borders:** Remove the harsh right border; use a subtle `box-shadow` or `1px` white/black alpha border for separation.
- [ ] **Typography:** Update sidebar links to usage `text-sm font-medium` from `Inter`.
- [ ] **Active States:**
  - Replace the "left border line" with a **soft background pill** (`bg-primary/10 text-primary`).
  - Add a subtle **glow effect** for the active item.

### 1.2 Interaction Design
- [ ] **Collapsible Sections:** Use `Collapsible` primitive from Radix UI for the "Organizations" list.
  - *Current:* Custom state `orgsExpanded`.
  - *New:* `<Collapsible open={isOpen} onOpenChange={setIsOpen}>` for better a11y.
- [ ] **Quick Switcher:**
  - Replace the static "Checklist HQ" header with a **Organization Switcher Dropdown**.
  - Allows users to switch contexts (Personal vs Org) without navigating back to the list.
- [ ] **Mobile Drawer:**
  - Ensure the mobile drawer duplicates the *exact* feel of the desktop sidebar but with larger touch targets (`min-h-[44px]`).

### 1.3 Component Structure (`Sidebar.tsx`)
- [ ] Extract `SidebarItem` into a dedicated component with `framer-motion` built-in (`layoutId` for smooth active state transitions).
- [ ] Group navigation into logical clusters: *Core*, *Workspace*, *Settings*.

---

## 🎨 Phase 2: Hero Section Overhaul

**Goal:** Create an impactful "First Glance" experience for the Organization Dashboard.

### 2.1 Visual Hierarchy
- [ ] **Cover Area:** Introduce a "Cover Image" or "Generative Gradient" area (height ~160px) behind the avatar.
  - *Current:* Small gradient box.
  - *New:* Full-width container with `mask-image` fade-out.
- [ ] **Avatar Elevation:**
  - Increase size to `size-24` (96px) or `size-32` (128px).
  - Add a "cutout" effect (border matching background color) to separate from the cover.
  - Place it *overlapping* the cover and the content area.

### 2.2 Metadata & Actions
- [ ] **Stats Row:** Move "Members", "Teams", "Repos" counts into a distinct "Stats Row" below the title, using lighter typography (`text-muted-foreground`).
- [ ] **Action Bar:**
  - Group "New Project" and "Settings" into a **Toolbar** on the right.
  - Use `Button` variants:
    - Primary: "New Project" (Solid, `bg-primary`)
    - Secondary: "Settings" (Ghost or Outline, `bg-background/50`)
    - Tertiary: "Share" (Icon only)

---

## 🧩 Phase 3: Content Composition (Dashboard)

**Goal:** Enhance the "Repository List" and "Team List" using Component Composition.

### 3.1 Tab Navigation
- [ ] **Visuals:** Move from standard "Underline" tabs to "Pill" or "Segmented Control" style tabs for cleaner separation.
- [ ] **Sticky Header:** Make the filter bar and tabs sticky (`sticky top-0 z-10 backdrop-blur-md`) when scrolling long lists.

### 3.2 Repository Cards (`RepositoryCard.tsx`)
- [ ] **Card Structure:**
  ```tsx
  <RepositoryCard.Root>
    <RepositoryCard.Header>
      <Icon />
      <Title />
      <Badge>Public</Badge>
    </RepositoryCard.Header>
    <RepositoryCard.Stats>
      <Stat icon={Play} value={12} label="Runs" />
      <Stat icon={Clock} value="2d ago" label="Last updated" />
    </RepositoryCard.Stats>
    <RepositoryCard.Actions>
       <Button>Run</Button> {/* Hover only */}
    </RepositoryCard.Actions>
  </RepositoryCard.Root>
  ```
- [ ] **Hover Effects:**
  - Card should lift slightly (`-translate-y-1`) and shadow should increase (`shadow-md` -> `shadow-lg`).
  - "Run" button should appear *only* on hover (progressive disclosure).

### 3.3 Empty States
- [ ] **Interactive Empty States:**
  - Instead of just "No repositories", offer:
    - "Import from..."
    - "Use Template..."
    - "Create Blank..."
  - Use SVG illustrations that match the brand colors.

---

## ✨ Phase 4: Global Polish

**Goal:** Ensure "Fluidity" and "Consistency".

### 4.1 Motion (Framer Motion)
- [ ] **Page Transitions:** Ensure the dashboard content fades in (`opacity: 0 -> 1`, `y: 10 -> 0`) when navigating from the sidebar.
- [ ] **List Stagger:** Stagger the appearance of repository cards (`staggerChildren: 0.05`).

### 4.2 Accessibility
- [ ] **Skip Links:** Verify "Skip to main content" works with the new sidebar structure.
- [ ] **Keyboard Nav:** Ensure `ArrowKeys` work in the Sidebar organization switcher.

## 📝 Implementation Notes

- **CSS Variables:** Rely heavily on `hsl(var(--primary))` and `hsl(var(--sidebar-background))` to support Dark Mode seamlessly.
- **Iconography:** Continued use of `@hugeicons/react` with `stroke-width="1.5"`.
- **Validation:** Test against `DESIGN_PHILOSOPHY.md` rules (Spacing scale, 100ms rule).
