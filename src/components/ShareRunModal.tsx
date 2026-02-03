import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Share2,
  Link2,
  Copy,
  Check,
  Users,
  Loader2,
  Trash2,
  Shield,
} from 'lucide-react'
import {
  generateShareToken,
  revokeShareToken,
  getShareLinkUrl,
  getParticipants,
  removeParticipant,
} from '@/services/collaboration'
import type { Run } from '@/types/database'
import type { RunParticipant } from '@/services/collaboration'

interface ShareRunModalProps {
  run: Run | null
  isOpen: boolean
  onClose: () => void
}

export function ShareRunModal({ run, isOpen, onClose }: ShareRunModalProps) {
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [participants, setParticipants] = useState<RunParticipant[]>([])
  const [loading, setLoading] = useState(false)
  const [copying, setCopying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && run) {
      loadData()
    } else {
      // Reset state when closed
      setShareLink(null)
      setParticipants([])
      setError(null)
    }
  }, [isOpen, run?.id])

  const loadData = async () => {
    if (!run) return

    try {
      setLoading(true)

      // If run already has a share token, generate the link
      if (run.share_token) {
        setShareLink(getShareLinkUrl(run.share_token))
      }

      // Load participants
      const parts = await getParticipants(run.id)
      setParticipants(parts)
    } catch (err) {
      console.error('Error loading share data:', err)
      setError('Failed to load sharing information')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateLink = async () => {
    if (!run) return

    try {
      setLoading(true)
      setError(null)
      const token = await generateShareToken(run.id)
      setShareLink(getShareLinkUrl(token))
    } catch (err) {
      console.error('Error generating share link:', err)
      setError('Failed to generate share link')
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeLink = async () => {
    if (!run) return

    try {
      setLoading(true)
      setError(null)
      await revokeShareToken(run.id)
      setShareLink(null)
    } catch (err) {
      console.error('Error revoking share link:', err)
      setError('Failed to revoke share link')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareLink) return

    try {
      await navigator.clipboard.writeText(shareLink)
      setCopying(true)
      setTimeout(() => setCopying(false), 2000)
    } catch (err) {
      console.error('Error copying link:', err)
    }
  }

  const handleRemoveParticipant = async (userId: string) => {
    if (!run) return

    try {
      await removeParticipant(run.id, userId)
      setParticipants((prev) => prev.filter((p) => p.user_id !== userId))
    } catch (err) {
      console.error('Error removing participant:', err)
      setError('Failed to remove participant')
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'editor':
        return 'secondary'
      case 'viewer':
        return 'outline'
      default:
        return 'outline'
    }
  }

  if (!run) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Share2 className="h-4 w-4 text-primary" />
            </div>
            Share Run
          </DialogTitle>
          <DialogDescription>
            Share this run with others to collaborate in real-time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Share Link Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Share Link
            </label>

            {shareLink ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="h-9 text-sm bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="shrink-0 gap-1.5"
                  >
                    {copying ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copying ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Anyone with this link can view and join this run.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRevokeLink}
                  disabled={loading}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Revoke Link
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={handleGenerateLink}
                  disabled={loading}
                  variant="outline"
                  className="w-full gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  Generate Share Link
                </Button>
                <p className="text-xs text-muted-foreground">
                  Create a link that allows others to join this run.
                </p>
              </div>
            )}
          </div>

          {/* Participants Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants ({participants.length})
            </label>

            {loading && participants.length === 0 ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : participants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No participants yet. Share the link to invite others.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {participant.user?.full_name || participant.user?.email || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {participant.joined_at ? 'Joined' : 'Invited'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(participant.role)}>
                        {participant.role}
                      </Badge>
                      {participant.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveParticipant(participant.user_id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Shared runs allow real-time collaboration. Participants can see progress updates and complete items together.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
