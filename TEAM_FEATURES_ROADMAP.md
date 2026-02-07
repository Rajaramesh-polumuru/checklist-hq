# Team Features Roadmap

> **Objective:** Complete all remaining team features and polish the collaboration experience in Checklist HQ.

**Created:** 2026-02-07
**Status:** Phases 1-5 Complete

---

## Executive Summary

Based on the codebase analysis, most core team features are implemented. This roadmap focuses on:
1. **Critical Infrastructure Gaps** - Missing routes and integrations
2. **Feature Completions** - Stubbed handlers and empty tabs
3. **UI/UX Enhancements** - Better user experience
4. **Advanced Collaboration** - New team features

---

## Phase Overview

| Phase | Focus | Priority | Status |
|:------|:------|:---------|:-------|
| **Phase 1** | Infrastructure & Critical Fixes | P0 | ✅ Complete |
| **Phase 2** | Team Repository Access | P0 | ✅ Complete |
| **Phase 3** | Member Experience Improvements | P1 | ✅ Complete |
| **Phase 4** | Team Activity & Notifications | P1 | ✅ Complete |
| **Phase 5** | Agent Integration (Routing) | P1 | ✅ Complete |
| **Phase 6** | Advanced Team Features | P2 | Pending |

---

## Phase 1: Infrastructure & Critical Fixes ✅

> **Goal:** Fix critical gaps that block functionality

### 1.1 Add AgentsDashboard Route ✅
**Status:** Complete
**File:** `src/App.tsx`

Added route for AgentsDashboard at `/app/orgs/:orgId/agents`.

### 1.2 Add Agents Tab to OrganizationDashboard ✅
**Status:** Complete
**File:** `src/pages/OrganizationDashboard.tsx`

Added "Agents" tab with icon and link to the agents dashboard.

### 1.3 Fix Member Display Names ✅
**Status:** Complete
**File:** `src/pages/OrganizationDashboard.tsx`

- Updated `getOrganizationMembers()` to join with `auth.users`
- Created `OrganizationMemberWithUser` type
- Members now display: name, email, avatar, and join date

---

## Phase 2: Team Repository Access ✅

> **Goal:** Complete the Team → Repositories relationship

### 2.1 Implement Team Repositories Tab ✅
**Status:** Complete
**File:** `src/pages/TeamDashboard.tsx`

- Shows list of shared repositories with permission badges
- Cards display: title, description, permission level, share date
- Quick actions: Run, Open Repository, Remove from Team

### 2.2 Repository Team Access Service ✅
**Status:** Complete
**File:** `src/services/team.ts`

Implemented:
- `getTeamRepositories(teamId)` - Get repos with permissions
- `addRepositoryToTeam(teamId, repoId, permission)` - Share repo with team
- `removeRepositoryFromTeam(teamId, repoId)` - Revoke access
- `updateTeamRepositoryPermission(teamId, repoId, permission)` - Update permission
- `getRepositoryTeamAccess(repositoryId)` - Get all team access for a repo

### 2.3 Share Repository to Team Modal ✅
**Status:** Complete
**File:** `src/components/team/ShareRepositoryToTeamModal.tsx`

Features:
- Search organization repositories
- Multi-select checkboxes
- Permission level selector (read/write/admin)
- Excludes already-shared repositories

---

## Phase 3: Member Experience Improvements ✅

> **Goal:** Better member management and profile display

### 3.1 Fetch User Profiles for Members ✅
**Status:** Complete

- Updated `getOrganizationMembers()` to join with `auth.users`
- Created `OrganizationMemberWithUser` type
- Displays: name (from user_metadata), email, avatar, join date

### 3.2 Member Profile Modal
**Status:** Pending (Future Enhancement)
**File:** `src/components/MemberProfileModal.tsx`

### 3.3 Bulk Member Actions
**Status:** Pending (Future Enhancement)
**File:** `src/components/organization/BulkMemberActions.tsx`

### 3.4 Member Invitation Improvements
**Status:** Pending (Future Enhancement)

---

## Phase 4: Team Activity & Notifications ✅

> **Goal:** Track and display team activity

### 4.1 Team Activity Feed Component ✅
**Status:** Complete
**File:** `src/components/team/TeamActivityFeed.tsx`

Features:
- Displays team-related audit events
- Icons for different action types
- Relative timestamps ("2m ago", "1d ago")
- Refresh button

### 4.2 Activity Service ✅
**Status:** Complete
**File:** `src/services/audit.ts`

Added `getTeamActivityLogs(teamId)` function that filters audit logs for team actions.

### 4.3 Activity Tab in TeamDashboard ✅
**Status:** Complete

Added fourth tab with Activity icon showing the TeamActivityFeed component.

---

## Phase 5: Agent Integration (Routing) ✅

> **Goal:** Complete agent management accessibility

### 5.1 Wire AgentsDashboard Route ✅
**Status:** Complete

Route added at `/app/orgs/:orgId/agents` in App.tsx.

### 5.2 Add Agent Navigation ✅
**Status:** Complete

Added "Agents" tab in Organization Dashboard with link to agents page.

### 5.3 Agent-Team Assignment UI
**Status:** Pending (Future Enhancement)
**File:** `src/components/agent/AgentTeamAssignment.tsx`

---

## Phase 6: Advanced Team Features

> **Goal:** Enterprise-level team capabilities

### 6.1 Team Templates
- Create team from template
- Save team as template
- Default repositories and settings

### 6.2 Team Permissions Matrix
**File:** `src/components/team/TeamPermissionsMatrix.tsx`

Visual matrix showing:
- Teams as rows
- Repositories as columns
- Permission levels in cells

### 6.3 Team Insights Dashboard
**File:** `src/components/team/TeamInsights.tsx`

Per-team analytics:
- Run completion rates
- Most active members
- Repository usage stats
- Trend over time

### 6.4 Cross-Team Collaboration
- Share runs between teams
- Cross-team comments on runs
- Team mention (@team-name) in notes

---

## Implementation Order

### Week 1: Critical Path (P0) ✅ COMPLETE
1. [x] Create roadmap
2. [x] Add AgentsDashboard route
3. [x] Add Agents tab to OrganizationDashboard
4. [x] Implement Team Repositories service
5. [x] Complete Team Repositories tab
6. [x] Create ShareRepositoryToTeamModal
7. [x] Fix member profile display
8. [x] Add Team Activity tab

### Week 2-3: Future Enhancements (P2)
- [ ] Bulk member actions
- [ ] Team permissions matrix
- [ ] Team insights dashboard
- [ ] MemberProfileModal
- [ ] Enhanced invite links

---

## Success Criteria

### Phase 1 Complete ✅
- [x] AgentsDashboard accessible via `/app/orgs/:orgId/agents`
- [x] Agents tab visible in organization dashboard
- [x] Member names display correctly

### Phase 2 Complete ✅
- [x] Team repositories tab shows actual repos
- [x] Can share repository to team
- [x] Can set permission levels

### Phase 3 Complete ✅
- [x] Member profiles show name/email/avatar
- [x] Can view member details (inline, modal pending)

### Phase 4 Complete ✅
- [x] Activity feed shows team events
- [x] Activity tab exists in TeamDashboard
- [x] Events are logged to audit system

---

## Files Created/Modified

### New Files Created ✅
```
src/components/team/ShareRepositoryToTeamModal.tsx - Share repos with teams
src/components/team/TeamActivityFeed.tsx - Activity feed component
```

### Files Modified ✅
```
src/App.tsx - Added AgentsDashboard route
src/pages/OrganizationDashboard.tsx - Added Agents tab, fixed member display
src/pages/TeamDashboard.tsx - Completed repositories tab, added activity tab
src/services/team.ts - Added repository access functions (CRUD)
src/services/organization.ts - Added OrganizationMemberWithUser type, joined auth.users
src/services/audit.ts - Added getTeamActivityLogs function
```

### Future Files (Not Yet Created)
```
src/components/team/TeamInsights.tsx
src/components/team/TeamPermissionsMatrix.tsx
src/components/MemberProfileModal.tsx
src/components/organization/BulkMemberActions.tsx
src/components/agent/AgentTeamAssignment.tsx
```

---

## Technical Considerations

### Database Schema
The following tables/columns exist:
- `teams` - Team metadata
- `team_members` - User-team relationships
- `repository_team_access` - Team-repo permissions
- `audit_logs` - Activity tracking

### API Patterns
- Use React Query for all data fetching
- Optimistic updates for mutations
- Audit logging on all changes
- Permission checks before mutations

### UI Patterns
- Skeleton loaders for all async content
- Empty states with actions
- Permission-gated actions
- Consistent animation (framer-motion)

---

## Implementation Summary (2026-02-07)

### Completed Features

1. **Agent Dashboard Route** - AgentsDashboard is now accessible at `/app/orgs/:orgId/agents`

2. **Agents Tab in Organization** - New tab with icon linking to the agents management page

3. **Member Display Fix** - Organization members now display:
   - Full name (from user_metadata)
   - Email address
   - Avatar image
   - Join date

4. **Team Repository Access** - Complete CRUD for team-repository relationships:
   - View shared repositories with permission badges
   - Share repositories via multi-select modal
   - Remove repository access
   - Permission levels: read/write/admin

5. **Team Activity Feed** - New activity tab showing:
   - Member additions/removals
   - Repository sharing events
   - Role changes
   - Settings updates

### Build Status

✅ Production build successful - no errors

---

*Last Updated: 2026-02-07*
