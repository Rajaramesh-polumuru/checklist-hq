# Checklist HQ — Product Roadmap & Feature Vision

> "GitHub for Process" — Version-controlled checklists humans & agents.

**Status**: Living Document — Update as vision evolves

---

## The Vision: The OS for Hybrid Intelligence

We are building the **Standard Operating Protocol** for the future hybrid workforce. By 2027, most processes will be executed by a mix of Humans and AI Agents. They need a shared source of truth.

**Core Principles**:
1.  **Version Control**: Immutable history for every process change.
2.  **Machine Readability**: Semantically structured steps, not just text.
3.  **Traceability**: Cryptographic-style logs of who (Human/Agent) did what.

---

## 📅 Roadmap Overview

| Phase | Focus | Audience | Timeline |
| :--- | :--- | :--- | :--- |
| **Phase 4** | **UX Polish** | Humans | Q1 2026 (Now) |
| **Phase 5** | **Agent Protocol** | AI Agents | Q2 2026 |
| **Phase 6** | **Hybrid Teams** | Mixed | Q3 2026 |
| **Phase 7** | **Enterprise Scale** | Orgs | Q4 2026 |

---

## Phase 4: Polish & Launch-Ready (Human Foundation)
*Goal: Ensure the tool is delightful for human operators.*

### 4.1 Core UX
- [ ] **Undo/Redo**: Cmd+Z support in the editor.
- [ ] **Save Feedback**: Visual toasts (Sonner) for save states.
- [ ] **Onboarding**: "Fork this checklist" interactive tour.

### 4.2 Richer Context
- [ ] **Item Details**: Markdown notes for human context.
- [ ] **Due Dates**: Temporal constraints.

---

## Phase 5: The Agent Protocol (AI Foundation)
*Goal: Make checklists executable by Autonomous Agents.*

### 5.1 Structured Semantics
*Transform items from "strings" to "typed actions".*
- [ ] **Action Types**: Define `step_type` enum (`manual`, `browse`, `api_call`, `input_request`).
- [ ] **Input Schemas**: Define required parameters for a step (e.g., `server_ip`, `customer_id`) using JSON Schema.
- [ ] **Output Schemas**: Define what data an agent must return to complete a step.

### 5.2 Agent API
*The interface for our silicon colleagues.*
- [ ] **`GET /repo/:id/tree`**: Fetch the full dependency graph of a checklist.
- [ ] **`POST /run/:id/step/:step_id`**: An agent submits its work artifacts (logs, screenshots).
- [ ] **Context Window Optimization**: An endpoint that returns a token-optimized representation of the checklist for LLM injection.

### 5.3 Verification Oracle
- [ ] **"Proof of Work"**: Agent must upload a specific artifact (screenshot/log hash) to mark a step complete.

---

## Phase 6: Hybrid Teams
*Goal: Orchestrate handoffs between Carbon and Silicon.*

### 6.1 Mixed-Initiative Runs
- [ ] **Delegation**: User clicks "Delegate to Agent" on a specific section.
- [ ] **Human-in-the-Loop**: Agent pauses at critical junctures for human approval.

### 6.2 The "Agent Store" (Package Manager)
- [ ] **Public Registry**: Verified SOPs for common agent tasks ("Stripe Refund", "Typescript Refactor").
- [ ] **Forking for Logic**: Fork a generic "Research" checklist and specialize it for "Medical Research".

---

## Phase 7: Enterprise & Scale
*Goal: Compliance and massive scale.*

- [ ] **Audit Logs**: Immutable logs of every agent action (essential for liability).
- [ ] **Policy as Code**: Prevent runs if preconditions aren't met.
- [ ] **Self-Hosted Agents**: Run the agent runtime inside the customer's VPC.

---

## Appendix: Features & Priorities

### Impact vs Effort

| Feature | Impact | Effort | Priority |
| :--- | :--- | :--- | :--- |
| **Agent API** | High | High | 💎 Big Bet |
| **Undo/Redo** | High | Med | 🎯 Quick Win |
| **Enterprise SSO** | High | Low | 🔴 Urgent |
| **VR Mode** | Low | High | 🗑️ Avoid | 

### Success Metrics
1.  **Weekly Active Runs (WAR)**: Total runs completed.
2.  **Agent-Initiated Runs**: % of runs started via API.
3.  **Handoff Success Rate**: % of mixed runs completed without manual override.
