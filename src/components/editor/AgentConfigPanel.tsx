/**
 * Agent Config Panel
 * UI for configuring agent execution settings on a checklist item
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import {
  BrainIcon,
  PlusSignIcon,
  Delete02Icon,
  ChevronDown,
  ChevronUp,
} from '@hugeicons/core-free-icons';

interface AgentConfigPanelProps {
  value: any; // agent_config object
  onChange: (config: any) => void;
  onClose?: () => void;
}

export function AgentConfigPanel({ value, onChange, onClose }: AgentConfigPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const config = value || {};

  const updateConfig = (updates: any) => {
    onChange({ ...config, ...updates });
  };

  const addInputField = () => {
    const currentProps = config.input_schema?.properties || {};
    const newFieldName = `field_${Object.keys(currentProps).length + 1}`;
    
    updateConfig({
      input_schema: {
        type: 'object',
        properties: {
          ...currentProps,
          [newFieldName]: {
            type: 'string',
            description: '',
            required: false,
          },
        },
      },
    });
  };

  const removeInputField = (fieldName: string) => {
    const currentProps = { ...(config.input_schema?.properties || {}) };
    delete currentProps[fieldName];
    
    updateConfig({
      input_schema: {
        type: 'object',
        properties: currentProps,
      },
    });
  };

  const updateInputField = (fieldName: string, updates: any) => {
    const currentProps = config.input_schema?.properties || {};
    
    updateConfig({
      input_schema: {
        type: 'object',
        properties: {
          ...currentProps,
          [fieldName]: {
            ...currentProps[fieldName],
            ...updates,
          },
        },
      },
    });
  };

  const addOutputField = () => {
    const currentProps = config.output_schema?.properties || {};
    const newFieldName = `output_${Object.keys(currentProps).length + 1}`;
    
    updateConfig({
      output_schema: {
        type: 'object',
        properties: {
          ...currentProps,
          [newFieldName]: {
            type: 'string',
            description: '',
          },
        },
      },
    });
  };

  const removeOutputField = (fieldName: string) => {
    const currentProps = { ...(config.output_schema?.properties || {}) };
    delete currentProps[fieldName];
    
    updateConfig({
      output_schema: {
        type: 'object',
        properties: currentProps,
      },
    });
  };

  const updateOutputField = (fieldName: string, updates: any) => {
    const currentProps = config.output_schema?.properties || {};
    
    updateConfig({
      output_schema: {
        type: 'object',
        properties: {
          ...currentProps,
          [fieldName]: {
            ...currentProps[fieldName],
            ...updates,
          },
        },
      },
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-purple-600 transition-colors"
      >
        <Icon icon={BrainIcon} className="h-4 w-4" />
        <span>Configure agent execution</span>
        <Icon icon={ChevronDown} className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 space-y-4 mt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon icon={BrainIcon} className="h-4 w-4 text-purple-600" />
          <h4 className="text-sm font-medium text-purple-600">Agent Configuration</h4>
          <Badge variant="outline" className="border-purple-500/30 text-purple-600 text-xs">
            Advanced
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Icon icon={ChevronUp} className="h-4 w-4" />
          </button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 text-xs"
            >
              Clear Config
            </Button>
          )}
        </div>
      </div>

      {/* Action Type */}
      <div className="space-y-2">
        <Label htmlFor="action-type" className="text-xs font-medium text-muted-foreground">
          Action Type
        </Label>
        <Select
          value={config.action_type || 'manual'}
          onValueChange={(value) => updateConfig({ action_type: value })}
        >
          <SelectTrigger id="action-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual (Human)</SelectItem>
            <SelectItem value="browse">Browse (Web)</SelectItem>
            <SelectItem value="api_call">API Call</SelectItem>
            <SelectItem value="code">Code Execution</SelectItem>
            <SelectItem value="approve">Approval Required</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assignee */}
      <div className="space-y-2">
        <Label htmlFor="assignee" className="text-xs font-medium text-muted-foreground">
          Assignee
        </Label>
        <Select
          value={config.assignee || 'human'}
          onValueChange={(value) => updateConfig({ assignee: value })}
        >
          <SelectTrigger id="assignee">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="human">Human</SelectItem>
            <SelectItem value="any_agent">Any Agent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeout */}
      <div className="space-y-2">
        <Label htmlFor="timeout" className="text-xs font-medium text-muted-foreground">
          Timeout (milliseconds)
        </Label>
        <Input
          id="timeout"
          type="number"
          value={config.timeout_ms || ''}
          onChange={(e) => updateConfig({ timeout_ms: parseInt(e.target.value) || undefined })}
          placeholder="30000"
          className="text-sm"
        />
      </div>

      {/* Input Schema */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Input Schema (Expected Data)
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={addInputField}
            className="h-7 text-xs"
          >
            <Icon icon={PlusSignIcon} className="h-3 w-3 mr-1" />
            Add Field
          </Button>
        </div>
        
        {Object.entries(config.input_schema?.properties || {}).map(([fieldName, field]: [string, any]) => (
          <div key={fieldName} className="bg-background border border-border rounded p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={fieldName}
                onChange={() => {
                  // Rename field (complex - skip for now)
                }}
                placeholder="Field name"
                className="text-sm font-mono flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeInputField(fieldName)}
                className="h-8 w-8 p-0"
              >
                <Icon icon={Delete02Icon} className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            
            <Select
              value={field.type || 'string'}
              onValueChange={(value) => updateInputField(fieldName, { type: value })}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="url">URL</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              value={field.description || ''}
              onChange={(e) => updateInputField(fieldName, { description: e.target.value })}
              placeholder="Description"
              className="text-sm"
            />
          </div>
        ))}
      </div>

      {/* Output Schema */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Output Schema (Produced Data)
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={addOutputField}
            className="h-7 text-xs"
          >
            <Icon icon={PlusSignIcon} className="h-3 w-3 mr-1" />
            Add Field
          </Button>
        </div>
        
        {Object.entries(config.output_schema?.properties || {}).map(([fieldName, field]: [string, any]) => (
          <div key={fieldName} className="bg-background border border-border rounded p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={fieldName}
                placeholder="Field name"
                className="text-sm font-mono flex-1"
                disabled
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeOutputField(fieldName)}
                className="h-8 w-8 p-0"
              >
                <Icon icon={Delete02Icon} className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            
            <Select
              value={field.type || 'string'}
              onValueChange={(value) => updateOutputField(fieldName, { type: value })}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              value={field.description || ''}
              onChange={(e) => updateOutputField(fieldName, { description: e.target.value })}
              placeholder="Description"
              className="text-sm"
            />
          </div>
        ))}
      </div>

      {/* Verification */}
      <div className="space-y-2">
        <Label htmlFor="verification" className="text-xs font-medium text-muted-foreground">
          Verification
        </Label>
        <Select
          value={config.verification?.type || 'none'}
          onValueChange={(value) => updateConfig({
            verification: {
              ...config.verification,
              type: value,
            },
          })}
        >
          <SelectTrigger id="verification">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (Auto-complete)</SelectItem>
            <SelectItem value="human_review">Human Review Required</SelectItem>
            <SelectItem value="artifact">Artifact Required</SelectItem>
            <SelectItem value="assertion">Assertion Check</SelectItem>
          </SelectContent>
        </Select>
        
        {config.verification?.type === 'assertion' && (
          <Textarea
            value={config.verification?.assertion || ''}
            onChange={(e) => updateConfig({
              verification: {
                ...config.verification,
                assertion: e.target.value,
              },
            })}
            placeholder="output.status_code === 200"
            className="text-sm font-mono"
            rows={2}
          />
        )}
      </div>
    </div>
  );
}
