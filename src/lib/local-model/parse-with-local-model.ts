import { v4 as uuidv4 } from 'uuid'
import type { ChecklistContent, ChecklistItem } from '@/types/database'
import type { RawParsedLine } from './types'
import type { ParseDocumentResult } from '@/lib/agent/parse-document'

const ORDER_GAP = 1

/**
 * Convert RawParsedLine[] (from the worker RESULT event) into a valid
 * ChecklistContent structure with proper UUIDs and order values.
 *
 * Called on the main thread after receiving the worker result.
 */
export function buildChecklistFromLines(
  lines: RawParsedLine[],
  modelId: string,
  parseTimeMs: number,
): ParseDocumentResult {
  const items: Record<string, ChecklistItem> = {}
  let orderCounter = 0
  let lastRootId: string | null = null

  for (const line of lines) {
    const id = uuidv4()
    const order = orderCounter * ORDER_GAP
    orderCounter++

    if (line.isHeader) {
      const item: ChecklistItem = {
        id,
        text: line.text,
        parent: null,
        order,
        type: 'header',
      }
      items[id] = item
      lastRootId = id
    } else if (line.indent > 0 && lastRootId) {
      const item: ChecklistItem = {
        id,
        text: line.text,
        parent: lastRootId,
        order,
        type: 'task',
        details: line.details,
      }
      items[id] = item
    } else {
      const item: ChecklistItem = {
        id,
        text: line.text,
        parent: null,
        order,
        type: 'task',
        details: line.details,
      }
      items[id] = item
      lastRootId = id
    }
  }

  // Fallback: ensure at least one item is always present
  if (Object.keys(items).length === 0) {
    const id = uuidv4()
    items[id] = {
      id,
      text: 'Review and complete this step',
      parent: null,
      order: 0,
      type: 'task',
    }
  }

  const content: ChecklistContent = {
    version: '1.0',
    items,
  }

  return {
    content,
    metadata: {
      provider: 'local',
      model: modelId,
      parseTime: parseTimeMs,
    },
  }
}

export type QualityFailReason = 'no-output' | 'too-few-tasks' | 'repetitive-output'

export interface QualityAssessment {
  acceptable: boolean
  itemCount: number
  reason?: QualityFailReason
}

/**
 * Assess whether the local model's output is usable.
 * Still allows the user to proceed — just surfaces a warning.
 */
export function assessLocalParseQuality(content: ChecklistContent): QualityAssessment {
  const items = Object.values(content.items)
  const taskItems = items.filter(i => i.type === 'task')

  if (items.length === 0) {
    return { acceptable: false, itemCount: 0, reason: 'no-output' }
  }
  if (taskItems.length < 2) {
    return { acceptable: false, itemCount: items.length, reason: 'too-few-tasks' }
  }

  // Detect repetitive / looping model output
  const texts = taskItems.map(i => i.text.toLowerCase().trim())
  const uniqueTexts = new Set(texts)
  if (uniqueTexts.size < texts.length * 0.6) {
    return { acceptable: false, itemCount: items.length, reason: 'repetitive-output' }
  }

  return { acceptable: true, itemCount: items.length }
}
