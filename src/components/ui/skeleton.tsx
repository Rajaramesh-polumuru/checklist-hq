import * as React from "react"

import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Variant for common skeleton shapes */
    variant?: "text" | "circular" | "rectangular"
    /** Width - can be any valid CSS width */
    width?: string | number
    /** Height - can be any valid CSS height */
    height?: string | number
}

function Skeleton({
    className,
    variant = "rectangular",
    width,
    height,
    style,
    ...props
}: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-skeleton bg-muted",
                variant === "circular" && "rounded-full",
                variant === "text" && "rounded h-4",
                variant === "rectangular" && "rounded-md",
                className
            )}
            style={{
                width: width,
                height: height,
                ...style,
            }}
            {...props}
        />
    )
}

// Pre-built skeleton layouts for common patterns

function SkeletonCard() {
    return (
        <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </div>
    )
}

function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <Skeleton variant="circular" width={40} height={40} />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    )
}

function SkeletonDashboard() {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    )
}

export { Skeleton, SkeletonCard, SkeletonList, SkeletonDashboard }
