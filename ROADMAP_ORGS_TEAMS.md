# Organization & Team Features Roadmap

> **Vision:** Transform Checklist HQ into the definitive collaboration platform for **Hybrid Intelligence** - where human operators and AI agents seamlessly share SOPs, execute processes, and learn from each other's runs.

---

## Executive Summary

This roadmap outlines the path from current MVP-level org/team features to a polished, enterprise-ready collaboration system. The implementation follows our **"Git for Process"** architecture and adheres strictly to the **Design Philosophy** tokens and patterns.

### Current State Assessment

| Category | Status | Gap |
|----------|--------|-----|
| Organization CRUD | Complete | Minor UI polish |
| Team Management | Basic | Missing member lifecycle |
| Permission System | Scaffolded | No frontend enforcement |
| Reporting & Sharing | Minimal | No cross-team analytics |
| AI Agent Support | Conceptual | No agent identity or delegation |

---

## Phase 1: Foundation Polish (Week 1-2)

> **Goal:** Achieve visual consistency and fix all UI/UX violations per `DESIGN_PHILOSOPHY.md`

### 1.1 Design Token Compliance

**Current Violation:** Hardcoded colors in role badges and status indicators.

```tsx
// BAD (current)
className="bg-amber-500/10 text-amber-600"

// GOOD (semantic)
className="bg-warning/10 text-warning-foreground"
```

**Tasks:**
- [ ] Add semantic color tokens to Tailwind config:
  - `--color-role-owner` (amber)
  - `--color-role-admin` (blue)
  - `--color-role-member` (green)
  - `--color-role-viewer` (gray)
- [ ] Create `<RoleBadge role={role} />` component with CVA variants
- [ ] Create `<TeamVisibilityBadge visibility={visibility} />` component
- [ ] Audit all org/team components for magic color values

### 1.2 Accessibility Audit

**Design Philosophy Rule:** "All interactive elements MUST have `focus-visible:ring-2`"

**Tasks:**
- [ ] Add keyboard navigation to member list actions
- [ ] Add `aria-labels` to team action buttons
- [ ] Ensure modal focus trapping works correctly
- [ ] Add screen reader announcements for async operations

### 1.3 Feedback Immediacy (100ms Rule)

**Tasks:**
- [ ] Add `active:scale-95` to all organization action buttons
- [ ] Add skeleton loaders to:
  - Organization dashboard tabs
  - Team member lists
  - Repository grid
- [ ] Implement optimistic updates for:
  - Team creation
  - Member invitation
  - Role changes

### 1.4 Empty States & Onboarding

**Tasks:**
- [ ] Design consistent empty state illustrations for:
  - No teams in organization
  - No members (first user)
  - No repositories
  - No analytics data
- [ ] Add contextual help tooltips for first-time users
- [ ] Create "Quick Start" checklist for new organizations

---

## Phase 2: Team Member Lifecycle (Week 3-4)

> **Goal:** Complete team member management with full CRUD operations

### 2.1 Database & Services

**New RPC Functions:**
```sql
-- Add member to team
create_team_member(p_team_id, p_user_id, p_role)

-- Remove member from team
remove_team_member(p_team_id, p_user_id)

-- Update team member role
update_team_member_role(p_team_id, p_user_id, p_role)

-- List team members with user details
get_team_members(p_team_id)
```

**Service Layer (`src/services/team.ts`):**
```typescript
export async function getTeamMembers(teamId: string): Promise<TeamMemberWithUser[]>
export async function addTeamMember(teamId: string, userId: string, role: TeamRole): Promise<void>
export async function removeTeamMember(teamId: string, userId: string): Promise<void>
export async function updateTeamMemberRole(teamId: string, userId: string, role: TeamRole): Promise<void>
export async function inviteToTeam(teamId: string, email: string, role: TeamRole): Promise<void>
```

### 2.2 Team Detail Page

**New Route:** `/app/orgs/:orgId/teams/:teamId`

**Components:**
- `TeamDashboard.tsx` - Main team view with tabs
- `TeamMemberList.tsx` - Members with role management
- `TeamRepositories.tsx` - Repos accessible by team
- `TeamSettings.tsx` - Team-level configuration

**UI Structure:**
```
┌─────────────────────────────────────────────┐
│ [Icon] Team Name           [Settings Gear]  │
│ @team-slug · 12 members · 5 repositories    │
├─────────────────────────────────────────────┤
│ [Members] [Repositories] [Activity]         │
├─────────────────────────────────────────────┤
│                                             │
│  [+ Add Member]                             │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 👤 Jane Doe        Maintainer  [···]│   │
│  │    jane@acme.com   Added 2 days ago │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### 2.3 Add Team Member Modal

**Features:**
- Search existing org members (autocomplete)
- Invite new user by email (if not in org, add to org first)
- Role selection with clear hierarchy explanation:
  - **Maintainer:** Can manage team settings and members
  - **Member:** Can access team repositories

### 2.4 Member Management Actions

**Inline Actions (3-dot menu):**
- Change role (Maintainer ↔ Member)
- Remove from team
- View profile

**Confirmation Dialogs:**
- Removing last maintainer warning
- Self-removal warning

---

## Phase 3: Permission System (Week 5-6)

> **Goal:** Implement role-based access control throughout the UI

### 3.1 Permission Context

**New Store (`src/stores/permission-store.ts`):**
```typescript
interface PermissionState {
  orgPermissions: Map<string, OrgRole>
  teamPermissions: Map<string, TeamRole>

  // Derived helpers
  canManageOrg: (orgId: string) => boolean
  canInviteMembers: (orgId: string) => boolean
  canManageTeam: (teamId: string) => boolean
  canAccessSettings: (orgId: string) => boolean
}
```

### 3.2 Permission Hook

**New Hook (`src/hooks/usePermissions.ts`):**
```typescript
export function useOrgPermission(orgId: string) {
  const role = usePermissionStore(s => s.orgPermissions.get(orgId))

  return {
    role,
    isOwner: role === 'owner',
    isAdmin: role === 'owner' || role === 'admin',
    canManage: role === 'owner' || role === 'admin',
    canInvite: role !== 'viewer',
    canView: true,
  }
}
```

### 3.3 Conditional UI Rendering

**Pattern:**
```tsx
function OrganizationDashboard() {
  const { canManage, canInvite } = useOrgPermission(orgId)

  return (
    <Tabs>
      <TabsList>
        <TabsTrigger value="repositories">Repositories</TabsTrigger>
        <TabsTrigger value="teams">Teams</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        {canManage && <TabsTrigger value="settings">Settings</TabsTrigger>}
      </TabsList>

      {/* ... */}

      {canInvite && (
        <Button onClick={() => setInviteOpen(true)}>
          <Icon icon={PlusSignIcon} /> Invite
        </Button>
      )}
    </Tabs>
  )
}
```

### 3.4 Secret Team Enforcement

**Tasks:**
- [ ] Filter secret teams from non-member views
- [ ] Add "You don't have access" page for unauthorized team access
- [ ] Hide secret team repos from org-level repository list for non-members

---

## Phase 4: Repository Sharing & Collaboration (Week 7-8)

> **Goal:** Enable seamless SOP sharing across teams and organizations

### 4.1 Share Modal Enhancement

**Current State:** `ShareSettingsModal.tsx` exists but handlers are stubbed.

**New Features:**
- **Team Access:** Add/remove teams with permission levels
- **Direct User Access:** Share with specific users (read/write/admin)
- **Public Link:** Generate shareable link for public repos
- **Fork Permissions:** Control who can fork

**UI Structure:**
```
┌─────────────────────────────────────────────┐
│ Share "Pre-Flight Checklist"         [X]   │
├─────────────────────────────────────────────┤
│ [Teams] [People] [Link]                     │
├─────────────────────────────────────────────┤
│                                             │
│ Teams with Access                           │
│ ┌─────────────────────────────────────────┐│
│ │ Flight Ops Team      [Write ▼] [Remove] ││
│ │ Safety Committee     [Read ▼]  [Remove] ││
│ └─────────────────────────────────────────┘│
│                                             │
│ [+ Add Team]                                │
│                                             │
│ ─────────────────────────────────────────── │
│ □ Allow forking by team members             │
│ □ Notify on new commits                     │
│                                             │
└─────────────────────────────────────────────┘
```

### 4.2 Fork & Contribute Flow

**Architecture Alignment:** Per `ARCHITECTURE.md`, forks create new repositories with `upstream_repo_id` reference.

**New Features:**
- **Fork to Organization:** Choose destination org when forking
- **Suggest Changes:** Create "pull request" equivalent for SOPs
- **Merge Upstream:** Sync fork with upstream changes
- **Diff View:** Visual comparison between versions

### 4.3 Repository Transfer

**Tasks:**
- [ ] Implement `transferRepoToOrg()` UI flow
- [ ] Add confirmation with impact summary
- [ ] Preserve access history after transfer

---

## Phase 5: Reporting & Analytics Sharing (Week 9-10)

> **Goal:** Enable teams to share run reports and analytics across the organization

### 5.1 Run Report Sharing

**New Features:**
- **Share Run Report:** Generate shareable link to completed run
- **Team Report Feed:** Activity feed of team's completed runs
- **Export Options:** PDF, CSV, JSON export of run data

**Components:**
- `ShareRunModal.tsx` - Configure sharing options
- `RunReportView.tsx` - Public/shared view of run
- `TeamActivityFeed.tsx` - Team's recent runs

### 5.2 Analytics Dashboard Enhancements

**Organization-Level Analytics:**
```
┌─────────────────────────────────────────────────────┐
│ Organization Analytics                              │
├─────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ 1,247   │ │ 98.2%   │ │ 12m     │ │ 45      │    │
│ │ Runs    │ │ Success │ │ Avg Time│ │ Active  │    │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
├─────────────────────────────────────────────────────┤
│ Filter: [All Teams ▼] [All Repos ▼] [Last 30d ▼]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Completion Rate by Team                             │
│ ████████████████████░░░░░ Flight Ops (95%)         │
│ ██████████████████░░░░░░░ Safety (85%)             │
│ ██████████████░░░░░░░░░░░ Training (70%)           │
│                                                     │
│ Top Performing SOPs                                 │
│ 1. Pre-Flight Checklist    ▲ 12% improvement       │
│ 2. Safety Inspection       ▲ 8% improvement        │
│ 3. Equipment Checkout      ─ No change             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5.3 Scheduled Reports

**New Features:**
- **Report Subscriptions:** Weekly/monthly email digest
- **Slack Integration:** Post analytics to channel
- **Webhook Triggers:** On completion thresholds

**Database Schema:**
```sql
CREATE TABLE report_subscriptions (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  team_id UUID REFERENCES teams(id), -- Optional, for team-scoped reports
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  recipients JSONB, -- Array of email addresses
  filters JSONB, -- Repository/time filters
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.4 Comparative Analytics

**Features:**
- Compare performance across teams
- Compare SOP versions (before/after improvement)
- Benchmark against organization average

---

## Phase 6: AI Agent Integration (Week 11-12)

> **Goal:** Enable AI agents to participate as first-class team members

### 6.1 Agent Identity

**Database Schema:**
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  agent_type TEXT CHECK (agent_type IN ('claude', 'custom', 'webhook')),
  capabilities JSONB, -- What actions this agent can perform
  api_key_hash TEXT, -- For authentication
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ
);

CREATE TABLE agent_team_memberships (
  agent_id UUID REFERENCES agents(id),
  team_id UUID REFERENCES teams(id),
  permissions JSONB, -- Specific allowed actions
  PRIMARY KEY (agent_id, team_id)
);
```

### 6.2 Agent Dashboard

**Route:** `/app/orgs/:orgId/agents`

**Features:**
- List organization agents with status
- Create new agent with capabilities
- Assign agents to teams
- View agent activity log
- Revoke/regenerate API keys

**UI:**
```
┌─────────────────────────────────────────────────────┐
│ AI Agents                           [+ New Agent]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ 🤖 Quality Inspector                            ││
│ │    Claude Agent · 3 teams · Last active 2h ago  ││
│ │    Capabilities: [browse] [api] [approve]       ││
│ │                                    [Configure]  ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ 🤖 Compliance Checker                           ││
│ │    Webhook Agent · 1 team · Last active 1d ago  ││
│ │    Capabilities: [validate] [flag]              ││
│ │                                    [Configure]  ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 6.3 Agent-Executable Items

**Checklist Item Enhancement (per ARCHITECTURE.md):**
```typescript
type ChecklistItem = {
  id: string
  text: string
  parent: string | null
  order: number

  // Agent configuration
  agent_config?: {
    action_type: 'manual' | 'browse' | 'api' | 'approve'
    assignee?: string // Agent ID or 'human' or 'any'
    parameters?: Record<string, unknown>
    expected_output?: Record<string, unknown>
    timeout_ms?: number
    fallback_assignee?: string // If agent fails
  }
}
```

### 6.4 Hybrid Run Mode

**Features:**
- **Mixed Execution:** Some items by humans, some by agents
- **Agent Handoff:** Agent completes task, notifies human for review
- **Human Override:** Human can take over any agent task
- **Execution Log:** Clear audit trail of who/what completed each item

**Run Progress Enhancement:**
```typescript
type ItemProgress = {
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed'
  completed_by?: string // User ID or Agent ID
  completed_by_type?: 'human' | 'agent'
  completed_at?: string
  notes?: string
  agent_output?: Record<string, unknown> // Structured output from agent
}
```

### 6.5 Agent Permissions & Guardrails

**Safety Features:**
- **Capability Scoping:** Agents can only perform allowed action types
- **Team Isolation:** Agents can only access assigned team's repos
- **Approval Workflows:** Certain actions require human approval
- **Rate Limiting:** Prevent runaway agent execution
- **Audit Trail:** Every agent action is logged

---

## Phase 7: Enterprise Features (Week 13-16)

> **Goal:** Add enterprise-grade security and compliance features

### 7.1 Single Sign-On (SSO)

**Tasks:**
- [ ] SAML 2.0 integration
- [ ] OIDC support
- [ ] Just-in-time provisioning
- [ ] Role mapping from IdP groups

### 7.2 Audit Logging

**Events to Log:**
- Organization settings changes
- Team membership changes
- Repository access changes
- Run completions
- Agent actions
- Permission changes

**Viewer Features:**
- Filter by event type, user, date range
- Export audit logs (CSV, JSON)
- Retention policy configuration

### 7.3 IP Allowlisting

**Features:**
- Define allowed IP ranges
- Enforce for all org members
- Bypass rules for specific users

### 7.4 Data Retention

**Features:**
- Configure retention periods per data type
- Automatic purge of old data
- Export before deletion option

---

## Implementation Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Design token compliance | High | Low | P0 |
| Team member lifecycle | High | Medium | P0 |
| Permission enforcement | High | Medium | P0 |
| Share modal completion | High | Low | P1 |
| Analytics sharing | Medium | Medium | P1 |
| Agent identity | High | High | P1 |
| SSO integration | Medium | High | P2 |
| Audit logging viewer | Medium | Medium | P2 |
| Scheduled reports | Low | Medium | P3 |
| IP allowlisting | Low | Low | P3 |

---

## Success Metrics

### Adoption Metrics
- Organizations created per week
- Teams per organization (avg)
- Members per team (avg)
- Repositories shared across teams

### Engagement Metrics
- Runs per team per week
- Cross-team collaboration (shared repos)
- Agent-assisted runs percentage
- Report shares per organization

### Quality Metrics
- Run completion rate by team
- Time to complete (improvement over time)
- Error/failure rate by SOP

---

## Technical Debt to Address

1. **Stubbed Handlers:** Complete all `console.log` placeholders
2. **Type Safety:** Remove `any` types from organization service
3. **Error Boundaries:** Add error handling to all org/team pages
4. **Loading States:** Consistent skeleton implementations
5. **Caching Strategy:** React Query cache invalidation patterns

---

## Design System Components to Create

| Component | Variants | Location |
|-----------|----------|----------|
| `RoleBadge` | owner, admin, member, viewer | `src/components/ui/role-badge.tsx` |
| `VisibilityBadge` | public, private, secret | `src/components/ui/visibility-badge.tsx` |
| `MemberAvatar` | user, agent, placeholder | `src/components/ui/member-avatar.tsx` |
| `PermissionSelect` | read, write, admin | `src/components/ui/permission-select.tsx` |
| `TeamCard` | default, compact, skeleton | `src/components/TeamCard.tsx` |
| `AgentCard` | default, compact, skeleton | `src/components/AgentCard.tsx` |

---

## Appendix: Component File Structure

```
src/
├── components/
│   ├── organization/
│   │   ├── OrgHeader.tsx
│   │   ├── OrgTabs.tsx
│   │   ├── MemberList.tsx
│   │   ├── MemberCard.tsx
│   │   └── InviteMemberModal.tsx
│   ├── team/
│   │   ├── TeamCard.tsx
│   │   ├── TeamHeader.tsx
│   │   ├── TeamMemberList.tsx
│   │   ├── AddTeamMemberModal.tsx
│   │   └── TeamSettings.tsx
│   ├── agent/
│   │   ├── AgentCard.tsx
│   │   ├── AgentConfig.tsx
│   │   ├── AgentActivityLog.tsx
│   │   └── CreateAgentModal.tsx
│   ├── sharing/
│   │   ├── ShareModal.tsx
│   │   ├── TeamAccessList.tsx
│   │   ├── UserAccessList.tsx
│   │   └── ShareLinkGenerator.tsx
│   └── analytics/
│       ├── OrgAnalytics.tsx
│       ├── TeamComparison.tsx
│       ├── ReportScheduler.tsx
│       └── ExportOptions.tsx
├── pages/
│   ├── Organizations.tsx
│   ├── OrganizationDashboard.tsx
│   ├── TeamDashboard.tsx
│   ├── AgentsDashboard.tsx
│   └── NewOrganization.tsx
├── services/
│   ├── organization.ts
│   ├── team.ts
│   ├── agent.ts
│   └── analytics.ts
├── stores/
│   └── permission-store.ts
└── hooks/
    ├── usePermissions.ts
    └── useOrganization.ts
```

---

*Last Updated: 2026-02-06*
*Next Review: Phase 1 completion*
