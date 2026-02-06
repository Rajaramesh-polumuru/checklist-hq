import { tokens } from '@/design-system/tokens'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Hook for standardized button micro-interactions.
 * Respects user's reduced motion preference.
 */
export function useButtonInteraction() {
    const reducedMotion = useReducedMotion()

    if (reducedMotion) {
        return {}
    }

    return {
        whileTap: { scale: 0.98 },
        whileHover: { scale: 1.02 },
        transition: {
            duration: 0.1,
            ease: tokens.motion.easing.default
        },
    }
}

/**
 * Hook for list item interactions (hover/focus physics).
 * Background colors are handled via CSS classes in the component
 * so they respond to CSS variables and support dark mode.
 * Respects user's reduced motion preference.
 */
export function useListItemInteraction(isSelected: boolean = false) {
    const reducedMotion = useReducedMotion()

    if (reducedMotion) {
        return {
            animate: {},
            transition: { duration: 0 },
        }
    }

    return {
        animate: {
            scale: isSelected ? 1.01 : 1,
        },
        whileHover: {
            x: 4, // slight nudge on hover
        },
        whileTap: { scale: 0.99 },
        transition: { duration: 0.2 },
    }
}

/**
 * Hook for checkbox toggle animation.
 * Respects user's reduced motion preference.
 */
export function useCheckboxAnimation(checked: boolean) {
    const reducedMotion = useReducedMotion()

    if (reducedMotion) {
        return {
            initial: false,
            animate: checked ? "checked" : "unchecked",
            variants: {
                checked: { opacity: 1 },
                unchecked: { opacity: 0.5 },
            },
            transition: { duration: 0 },
        }
    }

    return {
        initial: false,
        animate: checked ? "checked" : "unchecked",
        variants: {
            checked: { scale: 1, opacity: 1 },
            unchecked: { scale: 0.8, opacity: 0.5 },
        },
        transition: {
            type: "spring",
            stiffness: 500,
            damping: 30,
        },
    }
}
