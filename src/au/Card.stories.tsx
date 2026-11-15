import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card, Rows } from './Card'
import { Room } from './_story'

/** AU/Card: the native `.card()`. White on the Stone room; the grey is the room, never the tiles. */
const meta: Meta<typeof Card> = { title: 'AU/Card', component: Card }
export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
    render: () => (
        <Room>
            <Card>After the job, Visa 4242</Card>
            <Card padding={20}>Padding 20</Card>
            <Card asChild><a href="#card">A card that is a link</a></Card>
            <Card padding={16}><Rows><div style={{ padding: '12px 0' }}>Row one</div><div style={{ padding: '12px 0' }}>Row two</div></Rows></Card>
        </Room>
    ),
}
