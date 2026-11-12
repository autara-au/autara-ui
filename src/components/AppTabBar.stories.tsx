import type { Meta, StoryObj } from '@storybook/react-vite'
import { useLayoutEffect, useState, type ReactNode } from 'react'
import { AppTabBar, type AppTabBarItem } from './AppTabBar'
import { CalendarGlyph, ChatGlyph, UserGlyph } from './_shellGlyphs'

/**
 * AUTM-1781: a signed-in app's destinations. On a phone, the floating dock
 * from the customer app design (canvas AppBookings): ink, icons, the current
 * tab a lime pill with its name. From md, the same items inline in the top
 * bar (see AppBar's stories).
 */
const meta: Meta<typeof AppTabBar> = {
    title: 'App shell/AppTabBar',
    component: AppTabBar,
    parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof AppTabBar>

const items = (active: string, counts: { bookings?: number; messages?: number } = {}): AppTabBarItem[] => [
    {
        key: 'bookings',
        label: 'Bookings',
        icon: <CalendarGlyph />,
        href: '#bookings',
        active: active === 'bookings',
        badge: counts.bookings ?? 0,
        badgeLabel: `${counts.bookings ?? 0} payment due`,
    },
    {
        key: 'messages',
        label: 'Messages',
        icon: <ChatGlyph />,
        href: '#messages',
        active: active === 'messages',
        badge: counts.messages ?? 0,
        badgeLabel: `${counts.messages ?? 0} unread`,
    },
    { key: 'account', label: 'Account', icon: <UserGlyph />, href: '#account', active: active === 'account' },
]

/** The phone dock. Floating above the bottom of the frame, as in the app. */
export const Default: Story = {
    parameters: { viewport: { defaultViewport: 'phone' } },
    render: () => (
        <div className="min-h-[24rem] bg-[var(--surface)] p-4 text-[var(--text-muted)]">
            The page scrolls above the bar.
            <AppTabBar label="Account" items={items('bookings')} hideFrom="never" />
        </div>
    ),
}

/** Something waits: a payment due on Bookings, unread messages on Messages. */
export const WithCounts: Story = {
    parameters: { viewport: { defaultViewport: 'phone' } },
    render: () => (
        <div className="min-h-[24rem] bg-[var(--surface)]">
            <AppTabBar label="Account" items={items('messages', { bookings: 1, messages: 3 })} hideFrom="never" />
        </div>
    ),
}

/**
 * 200% text the way a phone gives it: the ROOT font size doubles, so every rem
 * in the dock grows (a wrapper's `font-size: 200%` scales none of them, which
 * is how the old story missed AUTM-1816). Restored when the story unmounts.
 */
function RootFontSize({ size, children }: { size: string; children: ReactNode }) {
    useLayoutEffect(() => {
        const root = document.documentElement
        const before = root.style.fontSize
        root.style.fontSize = size
        return () => {
            root.style.fontSize = before
        }
    }, [size])
    return <>{children}</>
}

/** Docks stacked in one frame: each is fixed, so each sits in its own transformed box. */
function DockFrame({ caption, children }: { caption: string; children: ReactNode }) {
    return (
        <div className="relative h-[8.5rem] border-b border-[var(--hairline)] bg-[var(--band)]" style={{ transform: 'translateZ(0)' }}>
            <p className="px-3 pt-1 text-xs text-[var(--text-muted)]">{caption}</p>
            {children}
        </div>
    )
}

/**
 * AUTM-1802: the current tab's own count sits in the lime pill after the
 * name, an ink disc with a lime figure, the pill growing to fit. The other
 * tabs keep the brand disc on the icon. Messages current, 3 and 12 unread.
 */
export const CurrentTabCount: Story = {
    parameters: { viewport: { defaultViewport: 'phone' } },
    render: () => (
        <div className="bg-[var(--surface)]">
            {[3, 12].map((n) => (
                <DockFrame key={n} caption={`${n} unread`}>
                    <AppTabBar label={`Account ${n}`} items={items('messages', { bookings: 1, messages: n })} hideFrom="never" />
                </DockFrame>
            ))}
        </div>
    ),
}

/**
 * AUTM-1816: the same at 200% text. The name never wraps; when the dock
 * cannot fit it, the pill shows the icon and the count, and the tab is still
 * announced "Messages, 12 unread". No sideways scroll.
 */
export const CurrentTabCountLargeText: Story = {
    parameters: { viewport: { defaultViewport: 'phone' } },
    render: () => (
        <RootFontSize size="200%">
            <div className="bg-[var(--surface)]">
                {[3, 12].map((n) => (
                    <DockFrame key={n} caption={`${n} unread, 200% text`}>
                        <AppTabBar label={`Account ${n}`} items={items('messages', { bookings: 1, messages: n })} hideFrom="never" />
                    </DockFrame>
                ))}
            </div>
        </RootFontSize>
    ),
}

/** Edge: a count past 99 on another tab, and Account current at 200% text (the root's, see above). */
export const LargeCountAndText: Story = {
    parameters: { viewport: { defaultViewport: 'phoneSmall' } },
    render: () => (
        <RootFontSize size="200%">
            <div className="min-h-[24rem] bg-[var(--surface)]">
                <AppTabBar label="Account" items={items('account', { messages: 140 })} hideFrom="never" />
            </div>
        </RootFontSize>
    ),
}

/** The same items inline, for a top bar on a tablet or a desktop. */
export const Inline: Story = {
    render: () => (
        <div className="bg-[var(--surface)] p-4">
            <AppTabBar label="Account" variant="inline" items={items('bookings', { bookings: 1, messages: 3 })} testIdPrefix="nav" />
        </div>
    ),
}

/**
 * Motion: tap a tab. The lime pill slides to it while the tabs make room and
 * the name fades in (450ms, the soft curve). With reduced motion on, it is
 * simply there.
 */
export const Switching: Story = {
    parameters: { viewport: { defaultViewport: 'phone' } },
    render: function Switching() {
        const [active, setActive] = useState('bookings')
        const list = items(active, { bookings: 1, messages: 3 }).map((i) => ({
            ...i,
            href: undefined,
            element: (
                <button
                    type="button"
                    onClick={() => setActive(i.key)}
                    style={{ border: 0, background: 'transparent', font: 'inherit', cursor: 'pointer' }}
                />
            ),
        }))
        return (
            <div className="min-h-[24rem] bg-[var(--surface)] p-4 text-[var(--text-muted)]">
                Tap Messages, then Account, then Bookings.
                <AppTabBar label="Switching" items={list} hideFrom="never" />
            </div>
        )
    },
}
