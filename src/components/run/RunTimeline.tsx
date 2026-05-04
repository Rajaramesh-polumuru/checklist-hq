import { useMemo, useState } from 'react';
import UserIcon from '@hugeicons/core-free-icons/UserIcon'
import AiCloud02Icon from '@hugeicons/core-free-icons/AiCloud02Icon'
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon'
import File01Icon from '@hugeicons/core-free-icons/File01Icon'
import Search01Icon from '@hugeicons/core-free-icons/Search01Icon'
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Run, ChecklistItem, ItemProgress } from '@/types/database';
import { AgentOutputViewer } from './AgentOutputViewer';

interface RunTimelineProps {
  run: Run;
  items: Record<string, ChecklistItem>;
  className?: string;
}

interface TimelineEvent {
  itemId: string;
  itemText: string;
  timestamp: Date;
  completedBy: string;
  completedByType: 'human' | 'agent';
  completedByName?: string;
  durationMs?: number;
  note?: string;
  agentOutput?: Record<string, unknown>;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  progress: ItemProgress; // Full progress object for viewer
}

export function RunTimeline({ run, items, className }: RunTimelineProps) {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  // Transform run progress into sorted timeline events
  const events = useMemo(() => {
    if (!run.progress) return [];

    return Object.entries(run.progress)
      .filter(([_, progress]) => progress.completed && progress.timestamp)
      .map(([itemId, progress]) => {
        const item = items[itemId];
        return {
          itemId,
          itemText: item ? item.text : 'Unknown Item',
          timestamp: new Date(progress.timestamp!),
          completedBy: progress.completed_by || progress.user_id || 'Unknown',
          completedByType: progress.completed_by_type || 'human',
          completedByName: progress.completed_by_name,
          durationMs: progress.duration_ms,
          note: progress.note,
          agentOutput: progress.agent_output,
          verificationStatus: progress.verification_status,
          progress: progress,
        };
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Newest first
  }, [run.progress, items]);

  if (events.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <Icon icon={Clock01Icon} className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Icon icon={Clock01Icon} className="h-5 w-5 text-primary" />
        Activity Timeline
      </h3>
      
      <div className="h-[400px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        <div className="space-y-6 relative ml-2">
          {/* Vertical Line */}
          <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-border/50" />

          {events.map((event, index) => (
            <div key={`${event.itemId}-${index}`} className="relative pl-8 group">
              {/* Dot Icon */}
              <div className={cn(
                "absolute left-0 top-1 h-5 w-5 rounded-full border-2 flex items-center justify-center bg-background z-10 transition-colors",
                event.completedByType === 'agent'
                  ? "border-purple-500 text-purple-500 dark:border-purple-400 dark:text-purple-400"
                  : "border-primary text-primary"
              )}>
                {event.completedByType === 'agent' ? (
                  <Icon icon={AiCloud02Icon} className="h-3 w-3" />
                ) : (
                  <Icon icon={UserIcon} className="h-3 w-3" />
                )}
              </div>

              {/* Content Card */}
              <div className={cn(
                "rounded-lg border p-3 text-sm transition-all hover:shadow-sm group/card relative",
                event.completedByType === 'agent'
                  ? "bg-purple-500/5 border-purple-500/30 dark:bg-purple-400/10 dark:border-purple-400/30"
                  : "bg-card border-border"
              )}>
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="font-medium text-foreground">
                    {event.itemText}
                  </span>
                  <time className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {new Intl.DateTimeFormat('default', { hour: '2-digit', minute: '2-digit' }).format(event.timestamp)}
                  </time>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span className={cn(
                    "flex items-center gap-1 font-medium",
                    event.completedByType === 'agent'
                      ? "text-purple-600 dark:text-purple-400"
                      : "text-foreground"
                  )}>
                    {event.completedByName || (event.completedByType === 'agent' ? 'AI Agent' : 'User')}
                  </span>
                  <span>•</span>
                  <span>Completed</span>
                  
                  {event.durationMs && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">
                        {(event.durationMs / 1000).toFixed(1)}s
                      </Badge>
                    </>
                  )}
                </div>

                {/* Agent Output / Notes */}
                {(event.note || event.agentOutput) && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    {event.note && (
                      <p className="text-muted-foreground italic mb-1">"{event.note}"</p>
                    )}
                    
                    {event.agentOutput && (
                      <div className="bg-muted/50 rounded p-2 mt-1 relative group/output">
                        <div className="flex items-center gap-1 text-xs font-medium mb-1 text-muted-foreground">
                          <Icon icon={File01Icon} className="h-3 w-3" />
                          Output Data
                        </div>
                        <pre className="text-[10px] overflow-x-auto font-mono text-muted-foreground line-clamp-3">
                          {JSON.stringify(event.agentOutput, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Verification Status */}
                {event.verificationStatus === 'pending' && (
                  <div className="mt-2 flex items-center gap-2">
                     <Badge variant="warning" className="text-xs">
                       Pending Verification
                     </Badge>
                  </div>
                )}

                {/* Inspect Button (Only for Agents) */}
                {event.completedByType === 'agent' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2 h-6 px-2 text-xs opacity-0 group-hover/card:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <Icon icon={Search01Icon} className="mr-1 h-3 w-3" />
                    Inspect
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AgentOutputViewer 
        open={!!selectedEvent} 
        onOpenChange={(open) => !open && setSelectedEvent(null)}
        item={selectedEvent ? items[selectedEvent.itemId] : null}
        progress={selectedEvent?.progress || null}
      />
    </div>
  );
}
