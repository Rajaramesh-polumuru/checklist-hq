import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Users, Shield, Globe, Lock } from 'lucide-react'
import { createTeam, isSlugAvailable } from '@/services/organization' // We might need to implement team slug check
import { useDebounce } from '@/hooks/useDebounce'

interface CreateTeamModalProps {
  organizationId: string
  isOpen: boolean
  onClose: () => void
  onTeamCreated: () => void
}

export function CreateTeamModal({ organizationId, isOpen, onClose, onTeamCreated }: CreateTeamModalProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'visible' | 'secret'>('visible')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setName('')
      setSlug('')
      setDescription('')
      setVisibility('visible')
      setError(null)
    }
  }, [isOpen])

  // Auto-generate slug
  useEffect(() => {
    if (name && !slug) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }, [name])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !slug) return

    setLoading(true)
    setError(null)

    try {
      await createTeam({
        organizationId,
        name,
        slug,
        description,
        visibility
      })
      onTeamCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Team Name</label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="slug" className="text-sm font-medium">Team Slug</label>
            <div className="flex items-center">
              <span className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-sm text-muted-foreground">
                /teams/
              </span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="rounded-l-none"
                placeholder="engineering"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this team for?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Visibility</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setVisibility('visible')}
                className={`p-3 rounded-lg border flex flex-col items-center gap-2 text-center transition-colors ${
                  visibility === 'visible' 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'hover:bg-muted'
                }`}
              >
                <Users className="h-5 w-5" />
                <div>
                  <div className="font-medium text-sm">Visible</div>
                  <div className="text-[10px] opacity-70">Visible to all org members</div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setVisibility('secret')}
                className={`p-3 rounded-lg border flex flex-col items-center gap-2 text-center transition-colors ${
                  visibility === 'secret' 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'hover:bg-muted'
                }`}
              >
                <Shield className="h-5 w-5" />
                <div>
                  <div className="font-medium text-sm">Secret</div>
                  <div className="text-[10px] opacity-70">Only visible to members</div>
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
