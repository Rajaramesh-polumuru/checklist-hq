import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Icon } from '@/components/ui/icon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import Search01Icon from '@hugeicons/core-free-icons/Search01Icon'
import { addTeamMember } from '@/services/team'
import { getOrganizationMembers } from '@/services/organization'
import type { OrganizationMember } from '@/types/database'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

interface AddTeamMemberModalProps {
  teamId: string
  organizationId: string
  isOpen: boolean
  onClose: () => void
  onMemberAdded: () => void
}

export function AddTeamMemberModal({
  teamId,
  organizationId,
  isOpen,
  onClose,
  onMemberAdded,
}: AddTeamMemberModalProps) {
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [role, setRole] = useState<'maintainer' | 'member'>('member')
  const [loading, setLoading] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const { success, error: showError } = useToast()

  useEffect(() => {
    async function loadOrgMembers() {
      if (!isOpen) return
      setLoadingMembers(true)
      try {
        const members = await getOrganizationMembers(organizationId)
        setOrgMembers(members)
      } catch (err) {
        console.error('Failed to load organization members:', err)
      } finally {
        setLoadingMembers(false)
      }
    }
    loadOrgMembers()
  }, [organizationId, isOpen])

  const filteredMembers = orgMembers.filter(member =>
    member.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) return

    setLoading(true)
    try {
      await addTeamMember(teamId, selectedUserId, role)
      success('Member added to team')
      onMemberAdded()
      handleClose()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setSelectedUserId(null)
    setRole('member')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add an existing organization member to this team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Search Members */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Members</Label>
            <div className="relative">
              <Icon
                icon={Search01Icon}
                className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
              />
              <Input
                id="search"
                placeholder="Search by user ID..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loadingMembers}
              />
            </div>
          </div>

          {/* Member List */}
          <div className="space-y-2">
            <Label>Select Member</Label>
            <div className="border rounded-md max-h-48 overflow-y-auto">
              {loadingMembers ? (
                <div className="flex items-center justify-center p-8">
                  <Icon icon={Loading02Icon} className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {searchQuery ? 'No members found' : 'No members available'}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredMembers.map(member => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedUserId(member.user_id)}
                      className={cn(
                        "w-full p-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between",
                        selectedUserId === member.user_id && "bg-primary/10"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          User: {member.user_id.slice(0, 8)}...
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Org Role: {member.role}
                        </div>
                      </div>
                      {selectedUserId === member.user_id && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Team Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'maintainer' | 'member')}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">
                  <div>
                    <div className="font-medium">Member</div>
                    <div className="text-xs text-muted-foreground">Can access team repositories</div>
                  </div>
                </SelectItem>
                <SelectItem value="maintainer">
                  <div>
                    <div className="font-medium">Maintainer</div>
                    <div className="text-xs text-muted-foreground">Can manage team settings and members</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedUserId || loading}
              className="active:scale-95 transition-transform"
            >
              {loading ? (
                <>
                  <Icon icon={Loading02Icon} className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Member'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
