import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import AiCloud02Icon from '@hugeicons/core-free-icons/AiCloud02Icon'
import UserIcon from '@hugeicons/core-free-icons/UserIcon'
import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import { cn } from '@/lib/utils'
import type { ChecklistItem, ItemProgress } from '@/types/database'

interface HybridRunProgressProps {
  items: Record<string, ChecklistItem>
  progress: Record<string, ItemProgress>
  className?: string
}

interface ItemWithProgress {
  item: ChecklistItem
  progress?: ItemProgress
}

export function HybridRunProgress({ items, progress, className }: HybridRunProgressProps) {
  // Flatten and sort items by order
  const itemsArray: ItemWithProgress[] = Object.entries(items)
    .map(([id, item]) => ({
      item: { ...item, id },
      progress: progress[id],
    }))
    .sort((a, b) => a.item.order - b.item.order)

  const stats = {
    total: itemsArray.length,
    completed: itemsArray.filter(i => i.progress?.completed).length,
    completedByHuman: itemsArray.filter(
      i => i.progress?.completed && i.progress.completed_by_type === 'human'
    ).length,
    completedByAgent: itemsArray.filter(
      i => i.progress?.completed && i.progress.completed_by_type === 'agent'
    ).length,
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.completed}/{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Icon icon={UserIcon} className="h-5 w-5 text-info" />
            <div>
              <div className="text-2xl font-bold">{stats.completedByHuman}</div>
              <div className="text-xs text-muted-foreground">By Human</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Icon icon={AiCloud02Icon} className="h-5 w-5 text-purple-500 dark:text-purple-400" />
            <div>
              <div className="text-2xl font-bold">{stats.completedByAgent}</div>
              <div className="text-xs text-muted-foreground">By Agent</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">Progress</div>
          </CardContent>
        </Card>
      </div>

      {/* Items List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {itemsArray.map(({ item, progress: itemProgress }) => {
              const isCompleted = itemProgress?.completed
              const completedByAgent = itemProgress?.completed_by_type === 'agent'
              const isAssignedToAgent = item.agent_config?.assignee && item.agent_config.assignee !== 'human'

              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors',
                    isCompleted && 'opacity-75'
                  )}
                >
                  {/* Status Icon */}
                  <div className="shrink-0">
                    {isCompleted ? (
                      <Icon
                        icon={CheckmarkCircle01Icon}
                        className="h-5 w-5 text-success"
                      />
                    ) : isAssignedToAgent ? (
                      <Icon
                        icon={Loading02Icon}
                        className="h-5 w-5 text-muted-foreground animate-spin"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    )}
                  </div>

                  {/* Item Text */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        'text-sm font-medium',
                        isCompleted && 'line-through text-muted-foreground'
                      )}
                    >
                      {item.text}
                    </div>
                    {item.details && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {item.details}
                      </div>
                    )}
                    {itemProgress?.note && (
                      <div className="text-xs text-muted-foreground mt-1 italic">
                        Note: {itemProgress.note}
                      </div>
                    )}
                  </div>

                  {/* Assignment & Completion Badges */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isAssignedToAgent && (
                      <Badge variant="outline" className="text-xs">
                        <Icon icon={AiCloud02Icon} className="h-3 w-3 mr-1" />
                        Agent Task
                      </Badge>
                    )}
                    {isCompleted && completedByAgent && (
                      <Badge className="text-xs bg-purple-500/10 text-purple-600 border border-purple-500/20 dark:bg-purple-400/10 dark:text-purple-400 dark:border-purple-400/20">
                        <Icon icon={AiCloud02Icon} className="h-3 w-3 mr-1" />
                        Agent
                      </Badge>
                    )}
                    {isCompleted && !completedByAgent && (
                      <Badge className="text-xs bg-info/10 text-info border border-info/20">
                        <Icon icon={UserIcon} className="h-3 w-3 mr-1" />
                        Human
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Agent Output Section (if any) */}
      {itemsArray.some(i => i.progress?.agent_output) && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Icon icon={AiCloud02Icon} className="h-4 w-4" />
              Agent Output
            </h3>
            <div className="space-y-2">
              {itemsArray
                .filter(i => i.progress?.agent_output)
                .map(({ item, progress: itemProgress }) => (
                  <div
                    key={item.id}
                    className="text-xs p-3 rounded-lg bg-muted font-mono"
                  >
                    <div className="font-semibold mb-1">{item.text}</div>
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(itemProgress!.agent_output, null, 2)}
                    </pre>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
