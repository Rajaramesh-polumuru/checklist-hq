import { tokens } from "@/design-system/tokens";
// Standard transitions
export const transitions = {
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
};
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
    // Premium Card Hover
    cardHover: {
        initial: { scale: 1, y: 0 },
        hover: {
            scale: 1.02,
            y: -4,
            transition: { duration: 0.3, ease: tokens.motion.easing.default }
        },
        tap: {
            scale: 0.98,
            transition: { duration: 0.1 }
        },
    },
    // Float In (for decorative elements)
    floatIn: {
        initial: { opacity: 0, y: 40, scale: 0.9 },
        animate: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15
            }
        },
    },
    // Glow Pulse (for active indicators)
    glowPulse: {
        initial: { opacity: 0.5 },
        animate: {
            opacity: [0.5, 1, 0.5],
            transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }
        },
    },
    // Slide In from Left
    slideInLeft: {
        initial: { opacity: 0, x: -20 },
        animate: {
            opacity: 1,
            x: 0,
            transition: transitions.default
        },
        exit: {
            opacity: 0,
            x: -20,
            transition: transitions.fast
        },
    },
    // Slide In from Right
    slideInRight: {
        initial: { opacity: 0, x: 20 },
        animate: {
            opacity: 1,
            x: 0,
            transition: transitions.default
        },
        exit: {
            opacity: 0,
            x: 20,
            transition: transitions.fast
        },
    },
};
/**
 * Opacity-only variants — used when the user has opted into reduced motion.
 * Same shape as `variants` so components can swap them in transparently.
 */
export const staticVariants = {
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: transitions.fast },
        exit: { opacity: 0, transition: transitions.fast },
    },
    slideUp: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: transitions.fast },
        exit: { opacity: 0, transition: transitions.fast },
    },
    scaleIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: transitions.fast },
        exit: { opacity: 0, transition: transitions.fast },
    },
    staggerContainer: {
        animate: { transition: { staggerChildren: 0 } },
    },
    cardHover: {
        initial: { opacity: 1 },
        hover: { opacity: 1 },
        tap: { opacity: 1 },
    },
    floatIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: transitions.fast },
    },
    glowPulse: {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
    },
    slideInLeft: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: transitions.fast },
        exit: { opacity: 0, transition: transitions.fast },
    },
    slideInRight: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: transitions.fast },
        exit: { opacity: 0, transition: transitions.fast },
    },
};
/**
 * Helper for components that need to honour `prefers-reduced-motion`.
 * Pass the boolean returned by `useReducedMotion()` and get back the
 * correct variant set — no conditional logic needed at the call site.
 *
 * @example
 *   const reduced = useReducedMotion()
 *   <motion.div variants={resolveVariants('slideUp', reduced)} … />
 */
export function resolveVariants(name, isReduced) {
    return isReduced ? staticVariants[name] : variants[name];
}
export const motionUtils = {
    variants,
    staticVariants,
    transitions,
    resolveVariants,
};
//# sourceMappingURL=motion.js.map