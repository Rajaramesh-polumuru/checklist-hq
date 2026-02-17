import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icon } from '@/components/ui/icon';
import { 
  AiCloud02Icon, 
  CodeCircleIcon, 
  File01Icon, 
  CheckmarkCircle02Icon 
} from '@hugeicons/core-free-icons';
import type { ItemProgress, ChecklistItem } from '@/types/database';

interface AgentOutputViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ChecklistItem | null;
  progress: ItemProgress | null;
}

export function AgentOutputViewer({ open, onOpenChange, item, progress }: AgentOutputViewerProps) {
  if (!item || !progress) return null;

  const agentOutput = progress.agent_output;
  const artifacts = progress.artifacts || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
              <Icon icon={AiCloud02Icon} className="mr-1 h-3 w-3" />
              Agent Action
            </Badge>
            {progress.completed && (
              <Badge variant="success" className="gap-1">
                <Icon icon={CheckmarkCircle02Icon} className="h-3 w-3" />
                Completed
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl">{item.text}</DialogTitle>
          <DialogDescription>
            Executed by {progress.completed_by_name || 'AI Agent'}
            {progress.duration_ms && ` • ${(progress.duration_ms / 1000).toFixed(1)}s duration`}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="output" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="output">Structured Output</TabsTrigger>
            <TabsTrigger value="artifacts" disabled={artifacts.length === 0}>
              Artifacts ({artifacts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="output" className="flex-1 min-h-0 mt-4 overflow-y-auto">
            <div className="h-[300px] w-full rounded-md border p-4 bg-muted/30 overflow-y-auto">
              {agentOutput ? (
                <div className="space-y-4">
                  {Object.entries(agentOutput).map(([key, value]) => (
                    <div key={key}>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">{key}</h4>
                      {typeof value === 'object' ? (
                        <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : (
                        <div className="p-2 bg-background rounded border text-sm">
                          {String(value)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Icon icon={CodeCircleIcon} className="h-8 w-8 mb-2 opacity-50" />
                  <p>No structured output available</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="artifacts" className="flex-1 min-h-0 mt-4 overflow-y-auto">
            <div className="h-[300px] overflow-y-auto">
              <div className="space-y-3">
                {artifacts.map((artifact, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                      <Icon icon={File01Icon} className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{artifact.description || 'Unnamed Artifact'}</p>
                      <p className="text-xs text-muted-foreground capitalize">{artifact.type}</p>
                    </div>
                    <a 
                      href={artifact.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-1"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
