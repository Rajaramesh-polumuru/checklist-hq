import { HugeiconsIcon } from '@hugeicons/react'
import type { HugeiconsIconProps } from '@hugeicons/react'

interface IconProps extends Omit<HugeiconsIconProps, 'icon'> {
    icon: any // The specific icon from core-free-icons
}

export function Icon({ icon, className, ...props }: IconProps) {
    return (
        <HugeiconsIcon
            icon={icon}
            className={className}
            {...props}
        />
    )
}
