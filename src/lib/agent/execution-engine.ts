import type { ChecklistItem } from '@/types/database';
import { useAgentSettingsStore } from '@/stores/agent-settings-store';

export type Provider = 'openai' | 'anthropic';

export interface ExecutionResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class AgentExecutionEngine {
  private openaiKey: string | null = null;
  private anthropicKey: string | null = null;

  constructor() {
    // Load keys from unified zustand store
    const state = useAgentSettingsStore.getState();
    this.openaiKey = state.openaiApiKey;
    this.anthropicKey = state.anthropicApiKey;
  }

  /**
   * Execute a single checklist item
   */
  async executeItem(
    item: ChecklistItem,
    context: string // Previous context or relevant info
  ): Promise<ExecutionResult> {
    const config = item.agent_config;
    if (!config) {
      return { success: false, error: 'No agent configuration found for item' };
    }

    const provider = config.provider || 'openai';
    const model = config.model || (provider === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20240620');

    // Check for API key
    if (provider === 'openai' && !this.openaiKey) {
      return { success: false, error: 'OpenAI API key not found. Please add it in Settings.' };
    }
    if (provider === 'anthropic' && !this.anthropicKey) {
      return { success: false, error: 'Anthropic API key not found. Please add it in Settings.' };
    }

    try {
      // Construct prompt
      const systemPrompt = config.system_prompt || 
        'You are an expert autonomous agent executing a checklist step.';
      
      const userPrompt = this.constructPrompt(item, context);

      // Call Provider
      if (provider === 'openai') {
        return await this.callOpenAI(model, systemPrompt, userPrompt, config.output_schema);
      } else {
        return await this.callAnthropic(model, systemPrompt, userPrompt, config.output_schema);
      }

    } catch (error) {
      console.error('Agent execution error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown execution error' 
      };
    }
  }

  /**
   * Construct the prompt for the LLM
   */
  private constructPrompt(item: ChecklistItem, context: string): string {
    let prompt = `TASK: ${item.text}\n`;
    if (item.details) {
      prompt += `DETAILS: ${item.details}\n`;
    }
    
    prompt += `\nCONTEXT:\n${context}\n`;

    if (item.agent_config?.input_schema) {
      prompt += `\nINPUTS NEEDED: The task requires specific inputs described by this schema: ${JSON.stringify(item.agent_config.input_schema)}\n`;
    }

    if (item.agent_config?.output_schema) {
      prompt += `\nOUTPUT FORMAT: You must return a JSON object matching this schema: ${JSON.stringify(item.agent_config.output_schema)}\n`;
      prompt += `IMPORTANT: Return ONLY the raw JSON object. No markdown formatting, no explanations outside the JSON.\n`;
    }

    return prompt;
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(
    model: string, 
    systemPrompt: string, 
    userPrompt: string,
    outputSchema?: any
  ): Promise<ExecutionResult> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: outputSchema ? { type: 'json_object' } : undefined,
        temperature: 0.2, // Low temperature for execution reliability
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const usage = data.usage;

    let output = {};
    if (outputSchema) {
      try {
        output = JSON.parse(content);
        // ideally validate against schema here with Zod, skipping for brevity/perf
      } catch (e) {
        return { success: false, error: 'Failed to parse JSON output from agent' };
      }
    } else {
      output = { result: content };
    }

    return {
      success: true,
      output,
      usage
    };
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(
    model: string, 
    systemPrompt: string, 
    userPrompt: string,
    outputSchema?: any
  ): Promise<ExecutionResult> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicKey!,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true' // Client-side call
      },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4096,
        temperature: 0.2,
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API Error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    let output = {};
    if (outputSchema) {
      try {
        // Claude might wrap in markdown, simple strip
        const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
        output = JSON.parse(jsonStr);
      } catch (e) {
        // Fallback: try finding JSON-like structure
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            output = JSON.parse(match[0]);
          } catch {
            return { success: false, error: 'Failed to parse JSON output from agent' };
          }
        } else {
           return { success: false, error: 'Failed to parse JSON output from agent' };
        }
      }
    } else {
      output = { result: content };
    }

    return {
      success: true,
      output,
      usage: {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: data.usage.input_tokens + data.usage.output_tokens
      }
    };
  }
}
