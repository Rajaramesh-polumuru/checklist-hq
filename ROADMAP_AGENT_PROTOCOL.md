# Epic: The Agent Protocol — Making Checklists Executable Code

> **Manifesto Alignment:** Phase 2 — "Make checklists Agent-Readable"
> **Principle:** "A step isn't just text ('Check the logs'); it is data (`{ action: 'check_logs', source: '/var/log' }`)."
> **When:** Q2 2026

---

## 🎯 Success Metrics (Definition of Done)

| Metric                    | Target                | Why                                          |
| :------------------------ | :-------------------- | :------------------------------------------- |
| Agent-Initiated Runs      | ≥ 20% of all new runs | Proves agents _can_ use the platform         |
| Handoff Success Rate      | ≥ 85%                 | Mixed runs complete without human override   |
| Avg. Context Tokens Saved | ≥ 40% vs raw text     | Structured format is more efficient for LLMs |
| MCP Client Connections    | ≥ 3 verified clients  | Claude Desktop, Cursor, Windsurf confirmed   |

---

## 📦 What Already Exists (Foundation)

| Component                        | Status                  | Location                                   |
| :------------------------------- | :---------------------- | :----------------------------------------- |
| `ChecklistItem.agent_config`     | ✅ Schema defined       | `src/types/database.ts` L79-87             |
| `ItemProgress.completed_by_type` | ✅ `'human' \| 'agent'` | `src/types/database.ts` L103-105           |
| Agent CRUD Service               | ✅ Full CRUD            | `src/services/agent.ts`                    |
| Agents Dashboard                 | ✅ UI exists            | `src/pages/AgentsDashboard.tsx`            |
| Copy for Agent (Phase 1)         | ✅ Shipped              | `src/components/run/AgentExportButton.tsx` |
| Prompt Transformer               | ✅ Shipped              | `src/lib/agent/prompt-transformer.ts`      |

---

## Epic Breakdown: 5 Milestones, 27 Tasks

---

### Milestone 1: Structured Semantics (The Schema Layer)

> _"Transform items from strings to typed actions."_
> **Goal:** Every checklist item can optionally carry machine-readable execution metadata.

#### 1.1 Extend `ChecklistItem` Schema

- **File:** `src/types/database.ts`
- **Change:** Expand `agent_config` to support full structured semantics.

  ```typescript
  agent_config?: {
    // Execution
    action_type: 'manual' | 'browse' | 'api_call' | 'code' | 'approve';
    assignee?: 'human' | 'any_agent' | string; // Agent UUID
    timeout_ms?: number;
    fallback_assignee?: 'human';

    // Input: What data the step needs
    input_schema?: {
      type: 'object';
      properties: Record<string, {
        type: 'string' | 'number' | 'boolean' | 'url';
        description: string;
        required?: boolean;
        default?: unknown;
      }>;
    };

    // Output: What data the step produces
    output_schema?: {
      type: 'object';
      properties: Record<string, {
        type: 'string' | 'number' | 'boolean' | 'json';
        description: string;
      }>;
    };

    // Verification
    verification?: {
      type: 'none' | 'human_review' | 'artifact' | 'assertion';
      artifact_type?: 'screenshot' | 'log' | 'file';
      assertion?: string; // e.g., "output.status_code === 200"
    };
  };
  ```

#### 1.2 Zod Validation Schema for `ChecklistContent`

- **File:** `src/lib/agent/schemas.ts` (New)
- **Purpose:** Runtime validation when agents submit content.
- **Tasks:**
  - [ ] Define `checklistItemSchema` (Zod object).
  - [ ] Define `checklistContentSchema` (wraps items map).
  - [ ] Define `agentConfigSchema` (nested within item).
  - [ ] Export `validateChecklistContent(json: unknown): ChecklistContent`.
  - [ ] Write tests for happy path + malformed JSON.

#### 1.3 Input/Output Editor UI (Step Config Panel)

- **File:** `src/components/editor/AgentConfigPanel.tsx` (New)
- **Trigger:** When editing an item in `Editor.tsx`, user clicks a "⚙️ Agent Config" toggle.
- **UI:**
  - Collapsible panel below the item text.
  - **Action Type** dropdown (manual, browse, api_call, code, approve).
  - **Assignee** selector (Human / Any Agent / Specific Agent dropdown).
  - **Input Schema** builder: Add/remove fields with `name`, `type`, `description`.
  - **Output Schema** builder: Same UI pattern.
  - **Verification** selector (None, Human Review, Artifact Required).
- **Design Tokens:**
  - Panel: `bg-muted/50 border border-border rounded-lg p-4`
  - Labels: `text-xs font-medium text-muted-foreground`
  - Purple accent for agent-specific elements: `bg-purple-500/10 text-purple-600`

#### 1.4 Visual Indicators in Run Mode

- **File:** `src/pages/RunMode.tsx`
- **Changes:**
  - [ ] Show 🤖 icon next to items with `agent_config`.
  - [ ] Show action type badge: `<Badge variant="outline">Browse</Badge>`.
  - [ ] Show assignee badge: `<Badge>Assigned to: claude-3</Badge>`.
  - [ ] Color-code: Purple border for agent-assigned items.

---

### Milestone 2: Context Window Optimization

> _"Feeding a precise checklist into an LLM context is far more efficient than feeding a generic prompt."_
> **Goal:** Machine-optimized serialization for each major LLM.

#### 2.1 Multi-Format Transformer

- **File:** `src/lib/agent/prompt-transformer.ts` (Extend)
- **New Functions:**
  ```typescript
  generateAgentContext(repo, commit, run, options?: {
    format: 'markdown' | 'json' | 'xml';
    includeMetadata: boolean;
    maxTokens?: number; // Token budget constraint
    onlyIncomplete?: boolean; // Skip completed items
  }): string
  ```
- **Tasks:**
  - [ ] **Markdown format** (existing): Human-readable, good for Claude/GPT.
  - [ ] **JSON format**: Structured, ideal for tool-calling agents.
    ```json
    {
      "repo": "Deploy to Production",
      "total_items": 12,
      "completed": 5,
      "next_item": {
        "id": "uuid",
        "text": "Run test suite",
        "action": "code",
        "input": { "command": "npm test" }
      }
    }
    ```
  - [ ] **XML format**: Best for Claude (per Anthropic guidance).
  - [ ] **Token budgeting**: If `maxTokens` is set, prioritize incomplete items, truncate descriptions.

#### 2.2 Smart Prompt Chunking

- **File:** `src/lib/agent/chunking.ts` (New)
- **Problem:** Large checklists may exceed context windows.
- **Solution:**
  - [ ] `chunkChecklist(content, maxTokens)` splits into logical pages.
  - [ ] Each chunk includes: the current section + essential context from parent items.
  - [ ] Return type: `{ chunks: string[], currentChunk: number, totalChunks: number }`.

#### 2.3 Enhanced Copy UI (Format Selector)

- **File:** `src/components/run/AgentExportButton.tsx` (Extend)
- **Changes:**
  - [ ] Add "Format" sub-menu: Markdown | JSON | XML.
  - [ ] Add "Scope" toggle: Full Checklist | Remaining Items Only.
  - [ ] Preview the token count estimate before copying: `~450 tokens`.

---

### Milestone 3: Model Context Protocol (MCP) Server

> _"The interface for our silicon colleagues."_
> **Goal:** A fully compliant MCP server that works with Claude Desktop, Cursor, Windsurf, etc.

#### 3.1 MCP Server Scaffold

- **Directory:** `packages/mcp-server/`
- **Tasks:**
  - [ ] Initialize package: `package.json`, `tsconfig.json`.
  - [ ] Install: `@modelcontextprotocol/sdk`, `zod`, `@supabase/supabase-js`.
  - [ ] Create entry point: `packages/mcp-server/src/index.ts`.
  - [ ] Configure stdio transport (primary) + SSE transport (optional).
  - [ ] Add `bin` entry to `package.json` for `npx checklist-hq-mcp`.

#### 3.2 Authentication Layer

- **File:** `packages/mcp-server/src/auth.ts`
- **Options:**
  1. **API Key** (Simplest): User generates a key in Settings → Agent API Keys.
  2. **Supabase Session Token**: Passed as env var `CHQ_SESSION_TOKEN`.
- **Tasks:**
  - [ ] Create `SettingsPage` section for "API Keys" (generate, revoke, copy).
  - [ ] Supabase table: `api_keys (id, user_id, key_hash, name, last_used, created_at)`.
  - [ ] RLS: User can only see/manage their own keys.
  - [ ] MCP server reads `CHQ_API_KEY` from environment and validates against DB.

#### 3.3 Resources (Read-Only Data)

- **File:** `packages/mcp-server/src/resources.ts`
- **Resources:**

  | URI Template                    | Description                | Returns                                    |
  | :------------------------------ | :------------------------- | :----------------------------------------- |
  | `checklist://repos`             | List all user repositories | JSON array of `{ id, title, description }` |
  | `checklist://repo/{id}/latest`  | Latest commit content      | Markdown (via prompt-transformer)          |
  | `checklist://repo/{id}/history` | Commit history             | JSON array of `{ id, message, date }`      |
  | `checklist://run/{id}/status`   | Live run progress          | JSON `{ status, completed, total, items }` |

- **Tasks:**
  - [ ] Implement `listResources()` handler.
  - [ ] Implement `readResource(uri)` handler with URI parsing.
  - [ ] Add rate limiting (100 req/min per API key).

#### 3.4 Tools (Actions)

- **File:** `packages/mcp-server/src/tools.ts`
- **Tools:**

  | Tool                | Description                   | Input Schema                                      | Output                            |
  | :------------------ | :---------------------------- | :------------------------------------------------ | :-------------------------------- |
  | `list_repositories` | Search/list checklists        | `{ query?, limit?, tag? }`                        | `[{ id, title, items_count }]`    |
  | `get_checklist`     | Get full checklist content    | `{ repo_id }`                                     | Structured JSON                   |
  | `start_run`         | Begin executing a checklist   | `{ repo_id, name? }`                              | `{ run_id }`                      |
  | `update_item`       | Mark item complete/incomplete | `{ run_id, item_id, completed, note?, output? }`  | `{ success, next_item? }`         |
  | `get_run_status`    | Check execution progress      | `{ run_id }`                                      | `{ status, progress_pct, items }` |
  | `create_repository` | Create a new checklist        | `{ title, description?, items? }`                 | `{ repo_id, commit_id }`          |
  | `commit_changes`    | Update checklist structure    | `{ repo_id, parent_commit_id, content, message }` | `{ commit_id }`                   |

- **Tasks per Tool:**
  - [ ] Define Zod input schema.
  - [ ] Implement handler calling Supabase service layer.
  - [ ] Add input validation + error handling.
  - [ ] Return helpful error messages (not raw Postgres errors).
  - [ ] Write integration test (mock Supabase).

#### 3.5 Prompts (Pre-Built Templates)

- **File:** `packages/mcp-server/src/prompts.ts`
- **Prompts:**

  | Prompt                 | Description                 | Arguments            |
  | :--------------------- | :-------------------------- | :------------------- |
  | `execute_checklist`    | Full execution instructions | `repo_id`, `run_id?` |
  | `review_checklist`     | Quality review prompt       | `repo_id`            |
  | `convert_to_checklist` | Parse text into checklist   | `raw_text`           |

#### 3.6 "Connect to MCP" UI

- **File:** `src/components/settings/McpConnectionGuide.tsx` (New)
- **Triggered from:** User Settings → "Agent Access" tab.
- **Content:**
  - Step 1: Generate an API key.
  - Step 2: Copy the MCP config JSON snippet:
    ```json
    {
      "mcpServers": {
        "checklist-hq": {
          "command": "npx",
          "args": ["-y", "checklist-hq-mcp"],
          "env": { "CHQ_API_KEY": "chq_xxxx" }
        }
      }
    }
    ```
  - Step 3: Paste into Claude Desktop / Cursor / Windsurf settings.
  - Visual: Tabs for each supported client (with logo icons).

---

### Milestone 4: Traceability & Audit Trail

> _"Every run is a cryptographic-style log of who (Human or Agent ID) did what, when."_
> **Goal:** Full provenance tracking for every action.

#### 4.1 Extend `ItemProgress` for Agent Attribution

- **File:** `src/types/database.ts`
- **Current fields** (already exist):
  ```typescript
  completed_by?: string       // User ID or Agent ID
  completed_by_type?: 'human' | 'agent'
  agent_output?: Record<string, unknown>
  ```
- **New fields:**
  ```typescript
  completed_by_name?: string    // "Claude 3.5 Sonnet" or "Raja"
  duration_ms?: number          // How long the step took
  attempt_count?: number        // Retries (for agents)
  verification_status?: 'pending' | 'verified' | 'rejected'
  verified_by?: string          // Human who approved agent work
  artifacts?: Array<{
    type: 'screenshot' | 'log' | 'file' | 'url';
    url: string;
    description: string;
  }>;
  ```

#### 4.2 Run Timeline View (Organic vs Synthetic)

- **File:** `src/components/run/RunTimeline.tsx` (New)
- **Manifesto:** "It must always be obvious whether a step was completed by a human or a machine."
- **UI:**
  - Vertical timeline on run detail page.
  - Each event shows:
    - 🧑 Human avatar **OR** 🤖 Agent icon (with name).
    - Timestamp.
    - Action: "Completed: Run test suite".
    - Duration badge: `took 3.2s`.
    - Output preview (collapsible).
  - **Color coding:**
    - Human actions: Default foreground.
    - Agent actions: `text-purple-500` + `border-l-2 border-purple-500`.

#### 4.3 Agent Output Viewer

- **File:** `src/components/run/AgentOutputViewer.tsx` (New)
- **Trigger:** Click on an agent-completed item in RunMode.
- **UI:**
  - Slide-over panel.
  - Shows: raw agent output (JSON), formatted summary, artifacts (links/previews).
  - "Approve" / "Reject & Retry" buttons for verification mode.

---

### Milestone 5: Hybrid Execution (The Orchestrator)

> _"Human approves Step 1, Agent executes Steps 2-5, Human reviews Step 6."_
> **Goal:** Seamless handoffs between human and agent within a single run.

#### 5.1 Run Orchestrator Hook

- **File:** `src/hooks/useRunOrchestrator.ts` (New)
- **Responsibilities:**
  - Track current active item.
  - Determine if next item is `human` or `agent` assigned.
  - If `agent`: trigger agent execution flow.
  - If `human`: show normal interactive UI.
  - Handle `approve` action type: pause and wait for human sign-off.

#### 5.2 Agent Execution Engine (Client-Side)

- **File:** `src/lib/agent/execution-engine.ts` (New)
- **Flow:**
  ```
  1. Read current item's agent_config
  2. Construct prompt: item text + input_schema + context from previous outputs
  3. Call LLM API (user's own API key from settings)
  4. Parse response against output_schema
  5. If verification === 'human_review': mark as 'pending_review'
  6. If verification === 'none': auto-complete and advance
  ```
- **Tasks:**
  - [ ] Create `AgentExecutionEngine` class.
  - [ ] Method: `executeItem(item, context, apiKey): Promise<AgentResult>`.
  - [ ] Support providers: `openai`, `anthropic` (via `fetch`, no SDK dep).
  - [ ] Timeout handling (respect `agent_config.timeout_ms`).
  - [ ] Error → set `fallback_assignee` (reassign to human).

#### 5.3 "Auto-Pilot Mode" Toggle

- **File:** `src/pages/RunMode.tsx` (Extend)
- **UI:**
  - Toggle switch in run header: "🤖 Auto-Pilot: OFF / ON".
  - When ON: agent items auto-execute sequentially.
  - When OFF: agent items show "▶ Execute" button (manual trigger per step).
  - Status indicator: "Agent is working on Step 4 of 12..."
- **States:**
  - `idle`: No agent activity.
  - `executing`: Agent is processing.
  - `awaiting_approval`: Agent finished, waiting for human.
  - `error`: Agent failed, needs human intervention.

#### 5.4 API Key Management (BYO Key)

- **File:** `src/pages/Profile.tsx` → new section "AI Provider Keys"
- **UI:**
  - Encrypted input fields for:
    - OpenAI API Key
    - Anthropic API Key
  - Keys stored in `localStorage` (never sent to Supabase).
  - "Test Connection" button per provider.
  - Warning: "Keys are stored locally and never leave your device."

#### 5.5 Delegation UI

- **File:** `src/components/run/DelegateToAgentModal.tsx` (New)
- **Trigger:** Right-click or hover menu on a section header in RunMode.
- **UI:**
  - "Delegate this section to an Agent"
  - Select agent / provider.
  - Preview affected items.
  - "Start Delegation" button.
  - Live progress indicator during execution.

---

## 🗓️ Suggested Timeline

| Week         | Milestone   | Key Deliverable                                 |
| :----------- | :---------- | :---------------------------------------------- |
| **Week 1-2** | Milestone 1 | Schema + AgentConfigPanel UI                    |
| **Week 3**   | Milestone 2 | Multi-format transformer + token budgeting      |
| **Week 4-6** | Milestone 3 | MCP Server (resources + tools + auth)           |
| **Week 7**   | Milestone 4 | Traceability timeline + agent output viewer     |
| **Week 8-9** | Milestone 5 | Orchestrator + Auto-Pilot toggle                |
| **Week 10**  | Polish & QA | End-to-end testing with Claude Desktop + Cursor |

---

## 🔗 Cross-References

- **MANIFESTO.md:** Phase 2 (Agent Protocol) + Phase 3 (Hybrid Network)
- **ARCHITECTURE.md:** `ChecklistItem.agent_config`, `ItemProgress.completed_by_type`
- **DESIGN_PHILOSOPHY.md:** Purple accent for agent UI, `sonner` toasts, `cn()` styling
- **AI_AGENT_ROADMAP.md:** Phase 1 (Complete ✅), Phase 2-5 (This document details)
- **ROADMAP.md:** Phase 5 (Agent Protocol) maps to Milestones 1-3 here

---

## 📐 Design Language for Agent Features

All agent-related UI must follow a consistent visual language to distinguish **Organic (Human)** from **Synthetic (Agent)** actions per the Manifesto:

| Element          | Human                   | Agent                                                                                     |
| :--------------- | :---------------------- | :---------------------------------------------------------------------------------------- |
| **Accent Color** | Default (`primary`)     | Purple (`purple-500/600`)                                                                 |
| **Icon**         | User avatar             | 🤖 or `AiCloud02Icon`                                                                     |
| **Border**       | `border-border`         | `border-purple-500/30`                                                                    |
| **Background**   | `bg-card`               | `bg-purple-500/5`                                                                         |
| **Badge**        | `<Badge>Manual</Badge>` | `<Badge variant="outline" className="border-purple-500/30 text-purple-600">Agent</Badge>` |
| **Label**        | "Completed by Raja"     | "Completed by Claude 3.5 Sonnet"                                                          |
