import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Mail, ShieldAlert } from 'lucide-react'
import { addMemberByEmail } from '@/services/organization'

interface InviteMemberModalProps {
  organizationId: string
  isOpen: boolean
  onClose: () => void
  onMemberAdded: () => void
}

export function InviteMemberModal({ organizationId, isOpen, onClose, onMemberAdded }: InviteMemberModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setEmail('')
      setRole('member')
      setError(null)
      setSuccess(null)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await addMemberByEmail(organizationId, email, role)
      
      if (result.success) {
        setSuccess(`Successfully added ${email}`)
        onMemberAdded()
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setError(result.message || 'Failed to add member')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm flex gap-2 items-start">
            <Mail className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              Since this is a demo, enter the <strong>email address</strong> of an existing registered user to add them immediately.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email Address</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="font-medium">Admin</div>
                  <div className="text-xs text-muted-foreground">Can manage members & settings</div>
                </SelectItem>
                <SelectItem value="member">
                  <div className="font-medium">Member</div>
                  <div className="text-xs text-muted-foreground">Can edit & run checklists</div>
                </SelectItem>
                <SelectItem value="viewer">
                  <div className="font-medium">Viewer</div>
                  <div className="text-xs text-muted-foreground">Read-only access</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex gap-2 items-center">
              <ShieldAlert className="h-4 w-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
              {success}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !!success}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
