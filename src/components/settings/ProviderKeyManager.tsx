import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@/components/ui/icon';
import { 
  AiCloud02Icon, 
  CheckmarkCircle02Icon, 
  ViewOffIcon, 
  ViewIcon,
  Delete02Icon
} from '@hugeicons/core-free-icons';
import { toast } from 'sonner';

export function ProviderKeyManager() {
  const [keys, setKeys] = useState<{
    openai: string;
    anthropic: string;
  }>({
    openai: '',
    anthropic: '',
  });
  
  const [showKeys, setShowKeys] = useState<{
    openai: boolean;
    anthropic: boolean;
  }>({
    openai: false,
    anthropic: false,
  });

  // Load keys from localStorage on mount
  useEffect(() => {
    const openaiKey = localStorage.getItem('chq_openai_key') || '';
    const anthropicKey = localStorage.getItem('chq_anthropic_key') || '';
    setKeys({ openai: openaiKey, anthropic: anthropicKey });
  }, []);

  const saveKey = (provider: 'openai' | 'anthropic', value: string) => {
    if (value) {
      localStorage.setItem(`chq_${provider}_key`, value);
      toast.success(`${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key saved`);
    } else {
      localStorage.removeItem(`chq_${provider}_key`);
      toast.info(`${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key removed`);
    }
    setKeys(prev => ({ ...prev, [provider]: value }));
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
                value={keys.openai}
                onChange={(e) => setKeys(prev => ({ ...prev, openai: e.target.value }))}
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
            <Button onClick={() => saveKey('openai', keys.openai)} variant="outline">
              <Icon icon={CheckmarkCircle02Icon} className="mr-2 h-4 w-4" />
              Save
            </Button>
            {keys.openai && (
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
                value={keys.anthropic}
                onChange={(e) => setKeys(prev => ({ ...prev, anthropic: e.target.value }))}
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
            <Button onClick={() => saveKey('anthropic', keys.anthropic)} variant="outline">
              <Icon icon={CheckmarkCircle02Icon} className="mr-2 h-4 w-4" />
              Save
            </Button>
            {keys.anthropic && (
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
