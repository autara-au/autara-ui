import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Textarea } from '../components/Textarea'
import { SearchInput } from '../components/SearchInput'
import { Card } from './Card'
import { Chip } from './Chip'
import { Room } from './_story'

/**
 * AU/Customer room (AUTM-2202): the library's own fields and buttons while a
 * `.au-room` is on the page. Solid capsules, no outline at rest; focus is a
 * purple edge, an error the danger edge. White on the room, the room's tone
 * on a card. Selected is the brand purple (AppTheme.brand).
 */
const meta: Meta = { title: 'AU/Customer room' }
export default meta
type Story = StoryObj

const label = { display: 'grid', gap: 8, fontWeight: 700, fontSize: 15 } as const

export const OnTheRoom: Story = {
    render: () => (
        <Room>
            <SearchInput placeholder="Pro or service" aria-label="Search" />
            <label style={label}>
                Email
                <Input type="email" placeholder="you@example.com" />
            </label>
            <label style={label}>
                Email
                <Input type="email" defaultValue="dinah@" aria-invalid="true" />
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Chip on>Comes to you</Chip>
                <Chip>Shops</Chip>
            </div>
            <Button variant="primary" size="lg">Continue</Button>
            <Button variant="quiet" size="lg">Use your mobile</Button>
            <Button variant="danger">Cancel booking</Button>
        </Room>
    ),
}

export const OnACard: Story = {
    render: () => (
        <Room>
            <Card>
                <div style={{ display: 'grid', gap: 16 }}>
                    <label style={label}>
                        Note for the pro
                        <Textarea placeholder="Gate code, where to park" />
                    </label>
                    <Input placeholder="Search make or model, like Hilux" aria-label="Car" />
                    <Button variant="quiet">Change time</Button>
                </div>
            </Card>
        </Room>
    ),
}
