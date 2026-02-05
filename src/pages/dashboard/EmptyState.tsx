import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TaskDaily01Icon, PlusSignIcon, FileSearchIcon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { useNavigate } from 'react-router-dom'

interface EmptyStateProps {
    searchQuery?: string
    onClearSearch?: () => void
}

export function EmptyState({ searchQuery, onClearSearch }: EmptyStateProps) {
    const navigate = useNavigate()

    if (searchQuery) {
        return (
            <Card className="border-dashed bg-muted/30">
                <CardContent className="py-12 text-center">
                    <div className="mx-auto w-12 h-12 bg-background rounded-full flex items-center justify-center mb-4 shadow-sm border">
                        <Icon icon={TaskDaily01Icon} className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No checklists found</h3>
                    <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                        We couldn't find any checklists matching "{searchQuery}". Try adjusting your search keywords.
                    </p>
                    <Button variant="outline" onClick={onClearSearch}>
                        Clear search
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-dashed border-2 bg-gradient-to-br from-muted/50 to-muted/10">
            <CardContent className="py-16 text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-iner ring-4 ring-background">
                    <Icon icon={TaskDaily01Icon} className="h-8 w-8 text-primary" />
                </div>

                <h3 className="text-2xl font-semibold mb-2">Welcome to Checklist HQ</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-8 text-base">
                    Get started by creating your first checklist repository, or explore community templates to fork and customize.
                </p>

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
            </CardContent>
        </Card>
    )
}
