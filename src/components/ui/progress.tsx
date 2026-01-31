import * as React from "react"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Progress value (0-100) */
    value?: number
    /** Max value */
    max?: number
    /** Show percentage label */
    showLabel?: boolean
    /** Size variant */
    size?: "sm" | "default" | "lg"
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
    ({ className, value = 0, max = 100, showLabel = false, size = "default", ...props }, ref) => {
        const percentage = Math.min(100, Math.max(0, (value / max) * 100))

        const sizeClasses = {
            sm: "h-1",
            default: "h-2",
            lg: "h-3",
        }

        return (
            <div className={cn("relative", showLabel && "flex items-center gap-3")}>
                <div
                    ref={ref}
                    className={cn(
                        "w-full overflow-hidden rounded-full bg-muted",
                        sizeClasses[size],
                        className
                    )}
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={max}
                    {...props}
                >
                    <div
                        className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                {showLabel && (
                    <span className="text-sm font-medium text-muted-foreground tabular-nums">
                        {Math.round(percentage)}%
                    </span>
                )}
            </div>
        )
    }
)
Progress.displayName = "Progress"

export { Progress }
