/**
 * MCP Prompts (Pre-Built Templates)
 *
 * Prompts provide ready-to-use instructions for common AI tasks.
 */
import { getSupabaseClient } from './auth.js';
import { generateAgentContext } from '../lib/agent/prompt-transformer.js';
const supabase = getSupabaseClient();
/**
 * List all available prompts
 */
export async function listPrompts() {
    return {
        prompts: [
            {
                name: 'execute_checklist',
                description: 'Get full instructions for executing a checklist as an AI agent',
                arguments: [
                    {
                        name: 'repo_id',
                        description: 'Repository ID to execute',
                        required: true,
                    },
                    {
                        name: 'run_id',
                        description: 'Optional: existing run ID to continue',
                        required: false,
                    },
                ],
            },
            {
                name: 'review_checklist',
                description: 'Get instructions for reviewing checklist quality and completeness',
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
                description: 'Convert raw text/documentation into structured checklist format',
                arguments: [
                    {
                        name: 'raw_text',
                        description: 'Text to convert (SOP, process doc, etc.)',
                        required: true,
                    },
                ],
            },
        ],
    };
}
/**
 * Get a specific prompt with arguments filled in
 */
export async function getPrompt(promptName, args, authContext) {
    switch (promptName) {
        case 'execute_checklist':
            return await promptExecuteChecklist(args, authContext);
        case 'review_checklist':
            return await promptReviewChecklist(args, authContext);
        case 'convert_to_checklist':
            return await promptConvertToChecklist(args, authContext);
        default:
            throw new Error(`Unknown prompt: ${promptName}`);
    }
}
/**
 * Prompt: execute_checklist
 */
async function promptExecuteChecklist(args, authContext) {
    const repoId = args.repo_id;
    const runId = args.run_id;
    // Get repository
    const { data: repo, error: repoError } = await supabase
        .from('repositories')
        .select('*')
        .eq('id', repoId)
        .eq('owner_id', authContext.userId)
        .single();
    if (repoError || !repo) {
        throw new Error('Repository not found or access denied');
    }
    // Get latest commit
    const { data: commit, error: commitError } = await supabase
        .from('commits')
        .select('*')
        .eq('repo_id', repoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (commitError || !commit) {
        throw new Error('No commits found for this repository');
    }
    // Get run if provided
    let run;
    if (runId) {
        const { data: runData, error: runError } = await supabase
            .from('runs')
            .select('*')
            .eq('id', runId)
            .single();
        if (runError || !runData) {
            throw new Error('Run not found');
        }
        run = runData;
    }
    // Generate context
    const context = generateAgentContext(repo, commit, run, {
        format: 'markdown',
        includeMetadata: true,
        onlyIncomplete: !!run,
    });
    const promptText = `You are an expert process executor with access to the Checklist HQ MCP server.

GOAL: Complete the following checklist systematically and accurately.

RULES:
1. Use the \`update_item\` tool to mark items complete as you finish them
2. If an item has agent_config, follow its execution parameters
3. For items requiring browsing, use your browser tool
4. For items requiring code execution, use your code tool
5. Provide structured output in the agent_output field when specified
6. If you encounter errors, document them in the note field
7. ALWAYS verify your work before marking an item complete

AVAILABLE TOOLS:
- update_item: Mark items as complete/incomplete
- get_run_status: Check overall progress

CHECKLIST CONTEXT:
${context}

HOW TO PROCEED:
1. Review the full checklist structure first
2. Execute items in order, respecting dependencies
3. Mark each item complete using update_item
4. If you need human review, mark the item complete but note it in the output
5. Continue until all items are complete or you encounter a blocker

${runId ? `CURRENT RUN: ${runId}\n\nContinue from where you left off.` : `Start by creating a new run using the start_run tool with repo_id: ${repoId}`}`;
    return {
        description: 'Instructions for executing this checklist',
        messages: [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: promptText,
                },
            },
        ],
    };
}
/**
 * Prompt: review_checklist
 */
async function promptReviewChecklist(args, authContext) {
    const repoId = args.repo_id;
    // Get repository
    const { data: repo, error: repoError } = await supabase
        .from('repositories')
        .select('*')
        .eq('id', repoId)
        .eq('owner_id', authContext.userId)
        .single();
    if (repoError || !repo) {
        throw new Error('Repository not found or access denied');
    }
    // Get latest commit
    const { data: commit, error: commitError } = await supabase
        .from('commits')
        .select('*')
        .eq('repo_id', repoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (commitError || !commit) {
        throw new Error('No commits found for this repository');
    }
    const context = generateAgentContext(repo, commit, undefined, {
        format: 'markdown',
        includeMetadata: true,
    });
    const promptText = `You are a process quality expert. Review the following checklist for completeness and quality.

CHECKLIST TO REVIEW:
${context}

REVIEW CRITERIA:
1. **Completeness**: Are all necessary steps included?
2. **Clarity**: Is each step clear and unambiguous?
3. **Order**: Are steps in logical sequence?
4. **Dependencies**: Are dependencies properly structured?
5. **Agent Config**: If agent_config exists, is it well-defined?
6. **Input/Output**: Are input and output schemas appropriate?
7. **Verification**: Are verification methods suitable?

PROVIDE:
1. Overall quality score (1-10)
2. List of missing steps or gaps
3. Suggestions for improvement
4. Recommended agent_config for automatable steps
5. Potential edge cases or failure modes

FORMAT YOUR RESPONSE AS:
## Quality Score: X/10

## Gaps & Missing Steps:
- ...

## Improvement Suggestions:
- ...

## Automation Opportunities:
- Step X could use agent_config with action_type: ...

## Edge Cases:
- ...`;
    return {
        description: 'Instructions for reviewing this checklist',
        messages: [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: promptText,
                },
            },
        ],
    };
}
/**
 * Prompt: convert_to_checklist
 */
async function promptConvertToChecklist(args, _authContext) {
    const rawText = args.raw_text;
    const promptText = `You are a process structure expert. Convert the following text into a structured checklist.

RAW TEXT:
${rawText}

OUTPUT FORMAT:
Use the create_repository tool with a properly structured items object following this schema:

\`\`\`typescript
{
  rootId: "root",
  items: {
    "root": {
      id: "root",
      text: "",
      children: ["item-1", "item-2"]
    },
    "item-1": {
      id: "item-1",
      text: "First step",
      children: ["item-1-1"],
      agent_config?: {
        action_type: "manual" | "browse" | "api_call" | "code" | "approve",
        assignee?: "human" | "any_agent",
        input_schema?: { ... },
        output_schema?: { ... }
      }
    },
    "item-1-1": {
      id: "item-1-1",
      text: "Sub-step",
      children: []
    }
  }
}
\`\`\`

GUIDELINES:
1. Create a hierarchical structure (parent → children)
2. Use descriptive IDs (item-1, item-2, not uuid)
3. Add agent_config for steps that could be automated
4. Keep the root item empty (it's just a container)
5. Ensure all children arrays reference valid item IDs

After generating the structure, call create_repository with:
- title: (Extract from the text)
- description: (Brief summary)
- items: (Your structured checklist)`;
    return {
        description: 'Instructions for converting text to checklist',
        messages: [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: promptText,
                },
            },
        ],
    };
}
//# sourceMappingURL=server.js.map