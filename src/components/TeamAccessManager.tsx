import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Loader2, Users, Plus, Trash2, Shield } from 'lucide-react'
import {
  getRepositoryTeams,
  addTeamAccess,
  updateTeamAccess,
  removeTeamAccess,
  type RepositoryTeamAccessWithDetails
} from '@/services/repository'
import { getOrganizationTeams } from '@/services/organization'
import type { Team } from '@/types/database'

interface TeamAccessManagerProps {
  repoId: string
  organizationId: string
}

export function TeamAccessManager({ repoId, organizationId }: TeamAccessManagerProps) {
  const [accessList, setAccessList] = useState<RepositoryTeamAccessWithDetails[]>([])
  const [availableTeams, setAvailableTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  // Add Team State
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [selectedPermission, setSelectedPermission] = useState<'read' | 'write' | 'admin'>('read')
  const [adding, setAdding] = useState(false)

  // Load data
  const loadData = async () => {
    setLoading(true)
    try {
      const [accessData, allTeams] = await Promise.all([
        getRepositoryTeams(repoId),
        getOrganizationTeams(organizationId)
      ])
      setAccessList(accessData)
      setAvailableTeams(allTeams)
    } catch (err) {
      console.error('Failed to load team access:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [repoId, organizationId])

  // Filter out teams that already have access
  const unusedTeams = availableTeams.filter(team =>
    !accessList.some(access => access.team_id === team.id)
  )

  const handleAddTeam = async () => {
    if (!selectedTeamId) return
    setAdding(true)
    try {
      await addTeamAccess(repoId, selectedTeamId, selectedPermission)
      await loadData() // Reload list
      setSelectedTeamId('') // Reset selection
    } catch (err) {
      console.error('Failed to add team:', err)
    } finally {
      setAdding(false)
    }
  }

  const handleUpdatePermission = async (teamId: string, newPermission: 'read' | 'write' | 'admin') => {
    // Optimistic update
    setAccessList(prev => prev.map(item =>
      item.team_id === teamId ? { ...item, permission: newPermission } : item
    ))

    try {
      await updateTeamAccess(repoId, teamId, newPermission)
    } catch (err) {
      console.error('Failed to update permission:', err)
      loadData() // Revert on error
    }
  }

  const handleRemoveTeam = async (teamId: string) => {
    // Optimistic update
    setAccessList(prev => prev.filter(item => item.team_id !== teamId))

    try {
      await removeTeamAccess(repoId, teamId)
    } catch (err) {
      console.error('Failed to remove team:', err)
      loadData() // Revert on error
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Team Access</h3>
      </div>

      {/* List of teams with access */}
      <div className="space-y-2">
        {accessList.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-2">
            No teams have been granted access yet.
          </p>
        ) : (
          accessList.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.team.name}</p>
                  <p className="text-xs text-muted-foreground">@{item.team.slug}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={item.permission}
                  onValueChange={(v: any) => handleUpdatePermission(item.team_id, v)}
                >
                  <SelectTrigger className="w-[100px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="write">Write</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveTeam(item.team_id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add new team */}
      {unusedTeams.length > 0 && (
        <div className="flex items-end gap-2 pt-2 border-t">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Add Team</label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team..." />
              </SelectTrigger>
              <SelectContent>
                {unusedTeams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[100px] space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Role</label>
            <Select value={selectedPermission} onValueChange={(v: any) => setSelectedPermission(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="write">Write</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleAddTeam} disabled={!selectedTeamId || adding}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  )
}
