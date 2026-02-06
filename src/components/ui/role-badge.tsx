import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const roleBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      role: {
        owner: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
        admin: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
        member: "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20",
        viewer: "bg-muted text-muted-foreground border border-border",
        maintainer: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20",
      },
    },
    defaultVariants: {
      role: "member",
    },
  }
)

export interface RoleBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof roleBadgeVariants> {
  role: "owner" | "admin" | "member" | "viewer" | "maintainer"
  showIcon?: boolean
}

const roleIcons = {
  owner: "👑",
  admin: "⚙️",
  member: "👤",
  viewer: "👁️",
  maintainer: "🔧",
}

const roleLabels = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
  maintainer: "Maintainer",
}

export const RoleBadge = React.forwardRef<HTMLDivElement, RoleBadgeProps>(
  ({ className, role, showIcon = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(roleBadgeVariants({ role }), className)}
        aria-label={`Role: ${roleLabels[role]}`}
        {...props}
      >
        {showIcon && <span aria-hidden="true">{roleIcons[role]}</span>}
        {roleLabels[role]}
      </div>
    )
  }
)
RoleBadge.displayName = "RoleBadge"
