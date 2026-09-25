import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import { DatePicker, type DayState } from './DatePicker'

/**
 * Every story pins `today`, because the component refuses to read the clock —
 * see `lib/calendar.ts`. That also makes the screenshots stable.
 */
const TODAY = '2026-09-09'

const meta: Meta<typeof DatePicker> = {
    title: 'Forms/DatePicker',
    component: DatePicker,
    parameters: {
        docs: {
            description: {
                component:
                    'A rail of the coming days with the full month one tap behind it. Replaces the native date input, which cannot show whether a day is bookable.',
            },
        },
    },
}
export default meta
type Story = StoryObj<typeof DatePicker>

function Controlled(props: Partial<React.ComponentProps<typeof DatePicker>>) {
    const [value, setValue] = React.useState(props.value ?? '')
    return (
        <div className="max-w-xl">
            <DatePicker {...props} today={props.today ?? TODAY} value={value} onChange={setValue} />
        </div>
    )
}

export const Default: Story = { render: () => <Controlled /> }

export const WithSelection: Story = { render: () => <Controlled value="2026-09-11" /> }

/** The case a native input cannot express: which days are worth tapping. */
export const Availability: Story = {
    render: () => (
        <Controlled
            value="2026-09-10"
            dayState={(date): DayState => {
                // Sundays shut, and the Friday is nearly gone.
                if (date === '2026-09-13' || date === '2026-09-20') return 'unavailable'
                if (date === '2026-09-11') return 'limited'
                return 'available'
            }}
        />
    ),
}

/** Bounded on both ends, e.g. a reschedule that cannot move more than a month. */
export const Bounded: Story = {
    render: () => <Controlled value="2026-09-12" min="2026-09-10" max="2026-09-16" />,
}

export const Invalid: Story = { render: () => <Controlled invalid /> }

export const Disabled: Story = { render: () => <Controlled value="2026-09-10" disabled /> }

/**
 * The rail and the month grid are sized in rem, so they thin out under system
 * text scaling rather than truncating. Compare against Default.
 */
export const TextScale200: Story = {
    name: 'At 200% text scale',
    render: () => (
        <div style={{ fontSize: '200%' }}>
            <Controlled value="2026-09-10" />
        </div>
    ),
}

/**
 * AUTM-1267 — the way every merchant form actually writes this control: a
 * visible `<label htmlFor>` above it, as for any other field. The picker puts
 * the id on its group, takes its accessible name from that label, and a click
 * on the label focuses the day holding the tab stop (without choosing it).
 */
export const WithVisibleLabel: Story = {
    render: () => (
        <div className="flex max-w-xl flex-col gap-2">
            <label htmlFor="story-due-date" className="text-sm font-medium text-[var(--text-strong)]">
                Due date
            </label>
            <Controlled id="story-due-date" />
        </div>
    ),
}

/**
 * AUTM-1373 — in context: a narrow, positioned, vertically scrolling panel,
 * the shape of a dialog body (merchant-mobile's Block time sheet). The rail
 * scrolls; the panel must not gain a horizontal scrollbar.
 */
export const InScrollingPanel: Story = {
    render: () => (
        <div className="relative max-h-80 w-[448px] overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
            <p className="mb-3 text-sm text-[var(--text-muted)]">
                Fourteen days in a 400px column. Only the rail scrolls sideways.
            </p>
            <Controlled stripDays={14} />
        </div>
    ),
}
