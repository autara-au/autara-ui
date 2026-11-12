import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CountdownPill } from './CountdownPill'
import { cardVariants } from './Card'

/**
 * CountdownPill: the time left on something that lapses (AUTM-1819).
 *
 * Purple while there is time, amber when it is getting close, red when it is
 * about to lapse. It pops in once when it arrives; a red pill in the last
 * stretch breathes slowly, in opacity only. With reduced motion it is simply
 * there. The consumer owns the clock, the words and the lines between tones;
 * Today in the merchant portal uses amber under two hours and red under
 * thirty minutes, breathing in the last half hour. Use the theme toolbar for
 * dark.
 */
const meta = {
    title: 'Feedback/CountdownPill',
    component: CountdownPill,
    parameters: { layout: 'centered' },
    argTypes: {
        tone: { control: { type: 'inline-radio' }, options: ['calm', 'amber', 'red'] },
        breathe: { control: 'boolean' },
        pop: { control: 'boolean' },
    },
    args: { tone: 'calm', breathe: false, pop: true, children: '6 h 51 min left' },
} satisfies Meta<typeof CountdownPill>

export default meta
type Story = StoryObj<typeof meta>

export const Calm: Story = {}
export const Amber: Story = { args: { tone: 'amber', children: '1 h 12 min left' } }
export const Red: Story = { args: { tone: 'red', children: '42 min left' } }

/** The last half hour: red, breathing slowly. Nothing grows past the edge. */
export const RedBreathing: Story = { args: { tone: 'red', breathe: true, children: '12 min left' } }

/** Every tone side by side, the way a list of requests reads. */
export const AllTones: Story = {
    render: () => (
        <div className="flex flex-wrap items-center gap-2.5">
            <CountdownPill tone="calm">6 h 51 min left</CountdownPill>
            <CountdownPill tone="amber">1 h 12 min left</CountdownPill>
            <CountdownPill tone="red">42 min left</CountdownPill>
            <CountdownPill tone="red" breathe>
                12 min left
            </CountdownPill>
        </div>
    ),
}

/** Remount to see the arrival again: a small scale-in and a fade, once. */
export const Arrival: Story = {
    render: (args) => {
        const [key, setKey] = useState(0)
        return (
            <div className="flex flex-col items-center gap-4">
                <CountdownPill key={key} {...args} />
                <button
                    type="button"
                    className="rounded-full bg-[var(--band)] px-4 py-2 text-sm font-medium text-[var(--text-strong)]"
                    onClick={() => setKey((k) => k + 1)}
                >
                    Arrive again
                </button>
            </div>
        )
    },
}

/**
 * In context: a request row on Today, as the merchant portal draws it. The
 * deadline in words, the pill beside it on a wide screen; on a phone the two
 * drop under the day and time and the pill wraps under the words when they do
 * not fit.
 */
export const RequestRowInContext: Story = {
    parameters: { layout: 'padded' },
    render: () => (
        <div className="flex max-w-2xl flex-col gap-2.5">
            {(
                [
                    ['Sam Lee', '$180.00', 'Sat, 11 Oct at 09:30', 'Full car care', 'Answer by 22:56 today', 'calm', '6 h 51 min left', false],
                    ['Priya Shah', '$95.00', 'Sat, 11 Oct at 13:00', 'Interior refresh', 'Answer by 17:20 today', 'amber', '1 h 12 min left', false],
                    ['Jordan Wu', '$240.00', 'Sun, 12 Oct at 08:00', 'Paint protection', 'Answer by 16:20 today', 'red', '12 min left', true],
                    ['Alex Kim', '$60.00', 'Mon, 13 Oct at 10:00', 'Express wash', 'Answer by 13:00 tomorrow', null, null, false],
                ] as const
            ).map(([name, price, when, service, by, tone, left, breathe]) => (
                <div key={name} className={`${cardVariants({ variant: 'raised' })} flex flex-col gap-0.5 px-4 py-3.5`}>
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="text-base font-medium text-[var(--text-strong)]">{name}</span>
                        <span className="text-base font-bold tabular-nums text-[var(--text-strong)]">{price}</span>
                    </span>
                    <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                        <span className="flex min-w-[min(100%,16rem)] flex-1 flex-wrap items-baseline gap-x-2">
                            <span className="text-[0.9375rem] font-medium tabular-nums text-[var(--text-strong)]">{when}</span>
                            <span className="truncate text-[0.8125rem] text-[var(--text-muted)]">{service}</span>
                        </span>
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-[0.8125rem] font-medium tabular-nums text-[var(--text-muted)]">{by}</span>
                            {tone && left ? (
                                <CountdownPill tone={tone} breathe={breathe}>
                                    {left}
                                </CountdownPill>
                            ) : null}
                        </span>
                    </span>
                </div>
            ))}
        </div>
    ),
}
