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

/**
 * AUTM-1633 — the merchant's own hours. Sundays and Mondays are closed: muted
 * and hatched like out-of-hours time on the calendar, and STILL selectable,
 * because a merchant may take a job on a day they are shut. Open the month
 * with "Pick a date" to see the same days there, with the note explaining them.
 */
export const ClosedDays: Story = {
    render: () => (
        <Controlled
            value="2026-09-10"
            calendarNote="Muted days are outside your hours. They're still yours to take."
            dayState={(date): DayState => {
                const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
                return weekday === 0 || weekday === 1 ? 'closed' : 'available'
            }}
        />
    ),
}

/**
 * AUTM-1867 — "Book a customer in" leads with this rail. An open day with no
 * free time left for the job is `full`: dimmed, no hatch (that stays the sign
 * of a closed day), still focusable and selectable, and named "no free
 * times" for a screen reader. Here Thursday the 10th and Saturday the 12th are
 * booked out and Sunday is closed.
 */
export const FullDays: Story = {
    render: () => (
        <Controlled
            value="2026-09-11"
            dayState={(date): DayState => {
                if (date === '2026-09-10' || date === '2026-09-12') return 'full'
                const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
                return weekday === 0 ? 'closed' : 'available'
            }}
        />
    ),
}

/**
 * AUTM-1633 — a day chosen beyond the fortnight. The rail has moved to hold
 * it (three days before it, then the rest) and it is selected, with the year
 * written out beside the button because it is not this year.
 */
export const FarDate: Story = {
    render: () => <Controlled value="2027-02-12" />,
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
 *
 * This is also the story to judge the arrows in, because it is the only one
 * narrow enough to overflow. With a mouse they appear at both ends and the one
 * with nowhere to go is disabled; on a touch screen they are not rendered at
 * all and the rail is dragged as before.
 */
export const InScrollingPanel: Story = {
    render: () => (
        <div className="relative max-h-80 w-[448px] overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
            <p className="mb-3 text-sm text-[var(--text-muted)]">
                Fourteen days in a 400px column. Only the rail scrolls sideways, and with a mouse
                the arrows at each end move it three days at a time.
            </p>
            <Controlled stripDays={14} />
        </div>
    ),
}

/**
 * AUTM-1373 — the other half of the rule: a rail with nowhere to scroll
 * carries no chrome. Four days in a wide column, so neither arrow is rendered
 * and the control is exactly what it was before.
 */
export const RailThatFits: Story = {
    render: () => (
        <div className="w-[448px] rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
            <p className="mb-3 text-sm text-[var(--text-muted)]">
                Four days in a 400px column: nothing overflows, so there are no arrows.
            </p>
            <Controlled stripDays={4} />
        </div>
    ),
}
