import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Icon } from "@/components/ui/icon"
import UserGroupIcon from '@hugeicons/core-free-icons/UserGroupIcon'
import CheckListIcon from '@hugeicons/core-free-icons/CheckListIcon'
import ChartBarLineIcon from '@hugeicons/core-free-icons/ChartBarLineIcon'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import Building01Icon from '@hugeicons/core-free-icons/Building01Icon'
import Rocket01Icon from '@hugeicons/core-free-icons/Rocket01Icon'
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  variant: "teams" | "members" | "repositories" | "analytics"
  onAction?: () => void
  className?: string
}

const emptyStateConfig = {
  teams: {
    icon: UserGroupIcon,
    title: "No teams yet",
    description: "Create your first team to organize members and manage repository access.",
    actionLabel: "Create Team",
    illustration: Building01Icon,
  },
  members: {
    icon: UserGroupIcon,
    title: "No members yet",
    description: "Invite team members to collaborate on checklists and processes.",
    actionLabel: "Invite Members",
    illustration: UserGroupIcon,
  },
  repositories: {
    icon: CheckListIcon,
    title: "No repositories yet",
    description: "Create or fork checklists to get started with your organization.",
    actionLabel: "Create Checklist",
    illustration: CheckListIcon,
  },
  analytics: {
    icon: ChartBarLineIcon,
    title: "No data yet",
    description: "Analytics will appear here once you start completing checklist runs.",
    actionLabel: null,
    illustration: ChartBarLineIcon,
  },
}

export function EmptyState({ variant, onAction, className }: EmptyStateProps) {
  const config = emptyStateConfig[variant]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("w-full", className)}
    >
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
          {/* Illustration */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="mb-6 flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10"
            aria-hidden="true"
          >
            <Icon icon={config.illustration} className="h-10 w-10 text-primary/60" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="max-w-md space-y-3"
          >
            <h3 className="text-xl font-semibold tracking-tight">
              {config.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {config.description}
            </p>

            {/* Action Button */}
            {config.actionLabel && onAction && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="pt-4"
              >
                <Button
                  onClick={onAction}
                  size="lg"
                  className="gap-2 active:scale-95 transition-transform"
                >
                  <Icon icon={PlusSignIcon} className="h-4 w-4" />
                  {config.actionLabel}
                </Button>
              </motion.div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// First-Time Organization Setup Guide
interface QuickStartProps {
  onCreateTeam: () => void
  onInviteMember: () => void
  onCreateRepo: () => void
}

export function QuickStartChecklist({
  onCreateTeam,
  onInviteMember,
  onCreateRepo,
}: QuickStartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10" aria-hidden="true">
              <Icon icon={Rocket01Icon} className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Quick Start Guide
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get your organization set up in 3 steps
                </p>
              </div>

              <div className="space-y-2">
                <QuickStartItem
                  number={1}
                  title="Create your first team"
                  description="Organize members by department or project"
                  action={onCreateTeam}
                  actionLabel="Create Team"
                />
                <QuickStartItem
                  number={2}
                  title="Invite team members"
                  description="Collaborate with your colleagues"
                  action={onInviteMember}
                  actionLabel="Invite"
                />
                <QuickStartItem
                  number={3}
                  title="Add a checklist"
                  description="Create or fork a process template"
                  action={onCreateRepo}
                  actionLabel="Get Started"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface QuickStartItemProps {
  number: number
  title: string
  description: string
  action: () => void
  actionLabel: string
}

function QuickStartItem({
  number,
  title,
  description,
  action,
  actionLabel,
}: QuickStartItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={action}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
      >
        {actionLabel}
      </Button>
    </div>
  )
}
