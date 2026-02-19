import { useState, useCallback } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link01Icon from '@hugeicons/core-free-icons/Link01Icon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import AlertCircleIcon from '@hugeicons/core-free-icons/AlertCircleIcon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import CheckListIcon from '@hugeicons/core-free-icons/CheckListIcon'
import Globe02Icon from '@hugeicons/core-free-icons/Globe02Icon'
import LockKeyIcon from '@hugeicons/core-free-icons/LockKeyIcon'
import { getRepository, getLatestCommit } from '@/services/repository'
import type { Repository, ChecklistItem } from '@/types/database'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

interface RefPreviewPopoverProps {
  repoId: string
  title: string
  executionMode?: 'inline' | 'spawn'
}

interface PreviewData {
  repo: Repository
  items: ChecklistItem[]
}

const MAX_PREVIEW_ITEMS = 6

export function RefPreviewPopover({ repoId, title, executionMode }: RefPreviewPopoverProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PreviewData | null>(null)

  const fetchPreview = useCallback(async () => {
    if (data || loading) return
    setLoading(true)
    setError(null)
    try {
      const [repo, commit] = await Promise.all([
        getRepository(repoId),
        getLatestCommit(repoId),
      ])
      if (!repo) {
        setError('Checklist not found')
        return
      }
      const items: ChecklistItem[] = commit
        ? Object.values(commit.content.items).sort((a, b) => a.order - b.order)
        : []
      setData({ repo, items })
    } catch {
      setError('Failed to load preview')
    } finally {
      setLoading(false)
    }
  }, [repoId, data, loading])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) fetchPreview()
  }

  const rootItems = data?.items.filter(i => !i.parent) ?? []
  const hasMore = rootItems.length > MAX_PREVIEW_ITEMS
  const previewItems = rootItems.slice(0, MAX_PREVIEW_ITEMS)

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'shrink-0 flex items-center justify-center rounded transition-colors',
            'text-blue-500 hover:text-blue-400 hover:bg-blue-500/10',
            'w-5 h-5'
          )}
          aria-label="Preview linked sub-checklist"
        >
          <Icon icon={Link01Icon} className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-80 p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                <Icon icon={Link01Icon} className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {data?.repo.title ?? title}
                </p>
                <p className="text-xs text-muted-foreground">Linked sub-checklist</p>
              </div>
            </div>
            {data && (
              <Icon
                icon={data.repo.is_public ? Globe02Icon : LockKeyIcon}
                className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5"
              />
            )}
          </div>

          {executionMode && (
            <Badge variant="secondary" className="mt-2 text-[10px] h-4 px-1.5">
              {executionMode === 'spawn' ? 'Spawns sub-run' : 'Inline'}
            </Badge>
          )}
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          {loading && (
            <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
              <Icon icon={Loading02Icon} className="h-4 w-4 animate-spin" />
              <span className="text-xs">Loading preview…</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 py-4 text-destructive text-xs">
              <Icon icon={AlertCircleIcon} className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {data && !loading && (
            <>
              {/* Item count */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                <Icon icon={CheckListIcon} className="h-3.5 w-3.5" />
                {rootItems.length} {rootItems.length === 1 ? 'step' : 'steps'}
              </div>

              {/* Steps preview */}
              {previewItems.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-2">
                  No steps yet
                </p>
              ) : (
                <ol className="space-y-1.5">
                  {previewItems.map((item, idx) => (
                    <li key={item.id} className="flex items-start gap-2 text-xs">
                      <span className="text-muted-foreground/60 tabular-nums w-4 shrink-0 text-right mt-px">
                        {idx + 1}.
                      </span>
                      <span className={cn(
                        'flex-1 leading-relaxed',
                        item.text ? 'text-foreground' : 'text-muted-foreground/40 italic'
                      )}>
                        {item.text || 'Empty step'}
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              {hasMore && (
                <p className="text-xs text-muted-foreground mt-2">
                  +{rootItems.length - MAX_PREVIEW_ITEMS} more steps
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {data && (
          <div className="px-4 py-2.5 border-t bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs justify-between text-muted-foreground hover:text-foreground"
              onClick={() => {
                setOpen(false)
                navigate(`/app/repo/${repoId}`)
              }}
            >
              Open in editor
              <Icon icon={ArrowRight01Icon} className="h-3 w-3" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
