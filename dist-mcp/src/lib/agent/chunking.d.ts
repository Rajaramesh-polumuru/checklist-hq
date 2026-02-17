/**
 * Smart Prompt Chunking
 * Handles large checklists that may exceed context windows
 */
import type { ChecklistContent } from '@/types/database';
export interface ChunkResult {
    chunks: string[];
    currentChunk: number;
    totalChunks: number;
    metadata: {
        totalItems: number;
        itemsPerChunk: number[];
    };
}
/**
 * Split a checklist into logical chunks that fit within token budget
 * @param content - The checklist content to chunk
 * @param maxTokens - Maximum tokens per chunk (default: 2000)
 * @returns Chunked checklist with metadata
 */
export declare function chunkChecklist(content: ChecklistContent, maxTokens?: number): ChunkResult;
/**
 * Estimate total tokens for a checklist
 */
export declare function estimateChecklistTokens(content: ChecklistContent): number;
//# sourceMappingURL=chunking.d.ts.map