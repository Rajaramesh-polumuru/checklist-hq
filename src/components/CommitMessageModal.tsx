import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import GitCommitIcon from '@hugeicons/core-free-icons/GitCommitIcon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

interface CommitMessageModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (message: string) => Promise<void>
  defaultMessage?: string
}

export function CommitMessageModal({
  isOpen,
  onClose,
  onSave,
  defaultMessage = '',
}: CommitMessageModalProps) {
  const [message, setMessage] = useState(defaultMessage)
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessage(defaultMessage)
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen, defaultMessage])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(message.trim() || 'Manual save')
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon={GitCommitIcon} className="h-5 w-5 text-primary" />
            Save Changes
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <label
            htmlFor="commit-message"
            className="text-sm font-medium text-muted-foreground mb-2 block"
          >
            Commit message (optional)
          </label>
          <textarea
            ref={textareaRef}
            id="commit-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your changes..."
            disabled={saving}
            className={cn(
              "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "ring-offset-background placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "min-h-[80px] resize-none"
            )}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">⌘</kbd>
            <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono ml-0.5">Enter</kbd> to save
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Icon icon={Loading02Icon} className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
