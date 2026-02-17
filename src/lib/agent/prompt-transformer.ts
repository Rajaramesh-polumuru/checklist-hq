import type { Repository, Commit, Run, ChecklistItem } from '@/types/database';

/**
 * Generates a dense, token-efficient Markdown format optimized for LLMs.
 * Includes current state and execution rules.
 */
export function generateAgentContext(
  repo: Repository,
  commit: Commit,
  run?: Run
): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${repo.title}`);
  if (repo.description) {
    lines.push(`> ${repo.description}`);
  }
  lines.push('');

  // Structure
  const items = commit.content.items;
  const allItems = Object.values(items);
  const rootItems = allItems.filter(item => !item.parent);

  rootItems.forEach((item, index) => {
    renderItem(item, index + 1, items, run, lines, 0);
  });

  return lines.join('\n');
}

function renderItem(
  item: ChecklistItem,
  index: number,
  allItems: Record<string, ChecklistItem>,
  run: Run | undefined,
  lines: string[],
  depth: number
): void {
  const indent = '  '.repeat(depth);
  const prefix = depth === 0 ? '##' : '-';
  
  // Check completion status
  const isCompleted = run?.progress?.[item.id]?.completed ?? false;
  const checkbox = isCompleted ? '[x]' : '[ ]';
  
  // Item line
  const numbering = depth === 0 ? `${index}` : `${index}`;
  lines.push(`${indent}${prefix} ${checkbox} ${numbering}. ${item.text}`);
  
  // Add details if present
  if (item.details) {
    lines.push(`${indent}  _${item.details}_`);
  }
  
  // Agent config (if exists)
  if (item.agent_config) {
    const config = item.agent_config;
    lines.push(`${indent}> 🤖 Action: ${config.action_type}`);
    if (config.assignee) {
      lines.push(`${indent}> Assignee: ${config.assignee}`);
    }
    if (config.parameters) {
      lines.push(`${indent}> Params: ${JSON.stringify(config.parameters)}`);
    }
  }
  
  // Render children
  const children = Object.values(allItems)
    .filter(child => child.parent === item.id)
    .sort((a, b) => a.order - b.order);
  
  children.forEach((child, childIndex) => {
    renderItem(child, childIndex + 1, allItems, run, lines, depth + 1);
  });
}

/**
 * Generates an execution-focused prompt with instructions for the agent.
 */
export function generateExecutionPrompt(
  repo: Repository,
  commit: Commit,
  run?: Run
): string {
  const context = generateAgentContext(repo, commit, run);
  
  return `You are an expert process executor.

GOAL: Complete the following checklist.

RULES:
1. Mark items as [x] when you complete them.
2. If an item requires browsing, use your browser tool.
3. If an item has agent config, use the specified model/provider.
4. Respond with the updated checklist state in a code block.
5. Document your actions and outputs for each step.

---

${context}`;
}
