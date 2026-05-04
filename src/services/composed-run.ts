import { supabase } from '@/lib/supabase';
import type { Run, RunLink } from '@/types/database';
import {
  createRun,
  getDeviceId,
  getDeviceName,
  startTimeSegment,
} from './run';

/**
 * Spawn a sub-run from a parent run item.
 *
 * If `commitId` is provided, the sub-run is pinned to that exact commit so the
 * sub-checklist content stays stable for the duration of the run (the same
 * "pinned at start" invariant runs of top-level repos use). If omitted, falls
 * back to the latest commit of the target repo.
 *
 * The sub-run row + run_links row are created in sequence; if linking fails the
 * sub-run row is deleted so we don't leak orphaned runs into the user's history.
 */
export async function spawnSubRun(
  parentRunId: string,
  parentItemId: string,
  repoId: string,
  userId: string,
  commitId?: string
): Promise<Run> {
  // 1. Resolve the commit to pin to.
  let pinnedCommitId = commitId;
  if (!pinnedCommitId) {
    const { data: latest, error: commitError } = await supabase
      .from('commits')
      .select('id')
      .eq('repo_id', repoId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (commitError) {
      if (commitError.code === 'PGRST116') {
        throw new Error('No commits found for this sub-checklist');
      }
      throw commitError;
    }
    pinnedCommitId = (latest as { id: string }).id;
  }

  // 2. Create the run pinned to that commit.
  const subRun = await createRun({
    repo_id: repoId,
    commit_id: pinnedCommitId,
    user_id: userId,
    progress: {},
    status: 'active',
    device_id: getDeviceId(),
    device_name: getDeviceName(),
  });

  // 3. Start initial time segment (mirrors startRunFromLatestCommit).
  try {
    await startTimeSegment(subRun.id);
  } catch (err) {
    console.error('Failed to start time segment for sub-run:', err);
    // Non-fatal — duration tracking will be missing the first segment.
  }

  // 4. Link parent → child. If this fails, roll back the sub-run row so we
  // don't orphan it (no UI path to find a sub-run without the parent link).
  const { error } = await supabase
    .from('run_links')
    .insert({
      parent_run_id: parentRunId,
      child_run_id: subRun.id,
      parent_item_id: parentItemId,
    });

  if (error) {
    console.error('Error linking sub-run, rolling back:', error);
    const { error: cleanupError } = await supabase
      .from('runs')
      .delete()
      .eq('id', subRun.id);
    if (cleanupError) {
      console.error('Failed to roll back orphaned sub-run:', cleanupError);
    }
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
