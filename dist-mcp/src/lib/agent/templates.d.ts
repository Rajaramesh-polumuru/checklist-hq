/**
 * System prompt templates for different agent scenarios.
 */
export declare const EXECUTION_TEMPLATE = "You are an expert process executor.\n\nGOAL: Complete the following checklist.\n\nRULES:\n1. Mark items as [x] when you complete them.\n2. If an item requires browsing, use your browser tool.\n3. If an item has agent config, use the specified model/provider.\n4. Respond with the updated checklist state in a code block.\n5. Document your actions and outputs for each step.\n\n---\n\n{{CHECKLIST_CONTEXT}}";
export declare const CONTEXT_ONLY_TEMPLATE = "{{CHECKLIST_CONTEXT}}";
export declare const REVIEW_TEMPLATE = "You are a process quality reviewer.\n\nTASK: Analyze the following checklist for:\n- Missing steps\n- Unclear instructions\n- Logical gaps\n- Risk areas\n\nProvide specific recommendations for improvement.\n\n---\n\n{{CHECKLIST_CONTEXT}}";
/**
 * Replace template variables with actual content.
 */
export declare function fillTemplate(template: string, context: string): string;
//# sourceMappingURL=templates.d.ts.map