import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { BrainIcon, Copy01Icon } from '@hugeicons/core-free-icons';
import { toast } from 'sonner';
import type { Repository, Commit, Run } from '@/types/database';
import { generateAgentContext, generateExecutionPrompt } from '@/lib/agent/prompt-transformer';

interface AgentExportButtonProps {
  repository: Repository;
  commit: Commit;
  run?: Run;
}

export function AgentExportButton({ repository, commit, run }: AgentExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const copyToClipboard = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
      console.error('Clipboard error:', error);
    }
  };

  const handleCopyContext = () => {
    const context = generateAgentContext(repository, commit, run);
    copyToClipboard(context, 'Copied context for Claude/ChatGPT');
  };

  const handleCopyExecutionPrompt = () => {
    const prompt = generateExecutionPrompt(repository, commit, run);
    copyToClipboard(prompt, 'Copied execution prompt for AI agent');
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Icon icon={BrainIcon} className="h-4 w-4" />
          <span className="hidden sm:inline">Copy for Agent</span>
          <span className="sm:hidden">AI</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleCopyContext} className="gap-2">
          <Icon icon={Copy01Icon} className="h-4 w-4" />
          <div className="flex flex-col">
            <span>Copy Context Only</span>
            <span className="text-xs text-muted-foreground">
              Just the checklist state
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyExecutionPrompt} className="gap-2">
          <Icon icon={BrainIcon} className="h-4 w-4" />
          <div className="flex flex-col">
            <span>Copy Execution Prompt</span>
            <span className="text-xs text-muted-foreground">
              State + instructions
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
