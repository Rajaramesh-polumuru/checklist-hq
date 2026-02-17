/**
 * Smart Import Modal
 * Convert text documents into structured checklists using AI
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import {
  SparklesIcon,
  Loading02Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  FileEditIcon,
} from '@hugeicons/core-free-icons';
import { useAgentSettingsStore } from '@/stores/agent-settings-store';
import { parseDocument, generatePreview } from '@/lib/agent/parse-document';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import type { ChecklistContent } from '@/types/database';

interface SmartImportModalProps {
  open: boolean;
  onClose: () => void;
}

type ImportStep = 'input' | 'parsing' | 'preview' | 'creating' | 'success' | 'error';

export function SmartImportModal({ open, onClose }: SmartImportModalProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const agentSettings = useAgentSettingsStore();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [text, setText] = useState('');
  const [provider, setProvider] = useState<'openai' | 'anthropic'>(agentSettings.defaultProvider);
  const [model, setModel] = useState(agentSettings.defaultModel);

  // Parsing state
  const [step, setStep] = useState<ImportStep>('input');
  const [parsedContent, setParsedContent] = useState<ChecklistContent | null>(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [createdRepoId, setCreatedRepoId] = useState<string | null>(null);

  const handleParse = async () => {
    if (!text.trim()) {
      toast.error('Please paste some text to convert');
      return;
    }

    const apiKey = agentSettings.getApiKey(provider);
    if (!apiKey) {
      toast.error(`No API key configured for ${provider}`);
      return;
    }

    setStep('parsing');
    setError(null);

    try {
      const result = await parseDocument({
        provider,
        model,
        apiKey,
        text,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
      });

      setParsedContent(result.content);
      setPreview(generatePreview(result.content));
      setStep('preview');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse document';
      setError(errorMessage);
      setStep('error');
    }
  };

  const handleCreate = async () => {
    if (!parsedContent || !user) return;

    setStep('creating');
    setError(null);

    try {
      // Create repository
      const { data: repo, error: repoError } = await supabase
        .from('repositories')
        .insert({
          title: title.trim() || 'Imported Checklist',
          description: description.trim() || null,
          owner_id: user.id,
        })
        .select()
        .single();

      if (repoError || !repo) {
        throw new Error(repoError?.message || 'Failed to create repository');
      }

      // Create initial commit with parsed content
      const { error: commitError } = await supabase.from('commits').insert({
        repo_id: repo.id,
        content: parsedContent,
        message: 'Imported from document',
        parent_commit_id: null,
      });

      if (commitError) {
        // Rollback repository creation
        await supabase.from('repositories').delete().eq('id', repo.id);
        throw new Error(commitError.message);
      }

      setCreatedRepoId(repo.id);
      setStep('success');
      toast.success('Checklist created successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create checklist';
      setError(errorMessage);
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('input');
    setTitle('');
    setDescription('');
    setText('');
    setParsedContent(null);
    setPreview('');
    setError(null);
    setCreatedRepoId(null);
    onClose();
  };

  const handleViewChecklist = () => {
    if (createdRepoId) {
      navigate(`/app/repo/${createdRepoId}`);
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Icon icon={SparklesIcon} className="h-5 w-5 text-primary" />
            <DialogTitle>Smart Import</DialogTitle>
          </div>
          <DialogDescription>
            Paste a document, SOP, or process description and we'll convert it into a structured checklist.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Input */}
          {step === 'input' && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Checklist Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Production Deployment Process"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of what this checklist is for"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text">Document Text</Label>
                  <Textarea
                    id="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your SOP, process documentation, or task list here..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports: plain text, markdown, numbered lists, bullet points
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">AI Provider</Label>
                    <Select
                      value={provider}
                      onValueChange={(value) => setProvider(value as 'openai' | 'anthropic')}
                    >
                      <SelectTrigger id="provider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="gpt-4 or claude-sonnet-4"
                    />
                  </div>
                </div>

                {!agentSettings.hasApiKey() && (
                  <Alert>
                    <Icon icon={AlertCircleIcon} className="h-4 w-4" />
                    <AlertDescription>
                      No API keys configured. Please add your OpenAI or Anthropic API key in settings.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}

          {/* Step 2: Parsing */}
          {step === 'parsing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Icon icon={Loading02Icon} className="h-12 w-12 text-primary animate-spin" />
              <div className="text-center">
                <h3 className="font-semibold">Analyzing document...</h3>
                <p className="text-sm text-muted-foreground">
                  AI is converting your text into a structured checklist
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && parsedContent && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Icon icon={CheckmarkCircle02Icon} className="h-5 w-5 text-success" />
                  <h3 className="font-semibold">Preview Generated Checklist</h3>
                  <Badge variant="outline">
                    {Object.keys(parsedContent.items).length} items
                  </Badge>
                </div>

                <div className="bg-muted/30 rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">{preview}</pre>
                </div>

                <Alert>
                  <Icon icon={FileEditIcon} className="h-4 w-4" />
                  <AlertDescription>
                    Review the structure above. You can edit the checklist after creation.
                  </AlertDescription>
                </Alert>
              </div>
            </>
          )}

          {/* Step 4: Creating */}
          {step === 'creating' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Icon icon={Loading02Icon} className="h-12 w-12 text-primary animate-spin" />
              <div className="text-center">
                <h3 className="font-semibold">Creating checklist...</h3>
                <p className="text-sm text-muted-foreground">
                  Saving to your repository
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-success/20 rounded-full blur-xl animate-pulse" />
                <Icon icon={CheckmarkCircle02Icon} className="h-16 w-16 text-success relative" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Checklist Created!</h3>
                <p className="text-sm text-muted-foreground">
                  Your document has been converted into a structured checklist
                </p>
              </div>
            </div>
          )}

          {/* Step 6: Error */}
          {step === 'error' && error && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <Icon icon={AlertCircleIcon} className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setStep('input')}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'input' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleParse} disabled={!text.trim() || !agentSettings.hasApiKey()}>
                <Icon icon={SparklesIcon} className="h-4 w-4 mr-2" />
                Convert to Checklist
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('input')}>
                Back to Edit
              </Button>
              <Button onClick={handleCreate}>
                Create Checklist
              </Button>
            </>
          )}

          {step === 'success' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleViewChecklist}>
                View Checklist
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
