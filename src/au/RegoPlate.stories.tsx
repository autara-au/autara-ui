import type { Meta, StoryObj } from '@storybook/react-vite'
import { RegoPlate } from './RegoPlate'
import { Room } from './_story'

/** AU/RegoPlate: a car's rego as a small number plate, wherever a vehicle appears. */
const meta: Meta<typeof RegoPlate> = { title: 'AU/RegoPlate', component: RegoPlate }
export default meta
type Story = StoryObj<typeof RegoPlate>

export const Default: Story = {
    render: () => (
        <Room>
            <div className="au-card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <strong>BMW X5</strong>
                <RegoPlate text="EKO 42Q" />
            </div>
            <div className="au-hero" style={{ padding: 24 }}>
                <RegoPlate text="E2EQA1" />
            </div>
        </Room>
    ),
}
