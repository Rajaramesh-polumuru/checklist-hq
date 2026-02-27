/**
 * MarkdownEditor — Notion-like markdown editing mode for Checklist HQ.
 *
 * Architecture: ghost-layer textarea
 *   - A <div> preview layer beneath renders syntax-highlighted markdown
 *   - A <textarea> on top is transparent (text-transparent, caret visible)
 *   - Both layers share identical font/spacing so the caret aligns with highlights
 *
 * Features:
 *   - Live syntax highlighting (headers, tasks, notes, refs, metadata)
 *   - Smart Enter: continues current block type on new line
 *   - Smart Tab / Shift+Tab: indent / outdent current or selected lines
 *   - Slash command palette: /task, /header, /note
 *   - Debounced sync to Zustand store (marks isDirty for auto-save)
 *   - Unmount flush: pending changes are written to the store immediately
 *   - External content changes (undo, version restore) update the textarea
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useChecklistStore } from '@/stores/checklist-store'
import { contentToMarkdown, markdownToContent, classifyLine } from '@/lib/checklist-markdown'
import { useDebounce } from '@/hooks/useDebounce'
import { Icon } from '@/components/ui/icon'
import AlertCircleIcon from '@hugeicons/core-free-icons/AlertCircleIcon'
import CommandIcon from '@hugeicons/core-free-icons/CommandIcon'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SlashCommand {
  id: string
  label: string
  description: string
  prefix: string
  shortcut: string
}

const SLASH_COMMANDS: SlashCommand[] = [
  { id: 'task',   label: 'Task',   description: 'Checkbox task item',  prefix: '- [ ] ', shortcut: 'T' },
  { id: 'header', label: 'Header', description: 'Section heading',     prefix: '# ',     shortcut: 'H' },
  { id: 'note',   label: 'Note',   description: 'Callout / note',      prefix: '> ',     shortcut: 'N' },
]

// ---------------------------------------------------------------------------
// Syntax highlight preview layer
// ---------------------------------------------------------------------------

function HighlightedLine({ rawLine }: { rawLine: string }) {
  const kind = classifyLine(rawLine)
  const indent = rawLine.match(/^( *)/)?.[1] ?? ''

  if (kind.kind === 'blank') return <span>&nbsp;</span>

  if (kind.kind === 'header') {
    return (
      <span>
        <span className="opacity-30">{indent}</span>
        <span className="text-violet-500 dark:text-violet-400 opacity-60">{kind.marker}</span>
        <span className="text-foreground font-semibold">{kind.content}</span>
      </span>
    )
  }

  if (kind.kind === 'task') {
    return (
      <span>
        <span className="opacity-30">{indent}</span>
        <span className="text-muted-foreground/50">{kind.marker}</span>
        <span className="text-foreground">{kind.content}</span>
      </span>
    )
  }

  if (kind.kind === 'note') {
    return (
      <span>
        <span className="opacity-30">{indent}</span>
        <span className="text-sky-500 dark:text-sky-400 opacity-60">{kind.marker}</span>
        <span className="text-muted-foreground italic">{kind.content}</span>
      </span>
    )
  }

  if (kind.kind === 'ref') {
    return (
      <span>
        <span className="opacity-30">{indent}</span>
        <span className="text-primary/70">{kind.content}</span>
      </span>
    )
  }

  if (kind.kind === 'meta') {
    return (
      <span>
        <span className="text-muted-foreground/30">{rawLine}</span>
      </span>
    )
  }

  // 'text' or 'details'
  return (
    <span>
      <span className="opacity-30">{indent}</span>
      <span className="text-foreground">{kind.kind === 'text' ? kind.content : rawLine.trim()}</span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// Slash command menu
// ---------------------------------------------------------------------------

interface SlashMenuProps {
  query: string
  position: { top: number; left: number }
  onSelect: (cmd: SlashCommand) => void
  activeIndex: number
}

function SlashMenu({ query, position, onSelect, activeIndex }: SlashMenuProps) {
  const filtered = SLASH_COMMANDS.filter(
    (c) =>
      c.id.startsWith(query.toLowerCase()) ||
      c.label.toLowerCase().startsWith(query.toLowerCase()),
  )

  if (filtered.length === 0) return null

  return (
    <div
      className="fixed z-50 bg-popover border border-border rounded-xl shadow-lg py-1.5 min-w-[200px] animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2"
      style={{ top: position.top, left: position.left }}
    >
      <p className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        Insert block
      </p>
      {filtered.map((cmd, i) => (
        <button
          key={cmd.id}
          className={cn(
            'w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-accent transition-colors',
            i === activeIndex && 'bg-accent',
          )}
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect(cmd)
          }}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground shrink-0">
            {cmd.shortcut}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-medium text-foreground">{cmd.label}</span>
            <span className="block text-xs text-muted-foreground">{cmd.description}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main MarkdownEditor component
// ---------------------------------------------------------------------------

export function MarkdownEditor({ loading = false }: { loading?: boolean }) {
  const { content, setContentFromMarkdown } = useChecklistStore()

  // Local markdown state — initialised from store content
  const [localMarkdown, setLocalMarkdown] = useState(() => contentToMarkdown(content))

  // Ref to always have the latest markdown for the unmount flush
  const localMarkdownRef = useRef(localMarkdown)
  useEffect(() => {
    localMarkdownRef.current = localMarkdown
  }, [localMarkdown])

  // Whether the user is actively typing (prevents external store changes from overwriting)
  const isEditing = useRef(false)

  // Debounced sync to store
  const debouncedMarkdown = useDebounce(localMarkdown, 400)

  useEffect(() => {
    const newContent = markdownToContent(debouncedMarkdown, content)
    setContentFromMarkdown(newContent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMarkdown])

  // Sync FROM store when content changes externally (undo/redo, version restore).
  // Intentionally only re-runs when content changes, not on isEditing changes.
  useEffect(() => {
    if (!isEditing.current) {
      setLocalMarkdown(contentToMarkdown(content))
    }
  }, [content])

  // On unmount, immediately flush pending markdown to store (handles mode switch)
  const setContentFromMarkdownRef = useRef(setContentFromMarkdown)
  useEffect(() => {
    setContentFromMarkdownRef.current = setContentFromMarkdown
  }, [setContentFromMarkdown])

  const contentRef = useRef(content)
  useEffect(() => {
    contentRef.current = content
  }, [content])

  useEffect(() => {
    return () => {
      const latest = localMarkdownRef.current
      const newContent = markdownToContent(latest, contentRef.current)
      setContentFromMarkdownRef.current(newContent)
    }
  }, [])

  // Textarea ref for DOM operations
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea height
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = ta.scrollHeight + 'px'
  }, [localMarkdown])

  // ---------------------------------------------------------------------------
  // Slash command state
  // ---------------------------------------------------------------------------

  const [slashMenu, setSlashMenu] = useState<{
    query: string
    position: { top: number; left: number }
    lineStart: number
    activeIndex: number
  } | null>(null)

  const closeSlashMenu = useCallback(() => setSlashMenu(null), [])

  // ---------------------------------------------------------------------------
  // Check if any item has agent_config (show warning banner)
  // ---------------------------------------------------------------------------
  const hasAgentConfig = Object.values(content.items).some((i) => i.agent_config)

  // ---------------------------------------------------------------------------
  // Helpers: get current line info from cursor position
  // ---------------------------------------------------------------------------

  function getLineInfo(ta: HTMLTextAreaElement) {
    const { selectionStart, value } = ta
    const before = value.slice(0, selectionStart)
    const lineStart = before.lastIndexOf('\n') + 1
    const lineEnd = value.indexOf('\n', selectionStart)
    const lineEndPos = lineEnd === -1 ? value.length : lineEnd
    const line = value.slice(lineStart, lineEndPos)
    return { lineStart, lineEnd: lineEndPos, line, cursorPos: selectionStart }
  }

  // ---------------------------------------------------------------------------
  // Smart keyboard handling
  // ---------------------------------------------------------------------------

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const ta = e.currentTarget

      // ⌘S / Ctrl+S — save (let Editor.tsx handle via global shortcut)
      // We don't preventDefault so the global handler still fires

      // Escape — close slash menu
      if (e.key === 'Escape' && slashMenu) {
        e.preventDefault()
        closeSlashMenu()
        return
      }

      // Slash menu navigation
      if (slashMenu) {
        const filtered = SLASH_COMMANDS.filter(
          (c) =>
            c.id.startsWith(slashMenu.query.toLowerCase()) ||
            c.label.toLowerCase().startsWith(slashMenu.query.toLowerCase()),
        )

        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSlashMenu((m) =>
            m ? { ...m, activeIndex: (m.activeIndex + 1) % filtered.length } : m,
          )
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSlashMenu((m) =>
            m
              ? { ...m, activeIndex: (m.activeIndex - 1 + filtered.length) % filtered.length }
              : m,
          )
          return
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault()
          const chosen = filtered[slashMenu.activeIndex]
          if (chosen) insertSlashCommand(ta, chosen, slashMenu.lineStart)
          closeSlashMenu()
          return
        }
      }

      // Tab — indent / outdent selected lines
      if (e.key === 'Tab') {
        e.preventDefault()
        closeSlashMenu()

        const { selectionStart, selectionEnd, value } = ta
        const start = selectionStart
        const end = selectionEnd

        // Find the start of the first selected line
        const firstLineStart = value.lastIndexOf('\n', start - 1) + 1
        // Find end of last selected line
        const lastLineEnd = value.indexOf('\n', end)
        const rangeEnd = lastLineEnd === -1 ? value.length : lastLineEnd

        const selectedText = value.slice(firstLineStart, rangeEnd)
        let modified: string

        if (e.shiftKey) {
          // Outdent: remove up to 2 leading spaces from each line
          modified = selectedText
            .split('\n')
            .map((l) => l.replace(/^ {1,2}/, ''))
            .join('\n')
        } else {
          // Indent: add 2 spaces to start of each line
          modified = selectedText
            .split('\n')
            .map((l) => '  ' + l)
            .join('\n')
        }

        const newValue =
          value.slice(0, firstLineStart) + modified + value.slice(rangeEnd)

        setLocalMarkdown(newValue)

        // Restore selection, adjusted for the indent delta
        const delta = modified.length - selectedText.length
        requestAnimationFrame(() => {
          if (!textareaRef.current) return
          textareaRef.current.selectionStart = Math.max(firstLineStart, start + (e.shiftKey ? Math.min(0, delta) : 2))
          textareaRef.current.selectionEnd = end + delta
        })
        return
      }

      // Enter — smart continue
      if (e.key === 'Enter' && !e.shiftKey) {
        const { lineStart, line, cursorPos } = getLineInfo(ta)

        // Detect current line prefix
        let prefix = ''
        if (/^(\s*)- \[ \] /.test(line)) {
          const m = line.match(/^(\s*- \[ \] )/)
          prefix = m ? m[1] : ''
        } else if (/^(\s*)> /.test(line)) {
          const m = line.match(/^(\s*> )/)
          prefix = m ? m[1] : ''
        }

        if (!prefix) {
          // Default Enter behaviour
          return
        }

        // If the line only has the prefix (empty item), clear the prefix instead
        const indent = line.match(/^(\s*)/)?.[1] ?? ''
        const contentAfterPrefix = line.slice(prefix.length)

        if (!contentAfterPrefix.trim()) {
          // Remove the prefix, leave blank line
          e.preventDefault()
          const { value } = ta
          const lineEnd = value.indexOf('\n', cursorPos)
          const lineEndPos = lineEnd === -1 ? value.length : lineEnd
          const newValue =
            value.slice(0, lineStart) + indent + value.slice(lineEndPos)
          setLocalMarkdown(newValue)
          requestAnimationFrame(() => {
            if (!textareaRef.current) return
            textareaRef.current.selectionStart = lineStart + indent.length
            textareaRef.current.selectionEnd = lineStart + indent.length
          })
          return
        }

        // Insert a new line with the same prefix after the cursor
        e.preventDefault()
        const { value } = ta
        const insertion = '\n' + prefix
        const newValue =
          value.slice(0, cursorPos) + insertion + value.slice(cursorPos)
        setLocalMarkdown(newValue)
        requestAnimationFrame(() => {
          if (!textareaRef.current) return
          const newPos = cursorPos + insertion.length
          textareaRef.current.selectionStart = newPos
          textareaRef.current.selectionEnd = newPos
        })
        return
      }
    },
    [slashMenu, closeSlashMenu],
  )

  // ---------------------------------------------------------------------------
  // onChange — update local markdown + detect slash command
  // ---------------------------------------------------------------------------

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      setLocalMarkdown(newValue)

      const ta = e.target
      const { selectionStart, value } = ta
      const before = value.slice(0, selectionStart)
      const lineStart = before.lastIndexOf('\n') + 1
      const currentLine = value.slice(lineStart, selectionStart)

      // Detect "/" at the start of a line (or after just whitespace)
      const slashMatch = currentLine.match(/^(\s*)\/(\w*)$/)
      if (slashMatch) {
        const query = slashMatch[2]
        // Calculate menu position below the current line using a canvas trick
        // Fall back to a rough estimate based on textarea bounds
        const ta_rect = ta.getBoundingClientRect()
        const lineIndex = before.split('\n').length - 1
        const lineHeight = 24 // px, matches leading-relaxed on text-sm with font-mono
        const approxTop = ta_rect.top + (lineIndex + 1) * lineHeight - ta.scrollTop + 4
        const approxLeft = ta_rect.left + slashMatch[1].length * 9 // mono char width estimate

        setSlashMenu({
          query,
          position: { top: Math.min(approxTop, window.innerHeight - 200), left: Math.min(approxLeft, window.innerWidth - 220) },
          lineStart,
          activeIndex: 0,
        })
      } else {
        if (slashMenu) closeSlashMenu()
      }
    },
    [slashMenu, closeSlashMenu],
  )

  // ---------------------------------------------------------------------------
  // Slash command insertion
  // ---------------------------------------------------------------------------

  function insertSlashCommand(
    ta: HTMLTextAreaElement,
    cmd: SlashCommand,
    lineStart: number,
  ) {
    const { value } = ta
    const lineEnd = value.indexOf('\n', lineStart)
    const lineEndPos = lineEnd === -1 ? value.length : lineEnd
    const currentLine = value.slice(lineStart, lineEndPos)
    const indent = currentLine.match(/^(\s*)/)?.[1] ?? ''

    // Replace current line (from "/" onward) with the command prefix
    const newLine = indent + cmd.prefix
    const newValue = value.slice(0, lineStart) + newLine + value.slice(lineEndPos)

    setLocalMarkdown(newValue)

    requestAnimationFrame(() => {
      if (!textareaRef.current) return
      const newPos = lineStart + newLine.length
      textareaRef.current.selectionStart = newPos
      textareaRef.current.selectionEnd = newPos
      textareaRef.current.focus()
    })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse px-1">
        {[80, 65, 90, 55, 75].map((w, i) => (
          <div key={i} className="h-5 rounded-md bg-muted" style={{ width: `${w}%` }} />
        ))}
      </div>
    )
  }

  const lines = localMarkdown.split('\n')

  return (
    <div className="flex flex-col gap-0">
      {/* Agent config warning banner */}
      {hasAgentConfig && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 mb-3 text-xs text-amber-700 dark:text-amber-400">
          <Icon icon={AlertCircleIcon} className="size-3.5 shrink-0" />
          <span>
            Agent configs are preserved as{' '}
            <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">{'<!-- agent: … -->'}</code>{' '}
            comments but not editable here. Switch to Visual mode to manage them.
          </span>
        </div>
      )}

      {/* Hint bar */}
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
          <Icon icon={CommandIcon} className="size-3" />
          <span>Type <kbd className="font-mono bg-muted px-1 rounded text-[10px]">/</kbd> for commands · <kbd className="font-mono bg-muted px-1 rounded text-[10px]">Tab</kbd> to indent · <kbd className="font-mono bg-muted px-1 rounded text-[10px]">Shift+Tab</kbd> to outdent</span>
        </p>
        <span className="text-[10px] text-muted-foreground/50 tabular-nums">
          {Object.keys(content.items).length} items
        </span>
      </div>

      {/* Ghost-layer editor */}
      <div
        className={cn(
          'relative rounded-xl border border-border bg-card overflow-hidden',
          'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 transition-all duration-150',
        )}
      >
        {/* Preview / highlight layer (aria-hidden, pointer-events-none) */}
        <div
          aria-hidden
          className={cn(
            'absolute inset-0 pointer-events-none select-none overflow-hidden',
            'font-mono text-sm leading-relaxed px-4 py-3 whitespace-pre-wrap break-words',
          )}
        >
          {lines.map((line, i) => (
            <div key={i} className="min-h-[1.625rem]">
              <HighlightedLine rawLine={line} />
            </div>
          ))}
          {/* Extra padding at bottom so textarea scrolls past the last line */}
          <div className="h-32" />
        </div>

        {/* Transparent textarea (receives input, shows only the caret) */}
        <textarea
          ref={textareaRef}
          value={localMarkdown}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { isEditing.current = true }}
          onBlur={() => { isEditing.current = false }}
          spellCheck={false}
          aria-label="Markdown editor"
          aria-multiline="true"
          className={cn(
            'relative w-full bg-transparent resize-none outline-none',
            'text-transparent caret-foreground',
            'font-mono text-sm leading-relaxed px-4 py-3',
            'whitespace-pre-wrap break-words',
            'min-h-[320px]',
          )}
          placeholder=""
          style={{ caretColor: 'hsl(var(--foreground))' }}
        />
      </div>

      {/* Slash command menu */}
      {slashMenu && (
        <SlashMenu
          query={slashMenu.query}
          position={slashMenu.position}
          onSelect={(cmd) => {
            if (textareaRef.current) {
              insertSlashCommand(textareaRef.current, cmd, slashMenu.lineStart)
            }
            closeSlashMenu()
          }}
          activeIndex={slashMenu.activeIndex}
        />
      )}
    </div>
  )
}
