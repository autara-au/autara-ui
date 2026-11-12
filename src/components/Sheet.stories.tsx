import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from './Sheet'
import { Switch } from './Switch'

/**
 * Sheet — edge-anchored drawer built on the Radix dialog primitive.
 *
 * Four `side` values — top / right / bottom / left — control both the
 * anchor and the entrance direction. Same cream-canvas grammar as
 * `Dialog`: `--surface` fill, hairline edge, ink overlay, Solar close.
 */
const meta: Meta = {
    title: 'Atoms/Sheet',
    parameters: { layout: 'centered' },
}
export default meta
type Story = StoryObj

// ─── Four sides ────────────────────────────────────────────────────
const SideStory: React.FC<{ side: 'top' | 'right' | 'bottom' | 'left' }> = ({
    side,
}) => (
    <Sheet>
        <SheetTrigger asChild>
            <Button variant="outline" size="sm">
                Open {side}
            </Button>
        </SheetTrigger>
        <SheetContent side={side}>
            <SheetHeader>
                <SheetTitle>{`Sheet — ${side}`}</SheetTitle>
                <SheetDescription>
                    Anchored to the {side} edge of the viewport. Animation
                    direction follows the anchor.
                </SheetDescription>
            </SheetHeader>
            <div className="flex-1 px-6 pb-4 text-sm text-[var(--text-muted)]">
                Body content sits here. Use it for filters, settings,
                long-form preview, or anything that doesn&apos;t fit a centre
                dialog.
            </div>
            <SheetFooter>
                <Button variant="outline" size="sm">
                    Cancel
                </Button>
                <Button variant="dark" size="sm">
                    Apply
                </Button>
            </SheetFooter>
        </SheetContent>
    </Sheet>
)

export const RightSide: Story = { render: () => <SideStory side="right" /> }
export const LeftSide: Story = { render: () => <SideStory side="left" /> }
export const TopSide: Story = { render: () => <SideStory side="top" /> }
export const BottomSide: Story = { render: () => <SideStory side="bottom" /> }

// ─── In context — settings drawer ──────────────────────────────────
export const SettingsDrawer: Story = {
    name: 'In context — settings drawer',
    render: () => (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="dark" size="sm">
                    Open settings
                </Button>
            </SheetTrigger>
            <SheetContent side="right">
                <SheetHeader>
                    <SheetTitle>Notification settings</SheetTitle>
                    <SheetDescription>
                        Choose what reaches you and how. Changes save
                        automatically.
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 space-y-1 px-2 pb-4">
                    {[
                        {
                            title: 'New booking requests',
                            desc: 'Push + email the moment a customer books.',
                            on: true,
                        },
                        {
                            title: 'Reminders',
                            desc: '24h before a confirmed booking.',
                            on: true,
                        },
                        {
                            title: 'Weekly summary',
                            desc: 'Earnings + reviews delivered every Monday.',
                            on: false,
                        },
                        {
                            title: 'Product updates',
                            desc: 'New features and tips, monthly.',
                            on: false,
                        },
                    ].map((row) => (
                        <label
                            key={row.title}
                            className="flex cursor-pointer items-start justify-between gap-4 rounded-xl px-4 py-3 hover:bg-[var(--surface-elevated)]"
                        >
                            <div className="min-w-0">
                                <div className="text-sm font-medium text-[var(--text-strong)]">
                                    {row.title}
                                </div>
                                <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                                    {row.desc}
                                </div>
                            </div>
                            <Switch
                                defaultChecked={row.on}
                                className="mt-0.5"
                            />
                        </label>
                    ))}
                </div>
                <SheetFooter>
                    <Button variant="outline" size="sm">
                        Reset to defaults
                    </Button>
                    <Button variant="dark" size="sm">
                        Done
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    ),
}

/* ─── AUTM-1594: the close control is 44px to touch ─────────────────────
 *
 * Drawn at 28px, as it was: the sheet's quiet close. The 44px hit area is an
 * unpainted pseudo-element centred on the disc. The dashed square in the
 * first story draws that area for review only; no consumer renders it.
 * These open on load and stay off the docs page.
 */
const OpenSheet: React.FC<{ side?: 'right' | 'bottom'; showHitArea?: boolean }> = ({
    side = 'bottom',
    showHitArea = false,
}) => (
    <Sheet defaultOpen>
        {showHitArea ? (
            <style>{'[aria-label="Close drawer"]::before{outline:1px dashed var(--accent);outline-offset:-1px}'}</style>
        ) : null}
        <SheetContent side={side}>
            <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Narrow the bookings list. Changes apply when you tap Show.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 px-5 pb-4 text-[0.9375rem] text-[var(--text-muted)]">
                Mobile and in-shop, every status, this week.
            </div>
            <SheetFooter>
                <Button variant="quiet">Clear all</Button>
                <Button>Show 12 bookings</Button>
            </SheetFooter>
        </SheetContent>
    </Sheet>
)

export const CloseHitArea: Story = {
    name: 'Close control, 44px hit area shown',
    tags: ['!autodocs'],
    render: () => <OpenSheet showHitArea />,
}

export const CloseHitAreaRight: Story = {
    name: 'Close control, right side',
    tags: ['!autodocs'],
    render: () => <OpenSheet side="right" showHitArea />,
}

export const CloseDark: Story = {
    name: 'Close control, dark',
    tags: ['!autodocs'],
    globals: { theme: 'dark' },
    render: () => <OpenSheet />,
}

/** Scales the ROOT font size, as OS text scaling does. */
export const CloseText200: Story = {
    name: 'Close control, 200% text',
    tags: ['!autodocs'],
    render: function CloseText200Story() {
        React.useEffect(() => {
            const prev = document.documentElement.style.fontSize
            document.documentElement.style.fontSize = '200%'
            return () => {
                document.documentElement.style.fontSize = prev
            }
        }, [])
        return <OpenSheet />
    },
}

/**
 * AUTM-1768: a sheet opened from state, with no `SheetTrigger`. Close it with
 * Escape or its own action and keyboard focus returns to "Pause new
 * bookings", the control that opened it.
 */
export const FocusReturnsWithoutTrigger: Story = {
    name: 'Focus returns, opened from state',
    render: function FocusReturnsWithoutTriggerStory() {
        const [open, setOpen] = React.useState(false)
        return (
            <div className="flex flex-col items-start gap-3">
                <Button variant="quiet">Share your link</Button>
                <Button onClick={() => setOpen(true)}>
                    Pause new bookings
                </Button>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetContent side="bottom">
                        <SheetHeader>
                            <SheetTitle>Pause new bookings?</SheetTitle>
                            <SheetDescription>
                                Customers see you as away until you open again.
                            </SheetDescription>
                        </SheetHeader>
                        <SheetFooter>
                            <Button variant="quiet" onClick={() => setOpen(false)}>
                                Keep taking bookings
                            </Button>
                            <Button onClick={() => setOpen(false)}>
                                Pause
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>
        )
    },
}
