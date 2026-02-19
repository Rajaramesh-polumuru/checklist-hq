/**
 * Smart Import Modal
 * Convert text documents into structured checklists using AI
 *
 * Supports two AI methods:
 *   - Cloud AI (OpenAI / Anthropic) — best quality, requires API key
 *   - Local AI (flan-T5 via WebWorker) — free, private, offline-capable
 */

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import SparklesIcon from '@hugeicons/core-free-icons/SparklesIcon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import CheckmarkCircle02Icon from '@hugeicons/core-free-icons/CheckmarkCircle02Icon'
import AlertCircleIcon from '@hugeicons/core-free-icons/AlertCircleIcon'
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import CheckListIcon from '@hugeicons/core-free-icons/CheckListIcon'
import File01Icon from '@hugeicons/core-free-icons/File01Icon'
import Settings02Icon from '@hugeicons/core-free-icons/Settings02Icon'
import CpuIcon from '@hugeicons/core-free-icons/CpuIcon'
import Download02Icon from '@hugeicons/core-free-icons/Download02Icon'
import WifiOff01Icon from '@hugeicons/core-free-icons/WifiOff01Icon'
import Alert02Icon from '@hugeicons/core-free-icons/Alert02Icon'
import AiCloud02Icon from '@hugeicons/core-free-icons/AiCloud02Icon'
import Shield01Icon from '@hugeicons/core-free-icons/Shield01Icon'
import { useAgentSettingsStore } from '@/stores/agent-settings-store';
import { parseDocument } from '@/lib/agent/parse-document';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import type { ChecklistContent, ChecklistItem } from '@/types/database';
import { cn } from '@/lib/utils';
import { useLocalModel } from '@/hooks/useLocalModel';
import { buildChecklistFromLines, assessLocalParseQuality } from '@/lib/local-model/parse-with-local-model';
import { LOCAL_MODELS } from '@/lib/local-model/model-config';

// ── Types ────────────────────────────────────────────────────────────────────

interface SmartImportModalProps {
  open: boolean;
  onClose: () => void;
}

type AIMethod = 'cloud' | 'local'

type ImportStep =
  | 'input'
  | 'parsing'
  | 'checking-capabilities'
  | 'downloading-model'
  | 'model-initializing'
  | 'inferring'
  | 'preview'
  | 'creating'
  | 'success'
  | 'error';

// ── Preview List ─────────────────────────────────────────────────────────────

function PreviewList({ content }: { content: ChecklistContent }) {
  const allItems = Object.values(content.items)
  const rootItems = allItems.filter(i => !i.parent).sort((a, b) => a.order - b.order)

  function renderItem(item: ChecklistItem, idx: number, depth = 0): React.ReactNode {
    const children = allItems
      .filter(c => c.parent === item.id)
      .sort((a, b) => a.order - b.order)

    return (
      <div key={item.id} style={{ paddingLeft: depth * 16 }}>
        <div className={cn(
          'flex items-start gap-2 py-1.5 text-sm',
          depth > 0 && 'text-muted-foreground'
        )}>
          <span className="text-muted-foreground/50 tabular-nums w-5 shrink-0 text-right mt-px text-xs">
            {idx + 1}.
          </span>
          <span className="flex-1 leading-relaxed">{item.text || <em className="opacity-40">Empty</em>}</span>
          {item.type === 'header' && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 shrink-0">header</Badge>
          )}
          {item.type === 'note' && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 shrink-0">note</Badge>
          )}
        </div>
        {item.details && (
          <p className="text-xs text-muted-foreground/70 ml-7 mb-1 italic">{item.details}</p>
        )}
        {children.map((c, ci) => renderItem(c, ci, depth + 1))}
      </div>
    )
  }

  return (
    <div className="divide-y divide-border/40">
      {rootItems.map((item, idx) => renderItem(item, idx))}
    </div>
  )
}

// ── Step Indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { id: 'input', label: 'Input' },
  { id: 'preview', label: 'Preview' },
  { id: 'success', label: 'Done' },
] as const

function StepIndicator({ current }: { current: ImportStep }) {
  const activeIndex =
    current === 'input' || current === 'parsing' || current === 'error'
    || current === 'checking-capabilities' || current === 'downloading-model'
    || current === 'model-initializing' || current === 'inferring'
      ? 0
      : current === 'preview' || current === 'creating' ? 1
      : 2

  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((step, idx) => (
        <div key={step.id} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2 shrink-0">
            <div className={cn(
              'h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
              idx < activeIndex && 'bg-primary text-primary-foreground',
              idx === activeIndex && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
              idx > activeIndex && 'bg-muted text-muted-foreground',
            )}>
              {idx < activeIndex ? (
                <Icon icon={CheckmarkCircle02Icon} className="h-3.5 w-3.5" />
              ) : (
                idx + 1
              )}
            </div>
            <span className={cn(
              'text-xs font-medium hidden sm:inline',
              idx === activeIndex ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={cn(
              'flex-1 h-px mx-3 transition-colors',
              idx < activeIndex ? 'bg-primary' : 'bg-border'
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── AI Method Selector ───────────────────────────────────────────────────────

function AIMethodSelector({
  value,
  onChange,
  hasApiKey,
}: {
  value: AIMethod
  onChange: (method: AIMethod) => void
  hasApiKey: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Cloud AI Option */}
      <button
        type="button"
        onClick={() => onChange('cloud')}
        className={cn(
          'relative flex flex-col items-start gap-2 rounded-lg border-2 p-3 text-left transition-all',
          value === 'cloud'
            ? 'border-primary bg-primary/5 shadow-sm'
            : 'border-border hover:border-primary/30 hover:bg-accent/30'
        )}
      >
        <div className="flex items-center gap-2 w-full">
          <div className={cn(
            'h-7 w-7 rounded-md flex items-center justify-center shrink-0',
            value === 'cloud' ? 'bg-primary/15' : 'bg-muted'
          )}>
            <Icon icon={AiCloud02Icon} className={cn('h-3.5 w-3.5', value === 'cloud' ? 'text-primary' : 'text-muted-foreground')} />
          </div>
          <span className={cn('text-sm font-semibold', value === 'cloud' ? 'text-primary' : 'text-foreground')}>
            Cloud AI
          </span>
          {hasApiKey && (
            <Icon icon={CheckmarkCircle02Icon} className="h-3.5 w-3.5 text-emerald-500 ml-auto" />
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Best quality. Uses GPT-4o or Claude.
        </p>
      </button>

      {/* Local AI Option */}
      <button
        type="button"
        onClick={() => onChange('local')}
        className={cn(
          'relative flex flex-col items-start gap-2 rounded-lg border-2 p-3 text-left transition-all',
          value === 'local'
            ? 'border-primary bg-primary/5 shadow-sm'
            : 'border-border hover:border-primary/30 hover:bg-accent/30'
        )}
      >
        <div className="flex items-center gap-2 w-full">
          <div className={cn(
            'h-7 w-7 rounded-md flex items-center justify-center shrink-0',
            value === 'local' ? 'bg-primary/15' : 'bg-muted'
          )}>
            <Icon icon={CpuIcon} className={cn('h-3.5 w-3.5', value === 'local' ? 'text-primary' : 'text-muted-foreground')} />
          </div>
          <span className={cn('text-sm font-semibold', value === 'local' ? 'text-primary' : 'text-foreground')}>
            Local AI
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[9px] h-4 px-1 gap-0.5 border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30">
            <Icon icon={Shield01Icon} className="h-2.5 w-2.5" />
            Private
          </Badge>
          <Badge variant="outline" className="text-[9px] h-4 px-1 border-sky-300 text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30">
            Free
          </Badge>
        </div>
      </button>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function SmartImportModal({ open, onClose }: SmartImportModalProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const agentSettings = useAgentSettingsStore();
  const localModel = useLocalModel();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [text, setText] = useState('');
  const [provider, setProvider] = useState<'openai' | 'anthropic'>(agentSettings.defaultProvider);
  const [model, setModel] = useState(agentSettings.defaultModel);
  const [showAISettings, setShowAISettings] = useState(false);

  // Default to cloud if API key exists, otherwise local
  const hasApiKey = agentSettings.hasApiKey();
  const [aiMethod, setAIMethod] = useState<AIMethod>(hasApiKey ? 'cloud' : 'local');

  // Inline API key input (for quick setup from within the modal)
  const [inlineApiKey, setInlineApiKey] = useState('');

  const [step, setStep] = useState<ImportStep>('input');
  const [parsedContent, setParsedContent] = useState<ChecklistContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdRepoId, setCreatedRepoId] = useState<string | null>(null);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);

  const itemCount = parsedContent ? Object.keys(parsedContent.items).length : 0

  // Re-sync default method when API key availability changes
  useEffect(() => {
    if (open) {
      setAIMethod(hasApiKey ? 'cloud' : 'local');
    }
  }, [open, hasApiKey]);

  // Sync local model hook status → modal step
  useEffect(() => {
    if (aiMethod !== 'local') return
    if (localModel.status === 'loading') {
      setStep(localModel.progress.stage === 'downloading' ? 'downloading-model' : 'model-initializing')
    } else if (localModel.status === 'checking-capabilities') {
      setStep('checking-capabilities')
    } else if (localModel.status === 'inferring') {
      setStep('inferring')
    }
  }, [aiMethod, localModel.status, localModel.progress.stage])

  // ── Handlers ─────────────────────────────────────────────────────────────

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
        provider, model, apiKey,
        text,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
      });
      setParsedContent(result.content);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse document');
      setStep('error');
    }
  };

  const handleLocalParse = async () => {
    if (!text.trim()) {
      toast.error('Please paste some text to convert');
      return;
    }

    setError(null);
    setQualityWarning(null);

    try {
      // Load model if not yet ready
      if (localModel.status !== 'ready') {
        await localModel.loadModel();
      }

      const startMs = Date.now();
      const lines = await localModel.runInference({
        text,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
      });

      const result = buildChecklistFromLines(
        lines,
        LOCAL_MODELS[localModel.selectedModelKey]?.id ?? 'Xenova/flan-t5-small',
        Date.now() - startMs,
      );

      const quality = assessLocalParseQuality(result.content);
      if (!quality.acceptable) {
        const reasonMessages: Record<string, string> = {
          'no-output': 'The model produced no output. Try a shorter or simpler document.',
          'too-few-tasks': 'Only a few steps were detected. Results may be incomplete.',
          'repetitive-output': 'The model produced repetitive steps. Try a shorter document.',
        }
        setQualityWarning(reasonMessages[quality.reason ?? ''] ?? 'Results may be incomplete.')
      }

      setParsedContent(result.content);
      setStep('preview');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Local AI parsing failed'
      const isDownloadError = message.toLowerCase().includes('fetch') ||
        message.toLowerCase().includes('network') ||
        message.toLowerCase().includes('failed to load')
      setError(isDownloadError
        ? 'Download failed — check your connection and try again.'
        : message
      )
      setStep('error');
    }
  };

  const handleSaveInlineKey = () => {
    if (!inlineApiKey.trim()) return;
    // Auto-detect provider from key prefix
    if (inlineApiKey.startsWith('sk-ant-')) {
      agentSettings.setAnthropicKey(inlineApiKey.trim());
      setProvider('anthropic');
      toast.success('Anthropic API key saved');
    } else {
      agentSettings.setOpenAIKey(inlineApiKey.trim());
      setProvider('openai');
      toast.success('OpenAI API key saved');
    }
    setInlineApiKey('');
  };

  const handleCreate = async () => {
    if (!parsedContent || !user) return;
    setStep('creating');
    setError(null);
    try {
      const { data: repo, error: repoError } = await supabase
        .from('repositories')
        .insert({
          title: title.trim() || 'Imported Checklist',
          description: description.trim() || null,
          owner_id: user.id,
        })
        .select()
        .single();

      if (repoError || !repo) throw new Error(repoError?.message || 'Failed to create repository');

      const { error: commitError } = await supabase.from('commits').insert({
        repo_id: repo.id,
        content: parsedContent,
        message: 'Imported from document',
        parent_commit_id: null,
      });

      if (commitError) {
        await supabase.from('repositories').delete().eq('id', repo.id);
        throw new Error(commitError.message);
      }

      setCreatedRepoId(repo.id);
      setStep('success');
      toast.success('Checklist created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checklist');
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('input');
    setTitle(''); setDescription(''); setText('');
    setParsedContent(null); setError(null); setCreatedRepoId(null);
    setQualityWarning(null); setInlineApiKey('');
    localModel.cancel();
    onClose();
  };

  const canSubmit =
    text.trim().length > 0 &&
    (aiMethod === 'local' || hasApiKey)

  const handleConvert = aiMethod === 'local' ? handleLocalParse : handleParse;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(
        'max-w-[calc(100vw-2rem)] sm:max-w-2xl',
        'max-h-[calc(100vh-2rem)] overflow-y-auto',
        'p-4 sm:p-6',
      )}>
        <DialogHeader className="mb-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon icon={SparklesIcon} className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">Smart Import</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Paste any document and AI converts it into a structured checklist.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Step indicator — only show for the main flow */}
        {step !== 'error' && (
          <StepIndicator current={step} />
        )}

        {/* ── Step 1: Input ─────────────────────────────────── */}
        {step === 'input' && (
          <div className="space-y-4">
            {/* Title + Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="import-title" className="text-xs font-medium">
                  Title <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="import-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Production Deployment"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="import-desc" className="text-xs font-medium">
                  Description <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="import-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this checklist for?"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Document textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="import-text" className="text-xs font-medium">
                  Document Text *
                </Label>
                <span className="text-xs text-muted-foreground">
                  {text.length > 0 ? `${text.length} chars` : 'Plain text, markdown, or numbered lists'}
                </span>
              </div>
              <Textarea
                id="import-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your SOP, runbook, or process description here..."
                rows={8}
                className="text-sm font-mono resize-none leading-relaxed"
              />
            </div>

            {/* AI Method Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">AI Method</Label>
              <AIMethodSelector
                value={aiMethod}
                onChange={setAIMethod}
                hasApiKey={hasApiKey}
              />
            </div>

            {/* Cloud AI Settings Panel */}
            {aiMethod === 'cloud' && (
              <div className="rounded-lg border bg-muted/30">
                {hasApiKey ? (
                  <>
                    {/* Provider/model settings (collapsible) */}
                    <button
                      type="button"
                      onClick={() => setShowAISettings(v => !v)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors',
                        'focus-visible:[box-shadow:none]'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon icon={Settings02Icon} className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">AI Settings</span>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                          {provider} · {model}
                        </Badge>
                      </div>
                      <Icon icon={ArrowRight01Icon} className={cn(
                        'h-3.5 w-3.5 transition-transform',
                        showAISettings && 'rotate-90'
                      )} />
                    </button>

                    {showAISettings && (
                      <div className="px-3 pb-3 pt-0 border-t grid grid-cols-2 gap-3">
                        <div className="space-y-1.5 pt-3">
                          <Label htmlFor="import-provider" className="text-xs">Provider</Label>
                          <Select value={provider} onValueChange={(v) => setProvider(v as 'openai' | 'anthropic')}>
                            <SelectTrigger id="import-provider" className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openai">OpenAI</SelectItem>
                              <SelectItem value="anthropic">Anthropic</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5 pt-3">
                          <Label htmlFor="import-model" className="text-xs">Model</Label>
                          <Input
                            id="import-model"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            placeholder="gpt-4o or claude-sonnet-4-6"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* No API key — inline setup prompt */
                  <div className="px-3 py-3 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon icon={AlertCircleIcon} className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">API key required</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Enter your OpenAI or Anthropic key below, or{' '}
                          <Link
                            to="/app/profile"
                            onClick={(e) => {
                              e.preventDefault();
                              handleClose();
                              navigate('/app/profile?tab=integrations');
                            }}
                            className="text-primary hover:underline font-medium"
                          >
                            go to Settings → Integrations
                          </Link>
                          {' '}to manage your keys.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={inlineApiKey}
                        onChange={(e) => setInlineApiKey(e.target.value)}
                        type="password"
                        placeholder="sk-... or sk-ant-..."
                        className="h-8 text-xs flex-1 font-mono"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs shrink-0"
                        disabled={!inlineApiKey.trim()}
                        onClick={handleSaveInlineKey}
                      >
                        Save Key
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Keys are stored in your browser only — never sent to our servers.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Local AI Settings Panel */}
            {aiMethod === 'local' && (
              <div className="rounded-lg border bg-muted/30 px-3 py-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon icon={CpuIcon} className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Runs entirely in your browser</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {LOCAL_MODELS[localModel.selectedModelKey]?.sizeLabelMB} download on first use, then cached.
                      No data leaves your device.
                    </p>
                    <div className="mt-2.5">
                      <Select
                        value={localModel.selectedModelKey}
                        onValueChange={localModel.selectModel}
                      >
                        <SelectTrigger className="h-7 text-xs w-56">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(LOCAL_MODELS).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>
                              {cfg.name} ({cfg.sizeLabelMB})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleClose} className="active:scale-95">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConvert}
                disabled={!canSubmit}
                className="active:scale-95 gap-1.5"
              >
                <Icon icon={aiMethod === 'local' ? CpuIcon : SparklesIcon} className="h-3.5 w-3.5" />
                {aiMethod === 'local' ? 'Convert with Local AI' : 'Convert to Checklist'}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Parsing (API) ──────────────────────────── */}
        {step === 'parsing' && (
          <div className="flex flex-col items-center justify-center py-14 gap-5 text-center">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Icon icon={File01Icon} className="h-6 w-6 text-primary" />
              </div>
              <div className="absolute -right-1 -bottom-1 h-6 w-6 rounded-full bg-background border flex items-center justify-center">
                <Icon icon={Loading02Icon} className="h-3.5 w-3.5 text-primary animate-spin" />
              </div>
            </div>
            <div>
              <p className="font-semibold">Analyzing document</p>
              <p className="text-sm text-muted-foreground mt-1">
                AI is reading and structuring your content…
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2 mt-2">
              {[80, 60, 72, 50].map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-3 w-4 rounded bg-muted animate-pulse" />
                  <div className="h-3 rounded bg-muted animate-pulse" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Checking capabilities ─────────────────────────── */}
        {step === 'checking-capabilities' && (
          <div className="flex flex-col items-center justify-center py-14 gap-5 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Icon icon={CpuIcon} className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <div>
              <p className="font-semibold">Checking browser capabilities</p>
              <p className="text-sm text-muted-foreground mt-1">
                Detecting WebGPU support for accelerated inference…
              </p>
            </div>
          </div>
        )}

        {/* ── Downloading model ─────────────────────────────── */}
        {step === 'downloading-model' && (
          <div className="flex flex-col items-center justify-center py-10 gap-5 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Icon icon={Download02Icon} className="h-6 w-6 text-primary" />
            </div>

            {/* Backend badge */}
            <div className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              localModel.isWebGPUAvailable
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
            )}>
              <div className={cn(
                'h-1.5 w-1.5 rounded-full',
                localModel.isWebGPUAvailable ? 'bg-green-500' : 'bg-yellow-500'
              )} />
              {localModel.isWebGPUAvailable ? 'WebGPU accelerated' : 'CPU mode (WASM)'}
            </div>

            <div className="w-full max-w-sm space-y-3">
              <div>
                <p className="font-semibold">Downloading model</p>
                <p className="text-xs text-muted-foreground mt-1 truncate px-4">
                  {localModel.progress.fileName ?? 'Fetching model files…'}
                </p>
              </div>

              <Progress
                value={isNaN(localModel.progress.percentage) ? 0 : localModel.progress.percentage}
                size="default"
              />

              {/* Stats row */}
              <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                <span>
                  {localModel.progress.loadedMB} / {localModel.progress.totalMB}
                </span>
                {localModel.progress.etaSeconds !== null && (
                  <span>
                    ~{localModel.progress.etaSeconds < 60
                      ? `${localModel.progress.etaSeconds}s`
                      : `${Math.ceil(localModel.progress.etaSeconds / 60)}m`
                    } remaining
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Saved to browser cache — no re-download next time.
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-11 md:h-9 active:scale-95"
              onClick={() => { localModel.cancel(); setStep('input'); }}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* ── Model initializing ────────────────────────────── */}
        {step === 'model-initializing' && (
          <div className="flex flex-col items-center justify-center py-14 gap-5 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Icon icon={CpuIcon} className="h-6 w-6 text-primary animate-spin" />
            </div>
            <div>
              <p className="font-semibold">Loading model</p>
              <p className="text-sm text-muted-foreground mt-1">
                {localModel.progress.statusText ?? 'Preparing inference session…'}
              </p>
            </div>
            {/* Skeleton rows */}
            <div className="w-full max-w-sm space-y-2">
              {[80, 60, 72].map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-3 w-4 rounded bg-muted animate-pulse" />
                  <div className="h-3 rounded bg-muted animate-pulse" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
            {localModel.isCached && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <Icon icon={CheckmarkCircle02Icon} className="h-3.5 w-3.5" />
                Using cached model
              </div>
            )}
          </div>
        )}

        {/* ── Inferring (local model) ───────────────────────── */}
        {step === 'inferring' && (
          <div className="flex flex-col items-center justify-center py-14 gap-5 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Icon icon={CpuIcon} className="h-6 w-6 text-primary" />
              </div>
              <div className="absolute -right-1 -bottom-1 h-6 w-6 rounded-full bg-background border flex items-center justify-center">
                <Icon icon={Loading02Icon} className="h-3.5 w-3.5 text-primary animate-spin" />
              </div>
            </div>
            <div>
              <p className="font-semibold">Analyzing document</p>
              <p className="text-sm text-muted-foreground mt-1">
                Local AI is reading and structuring your content…
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2 mt-2">
              {[80, 60, 72, 50].map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-3 w-4 rounded bg-muted animate-pulse" />
                  <div className="h-3 rounded bg-muted animate-pulse" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-11 md:h-9 active:scale-95"
              onClick={() => { localModel.cancel(); setStep('input'); }}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* ── Step 3: Preview ───────────────────────────────── */}
        {step === 'preview' && parsedContent && (
          <div className="space-y-4">
            {/* Summary bar */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-success/10 border border-success/20">
              <Icon icon={CheckmarkCircle02Icon} className="h-4 w-4 text-success shrink-0" />
              <p className="text-sm font-medium flex-1">
                {itemCount} {itemCount === 1 ? 'step' : 'steps'} extracted
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Icon icon={CheckListIcon} className="h-3.5 w-3.5" />
                {title.trim() || 'Imported Checklist'}
              </div>
            </div>

            {/* Quality warning (local AI only) */}
            {qualityWarning && (
              <div className="flex items-start gap-2.5 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2.5 text-xs text-yellow-700 dark:text-yellow-400">
                <Icon icon={Alert02Icon} className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{qualityWarning} You can edit steps after creation.</p>
              </div>
            )}

            {/* Checklist preview */}
            <div className="rounded-lg border bg-muted/20 overflow-hidden">
              <div className="px-3 py-2 border-b bg-muted/40 flex items-center gap-2">
                <Icon icon={CheckListIcon} className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Preview</span>
              </div>
              <div className="px-3 py-2 max-h-72 overflow-y-auto">
                <PreviewList content={parsedContent} />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              You can edit any step after the checklist is created.
            </p>

            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep('input')} className="active:scale-95 gap-1.5">
                <Icon icon={ArrowLeft01Icon} className="h-3.5 w-3.5" />
                Back
              </Button>
              <Button size="sm" onClick={handleCreate} className="active:scale-95 gap-1.5">
                Create Checklist
                <Icon icon={ArrowRight01Icon} className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 4: Creating ──────────────────────────────── */}
        {step === 'creating' && (
          <div className="flex flex-col items-center justify-center py-14 gap-4 text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Icon icon={Loading02Icon} className="h-6 w-6 text-primary animate-spin" />
            </div>
            <div>
              <p className="font-semibold">Creating checklist</p>
              <p className="text-sm text-muted-foreground mt-1">Saving to your repository…</p>
            </div>
          </div>
        )}

        {/* ── Step 5: Success ───────────────────────────────── */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-10 gap-5 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-success/15 rounded-full blur-2xl" />
              <div className="h-16 w-16 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center relative">
                <Icon icon={CheckmarkCircle02Icon} className="h-8 w-8 text-success" />
              </div>
            </div>
            <div>
              <p className="text-lg font-semibold">Checklist created!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {itemCount} steps imported and ready to use.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto sm:justify-center">
              <Button variant="outline" size="sm" onClick={handleClose} className="active:scale-95">
                Close
              </Button>
              <Button size="sm" onClick={() => { navigate(`/app/repo/${createdRepoId}`); handleClose() }} className="active:scale-95 gap-1.5">
                Open in Editor
                <Icon icon={ArrowRight01Icon} className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────── */}
        {step === 'error' && error && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
              <Icon
                icon={error.toLowerCase().includes('download') || error.toLowerCase().includes('connection')
                  ? WifiOff01Icon
                  : AlertCircleIcon
                }
                className="h-4 w-4 text-destructive shrink-0 mt-0.5"
              />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-destructive">Import failed</p>
                <p className="text-xs text-destructive/80">{error}</p>
              </div>
            </div>

            {/* Suggest switching if the other method is available */}
            {aiMethod === 'cloud' && (
              <button
                type="button"
                onClick={() => { setAIMethod('local'); setStep('input'); setError(null); }}
                className="w-full flex items-center gap-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5 text-left hover:bg-primary/10 transition-colors"
              >
                <Icon icon={CpuIcon} className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-medium text-primary">Try Local AI instead</p>
                  <p className="text-[10px] text-muted-foreground">Runs in your browser — no API key needed</p>
                </div>
              </button>
            )}
            {aiMethod === 'local' && hasApiKey && (
              <button
                type="button"
                onClick={() => { setAIMethod('cloud'); setStep('input'); setError(null); }}
                className="w-full flex items-center gap-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5 text-left hover:bg-primary/10 transition-colors"
              >
                <Icon icon={AiCloud02Icon} className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-medium text-primary">Try Cloud AI instead</p>
                  <p className="text-[10px] text-muted-foreground">Uses your configured API key for better results</p>
                </div>
              </button>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleClose} className="active:scale-95">
                Cancel
              </Button>
              <Button size="sm" onClick={() => setStep('input')} className="active:scale-95">
                Try again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
