import { ApiKeyManager } from '@/components/ApiKeyManager'

export function Profile() {
  const { user, signOut } = useAuthStore()
  // ... existing code ...

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <Tabs defaultValue="profile">
        <TabsList className="mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="integrations">Integrations & API</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
           {/* Existing Profile Form */}
           {/* ... */}
        </TabsContent>
        
        <TabsContent value="integrations">
          <div className="space-y-8">
            <ApiKeyManager />
            {/* Future: Webhooks Manager */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
