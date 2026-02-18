import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { searchPublicRepositories, getUserRepositories } from '@/services/repository';
import type { Repository } from '@/types/database';
import { Icon } from '@/components/ui/icon';
import Link01Icon from '@hugeicons/core-free-icons/Link01Icon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import Search01Icon from '@hugeicons/core-free-icons/Search01Icon'
import Globe02Icon from '@hugeicons/core-free-icons/Globe02Icon'
import LockKeyIcon from '@hugeicons/core-free-icons/LockKeyIcon'
import { useAuthStore } from '@/stores/auth-store';
import { useDebounce } from '@/hooks/useDebounce';

interface InsertRefModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (config: {
    repoId: string;
    title: string;
    executionMode: 'inline' | 'spawn';
  }) => void;
}

export function InsertRefModal({ open, onOpenChange, onInsert }: InsertRefModalProps) {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [executionMode, setExecutionMode] = useState<'inline' | 'spawn'>('spawn');

  // Load user repos initially
  useEffect(() => {
    if (open && user) {
      loadUserRepos();
    }
  }, [open, user]);

  // Search when query changes
  useEffect(() => {
    if (!open) return;
    
    if (debouncedSearch) {
      handleSearch(debouncedSearch);
    } else if (user) {
      loadUserRepos();
    }
  }, [debouncedSearch, open, user]);

  const loadUserRepos = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // We get RepositoryWithTags but we can treat as Repository for this
      const userRepos = await getUserRepositories(user.id);
      setRepos(userRepos);
    } catch (error) {
      console.error('Error loading repos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      // TODO: Combine user repos search and public repos search properly
      // For now, searching public repos
      const results = await searchPublicRepositories(query);
      setRepos(results);
    } catch (error) {
      console.error('Error searching repos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (!selectedRepo) return;
    
    onInsert({
      repoId: selectedRepo.id,
      title: selectedRepo.title,
      executionMode,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link Sub-Checklist</DialogTitle>
          <DialogDescription>
            Reference another checklist to run as a step in this process.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative">
            <Icon icon={Search01Icon} className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search checklists..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="h-[200px] overflow-y-auto border rounded-md p-2 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Icon icon={Loading02Icon} className="h-5 w-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : repos.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No checklists found
              </div>
            ) : (
              repos.map(repo => (
                <button
                  key={repo.id}
                  className={`w-full text-left p-2 rounded text-sm flex items-center justify-between ${
                    selectedRepo?.id === repo.id ? 'bg-primary/10 border-primary/20 border' : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedRepo(repo)}
                >
                  <span className="truncate font-medium">{repo.title}</span>
                  {repo.is_public ? (
                    <Icon icon={Globe02Icon} className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Icon icon={LockKeyIcon} className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              ))
            )}
          </div>

          {selectedRepo && (
            <div className="space-y-3 pt-2">
              <Label>Execution Mode</Label>
              <RadioGroup value={executionMode} onValueChange={(v) => setExecutionMode(v as any)}>
                <div className="flex items-start space-x-2 border p-3 rounded-md">
                  <RadioGroupItem value="spawn" id="mode-spawn" className="mt-1" />
                  <div className="grid gap-1.5">
                    <Label htmlFor="mode-spawn" className="font-medium cursor-pointer">
                      Spawn Sub-Run (Recommended)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Creates a separate, tracked run. Best for long processes.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 border p-3 rounded-md opacity-50 cursor-not-allowed">
                  <RadioGroupItem value="inline" id="mode-inline" disabled className="mt-1" />
                  <div className="grid gap-1.5">
                    <Label htmlFor="mode-inline" className="font-medium">
                      Inline Expansion (Coming Soon)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Merges steps directly into this checklist.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleInsert} disabled={!selectedRepo}>
            <Icon icon={Link01Icon} className="mr-2 h-4 w-4" />
            Insert Reference
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
