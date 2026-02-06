import { useNavigate } from 'react-router-dom'
import { EmptyState as EmptyStatePrimitive } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { TaskDaily01Icon, PlusSignIcon, FileSearchIcon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'

interface EmptyStateProps {
    searchQuery?: string
    onClearSearch?: () => void
}

export function EmptyState({ searchQuery, onClearSearch }: EmptyStateProps) {
    const navigate = useNavigate()

    if (searchQuery) {
        return (
            <EmptyStatePrimitive
                className="bg-muted/30 border-dashed"
                icon={<Icon icon={TaskDaily01Icon} />}
                title="No checklists found"
                description={`We couldn't find any checklists matching "${searchQuery}". Try adjusting your search keywords.`}
                action={
                    <Button variant="outline" onClick={onClearSearch}>
                        Clear search
                    </Button>
                }
            />
        )
    }

    return (
        <EmptyStatePrimitive
            className="py-16 bg-gradient-to-br from-muted/50 to-muted/10 border-2"
            icon={<Icon icon={TaskDaily01Icon} className="text-primary" />} // We might need to handle the icon sizing/styling better in the primitive or pass a custom node
            title="Welcome to Checklist HQ"
            description="Get started by creating your first checklist repository, or explore community templates to fork and customize."
            action={
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button size="lg" onClick={() => navigate('/app/new')} className="w-full sm:w-auto">
                        <Icon icon={PlusSignIcon} className="mr-2 h-5 w-5" />
                        Create Checklist
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => navigate('/explore')} className="w-full sm:w-auto">
                        <Icon icon={FileSearchIcon} className="mr-2 h-5 w-5" />
                        Explore Templates
                    </Button>
                </div>
            }
        />
    )
}

