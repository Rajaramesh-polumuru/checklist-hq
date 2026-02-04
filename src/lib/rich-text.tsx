import React from 'react'

/**
 * Rich text parsing utilities for basic markdown formatting.
 * Supports:
 * - Bold: **text** or *text* (single asterisk for bold to match common usage)
 * - Italic: _text_ or <em>text</em>
 * - Links: [text](url)
 */

interface TextSegment {
  type: 'text' | 'bold' | 'italic' | 'link'
  content: string
  href?: string
}

/**
 * Parse markdown-style text into segments for rendering.
 * Handles bold (**text** or *text*), italic (_text_), and links [text](url).
 */
export function parseRichText(text: string): TextSegment[] {
  if (!text) return []

  const segments: TextSegment[] = []

  // Combined regex to match all patterns in order of appearance
  // Links: [text](url)
  // Bold: **text** or *text* (non-greedy)
  // Italic: _text_ (non-greedy)
  // HTML em: <em>text</em>
  const combinedRegex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(<em>([^<]+)<\/em>)/g

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
  return /(\[.+\]\(.+\))|(\*\*.+\*\*)|(\*.+\*)|(_[^_]+_)|(<em>.+<\/em>)/.test(text)
}

interface FormattedTextProps {
  text: string
  className?: string
}

/**
 * Renders text with basic markdown formatting.
 * For use in display contexts (not in input fields).
 */
export function FormattedText({ text, className }: FormattedTextProps) {
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
          default:
            return <React.Fragment key={index}>{segment.content}</React.Fragment>
        }
      })}
    </span>
  )
}
