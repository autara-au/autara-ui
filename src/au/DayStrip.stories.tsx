import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { DayStrip, type StripDay } from './DayStrip'
import { Room } from './_story'

/** AU/DayStrip (AUTM-2202): two weeks as capsules; the picked day is the purple tile, a closed day dims and says why beside it. */
const meta: Meta = { title: 'AU/DayStrip' }
export default meta
type Story = StoryObj

const DAYS: StripDay[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(2026, 10, 21 + i)
    return {
        key: d.toISOString().slice(0, 10),
        weekday: d.toLocaleDateString('en-AU', { weekday: 'short' }),
        date: String(d.getDate()),
        label: d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }),
        closed: d.getDay() === 1,
    }
})

function Strip() {
    const [v, setV] = React.useState<string | null>(DAYS[0].key)
    const day = DAYS.find((d) => d.key === v)
    return (
        <>
            <DayStrip days={DAYS} value={v} onChange={setV} arrows="always" />
            {day?.closed ? <p style={{ fontSize: 14, color: 'var(--au-muted)' }}>Closed on Mondays.</p> : null}
        </>
    )
}

export const TwoWeeks: Story = { render: () => <Room><Strip /></Room> }
