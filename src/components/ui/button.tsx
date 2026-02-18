import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, type HTMLMotionProps } from "framer-motion"
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import { Icon } from "@/components/ui/icon"
import { useButtonInteraction } from "@/hooks/use-interaction"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-95 transition-transform",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        danger:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Backward compatibility mappings
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
      },
      size: {
        // Mobile-first: 44px (h-11) minimum, desktop can be smaller
        default: "h-11 md:h-9 px-4 py-2",
        sm: "h-11 md:h-8 rounded-md px-3 text-xs md:text-xs",
        lg: "h-11 md:h-10 rounded-md px-8 text-base",
        icon: "h-11 w-11 md:h-9 md:w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd" | "style">,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  motionProps?: HTMLMotionProps<"button">
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, motionProps, ...props }, ref) => {
    const interactionProps = useButtonInteraction()

    // If asChild is true, we use Slot. We don't apply motion to Slot directly as it's complex.
    // Standard usage of asChild is for Links, which don't need tap animations as critical.
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    // Cast motion.button to any to allow ref passthrough without complex type gymnastics
    const Comp = motion.button as any

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...interactionProps}
        {...motionProps}
        {...props}
      >
        {loading && <Icon icon={Loading02Icon} className="animate-spin" size="sm" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
