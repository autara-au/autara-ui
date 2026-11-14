import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar } from './Avatar'
import { Room } from './_story'

/** AU/Avatar: initials in a 44pt disc; white on the hero. */
const meta: Meta<typeof Avatar> = { title: 'AU/Avatar', component: Avatar }
export default meta
type Story = StoryObj<typeof Avatar>

export const Default: Story = {
    render: () => (
        <Room>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Avatar name="Kerbside Car Care" />
                <Avatar name="Dinah Lance" size={68} />
                <Avatar name="McRaven Auto" size={64} />
            </div>
            <div className="au-hero" style={{ padding: 24 }}>
                <Avatar name="Kerbside Car Care" onPlate />
            </div>
        </Room>
    ),
}
