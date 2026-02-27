/**
 * Bidirectional conversion between ChecklistContent and markdown text.
 *
 * Markdown syntax:
 *   # Header item             (type: 'header')
 *   - [ ] Task item           (type: 'task', default)
 *   > Note item               (type: 'note')
 *   [ref: Title](repo-id)     (type: 'ref')
 *
 * Nesting: 2 spaces per depth level prefix
 *   - [ ] Parent task
 *     - [ ] Child task
 *       - [ ] Grandchild task
 *
 * Continuation lines (attached to the preceding item):
 *   <!-- agent: {...} -->        preserves agent_config (JSON)
 *   <!-- ref-config: {...} -->   preserves full ref_config beyond title/repo_id
 *     > Details text             preserves item.details (extra 2-space indent before >)
 */

import { v4 as uuidv4 } from 'uuid'
import type { ChecklistContent, ChecklistItem } from '../types/database'

// ---------------------------------------------------------------------------
// contentToMarkdown
// ---------------------------------------------------------------------------

interface FlatNode {
  item: ChecklistItem
  depth: number
}

function buildFlatTree(items: Record<string, ChecklistItem>): FlatNode[] {
  const result: FlatNode[] = []

  function traverse(parentId: string | null, depth: number) {
    const children = Object.values(items)
      .filter((i) => i.parent === parentId)
      .sort((a, b) => a.order - b.order)

    for (const child of children) {
      result.push({ item: child, depth })
      traverse(child.id, depth + 1)
    }
  }

  traverse(null, 0)
  return result
}

export function contentToMarkdown(content: ChecklistContent): string {
  if (!content?.items || Object.keys(content.items).length === 0) return ''

  const nodes = buildFlatTree(content.items)
  const lines: string[] = []

  for (const { item, depth } of nodes) {
    const indent = '  '.repeat(depth)

    // Main item line
    let mainLine = ''
    if (item.type === 'header') {
      mainLine = `${indent}# ${item.text}`
    } else if (item.type === 'note') {
      mainLine = `${indent}> ${item.text}`
    } else if (item.type === 'ref') {
      const repoId = item.ref_config?.repo_id ?? ''
      const title = item.ref_config?.title ?? item.text
      mainLine = `${indent}[ref: ${title}](${repoId})`
    } else {
      // task (default)
      mainLine = `${indent}- [ ] ${item.text}`
    }
    lines.push(mainLine)

    // Continuation: details (indented 2 extra spaces + > prefix)
    if (item.details?.trim()) {
      lines.push(`${indent}  > ${item.details}`)
    }

    // Continuation: agent_config
    if (item.agent_config) {
      lines.push(`${indent}<!-- agent: ${JSON.stringify(item.agent_config)} -->`)
    }

    // Continuation: full ref_config (when there are extra fields beyond repo_id + title)
    if (item.ref_config) {
      const { execution_mode, commit_id, input_mapping, output_mapping } = item.ref_config
      const hasExtra = execution_mode !== 'inline' || commit_id || input_mapping || output_mapping
      if (hasExtra) {
        lines.push(`${indent}<!-- ref-config: ${JSON.stringify(item.ref_config)} -->`)
      }
    }
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// markdownToContent
// ---------------------------------------------------------------------------

function getLineDepth(line: string): number {
  const indent = line.match(/^( *)/)?.[1] ?? ''
  return Math.floor(indent.length / 2)
}

export function markdownToContent(
  markdown: string,
  existing?: ChecklistContent,
): ChecklistContent {
  const lines = markdown.split('\n')
  const newItems: Record<string, ChecklistItem> = {}

  // Build text→item map for UUID preservation (first occurrence wins per text)
  const existingByText = new Map<string, ChecklistItem>()
  if (existing) {
    for (const item of Object.values(existing.items)) {
      if (!existingByText.has(item.text)) {
        existingByText.set(item.text, item)
      }
    }
  }

  const usedIds = new Set<string>()

  function resolveId(text: string): string {
    const match = existingByText.get(text)
    if (match && !usedIds.has(match.id)) {
      usedIds.add(match.id)
      return match.id
    }
    const id = uuidv4()
    usedIds.add(id)
    return id
  }

  // parentStack[depth] = last item id seen at that depth level
  // items at depth d have parent = parentStack[d-1] (null if d===0)
  const parentStack: Array<string | null> = []

  // Track depth of the last created item for details detection
  let lastItemDepth = 0

  // Order counters per parent id (null = root)
  const orderByParent = new Map<string | null, number>()

  function nextOrder(parentId: string | null): number {
    const cur = orderByParent.get(parentId) ?? 0
    orderByParent.set(parentId, cur + 1)
    return cur * 100
  }

  let lastItemId: string | null = null

  for (const rawLine of lines) {
    // Skip truly empty lines
    if (!rawLine.trim()) continue

    // --- Continuation lines (must come before depth/type detection) ---

    // agent_config continuation
    const agentMatch = rawLine.match(/^(\s*)<!--\s*agent:\s*([\s\S]+?)\s*-->$/)
    if (agentMatch && lastItemId && newItems[lastItemId]) {
      try {
        newItems[lastItemId].agent_config = JSON.parse(agentMatch[2])
      } catch {
        // ignore malformed JSON
      }
      continue
    }

    // ref-config continuation
    const refConfigMatch = rawLine.match(/^(\s*)<!--\s*ref-config:\s*([\s\S]+?)\s*-->$/)
    if (refConfigMatch && lastItemId && newItems[lastItemId]) {
      try {
        newItems[lastItemId].ref_config = JSON.parse(refConfigMatch[2])
      } catch {
        // ignore malformed JSON
      }
      continue
    }

    // details continuation: the last item's indent + "  > " prefix
    if (lastItemId && newItems[lastItemId]) {
      const detailsPrefix = '  '.repeat(lastItemDepth) + '  > '
      if (rawLine.startsWith(detailsPrefix)) {
        newItems[lastItemId].details = rawLine.slice(detailsPrefix.length)
        continue
      }
    }

    // --- Normal item line ---
    const lineDepth = getLineDepth(rawLine)
    const trimmed = rawLine.trim()

    const parentId = lineDepth === 0 ? null : (parentStack[lineDepth - 1] ?? null)

    let itemType: ChecklistItem['type'] = 'task'
    let itemText = trimmed

    if (/^#+\s+/.test(trimmed)) {
      itemType = 'header'
      itemText = trimmed.replace(/^#+\s+/, '')
    } else if (/^\[ref:\s*[^\]]+\]\([^)]*\)/.test(trimmed)) {
      itemType = 'ref'
      const m = trimmed.match(/^\[ref:\s*([^\]]+)\]\(([^)]*)\)/)
      if (m) {
        itemText = m[1].trim()
      }
    } else if (/^-\s+\[[ xX]\]\s+/.test(trimmed)) {
      itemType = 'task'
      itemText = trimmed.replace(/^-\s+\[[ xX]\]\s+/, '')
    } else if (/^-\s+/.test(trimmed)) {
      itemType = 'task'
      itemText = trimmed.replace(/^-\s+/, '')
    } else if (/^>\s+/.test(trimmed)) {
      itemType = 'note'
      itemText = trimmed.replace(/^>\s+/, '')
    }

    if (!itemText.trim()) continue

    const id = resolveId(itemText)
    const order = nextOrder(parentId)

    const item: ChecklistItem = {
      id,
      text: itemText,
      parent: parentId,
      order,
      ...(itemType !== 'task' ? { type: itemType } : {}),
    }

    // Attach basic ref_config for ref items
    if (itemType === 'ref') {
      const m = trimmed.match(/^\[ref:\s*([^\]]+)\]\(([^)]*)\)/)
      if (m) {
        item.ref_config = {
          repo_id: m[2],
          title: m[1].trim(),
          execution_mode: 'inline',
        }
      }
    }

    newItems[id] = item

    // Update parent stack for this depth level
    parentStack[lineDepth] = id
    // Invalidate deeper levels to prevent stale parents when we go back to a shallower depth
    for (let i = lineDepth + 1; i < parentStack.length; i++) {
      parentStack[i] = null
    }

    lastItemId = id
    lastItemDepth = lineDepth
  }

  return {
    version: existing?.version ?? '1.0',
    items: newItems,
  }
}

// ---------------------------------------------------------------------------
// Syntax highlighting helpers (used by MarkdownEditor preview layer)
// ---------------------------------------------------------------------------

export type LineKind =
  | { kind: 'header'; depth: number; marker: string; content: string }
  | { kind: 'task'; depth: number; marker: string; content: string }
  | { kind: 'note'; depth: number; marker: string; content: string }
  | { kind: 'ref'; depth: number; content: string }
  | { kind: 'details'; depth: number; marker: string; content: string }
  | { kind: 'meta'; depth: number; content: string }
  | { kind: 'blank' }
  | { kind: 'text'; depth: number; content: string }

export function classifyLine(rawLine: string): LineKind {
  if (!rawLine.trim()) return { kind: 'blank' }

  const depth = getLineDepth(rawLine)
  const trimmed = rawLine.trim()

  if (/^<!--/.test(trimmed)) return { kind: 'meta', depth, content: trimmed }

  if (/^#+\s/.test(trimmed)) {
    const m = trimmed.match(/^(#+\s)/)
    const marker = m ? m[1] : '# '
    return { kind: 'header', depth, marker, content: trimmed.slice(marker.length) }
  }

  if (/^-\s+\[[ xX]\]\s/.test(trimmed)) {
    const m = trimmed.match(/^(-\s+\[[ xX]\]\s+)/)
    const marker = m ? m[1] : '- [ ] '
    return { kind: 'task', depth, marker, content: trimmed.slice(marker.length) }
  }

  if (/^-\s+/.test(trimmed)) {
    return { kind: 'task', depth, marker: '- ', content: trimmed.slice(2) }
  }

  if (/^\[ref:\s*[^\]]+\]\(/.test(trimmed)) {
    return { kind: 'ref', depth, content: trimmed }
  }

  if (/^>\s+/.test(trimmed)) {
    return { kind: 'note', depth, marker: '> ', content: trimmed.slice(2) }
  }

  return { kind: 'text', depth, content: trimmed }
}
