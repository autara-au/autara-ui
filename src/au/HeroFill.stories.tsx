import type { Meta, StoryObj } from '@storybook/react-vite'
import { HeroFill, Plate } from './HeroFill'
import { Button } from './Button'
import { Room } from './_story'

/** AU/HeroFill: the hero, one per screen. Flat ink for the customer app; the deep purple plate for the merchant app. */
const meta: Meta<typeof HeroFill> = { title: 'AU/HeroFill', component: HeroFill }
export default meta
type Story = StoryObj<typeof HeroFill>

export const BookCarCare: Story = {
    name: 'Home, nothing booked',
    render: () => (
        <Room>
            <HeroFill style={{ padding: 24, display: 'grid', gap: 16, justifyItems: 'start' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Book car care</span>
                <Button height={52}>Find a pro</Button>
            </HeroFill>
        </Room>
    ),
}

export const Merchant: Story = {
    name: 'Merchant theme',
    render: () => (
        <Room>
            <div data-au-theme="merchant">
                <HeroFill style={{ padding: 24 }}>The merchant app's hero</HeroFill>
            </div>
            <Plate style={{ padding: 24 }}>Plate, without the app's texture</Plate>
        </Room>
    ),
}
