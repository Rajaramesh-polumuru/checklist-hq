import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import MoreVerticalCircle01Icon from '@hugeicons/core-free-icons/MoreVerticalCircle01Icon'
import UserGroupIcon from '@hugeicons/core-free-icons/UserGroupIcon'
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon'
import ArrowUp01Icon from '@hugeicons/core-free-icons/ArrowUp01Icon'
import ArrowDown01Icon from '@hugeicons/core-free-icons/ArrowDown01Icon'
import User02Icon from '@hugeicons/core-free-icons/User02Icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RoleBadge } from '@/components/ui/role-badge'
import { removeTeamMember, updateTeamMemberRole, type TeamMemberWithUser } from '@/services/team'
import { useToast } from '@/hooks/useToast'

interface TeamMemberListProps {
  members: TeamMemberWithUser[]
  onRefresh: () => void
  teamId: string
}

export function TeamMemberList({ members, onRefresh, teamId }: TeamMemberListProps) {
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [memberToRemove, setMemberToRemove] = useState<TeamMemberWithUser | null>(null)
  const [loading, setLoading] = useState(false)
  const { success, error: showError } = useToast()

  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    setLoading(true)
    try {
      await removeTeamMember(teamId, memberToRemove.user_id)
      success('Member removed from team')
      setMemberToRemove(null)
      onRefresh()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeRole = async (member: TeamMemberWithUser, newRole: 'maintainer' | 'member') => {
    setLoading(true)
    try {
      await updateTeamMemberRole(teamId, member.user_id, newRole)
      success(`Role updated to ${newRole}`)
      onRefresh()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  const maintainerCount = members.filter(m => m.role === 'maintainer').length

  return (
    <>
      <Card>
        <div className="divide-y">
          {members.map(member => {
            const isLastMaintainer = member.role === 'maintainer' && maintainerCount === 1

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors focus-within:bg-muted/50"
                role="listitem"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <Icon icon={UserGroupIcon} className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium flex items-center gap-2 flex-wrap">
                      <span className="truncate">{member.user.email}</span>
                      <RoleBadge role={member.role} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Added {new Date(member.added_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="active:scale-95 transition-transform focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Manage ${member.user.email}`}
                      disabled={loading && removingMemberId === member.id}
                    >
                      <Icon icon={MoreVerticalCircle01Icon} className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <button className="w-full flex items-center">
                        <Icon icon={User02Icon} className="mr-2 h-4 w-4" />
                        View Profile
                      </button>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {member.role === 'member' ? (
                      <DropdownMenuItem
                        onClick={() => handleChangeRole(member, 'maintainer')}
                        disabled={loading}
                      >
                        <Icon icon={ArrowUp01Icon} className="mr-2 h-4 w-4" />
                        Promote to Maintainer
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => handleChangeRole(member, 'member')}
                        disabled={loading || isLastMaintainer}
                      >
                        <Icon icon={ArrowDown01Icon} className="mr-2 h-4 w-4" />
                        {isLastMaintainer ? 'Last Maintainer' : 'Demote to Member'}
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => {
                        setMemberToRemove(member)
                        setRemovingMemberId(member.id)
                      }}
                      disabled={loading || isLastMaintainer}
                      className="text-destructive focus:text-destructive"
                    >
                      <Icon icon={Delete02Icon} className="mr-2 h-4 w-4" />
                      {isLastMaintainer ? 'Cannot Remove' : 'Remove from Team'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open: boolean) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{memberToRemove?.user.email}</strong> from this team?
              They will lose access to team repositories and resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? 'Removing...' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
