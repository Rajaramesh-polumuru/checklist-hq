/**
 * Mobile UX Test Page
 * 
 * This page showcases all mobile UI improvements and allows
 * testing of touch targets, responsive layouts, and mobile-specific features.
 * 
 * Access at: /mobile-test (add to router for testing)
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import {
    CheckListIcon,
    AlertCircleIcon,
    Tick01Icon,
    Globe02Icon,
    PlayIcon,
    Cancel01Icon,
} from '@hugeicons/core-free-icons'

export function MobileUXTest() {
    const [testInput, setTestInput] = useState('')

    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">Mobile UX Test Page</h1>
                    <p className="text-muted-foreground text-sm md:text-base">
                        Test touch targets, responsive layouts, and mobile-specific features
                    </p>
                </div>

                {/* Test Sections */}
                <div className="space-y-6">
                    {/* 1. Touch Targets - Buttons */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Icon icon={Tick01Icon} className="text-success" />
                                Touch Targets - Buttons (44px minimum)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                <Button size="sm">Small Button</Button>
                                <Button size="default">Default Button</Button>
                                <Button size="lg">Large Button</Button>
                                <Button size="icon">
                                    <Icon icon={PlayIcon} />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                On mobile, all buttons are minimum 44px tall (h-11). Desktop uses smaller sizes.
                            </p>
                        </CardContent>
                    </Card>

                    {/* 2. Input Font Size */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Icon icon={CheckListIcon} className="text-primary" />
                                Input Font Size (16px prevents iOS zoom)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Input
                                type="text"
                                placeholder="Type here (16px font on mobile)"
                                value={testInput}
                                onChange={(e) => setTestInput(e.target.value)}
                            />
                            <Input type="email" placeholder="Email input" />
                            <Input type="password" placeholder="Password input" />
                            <p className="text-xs text-muted-foreground">
                                Mobile: text-base (16px), Desktop: text-sm (14px). This prevents iOS auto-zoom.
                            </p>
                        </CardContent>
                    </Card>

                    {/* 3. Modal/Dialog */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Icon icon={AlertCircleIcon} className="text-warning" />
                                Modal Sizing (breathing room on mobile)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button>Open Test Modal</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Test Modal</DialogTitle>
                                        <DialogDescription>
                                            This modal has max-w-[calc(100vw-2rem)] on mobile for breathing room.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <Input placeholder="Test input in modal" />
                                        <p className="text-sm text-muted-foreground">
                                            Try this on a small screen (375px) - it should have 1rem margin on each side.
                                        </p>
                                        <div className="flex gap-2">
                                            <Button>Primary</Button>
                                            <Button variant="outline">Secondary</Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <p className="text-xs text-muted-foreground mt-3">
                                Modal is responsive with p-4 on mobile, p-6 on desktop.
                            </p>
                        </CardContent>
                    </Card>

                    {/* 4. Responsive Grid */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Icon icon={Globe02Icon} className="text-info" />
                                Responsive Grid Layout
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                <div className="h-24 bg-primary/10 rounded-lg flex items-center justify-center text-sm font-medium">
                                    Card 1
                                </div>
                                <div className="h-24 bg-secondary/10 rounded-lg flex items-center justify-center text-sm font-medium">
                                    Card 2
                                </div>
                                <div className="h-24 bg-success/10 rounded-lg flex items-center justify-center text-sm font-medium">
                                    Card 3
                                </div>
                                <div className="h-24 bg-warning/10 rounded-lg flex items-center justify-center text-sm font-medium">
                                    Card 4
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                Mobile: 1 column | Tablet: 2 columns | Desktop: 4 columns
                            </p>
                        </CardContent>
                    </Card>

                    {/* 5. Active States */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Icon icon={PlayIcon} className="text-primary" />
                                Touch Feedback (active:scale-95)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <Button variant="primary" className="w-full">
                                    Tap Me - Primary
                                </Button>
                                <Button variant="secondary" className="w-full">
                                    Tap Me - Secondary
                                </Button>
                                <Button variant="outline" className="w-full">
                                    Tap Me - Outline
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                All buttons have active:scale-95 for visual feedback on tap.
                            </p>
                        </CardContent>
                    </Card>

                    {/* 6. Spacing & Padding */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Icon icon={CheckListIcon} className="text-success" />
                                Responsive Spacing
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted p-4 md:p-6 lg:p-8 rounded-lg">
                                <p className="text-sm">
                                    This container has:<br />
                                    - Mobile: p-4 (1rem)<br />
                                    - Tablet: p-6 (1.5rem)<br />
                                    - Desktop: p-8 (2rem)
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
                                <Badge>gap-3 mobile</Badge>
                                <Badge>gap-4 desktop</Badge>
                                <Badge>Responsive</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Testing Checklist */}
                    <Card className="border-2 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-primary">Mobile Testing Checklist</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <Icon icon={Tick01Icon} className="h-4 w-4 text-success mt-0.5" />
                                    <span>All buttons ≥ 44x44px on mobile</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Icon icon={Tick01Icon} className="h-4 w-4 text-success mt-0.5" />
                                    <span>Inputs are 16px font (no iOS zoom)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Icon icon={Tick01Icon} className="h-4 w-4 text-success mt-0.5" />
                                    <span>Modals have breathing room (calc(100vw-2rem))</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Icon icon={Tick01Icon} className="h-4 w-4 text-success mt-0.5" />
                                    <span>Grids stack properly on mobile</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Icon icon={Tick01Icon} className="h-4 w-4 text-success mt-0.5" />
                                    <span>Responsive padding (p-4 → p-6 → p-8)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Icon icon={Tick01Icon} className="h-4 w-4 text-success mt-0.5" />
                                    <span>Touch feedback (active:scale-95)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Icon icon={Cancel01Icon} className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <span className="text-muted-foreground">No horizontal scroll (test on real device)</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Device Testing */}
                    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
                        <CardHeader>
                            <CardTitle>Test on Real Devices</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                <div className="bg-background p-3 rounded-lg border">
                                    <p className="font-semibold">iPhone SE</p>
                                    <p className="text-xs text-muted-foreground">375px</p>
                                </div>
                                <div className="bg-background p-3 rounded-lg border">
                                    <p className="font-semibold">iPhone 14</p>
                                    <p className="text-xs text-muted-foreground">390px</p>
                                </div>
                                <div className="bg-background p-3 rounded-lg border">
                                    <p className="font-semibold">Pro Max</p>
                                    <p className="text-xs text-muted-foreground">430px</p>
                                </div>
                                <div className="bg-background p-3 rounded-lg border">
                                    <p className="font-semibold">Android</p>
                                    <p className="text-xs text-muted-foreground">360-420px</p>
                                </div>
                                <div className="bg-background p-3 rounded-lg border">
                                    <p className="font-semibold">Tablet</p>
                                    <p className="text-xs text-muted-foreground">768px+</p>
                                </div>
                                <div className="bg-background p-3 rounded-lg border">
                                    <p className="font-semibold">Desktop</p>
                                    <p className="text-xs text-muted-foreground">1024px+</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-muted-foreground pb-8">
                    <p>Resize your browser or use device emulation to test responsive behavior</p>
                    <p className="mt-1">Current window width: Use DevTools to inspect</p>
                </div>
            </div>
        </main>
    )
}
