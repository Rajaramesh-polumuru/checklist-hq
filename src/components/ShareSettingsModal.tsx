import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import {
    Globe,
    Lock,
    Link2,
    Check,
    Copy,
    Trash2,
    AlertTriangle,
    Share2,
    ExternalLink,
    Loader2,
    Building2,
    ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Repository } from '@/types/database'
import { getMyOrganizations } from '@/services/organization'
import { transferRepoToOrg } from '@/services/organization'
import { TeamAccessManager } from '@/components/TeamAccessManager'

interface ShareSettingsModalProps {
    repository: Repository
    isOpen: boolean
    onClose: () => void
    onVisibilityChange: (isPublic: boolean) => Promise<void>
    onDelete: () => Promise<void>
}

export function ShareSettingsModal({
    repository,
    isOpen,
    onClose,
    onVisibilityChange,
    onDelete,
}: ShareSettingsModalProps) {
    const [isPublic, setIsPublic] = useState(repository.is_public)
    const [copied, setCopied] = useState(false)
    const [changingVisibility, setChangingVisibility] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')

    // Transfer State
    const [showTransfer, setShowTransfer] = useState(false)
    const [organizations, setOrganizations] = useState<{ id: string, name: string }[]>([])
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
    const [transferring, setTransferring] = useState(false)
    const [transferSuccess, setTransferSuccess] = useState(false)

    const shareUrl = `${window.location.origin}/repo/${repository.id}`

    useEffect(() => {
        if (showTransfer && organizations.length === 0) {
            getMyOrganizations().then((orgs) => {
                // Only show orgs where the user is admin or owner
                // Note: The service already includes roles
                const adminOrgs = orgs.filter((o: any) => o.role === 'owner' || o.role === 'admin')
                setOrganizations(adminOrgs)
            }).catch(console.error)
        }
    }, [showTransfer])

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const handleVisibilityToggle = async () => {
        const newValue = !isPublic
        setChangingVisibility(true)
        try {
            await onVisibilityChange(newValue)
            setIsPublic(newValue)
        } catch (err) {
            console.error('Failed to change visibility:', err)
        } finally {
            setChangingVisibility(false)
        }
    }

    const handleDelete = async () => {
        if (deleteConfirmText !== repository.title) return

        setDeleting(true)
        try {
            await onDelete()
            onClose()
        } catch (err) {
            console.error('Failed to delete:', err)
        } finally {
            setDeleting(false)
        }
    }

    const handleTransfer = async () => {
        if (!selectedOrgId) return

        setTransferring(true)
        try {
            await transferRepoToOrg(repository.id, selectedOrgId)
            setTransferSuccess(true)
            setTimeout(() => {
                window.location.href = `/app/orgs/${selectedOrgId}` // Hard reload to org page
            }, 1000)
        } catch (err) {
            console.error('Failed to transfer:', err)
            alert('Failed to transfer repository. Please try again.')
        } finally {
            setTransferring(false)
        }
    }

    if (showDeleteConfirm) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                                <DialogTitle>Delete Checklist</DialogTitle>
                                <DialogDescription>This action cannot be undone</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="py-4">
                        <p className="text-sm text-muted-foreground mb-4">
                            This will permanently delete <strong>"{repository.title}"</strong> and all its version history, runs, and data.
                        </p>

                        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 mb-4">
                            <p className="text-sm text-destructive font-medium">
                                ⚠️ Warning: {repository.fork_count > 0
                                    ? `This checklist has been forked ${repository.fork_count} times. Forks will not be deleted.`
                                    : 'All data will be lost permanently.'}
                            </p>
                        </div>

                        <label className="text-sm font-medium block mb-2">
                            Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{repository.title}</span> to confirm
                        </label>
                        <Input
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="Enter checklist name"
                            className="font-mono"
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowDeleteConfirm(false)
                                setDeleteConfirmText('')
                            }}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteConfirmText !== repository.title || deleting}
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Permanently
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    if (showTransfer) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle>Transfer Ownership</DialogTitle>
                                <DialogDescription>Move this checklist to an organization</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Select an organization to transfer <strong>"{repository.title}"</strong> to.
                            You must be an owner or admin of the organization.
                        </p>

                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                            {organizations.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-md">
                                    No organizations found where you are an admin.
                                </p>
                            ) : (
                                organizations.map(org => (
                                    <button
                                        key={org.id}
                                        onClick={() => setSelectedOrgId(org.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3 rounded-lg border text-sm transition-all",
                                            selectedOrgId === org.id
                                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                : "hover:bg-muted/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{org.name}</span>
                                        </div>
                                        {selectedOrgId === org.id && (
                                            <Check className="h-4 w-4 text-primary" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>

                        {selectedOrgId && (
                            <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-sm">
                                <p className="font-medium flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Warning
                                </p>
                                <p className="mt-1 text-xs opacity-90">
                                    Transferring ownership is permanent. The organization will own this checklist, and its visibility may change based on organization settings.
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setShowTransfer(false)}
                            disabled={transferring}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleTransfer}
                            disabled={!selectedOrgId || transferring || transferSuccess}
                        >
                            {transferring ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Transferring...
                                </>
                            ) : transferSuccess ? (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Transferred!
                                </>
                            ) : (
                                <>
                                    Transfer
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Share2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle>Share & Settings</DialogTitle>
                            <DialogDescription>Manage access to "{repository.title}"</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* Visibility Section */}
                    <div>
                        <label className="text-sm font-medium mb-3 block">Visibility</label>
                        <Card
                            className={cn(
                                "cursor-pointer transition-all border-2",
                                changingVisibility && "opacity-70 pointer-events-none"
                            )}
                            onClick={handleVisibilityToggle}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                                            isPublic ? "bg-success/10" : "bg-muted"
                                        )}>
                                            {isPublic ? (
                                                <Globe className="h-5 w-5 text-success" />
                                            ) : (
                                                <Lock className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {isPublic ? 'Public' : 'Private'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {isPublic
                                                    ? 'Anyone with the link can view and fork'
                                                    : 'Only you can view and edit'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Toggle Switch */}
                                    <div className={cn(
                                        "relative h-6 w-11 rounded-full transition-colors",
                                        isPublic ? "bg-success" : "bg-muted"
                                    )}>
                                        <div className={cn(
                                            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                                            isPublic ? "translate-x-5" : "translate-x-0.5"
                                        )} />
                                        {changingVisibility && (
                                            <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-white" />
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Share Link Section */}
                    <div>
                        <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                            <Link2 className="h-4 w-4" />
                            Share Link
                        </label>
                        <div className="flex gap-2">
                            <Input
                                value={shareUrl}
                                readOnly
                                className="font-mono text-sm bg-muted/50"
                            />
                            <Button
                                variant={copied ? "default" : "outline"}
                                onClick={handleCopyLink}
                                className={cn(
                                    "shrink-0 min-w-[100px] transition-all",
                                    copied && "bg-success hover:bg-success text-white"
                                )}
                            >
                                {copied ? (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy
                                    </>
                                )}
                            </Button>
                        </div>
                        {!isPublic && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                This link is private. Only you can access it.
                            </p>
                        )}
                    </div>

                    {/* Team Access (Only for Organization Repos) */}
                    {repository.organization_id && (
                        <div className="pt-4 border-t">
                            <TeamAccessManager 
                                repoId={repository.id} 
                                organizationId={repository.organization_id} 
                            />
                        </div>
                    )}

                    {/* Organization Transfer */}
                    {!repository.organization_id && (
                        <div>
                            <label className="text-sm font-medium mb-3 block">Organization</label>
                            <Card className="bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowTransfer(true)}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center">
                                                <Building2 className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">Transfer to Organization</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Move this checklist to a team workspace
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            Transfer
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Preview in Explore */}
                    {isPublic && (
                        <div>
                            <label className="text-sm font-medium mb-3 block">Published to Explore</label>
                            <Card className="bg-muted/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="success" className="gap-1">
                                                <Globe className="h-3 w-3" />
                                                Live
                                            </Badge>
                                            <p className="text-sm text-muted-foreground">
                                                Discoverable in the Explore page
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.open(`/repo/${repository.id}`, '_blank')}
                                        >
                                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                            Preview
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Danger Zone */}
                    <div className="pt-4 border-t border-dashed">
                        <label className="text-sm font-medium text-destructive mb-3 block flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Danger Zone
                        </label>
                        <Card className="border-destructive/30 bg-destructive/5">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-sm">Delete this checklist</p>
                                        <p className="text-xs text-muted-foreground">
                                            Permanently remove all data
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                        onClick={() => setShowDeleteConfirm(true)}
                                    >
                                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
