import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { ChatIcon } from '../icons'
import { Room } from './_story'

/** AU/Button: AUButtonStyle. Lime is the one primary; quiet on a card; onPlate and onHero on the hero. */
const meta: Meta<typeof Button> = { title: 'AU/Button', component: Button }
export default meta
type Story = StoryObj<typeof Button>

export const Kinds: Story = {
    render: () => (
        <Room>
            <Button>Find a pro</Button>
            <Button height={44}>Book</Button>
            <Button wide height={54}><ChatIcon size={22} />Message Kerbside</Button>
            <div className="au-card" style={{ display: 'flex', gap: 8 }}><Button kind="quiet">Try again</Button></div>
            <div className="au-hero" style={{ padding: 24, display: 'grid', gap: 12 }}>
                <Button kind="onPlate" wide height={54}>Add to calendar</Button>
                <Button kind="onHero" wide height={54}>Done</Button>
            </div>
            <Button kind="card">A white capsule on the room</Button>
            <Button aria-disabled="true">Disabled keeps its colour</Button>
        </Room>
    ),
}
