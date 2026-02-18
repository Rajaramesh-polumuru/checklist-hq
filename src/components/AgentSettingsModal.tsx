/**
 * Agent Settings Modal
 * Configure API keys and auto-pilot preferences
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAgentSettingsStore } from '@/stores/agent-settings-store';
import BrainIcon from '@hugeicons/core-free-icons/BrainIcon'
import EyeIcon from '@hugeicons/core-free-icons/EyeIcon'
import { Icon } from '@/components/ui/icon';

interface AgentSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function AgentSettingsModal({ open, onClose }: AgentSettingsModalProps) {
  const agentSettings = useAgentSettingsStore();
  
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  
  const [localOpenAIKey, setLocalOpenAIKey] = useState(agentSettings.openaiApiKey || '');
  const [localAnthropicKey, setLocalAnthropicKey] = useState(agentSettings.anthropicApiKey || '');

  const handleSave = () => {
    agentSettings.setOpenAIKey(localOpenAIKey || null);
    agentSettings.setAnthropicKey(localAnthropicKey || null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Icon icon={BrainIcon} className="h-5 w-5" />
            <DialogTitle>Agent Settings</DialogTitle>
          </div>
          <DialogDescription>
            Configure AI providers and auto-pilot behavior for checklist execution.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* API Keys Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">API Keys</h3>
            
            {/* OpenAI */}
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="openai-key"
                  type={showOpenAIKey ? 'text' : 'password'}
                  value={localOpenAIKey}
                  onChange={(e) => setLocalOpenAIKey(e.target.value)}
                  placeholder="sk-..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                >
                  <Icon icon={EyeIcon} className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your key from{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  OpenAI Platform
                </a>
              </p>
            </div>

            {/* Anthropic */}
            <div className="space-y-2">
              <Label htmlFor="anthropic-key">Anthropic API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="anthropic-key"
                  type={showAnthropicKey ? 'text' : 'password'}
                  value={localAnthropicKey}
                  onChange={(e) => setLocalAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                >
                  <Icon icon={EyeIcon} className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your key from{' '}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Anthropic Console
                </a>
              </p>
            </div>
          </div>

          {/* Default Provider */}
          <div className="space-y-2">
            <Label htmlFor="default-provider">Default Provider</Label>
            <Select
              value={agentSettings.defaultProvider}
              onValueChange={(value) => agentSettings.setDefaultProvider(value as 'openai' | 'anthropic')}
            >
              <SelectTrigger id="default-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Default Model */}
          <div className="space-y-2">
            <Label htmlFor="default-model">Default Model</Label>
            <Input
              id="default-model"
              value={agentSettings.defaultModel}
              onChange={(e) => agentSettings.setDefaultModel(e.target.value)}
              placeholder="gpt-4 or claude-sonnet-4"
            />
            <p className="text-xs text-muted-foreground">
              Model name to use when not specified in item config
            </p>
          </div>

          {/* Auto-Pilot Settings */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold">Auto-Pilot Behavior</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-pilot-enabled">Enable Auto-Pilot</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically execute items with agent config
                </p>
              </div>
              <Switch
                id="auto-pilot-enabled"
                checked={agentSettings.autoPilotEnabled}
                onCheckedChange={agentSettings.setAutoPilotEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="confirm-execution">Confirm Before Execution</Label>
                <p className="text-xs text-muted-foreground">
                  Ask for confirmation before running each item
                </p>
              </div>
              <Switch
                id="confirm-execution"
                checked={agentSettings.confirmBeforeExecution}
                onCheckedChange={agentSettings.setConfirmBeforeExecution}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="continue-on-error">Continue on Error</Label>
                <p className="text-xs text-muted-foreground">
                  Keep executing next items if one fails
                </p>
              </div>
              <Switch
                id="continue-on-error"
                checked={agentSettings.continueOnError}
                onCheckedChange={agentSettings.setContinueOnError}
              />
            </div>
          </div>

          {/* Security Warning */}
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
            <p className="text-sm text-warning-foreground">
              <strong>Security Note:</strong> API keys are stored locally in your browser.
              Never share your keys with others or commit them to version control.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
