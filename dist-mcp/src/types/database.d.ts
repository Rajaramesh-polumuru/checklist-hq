export interface Repository {
    id: string;
    owner_id: string;
    title: string;
    description: string | null;
    is_public: boolean;
    origin_repo_id: string | null;
    upstream_repo_id: string | null;
    fork_count: number;
    created_at: string;
    updated_at: string;
    organization_id: string | null;
    owner_type?: 'user' | 'team' | 'org';
    team_id?: string | null;
}
export interface Commit {
    id: string;
    repo_id: string;
    content: ChecklistContent;
    message: string | null;
    parent_commit_id: string | null;
    created_at: string;
}
export interface Run {
    id: string;
    repo_id: string;
    commit_id: string;
    user_id?: string;
    progress: RunProgress;
    status: 'active' | 'paused' | 'completed' | 'archived';
    started_at: string;
    completed_at: string | null;
    name?: string | null;
    description?: string | null;
    paused_at?: string | null;
    total_active_time_seconds?: number;
    last_activity_at?: string;
    notes?: string | null;
    device_id?: string | null;
    device_name?: string | null;
    sync_version?: number;
    last_synced_at?: string;
    is_collaborative?: boolean;
    share_token?: string | null;
    share_expires_at?: string | null;
    team_id?: string | null;
    organization_id?: string | null;
    metadata?: Record<string, unknown>;
}
export interface RunLink {
    id: string;
    parent_run_id: string;
    child_run_id: string;
    parent_item_id: string;
    created_at: string;
}
export interface RunTimeSegment {
    id: string;
    run_id: string;
    started_at: string;
    ended_at: string | null;
    device_id?: string | null;
    device_name?: string | null;
}
export interface ChecklistItem {
    id: string;
    text: string;
    parent: string | null;
    order: number;
    type?: 'task' | 'header' | 'note' | 'ref';
    details?: string;
    ref_config?: {
        repo_id: string;
        commit_id?: string;
        title: string;
        input_mapping?: Record<string, string>;
        output_mapping?: Record<string, string>;
        execution_mode: 'inline' | 'spawn';
    };
    agent_config?: {
        action_type: 'manual' | 'browse' | 'api_call' | 'code' | 'approve';
        assignee?: 'human' | 'any_agent' | string;
        timeout_ms?: number;
        fallback_assignee?: 'human';
        enabled?: boolean;
        provider?: 'openai' | 'anthropic';
        model?: string;
        system_prompt?: string;
        input_schema?: {
            type: 'object';
            properties: Record<string, {
                type: 'string' | 'number' | 'boolean' | 'url';
                description: string;
                required?: boolean;
                default?: unknown;
            }>;
        };
        output_schema?: {
            type: 'object';
            properties: Record<string, {
                type: 'string' | 'number' | 'boolean' | 'json';
                description: string;
            }>;
        };
        verification?: {
            type: 'none' | 'human_review' | 'artifact' | 'assertion';
            artifact_type?: 'screenshot' | 'log' | 'file';
            assertion?: string;
        };
    };
}
export interface ChecklistContent {
    version: string;
    items: Record<string, ChecklistItem>;
}
export interface ItemProgress {
    completed: boolean;
    timestamp?: string;
    user_id?: string;
    note?: string;
    completed_by?: string;
    completed_by_type?: 'human' | 'agent';
    completed_by_name?: string;
    agent_output?: Record<string, unknown>;
    duration_ms?: number;
    attempt_count?: number;
    verification_status?: 'pending' | 'verified' | 'rejected';
    verified_by?: string;
    artifacts?: Array<{
        type: 'screenshot' | 'log' | 'file' | 'url';
        url: string;
        description: string;
    }>;
}
export type RunProgress = Record<string, ItemProgress>;
export interface Tag {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    category: string | null;
    color: string;
    icon: string | null;
    created_at: string;
}
export interface RepositoryTag {
    id: string;
    repository_id: string;
    tag_id: string;
    created_at: string;
}
export interface Organization {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    avatar_url: string | null;
    plan: 'free' | 'pro' | 'team' | 'enterprise';
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}
export interface OrganizationMember {
    id: string;
    organization_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    invited_by: string | null;
    invited_at: string | null;
    joined_at: string;
}
export interface OrganizationInsert {
    name: string;
    slug: string;
    description?: string | null;
}
export interface Team {
    id: string;
    organization_id: string;
    slug: string;
    name: string;
    description: string | null;
    visibility: 'visible' | 'secret';
    default_permission: 'read' | 'write' | 'admin';
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}
export interface TeamMember {
    id: string;
    team_id: string;
    user_id: string;
    role: 'maintainer' | 'member';
    added_at: string;
    added_by: string | null;
}
export interface RepositoryTeamAccess {
    id: string;
    repository_id: string;
    team_id: string;
    permission: 'read' | 'write' | 'admin';
    granted_at: string;
    granted_by: string | null;
}
export interface TeamInsert {
    organization_id: string;
    slug: string;
    name: string;
    description?: string | null;
    visibility?: 'visible' | 'secret';
    default_permission?: 'read' | 'write' | 'admin';
    settings?: Record<string, unknown>;
}
export interface TeamUpdate {
    slug?: string;
    name?: string;
    description?: string | null;
    visibility?: 'visible' | 'secret';
    default_permission?: 'read' | 'write' | 'admin';
    settings?: Record<string, unknown>;
}
export type AgentType = 'claude' | 'custom' | 'webhook';
export interface Agent {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    agent_type: AgentType;
    capabilities: string[] | null;
    api_key_hash: string | null;
    created_by: string;
    created_at: string;
    last_active_at: string | null;
}
export interface AgentTeamMembership {
    agent_id: string;
    team_id: string;
    permissions: Record<string, unknown> | null;
    created_at: string;
}
export interface AgentInsert {
    organization_id: string;
    name: string;
    description?: string | null;
    agent_type: AgentType;
    capabilities?: string[] | null;
    api_key_hash?: string | null;
}
export interface AgentUpdate {
    name?: string;
    description?: string | null;
    capabilities?: string[] | null;
}
export interface RepositoryWithTags extends Repository {
    tags?: Tag[];
}
export interface RepositoryInsert {
    owner_id: string;
    title: string;
    description?: string | null;
    is_public?: boolean;
    origin_repo_id?: string | null;
    upstream_repo_id?: string | null;
    organization_id?: string | null;
    owner_type?: 'user' | 'team' | 'org';
    team_id?: string | null;
}
export interface CommitInsert {
    repo_id: string;
    content: ChecklistContent;
    message?: string | null;
    parent_commit_id?: string | null;
}
export interface RunInsert {
    repo_id: string;
    commit_id: string;
    user_id?: string;
    progress?: RunProgress;
    status?: 'active' | 'paused' | 'completed' | 'archived';
    name?: string | null;
    description?: string | null;
    device_id?: string | null;
    device_name?: string | null;
    team_id?: string | null;
    organization_id?: string | null;
    metadata?: Record<string, unknown>;
}
export interface RepositoryUpdate {
    title?: string;
    description?: string | null;
    is_public?: boolean;
    organization_id?: string | null;
}
export interface RunUpdate {
    progress?: RunProgress;
    status?: 'active' | 'paused' | 'completed' | 'archived';
    completed_at?: string | null;
    name?: string | null;
    description?: string | null;
    paused_at?: string | null;
    total_active_time_seconds?: number;
    last_activity_at?: string;
    notes?: string | null;
    device_id?: string | null;
    device_name?: string | null;
    metadata?: Record<string, unknown>;
}
export interface RunTimeSegmentInsert {
    run_id: string;
    started_at?: string;
    device_id?: string | null;
    device_name?: string | null;
}
export type NotificationType = 'run_completed' | 'run_failed' | 'run_assigned' | 'mention' | 'comment' | 'team_invite' | 'org_invite' | 'repo_shared' | 'repo_forked' | 'system';
export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    message: string | null;
    action_url: string | null;
    resource_type: string | null;
    resource_id: string | null;
    read_at: string | null;
    archived_at: string | null;
    created_at: string;
}
export type ActivityActorType = 'human' | 'agent' | 'system';
export interface Activity {
    id: string;
    organization_id: string | null;
    team_id: string | null;
    actor_id: string;
    actor_type: ActivityActorType;
    action: string;
    resource_type: string;
    resource_id: string;
    resource_name: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
}
export interface NotificationInsert {
    user_id: string;
    type: NotificationType;
    title: string;
    message?: string | null;
    action_url?: string | null;
    resource_type?: string | null;
    resource_id?: string | null;
}
export interface ActivityInsert {
    organization_id?: string | null;
    team_id?: string | null;
    actor_id: string;
    actor_type?: ActivityActorType;
    action: string;
    resource_type: string;
    resource_id: string;
    resource_name?: string | null;
    metadata?: Record<string, unknown>;
}
export interface MarketplaceListing {
    id: string;
    repo_id: string;
    commit_id: string | null;
    publisher_id: string;
    organization_id: string | null;
    title: string;
    description: string | null;
    short_description: string | null;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
    estimated_duration: string | null;
    agent_compatibility: string[] | null;
    install_count: number;
    fork_count: number;
    rating_avg: number;
    rating_count: number;
    status: 'draft' | 'pending_review' | 'published' | 'featured' | 'deprecated';
    published_at: string | null;
    created_at: string;
    updated_at: string;
}
export interface Database {
    public: {
        Tables: {
            repositories: {
                Row: Repository;
                Insert: RepositoryInsert;
                Update: RepositoryUpdate;
            };
            commits: {
                Row: Commit;
                Insert: CommitInsert;
                Update: never;
            };
            runs: {
                Row: Run;
                Insert: RunInsert;
                Update: RunUpdate;
            };
            run_time_segments: {
                Row: RunTimeSegment;
                Insert: RunTimeSegmentInsert;
                Update: {
                    ended_at?: string | null;
                };
            };
            tags: {
                Row: Tag;
                Insert: never;
                Update: never;
            };
            repository_tags: {
                Row: RepositoryTag;
                Insert: {
                    repository_id: string;
                    tag_id: string;
                };
                Update: never;
            };
            organizations: {
                Row: Organization;
                Insert: OrganizationInsert;
                Update: Partial<Omit<OrganizationInsert, 'slug'>>;
            };
            organization_members: {
                Row: OrganizationMember;
                Insert: Omit<OrganizationMember, 'id' | 'joined_at' | 'invited_at'>;
                Update: Pick<OrganizationMember, 'role'>;
            };
            teams: {
                Row: Team;
                Insert: TeamInsert;
                Update: TeamUpdate;
            };
            team_members: {
                Row: TeamMember;
                Insert: Omit<TeamMember, 'id' | 'added_at'>;
                Update: Pick<TeamMember, 'role'>;
            };
            repository_team_access: {
                Row: RepositoryTeamAccess;
                Insert: Omit<RepositoryTeamAccess, 'id' | 'granted_at'>;
                Update: Pick<RepositoryTeamAccess, 'permission'>;
            };
        };
    };
}
//# sourceMappingURL=database.d.ts.map