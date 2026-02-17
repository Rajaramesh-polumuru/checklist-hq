import { type Variants, type Transition } from "framer-motion";
export declare const transitions: Record<string, Transition>;
export declare const variants: {
    fadeIn: {
        initial: {
            opacity: number;
        };
        animate: {
            opacity: number;
            transition: Transition;
        };
        exit: {
            opacity: number;
            transition: Transition;
        };
    };
    slideUp: {
        initial: {
            opacity: number;
            y: number;
        };
        animate: {
            opacity: number;
            y: number;
            transition: Transition;
        };
        exit: {
            opacity: number;
            y: number;
            transition: Transition;
        };
    };
    scaleIn: {
        initial: {
            opacity: number;
            scale: number;
        };
        animate: {
            opacity: number;
            scale: number;
            transition: Transition;
        };
        exit: {
            opacity: number;
            scale: number;
            transition: Transition;
        };
    };
    staggerContainer: {
        animate: {
            transition: {
                staggerChildren: number;
            };
        };
    };
    cardHover: {
        initial: {
            scale: number;
            y: number;
        };
        hover: {
            scale: number;
            y: number;
            transition: {
                duration: number;
                ease: readonly [0.4, 0, 0.2, 1];
            };
        };
        tap: {
            scale: number;
            transition: {
                duration: number;
            };
        };
    };
    floatIn: {
        initial: {
            opacity: number;
            y: number;
            scale: number;
        };
        animate: {
            opacity: number;
            y: number;
            scale: number;
            transition: {
                type: "spring";
                stiffness: number;
                damping: number;
            };
        };
    };
    glowPulse: {
        initial: {
            opacity: number;
        };
        animate: {
            opacity: number[];
            transition: {
                duration: number;
                repeat: number;
                ease: "easeInOut";
            };
        };
    };
    slideInLeft: {
        initial: {
            opacity: number;
            x: number;
        };
        animate: {
            opacity: number;
            x: number;
            transition: Transition;
        };
        exit: {
            opacity: number;
            x: number;
            transition: Transition;
        };
    };
    slideInRight: {
        initial: {
            opacity: number;
            x: number;
        };
        animate: {
            opacity: number;
            x: number;
            transition: Transition;
        };
        exit: {
            opacity: number;
            x: number;
            transition: Transition;
        };
    };
};
/**
 * Opacity-only variants — used when the user has opted into reduced motion.
 * Same shape as `variants` so components can swap them in transparently.
 */
export declare const staticVariants: {
    fadeIn: {
        initial: {
            opacity: number;
        };
        animate: {
            opacity: number;
            transition: Transition;
        };
        exit: {
            opacity: number;
            transition: Transition;
        };
    };
    slideUp: {
        initial: {
            opacity: number;
        };
        animate: {
            opacity: number;
            transition: Transition;
        };
        exit: {
            opacity: number;
            transition: Transition;
        };
    };
    scaleIn: {
        initial: {
            opacity: number;
        };
        animate: {
            opacity: number;
            transition: Transition;
        };
        exit: {
            opacity: number;
            transition: Transition;
        };
    };
    staggerContainer: {
        animate: {
            transition: {
                staggerChildren: number;
            };
        };
    };
    cardHover: {
        initial: {
            opacity: number;
        };
        hover: {
            opacity: number;
        };
        tap: {
            opacity: number;
        };
    };
    floatIn: {
        initial: {
            opacity: number;
        };
        animate: {
            opacity: number;
            transition: Transition;
        };
    };
    glowPulse: {
        initial: {
            opacity: number;
        };
        animate: {
            opacity: number;
        };
    };
    slideInLeft: {
        initial: {
            opacity: number;
        };
        animate: {
            opacity: number;
            transition: Transition;
        };
        exit: {
            opacity: number;
            transition: Transition;
        };
    };
    slideInRight: {
        initial: {
            opacity: number;
        };
        animate: {
            opacity: number;
            transition: Transition;
        };
        exit: {
            opacity: number;
            transition: Transition;
        };
    };
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
export declare function resolveVariants(name: keyof typeof variants, isReduced: boolean): Variants;
export declare const motionUtils: {
    variants: {
        fadeIn: {
            initial: {
                opacity: number;
            };
            animate: {
                opacity: number;
                transition: Transition;
            };
            exit: {
                opacity: number;
                transition: Transition;
            };
        };
        slideUp: {
            initial: {
                opacity: number;
                y: number;
            };
            animate: {
                opacity: number;
                y: number;
                transition: Transition;
            };
            exit: {
                opacity: number;
                y: number;
                transition: Transition;
            };
        };
        scaleIn: {
            initial: {
                opacity: number;
                scale: number;
            };
            animate: {
                opacity: number;
                scale: number;
                transition: Transition;
            };
            exit: {
                opacity: number;
                scale: number;
                transition: Transition;
            };
        };
        staggerContainer: {
            animate: {
                transition: {
                    staggerChildren: number;
                };
            };
        };
        cardHover: {
            initial: {
                scale: number;
                y: number;
            };
            hover: {
                scale: number;
                y: number;
                transition: {
                    duration: number;
                    ease: readonly [0.4, 0, 0.2, 1];
                };
            };
            tap: {
                scale: number;
                transition: {
                    duration: number;
                };
            };
        };
        floatIn: {
            initial: {
                opacity: number;
                y: number;
                scale: number;
            };
            animate: {
                opacity: number;
                y: number;
                scale: number;
                transition: {
                    type: "spring";
                    stiffness: number;
                    damping: number;
                };
            };
        };
        glowPulse: {
            initial: {
                opacity: number;
            };
            animate: {
                opacity: number[];
                transition: {
                    duration: number;
                    repeat: number;
                    ease: "easeInOut";
                };
            };
        };
        slideInLeft: {
            initial: {
                opacity: number;
                x: number;
            };
            animate: {
                opacity: number;
                x: number;
                transition: Transition;
            };
            exit: {
                opacity: number;
                x: number;
                transition: Transition;
            };
        };
        slideInRight: {
            initial: {
                opacity: number;
                x: number;
            };
            animate: {
                opacity: number;
                x: number;
                transition: Transition;
            };
            exit: {
                opacity: number;
                x: number;
                transition: Transition;
            };
        };
    };
    staticVariants: {
        fadeIn: {
            initial: {
                opacity: number;
            };
            animate: {
                opacity: number;
                transition: Transition;
            };
            exit: {
                opacity: number;
                transition: Transition;
            };
        };
        slideUp: {
            initial: {
                opacity: number;
            };
            animate: {
                opacity: number;
                transition: Transition;
            };
            exit: {
                opacity: number;
                transition: Transition;
            };
        };
        scaleIn: {
            initial: {
                opacity: number;
            };
            animate: {
                opacity: number;
                transition: Transition;
            };
            exit: {
                opacity: number;
                transition: Transition;
            };
        };
        staggerContainer: {
            animate: {
                transition: {
                    staggerChildren: number;
                };
            };
        };
        cardHover: {
            initial: {
                opacity: number;
            };
            hover: {
                opacity: number;
            };
            tap: {
                opacity: number;
            };
        };
        floatIn: {
            initial: {
                opacity: number;
            };
            animate: {
                opacity: number;
                transition: Transition;
            };
        };
        glowPulse: {
            initial: {
                opacity: number;
            };
            animate: {
                opacity: number;
            };
        };
        slideInLeft: {
            initial: {
                opacity: number;
            };
            animate: {
                opacity: number;
                transition: Transition;
            };
            exit: {
                opacity: number;
                transition: Transition;
            };
        };
        slideInRight: {
            initial: {
                opacity: number;
            };
            animate: {
                opacity: number;
                transition: Transition;
            };
            exit: {
                opacity: number;
                transition: Transition;
            };
        };
    };
    transitions: Record<string, Transition>;
    resolveVariants: typeof resolveVariants;
};
//# sourceMappingURL=motion.d.ts.map