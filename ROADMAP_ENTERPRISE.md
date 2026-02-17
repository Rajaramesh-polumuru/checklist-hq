# Epic: Enterprise Scale & Security

> **Manifesto Alignment:** Phase 7 — "Enterprise Scale"
> **Principles:** Compliance · Liability · Sovereignty
> **When:** Q4 2026

---

## 🧭 Strategic Context

We have built the core product (Checklists), the collaboration layer (Orgs/Teams), and the intelligence layer (Agents/Marketplace). Now we must build the **trust layer** required for large-scale adoption.

---

## 📦 Epic Breakdown: 4 Milestones

---

### Milestone 1: Audit Logging (The "Black Box")

> _"If it wasn't logged, it didn't happen."_
> **Goal:** Immutable record of every significant action for compliance and debugging.

#### 1.1 Audit Log Database Schema
- **Table:** `audit_logs`
  ```sql
  CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    actor_id UUID REFERENCES auth.users(id), -- User or Agent
    event_type TEXT NOT NULL, -- e.g., 'repo.created', 'run.completed', 'settings.changed'
    resource_type TEXT NOT NULL, -- 'repository', 'run', 'team'
    resource_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}', -- Diff or details
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- **RLS:** Only Organization Admins/Owners can view. Immutable (no updates/deletes allowed).

#### 1.2 Audit Logging Service
- **File:** `src/services/audit.ts`
- **Functions:** `logEvent()`, `getOrganizationLogs()`.
- **Integration:** Hook into existing services (`repository.ts`, `run.ts`, `team.ts`) to auto-log critical events.

#### 1.3 Audit Log Viewer UI
- **Route:** `/app/orgs/:orgId/settings/audit`
- **Components:** `AuditLogTable.tsx`, `AuditLogFilters.tsx`.
- **Features:** Filter by date, actor, event type. Export to CSV.

---

### Milestone 2: IP Allowlisting (Network Security)

> _"Zero Trust starts with knowing where requests come from."_
> **Goal:** Restrict access to an organization's resources to specific IP ranges (e.g., corporate VPN).

#### 2.1 IP Allowlist Schema
- **Table:** `ip_allowlist`
  ```sql
  CREATE TABLE ip_allowlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    cidr_block CIDR NOT NULL, -- e.g., '192.168.1.0/24'
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```

#### 2.2 Middleware Enforcement
- **Mechanism:** Supabase RLS policies using `request.headers` (if possible) or Edge Functions.
- **Client-Side:** Check IP before rendering sensitive routes (UX only security).
- **Service Layer:** Validate IP in critical mutation actions.

#### 2.3 Management UI
- **Route:** `/app/orgs/:orgId/settings/security`
- **Features:** Add/Remove IP ranges. Toggle "Enforce Allowlist".

---

### Milestone 3: Data Retention Policies

> _"Data is a liability. Keep it only as long as needed."_
> **Goal:** Automated cleanup of old runs and artifacts to meet GDPR/compliance.

#### 3.1 Retention Settings
- **Schema:** Add `retention_policy` to `organizations` table.
  ```json
  {
    "runs_retention_days": 365,
    "audit_logs_retention_days": 180,
    "artifacts_retention_days": 90
  }
  ```

#### 3.2 Cleanup Job (Mock)
- **Concept:** Since we don't have a backend cron, we'll implement a `cleanup-service.ts` that *checks* for expired data and flags it (or deletes it if we simulate the cron).
- **UI:** Show "Expired Data" count in settings. Button to "Purge Now".

---

### Milestone 4: Single Sign-On (SSO)

> _"One identity to rule them all."_
> **Goal:** Allow organizations to enforce login via their IdP (Okta, Google Workspace).

*Note: True SSO requires Supabase Enterprise. We will mock the configuration UI and logic.*

#### 4.1 SSO Configuration UI
- **Route:** `/app/orgs/:orgId/settings/sso`
- **Fields:** Identity Provider URL, Metadata XML, Domain restrictions.
- **Logic:** Store config in `organization_settings`.

---

## 🗓️ Suggested Timeline

| Milestone | Deliverable |
| :--- | :--- |
| **M1: Audit Logs** | Database, Service, UI Viewer |
| **M2: IP Security** | Schema, Policies, Settings UI |
| **M3: Retention** | Settings, Purge Logic |
| **M4: SSO** | Config UI (Mock) |

