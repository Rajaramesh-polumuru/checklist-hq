import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface KeyboardShortcutsProps {
  open: boolean
  onClose: () => void
}

interface Shortcut {
  keys: string[]
  description: string
  context?: string
}

const shortcuts: Shortcut[] = [
  // Editor shortcuts
  { keys: ['Enter'], description: 'Add new item below current item', context: 'Editor' },
  { keys: ['Tab'], description: 'Indent current item', context: 'Editor' },
  { keys: ['Shift', 'Tab'], description: 'Outdent current item', context: 'Editor' },
  { keys: ['Backspace'], description: 'Delete empty item (when empty)', context: 'Editor' },
  { keys: ['↑'], description: 'Navigate to previous item', context: 'Editor' },
  { keys: ['↓'], description: 'Navigate to next item', context: 'Editor' },

  // Global shortcuts
  { keys: ['⌘/Ctrl', 'K'], description: 'Focus search', context: 'Global' },
  { keys: ['⌘/Ctrl', 'S'], description: 'Save checklist', context: 'Global' },
  { keys: ['Esc'], description: 'Close modal/dialog', context: 'Global' },
  { keys: ['?'], description: 'Show keyboard shortcuts', context: 'Global' },

  // Navigation
  { keys: ['Tab'], description: 'Navigate forward', context: 'Navigation' },
  { keys: ['Shift', 'Tab'], description: 'Navigate backward', context: 'Navigation' },
]

/**
 * Keyboard shortcuts help modal
 *
 * Features:
 * - Organized by context (Editor, Global, Navigation)
 * - Platform-aware (shows ⌘ on Mac, Ctrl on Windows)
 * - Accessible with proper ARIA attributes
 * - Keyboard dismissible with Escape
 *
 * @example
 * const [showHelp, setShowHelp] = useState(false)
 *
 * <KeyboardShortcuts
 *   open={showHelp}
 *   onClose={() => setShowHelp(false)}
 * />
 */
export function KeyboardShortcuts({ open, onClose }: KeyboardShortcutsProps) {
  // Group shortcuts by context
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const context = shortcut.context || 'Other'
    if (!acc[context]) {
      acc[context] = []
    }
    acc[context].push(shortcut)
    return acc
  }, {} as Record<string, Shortcut[]>)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and edit more efficiently
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {Object.entries(groupedShortcuts).map(([context, contextShortcuts]) => (
            <div key={context}>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                {context === 'Editor' && <span className="w-1 h-4 bg-primary rounded" />}
                {context === 'Global' && <span className="w-1 h-4 bg-success rounded" />}
                {context === 'Navigation' && <span className="w-1 h-4 bg-info rounded" />}
                {context}
              </h3>
              <div className="space-y-2">
                {contextShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground flex-1">
                      {shortcut.description}
                    </span>
                    <div className="flex gap-1 items-center">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <kbd
                            className={
                              'px-2 py-1 text-xs font-semibold bg-muted border border-border rounded shadow-sm ' +
                              'min-w-[28px] text-center'
                            }
                          >
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-xs text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded">?</kbd> anytime to show this help
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
