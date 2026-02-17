import { supabase } from '@/lib/supabase';
import type { Run, RunLink } from '@/types/database';
import { startRunFromLatestCommit } from './run';

/**
 * Spawn a sub-run from a parent run item
 */
export async function spawnSubRun(
  parentRunId: string,
  parentItemId: string,
  repoId: string,
  userId: string,
  _commitId?: string
): Promise<Run> {
  // 1. Create the new run
  // If commitId is provided, we should use it (TODO: update startRun logic to accept commitId)
  // For now, we default to latest commit which startRunFromLatestCommit does.
  // If we need pinning, we'd need a new function or update the existing one.
  const subRun = await startRunFromLatestCommit(repoId, userId);

  // 2. Create the link
  const { error } = await supabase
    .from('run_links')
    .insert({
      parent_run_id: parentRunId,
      child_run_id: subRun.id,
      parent_item_id: parentItemId,
    });

  if (error) {
    console.error('Error linking sub-run:', error);
    throw new Error('Failed to link sub-run');
  }

  return subRun;
}

/**
 * Get all sub-runs for a parent run
 */
export async function getSubRuns(parentRunId: string): Promise<RunLink[]> {
  const { data, error } = await supabase
    .from('run_links')
    .select('*')
    .eq('parent_run_id', parentRunId);

  if (error) throw error;
  return data || [];
}

/**
 * Get the parent run for a child run (if any)
 */
export async function getParentRunLink(childRunId: string): Promise<RunLink | null> {
  const { data, error } = await supabase
    .from('run_links')
    .select('*')
    .eq('child_run_id', childRunId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
  return data || null;
}

/**
 * Check if an item has an active sub-run
 */
export async function getSubRunForItem(parentRunId: string, itemId: string): Promise<RunLink | null> {
  const { data, error } = await supabase
    .from('run_links')
    .select('*')
    .eq('parent_run_id', parentRunId)
    .eq('parent_item_id', itemId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}
