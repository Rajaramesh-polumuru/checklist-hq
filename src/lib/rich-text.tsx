import React from 'react'

/**
 * Rich text parsing utilities for basic markdown formatting.
 * Supports:
 * - Bold: **text** or *text* (single asterisk for bold to match common usage)
 * - Italic: _text_ or <em>text</em>
 * - Links: [text](url)
 */

interface TextSegment {
  type: 'text' | 'bold' | 'italic' | 'link' | 'variable'
  content: string
  href?: string
}

/**
 * Parse markdown-style text into segments for rendering.
 * Handles bold (**text** or *text*), italic (_text_), links [text](url), and variables {{ key }}.
 */
export function parseRichText(text: string): TextSegment[] {
  if (!text) return []

  const segments: TextSegment[] = []

  // Combined regex to match all patterns in order of appearance
  // Links: [text](url)
  // Bold: **text** or *text* (non-greedy)
  // Italic: _text_ (non-greedy)
  // HTML em: <em>text</em>
  // Variables: {{ key }}
  const combinedRegex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(<em>([^<]+)<\/em>)|(\{\{\s*([a-zA-Z0-9_.]+)\s*\}\})/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add any plain text before this match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      })
    }

    if (match[1]) {
      // Link: [text](url)
      segments.push({
        type: 'link',
        content: match[2],
        href: match[3],
      })
    } else if (match[4]) {
      // Bold: **text**
      segments.push({
        type: 'bold',
        content: match[5],
      })
    } else if (match[6]) {
      // Bold: *text* (single asterisk also treated as bold for simplicity)
      segments.push({
        type: 'bold',
        content: match[7],
      })
    } else if (match[8]) {
      // Italic: _text_
      segments.push({
        type: 'italic',
        content: match[9],
      })
    } else if (match[10]) {
      // Italic: <em>text</em>
      segments.push({
        type: 'italic',
        content: match[11],
      })
    } else if (match[12]) {
      // Variable: {{ key }}
      segments.push({
        type: 'variable',
        content: match[13], // The key name
      })
    }

    lastIndex = match.index + match[0].length
  }

  // Add any remaining plain text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
    })
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }]
}

/**
 * Check if text contains any rich text formatting markers.
 */
export function hasRichText(text: string): boolean {
  if (!text) return false
  return /(\[.+\]\(.+\))|(\*\*.+\*\*)|(\*.+\*)|(_[^_]+_)|(<em>.+<\/em>)|(\{\{.+\}\})/.test(text)
}

interface FormattedTextProps {
  text: string
  className?: string
  values?: Record<string, unknown>
}

/**
 * Renders text with basic markdown formatting.
 * For use in display contexts (not in input fields).
 */
export function FormattedText({ text, className, values = {} }: FormattedTextProps) {
  const segments = parseRichText(text)

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        switch (segment.type) {
          case 'bold':
            return (
              <strong key={index} className="font-semibold">
                {segment.content}
              </strong>
            )
          case 'italic':
            return (
              <em key={index} className="italic">
                {segment.content}
              </em>
            )
          case 'link':
            return (
              <a
                key={index}
                href={segment.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {segment.content}
              </a>
            )
          case 'variable':
            const key = segment.content
            const val = values[key] ?? values[key.replace('context.', '')]
            const display = val !== undefined ? String(val) : key // Show key if no value
            const hasValue = val !== undefined
            
            return (
              <span 
                key={index} 
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[0.9em] font-medium mx-0.5 align-baseline ${
                  hasValue 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                    : 'bg-muted text-muted-foreground border border-dashed border-muted-foreground/30'
                }`}
                title={hasValue ? `Variable: ${key}` : `Missing value: ${key}`}
              >
                {display}
              </span>
            )
          default:
            return <React.Fragment key={index}>{segment.content}</React.Fragment>
        }
      })}
    </span>
  )
}
