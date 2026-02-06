import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import { Globe02Icon, LockKeyIcon, EyeOffIcon } from "@hugeicons/core-free-icons"

const visibilityBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      visibility: {
        public: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
        private: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20",
        secret: "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20",
      },
    },
    defaultVariants: {
      visibility: "private",
    },
  }
)

export interface VisibilityBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof visibilityBadgeVariants> {
  visibility: "public" | "private" | "secret"
  showIcon?: boolean
}

const visibilityIcons = {
  public: Globe02Icon,
  private: LockKeyIcon,
  secret: EyeOffIcon,
}

const visibilityLabels = {
  public: "Public",
  private: "Private",
  secret: "Secret",
}

export const VisibilityBadge = React.forwardRef<HTMLDivElement, VisibilityBadgeProps>(
  ({ className, visibility, showIcon = true, ...props }, ref) => {
    const IconComponent = visibilityIcons[visibility]

    return (
      <div
        ref={ref}
        className={cn(visibilityBadgeVariants({ visibility }), className)}
        aria-label={`Visibility: ${visibilityLabels[visibility]}`}
        {...props}
      >
        {showIcon && <Icon icon={IconComponent} className="h-3 w-3" />}
        {visibilityLabels[visibility]}
      </div>
    )
  }
)
VisibilityBadge.displayName = "VisibilityBadge"
