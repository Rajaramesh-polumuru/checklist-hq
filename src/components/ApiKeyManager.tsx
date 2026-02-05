import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Key, Trash2, Copy, Check, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'


interface ApiKey {
  id: string
  name: string
  key_prefix: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null) // Only shown once
  const [copied, setCopied] = useState(false)

  const loadKeys = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .is('revoked_at', null) // Only active keys
      .order('created_at', { ascending: false })

    if (data) setKeys(data)
    setLoading(false)
  }

  useEffect(() => {
    loadKeys()
  }, [])

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName) return

    setCreating(true)
    // Generate a key on client (in production, use Edge Function!)
    // Format: sk_live_<random32chars>
    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0')).join('')
    const secretKey = `sk_live_${randomPart}`
    const prefix = secretKey.slice(0, 12) + '...'

    // In a real app, you'd hash this before sending.
    // For MVP, we're storing a placeholder hash logic (simple sha256)
    const encoder = new TextEncoder()
    const data = encoder.encode(secretKey)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const { error } = await supabase.from('api_keys').insert({
      name: newKeyName,
      key_prefix: prefix,
      key_hash: hashHex, // Storing hash
    })

    if (!error) {
      setNewKeySecret(secretKey) // Show full key to user
      loadKeys()
      setNewKeyName('')
    }
    setCreating(false)
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure? This will immediately disable this API key.')) return

    await supabase
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)

    loadKeys()
  }

  const copyToClipboard = () => {
    if (newKeySecret) {
      navigator.clipboard.writeText(newKeySecret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage access tokens for scripts and integrations.
          </p>
        </div>
      </div>

      {/* Create New Key Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleCreateKey} className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">New Key Name</label>
              <Input
                placeholder="e.g. CI/CD Pipeline, Zapier"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={!newKeyName || creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Generate Key
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* New Key Success Modal/Banner */}
      {newKeySecret && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">API Key Generated</h3>
              <p className="text-sm text-green-700 mt-1 mb-3">
                Copy this key now. You won't be able to see it again!
              </p>

              <div className="flex items-center gap-2">
                <Input
                  value={newKeySecret}
                  readOnly
                  className="font-mono text-sm bg-white border-green-200"
                />
                <Button variant="outline" onClick={copyToClipboard} className="shrink-0 bg-white">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keys List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-muted/10 border-dashed">
            <Key className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
            <p className="text-muted-foreground">No active API keys found.</p>
          </div>
        ) : (
          keys.map(key => (
            <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{key.name}</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {key.key_prefix}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Created {new Date(key.created_at).toLocaleDateString()}
                  {key.last_used_at && ` • Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => handleRevoke(key.id)}
                title="Revoke Key"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
