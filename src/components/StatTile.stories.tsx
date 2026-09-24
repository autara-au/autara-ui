import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatTile } from './StatTile'
import { StatsStrip } from './StatsStrip'

const meta: Meta<typeof StatTile> = {
    title: 'Merchant portal/StatTile',
    component: StatTile,
    parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof StatTile>

export const MoneyIn: Story = {
    name: 'money-in — revenue',
    args: {
        label: 'Today',
        value: '$480',
        caption: '3 jobs',
        tone: 'money-in',
    },
}

export const MoneyOut: Story = {
    name: 'money-out — payouts',
    args: {
        label: 'Next payout',
        value: '$1,240',
        caption: 'Fri 8 Aug',
        tone: 'money-out',
    },
}

export const Brand: Story = {
    name: 'brand — counts',
    args: { label: 'Customers', value: 48, caption: '6 new this month' },
}

/**
 * AUTM-1161 — the caption is the point of the tile now.
 *
 * A number with nothing to compare it against cannot be acted on: "$426"
 * answers "what did I take", which a merchant already feels, and "$426, up
 * 18% on last Tuesday" answers "is this a good day", which they cannot.
 * `trend` colours the delta and nothing else.
 */
export const WithATrend: Story = {
    name: 'With a comparison',
    render: () => (
        <div className="grid grid-cols-2 gap-3">
            <StatTile
                label="Today"
                value="$426"
                caption="+18% on last Tuesday"
                trend="up"
            />
            <StatTile
                label="This month"
                value="$4,247"
                caption="-6% on last month to date"
                trend="down"
            />
        </div>
    ),
}

/**
 * `trend` is for a REAL comparison, never to make a flat number look like
 * good news. A tile with nothing to compare against simply says what it
 * covers, and that is the correct rendering rather than a missing feature.
 */
export const WithoutAComparison: Story = {
    name: 'No comparison available',
    args: { label: 'Completed', value: 142, caption: 'All time' },
}

export const Loading: Story = {
    args: { label: 'This month', value: null, tone: 'money-in' },
}

/**
 * AUTM-1161 — `tone` no longer renders anything.
 *
 * It drove a 3px accent tick above the label. `project_ui_direction_2026_09_01`
 * rule 5 names that exact device as the reason two of three brand colours were
 * decoration ("aqua and lime existed only as 3px dashes above KPI labels"),
 * while this component's own docblock used to defend it as the one place the
 * accent carried meaning. Don settled it on 2026-09-07: the tick goes.
 *
 * The prop stays so no consumer breaks and so a call site still documents what
 * a tile means. This story is kept to show that all four tones now render
 * identically — if a future change spends the accent here again, this is where
 * it will show up.
 */
export const ToneRendersNothing: Story = {
    name: 'Tone (deprecated, renders nothing)',
    render: () => (
        <div className="grid grid-cols-3 gap-3">
            <StatTile
                tone="money-in"
                label="Takings"
                value="$4,820"
                caption="money in"
            />
            <StatTile
                tone="money-out"
                label="Paid out"
                value="$3,910"
                caption="money out"
            />
            <StatTile
                tone="brand"
                label="Customers"
                value={48}
                caption="not money"
            />
        </div>
    ),
}

/**
 * In context — `StatsStrip` is this tile in a grid. Same component, so the
 * two can no longer drift the way `TodayKpi` and `StatsStrip` did.
 */
export const InStrip: Story = {
    name: 'In context — StatsStrip',
    render: () => (
        <StatsStrip
            stats={[
                { label: 'This month', value: '$4,820', tone: 'money-in' },
                { label: 'Paid out', value: '$3,910', tone: 'money-out' },
                { label: 'Pending', value: '$640', tone: 'money-out' },
                { label: 'Lifetime', value: '$24,580', caption: '142 jobs' },
            ]}
        />
    ),
}

/**
 * The rule the variant is easiest to get wrong: a hero is an ANSWER, so a
 * tile with nothing to say must not wear one. Left is what shipping
 * `hero: true` unconditionally looked like on Invoices for an all-paid-up
 * merchant; right is `hero: outstandingCents > 0`.
 */
export const HeroOnAnEmptyValue: Story = {
    name: 'hero — never spend it on nothing',
    render: () => (
        <div className="grid max-w-[860px] gap-6 sm:grid-cols-2">
            <div>
                <p className="mb-2 text-[0.8125rem] font-medium text-[var(--text-muted)]">
                    Wrong — the eye lands on the one number that is not news
                </p>
                <StatsStrip
                    columns={2}
                    stats={[
                        { label: 'Outstanding', value: '$0', hero: true },
                        { label: 'Paid this month', value: '$343', tone: 'money-in' },
                    ]}
                />
            </div>
            <div>
                <p className="mb-2 text-[0.8125rem] font-medium text-[var(--text-muted)]">
                    Right — nothing owed is a calm state, so nothing shouts
                </p>
                <StatsStrip
                    columns={2}
                    stats={[
                        { label: 'Outstanding', value: '$0', tone: 'money-in' },
                        { label: 'Paid this month', value: '$343', tone: 'money-in' },
                    ]}
                />
            </div>
        </div>
    ),
}

export const Hero: Story = {
    name: 'hero — the one that answers the question',
    args: {
        label: 'Lifetime',
        value: '$1,440',
        caption: 'across 4 customers',
        hero: true,
    },
}

export const HeroInStrip: Story = {
    name: 'in context — one hero, two supporting',
    render: () => (
        <div className="max-w-[720px]">
            <StatsStrip
                columns={3}
                stats={[
                    { label: 'Total', value: '4', tone: 'brand' },
                    { label: 'Lifetime', value: '$1,440', hero: true },
                    { label: 'Avg per customer', value: '$360', tone: 'money-in' },
                ]}
            />
            <p className="mt-4 text-[0.8125rem] text-[var(--text-muted)]">
                AUTM-713 — the merchant came to ask &ldquo;how is my business
                doing?&rdquo;, so lifetime takes the fill and the other two
                support it. Promote a different tile and you have answered a
                different question; promote two and you have answered none.
            </p>
        </div>
    ),
}

/**
 * AUTM-1161 — a tile with somewhere to go.
 *
 * The whole surface is the target rather than a link buried inside it, and
 * `onClick` keeps the package router-agnostic: merchant-mobile passes
 * `() => navigate('/earnings')`, a Next.js consumer passes `router.push`.
 */
export const Interactive: Story = {
    name: 'interactive — the whole tile is the control',
    render: () => (
        <div className="grid max-w-[560px] grid-cols-2 gap-3">
            <StatTile
                label="Today"
                value="$426"
                caption="18% on last Tuesday"
                trend="up"
                hero
                testId="today-stat-revenue"
                onClick={() => alert('navigate to /earnings')}
            />
            <StatTile
                label="Pending payouts"
                value="$5,454"
                caption="17 jobs awaiting Stripe"
                testId="today-stat-pending"
                onClick={() => alert('navigate to /earnings')}
            />
            <StatTile label="This month" value="$6,300" caption="Through Wed, 9 Sept" />
            <StatTile label="Next payout" value="-" caption="No payout scheduled yet" />
        </div>
    ),
}

/** AUTM-1426 — four tiles in one row, one with an icon, one with a long label:
 *  the values must sit on one line. This is the story to look at before
 *  touching the header row or the label. */
export const AlignedRow: Story = {
    name: 'AUTM-1426 — values align across mixed tiles',
    render: () => (
        <div className="grid grid-cols-4 gap-3">
            <StatTile label="Today" value="$426" caption="5 jobs" hero />
            <StatTile label="Pending payouts" value="$202" caption="Awaiting Stripe transfer" />
            <StatTile
                label="This month, including the long label that used to wrap"
                value="$4,247"
                caption="Through Tue, 8 Sept"
            />
            <StatTile
                label="Next payout"
                value="$1,874"
                caption="Pays Thu, 10 Sept"
                icon={<span aria-hidden>$</span>}
            />
        </div>
    ),
}
