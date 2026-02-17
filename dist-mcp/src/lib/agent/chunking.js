/**
 * Smart Prompt Chunking
 * Handles large checklists that may exceed context windows
 */
/**
 * Split a checklist into logical chunks that fit within token budget
 * @param content - The checklist content to chunk
 * @param maxTokens - Maximum tokens per chunk (default: 2000)
 * @returns Chunked checklist with metadata
 */
export function chunkChecklist(content, maxTokens = 2000) {
    const items = Object.values(content.items);
    const rootItems = items.filter(item => !item.parent);
    // Estimate tokens per item (rough: text + details + metadata)
    const estimateItemTokens = (item) => {
        const textTokens = Math.ceil((item.text?.length || 0) / 4);
        const detailsTokens = Math.ceil((item.details?.length || 0) / 4);
        const configTokens = item.agent_config ? 50 : 0; // Estimate for agent config
        return textTokens + detailsTokens + configTokens + 20; // +20 for structure overhead
    };
    // Get all descendants of an item
    const getDescendants = (itemId) => {
        const children = items.filter(item => item.parent === itemId);
        const descendants = [...children];
        children.forEach(child => {
            descendants.push(...getDescendants(child.id));
        });
        return descendants;
    };
    // Calculate total tokens for an item and its descendants
    const getItemTreeTokens = (item) => {
        const descendants = getDescendants(item.id);
        return [item, ...descendants].reduce((sum, i) => sum + estimateItemTokens(i), 0);
    };
    // Group root items into chunks
    const chunks = [];
    let currentChunk = [];
    let currentTokens = 0;
    const headerTokens = 100; // Reserve for header/metadata
    rootItems.forEach(rootItem => {
        const itemTreeTokens = getItemTreeTokens(rootItem);
        // If this single item tree exceeds max, put it in its own chunk
        if (itemTreeTokens > maxTokens - headerTokens) {
            if (currentChunk.length > 0) {
                chunks.push(currentChunk);
                currentChunk = [];
                currentTokens = 0;
            }
            chunks.push([rootItem]);
            return;
        }
        // If adding this would exceed limit, start new chunk
        if (currentTokens + itemTreeTokens > maxTokens - headerTokens) {
            chunks.push(currentChunk);
            currentChunk = [rootItem];
            currentTokens = itemTreeTokens;
        }
        else {
            currentChunk.push(rootItem);
            currentTokens += itemTreeTokens;
        }
    });
    // Push remaining items
    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }
    // Convert chunks to markdown strings
    const chunkStrings = chunks.map((chunkItems, chunkIndex) => {
        const lines = [];
        // Chunk header
        lines.push(`# Checklist (Part ${chunkIndex + 1}/${chunks.length})`);
        lines.push('');
        // Render items
        chunkItems.forEach((item, index) => {
            renderItemTree(item, index + 1, items, lines, 0);
        });
        return lines.join('\n');
    });
    return {
        chunks: chunkStrings,
        currentChunk: 0,
        totalChunks: chunks.length,
        metadata: {
            totalItems: items.length,
            itemsPerChunk: chunks.map(chunk => {
                // Count total items including descendants
                return chunk.reduce((sum, item) => sum + 1 + getDescendants(item.id).length, 0);
            }),
        },
    };
}
/**
 * Render an item and its descendants as markdown
 */
function renderItemTree(item, index, allItems, lines, depth) {
    const indent = '  '.repeat(depth);
    const prefix = depth === 0 ? '##' : '-';
    lines.push(`${indent}${prefix} ${index}. ${item.text}`);
    if (item.details) {
        lines.push(`${indent}  _${item.details}_`);
    }
    if (item.agent_config) {
        lines.push(`${indent}  > 🤖 ${item.agent_config.action_type}`);
    }
    // Render children
    const children = allItems
        .filter(child => child.parent === item.id)
        .sort((a, b) => a.order - b.order);
    children.forEach((child, childIndex) => {
        renderItemTree(child, childIndex + 1, allItems, lines, depth + 1);
    });
}
/**
 * Estimate total tokens for a checklist
 */
export function estimateChecklistTokens(content) {
    const items = Object.values(content.items);
    return items.reduce((sum, item) => {
        const textTokens = Math.ceil((item.text?.length || 0) / 4);
        const detailsTokens = Math.ceil((item.details?.length || 0) / 4);
        const configTokens = item.agent_config ? 50 : 0;
        return sum + textTokens + detailsTokens + configTokens + 20;
    }, 100); // +100 for header/metadata
}
//# sourceMappingURL=chunking.js.map