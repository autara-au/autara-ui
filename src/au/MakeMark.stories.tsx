import type { Meta, StoryObj } from '@storybook/react-vite'
import { MakeMark } from './MakeMark'
import { Room } from './_story'

/** AU/MakeMark: the car as its maker's badge; a make without a mark shows its initials. */
const meta: Meta<typeof MakeMark> = { title: 'AU/MakeMark', component: MakeMark }
export default meta
type Story = StoryObj<typeof MakeMark>

export const Default: Story = {
    render: () => (
        <Room>
            <div style={{ display: 'flex', gap: 12 }}>
                <MakeMark make="Toyota" disc />
                <MakeMark make="BMW" disc />
                <MakeMark make="Proton" disc />
                <MakeMark make="Ford" />
            </div>
        </Room>
    ),
}
