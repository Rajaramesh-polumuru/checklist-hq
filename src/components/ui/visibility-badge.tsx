import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import { Globe02Icon, LockKeyIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons"

const visibilityBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      visibility: {
        public: "bg-[color-mix(in_srgb,var(--color-visibility-public)_10%,transparent)] text-[var(--color-visibility-public)] border border-[color-mix(in_srgb,var(--color-visibility-public)_20%,transparent)]",
        visible: "bg-[color-mix(in_srgb,var(--color-visibility-public)_10%,transparent)] text-[var(--color-visibility-public)] border border-[color-mix(in_srgb,var(--color-visibility-public)_20%,transparent)]",
        private: "bg-[color-mix(in_srgb,var(--color-visibility-private)_10%,transparent)] text-[var(--color-visibility-private)] border border-[color-mix(in_srgb,var(--color-visibility-private)_20%,transparent)]",
        secret: "bg-[color-mix(in_srgb,var(--color-visibility-secret)_10%,transparent)] text-[var(--color-visibility-secret)] border border-[color-mix(in_srgb,var(--color-visibility-secret)_20%,transparent)]",
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
  visibility: "public" | "private" | "secret" | "visible"
  showIcon?: boolean
}

const visibilityIcons = {
  public: Globe02Icon,
  visible: Globe02Icon,
  private: LockKeyIcon,
  secret: ViewOffSlashIcon,
}

const visibilityLabels = {
  public: "Public",
  visible: "Visible",
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
