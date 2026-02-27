import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon'
import ArrowTurnBackwardIcon from '@hugeicons/core-free-icons/ArrowTurnBackwardIcon'

interface RunCompletionBannerProps {
  totalItems: number
  onRestart: () => void
}

export function RunCompletionBanner({ totalItems, onRestart }: RunCompletionBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-8 bg-success/5 border border-success/20 rounded-lg p-6 text-center"
    >
      <Icon icon={CheckmarkCircle01Icon} size="xl" className="text-success mx-auto mb-3" />
      <h2 className="text-lg font-semibold text-foreground mb-1">
        All {totalItems} steps complete!
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Great work — this checklist run is done.
      </p>
      <div className="flex gap-3 justify-center">
        <Button onClick={onRestart} variant="outline" className="gap-2">
          <Icon icon={ArrowTurnBackwardIcon} className="h-4 w-4" />
          Run Again
        </Button>
        <Button asChild>
          <Link to="/app">Dashboard</Link>
        </Button>
      </div>
    </motion.div>
  )
}
