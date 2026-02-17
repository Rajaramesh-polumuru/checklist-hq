/**
 * Generates a dense, token-efficient format optimized for LLMs.
 * Supports multiple output formats for different LLM preferences.
 */
export function generateAgentContext(repo, commit, run, options = {}) {
    const { format = 'markdown', includeMetadata = true, onlyIncomplete = false } = options;
    switch (format) {
        case 'json':
            return generateJSONContext(repo, commit, run, { includeMetadata, onlyIncomplete });
        case 'xml':
            return generateXMLContext(repo, commit, run, { includeMetadata, onlyIncomplete });
        case 'markdown':
        default:
            return generateMarkdownContext(repo, commit, run, { includeMetadata, onlyIncomplete });
    }
}
/**
 * Original markdown format (for backward compatibility)
 */
function generateMarkdownContext(repo, commit, run, _options = {}) {
    const lines = [];
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
function renderItem(item, index, allItems, run, lines, depth) {
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
        if (config.input_schema) {
            const fields = Object.keys(config.input_schema.properties || {});
            if (fields.length > 0) {
                lines.push(`${indent}> Inputs: ${fields.join(', ')}`);
            }
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
 * JSON format - Structured, ideal for tool-calling agents
 */
function generateJSONContext(repo, commit, run, options = {}) {
    const { includeMetadata = true, onlyIncomplete = false } = options;
    const items = commit.content.items;
    const allItems = Object.values(items);
    const completedItems = run
        ? allItems.filter(item => run.progress?.[item.id]?.completed).length
        : 0;
    const itemsArray = allItems
        .filter(item => !onlyIncomplete || !run?.progress?.[item.id]?.completed)
        .map(item => ({
        id: item.id,
        text: item.text,
        completed: run?.progress?.[item.id]?.completed ?? false,
        parent: item.parent,
        order: item.order,
        type: item.type,
        details: item.details,
        agent_config: item.agent_config,
    }));
    const context = {
        repo: repo.title,
        description: repo.description,
        items: itemsArray,
    };
    if (includeMetadata) {
        context.metadata = {
            total_items: allItems.length,
            completed: completedItems,
            remaining: allItems.length - completedItems,
            completion_pct: allItems.length > 0
                ? Math.round((completedItems / allItems.length) * 100)
                : 0,
        };
    }
    return JSON.stringify(context, null, 2);
}
/**
 * XML format - Best for Claude (per Anthropic guidance)
 */
function generateXMLContext(repo, commit, run, options = {}) {
    const { includeMetadata = true, onlyIncomplete = false } = options;
    const items = commit.content.items;
    const allItems = Object.values(items);
    const rootItems = allItems.filter(item => !item.parent);
    const lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<checklist>');
    lines.push(`  <title>${escapeXML(repo.title)}</title>`);
    if (repo.description) {
        lines.push(`  <description>${escapeXML(repo.description)}</description>`);
    }
    if (includeMetadata) {
        const completedCount = run
            ? allItems.filter(item => run.progress?.[item.id]?.completed).length
            : 0;
        lines.push('  <metadata>');
        lines.push(`    <total>${allItems.length}</total>`);
        lines.push(`    <completed>${completedCount}</completed>`);
        lines.push(`    <remaining>${allItems.length - completedCount}</remaining>`);
        lines.push('  </metadata>');
    }
    lines.push('  <items>');
    rootItems.forEach(item => {
        renderXMLItem(item, items, run, lines, 2, onlyIncomplete);
    });
    lines.push('  </items>');
    lines.push('</checklist>');
    return lines.join('\n');
}
function renderXMLItem(item, allItems, run, lines, indentLevel, onlyIncomplete) {
    const isCompleted = run?.progress?.[item.id]?.completed ?? false;
    // Skip if filtering for incomplete only
    if (onlyIncomplete && isCompleted)
        return;
    const indent = '  '.repeat(indentLevel);
    const children = Object.values(allItems)
        .filter(child => child.parent === item.id)
        .sort((a, b) => a.order - b.order);
    lines.push(`${indent}<item id="${item.id}" completed="${isCompleted}">`);
    lines.push(`${indent}  <text>${escapeXML(item.text)}</text>`);
    if (item.type) {
        lines.push(`${indent}  <type>${item.type}</type>`);
    }
    if (item.details) {
        lines.push(`${indent}  <details>${escapeXML(item.details)}</details>`);
    }
    if (item.agent_config) {
        lines.push(`${indent}  <agent_config>`);
        lines.push(`${indent}    <action_type>${item.agent_config.action_type}</action_type>`);
        if (item.agent_config.assignee) {
            lines.push(`${indent}    <assignee>${escapeXML(item.agent_config.assignee)}</assignee>`);
        }
        lines.push(`${indent}  </agent_config>`);
    }
    if (children.length > 0) {
        lines.push(`${indent}  <children>`);
        children.forEach(child => {
            renderXMLItem(child, allItems, run, lines, indentLevel + 2, onlyIncomplete);
        });
        lines.push(`${indent}  </children>`);
    }
    lines.push(`${indent}</item>`);
}
function escapeXML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
/**
 * Generates an execution-focused prompt with instructions for the agent.
 */
export function generateExecutionPrompt(repo, commit, run, options) {
    const context = generateAgentContext(repo, commit, run, options);
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
//# sourceMappingURL=prompt-transformer.js.map