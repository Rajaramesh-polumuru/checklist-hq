import { AnimatePresence, motion } from "framer-motion"
import { useLocation, Outlet } from "react-router-dom"
import { resolveVariants } from "@/lib/motion"
import { useReducedMotion } from "@/hooks/useReducedMotion"

export function PageTransition() {
    const location = useLocation()
    const reduced = useReducedMotion()

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                variants={resolveVariants("slideUp", reduced)}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full"
            >
                <Outlet />
            </motion.div>
        </AnimatePresence>
    )
}
