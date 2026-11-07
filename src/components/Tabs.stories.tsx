import { useEffect, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs'

/**
 * Tabs — the segmented control. In merchant-mobile this is the
 * Day / Today / Week / Month / List switcher on the bookings screen, so it is
 * the control that answers "which slice of my book am I looking at?".
 *
 * - **Track** is `--surface-elevated` with no border. A container whose fill
 *   is a whisper off the card and whose edge is a hairline is an outlined
 *   section box, which rule 4 of the Autara Glass direction bans.
 * - **Inactive trigger** is muted ink and nothing else; it lifts to strong
 *   ink on hover.
 * - **Active trigger** is a SOLID `--act-fill` with `--on-act` ink (AUTM-974).
 *   It used to be `--surface` with a hairline ring on an elevated track — a
 *   1.05:1 fill with the ring doing all the work, which is exactly the
 *   screenshot Don sent on 2026-09-01: "no outline buttons or sections, boxes
 *   as we discussed. everything should be solid."
 *
 * Both themes come off the token stack. Check every story with the Storybook
 * theme switcher; `BothThemes` below forces the comparison side by side, and
 * `FocusOnTheActiveTab` is the one that a solid accent fill can quietly break.
 */
const meta: Meta<typeof Tabs> = {
    title: 'Molecules/Tabs',
    component: Tabs,
    parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof Tabs>

const Pane: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-5 text-sm leading-relaxed text-[var(--text-strong)]">
        {children}
    </div>
)

// ─── Default — 3 tabs with content panes ───────────────────────────
export const Default: Story = {
    render: () => (
        <div className="max-w-xl">
            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="services">Services</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                    <Pane>
                        Premium hand-detail studio operating out of Surry
                        Hills. Booked solid through next weekend; openings
                        Tuesday onwards.
                    </Pane>
                </TabsContent>
                <TabsContent value="services">
                    <Pane>
                        Full interior + exterior package, ceramic top-up,
                        headlight restoration. Add-ons available at checkout.
                    </Pane>
                </TabsContent>
                <TabsContent value="reviews">
                    <Pane>
                        4.8 average across 312 customer reviews. Most recent:
                        “Sam was incredibly thorough — booked the same studio
                        for next month.”
                    </Pane>
                </TabsContent>
            </Tabs>
        </div>
    ),
}

// ─── Two-tab variant — common in dashboards ────────────────────────
export const TwoTabs: Story = {
    render: () => (
        <div className="max-w-md">
            <Tabs defaultValue="upcoming">
                <TabsList>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="past">Past</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming">
                    <Pane>
                        3 bookings this week — next at 09:30 tomorrow with
                        Maya R.
                    </Pane>
                </TabsContent>
                <TabsContent value="past">
                    <Pane>
                        12 bookings completed in the past 30 days, 4.9 average
                        rating.
                    </Pane>
                </TabsContent>
            </Tabs>
        </div>
    ),
}

// ─── Disabled tab ──────────────────────────────────────────────────
export const WithDisabledTab: Story = {
    render: () => (
        <div className="max-w-xl">
            <Tabs defaultValue="now">
                <TabsList>
                    <TabsTrigger value="now">Available now</TabsTrigger>
                    <TabsTrigger value="later">Later today</TabsTrigger>
                    <TabsTrigger value="tomorrow" disabled>
                        Tomorrow
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="now">
                    <Pane>4 merchants accepting bookings within the hour.</Pane>
                </TabsContent>
                <TabsContent value="later">
                    <Pane>12 merchants have openings after 14:00.</Pane>
                </TabsContent>
                <TabsContent value="tomorrow">
                    <Pane>Disabled while you’re browsing today’s window.</Pane>
                </TabsContent>
            </Tabs>
        </div>
    ),
}

// ─── In context — Tabs inside a Card-like surface ──────────────────
export const InCardSurface: Story = {
    name: 'In context — inside a Card surface',
    render: () => (
        <div className="max-w-xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
            <div className="mb-1 text-[0.8125rem] font-medium text-[var(--text-muted)]">
                Merchant detail
            </div>
            <h3 className="mb-4 text-lg font-medium text-[var(--text-strong)]">
                Autobahn Auto Spa
            </h3>
            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="services">Services</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                    <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                        Mobile detail studio servicing inner-city Sydney
                        Monday through Saturday.
                    </p>
                </TabsContent>
                <TabsContent value="services">
                    <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                        Exterior, interior, full package, ceramic top-up.
                    </p>
                </TabsContent>
                <TabsContent value="reviews">
                    <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                        4.8 across 312 reviews.
                    </p>
                </TabsContent>
            </Tabs>
        </div>
    ),
}

// ─── The focus ring on a solid accent fill ─────────────────────────
/**
 * The trap a solid fill sets, and the reason this story exists.
 *
 * The merchant-mobile Today pass painted a row in a solid accent and left the
 * house `ring-[var(--accent)]/35` focus ring on it. Purple on purple measures
 * 1.0:1, so a keyboard user lost their place on the row they were most likely
 * to be on. Tabs keeps the purple signature but at full strength, and paints
 * the offset band in `--surface-elevated` — the colour actually behind the
 * tab — so the band, not luck, is what separates ring from fill.
 *
 * Tab into the control and arrow across it. The indicator has to stay obvious
 * on the ACTIVE tab, not just the inactive ones.
 */
export const FocusOnTheActiveTab: Story = {
    name: 'A11y — focus ring on the solid active tab',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="max-w-xl space-y-3">
            <p className="text-[0.75rem] font-medium text-[var(--text-muted)]">
                Tab in, then arrow across
            </p>
            <Tabs defaultValue="today">
                <TabsList>
                    <TabsTrigger value="day">Day</TabsTrigger>
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="month">Month</TabsTrigger>
                    <TabsTrigger value="list">List</TabsTrigger>
                </TabsList>
                <TabsContent value="day">
                    <Pane>One day at a time.</Pane>
                </TabsContent>
                <TabsContent value="today">
                    <Pane>4 bookings today, next at 09:30 with Maya R.</Pane>
                </TabsContent>
                <TabsContent value="week">
                    <Pane>17 bookings this week.</Pane>
                </TabsContent>
                <TabsContent value="month">
                    <Pane>62 bookings this month.</Pane>
                </TabsContent>
                <TabsContent value="list">
                    <Pane>Everything, newest first.</Pane>
                </TabsContent>
            </Tabs>
        </div>
    ),
}

// ─── Both themes, side by side ─────────────────────────────────────
export const BothThemes: Story = {
    name: 'In context — light and dark canvas',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="grid gap-6 lg:grid-cols-2">
            {[
                { label: 'Light', theme: undefined },
                { label: 'Dark', theme: 'dark' as const },
            ].map((col) => (
                <div
                    key={col.label}
                    data-theme={col.theme}
                    className="space-y-4 rounded-autara-lg bg-[var(--background)] p-5"
                >
                    <p className="text-[0.75rem] font-medium text-[var(--text-muted)]">
                        {col.label}
                    </p>
                    <Tabs defaultValue="today">
                        <TabsList>
                            <TabsTrigger value="day">Day</TabsTrigger>
                            <TabsTrigger value="today">Today</TabsTrigger>
                            <TabsTrigger value="week">Week</TabsTrigger>
                        </TabsList>
                        <TabsContent value="day">
                            <p className="text-sm text-[var(--text-muted)]">
                                One day at a time.
                            </p>
                        </TabsContent>
                        <TabsContent value="today">
                            <p className="text-sm text-[var(--text-muted)]">
                                4 bookings today, next at 09:30 with Maya R.
                            </p>
                        </TabsContent>
                        <TabsContent value="week">
                            <p className="text-sm text-[var(--text-muted)]">
                                17 bookings this week.
                            </p>
                        </TabsContent>
                    </Tabs>
                </div>
            ))}
        </div>
    ),
}

// ─── Edge — the five-tab bookings switcher at 200% text scale ──────
/**
 * `min-h-10` rather than `h-10` on the track: at 200% OS text scale a fixed
 * height clips its own labels instead of growing with them (the AUTM-915
 * argument, applied to the container rather than to a button).
 *
 * Scales the ROOT font size, not a wrapper — `rem` resolves against `<html>`
 * and ignores an ancestor entirely, so a story that sets `font-size` on a
 * container cannot fail.
 */
function RootScaled({ percent, children }: { percent: number; children: ReactNode }) {
    useEffect(() => {
        const root = document.documentElement
        const previous = root.style.fontSize
        root.style.fontSize = `${percent}%`
        return () => {
            root.style.fontSize = previous
        }
    }, [percent])
    return <>{children}</>
}

export const TextScale200: Story = {
    name: 'A11y — 200% text scale (scales the root)',
    parameters: { layout: 'padded' },
    render: () => (
        <RootScaled percent={200}>
            <Tabs defaultValue="today">
                <TabsList>
                    <TabsTrigger value="day">Day</TabsTrigger>
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="week">Week</TabsTrigger>
                </TabsList>
                <TabsContent value="today">
                    <p className="text-sm text-[var(--text-muted)]">
                        4 bookings today.
                    </p>
                </TabsContent>
            </Tabs>
        </RootScaled>
    ),
}

/* ─── AUTM-1792: the selected pill slides ────────────────────────────────
 *
 * `<TabsList slide>`: the pill moves to the tab you choose instead of jumping,
 * one shared shape travelling on `--motion-tab` (450ms). Off by default. It is
 * drawn as two round caps and a scaled bar, so nothing animates a width and
 * the pill never squashes between a short label and a long one. Under reduced
 * motion it jumps, as before. Try Day to Month and back, and the 200% text
 * story above with `slide` added.
 */
const VIEWS = ['Day', 'Today', 'Week', 'Month', 'List']

const Sliding = () => (
    <Tabs defaultValue="Day">
        <TabsList slide>
            {VIEWS.map((v) => (
                <TabsTrigger key={v} value={v}>
                    {v}
                </TabsTrigger>
            ))}
        </TabsList>
        {VIEWS.map((v) => (
            <TabsContent key={v} value={v}>
                <Pane>The {v.toLowerCase()} view of the schedule.</Pane>
            </TabsContent>
        ))}
    </Tabs>
)

export const SlidingPill: Story = {
    name: 'Sliding pill (AUTM-1792)',
    render: () => <Sliding />,
}

export const SlidingPillDark: Story = {
    name: 'Sliding pill, dark (AUTM-1792)',
    globals: { theme: 'dark' },
    render: () => <Sliding />,
}

/* ─── 2026-11-07: a secondary switch ─────────────────────────────────────
 *
 * `<TabsList tone="secondary">`: a paper pill and an ink label on the band
 * track, for a switch under a primary one (Bookings' Upcoming / Past under
 * the view switcher), so a screen carries one purple selection, not two. */
const Secondary = () => (
    <div className="flex flex-col items-start gap-3">
        <Tabs defaultValue="List">
            <TabsList slide>
                {['Day', 'Week', 'Month', 'List'].map((v) => (
                    <TabsTrigger key={v} value={v}>
                        {v}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
        <Tabs defaultValue="upcoming">
            <TabsList slide tone="secondary" aria-label="Upcoming or past bookings">
                <TabsTrigger value="upcoming">Upcoming · 15</TabsTrigger>
                <TabsTrigger value="past">Past · 48</TabsTrigger>
            </TabsList>
        </Tabs>
    </div>
)

export const SecondaryTone: Story = {
    name: 'Secondary tone (2026-11-07)',
    render: () => <Secondary />,
}

export const SecondaryToneDark: Story = {
    name: 'Secondary tone, dark',
    globals: { theme: 'dark' },
    render: () => <Secondary />,
}
