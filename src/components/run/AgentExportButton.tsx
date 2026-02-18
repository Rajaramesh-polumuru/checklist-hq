import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import BrainIcon from '@hugeicons/core-free-icons/BrainIcon'
import Copy01Icon from '@hugeicons/core-free-icons/Copy01Icon'
import FileEditIcon from '@hugeicons/core-free-icons/FileEditIcon'
import { toast } from 'sonner';
import type { Repository, Commit, Run } from '@/types/database';
import { generateAgentContext, generateExecutionPrompt, type AgentContextOptions } from '@/lib/agent/prompt-transformer';

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
      
      // Estimate token count (rough: ~4 chars per token)
      const estimatedTokens = Math.ceil(text.length / 4);
      
      toast.success(`${message} (~${estimatedTokens} tokens)`);
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
      console.error('Clipboard error:', error);
    }
  };

  const handleCopy = (format: AgentContextOptions['format'], scope: 'full' | 'remaining', withPrompt: boolean) => {
    const options: AgentContextOptions = {
      format,
      onlyIncomplete: scope === 'remaining',
    };
    
    const context = withPrompt 
      ? generateExecutionPrompt(repository, commit, run, options)
      : generateAgentContext(repository, commit, run, options);
    
    const formatName = format === 'json' ? 'JSON' : format === 'xml' ? 'XML' : 'Markdown';
    const scopeName = scope === 'remaining' ? 'remaining items' : 'full checklist';
    const typeName = withPrompt ? 'prompt' : 'context';
    
    copyToClipboard(context, `Copied ${formatName} ${typeName} (${scopeName})`);
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
      <DropdownMenuContent align="end" className="w-64">
        {/* Quick Actions */}
        <DropdownMenuItem onClick={() => handleCopy('markdown', 'full', false)} className="gap-2">
          <Icon icon={Copy01Icon} className="h-4 w-4" />
          <div className="flex flex-col">
            <span>Copy Context (Markdown)</span>
            <span className="text-xs text-muted-foreground">
              Full checklist, human-readable
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCopy('markdown', 'full', true)} className="gap-2">
          <Icon icon={BrainIcon} className="h-4 w-4" />
          <div className="flex flex-col">
            <span>Copy Execution Prompt</span>
            <span className="text-xs text-muted-foreground">
              With instructions for AI
            </span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Format Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Icon icon={FileEditIcon} className="h-4 w-4 mr-2" />
            Choose Format
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => handleCopy('markdown', 'full', false)}>
              Markdown (Human-readable)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCopy('json', 'full', false)}>
              JSON (Structured)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCopy('xml', 'full', false)}>
              XML (Best for Claude)
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        {/* Scope Options */}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleCopy('markdown', 'remaining', false)} className="gap-2">
          <div className="flex flex-col">
            <span>Remaining Items Only</span>
            <span className="text-xs text-muted-foreground">
              Skip completed steps
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
