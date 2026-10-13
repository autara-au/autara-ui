import { useEffect, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MoneyBreakdown } from './MoneyBreakdown'

const meta = {
    title: 'Molecules/MoneyBreakdown',
    component: MoneyBreakdown,
    parameters: { layout: 'padded' },
} satisfies Meta<typeof MoneyBreakdown>

export default meta
type Story = StoryObj<typeof meta>

export const CheckoutReview: Story = {
    args: {
        label: 'Payment summary',
        rows: [
            { label: 'Exterior detail', value: 'A$180.00' },
            { label: 'Deposit now (30%)', value: 'A$54.00', emphasis: true },
            { label: 'Balance after the job', value: 'A$126.00' },
        ],
        total: { label: 'Total', value: 'A$180.00' },
        note: 'GST included. The balance is charged when the pro marks the job complete.',
    },
    render: (args) => (
        <div className="max-w-sm rounded-autara-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
            <MoneyBreakdown {...args} />
        </div>
    ),
}

export const CancellationPreview: Story = {
    args: {
        label: 'If you cancel now',
        rows: [
            { label: 'Deposit paid', value: 'A$54.00' },
            { label: 'Cancellation fee (50%)', value: 'A$27.00', muted: true },
        ],
        total: { label: 'You get back', value: 'A$27.00' },
        note: 'Refunds land within 5 to 10 business days, depending on your bank.',
    },
    render: (args) => (
        <div className="max-w-sm">
            <MoneyBreakdown {...args} />
        </div>
    ),
}

export const NoTotal: Story = {
    args: {
        rows: [
            { label: 'Deposit paid', value: 'A$54.00' },
            { label: 'Refunded', value: 'A$54.00', emphasis: true },
        ],
    },
    render: (args) => (
        <div className="max-w-sm">
            <MoneyBreakdown {...args} />
        </div>
    ),
}

export const LongLabelsNarrow: Story = {
    args: {
        rows: [
            {
                label: 'Full interior and exterior detail with ceramic coating, two-day booking',
                value: 'A$1,240.00',
            },
            { label: 'Deposit now (30%)', value: 'A$372.00', emphasis: true },
        ],
        total: { label: 'Total', value: 'A$1,240.00' },
    },
    render: (args) => (
        <div className="w-[260px]">
            <MoneyBreakdown {...args} />
        </div>
    ),
}

/**
 * AUTM-1797 / AUTM-1799: the same rows as chips, the label over the amount.
 * AUTM-1856 (Don, 2026-10-13): every chip is the neutral band card with the
 * amount in ink, and what the money is doing is a small solid badge beside
 * the label: aqua on hold, grey a balance still due.
 */
export const Chips: Story = {
    args: {
        variant: 'chips',
        label: 'When you pay',
        title: 'Payment',
        rows: [
            { label: 'Deposit', value: '$54', tone: 'flight', state: 'On hold' },
            { label: 'Balance', value: '$126', state: 'Balance due' },
        ],
    },
    render: (args) => (
        <div className="max-w-[390px]">
            <MoneyBreakdown {...args} />
        </div>
    ),
}

/**
 * Every state badge side by side (AUTM-1856): lime paid or captured, aqua on
 * hold or pending, purple yours to act on, grey otherwise; and a row with no
 * state, which draws no badge.
 */
export const ChipTones: Story = {
    args: {
        variant: 'chips',
        label: 'Money',
        rows: [
            { label: 'Deposit', value: '$54', tone: 'money', state: 'Captured' },
            { label: 'Deposit', value: '$54', tone: 'flight', state: 'On hold' },
            { label: 'To pay', value: '$126', tone: 'act', state: 'Your move' },
            { label: 'Balance', value: '$126', state: 'Balance due' },
            { label: 'Refund on its way', value: '$27', tone: 'flight', state: 'Pending' },
            { label: 'Kept by the pro', value: '$27' },
        ],
    },
    render: (args) => (
        <div className="max-w-[390px]">
            <MoneyBreakdown {...args} />
        </div>
    ),
}

const CHECKOUT_ROWS = [
    {
        label: (
            <span className="flex flex-col">
                <span>On hold today</span>
                <span className="text-xs font-normal">Deposit $24 + booking fee $1.18</span>
            </span>
        ),
        value: '$25.18',
        tone: 'flight' as const,
    },
    {
        label: (
            <span className="flex flex-col">
                <span>After the job</span>
                <span className="text-xs font-normal">Balance $56 + booking fee $2.74</span>
            </span>
        ),
        value: '$58.74',
    },
]

/** The root at 200%, as a reader's large text sets it; restored when the story leaves. */
function LargeText({ children }: { children: ReactNode }) {
    useEffect(() => {
        const root = document.documentElement
        const was = root.style.fontSize
        root.style.fontSize = '200%'
        return () => {
            root.style.fontSize = was
        }
    }, [])
    return <>{children}</>
}

/**
 * AUTM-1799: 200% text in a 270px card (about checkout's at 390). Each
 * amount stays one figure on one line ("$25.18", never "$25.1" over "8"),
 * and one too wide for its chip scales down to fit (right: "$1,234.50").
 */
export const ChipsLargeText: Story = {
    args: { variant: 'chips', label: 'When you pay', rows: CHECKOUT_ROWS },
    render: (args) => (
        <LargeText>
            <div className="flex flex-wrap items-start gap-6">
                <div className="w-[270px]">
                    <MoneyBreakdown {...args} />
                </div>
                <div className="w-[270px]">
                    <MoneyBreakdown {...args} rows={[{ label: 'Paid', value: '$1,234.50', tone: 'money' }]} />
                </div>
            </div>
        </LargeText>
    ),
}
