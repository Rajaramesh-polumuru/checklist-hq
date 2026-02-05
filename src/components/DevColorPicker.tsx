import { useState, useEffect, useCallback } from 'react'
import { PaintBrush01Icon, Cancel01Icon, Tick01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'

// Curated PASTEL color palettes - thinking like CDO/CMO
// Softer, more refined colors for a premium SaaS productivity app
const COLOR_THEMES = {
    // Soft Teal (Trust, Growth, Productivity)
    teal: {
        name: 'Soft Teal',
        subtitle: 'Trust & Growth',
        primary: 'hsl(172 50% 45%)',
        ring: 'hsl(172 50% 45% / 0.15)',
        preview: 'bg-teal-400',
    },
    // Sage Green (Natural, Calm, Professional)
    sage: {
        name: 'Sage',
        subtitle: 'Natural & Calm',
        primary: 'hsl(155 35% 50%)',
        ring: 'hsl(155 35% 50% / 0.15)',
        preview: 'bg-emerald-400',
    },
    // Soft Indigo (Premium, Professional, Modern)
    indigo: {
        name: 'Soft Indigo',
        subtitle: 'Premium & Pro',
        primary: 'hsl(239 60% 65%)',
        ring: 'hsl(239 60% 65% / 0.15)',
        preview: 'bg-indigo-400',
    },
    // Lavender (Creative, Elegant, Modern)
    lavender: {
        name: 'Lavender',
        subtitle: 'Elegant & Modern',
        primary: 'hsl(263 50% 60%)',
        ring: 'hsl(263 50% 60% / 0.15)',
        preview: 'bg-violet-400',
    },
    // Soft Blue (Corporate, Trust, Reliable)
    blue: {
        name: 'Soft Blue',
        subtitle: 'Trust & Reliable',
        primary: 'hsl(217 70% 60%)',
        ring: 'hsl(217 70% 60% / 0.15)',
        preview: 'bg-blue-400',
    },
    // Sky (Fresh, Open, Friendly)
    sky: {
        name: 'Sky',
        subtitle: 'Fresh & Open',
        primary: 'hsl(199 70% 55%)',
        ring: 'hsl(199 70% 55% / 0.15)',
        preview: 'bg-sky-400',
    },
    // Coral (Warm, Approachable, Friendly)
    coral: {
        name: 'Coral',
        subtitle: 'Warm & Friendly',
        primary: 'hsl(12 70% 65%)',
        ring: 'hsl(12 70% 65% / 0.15)',
        preview: 'bg-orange-300',
    },
    // Rose (Soft, Modern, Approachable)
    rose: {
        name: 'Soft Rose',
        subtitle: 'Warm & Modern',
        primary: 'hsl(350 65% 65%)',
        ring: 'hsl(350 65% 65% / 0.15)',
        preview: 'bg-rose-400',
    },
    // Ruby (Classic, Bold, Confident)
    ruby: {
        name: 'Ruby',
        subtitle: 'Bold & Confident',
        primary: 'hsl(0 70% 50%)',
        ring: 'hsl(0 70% 50% / 0.15)',
        preview: 'bg-red-500',
    },
    // Cherry (Bright, Energetic, Playful)
    cherry: {
        name: 'Cherry',
        subtitle: 'Bright & Energetic',
        primary: 'hsl(355 80% 55%)',
        ring: 'hsl(355 80% 55% / 0.15)',
        preview: 'bg-red-400',
    },
    // Crimson (Deep, Luxurious, Powerful)
    crimson: {
        name: 'Crimson',
        subtitle: 'Deep & Powerful',
        primary: 'hsl(348 75% 45%)',
        ring: 'hsl(348 75% 45% / 0.15)',
        preview: 'bg-red-600',
    },
    // Scarlet (Warm, Passionate, Dynamic)
    scarlet: {
        name: 'Scarlet',
        subtitle: 'Warm & Passionate',
        primary: 'hsl(8 85% 55%)',
        ring: 'hsl(8 85% 55% / 0.15)',
        preview: 'bg-red-500',
    },
    // Vermillion (Orange-Red, Vibrant, Creative)
    vermillion: {
        name: 'Vermillion',
        subtitle: 'Vibrant & Creative',
        primary: 'hsl(15 90% 55%)',
        ring: 'hsl(15 90% 55% / 0.15)',
        preview: 'bg-orange-500',
    },
    // Wine (Burgundy, Sophisticated, Elegant)
    wine: {
        name: 'Wine',
        subtitle: 'Sophisticated & Elegant',
        primary: 'hsl(340 55% 40%)',
        ring: 'hsl(340 55% 40% / 0.15)',
        preview: 'bg-rose-700',
    },
    // Slate (Neutral, Professional, Minimal)
    slate: {
        name: 'Slate',
        subtitle: 'Minimal & Clean',
        primary: 'hsl(221 30% 50%)',
        ring: 'hsl(221 30% 50% / 0.15)',
        preview: 'bg-slate-500',
    },
}

type ThemeKey = keyof typeof COLOR_THEMES

export function DevColorPicker() {
    const [isOpen, setIsOpen] = useState(false)

    // Initialize theme from localStorage
    const [activeTheme, setActiveTheme] = useState<ThemeKey>(() => {
        const saved = localStorage.getItem('dev-color-theme') as ThemeKey | null
        return saved && COLOR_THEMES[saved] ? saved : 'scarlet'
    })

    // Apply theme to CSS variables
    const applyTheme = useCallback((themeKey: ThemeKey) => {
        const theme = COLOR_THEMES[themeKey]
        document.documentElement.style.setProperty('--color-primary', theme.primary)
        document.documentElement.style.setProperty('--color-ring', theme.primary)
        document.documentElement.style.setProperty('--shadow-ring', `0 0 0 3px ${theme.ring}`)
        setActiveTheme(themeKey)

        // Save to localStorage for persistence during dev
        localStorage.setItem('dev-color-theme', themeKey)
    }, [])

    // Apply initial theme to DOM on mount
    useEffect(() => {
        const theme = COLOR_THEMES[activeTheme]
        document.documentElement.style.setProperty('--color-primary', theme.primary)
        document.documentElement.style.setProperty('--color-ring', theme.primary)
        document.documentElement.style.setProperty('--shadow-ring', `0 0 0 3px ${theme.ring}`)
    }, [activeTheme])

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 left-4 z-50 p-3 rounded-full bg-card border shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
                title="Color Theme Picker (Dev)"
            >
                <Icon icon={PaintBrush01Icon} className="h-5 w-5 text-primary group-hover:rotate-12 transition-transform" />
            </button>
        )
    }

    return (
        <div className="fixed bottom-4 left-4 z-50 p-4 rounded-2xl bg-card border shadow-2xl w-80 animate-fade-in overflow-y-auto max-h-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Icon icon={PaintBrush01Icon} className="h-5 w-5 text-primary" />
                    <div>
                        <h3 className="font-semibold text-sm">Primary Color</h3>
                        <p className="text-xs text-muted-foreground">Dev Theme Picker</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                    <Icon icon={Cancel01Icon} className="h-4 w-4" />
                </button>
            </div>

            {/* Color Grid */}
            <div className="grid grid-cols-3 gap-2">
                {(Object.entries(COLOR_THEMES) as [ThemeKey, typeof COLOR_THEMES.teal][]).map(
                    ([key, theme]) => (
                        <button
                            key={key}
                            onClick={() => applyTheme(key)}
                            className={`relative p-3 rounded-xl border-2 transition-all hover:scale-105 ${activeTheme === key
                                ? 'border-primary shadow-md'
                                : 'border-transparent hover:border-border'
                                }`}
                        >
                            {/* Color swatch */}
                            <div
                                className={`w-full aspect-square rounded-lg ${theme.preview} mb-2 shadow-sm`}
                            />
                            {/* Label */}
                            <p className="text-xs font-medium truncate">{theme.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                                {theme.subtitle}
                            </p>
                            {/* Active indicator */}
                            {activeTheme === key && (
                                <div className="absolute top-1 right-1 p-0.5 rounded-full bg-primary text-primary-foreground">
                                    <Icon icon={Tick01Icon} className="h-2.5 w-2.5" />
                                </div>
                            )}
                        </button>
                    )
                )}
            </div>

            {/* Info */}
            <div className="mt-4 pt-3 border-t">
                <p className="text-xs text-muted-foreground text-center">
                    Changes apply instantly. Persists in localStorage.
                </p>
                <p className="text-xs text-muted-foreground text-center mt-1">
                    Remove this component before production.
                </p>
            </div>
        </div>
    )
}
