import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Icon } from "@/components/ui/icon"
import Shield01Icon from '@hugeicons/core-free-icons/Shield01Icon'
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon'
import { Link } from "react-router-dom"

interface AccessDeniedProps {
  title?: string
  message?: string
  backTo?: string
  backLabel?: string
}

export function AccessDenied({
  title = "Access Denied",
  message = "You don't have permission to view this resource.",
  backTo = "/app",
  backLabel = "Back to Dashboard",
}: AccessDeniedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="border-destructive/50">
          <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="mb-6 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center"
            >
              <Icon icon={Shield01Icon} className="h-8 w-8 text-destructive" />
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="space-y-3 max-w-sm"
            >
              <h2 className="text-2xl font-bold tracking-tight">
                {title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {message}
              </p>

              {/* Action Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="pt-4"
              >
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="gap-2 active:scale-95 transition-transform"
                >
                  <Link to={backTo}>
                    <Icon icon={ArrowLeft01Icon} className="h-4 w-4" />
                    {backLabel}
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
