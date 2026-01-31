import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
    {
        variants: {
            variant: {
                default: "bg-primary/10 text-primary",
                secondary: "bg-secondary text-secondary-foreground",
                success: "bg-success/10 text-success",
                warning: "bg-warning/10 text-warning",
                destructive: "bg-destructive/10 text-destructive",
                outline: "border border-current bg-transparent",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
    /** Show a small dot indicator */
    dot?: boolean
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props}>
            {dot && (
                <span
                    className={cn(
                        "mr-1.5 h-1.5 w-1.5 rounded-full",
                        variant === "success" && "bg-success",
                        variant === "warning" && "bg-warning",
                        variant === "destructive" && "bg-destructive",
                        (!variant || variant === "default") && "bg-primary",
                        variant === "secondary" && "bg-muted-foreground"
                    )}
                />
            )}
            {children}
        </div>
    )
}

export { Badge, badgeVariants }
