import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'
import { AccountMenu, type AccountMenuProps } from './AccountMenu'
import { Badge } from './Badge'

/**
 * Stories for the one shared account menu (AUTM-1127).
 *
 * Almost every story renders the menu OPEN, because a closed menu tells you
 * nothing about the thing being reviewed. Check every one in both themes with
 * the toolbar switcher: the merchant surfaces run dark and the customer site
 * runs light, so half of these are wrong in exactly one mode if a token is
 * missed.
 */
const meta: Meta<typeof AccountMenu> = {
    title: 'Molecules/AccountMenu',
    component: AccountMenu,
    parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof AccountMenu>

/* ─── Solar Linear style glyphs, inlined (autara-ui takes no icon dep) ── */

function Glyph({ d, size = 20 }: { d: string; size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d={d} />
        </svg>
    )
}

const UserIcon = () => <Glyph d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0" />
const HelpIcon = () => (
    <Glyph d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.8 9.4A2.3 2.3 0 0 1 14 10.4c0 1.6-2 2-2 3.3M12 17h.01" />
)
const DocIcon = () => <Glyph d="M14 3v5h5M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5ZM9 13h6M9 17h4" />
const ShieldIcon = () => <Glyph d="M12 3 5 6v5.5c0 4 3 7.6 7 9.5 4-1.9 7-5.5 7-9.5V6l-7-3ZM9.5 12l2 2 3.5-4" />
const LogoutIcon = () => <Glyph d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2M10 12h10m0 0-3-3m3 3-3 3" />
const CalendarIcon = () => <Glyph d="M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
const BellIcon = () => <Glyph d="M6 19v-6a6 6 0 1 1 12 0v6M3 19h18M9.5 22h5" />
const SettingsIcon = () => <Glyph d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4.5 12a7.5 7.5 0 0 1 .2-1.6l-1.6-2 2-3.4 2.4.7A7.5 7.5 0 0 1 10 3.5L10.5 1h3l.5 2.5c.9.3 1.7.7 2.4 1.2l2.4-.7 2 3.4-1.6 2a7.6 7.6 0 0 1 0 3.2l1.6 2-2 3.4-2.4-.7c-.7.5-1.5.9-2.4 1.2L13.5 23h-3l-.5-2.5" />
const WalletIcon = () => <Glyph d="M3 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2m-16 0v9a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-3m-4-3h4v3h-4a1.5 1.5 0 0 1 0-3Z" />
const BoxIcon = () => <Glyph d="M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 0v18M4 7l8 4 8-4" />
const StarIcon = () => <Glyph d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 9.7l5.4-.8L12 4Z" />

/* ─── Fixtures ───────────────────────────────────────────────────────── */

const customer = {
    name: 'Sam Whitfield',
    secondary: 'sam.whitfield@example.com',
}

const merchant = {
    name: 'Priya Nair',
    secondary: 'Gleam Car Care Co.',
}

const customerItems = [
    { key: 'profile', label: 'Profile', icon: <UserIcon />, href: '/account' },
    { key: 'help', label: 'Help and support', icon: <HelpIcon />, href: '/help' },
]

/**
 * Keeps the panel open so the story shows the thing under review. Uncontrolled
 * in real use; this is a story affordance, not the API.
 */
function OpenMenu(props: AccountMenuProps) {
    const [open, setOpen] = React.useState(true)
    return <AccountMenu {...props} open={open} onOpenChange={setOpen} />
}

/**
 * Height so the portaled panel has somewhere to go in the canvas.
 *
 * `items-start` is load-bearing: a flex container stretches its children by
 * default, and the trigger is `min-h-11` with no maximum, so under the default
 * `stretch` it grows to the full height of the row and its open-state fill
 * paints a tall grey slab. Real headers use `items-center`, which is why this
 * never shows up in a consumer, but a story that stretches it is showing the
 * wrong thing.
 */
function Stage({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={className ?? 'flex min-h-[30rem] items-start justify-end p-4'}>
            {children}
        </div>
    )
}

/* ─── Default ────────────────────────────────────────────────────────── */

export const Default: Story = {
    name: 'Default',
    render: () => (
        <Stage>
            <OpenMenu
                identity={customer}
                items={customerItems}
                signOut={{ key: 'sign-out', label: 'Sign out', icon: <LogoutIcon /> }}
                primaryAction={{
                    key: 'bookings',
                    label: 'My bookings',
                    icon: <CalendarIcon />,
                    href: '/account/bookings',
                }}
            />
        </Stage>
    ),
}

/* ─── Variants ───────────────────────────────────────────────────────── */

export const TriggerVariants: Story = {
    name: 'Trigger: inline, avatar, block',
    render: () => (
        <div className="flex flex-wrap items-start gap-6 p-4">
            <div className="w-56 space-y-2">
                <p className="text-xs text-[var(--text-muted)]">inline (customer-web)</p>
                <AccountMenu identity={customer} items={customerItems} triggerVariant="inline" />
            </div>
            <div className="w-56 space-y-2">
                <p className="text-xs text-[var(--text-muted)]">avatar (merchant-web)</p>
                <AccountMenu identity={customer} items={customerItems} triggerVariant="avatar" />
            </div>
            <div className="w-64 space-y-2">
                <p className="text-xs text-[var(--text-muted)]">block (admin sidebar)</p>
                <div className="rounded-autara-lg border border-[var(--glass-edge)] bg-[var(--surface)] p-2">
                    <AccountMenu
                        identity={customer}
                        items={customerItems}
                        triggerVariant="block"
                        side="right"
                        align="end"
                    />
                </div>
            </div>
        </div>
    ),
}

/**
 * One open menu with a caption, sized so several sit side by side.
 *
 * They go in a ROW, not a grid, and that is not a layout preference. Radix
 * positions the panel `fixed` and clamps it back into the viewport when it
 * would fall outside, so a second grid row whose triggers sit below the fold
 * has its panels dragged up on top of the first row's. The accent story did
 * exactly that: four panels drawn in the same place, the two captioned act and
 * money covered by the two drawn after them, so the story showed the wrong
 * colour under the right caption. A caption and a swatch that disagree are
 * worse than no swatch.
 *
 * `portalContainer` does NOT solve this and was tried first: it fixes which
 * element the panel INHERITS from, which is why `BothThemes` needs it, and
 * changes nothing about where a fixed-strategy panel is placed.
 */
function MenuPane({ caption, ...props }: AccountMenuProps & { caption: string }) {
    return (
        <div className="w-[20rem] shrink-0 space-y-2">
            <p className="min-h-8 text-xs text-[var(--text-muted)]">{caption}</p>
            <OpenMenu {...props} align="start" />
        </div>
    )
}

export const AccentTones: Story = {
    name: 'Accent row: act (default), money, flight, neutral',
    render: () => (
        <div className="flex min-h-[30rem] items-start gap-6 overflow-x-auto p-4">
            {(['act', 'money', 'flight', 'neutral'] as const).map((accent) => (
                <MenuPane
                    key={accent}
                    caption={`accent="${accent}"${accent === 'act' ? ' (default)' : ''}`}
                    identity={customer}
                    items={customerItems}
                    primaryAction={{
                        key: 'bookings',
                        label: 'My bookings',
                        icon: <CalendarIcon />,
                        href: '#',
                        accent,
                    }}
                    signOut={{ key: 'sign-out', label: 'Sign out', icon: <LogoutIcon /> }}
                    testId={`account-menu-${accent}`}
                />
            ))}
        </div>
    ),
}

/** AUTM-1483: the group titles read "Business", "Money" and "Account" as
 *  written, at 0.75rem and weight 500 with no letterspacing, in both the
 *  menu and the sheet. They used to render as letterspaced capitals. */
export const TitledSections: Story = {
    name: 'Titled sections (merchant-mobile IA)',
    render: () => (
        <Stage>
            <OpenMenu
                identity={merchant}
                sections={[
                    {
                        key: 'business',
                        title: 'Business',
                        items: [
                            { key: 'services', label: 'Services', icon: <BoxIcon />, href: '#' },
                            { key: 'reviews', label: 'Reviews', icon: <StarIcon />, href: '#' },
                        ],
                    },
                    {
                        key: 'money',
                        title: 'Money',
                        items: [
                            { key: 'earnings', label: 'Earnings', icon: <WalletIcon />, href: '#' },
                        ],
                    },
                    {
                        key: 'account',
                        title: 'Account',
                        items: [
                            {
                                key: 'notifications',
                                label: 'Notifications',
                                icon: <BellIcon />,
                                trailing: '3',
                                href: '#',
                            },
                            { key: 'settings', label: 'Settings', icon: <SettingsIcon />, href: '#' },
                        ],
                    },
                ]}
                signOut={{ key: 'sign-out', label: 'Sign out', icon: <LogoutIcon /> }}
            />
        </Stage>
    ),
}

export const Sheet: Story = {
    name: 'Presentation: sheet (merchant-mobile)',
    parameters: { viewport: { defaultViewport: 'phone' } },
    render: () => (
        <div className="min-h-[36rem] p-4">
            <p className="mb-3 text-xs text-[var(--text-muted)]">
                Bottom sheet, scrim, focus trap, Escape to close. Rendered open so the
                panel is reviewable without a click.
            </p>
            <OpenMenu
                presentation="sheet"
                identity={merchant}
                triggerVariant="avatar"
                sections={[
                    {
                        key: 'business',
                        title: 'Business',
                        items: [
                            { key: 'services', label: 'Services', icon: <BoxIcon />, onSelect: () => {} },
                            { key: 'reviews', label: 'Reviews', icon: <StarIcon />, onSelect: () => {} },
                        ],
                    },
                    {
                        key: 'account',
                        title: 'Account',
                        items: [
                            { key: 'settings', label: 'Settings', icon: <SettingsIcon />, onSelect: () => {} },
                        ],
                    },
                ]}
                signOut={{ key: 'sign-out', label: 'Sign out', icon: <LogoutIcon />, onSelect: () => {} }}
                primaryAction={{
                    key: 'today',
                    label: "Today's schedule",
                    icon: <CalendarIcon />,
                    onSelect: () => {},
                }}
            />
        </div>
    ),
}

export const Auto: Story = {
    name: 'Presentation: auto (dropdown above 768px, sheet below)',
    render: () => (
        <div className="min-h-[30rem] p-4">
            <p className="mb-3 text-xs text-[var(--text-muted)]">
                Resize the canvas across 768px, or switch viewport to iPhone 14, and open it again.
            </p>
            <AccountMenu
                presentation="auto"
                identity={merchant}
                items={customerItems}
                signOut={{ key: 'sign-out', label: 'Sign out', icon: <LogoutIcon /> }}
            />
        </div>
    ),
}

/* ─── States and edge cases ──────────────────────────────────────────── */

export const Loading: Story = {
    name: 'Loading',
    render: () => (
        <Stage>
            <OpenMenu
                identity={{}}
                loading
                items={customerItems}
                signOut={{ key: 'sign-out', label: 'Sign out', icon: <LogoutIcon /> }}
                primaryAction={{ key: 'bookings', label: 'My bookings', href: '#' }}
            />
        </Stage>
    ),
}

export const AvatarFallbacks: Story = {
    name: 'Avatar: photo, initials, and nothing at all',
    render: () => (
        <div className="flex min-h-[26rem] items-start gap-6 overflow-x-auto p-4">
            <MenuPane
                caption="photo"
                identity={{
                    ...customer,
                    avatarUrl:
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop',
                }}
                items={customerItems}
                testId="account-menu-photo"
            />
            <MenuPane
                caption="no photo: initials derived from the name"
                identity={customer}
                items={customerItems}
                testId="account-menu-initials"
            />
            <MenuPane
                caption={'no photo and no name: person glyph, name falls back to "Account"'}
                identity={{}}
                items={customerItems}
                testId="account-menu-anon"
            />
        </div>
    ),
}

export const LongText: Story = {
    name: 'Long name, long email, long labels',
    render: () => (
        <Stage>
            <OpenMenu
                identity={{
                    name: 'Alexandra Konstantinopoulos-Whitfield',
                    secondary: 'alexandra.konstantinopoulos.whitfield@averyverylongdomainname.com.au',
                    badge: <Badge variant="act">Verified</Badge>,
                }}
                items={[
                    {
                        key: 'profile',
                        label: 'Profile, addresses and saved payment methods',
                        description: 'Everything about your account in one place',
                        icon: <UserIcon />,
                        href: '#',
                    },
                    { key: 'help', label: 'Help and support', icon: <HelpIcon />, href: '#' },
                ]}
                signOut={{ key: 'sign-out', label: 'Sign out of every device', icon: <LogoutIcon /> }}
                primaryAction={{
                    key: 'bookings',
                    label: 'My bookings and past appointments',
                    icon: <CalendarIcon />,
                    href: '#',
                }}
            />
        </Stage>
    ),
}

export const Tones: Story = {
    name: 'Row tones: default, demoted, danger',
    render: () => (
        <Stage>
            <OpenMenu
                identity={customer}
                items={[
                    { key: 'profile', label: 'Profile (default)', icon: <UserIcon />, href: '#' },
                    {
                        key: 'disabled',
                        label: 'Payouts (disabled)',
                        icon: <WalletIcon />,
                        disabled: true,
                        onSelect: () => {},
                    },
                    {
                        key: 'terms',
                        label: 'Terms of service (external)',
                        icon: <DocIcon />,
                        href: 'https://autara.au/terms',
                        external: true,
                    },
                    {
                        key: 'privacy',
                        label: 'Privacy policy (external)',
                        icon: <ShieldIcon />,
                        href: 'https://autara.au/privacy',
                        external: true,
                    },
                    {
                        key: 'delete',
                        label: 'Delete account (danger)',
                        icon: <LogoutIcon />,
                        tone: 'danger',
                        onSelect: () => {},
                    },
                ]}
                signOut={{ key: 'sign-out', label: 'Sign out (demoted)', icon: <LogoutIcon /> }}
            />
        </Stage>
    ),
}

/**
 * The enforcement, made visible. `FakeSolarIcon` prints whatever `weight` it
 * was handed. Every row is passed `weight="Bold"` by the story and every row
 * renders Linear, except the accent CTA which the component deliberately
 * promotes to Bold. That is the whole rule, on screen.
 */
function FakeSolarIcon({ weight = 'unset' }: { weight?: string }) {
    return (
        <span className="text-[0.5rem] font-medium">
            {weight}
        </span>
    )
}

export const IconWeightIsEnforced: Story = {
    name: 'Icon weight is enforced, not documented',
    render: () => (
        <Stage>
            <OpenMenu
                identity={customer}
                items={[
                    {
                        key: 'a',
                        label: 'Passed weight="Bold"',
                        icon: <FakeSolarIcon weight="Bold" />,
                        href: '#',
                    },
                    {
                        key: 'b',
                        label: 'Passed weight="LineDuotone"',
                        icon: <FakeSolarIcon weight="LineDuotone" />,
                        href: '#',
                    },
                ]}
                signOut={{
                    key: 'sign-out',
                    label: 'Sign out, passed Bold',
                    icon: <FakeSolarIcon weight="Bold" />,
                }}
                primaryAction={{
                    key: 'bookings',
                    label: 'Promoted row, passed Linear',
                    icon: <FakeSolarIcon weight="Linear" />,
                    href: '#',
                }}
            />
        </Stage>
    ),
}

/* ─── In context, one per surface shape ──────────────────────────────── */

export const InContextCustomerWeb: Story = {
    name: 'In context: customer-web header',
    render: () => (
        <div className="min-h-[32rem] bg-[var(--background)]">
            <header className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-3">
                <span className="text-base font-medium tracking-tight text-[var(--text-strong)]">
                    autara
                </span>
                <div className="flex items-center gap-3">
                    <a
                        href="#"
                        className="rounded-autara-md border border-[var(--border-subtle)] px-3 py-2 text-sm font-medium text-[var(--text-strong)]"
                    >
                        For professionals
                    </a>
                    <OpenMenu
                        identity={customer}
                        items={customerItems}
                        signOut={{ key: 'sign-out', label: 'Sign out', icon: <LogoutIcon /> }}
                        primaryAction={{
                            key: 'bookings',
                            label: 'My bookings',
                            icon: <CalendarIcon />,
                            href: '/account/bookings',
                        }}
                        testId="customer-account-menu"
                    />
                </div>
            </header>
        </div>
    ),
}

export const InContextMerchantWeb: Story = {
    name: 'In context: merchant-web onboarding header',
    render: () => (
        <div className="min-h-[32rem] bg-[var(--background)]">
            <header className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-3">
                <span className="flex items-baseline gap-2">
                    <span className="text-base font-medium tracking-tight text-[var(--text-strong)]">
                        autara
                    </span>
                    <span className="text-sm font-medium text-[var(--text-subtle)]">
                        for merchants
                    </span>
                </span>
                <OpenMenu
                    identity={merchant}
                    triggerVariant="avatar"
                    items={[
                        {
                            key: 'terms',
                            label: 'Terms of service',
                            icon: <DocIcon />,
                            href: 'https://autara.au/terms',
                            external: true,
                        },
                        {
                            key: 'privacy',
                            label: 'Privacy policy',
                            icon: <ShieldIcon />,
                            href: 'https://autara.au/privacy',
                            external: true,
                        },
                    ]}
                    signOut={{ key: 'sign-out', label: 'Log out', icon: <LogoutIcon /> }}
                    primaryAction={{
                        key: 'continue',
                        label: 'Continue onboarding',
                        icon: <CalendarIcon />,
                        href: '#',
                    }}
                    testId="merchant-account-menu"
                />
            </header>
        </div>
    ),
}

export const InContextMerchantMobile: Story = {
    name: 'In context: merchant-mobile portal top bar (sheet)',
    parameters: { viewport: { defaultViewport: 'phone' } },
    render: () => (
        <div className="min-h-[36rem] bg-[var(--background)]">
            <header className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-2">
                <span className="text-base font-medium text-[var(--text-strong)]">Today</span>
                <OpenMenu
                    presentation="sheet"
                    triggerVariant="avatar"
                    identity={merchant}
                    sections={[
                        {
                            key: 'business',
                            title: 'Business',
                            items: [
                                { key: 'services', label: 'Services', icon: <BoxIcon />, onSelect: () => {} },
                                { key: 'reviews', label: 'Reviews', icon: <StarIcon />, onSelect: () => {} },
                            ],
                        },
                        {
                            key: 'money',
                            title: 'Money',
                            items: [
                                { key: 'earnings', label: 'Earnings', icon: <WalletIcon />, onSelect: () => {} },
                            ],
                        },
                        {
                            key: 'account',
                            title: 'Account',
                            items: [
                                {
                                    key: 'notifications',
                                    label: 'Notifications',
                                    icon: <BellIcon />,
                                    trailing: '3',
                                    onSelect: () => {},
                                },
                                { key: 'settings', label: 'Settings', icon: <SettingsIcon />, onSelect: () => {} },
                            ],
                        },
                    ]}
                    signOut={{ key: 'sign-out', label: 'Sign out', icon: <LogoutIcon />, onSelect: () => {} }}
                    testId="portal-account-menu"
                />
            </header>
            <p className="p-4 text-sm text-[var(--text-muted)]">
                Tap the avatar. The sheet is edge-anchored; a consumer whose dock sits
                above the bottom edge adds its own clearance through
                <code className="px-1">contentClassName</code>.
            </p>
        </div>
    ),
}

export const InContextAdmin: Story = {
    name: 'In context: admin sidebar footer',
    render: () => (
        <div className="flex min-h-[32rem] gap-0 bg-[var(--background)]">
            <aside className="flex w-64 flex-col justify-between border-r border-[var(--border-subtle)] bg-[var(--surface)] p-3">
                <nav className="space-y-1">
                    {['Dashboard', 'Merchants', 'Bookings', 'Reviews'].map((n) => (
                        <div
                            key={n}
                            className="rounded-autara-sm px-3 py-2 text-sm font-medium text-[var(--text-muted)]"
                        >
                            {n}
                        </div>
                    ))}
                </nav>
                <OpenMenu
                    identity={{ name: 'Ops Admin', secondary: 'ops@autara.au' }}
                    triggerVariant="block"
                    side="right"
                    align="end"
                    items={[{ key: 'account', label: 'Account', icon: <UserIcon />, href: '#' }]}
                    signOut={{ key: 'sign-out', label: 'Log out', icon: <LogoutIcon /> }}
                    testId="admin-account-menu"
                />
            </aside>
            <div className="flex-1 p-6 text-sm text-[var(--text-muted)]">
                Admin has no autara-ui dependency today. Adopting this is what adds one.
            </div>
        </div>
    ),
}

/**
 * Both themes side by side. The nested `data-theme` island works since
 * AUTM-948 added the element-level selector; before that this story would have
 * rendered two identical light panes and looked correct.
 */
export const BothThemes: Story = {
    name: 'Both themes',
    parameters: { layout: 'fullscreen' },
    render: () => (
        <div className="grid sm:grid-cols-2">
            {(['light', 'dark'] as const).map((theme) => (
                <ThemePane key={theme} theme={theme} />
            ))}
        </div>
    ),
}

/**
 * One themed pane. The panel is portaled INTO the pane rather than to body,
 * because `data-theme` here is scoped to this element: a body portal would
 * inherit the page theme and both panes would render identically while looking
 * correct, which is the AUTM-948 failure one level up.
 */
function ThemePane({ theme }: { theme: 'light' | 'dark' }) {
    const [host, setHost] = React.useState<HTMLDivElement | null>(null)
    return (
        <div
            ref={setHost}
            data-theme={theme}
            className="relative min-h-[32rem] bg-[var(--background)] p-6"
        >
            <p className="mb-4 text-xs text-[var(--text-muted)]">
                {theme === 'dark' ? 'Dark' : 'Light'}
            </p>
            <OpenMenu
                align="start"
                identity={customer}
                items={customerItems}
                portalContainer={host}
                signOut={{ key: 'sign-out', label: 'Sign out', icon: <LogoutIcon /> }}
                primaryAction={{
                    key: 'bookings',
                    label: 'My bookings',
                    icon: <CalendarIcon />,
                    href: '#',
                }}
                testId={`account-menu-${theme}`}
            />
        </div>
    )
}

/* ─── AUTM-1792: the dropdown lifts off the page ─────────────────────────
 *
 * Don, 2026-10-09, on the merchant portal's top bar: "there's no shadow or
 * something here when open the menu, fix it". The panel was paper on a paper
 * page with a 0.10 hairline, so it read as part of the page. As a dropdown it
 * now takes `.floating-surface`; as a sheet (story above) it stays flat,
 * because a sheet has a scrim and an edge of the screen behind it. Drawn over
 * a mock of the portal top bar and a band card so the lift is judged against
 * the ground it really opens on. Check both themes.
 */
function PortalPage({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-[30rem] bg-[var(--paper)] text-[var(--text-strong)]">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-6 py-3">
                <span className="font-bold">Today</span>
                {children}
            </div>
            <div className="grid grid-cols-2 gap-4 p-6">
                <div className="rounded-autara-lg bg-[var(--band)] p-5">
                    <p className="text-[0.8125rem] font-medium text-[var(--text-muted)]">This month</p>
                    <p className="mt-1 text-3xl font-black">$407</p>
                </div>
                <div className="rounded-autara-lg bg-[var(--band)] p-5">
                    <p className="text-[0.8125rem] font-medium text-[var(--text-muted)]">Still to collect</p>
                    <p className="mt-1 text-3xl font-black">$0</p>
                </div>
            </div>
        </div>
    )
}

const liftedMenu = (
    <PortalPage>
        <OpenMenu
            triggerVariant="avatar"
            align="end"
            identity={merchant}
            items={[
                { key: 'account', label: 'Your account', description: 'Name, photo, email and phone', icon: <UserIcon /> },
                { key: 'settings', label: 'Settings', icon: <SettingsIcon /> },
                { key: 'help', label: 'Help and support', icon: <HelpIcon /> },
            ]}
            signOut={{ key: 'sign-out', label: 'Sign out', icon: <LogoutIcon /> }}
        />
    </PortalPage>
)

export const LiftedOverThePortal: Story = {
    name: 'Lifted over the portal (AUTM-1792)',
    tags: ['!autodocs'],
    render: () => liftedMenu,
}

export const LiftedOverThePortalDark: Story = {
    name: 'Lifted over the portal, dark (AUTM-1792)',
    tags: ['!autodocs'],
    globals: { theme: 'dark' },
    render: () => liftedMenu,
}
