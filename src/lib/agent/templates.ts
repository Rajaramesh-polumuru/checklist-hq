/**
 * System prompt templates for different agent scenarios.
 */

export const EXECUTION_TEMPLATE = `You are an expert process executor.

GOAL: Complete the following checklist.

RULES:
1. Mark items as [x] when you complete them.
2. If an item requires browsing, use your browser tool.
3. If an item has agent config, use the specified model/provider.
4. Respond with the updated checklist state in a code block.
5. Document your actions and outputs for each step.

---

{{CHECKLIST_CONTEXT}}`;

export const CONTEXT_ONLY_TEMPLATE = `{{CHECKLIST_CONTEXT}}`;

export const REVIEW_TEMPLATE = `You are a process quality reviewer.

TASK: Analyze the following checklist for:
- Missing steps
- Unclear instructions
- Logical gaps
- Risk areas

Provide specific recommendations for improvement.

---

{{CHECKLIST_CONTEXT}}`;

/**
 * Replace template variables with actual content.
 */
export function fillTemplate(template: string, context: string): string {
  return template.replace('{{CHECKLIST_CONTEXT}}', context);
}
