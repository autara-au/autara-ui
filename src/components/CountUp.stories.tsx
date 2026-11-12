import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CountUp } from './CountUp'
import { Button } from './Button'

/**
 * CountUp (AUTM-1792): a figure counts to its value once, as it arrives.
 * Don, 2026-10-09: "can you see this smooth animation, can we apply slight
 * animation in our app too". The merchant portal's Today tiles are the first
 * consumer. Replay remounts the tiles; a value changed in place does not
 * re-count. Turn on reduced motion in the OS and the figures simply appear.
 */
const meta: Meta<typeof CountUp> = {
    title: 'Atoms/CountUp',
    component: CountUp,
    parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof CountUp>

const aud = (n: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
const audCents = (n: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 }).format(n)

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="rounded-autara-lg bg-[var(--band)] p-5 text-[var(--text-strong)]">
            <p className="text-[0.8125rem] font-medium text-[var(--text-muted)]">{label}</p>
            <p className="mt-1 text-[2.25rem] font-black tabular-nums leading-none">{children}</p>
        </div>
    )
}

function Tiles() {
    const [run, setRun] = React.useState(0)
    const [extra, setExtra] = React.useState(0)
    return (
        <div className="max-w-3xl space-y-4">
            <div className="flex gap-2">
                <Button size="sm" variant="quiet" onClick={() => setRun((n) => n + 1)}>
                    Replay
                </Button>
                <Button size="sm" variant="quiet" onClick={() => setExtra((n) => n + 49)}>
                    A live update (does not re-count)
                </Button>
            </div>
            <div key={run} className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Tile label="Today">
                    <CountUp value={189 + extra} format={aud} />
                </Tile>
                <Tile label="This month">
                    <CountUp value={4072} format={aud} />
                </Tile>
                <Tile label="Still to collect">
                    <CountUp value={140.5} format={audCents} />
                </Tile>
                <Tile label="Jobs this week">
                    <CountUp value={12} />
                </Tile>
            </div>
        </div>
    )
}

export const MoneyTiles: Story = {
    name: 'Money tiles',
    render: () => <Tiles />,
}

export const MoneyTilesDark: Story = {
    name: 'Money tiles, dark',
    globals: { theme: 'dark' },
    render: () => <Tiles />,
}

/** Zero does not count: there is nothing to arrive at. */
export const Zero: Story = {
    render: () => (
        <Tile label="Still to collect">
            <CountUp value={0} format={aud} />
        </Tile>
    ),
}

/**
 * AUTM-1781: from a server component, where `format` (a function) cannot be
 * passed. `text` is the figure exactly as the page prints it; `formatOptions`
 * formats the frames on the way there. The customer app's payment tiles.
 */
export const FromAServerComponent: Story = {
    name: 'From a server component (text and formatOptions)',
    render: () => (
        <div className="grid max-w-md grid-cols-2 gap-4">
            <Tile label="Paid">
                <CountUp
                    value={85.5}
                    text="$85.50"
                    formatOptions={{ style: 'currency', currency: 'AUD', minimumFractionDigits: 2 }}
                    testId="count-up-paid"
                />
            </Tile>
            <Tile label="After the job">
                <CountUp
                    value={364}
                    text="$364"
                    formatOptions={{ style: 'currency', currency: 'AUD', minimumFractionDigits: 0 }}
                    testId="count-up-after"
                />
            </Tile>
        </div>
    ),
}
