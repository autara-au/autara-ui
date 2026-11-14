import type { Meta, StoryObj } from '@storybook/react-vite'
import { Ticket } from './Ticket'
import { Badge } from './Badge'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { Card } from './Card'
import { CircleButton } from './CircleButton'
import { RemotePhoto } from './Photo'
import { SectionTitle, PageTitle } from './SectionTitle'
import { rise } from './Rise'
import { ChatIcon, ChevronLeftIcon, ChevronRightIcon, RefreshIcon } from '../icons'

/**
 * AU/Screens: the pieces in context, as the native customer app composes
 * them (autara-ios/shots/ink). The web twin builds these screens from the
 * same pieces.
 */
const meta: Meta = { title: 'AU/Screens' }
export default meta
type Story = StoryObj

const screen = { width: 390, minHeight: 780, padding: '8px 20px 24px', display: 'grid', gap: 16, alignContent: 'start' } as const

export const LiveBooking: Story = {
    name: 'The booking, in progress',
    render: () => (
        <div className="au-room" style={screen}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <CircleButton icon={<ChevronLeftIcon />} label="Back" />
                <Button kind="card" height={44}>Get help</Button>
            </div>
            <Ticket {...rise(0)} badge={<Badge kind="inFlight">In progress</Badge>} caption="Ready about" time="12:30" meridiem="pm" stepsDone={2} title="Your X5 is being cared for" />
            <Card {...rise(1)} style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}><strong>From Kerbside</strong><span style={{ color: 'var(--au-muted)' }}>12:01 pm</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <RemotePhoto name="Ext" radius={18} style={{ height: 108 }} />
                    <RemotePhoto name="Int" radius={18} style={{ height: 108 }} />
                </div>
            </Card>
            <Card {...rise(2)} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name="Kerbside Car Care" />
                <div style={{ flex: 1 }}><strong>Kerbside Car Care</strong><div style={{ color: 'var(--au-muted)', fontSize: 15 }}>At 14 Foveaux St</div></div>
                <ChevronRightIcon size={20} />
            </Card>
            <Card {...rise(3)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ color: 'var(--au-muted)', fontSize: 15 }}>After the job, Visa 4242</span>
                <strong style={{ fontSize: 20 }}>$75.92</strong>
            </Card>
            <Button wide height={54} style={{ marginTop: 40 }}><ChatIcon size={22} />Message Kerbside</Button>
        </div>
    ),
}

export const Bookings: Story = {
    render: () => (
        <div className="au-room" style={screen}>
            <PageTitle>Bookings</PageTitle>
            <Ticket badge={<Badge>Confirmed</Badge>} caption="Sat 21 Nov" time="9:00" meridiem="am" title="Exterior car care">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Avatar name="Kerbside Car Care" onPlate /><strong>Kerbside Car Care</strong></div>
            </Ticket>
            <SectionTitle text="Done" />
            <Card>
                {['Exterior car care', 'Inside and out', 'Ceramic coating'].map((name) => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0' }}>
                        <RemotePhoto name="Kerbside Car Care" radius={16} style={{ width: 56, height: 56 }} />
                        <div style={{ flex: 1 }}><strong>{name}</strong><div style={{ color: 'var(--au-muted)', fontSize: 15 }}>24 Oct, Done</div></div>
                        <CircleButton icon={<RefreshIcon size={20} />} label={`Book ${name} again`} fill="well" />
                    </div>
                ))}
            </Card>
        </div>
    ),
}
