/**
 * Parse Document Utility
 * Converts raw text (SOPs, documents, notes) into structured checklist JSON
 */
import type { ChecklistContent } from '@/types/database';
export interface ParseDocumentOptions {
    provider: 'openai' | 'anthropic';
    model: string;
    apiKey: string;
    text: string;
    title?: string;
    description?: string;
}
export interface ParseDocumentResult {
    content: ChecklistContent;
    metadata: {
        provider: string;
        model: string;
        tokensUsed?: number;
        parseTime: number;
    };
}
/**
 * Parse a document into structured checklist content
 */
export declare function parseDocument(options: ParseDocumentOptions): Promise<ParseDocumentResult>;
/**
 * Preview helper: Convert ChecklistContent to readable text
 */
export declare function generatePreview(content: ChecklistContent): string;
//# sourceMappingURL=parse-document.d.ts.map