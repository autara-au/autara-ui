import type { Meta, StoryObj } from '@storybook/react-vite'
import { Ticket, Steps } from './Ticket'
import { Badge } from './Badge'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { Room } from './_story'

/** AU/Ticket: the booking as one big lime time (Customer/Ticket.swift). Same shape on Home, Bookings and the booking. */
const meta: Meta<typeof Ticket> = { title: 'AU/Ticket', component: Ticket }
export default meta
type Story = StoryObj<typeof Ticket>

export const Confirmed: Story = {
    render: () => (
        <Room>
            <Ticket badge={<Badge>Confirmed</Badge>} caption="Sat 21 Nov" time="9:00" meridiem="am" title="Exterior car care">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar name="Kerbside Car Care" onPlate />
                    <span style={{ fontWeight: 700 }}>Kerbside Car Care</span>
                </div>
            </Ticket>
        </Room>
    ),
}

export const InProgress: Story = {
    render: () => (
        <Room>
            <Ticket badge={<Badge kind="inFlight">In progress</Badge>} caption="Ready about" time="12:30" meridiem="pm" stepsDone={2} title="Your X5 is being cared for" />
        </Room>
    ),
}

export const WithActions: Story = {
    name: 'With one row of actions',
    render: () => (
        <Room>
            <Ticket badge={<Badge>Requested</Badge>} caption="Tue 17 Nov" time="10:30" meridiem="am" title="Inside and out">
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button kind="onPlate">Message</Button>
                    <Button kind="onPlate">Change time</Button>
                </div>
            </Ticket>
        </Room>
    ),
}

export const LongTitle: Story = {
    name: 'Edge: a long service name',
    render: () => (
        <Room>
            <Ticket badge={<Badge>Confirmed</Badge>} caption="Mon 16 Nov" time="11:30" meridiem="am" title="Exterior Car Care and Detailing with a ceramic top coat" />
        </Room>
    ),
}

export const StepsAlone: Story = {
    name: 'Steps',
    render: () => (
        <Room>
            <div className="au-hero" style={{ padding: 24, display: 'grid', gap: 16 }}>
                <Steps done={0} />
                <Steps done={2} />
                <Steps done={4} />
            </div>
        </Room>
    ),
}
