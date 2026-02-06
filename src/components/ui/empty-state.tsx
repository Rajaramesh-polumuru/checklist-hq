import * as React from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: React.ReactNode
    title: string
    description?: string
    action?: React.ReactNode
}

function EmptyState({
    className,
    icon,
    title,
    description,
    action,
    ...props
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center p-8 text-center animate-fade-in",
                "rounded-xl border border-dashed bg-muted/30",
                className
            )}
            {...props}
        >
            {icon && (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted shadow-sm ring-4 ring-background mb-6">
                    {React.isValidElement(icon) ?
                        // If it's an Icon component, clone it with size class if needed, or wrap it
                        <div className="h-8 w-8 text-muted-foreground flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
                            {icon}
                        </div>
                        : icon}
                </div>
            )}
            <h3 className="text-xl font-semibold tracking-tight mb-2">{title}</h3>
            {description && (
                <p className="text-muted-foreground max-w-sm mb-6 text-sm leading-relaxed">
                    {description}
                </p>
            )}
            {action && (
                <div className="mt-2">
                    {action}
                </div>
            )}
        </div>
    )
}

export { EmptyState }
