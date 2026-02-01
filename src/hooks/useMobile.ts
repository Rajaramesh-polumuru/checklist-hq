import { useState, useEffect } from 'react'

// Breakpoints matching Tailwind defaults
const MOBILE_BREAKPOINT = 640 // sm

interface DeviceInfo {
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
    isTouchDevice: boolean
    screenWidth: number
}

/**
 * Hook to detect device type and capabilities
 * Returns mobile/tablet/desktop status and touch capability
 */
export function useMobile(): DeviceInfo {
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => ({
        isMobile: typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
        isTablet: typeof window !== 'undefined' ? window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < 1024 : false,
        isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
        isTouchDevice: typeof window !== 'undefined' ? 'ontouchstart' in window || navigator.maxTouchPoints > 0 : false,
        screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
    }))

    useEffect(() => {
        const updateDeviceInfo = () => {
            const width = window.innerWidth
            setDeviceInfo({
                isMobile: width < MOBILE_BREAKPOINT,
                isTablet: width >= MOBILE_BREAKPOINT && width < 1024,
                isDesktop: width >= 1024,
                isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
                screenWidth: width,
            })
        }

        // Update on resize
        window.addEventListener('resize', updateDeviceInfo)

        // Initial update
        updateDeviceInfo()

        return () => window.removeEventListener('resize', updateDeviceInfo)
    }, [])

    return deviceInfo
}

/**
 * Simple hook that just returns if we're on mobile
 */
export function useIsMobile(): boolean {
    const { isMobile } = useMobile()
    return isMobile
}
