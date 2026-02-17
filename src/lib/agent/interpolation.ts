import { RunContext } from './run-context';

/**
 * Interpolate values into text using Mustache-style syntax {{ key }}
 */
export function interpolateText(text: string, context: RunContext): string {
  if (!text) return text;
  
  return text.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key) => {
    // Check for special prefixes
    if (key.startsWith('context.')) {
      const contextKey = key.replace('context.', '');
      const value = context.get(contextKey);
      return value !== undefined ? String(value) : match;
    }
    
    // Default to looking in context
    const value = context.get(key);
    return value !== undefined ? String(value) : match;
  });
}
