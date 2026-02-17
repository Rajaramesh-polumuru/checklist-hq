/**
 * MCP Prompts - Pre-Built Templates
 * Provides ready-to-use prompts for common agent workflows
 */
import { generateAgentContext, generateExecutionPrompt } from '@/lib/agent/prompt-transformer';
import { supabase } from '@/lib/supabase';
/**
 * List available prompt templates
 */
export function listPrompts() {
    return [
        {
            name: 'execute_checklist',
            description: 'Full execution instructions for running a checklist',
            arguments: [
                {
                    name: 'repo_id',
                    description: 'Repository ID to execute',
                    required: true,
                },
                {
                    name: 'run_id',
                    description: 'Existing run ID (optional - creates new if omitted)',
                    required: false,
                },
            ],
        },
        {
            name: 'review_checklist',
            description: 'Quality review prompt for analyzing checklist structure',
            arguments: [
                {
                    name: 'repo_id',
                    description: 'Repository ID to review',
                    required: true,
                },
            ],
        },
        {
            name: 'convert_to_checklist',
            description: 'Parse raw text into structured checklist',
            arguments: [
                {
                    name: 'raw_text',
                    description: 'Unstructured text to convert',
                    required: true,
                },
            ],
        },
    ];
}
/**
 * Generate prompt content from template
 */
export async function getPrompt(name, args, userId) {
    switch (name) {
        case 'execute_checklist':
            return await generateExecuteChecklistPrompt(args, userId);
        case 'review_checklist':
            return await generateReviewChecklistPrompt(args, userId);
        case 'convert_to_checklist':
            return generateConvertToChecklistPrompt(args);
        default:
            throw new Error(`Unknown prompt template: ${name}`);
    }
}
/**
 * Execute Checklist Prompt
 */
async function generateExecuteChecklistPrompt(args, userId) {
    const repoId = args.repo_id;
    const runId = args.run_id;
    if (!repoId) {
        throw new Error('repo_id is required');
    }
    // Fetch repository
    const { data: repo, error: repoError } = await supabase
        .from('repositories')
        .select('*')
        .eq('id', repoId)
        .eq('owner_id', userId)
        .single();
    if (repoError || !repo) {
        throw new Error('Repository not found or access denied');
    }
    // Fetch latest commit
    const { data: commit, error: commitError } = await supabase
        .from('commits')
        .select('*')
        .eq('repo_id', repoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (commitError || !commit) {
        throw new Error('No commits found');
    }
    let run;
    if (runId) {
        const { data: runData, error: runError } = await supabase
            .from('runs')
            .select('*')
            .eq('id', runId)
            .single();
        if (!runError && runData) {
            run = runData;
        }
    }
    return generateExecutionPrompt(repo, commit, run, {
        format: 'markdown',
        onlyIncomplete: true,
    });
}
/**
 * Review Checklist Prompt
 */
async function generateReviewChecklistPrompt(args, userId) {
    const repoId = args.repo_id;
    if (!repoId) {
        throw new Error('repo_id is required');
    }
    // Fetch repository
    const { data: repo, error: repoError } = await supabase
        .from('repositories')
        .select('*')
        .eq('id', repoId)
        .eq('owner_id', userId)
        .single();
    if (repoError || !repo) {
        throw new Error('Repository not found or access denied');
    }
    // Fetch latest commit
    const { data: commit, error: commitError } = await supabase
        .from('commits')
        .select('*')
        .eq('repo_id', repoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (commitError || !commit) {
        throw new Error('No commits found');
    }
    const context = generateAgentContext(repo, commit, undefined, {
        format: 'markdown',
    });
    return `You are a process quality expert.

TASK: Analyze the following checklist for:
- Missing steps or gaps in the process
- Unclear or ambiguous instructions
- Logical inconsistencies or ordering issues
- Risk areas that need additional safeguards
- Opportunities for automation via agent_config

Provide specific, actionable recommendations for improvement.

---

${context}

---

ANALYSIS:`;
}
/**
 * Convert to Checklist Prompt
 */
function generateConvertToChecklistPrompt(args) {
    const rawText = args.raw_text;
    if (!rawText) {
        throw new Error('raw_text is required');
    }
    return `You are an expert at converting unstructured text into structured checklists.

TASK: Convert the following text into a hierarchical checklist in JSON format.

OUTPUT FORMAT:
{
  "version": "1.0.0",
  "items": {
    "item-uuid-1": {
      "id": "item-uuid-1",
      "text": "Task description",
      "parent": null,
      "order": 0,
      "type": "task",
      "details": "Optional additional context"
    },
    ...
  }
}

RULES:
1. Use proper UUIDs for item IDs
2. type can be: "task", "header", or "note"
3. parent is null for root items, or another item's UUID for nested items
4. order determines sequence within the same parent
5. Extract actionable steps as "task", section titles as "header", and notes as "note"
6. Keep text concise; put additional context in "details"

INPUT TEXT:
---
${rawText}
---

OUTPUT JSON:`;
}
//# sourceMappingURL=prompts.js.map