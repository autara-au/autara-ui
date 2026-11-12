import type { Meta, StoryObj } from '@storybook/react-vite'
import { AppBar } from './AppBar'
import { AppTabBar, type AppTabBarItem } from './AppTabBar'
import { BackButton } from './BackButton'
import { IconButton } from './IconButton'
import { CalendarGlyph, ChatGlyph, UserGlyph } from './_shellGlyphs'

/**
 * AUTM-1781: the top bar of a signed-in screen. Leading, a one-line title,
 * inline navigation and a trailing slot. The title names the screen; the
 * content below owns the h1.
 */
const meta: Meta<typeof AppBar> = {
    title: 'App shell/AppBar',
    component: AppBar,
    parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof AppBar>

const Wordmark = () => <span className="text-lg font-bold text-[var(--accent)]">autara</span>

/** A pushed screen on a phone: back, the screen's name, the account entry. */
export const PushedScreen: Story = {
    parameters: { viewport: { defaultViewport: 'phone' } },
    render: () => (
        <AppBar
            leading={<BackButton ariaLabel="Back to bookings" />}
            title="Booking"
            trailing={<IconButton icon={<UserGlyph />} label="Account" variant="ghost" />}
        />
    ),
}

/** Edge: a long title truncates in the bar; the page repeats it in full. */
export const LongTitle: Story = {
    parameters: { viewport: { defaultViewport: 'phoneSmall' } },
    render: () => (
        <AppBar
            leading={<BackButton ariaLabel="Back" />}
            title="Full paint correction with two-stage machine polish and ceramic coating"
            trailing={<IconButton icon={<UserGlyph />} label="Account" variant="ghost" />}
        />
    ),
}

const nav: AppTabBarItem[] = [
    { key: 'bookings', label: 'Bookings', icon: <CalendarGlyph />, href: '#', active: true, badge: 1, badgeLabel: '1 payment due' },
    { key: 'messages', label: 'Messages', icon: <ChatGlyph />, href: '#', badge: 3, badgeLabel: '3 unread' },
    { key: 'account', label: 'Account', icon: <UserGlyph />, href: '#' },
]

/** In context, desktop: the logo, the destinations inline, Help. */
export const DesktopWithNav: Story = {
    render: () => (
        <AppBar leading={<Wordmark />} trailing={<a className="px-3 py-2 text-[0.9375rem] font-medium" href="#">Help</a>}>
            <AppTabBar label="Account" variant="inline" items={nav} testIdPrefix="nav" />
        </AppBar>
    ),
}
