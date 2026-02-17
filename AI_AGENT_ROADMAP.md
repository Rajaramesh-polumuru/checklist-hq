# AI Agent Integration Roadmap (Detailed)

> **Goal:** Function as the "nervous system" for AI agents, allowing them to read, execute, and create checklists with precision.

This roadmap details the implementation of Model Context Protocol (MCP) and agent-first workflows, leveraging our "Git for Process" architecture.

---

## Phase 1: Context & Prompt Export (The "Copy" Workflow)

**Objective:** Allow users to instantly copy a checklist in a format optimized for LLMs (ChatGPT, Claude, etc.), including current state and execution rules.

### 1.1 The `toAgentPrompt()` Transformer

Create a utility that serializes a Repository/Commit into a dense, token-efficient Markdown format.

- **File:** `src/lib/agent/prompt-transformer.ts`
- **Function:** `generateAgentContext(repo: Repository, commit: Commit, run?: Run): string`
- **Logic:**
  1.  **Header:** `Repository Title` + `Description`.
  2.  **Structure:** Iterate through `commit.content.items`.
  3.  **State:** If `run` is provided, look up `run.progress[itemId].completed`.
  4.  **Format:**
      - **Root Items:** `## [ ] 1. Item Text`
      - **Children:** `- [ ] 1.1 Sub-item`
      - **Agent Config:** If `item.agent_config` exists, append `> 🤖 Action: [Type] (Input: [Params])`.
- **Optimization:** Remove unnecessary fields (IDs, timestamps) to save tokens.

### 1.2 The "Copy for Agent" UI Component

- **File:** `src/components/run/AgentExportButton.tsx`
- **UI:**
  - Button using `@hugeicons/react` (`ai-brain-01` or similar).
  - Placed in `RunMode` header near "Share".
- **Interaction:**
  - **Click:** Opens `DropdownMenu`.
  - **Option A:** "Copy Context Only" (Just the checklist state).
  - **Option B:** "Copy Execution Prompt" (State + "Your goal is to complete this...").
  - **Feedback:** `sonner` toast: "Copied context for Claude/ChatGPT".

### 1.3 System Prompt Engineering

- **File:** `src/lib/agent/templates.ts`
- **Template:**

  ```markdown
  You are an expert process executor.
  GOAL: Complete the following checklist.

  RULES:

  1. Mark items as [x] when you complete them.
  2. If an item requires browsing, use your browser tool.
  3. Respond with the updated checklist state in a code block.

  [Checklist Context Here]
  ```

---

## Phase 2: Model Context Protocol (MCP) Server (COMPLETE ✅)

**Objective:** Expose Checklist HQ data as a standard MCP server so generic AI clients (Cursor, Windsurf, Claude Desktop) can connect directly.

### 2.1 Project Setup ✅
- **Directory:** `/src/mcp`
- **Dependencies:** `@modelcontextprotocol/sdk`

### 2.2 Resource: Read-Only Checklists ✅
- **URI:** `checklist://{repo_id}/latest`
- **Handler:** `read_resource`

### 2.3 Resource: Run Status ✅
- **URI:** `checklist://runs/{run_id}/status`
- **Handler:** `read_resource`

### 2.4 Tool: `list_repositories` ✅
- **Description:** "List available checklists for the user."

### 2.5 Tool: `start_run` ✅
- **Description:** "Start a new execution of a specific checklist."

### 2.6 Tool: `update_item` ✅
- **Description:** "Mark a step as complete or update its status."

---

## Phase 3: Agent-Authored Checklists (Creation) (COMPLETE ✅)

**Objective:** Allow agents to _create_ and _edit_ checklists via MCP.

### 3.1 Tool: `create_repository` ✅
- **Description:** "Create a new blank checklist process."

### 3.2 Tool: `commit_changes` (The Core Edit Loop) ✅
- **Description:** "Update the structure of a checklist."

---

## Phase 4: In-App "Auto-Pilot"

**Objective:** Embed the agent execution loop directly inside the Run Mode UI.

### 4.1 Schema Update

- **File:** `src/types/database.ts`
- **Field:** `ChecklistItem.agent_config`
- **Structure:**
  ```typescript
  agent_config: {
    enabled: boolean;
    provider: 'openai' | 'anthropic';
    model: string;
    system_prompt?: string; // "You are a specialized legal analyst..."
    input_mapping?: Record<string, string>; // Map run inputs to prompt
  }
  ```

### 4.2 The "Auto-Run" Loop (Client-Side)

- **File:** `src/hooks/useAgentRunner.ts`
- **Trigger:** When `activeItem` has `agent_config.enabled`.
- **Action:**
  1.  **Construct Prompt:** Combine specific item instructions + previous step outputs.
  2.  **Call API:** Client-side fetch to LLM (user provides API key in settings).
  3.  **Parse & Update:** On success, auto-call `updateItem({ completed: true, output: response })`.
  4.  **Auto-Advance:** Move to next item.

### 4.3 UI Feedback

- **Component:** `src/components/run/AgentStatusIndicator.tsx`
- **States:**
  - `Idle`: "Waiting for agent..."
  - `Processing`: "Thinking..." (Spinner)
  - `Success`: "Done via GPT-4" (Green check)
  - `Error`: "Agent Failed: [Reason]" (Retry button)

---

## Phase 5: "Smart Import" (Text-to-Checklist)

**Objective:** Paste a messy SOP document, get a structured `ChecklistContent` JSON.

### 5.1 The `parse_document` Utility

- **Input:** Raw text (PDF content, Notion dump).
- **Prompt:** "Convert this text into a hierarchical checklist JSON matching this schema: [Schema Definition]."
- **Model:** GPT-4o or Claude 3.5 Sonnet (Required for complex JSON adherence).

### 5.2 UI Implementation

- **Location:** "New Repository" Modal.
- **Action:** "Import from Text".
- **Flow:**
  1.  User pastes text.
  2.  App sends to LLM.
  3.  App displays _preview_ of the structure.
  4.  User clicks "Create Repository".
