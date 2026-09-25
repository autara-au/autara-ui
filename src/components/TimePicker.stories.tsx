import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import { TimePicker, type SlotState } from './TimePicker'

const meta: Meta<typeof TimePicker> = {
    title: 'Forms/TimePicker',
    component: TimePicker,
    parameters: {
        docs: {
            description: {
                component:
                    "The shop's bookable times as a grid. Taken and closed slots are visibly out, so a conflict is seen at the moment of choosing rather than reported after the form is submitted.",
            },
        },
    },
}
export default meta
type Story = StoryObj<typeof TimePicker>

function Controlled(props: Partial<React.ComponentProps<typeof TimePicker>>) {
    const [value, setValue] = React.useState(props.value ?? '')
    return (
        <div className="max-w-xl">
            <TimePicker {...props} value={value} onChange={setValue} />
        </div>
    )
}

export const Default: Story = {
    render: () => <Controlled startTime="08:00" endTime="17:00" />,
}

export const WithSelection: Story = {
    render: () => <Controlled startTime="08:00" endTime="17:00" value="10:30" />,
}

/** The reason this component exists rather than a native time field. */
export const BookedAndClosed: Story = {
    render: () => (
        <Controlled
            startTime="08:00"
            endTime="17:00"
            value="09:30"
            slotState={(t): SlotState =>
                ['10:30', '11:00', '14:00'].includes(t) || t >= '16:00'
                    ? 'unavailable'
                    : 'available'
            }
            reasonFor={(t) => (t >= '16:00' ? 'closed' : 'already booked')}
        />
    ),
}

/**
 * A time that predates a change of interval. It stays selected and in order
 * rather than vanishing, which would read as the form losing the booking.
 */
export const OffGridValue: Story = {
    render: () => <Controlled startTime="09:00" endTime="12:00" intervalMinutes={30} value="10:20" />,
}

export const FifteenMinutes: Story = {
    render: () => <Controlled startTime="09:00" endTime="12:00" intervalMinutes={15} value="10:15" />,
}

export const Disabled: Story = {
    render: () => <Controlled startTime="09:00" endTime="12:00" value="10:00" disabled />,
}

/** The grid reflows by itself: auto-fill on a rem floor, no breakpoint. */
export const TextScale200: Story = {
    name: 'At 200% text scale',
    render: () => (
        <div style={{ fontSize: '200%' }}>
            <Controlled startTime="09:00" endTime="13:00" value="10:00" />
        </div>
    ),
}

/**
 * AUTM-1267 — a visible `<label htmlFor>` above the grid, as every merchant
 * form writes it. The id lands on the group, the label names it, and a click
 * on the label focuses the slot holding the tab stop.
 */
export const WithVisibleLabel: Story = {
    render: () => (
        <div className="flex max-w-xl flex-col gap-2">
            <label htmlFor="story-start-time" className="text-sm font-medium text-[var(--text-strong)]">
                Start time
            </label>
            <Controlled id="story-start-time" />
        </div>
    ),
}
