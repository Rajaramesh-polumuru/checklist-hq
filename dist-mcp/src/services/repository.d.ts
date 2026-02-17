import type { Repository, RepositoryInsert, RepositoryUpdate, Commit, CommitInsert, ChecklistContent, Tag, RepositoryWithTags } from '@/types/database';
export declare function createRepository(data: RepositoryInsert): Promise<Repository>;
export declare function getRepository(id: string): Promise<Repository | null>;
export declare function getUserRepositories(userId: string): Promise<RepositoryWithTags[]>;
export declare function getOrganizationRepositories(orgId: string): Promise<RepositoryWithTags[]>;
export declare function updateRepository(id: string, updates: RepositoryUpdate): Promise<Repository>;
export declare function deleteRepository(id: string): Promise<void>;
export declare function createCommit(data: CommitInsert): Promise<Commit>;
export declare function getLatestCommit(repoId: string): Promise<Commit | null>;
export declare function getCommitHistory(repoId: string): Promise<Commit[]>;
export declare function getCommit(commitId: string): Promise<Commit | null>;
/**
 * Restore a repository to a specific commit version
 * Creates a new commit with the content from the specified commit
 */
export declare function restoreToCommit(params: {
    repoId: string;
    commitId: string;
    latestCommitId?: string;
}): Promise<Commit>;
/**
 * Create a new repository with an initial commit
 */
export declare function createRepositoryWithCommit(params: {
    ownerId: string;
    title: string;
    description?: string;
    isPublic?: boolean;
    content: ChecklistContent;
    message?: string;
}): Promise<{
    repository: Repository;
    commit: Commit;
}>;
/**
 * Save changes to a repository (creates a new commit)
 */
export declare function saveRepositoryChanges(params: {
    repoId: string;
    content: ChecklistContent;
    message?: string;
    parentCommitId?: string;
}): Promise<Commit>;
/**
 * Fork a repository (uses the database function)
 */
export declare function forkRepository(params: {
    sourceRepoId: string;
    newOwnerId: string;
    newTitle?: string;
}): Promise<string>;
/**
 * Fork a repository to a team (creates a team-owned repository)
 * This creates a fork that belongs to the team's organization
 */
export declare function forkRepositoryToTeam(params: {
    sourceRepoId: string;
    targetTeamId: string;
    newTitle?: string;
}): Promise<string>;
export declare function getPublicRepositories(params?: {
    limit?: number;
    offset?: number;
    orderBy?: 'fork_count' | 'created_at' | 'updated_at';
}): Promise<Repository[]>;
export declare function searchPublicRepositories(query: string): Promise<Repository[]>;
/**
 * Get all available tags
 */
export declare function getAllTags(): Promise<Tag[]>;
/**
 * Get tags grouped by category
 */
export declare function getTagsByCategory(): Promise<Record<string, Tag[]>>;
/**
 * Get tags for a specific repository
 */
export declare function getRepositoryTags(repoId: string): Promise<Tag[]>;
/**
 * Get public repositories with their tags
 */
export declare function getPublicRepositoriesWithTags(params?: {
    limit?: number;
    offset?: number;
    orderBy?: 'fork_count' | 'created_at' | 'updated_at';
    tagSlug?: string;
}): Promise<RepositoryWithTags[]>;
/**
 * Search public repositories with tags
 */
export declare function searchPublicRepositoriesWithTags(query: string): Promise<RepositoryWithTags[]>;
/**
 * Add a tag to a repository (for future use when users can tag their repos)
 */
export declare function addTagToRepository(repoId: string, tagId: string): Promise<void>;
/**
 * Remove a tag from a repository
 */
export declare function removeTagFromRepository(repoId: string, tagId: string): Promise<void>;
export interface RepositoryTeamAccessWithDetails {
    id: string;
    repository_id: string;
    team_id: string;
    permission: 'read' | 'write' | 'admin';
    team: {
        id: string;
        name: string;
        slug: string;
    };
}
/**
 * Get teams with access to a repository
 */
export declare function getRepositoryTeams(repoId: string): Promise<RepositoryTeamAccessWithDetails[]>;
/**
 * Grant team access to a repository
 */
export declare function addTeamAccess(repoId: string, teamId: string, permission: 'read' | 'write' | 'admin'): Promise<void>;
/**
 * Update team access permission
 */
export declare function updateTeamAccess(repoId: string, teamId: string, permission: 'read' | 'write' | 'admin'): Promise<void>;
/**
 * Remove team access from a repository
 */
export declare function removeTeamAccess(repoId: string, teamId: string): Promise<void>;
//# sourceMappingURL=repository.d.ts.map