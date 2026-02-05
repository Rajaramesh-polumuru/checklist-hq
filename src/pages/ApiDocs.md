# Checklist HQ API Documentation

Welcome to the Checklist HQ API. You can use these endpoints to automate your workflows, trigger runs from CI/CD pipelines, or integrate with other tools.

## Authentication

We use **API Keys** for authentication. 
1. Go to **Settings > Integrations & API** in your dashboard.
2. Generate a new key.
3. Keep it secret!

*(Note: Direct REST API access is currently in beta. For client-side integrations, use the Supabase SDK)*

## Endpoints

### 1. List Repositories
Get a list of all checklists you have access to.

```typescript
const { data, error } = await supabase.rpc('api_list_repos')
```

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Deployment Checklist",
    "is_public": false,
    "updated_at": "2024-02-05T..."
  }
]
```

### 2. Start a Run
Trigger a new run for a specific checklist. Useful for CI/CD.

```typescript
const { data, error } = await supabase.rpc('api_create_run', {
  p_repo_id: 'uuid-of-repo',
  p_name: 'Automated Deploy Run #123'
})
```

**Response:**
```json
{
  "id": "run-uuid",
  "status": "active",
  "url": "/app/run/run-uuid"
}
```

---

*More endpoints coming soon.*
