import type { Meta, StoryObj } from '@storybook/react-vite'
import { Chip } from './Chip'
import { StarIcon, VehicleIcon, WorkshopIcon } from '../icons'
import { Room } from './_story'

/** AU/Chip: a choice in a row; the selected one is the tile. `fact` states something instead. */
const meta: Meta<typeof Chip> = { title: 'AU/Chip', component: Chip }
export default meta
type Story = StoryObj<typeof Chip>

export const Choices: Story = {
    render: () => (
        <Room>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Chip on>Exterior</Chip>
                <Chip>Interior</Chip>
                <Chip>Protection</Chip>
                <Chip asChild><a href="#chip">A link</a></Chip>
            </div>
        </Room>
    ),
}

export const Facts: Story = {
    render: () => (
        <Room>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Chip fact icon={<StarIcon size={16} active />}>4.8 (26)</Chip>
                <Chip fact icon={<VehicleIcon size={16} />}>Comes to you</Chip>
                <Chip fact icon={<WorkshopIcon size={16} />}>Workshop</Chip>
            </div>
        </Room>
    ),
}
