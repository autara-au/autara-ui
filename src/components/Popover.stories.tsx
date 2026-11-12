import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverDescription,
    PopoverBody,
    PopoverFooter,
    PopoverSeparator,
    PopoverClose,
} from './Popover'
import { GradientGround } from './GlassSurface'
import { Button } from './Button'
import { Badge } from './Badge'
import { AsyncSkeleton } from './AsyncSkeleton'
import { EmptyState } from './EmptyState'
import { ErrorCard } from './ErrorCard'

/**
 * # Popover
 *
 * An anchored floating panel for **content** — AUTM-965, built so the
 * merchant portal header can hold a notifications panel.
 *
 * ## Why not DropdownMenu
 *
 * Radix's DropdownMenu gives every child `role="menuitem"` inside a
 * `role="menu"`. A screen reader then announces a notification list as
 * "menu, 5 items, menu item — Booking confirmed", and menu semantics change
 * the keyboard model: arrow keys move a roving focus and Tab leaves
 * entirely. That is correct for "more actions" and wrong for a panel the
 * user reads. Popover renders `role="dialog"` with ordinary Tab order.
 *
 * **Reach for `DropdownMenu` when every child is a command. Reach for this
 * when the children are content.**
 *
 * ## Glass is meaningless on a flat canvas
 *
 * Every story renders on `.gradient-ground`, which is why they look
 * different from the rest of the library. Reviewing a glass surface on a
 * white Storybook canvas is how `Card variant="glass"` shipped at 1.001:1
 * for months. **Flip the Theme toolbar** — dark is the primary expression.
 *
 * ## The trap
 *
 * `backdrop-filter` creates a containing block for `position: fixed`
 * descendants, and Radix positions the panel with `position: fixed`. A
 * panel rendered inside a glass header resolves against the header instead
 * of the viewport and collapses (AUTM-721, merchant-web). `PopoverContent`
 * portals to `document.body` unconditionally. `InsideAGlassHeader` below is
 * the real arrangement; `Popover.test.tsx` asserts the parent chain.
 */
const meta = {
    title: 'Design System/Popover',
    component: PopoverContent,
    parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PopoverContent>

export default meta
type Story = StoryObj<typeof meta>

/* ─── Story furniture ──────────────────────────────────────────────────── */

/** Glass is meaningless on a flat canvas — every story sits on a real ground. */
function Ground({
    children,
    className = '',
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <GradientGround className={`min-h-[34rem] p-10 ${className}`}>
            {children}
        </GradientGround>
    )
}

/** Solar Bold style — 24x24 viewBox, 2.4 stroke, round caps. */
function BellIcon({ size = 22 }: { size?: number }) {
    return (
        <svg
            aria-hidden
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 9a6 6 0 0 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
            <path d="M13.7 20a2 2 0 0 1-3.4 0" />
        </svg>
    )
}

type Notification = {
    id: string
    title: string
    body: string
    when: string
    unread: boolean
}

const NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        title: 'New booking request',
        body: 'Priya Raman asked for a full interior detail on Saturday at 10:00.',
        when: '4 min ago',
        unread: true,
    },
    {
        id: '2',
        title: 'Deposit received',
        body: '$45.00 from Tom Whitfield for Exterior wash and wax.',
        when: '1 hr ago',
        unread: true,
    },
    {
        id: '3',
        title: 'Reschedule requested',
        body: 'Anna Delacroix wants to move Thursday 14:00 to Friday 09:30.',
        when: 'Yesterday',
        unread: false,
    },
    {
        id: '4',
        title: 'Payout on the way',
        body: '$312.40 is heading to your account ending 4471.',
        when: '2 days ago',
        unread: false,
    },
]

/**
 * One notification row. Lives in the STORY, not the package — a row that
 * knows about unread state and merchant copy is a consumer concern per the
 * component-architecture table. It is here to show what the primitive is
 * for, and to give the scroll container focusable children.
 */
function NotificationRow({ item }: { item: Notification }) {
    return (
        <button
            type="button"
            data-testid={`portal-notification-item-${item.id}`}
            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--glass-edge)] focus-visible:bg-[var(--glass-edge)] focus-visible:outline-none"
        >
            <span
                aria-hidden
                className={
                    item.unread
                        ? 'mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--act-fill)]'
                        : 'mt-1.5 h-2 w-2 shrink-0 rounded-full bg-transparent'
                }
            />
            <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium text-[var(--text-strong)]">
                        {item.title}
                    </span>
                    <span className="shrink-0 text-[0.6875rem] text-[var(--text-subtle)]">
                        {item.when}
                    </span>
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-[var(--text-muted)]">
                    {item.body}
                </span>
                {item.unread ? (
                    <span className="sr-only">Unread</span>
                ) : null}
            </span>
        </button>
    )
}

/* ─── Stories ──────────────────────────────────────────────────────────── */

/**
 * The primitive with nothing on top of it. Click the trigger, press Escape,
 * Tab through — focus goes into the panel on open and back to the trigger
 * on close, and Radix puts `aria-expanded` on the trigger for you.
 */
export const Default: Story = {
    render: () => (
        <Ground>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline">Availability</Button>
                </PopoverTrigger>
                <PopoverContent className="w-[20rem]">
                    <PopoverHeader>
                        <div>
                            <PopoverTitle>Taking bookings</PopoverTitle>
                            <PopoverDescription>
                                Customers can request a time until you turn
                                this off.
                            </PopoverDescription>
                        </div>
                    </PopoverHeader>
                    <PopoverBody className="px-4 py-3">
                        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                            Your next free slot is Saturday at 10:00. Three
                            requests are waiting on you.
                        </p>
                    </PopoverBody>
                    <PopoverFooter>
                        <PopoverClose asChild>
                            <Button variant="ghost" size="sm">
                                Close
                            </Button>
                        </PopoverClose>
                        <Button size="sm">Open hours</Button>
                    </PopoverFooter>
                </PopoverContent>
            </Popover>
        </Ground>
    ),
}

/**
 * **The story this component was built for.** A glass portal header with a
 * bell, its unread count, and the recent-notifications panel hanging off it.
 *
 * Two things it proves rather than asserts:
 *
 * 1. **The panel escapes the glass header.** The header carries a real
 *    `backdrop-filter`, so an in-place panel would resolve against it and
 *    collapse to a strip (AUTM-721). Inspect the panel in devtools — its
 *    parent is `<body>`, not the header.
 * 2. **The 44x44 target is the caller's job.** `size="icon"` is 40x40 in
 *    this package (AUTM-622 tracks that); the trigger below sizes itself to
 *    `h-11 w-11`, which is the pattern merchant-mobile's `TopBar` already
 *    uses.
 *
 * The unread badge does not animate. It is a state indicator, and motion on
 * it reads as a notification arriving when nothing happened.
 *
 * The rows, the counts and the copy belong to the consumer — this story
 * composes them by hand precisely because a `NotificationPopover` does NOT
 * belong in `autara-ui`.
 */
export const InsideAGlassHeader: Story = {
    name: 'In context — merchant portal header',
    render: () => {
        const unread = NOTIFICATIONS.filter((n) => n.unread).length
        return (
            <GradientGround className="min-h-[34rem]">
                {/* The consumer's header. Glass, sticky, and the reason the
                    portal matters. */}
                <header className="glass-surface flex items-center gap-3 rounded-none border-x-0 border-t-0 px-5 py-3">
                    <span className="text-sm font-medium text-[var(--text-strong)]">
                        Northside Mobile Car Care
                    </span>
                    <Badge variant="money" className="ml-1">
                        Taking bookings
                    </Badge>
                    <div className="flex-1" />

                    <Popover>
                        <div className="relative shrink-0">
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    data-testid="portal-notifications-open"
                                    aria-label={
                                        unread
                                            ? `Notifications (${unread} unread)`
                                            : 'Notifications'
                                    }
                                    // 44x44 — size="icon" is 40x40 here
                                    // (AUTM-622). Same fix TopBar.tsx makes.
                                    className="h-11 w-11 text-[var(--text-strong)]"
                                >
                                    <BellIcon />
                                </Button>
                            </PopoverTrigger>
                            {unread > 0 ? (
                                // aria-hidden: the count is already in the
                                // trigger's accessible name, and no
                                // animation — a state indicator that moves
                                // reads as an arrival.
                                <span
                                    aria-hidden
                                    className="pointer-events-none absolute right-1 top-1 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-[var(--color-autara-error)] px-1 text-[0.625rem] font-medium leading-none text-[var(--text-on-inverse)]"
                                >
                                    {unread > 99 ? '99+' : unread}
                                </span>
                            ) : null}
                        </div>

                        <PopoverContent
                            align="end"
                            className="w-[22rem]"
                            data-testid="portal-notifications-panel"
                        >
                            <PopoverHeader>
                                <PopoverTitle>Notifications</PopoverTitle>
                                <span className="text-[0.6875rem] text-[var(--text-subtle)]">
                                    {unread} unread
                                </span>
                            </PopoverHeader>
                            <PopoverBody className="max-h-[18rem]">
                                {NOTIFICATIONS.map((item, i) => (
                                    <React.Fragment key={item.id}>
                                        {i > 0 ? <PopoverSeparator /> : null}
                                        <NotificationRow item={item} />
                                    </React.Fragment>
                                ))}
                            </PopoverBody>
                            <PopoverFooter>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full"
                                >
                                    See all notifications
                                </Button>
                            </PopoverFooter>
                        </PopoverContent>
                    </Popover>
                </header>

                {/* A landmark, not a bare div — axe's `region` rule flags
                    page content that sits outside one, and the consumer's
                    real portal shell has a <main> here anyway. */}
                <main className="p-10">
                    <p className="max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
                        Page content sits under the header. Open the panel and
                        confirm it hangs below the bell rather than clipping
                        inside the header band — that is the whole point of
                        the portal.
                    </p>
                </main>
            </GradientGround>
        )
    },
}

/**
 * `tone="strong"` raises the fill for a panel carrying **dense body text**
 * rather than scannable rows. Less of the ground comes through, so the ink
 * has more to sit on.
 *
 * `blur={false}` drops the `backdrop-filter` and its per-frame GPU cost.
 * The fill, edge and highlight stay, so it reads as the same material —
 * worth it when the panel holds a long or virtualised list. A booking list
 * on the iPad Pro 11" is where blur drops frames first.
 */
export const Tones: Story = {
    name: 'tone and blur',
    render: () => (
        <Ground>
            {/* A grid across the FULL width, not a flex row: the panels are
                anchored to their triggers and 240px wide, so triggers that
                sit a `gap-6` apart put three overlapping panels on top of
                each other and the comparison this story exists for becomes
                unreadable. Found in review — see the note on AsyncStates. */}
            <div className="grid w-full grid-cols-3 place-items-center gap-4">
            {(
                [
                    ['default', true, 'tone="default"'],
                    ['strong', true, 'tone="strong"'],
                    ['default', false, 'blur={false}'],
                ] as const
            ).map(([tone, blur, label]) => (
                <Popover key={label} defaultOpen>
                    <PopoverTrigger asChild>
                        <Button variant="outline">{label}</Button>
                    </PopoverTrigger>
                    <PopoverContent
                        tone={tone}
                        blur={blur}
                        className="w-[15rem]"
                        // Storybook renders three of these at once; keeping
                        // them open together is the only way to compare the
                        // material side by side.
                        onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                        <PopoverHeader>
                            <PopoverTitle>{label}</PopoverTitle>
                        </PopoverHeader>
                        <PopoverBody className="px-4 py-3">
                            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                                Body copy at `--text-muted`.
                            </p>
                            <p className="mt-2 text-[0.75rem] text-[var(--text-subtle)]">
                                Smallest ink on the surface
                            </p>
                        </PopoverBody>
                    </PopoverContent>
                </Popover>
            ))}
            </div>
        </Ground>
    ),
}

/**
 * **Edge case — more content than fits.** Forty rows. The panel does not
 * grow: `PopoverContent` caps at
 * `--radix-popover-content-available-height`, the header and footer stay
 * put, and only `PopoverBody` scrolls.
 *
 * `overscroll-contain` stops the page scrolling once the list hits its end.
 * The rows are buttons, so the scroll region is keyboard-reachable through
 * its children and needs no `tabIndex` of its own.
 */
export const ScrollingContent: Story = {
    name: 'Edge — long, scrolling content',
    render: () => (
        <Ground>
            <Popover defaultOpen>
                <PopoverTrigger asChild>
                    <Button variant="outline">40 notifications</Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[22rem]"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <PopoverHeader>
                        <PopoverTitle>Notifications</PopoverTitle>
                        <span className="text-[0.6875rem] text-[var(--text-subtle)]">
                            40 total
                        </span>
                    </PopoverHeader>
                    <PopoverBody className="max-h-[18rem]">
                        {Array.from({ length: 40 }, (_, i) => (
                            <React.Fragment key={i}>
                                {i > 0 ? <PopoverSeparator /> : null}
                                <NotificationRow
                                    item={{
                                        ...NOTIFICATIONS[i % 4],
                                        id: String(i),
                                        unread: i < 3,
                                    }}
                                />
                            </React.Fragment>
                        ))}
                    </PopoverBody>
                    <PopoverFooter>
                        <Button variant="ghost" size="sm" className="w-full">
                            See all notifications
                        </Button>
                    </PopoverFooter>
                </PopoverContent>
            </Popover>
        </Ground>
    ),
}

/**
 * **Edge case — non-focusable prose in the scroll area.** A scroll
 * container whose children are all text cannot be reached by keyboard, so
 * it takes `tabIndex={0}` and an `aria-label` of its own. Rows that are
 * links or buttons need neither, which is why the prop is not automatic.
 */
export const ScrollingProse: Story = {
    name: 'Edge — scrolling prose (keyboard-reachable)',
    render: () => (
        <Ground>
            <Popover defaultOpen>
                <PopoverTrigger asChild>
                    <Button variant="outline">Cancellation policy</Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[22rem]"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <PopoverHeader>
                        <PopoverTitle>Cancellation policy</PopoverTitle>
                    </PopoverHeader>
                    <PopoverBody
                        tabIndex={0}
                        aria-label="Cancellation policy, scrollable"
                        className="max-h-[14rem] space-y-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--act)]"
                    >
                        {Array.from({ length: 6 }, (_, i) => (
                            <p
                                key={i}
                                className="text-sm leading-relaxed text-[var(--text-muted)]"
                            >
                                Customers can cancel free of charge up to 24
                                hours before the booking starts. Inside 24
                                hours the deposit is retained and the slot is
                                released back to your calendar.
                            </p>
                        ))}
                    </PopoverBody>
                </PopoverContent>
            </Popover>
        </Ground>
    ),
}

/**
 * **Edge case — nothing to show.** The three async states a real consumer
 * panel has to render, all inside the same primitive, using components this
 * package already ships. The panel is the frame; the states are the
 * consumer's.
 *
 * "Nothing here yet" is not a designed empty state on its own — the copy
 * has to say what will fill it.
 */
export const AsyncStates: Story = {
    name: 'Edge — loading, empty and error',
    render: () => (
        <Ground>
            {/* Same collision as Tones: three anchored panels on triggers a
                `gap-6` apart overlap, and the overlap is not merely ugly —
                it put the empty state's heading on top of the error card's
                red medallion, which a contrast pass then read as a 4.36:1
                failure that did not exist. */}
            <div className="grid w-full grid-cols-3 place-items-start justify-items-center gap-4">
            <Popover defaultOpen>
                <PopoverTrigger asChild>
                    <Button variant="outline">Loading</Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[15rem]"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <PopoverHeader>
                        <PopoverTitle>Notifications</PopoverTitle>
                    </PopoverHeader>
                    <PopoverBody
                        className="space-y-2 px-4 py-3"
                        aria-busy="true"
                    >
                        <AsyncSkeleton variant="list" count={3} rowHeight="h-12" />
                        <span className="sr-only" role="status">
                            Fetching your notifications
                        </span>
                    </PopoverBody>
                </PopoverContent>
            </Popover>

            <Popover defaultOpen>
                <PopoverTrigger asChild>
                    <Button variant="outline">Empty</Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[15rem]"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <PopoverHeader>
                        <PopoverTitle>Notifications</PopoverTitle>
                    </PopoverHeader>
                    <PopoverBody className="p-3">
                        <EmptyState
                            title="You are all caught up"
                            description="Booking requests, payments and reschedules land here as they happen."
                        />
                    </PopoverBody>
                </PopoverContent>
            </Popover>

            <Popover defaultOpen>
                <PopoverTrigger asChild>
                    <Button variant="outline">Error</Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[15rem]"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <PopoverHeader>
                        <PopoverTitle>Notifications</PopoverTitle>
                    </PopoverHeader>
                    <PopoverBody className="p-3">
                        <ErrorCard
                            message="We couldn't load your notifications. Check your connection and try again."
                            onRetry={() => {}}
                        />
                    </PopoverBody>
                </PopoverContent>
            </Popover>
            </div>
        </Ground>
    ),
}

/**
 * **Edge case — the panel gets big and the viewport does not.** At 200% text
 * scale every rem doubles, so a fixed-height panel would run off screen and
 * take its scroll container with it.
 *
 * `PopoverContent` caps at `--radix-popover-content-available-height` and at
 * `min(24rem, 100vw - 1.5rem)`, both of which move with the scale, so the
 * panel stays inside the frame and the body scrolls instead.
 *
 * **This story scales the ROOT font size, not a wrapper's.** The first
 * version set `style={{ fontSize: '200%' }}` on the ground, which scales
 * nothing that is sized in `rem` — `rem` resolves against `<html>`, so every
 * token-sized element rendered at its normal size and the story passed while
 * testing nothing. That is how OS text scaling actually works too: it moves
 * the root size. A wrapper only scales `em` and inherited sizes.
 */
export const TextScale200: Story = {
    name: 'Edge — 200% text scale',
    render: function TextScale200Story() {
        React.useEffect(() => {
            const prev = document.documentElement.style.fontSize
            document.documentElement.style.fontSize = '200%'
            return () => {
                document.documentElement.style.fontSize = prev
            }
        }, [])
        return (
        <GradientGround className="min-h-[34rem] p-10">
            <Popover defaultOpen>
                <PopoverTrigger asChild>
                    <Button variant="outline">Notifications</Button>
                </PopoverTrigger>
                <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()}>
                    <PopoverHeader>
                        <PopoverTitle>Notifications</PopoverTitle>
                    </PopoverHeader>
                    <PopoverBody className="max-h-[16rem]">
                        {NOTIFICATIONS.map((item, i) => (
                            <React.Fragment key={item.id}>
                                {i > 0 ? <PopoverSeparator /> : null}
                                <NotificationRow item={item} />
                            </React.Fragment>
                        ))}
                    </PopoverBody>
                    <PopoverFooter>
                        <Button variant="ghost" size="sm" className="w-full">
                            See all
                        </Button>
                    </PopoverFooter>
                </PopoverContent>
            </Popover>
        </GradientGround>
        )
    },
}

/**
 * Placement. `side` and `align` are Radix's, passed straight through, and
 * collision handling is on — a panel near the viewport edge flips and
 * shifts rather than clipping. `collisionPadding` defaults to 12 here so it
 * never kisses the edge.
 *
 * For a right-aligned header control, `align="end"` is the one you want.
 */
export const Placement: Story = {
    render: () => (
        <Ground className="grid place-items-center">
            <div className="grid grid-cols-2 gap-4">
                {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                    <Popover key={side}>
                        <PopoverTrigger asChild>
                            <Button variant="outline">side=&quot;{side}&quot;</Button>
                        </PopoverTrigger>
                        <PopoverContent side={side} className="w-[14rem]">
                            <PopoverHeader>
                                <PopoverTitle>Anchored {side}</PopoverTitle>
                            </PopoverHeader>
                            <PopoverBody className="px-4 py-3">
                                <p className="text-sm text-[var(--text-muted)]">
                                    Flips when it runs out of room.
                                </p>
                            </PopoverBody>
                        </PopoverContent>
                    </Popover>
                ))}
            </div>
        </Ground>
    ),
}

/**
 * Both themes at once — and the one case where the default portal is wrong.
 *
 * `PopoverContent` portals to `document.body`, which does **not** sit inside
 * the nested `data-theme="dark"` island on the right. Left to itself this
 * story would render two identical LIGHT panels and quietly say nothing —
 * the same failure mode AUTM-948 found across the library. So each panel
 * portals into its own themed ground via `container`.
 *
 * This is a Storybook problem, not a product one: apps stamp `data-theme` on
 * `<html>`, so a body-portaled panel inherits it correctly. `.gradient-ground`
 * is `position: relative` with no filter or transform, so it is a safe portal
 * target — see the `container` prop's note on what is not.
 */
export const BothThemes: Story = {
    name: 'Light and dark',
    render: function BothThemesStory() {
        const lightRef = React.useRef<HTMLDivElement>(null)
        const darkRef = React.useRef<HTMLDivElement>(null)
        // Refs are null on the first render, so the panels cannot open until
        // the grounds exist to portal into.
        const [ready, setReady] = React.useState(false)
        React.useEffect(() => setReady(true), [])

        const panel = (container: HTMLElement | null) => (
            <Popover defaultOpen>
                <PopoverTrigger asChild>
                    <Button variant="outline">Notifications</Button>
                </PopoverTrigger>
                {ready && container ? (
                    <PopoverContent
                        container={container}
                        className="w-[19rem]"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                        <PopoverHeader>
                            <PopoverTitle>Notifications</PopoverTitle>
                            <span className="text-[0.6875rem] text-[var(--text-subtle)]">
                                2 unread
                            </span>
                        </PopoverHeader>
                        <PopoverBody className="max-h-[13rem]">
                            {NOTIFICATIONS.slice(0, 3).map((item, i) => (
                                <React.Fragment key={item.id}>
                                    {i > 0 ? <PopoverSeparator /> : null}
                                    <NotificationRow item={item} />
                                </React.Fragment>
                            ))}
                        </PopoverBody>
                        <PopoverFooter>
                            <Button variant="ghost" size="sm" className="w-full">
                                See all notifications
                            </Button>
                        </PopoverFooter>
                    </PopoverContent>
                ) : null}
            </Popover>
        )

        return (
            <div className="grid min-h-[34rem] grid-cols-2">
                <GradientGround ref={lightRef} className="p-10">
                    {panel(lightRef.current)}
                </GradientGround>
                <GradientGround
                    ref={darkRef}
                    data-theme="dark"
                    className="p-10"
                >
                    {panel(darkRef.current)}
                </GradientGround>
            </div>
        )
    },
}

/**
 * AUTM-1792: lifted over a plain paper page, which is where the merchant
 * portal opens it (its calendar settings, the notification bell). Glass over
 * a gradient reads as a panel by its frost; glass over paper has nothing to
 * frost, so the lift (`.floating-surface`: a firmer hairline and a
 * purple-tinted shadow) is what separates it. Light and dark side by side.
 */
export const LiftedOverPaper: Story = {
    name: 'Lifted over a paper page (AUTM-1792)',
    tags: ['!autodocs'],
    render: function LiftedOverPaperStory() {
        const lightRef = React.useRef<HTMLDivElement>(null)
        const darkRef = React.useRef<HTMLDivElement>(null)
        const [ready, setReady] = React.useState(false)
        React.useEffect(() => setReady(true), [])
        const panel = (container: HTMLElement | null) => (
            <Popover defaultOpen>
                <PopoverTrigger asChild>
                    <Button variant="outline">Calendar settings</Button>
                </PopoverTrigger>
                {ready && container ? (
                    <PopoverContent
                        container={container}
                        tone="strong"
                        className="w-80 p-4"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                        <PopoverTitle>Calendar settings</PopoverTitle>
                        <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--text-muted)]">
                            Tapping an open time asks whether to book it or block it.
                        </p>
                    </PopoverContent>
                ) : null}
            </Popover>
        )
        return (
            <div className="grid min-h-[22rem] grid-cols-2">
                <div ref={lightRef} className="bg-[var(--paper)] p-10">
                    {panel(lightRef.current)}
                </div>
                <div ref={darkRef} data-theme="dark" className="bg-[var(--paper)] p-10">
                    {panel(darkRef.current)}
                </div>
            </div>
        )
    },
}
