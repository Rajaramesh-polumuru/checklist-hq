import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import type { OrgRole, TeamRole } from "@/stores/permission-store"

const roleBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      role: {
        owner: "bg-[color-mix(in_srgb,var(--color-role-owner)_10%,transparent)] text-[var(--color-role-owner)] border border-[color-mix(in_srgb,var(--color-role-owner)_20%,transparent)]",
        admin: "bg-[color-mix(in_srgb,var(--color-role-admin)_10%,transparent)] text-[var(--color-role-admin)] border border-[color-mix(in_srgb,var(--color-role-admin)_20%,transparent)]",
        member: "bg-[color-mix(in_srgb,var(--color-role-member)_10%,transparent)] text-[var(--color-role-member)] border border-[color-mix(in_srgb,var(--color-role-member)_20%,transparent)]",
        viewer: "bg-[color-mix(in_srgb,var(--color-role-viewer)_10%,transparent)] text-[var(--color-role-viewer)] border border-[color-mix(in_srgb,var(--color-role-viewer)_20%,transparent)]",
        maintainer: "bg-[color-mix(in_srgb,var(--color-role-admin)_10%,transparent)] text-[var(--color-role-admin)] border border-[color-mix(in_srgb,var(--color-role-admin)_20%,transparent)]",
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
  role: OrgRole | TeamRole
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
