import { type Variants, type Transition } from "framer-motion"
import { tokens } from "@/design-system/tokens"

// Standard transitions
export const transitions: Record<string, Transition> = {
    default: {
        duration: 0.2,
        ease: tokens.motion.easing.default,
    },
    fast: {
        duration: 0.1,
        ease: tokens.motion.easing.default,
    },
    slow: {
        duration: 0.3,
        ease: tokens.motion.easing.default,
    },
    bounce: {
        type: "spring",
        stiffness: 400,
        damping: 17,
    },
}

// Standard animation variants
export const variants = {
    // Fade In
    fadeIn: {
        initial: { opacity: 0 },
        animate: {
            opacity: 1,
            transition: transitions.default
        },
        exit: {
            opacity: 0,
            transition: transitions.default
        },
    },

    // Slide Up + Fade
    slideUp: {
        initial: { opacity: 0, y: 10 },
        animate: {
            opacity: 1,
            y: 0,
            transition: transitions.default
        },
        exit: {
            opacity: 0,
            y: 10,
            transition: transitions.default
        },
    },

    // Scale In
    scaleIn: {
        initial: { opacity: 0, scale: 0.95 },
        animate: {
            opacity: 1,
            scale: 1,
            transition: transitions.default
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            transition: transitions.default
        },
    },

    // Stagger Container
    staggerContainer: {
        animate: {
            transition: {
                staggerChildren: 0.05,
            },
        },
    },
} satisfies Record<string, Variants>

/**
 * Opacity-only variants — used when the user has opted into reduced motion.
 * Same shape as `variants` so components can swap them in transparently.
 */
export const staticVariants = {
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: transitions.fast },
        exit:    { opacity: 0, transition: transitions.fast },
    },
    slideUp: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: transitions.fast },
        exit:    { opacity: 0, transition: transitions.fast },
    },
    scaleIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: transitions.fast },
        exit:    { opacity: 0, transition: transitions.fast },
    },
    staggerContainer: {
        animate: { transition: { staggerChildren: 0 } },
    },
} satisfies Record<string, Variants>

/**
 * Helper for components that need to honour `prefers-reduced-motion`.
 * Pass the boolean returned by `useReducedMotion()` and get back the
 * correct variant set — no conditional logic needed at the call site.
 *
 * @example
 *   const reduced = useReducedMotion()
 *   <motion.div variants={resolveVariants('slideUp', reduced)} … />
 */
export function resolveVariants(name: keyof typeof variants, isReduced: boolean): Variants {
    return isReduced ? staticVariants[name] : variants[name]
}

export const motionUtils = {
    variants,
    staticVariants,
    transitions,
    resolveVariants,
}
