/**
 * Parse Document Utility
 * Converts raw text (SOPs, documents, notes) into structured checklist JSON
 */

import { v4 as uuidv4 } from 'uuid';
import type { ChecklistContent, ChecklistItem } from '@/types/database';

export interface ParseDocumentOptions {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
  text: string;
  title?: string;
  description?: string;
}

export interface ParseDocumentResult {
  content: ChecklistContent;
  metadata: {
    provider: string;
    model: string;
    tokensUsed?: number;
    parseTime: number;
  };
}

/**
 * Parse a document into structured checklist content
 */
export async function parseDocument(
  options: ParseDocumentOptions
): Promise<ParseDocumentResult> {
  const startTime = Date.now();

  // Construct prompt
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(options.text, options.title, options.description);

  // Call LLM
  const response = await callLLM({
    provider: options.provider,
    model: options.model,
    apiKey: options.apiKey,
    systemPrompt,
    userPrompt,
  });

  // Parse response
  const content = parseResponse(response.content);

  return {
    content,
    metadata: {
      provider: options.provider,
      model: options.model,
      tokensUsed: response.usage?.total_tokens,
      parseTime: Date.now() - startTime,
    },
  };
}

/**
 * Build system prompt for document parsing
 */
function buildSystemPrompt(): string {
  return `You are an expert at analyzing documents and converting them into structured checklists.

Your task is to convert the provided text into a hierarchical checklist JSON structure.

RULES:
1. Extract all action items, steps, and tasks
2. Organize into a logical hierarchy (use headers for sections)
3. Preserve the original order when possible
4. Each item should have:
   - id: A unique UUID
   - text: The main task/step description (concise, actionable)
   - parent: null for root items, or parent item's UUID
   - order: Sequential number within the same parent
   - type: "task" for action items, "header" for section titles, "note" for informational items
   - details: Optional longer explanation or context

IMPORTANT: 
- Use "task" for actionable steps that can be checked off
- Use "header" for section titles or grouping labels
- Use "note" for important information that isn't an action
- Keep text concise (1-2 sentences max)
- Put additional context in "details" field

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact structure:
{
  "version": "1.0.0",
  "items": {
    "uuid-1": {
      "id": "uuid-1",
      "text": "Item text",
      "parent": null,
      "order": 0,
      "type": "task",
      "details": "Optional details"
    },
    ...
  }
}

Do not include any markdown, explanations, or commentary. Only the raw JSON object.`;
}

/**
 * Build user prompt with the document text
 */
function buildUserPrompt(text: string, title?: string, description?: string): string {
  let prompt = 'Convert the following document into a structured checklist:\n\n';
  
  if (title) {
    prompt += `Title: ${title}\n\n`;
  }
  
  if (description) {
    prompt += `Description: ${description}\n\n`;
  }
  
  prompt += `Document:\n${text}`;
  
  return prompt;
}

/**
 * Call LLM API
 */
async function callLLM({
  provider,
  model,
  apiKey,
  systemPrompt,
  userPrompt,
}: {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<{ content: string; usage?: { total_tokens?: number } }> {
  if (provider === 'openai') {
    return callOpenAI({ model, apiKey, systemPrompt, userPrompt });
  } else {
    return callAnthropic({ model, apiKey, systemPrompt, userPrompt });
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI({
  model,
  apiKey,
  systemPrompt,
  userPrompt,
}: {
  model: string;
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<{ content: string; usage?: { total_tokens?: number } }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temp for more consistent structure
      response_format: { type: 'json_object' }, // Force JSON output
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || '',
    usage: data.usage,
  };
}

/**
 * Call Anthropic API
 */
async function callAnthropic({
  model,
  apiKey,
  systemPrompt,
  userPrompt,
}: {
  model: string;
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<{ content: string; usage?: { total_tokens?: number } }> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192, // Large context for complex documents
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Anthropic API error');
  }

  const data = await response.json();
  return {
    content: data.content[0]?.text || '',
    usage: data.usage,
  };
}

/**
 * Parse LLM response into ChecklistContent
 */
function parseResponse(content: string): ChecklistContent {
  try {
    // Clean up response (remove markdown code blocks if present)
    let cleaned = content.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // Parse JSON
    const parsed = JSON.parse(cleaned);

    // Validate structure
    if (!parsed.version || !parsed.items) {
      throw new Error('Invalid checklist structure');
    }

    // Ensure all items have UUIDs
    const items: Record<string, ChecklistItem> = {};
    for (const [, item] of Object.entries(parsed.items)) {
      const typedItem = item as Partial<ChecklistItem>;
      
      // Generate UUID if missing or invalid
      const id = typedItem.id && isValidUUID(typedItem.id) ? typedItem.id : uuidv4();
      
      items[id] = {
        id,
        text: typedItem.text || 'Untitled',
        parent: typedItem.parent || null,
        order: typedItem.order ?? 0,
        type: typedItem.type || 'task',
        details: typedItem.details,
      };
    }

    return {
      version: parsed.version,
      items,
    };
  } catch (error) {
    console.error('Failed to parse LLM response:', content);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to parse checklist structure'
    );
  }
}

/**
 * Validate UUID format (simple check)
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Preview helper: Convert ChecklistContent to readable text
 */
export function generatePreview(content: ChecklistContent): string {
  const items = Object.values(content.items);
  const rootItems = items.filter((item) => !item.parent).sort((a, b) => a.order - b.order);

  const lines: string[] = [];

  function renderItem(item: ChecklistItem, depth: number = 0) {
    const indent = '  '.repeat(depth);
    const icon = item.type === 'header' ? '📁' : item.type === 'note' ? '📝' : '☑️';
    lines.push(`${indent}${icon} ${item.text}`);
    
    if (item.details) {
      lines.push(`${indent}   → ${item.details}`);
    }

    // Render children
    const children = items
      .filter((child) => child.parent === item.id)
      .sort((a, b) => a.order - b.order);
    
    children.forEach((child) => renderItem(child, depth + 1));
  }

  rootItems.forEach((item) => renderItem(item));

  return lines.join('\n');
}
