import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@/components/ui/icon';
import AiCloud02Icon from '@hugeicons/core-free-icons/AiCloud02Icon'
import CheckmarkCircle02Icon from '@hugeicons/core-free-icons/CheckmarkCircle02Icon'
import ViewOffIcon from '@hugeicons/core-free-icons/ViewOffIcon'
import ViewIcon from '@hugeicons/core-free-icons/ViewIcon'
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon'
import { toast } from 'sonner';
import { useAgentSettingsStore } from '@/stores/agent-settings-store';

export function ProviderKeyManager() {
  const {
    openaiApiKey,
    anthropicApiKey,
    setOpenAIKey,
    setAnthropicKey,
  } = useAgentSettingsStore();

  // Local draft values for editing (initialise from store)
  const [drafts, setDrafts] = useState<{
    openai: string;
    anthropic: string;
  }>({
    openai: openaiApiKey ?? '',
    anthropic: anthropicApiKey ?? '',
  });

  const [showKeys, setShowKeys] = useState<{
    openai: boolean;
    anthropic: boolean;
  }>({
    openai: false,
    anthropic: false,
  });

  const saveKey = (provider: 'openai' | 'anthropic', value: string) => {
    const label = provider === 'openai' ? 'OpenAI' : 'Anthropic';
    if (value) {
      if (provider === 'openai') setOpenAIKey(value);
      else setAnthropicKey(value);
      toast.success(`${label} API key saved`);
    } else {
      if (provider === 'openai') setOpenAIKey(null);
      else setAnthropicKey(null);
      toast.info(`${label} API key removed`);
    }
    setDrafts(prev => ({ ...prev, [provider]: value }));
  };

  const toggleShow = (provider: 'openai' | 'anthropic') => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon icon={AiCloud02Icon} className="h-5 w-5 text-primary" />
          AI Provider Keys
        </CardTitle>
        <CardDescription>
          Bring Your Own Key (BYOK). Keys are stored locally in your browser and never sent to our servers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* OpenAI */}
        <div className="space-y-2">
          <Label htmlFor="openai-key">OpenAI API Key</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="openai-key"
                type={showKeys.openai ? 'text' : 'password'}
                placeholder="sk-..."
                value={drafts.openai}
                onChange={(e) => setDrafts(prev => ({ ...prev, openai: e.target.value }))}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => toggleShow('openai')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <Icon icon={showKeys.openai ? ViewOffIcon : ViewIcon} className="h-4 w-4" />
              </button>
            </div>
            <Button onClick={() => saveKey('openai', drafts.openai)} variant="outline">
              <Icon icon={CheckmarkCircle02Icon} className="mr-2 h-4 w-4" />
              Save
            </Button>
            {drafts.openai && (
              <Button 
                onClick={() => saveKey('openai', '')} 
                variant="ghost" 
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Icon icon={Delete02Icon} className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Required for models like GPT-4o. Get one at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="underline hover:text-primary">platform.openai.com</a>.
          </p>
        </div>

        {/* Anthropic */}
        <div className="space-y-2">
          <Label htmlFor="anthropic-key">Anthropic API Key</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="anthropic-key"
                type={showKeys.anthropic ? 'text' : 'password'}
                placeholder="sk-ant-..."
                value={drafts.anthropic}
                onChange={(e) => setDrafts(prev => ({ ...prev, anthropic: e.target.value }))}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => toggleShow('anthropic')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <Icon icon={showKeys.anthropic ? ViewOffIcon : ViewIcon} className="h-4 w-4" />
              </button>
            </div>
            <Button onClick={() => saveKey('anthropic', drafts.anthropic)} variant="outline">
              <Icon icon={CheckmarkCircle02Icon} className="mr-2 h-4 w-4" />
              Save
            </Button>
            {drafts.anthropic && (
              <Button 
                onClick={() => saveKey('anthropic', '')} 
                variant="ghost" 
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Icon icon={Delete02Icon} className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Required for Claude 3.5 Sonnet (Recommended). Get one at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="underline hover:text-primary">console.anthropic.com</a>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
