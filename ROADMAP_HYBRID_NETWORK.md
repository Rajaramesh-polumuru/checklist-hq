# Epic: The Hybrid Network — The Operating System for Process

> **Manifesto Alignment:** Phase 3 — "The Hybrid Network (The Operating System)"
> **Principles:** Distributed Improvement · Composability · Human-in-the-Loop by Design
> **When:** Q3–Q4 2026

---

## 🧭 Strategic Context

### What Has Been Completed

| Epic                                          | Manifesto Phase | Status              |
| :-------------------------------------------- | :-------------- | :------------------ |
| Human Foundation (Commit/Run model)           | Phase 1         | ✅ Complete         |
| Orgs & Teams                                  | —               | ✅ Complete         |
| AI Agent Protocol (MCP, Structured Semantics) | Phase 2         | ✅ 60% (M1-M3 done) |
| Context Export (Copy for Agent)               | Phase 2         | ✅ Complete         |

### What This Epic Delivers

The Manifesto calls for:

> 1. _"Mixed-initiative runs: Human approves Step 1, Agent executes Steps 2-5, Human reviews Step 6."_
> 2. _"Global registry of verified Agent SOPs."_
> 3. _"The global Package Manager for Agent Capabilities."_
> 4. _"Agents should execute small, scoped checklists that call other checklists."_ (Composability)

This is the epic that transforms Checklist HQ from a **tool** into a **platform** — a network effect engine where every checklist published makes the entire ecosystem smarter.

---

## 🎯 Success Metrics

| Metric                                        | Target                      | Measures                |
| :-------------------------------------------- | :-------------------------- | :---------------------- |
| Public SOPs Published                         | ≥ 500 in registry           | Platform adoption       |
| Fork Rate                                     | ≥ 15% of public SOPs forked | Distributed improvement |
| Composed Runs (checklists calling checklists) | ≥ 10% of all runs           | Composability adoption  |
| Mixed-Initiative Completion Rate              | ≥ 90%                       | Handoff reliability     |
| Marketplace Installs                          | ≥ 1,000 total installs      | Network effect          |
| Agent-to-Human Handoff Time                   | < 30 seconds avg            | Seamless orchestration  |

---

## 📦 Epic Breakdown: 6 Milestones, 38 Tasks

---

### Milestone 1: Composable Checklists (The "Import" Primitive)

> _"Complex agent behaviors emerge from simple, verified steps."_
> **Goal:** A checklist item can reference and trigger another checklist as a sub-process.

#### 1.1 Schema: `ref` Item Type

- **File:** `src/types/database.ts`
- **Change:** Add new item type `ref` to `ChecklistItem`.

  ```typescript
  type ChecklistItem = {
    id: string;
    text: string;
    parent: string | null;
    order: number;
    type?: "task" | "header" | "note" | "ref"; // NEW: 'ref'

    // NEW: Reference to another checklist
    ref_config?: {
      repo_id: string; // The referenced checklist
      commit_id?: string; // Pin to specific version (null = latest)
      title: string; // Cached display title
      input_mapping?: Record<string, string>; // Map parent outputs → child inputs
      output_mapping?: Record<string, string>; // Map child outputs → parent context
      execution_mode: "inline" | "spawn";
      // inline: items expand into parent run
      // spawn: creates a separate sub-run
    };
  };
  ```

#### 1.2 Sub-Run Linking in Database

- **Table:** `run_links` (New)
  ```sql
  CREATE TABLE run_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
    child_run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
    parent_item_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(parent_run_id, parent_item_id)
  );
  ```
- **RLS:** Same access as parent run.

#### 1.3 Service: Sub-Run Management

- **File:** `src/services/composed-run.ts` (New)
- **Functions:**
  - [ ] `spawnSubRun(parentRunId, itemId, repoId, commitId?): Promise<Run>` — Creates child run, links it.
  - [ ] `getSubRuns(parentRunId): Promise<LinkedRun[]>` — Fetch all child runs.
  - [ ] `getParentRun(childRunId): Promise<LinkedRun | null>` — Navigate up.
  - [ ] `propagateCompletion(childRunId): void` — When child completes, mark parent item done.
  - [ ] `mapOutputs(childRun, outputMapping): Record<string, unknown>` — Extract child outputs into parent context.

#### 1.4 "Insert Checklist Reference" UI

- **Location:** `src/components/ChecklistEditor.tsx` → item action menu.
- **Trigger:** "🔗 Link Sub-Checklist" option in the `+` menu or right-click context menu.
- **Modal:** `src/components/editor/InsertRefModal.tsx` (New)
  - Search bar to find repositories (user's repos + public registry).
  - Preview of selected checklist structure.
  - Version selector: "Latest" or pin to specific commit.
  - Input/output mapping builder.
  - Execution mode toggle: Inline vs Spawn.

#### 1.5 Composed Run Visualization

- **File:** `src/pages/RunMode.tsx` (Extend)
- **UI for `ref` items:**
  - Indented card with linked checklist icon 🔗.
  - Badge: `Sub-Checklist · 8 items · 3 completed`.
  - Inline expand (if `inline` mode) or "Open Sub-Run →" link (if `spawn` mode).
  - Progress bar showing child run completion.
  - When child completes: auto-advance parent with visual animation.
- **Breadcrumb:** `Parent Run > Sub-Run` navigation in header.

#### 1.6 Dependency Graph Visualization

- **File:** `src/components/run/DependencyGraph.tsx` (New)
- **Library:** `@xyflow/react` (React Flow) or lightweight custom SVG.
- **Shows:** Parent → Child run relationships as a DAG (Directed Acyclic Graph).
- **Interactive:** Click a node to navigate to that run.
- **Purpose:** Visibility into complex multi-checklist orchestrations.

---

### Milestone 2: Mixed-Initiative Orchestration Engine

> _"Human approves Step 1, Agent executes Steps 2-5, Human reviews Step 6."_
> **Goal:** Seamless handoffs between humans and agents within a single run.

#### 2.1 Run Orchestrator State Machine

- **File:** `src/lib/agent/orchestrator.ts` (New)
- **States per Item:**
  ```
  pending → assigned → executing → awaiting_review → completed
                                  ↘ failed → reassigned → executing
  ```
- **Logic:**
  - [ ] `getNextExecutor(run, currentItemId): { type: 'human' | 'agent', id: string }`.
  - [ ] `transitionItem(run, itemId, action): RunProgress` — Pure state machine.
  - [ ] `shouldAutoAdvance(item): boolean` — Check if agent can auto-proceed.
  - [ ] `handleAgentFailure(item): { action: 'retry' | 'escalate' | 'skip' }` — Fallback logic.

#### 2.2 `useRunOrchestrator` Hook

- **File:** `src/hooks/useRunOrchestrator.ts` (New)
- **Responsibilities:**
  - [ ] Subscribe to current run state.
  - [ ] Compute `currentPhase`: `'human_turn' | 'agent_turn' | 'review' | 'handoff'`.
  - [ ] Expose `delegateToAgent(itemId)` action.
  - [ ] Expose `takeOver(itemId)` action (human override).
  - [ ] Expose `approveAgentWork(itemId)` / `rejectAgentWork(itemId)`.
  - [ ] Track `executionQueue`: ordered list of items to process.

#### 2.3 Approval Gates

- **Schema:** Items with `agent_config.action_type === 'approve'` are gates.
- **Behavior:**
  1. Agent completes preceding steps.
  2. Run pauses at the `approve` item.
  3. Human receives notification.
  4. Human reviews agent outputs from previous steps.
  5. Human clicks "Approve & Continue" or "Reject & Redo".
- **UI:** Full-width banner in RunMode:
  - `⏸ Approval Required — Agent completed Steps 2-5. Review outputs before proceeding.`
  - `[View Agent Outputs] [Approve ✓] [Reject & Redo ↺]`

#### 2.4 Handoff Notifications

- **Types:**
  - `agent_to_human`: "Agent completed Section A. Your turn for review."
  - `human_to_agent`: "You approved Step 3. Agent is now working on Steps 4-6."
  - `agent_failed`: "Agent failed on Step 4: Timeout. Reassigned to you."
  - `approval_requested`: "Agent needs your approval to proceed past checkpoint."
- **Channels:**
  - In-app notification bell (existing `Notification` system).
  - Optional: Slack webhook (`src/services/slack.ts` — already exists).
  - Optional: Email via Supabase Edge Function.

#### 2.5 Live Execution Dashboard

- **File:** `src/components/run/LiveExecutionPanel.tsx` (New)
- **Shows (real-time):**
  - Who is currently working: `🧑 You` or `🤖 Claude 3.5`.
  - Current step being executed.
  - Streaming output preview (if agent supports streaming).
  - Time elapsed on current step.
  - "Take Over" emergency button.
- **Design:**
  - Floating panel anchored to bottom-right of RunMode.
  - Glassmorphism: `bg-background/80 backdrop-blur-md border`.
  - Minimal height (collapsible).

---

### Milestone 3: The SOP Marketplace (Package Manager)

> _"The global Package Manager for Agent Capabilities."_
> **Goal:** A public, searchable registry where anyone can publish, discover, and fork verified SOPs.

#### 3.1 "Publish to Marketplace" Flow

- **File:** `src/components/marketplace/PublishModal.tsx` (New)
- **Trigger:** Repository Settings → "Publish to Marketplace" button.
- **Flow:**
  1. User selects which commit to publish (default: latest).
  2. User fills metadata:
     - **Category** (dropdown): Engineering, DevOps, Healthcare, Legal, Marketing, Operations, Custom.
     - **Tags** (multi-select): existing tag system.
     - **Difficulty**: Beginner / Intermediate / Advanced.
     - **Estimated Duration**: free text.
     - **Agent Compatibility**: Which agents have been tested (Claude, GPT-4, etc.).
  3. User agrees to public license terms.
  4. Click "Publish" → Creates entry in `marketplace_listings` table.

#### 3.2 Database: Marketplace Tables

```sql
CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  commit_id UUID REFERENCES commits(id),
  publisher_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),

  -- Metadata
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT, -- 160 chars for cards
  category TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration TEXT,
  agent_compatibility JSONB, -- ["claude", "gpt-4", "gemini"]

  -- Social Proof
  install_count INTEGER DEFAULT 0,
  fork_count INTEGER DEFAULT 0,
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,

  -- Status
  status TEXT CHECK (status IN ('draft', 'pending_review', 'published', 'featured', 'deprecated')) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  featured_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE marketplace_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  forked_repo_id UUID REFERENCES repositories(id),
  installed_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.3 Marketplace Browse Page

- **Route:** `/marketplace`
- **File:** `src/pages/Marketplace.tsx` (New)
- **Sections:**
  1. **Hero:** "The Process Store — Discover, fork, and run verified SOPs."
  2. **Featured SOPs:** Curated horizontal carousel.
  3. **Categories:** Icon grid (Engineering, DevOps, Healthcare, etc.).
  4. **Trending:** Based on installs in last 7 days.
  5. **Recently Published:** Chronological.
  6. **Search & Filter:** Full-text search + category + difficulty + agent compatibility.
- **Design Tokens:**
  - Cards: Repository-style cards with install count, rating stars, fork count.
  - Category icons: Custom per category using `@hugeicons`.
  - Featured badge: `bg-gradient-to-r from-amber-400 to-orange-500 text-white`.

#### 3.4 Listing Detail Page

- **Route:** `/marketplace/:listingId`
- **File:** `src/pages/MarketplaceListing.tsx` (New)
- **Sections:**
  - **Header:** Title, publisher avatar, rating, install count.
  - **Preview:** Read-only rendered checklist (collapsible tree).
  - **Metadata:** Category, difficulty, estimated time, agent compatibility badges.
  - **Actions:** `[Fork to My Account] [Fork to Organization ▼] [★ Star]`.
  - **Reviews:** Star distribution chart + individual reviews.
  - **Version History:** List of published commits.
  - **Related SOPs:** "Users who forked this also forked..."

#### 3.5 "Install / Fork from Marketplace" Flow

- **Action:** User clicks "Fork" on a listing.
- **Modal:** Choose destination:
  - Personal account.
  - Organization (dropdown).
  - Team within organization (optional).
- **Backend:**
  - Uses existing fork mechanic from `ARCHITECTURE.md` (§3.1).
  - Sets `upstream_repo_id` = marketplace repo.
  - Increments `install_count` on listing.
  - Creates `marketplace_installs` record.

#### 3.6 Publisher Dashboard

- **Route:** `/marketplace/publisher`
- **File:** `src/pages/MarketplacePublisher.tsx` (New)
- **Shows:**
  - User's published SOPs.
  - Install analytics per SOP (line chart over time).
  - Average rating trend.
  - Reviews (with "helpful" management).
  - "Update Listing" (publish new commit version).

---

### Milestone 4: Verified SOPs & Trust System

> _"Determinism over cleverness. A boring, reliable checklist is infinitely better than a creative unpredictable agent."_
> **Goal:** Build trust through verification, reviews, and provenance tracking.

#### 4.1 Verification Tiers

| Tier                       | Badge | Criteria                       | Visual                           |
| :------------------------- | :---- | :----------------------------- | :------------------------------- |
| **Unverified**             | —     | Default                        | No badge                         |
| **Community Tested**       | 🧪    | ≥ 10 successful agent runs     | `bg-blue-500/10 text-blue-600`   |
| **Publisher Verified**     | ✅    | Publisher self-attests quality | `bg-green-500/10 text-green-600` |
| **Checklist HQ Certified** | 🏆    | Manual review by platform team | `bg-amber-500/10 text-amber-600` |

#### 4.2 Run Analytics on Published SOPs

- **Track per listing:**
  - Total runs (human + agent).
  - Completion rate.
  - Average duration.
  - Failure step (which items fail most often).
  - Agent success rate vs human success rate.
- **Display:** On listing detail page as "Community Stats".

#### 4.3 Provenance Chain

- **Per listing, display:**
  - Original author.
  - Fork lineage: `Original → Fork A → Fork B (this listing)`.
  - Commit count.
  - Last updated date.
  - Number of downstream forks.
- **Visual:** `src/components/marketplace/ProvenanceChain.tsx` — Horizontal timeline of the fork tree.

#### 4.4 Review & Rating System

- **Post-Run Review Prompt:**
  - After completing a run of a marketplace SOP, prompt: "Rate this SOP (1-5 stars) + optional review."
  - Only verified runners can review (must have completed ≥ 1 run).
- **Review Display:**
  - Star distribution bar chart.
  - Top reviews (sorted by helpful count).
  - "Was this review helpful?" button.

---

### Milestone 5: Cross-Checklist Data Flow (The "Pipeline")

> _"Agents should execute small, scoped checklists that call other checklists."_
> **Goal:** Outputs from one checklist become inputs to the next — creating pipelines.

#### 5.1 Run Context Store

- **File:** `src/lib/agent/run-context.ts` (New)
- **Purpose:** A key-value store scoped to a run, holding outputs produced by completed items.
- **Interface:**
  ```typescript
  interface RunContext {
    set(key: string, value: unknown): void;
    get(key: string): unknown;
    getAll(): Record<string, unknown>;
    // From a specific item's output
    getItemOutput(itemId: string, key: string): unknown;
  }
  ```
- **Storage:** Persisted in `runs.metadata` (JSONB column) field.
- **Use Case:** Item 1 outputs `{ "server_ip": "10.0.0.1" }`. Item 5 uses `{{ context.server_ip }}` in its text or agent prompt.

#### 5.2 Template Interpolation in Item Text

- **Syntax:** `{{ context.KEY }}` or `{{ items.ITEM_ID.output.KEY }}`.
- **File:** `src/lib/agent/interpolation.ts` (New)
- **Function:** `interpolateItemText(text: string, runContext: RunContext): string`.
- **Rendering:** In RunMode, show interpolated values with subtle highlight:
  - Raw: `SSH into {{ context.server_ip }}`
  - Rendered: `SSH into` **`10.0.0.1`** (pill/badge styling).

#### 5.3 Pipeline Builder UI

- **File:** `src/components/editor/PipelineBuilder.tsx` (New)
- **Purpose:** Visual editor to chain multiple checklists into a sequential pipeline.
- **UI:**
  - Vertical list of linked checklists.
  - Drag to reorder.
  - Arrow connectors between stages.
  - Input/output mapping editor per connection.
- **Output:** Creates a "meta-checklist" where each root item is a `ref` to another checklist.

#### 5.4 Pipeline Execution View

- **File:** `src/pages/PipelineRun.tsx` (New)
- **Shows:**
  - Horizontal stage indicators: `[Stage 1: ✅] → [Stage 2: 🔄] → [Stage 3: ⏳]`
  - Current stage expanded with full run view.
  - Data flow visualization: which outputs fed into current stage's inputs.
  - Overall pipeline progress: `Stage 2 of 4 · 58% complete`.

---

### Milestone 6: Network Effects & Discovery

> _"Distributed Improvement — No single entity knows the perfect process."_
> **Goal:** Make the platform's value compound with each new user and each new SOP.

#### 6.1 "Suggest Improvements" (Pull Request for SOPs)

- **File:** `src/components/marketplace/SuggestImprovementModal.tsx` (New)
- **Flow:**
  1. User runs a marketplace SOP and notices a gap.
  2. User forks the SOP.
  3. User makes improvements and commits.
  4. User clicks "Suggest Improvement" → creates a `suggested_change`.
  5. Original publisher receives notification.
  6. Publisher reviews diff and can "Merge" or "Decline".
- **Table:**
  ```sql
  CREATE TABLE suggested_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upstream_repo_id UUID REFERENCES repositories(id),
    fork_repo_id UUID REFERENCES repositories(id),
    fork_commit_id UUID REFERENCES commits(id),
    author_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('open', 'merged', 'declined', 'closed')) DEFAULT 'open',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```

#### 6.2 SOP Collections (Curated Lists)

- **Concept:** Users/orgs can create themed collections of SOPs:
  - "The DevOps Starter Kit" (5 SOPs)
  - "Healthcare Compliance Essentials" (8 SOPs)
  - "AI Agent Onboarding" (3 SOPs)
- **Table:**

  ```sql
  CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    is_public BOOLEAN DEFAULT true,
    install_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES marketplace_listings(id),
    position INTEGER NOT NULL,
    note TEXT -- Curator's note about this SOP
  );
  ```

#### 6.3 Activity Feed (Social Layer)

- **Route:** `/app/feed`
- **File:** `src/pages/ActivityFeed.tsx` (New)
- **Events:**
  - "Raja published 'AWS Deployment Checklist' to the marketplace."
  - "DevOps Team forked 'Incident Response' from @safety-co."
  - "Claude Agent completed 'Daily Health Check' in 2m 15s."
  - "New improvement suggested for 'Docker Compose Setup'."
- **Scope:**
  - Organization feed (team members' actions).
  - Following feed (SOPs/publishers you follow).
  - Global feed (trending public activity).

#### 6.4 Follow & Star System

- **Follow:** Users, organizations, specific SOPs.
- **Star:** Bookmark SOPs for quick access.
- **Tables:**

  ```sql
  CREATE TABLE follows (
    follower_id UUID REFERENCES auth.users(id),
    following_type TEXT CHECK (following_type IN ('user', 'org', 'repo')),
    following_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (follower_id, following_type, following_id)
  );

  CREATE TABLE stars (
    user_id UUID REFERENCES auth.users(id),
    repo_id UUID REFERENCES repositories(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, repo_id)
  );
  ```

#### 6.5 SEO: Public SOP Pages

- **Route:** `/:username/:repo-slug` (public, no auth required)
- **File:** `src/pages/PublicSopPage.tsx` (New)
- **Purpose:** SEO-optimized landing page for each public SOP.
- **Meta Tags:**
  - `<title>AWS Deployment Checklist | Checklist HQ</title>`
  - `<meta name="description" content="A 12-step version-controlled SOP for deploying to AWS, verified by 50+ teams.">`
  - Open Graph image: auto-generated preview card.
- **Content:**
  - Read-only checklist preview.
  - Publisher info.
  - "Fork this SOP" CTA.
  - Community stats.

---

## 🗓️ Suggested Timeline

| Week           | Milestone                          | Key Deliverable                                        |
| :------------- | :--------------------------------- | :----------------------------------------------------- |
| **Week 1-2**   | M1: Composable Checklists          | `ref` type + sub-run linking + UI                      |
| **Week 3-4**   | M2: Mixed-Initiative Orchestration | State machine + approval gates + notifications         |
| **Week 5-7**   | M3: SOP Marketplace                | Database + browse page + listing detail + install flow |
| **Week 8**     | M4: Trust & Verification           | Tiers + provenance + reviews                           |
| **Week 9-10**  | M5: Cross-Checklist Pipelines      | Context store + interpolation + pipeline builder       |
| **Week 11-12** | M6: Network Effects                | Suggestions + collections + feed + SEO                 |

---

## 🔗 Cross-References

| Document                      | Relevant Section                                                          |
| :---------------------------- | :------------------------------------------------------------------------ |
| **MANIFESTO.md**              | §2.3 Distributed Improvement, §2.4 Composability, Phase 3: Hybrid Network |
| **ARCHITECTURE.md**           | §3.1 Forking Mechanic (reused for marketplace installs)                   |
| **ROADMAP.md**                | Phase 6: Hybrid Teams (§6.2 Agent Store)                                  |
| **ROADMAP_AGENT_PROTOCOL.md** | M5: Hybrid Execution (prerequisite for M2 here)                           |
| **ROADMAP_ORGS_TEAMS.md**     | Phase 4: Repository Sharing (prerequisite for M3 here)                    |

---

## 📐 Design Language for Marketplace

| Element            | Token                                                                                                 | Usage                            |
| :----------------- | :---------------------------------------------------------------------------------------------------- | :------------------------------- |
| **SOP Card**       | `bg-card border hover:shadow-lg transition-all duration-200`                                          | Browse grid                      |
| **Featured Badge** | `bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full` | Featured SOPs                    |
| **Verified Badge** | `bg-green-500/10 text-green-600 border border-green-500/20`                                           | Publisher verified               |
| **Rating Stars**   | `text-amber-400 fill-amber-400` (filled), `text-muted-foreground` (empty)                             | Star ratings                     |
| **Install Button** | `bg-primary text-primary-foreground active:scale-95`                                                  | Primary CTA                      |
| **Category Icon**  | `size-5 stroke-[1.5]` per `DESIGN_PHILOSOPHY.md`                                                      | Category grid                    |
| **Pipeline Arrow** | `text-muted-foreground stroke-2` SVG                                                                  | Stage connectors                 |
| **Ref Item**       | `border-l-2 border-blue-500/50 bg-blue-500/5`                                                         | Distinguished from regular items |

---

## 🏛️ Architectural Decisions

### 1. Composability via `ref` Items (Not a Separate System)

Checklists reference other checklists using the same `ChecklistItem` primitive. This means:

- The editor, renderer, and run mode all work with the same data model.
- No separate "workflow engine" needed.
- Forking a composed checklist naturally forks the structure.

### 2. Fork as the Install Primitive

"Installing" an SOP from the marketplace is just a **fork** (from `ARCHITECTURE.md §3.1`). This means:

- Users get a full copy they own and can customize.
- The `upstream_repo_id` link enables "sync with upstream" later.
- No dependency on the original author's availability.

### 3. Suggested Changes, Not Pull Requests

We use "Suggest Improvement" terminology instead of "Pull Request" because:

- Our audience includes non-developers (healthcare, operations, legal).
- The mental model is "suggest", not "request permission".
- The publisher has full control to merge or decline.

### 4. Context Interpolation via `{{ }}` Syntax

We use Mustache-style interpolation because:

- Familiar to non-programmers.
- Easy to parse without a full template engine.
- Visually distinct from regular text.
- Can be rendered as highlighted pills in the UI.
