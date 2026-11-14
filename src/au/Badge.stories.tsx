import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './Badge'
import { Room } from './_story'

/** AU/Badge: a status. Ghost and in flight sit on the hero; done, needs you and quiet sit on a card. */
const meta: Meta<typeof Badge> = { title: 'AU/Badge', component: Badge }
export default meta
type Story = StoryObj<typeof Badge>

export const OnTheHero: Story = {
    render: () => (
        <Room>
            <div className="au-hero" style={{ padding: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Badge>Confirmed</Badge>
                <Badge kind="inFlight">In progress</Badge>
            </div>
        </Room>
    ),
}

export const OnACard: Story = {
    render: () => (
        <Room>
            <div className="au-card" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Badge kind="done">Done</Badge>
                <Badge kind="needsYou">Deposit due</Badge>
                <Badge kind="quiet">Cancelled</Badge>
            </div>
        </Room>
    ),
}
