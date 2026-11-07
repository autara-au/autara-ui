import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatsStrip } from './StatsStrip'

const meta: Meta<typeof StatsStrip> = {
    title: 'Merchant portal/StatsStrip',
    component: StatsStrip,
    parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof StatsStrip>

export const Default: Story = {
    args: {
        stats: [
            { label: 'Today', value: 3 },
            { label: 'Pending', value: 1 },
            { label: 'Upcoming', value: 7 },
            { label: 'Completed', value: 142 },
        ],
    },
}

export const ThreeColumn: Story = {
    name: '3-column — Customers',
    args: {
        stats: [
            { label: 'Total', value: 48 },
            { label: 'Lifetime', value: '$24,580' },
            { label: 'Avg per customer', value: '$512' },
        ],
    },
}

export const TwoColumn: Story = {
    args: {
        stats: [
            { label: 'Confirmed', value: 24 },
            { label: 'Cancelled', value: 2 },
        ],
    },
}

export const WithCaption: Story = {
    args: {
        stats: [
            { label: 'This month', value: '$4,820' },
            { label: 'Last month', value: '$3,910' },
            { label: 'Pending payouts', value: '$640' },
            {
                label: 'Lifetime',
                value: '$24,580',
                caption: '142 completed',
            },
        ],
    },
}

export const Loading: Story = {
    args: {
        loading: true,
        stats: [
            { label: 'Today', value: null },
            { label: 'Pending', value: null },
            { label: 'Upcoming', value: null },
            { label: 'Completed', value: null },
        ],
    },
}

export const PartialLoading: Story = {
    name: 'Partial loading — value null',
    args: {
        stats: [
            { label: 'Today', value: 3 },
            { label: 'Outstanding', value: null },
            { label: 'This week', value: '$1,240' },
            { label: 'Next payout', value: null },
        ],
    },
}

/**
 * AUTM-1792: three stats on a phone. The hero leads the full width (no tile
 * left alone on a row), and a long figure fits its tile instead of running
 * out of it. Check at 390 and with 200% text, where the strip is one column.
 */
export const PhoneOddWithLongFigure: Story = {
    name: 'Phone, three stats, a long figure (AUTM-1792)',
    parameters: { viewport: { defaultViewport: 'mobile1' } },
    render: () => (
        <div className="max-w-[390px]">
            <StatsStrip
                stats={[
                    { label: 'Total', value: '8' },
                    { label: 'Customer spend', value: '$13,880', hero: true },
                    { label: 'Avg per customer', value: '$1,735' },
                ]}
            />
        </div>
    ),
}

/**
 * `variant="quiet"` (Don, 2026-11-07, the merchant app's quiet pass): one band
 * holding the stats as cells, a 13px label over a bold figure, no Black
 * weight. For figures that support a screen: over a customer list, or under
 * Today's one hero. A zero whispers (`muted`). Narrow the canvas or set 200%
 * text: under 22em the cells become rows, label left and figure right.
 */
export const Quiet: Story = {
    name: 'Quiet (2026-11-07)',
    render: () => (
        <div className="max-w-[720px]">
            <StatsStrip
                variant="quiet"
                stats={[
                    { label: 'Total', value: '33' },
                    { label: 'Customer spend', value: '$7,380' },
                    { label: 'Avg per customer', value: '$224' },
                ]}
            />
        </div>
    ),
}

/** Under a hero, as Today draws it: `figureSize="md"`, tappable cells, a zero muted. */
export const QuietUnderAHero: Story = {
    name: 'Quiet, under a hero, a zero, tappable',
    render: () => (
        <div className="flex max-w-[560px] flex-col gap-3">
            <div className="rounded-[1.25rem] bg-[var(--hero)] p-5 text-[var(--lime)]">
                <p className="text-[0.9375rem] text-[var(--on-deep-muted)]">Earned today</p>
                <p className="text-[2.5rem] leading-none font-black tabular-nums">$240.00</p>
            </div>
            <StatsStrip
                variant="quiet"
                figureSize="md"
                stats={[
                    { label: 'Still to collect', value: '$0.00', muted: true, onClick: () => {}, testId: 'stat-owed' },
                    { label: 'This month', value: '$733.00', onClick: () => {}, testId: 'stat-month' },
                    { label: 'Next payout', value: '$0.00', muted: true, onClick: () => {}, testId: 'stat-payout' },
                ]}
            />
        </div>
    ),
}

/** A phone: under 22em of strip the cells are rows. */
export const QuietPhone: Story = {
    name: 'Quiet, phone (rows)',
    parameters: { viewport: { defaultViewport: 'mobile1' } },
    render: () => (
        <div className="max-w-[343px]">
            <StatsStrip
                variant="quiet"
                stats={[
                    { label: 'Outstanding', value: '$0', muted: true },
                    { label: 'Paid this month', value: '$733', caption: 'Collected before refunds' },
                    { label: 'Overdue', value: '0', muted: true },
                ]}
            />
        </div>
    ),
}

/** Loading: each cell holds its shape. */
export const QuietLoading: Story = {
    name: 'Quiet, loading',
    render: () => (
        <div className="max-w-[720px]">
            <StatsStrip variant="quiet" loading stats={[{ label: 'Reviews' }, { label: 'Average' }, { label: '5-star' }]} />
        </div>
    ),
}
