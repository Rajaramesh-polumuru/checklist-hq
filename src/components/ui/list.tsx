import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Icon } from "@/components/ui/icon"
import UnavailableIcon from '@hugeicons/core-free-icons/UnavailableIcon'
export interface ListProps extends React.HTMLAttributes<HTMLDivElement> {
    loading?: boolean
    loadingCount?: number
    loadingSkeleton?: React.ReactNode
    empty?: boolean
    emptyContent?: React.ReactNode
    emptyTitle?: string
    emptyDescription?: string
}

const List = React.forwardRef<HTMLDivElement, ListProps>(
    ({
        className,
        children,
        loading = false,
        loadingCount = 3,
        loadingSkeleton,
        empty = false,
        emptyContent,
        emptyTitle = "No items found",
        emptyDescription = "There are no items to display at this moment.",
        ...props
    }, ref) => {

        // Loading State
        if (loading) {
            if (loadingSkeleton) return <>{loadingSkeleton}</>

            return (
                <div className={cn("space-y-3", className)} ref={ref} {...props}>
                    {Array.from({ length: loadingCount }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-1/3" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            )
        }

        // Empty State
        if (empty) {
            if (emptyContent) return <>{emptyContent}</>

            return (
                <div ref={ref} className={cn("flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20 border-dashed", className)} {...props}>
                    <div className="bg-muted rounded-full p-3 mb-4">
                        <Icon icon={UnavailableIcon} className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium tracking-tight mb-1">{emptyTitle}</h3>
                    <p className="text-sm text-muted-foreground max-w-[250px]">{emptyDescription}</p>
                </div>
            )
        }

        // Data State
        return (
            <div ref={ref} className={cn("space-y-4", className)} {...props}>
                {children}
            </div>
        )
    }
)
List.displayName = "List"

const ListItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "p-4 rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:bg-accent/50",
                className
            )}
            {...props}
        />
    )
)
ListItem.displayName = "ListItem"

export { List, ListItem }
