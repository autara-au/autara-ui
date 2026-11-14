import type { Meta, StoryObj } from '@storybook/react-vite'
import { ServiceCard, ProCard } from './ServiceCard'
import { Room } from './_story'

/** AU/ServiceCard and ProCard: a service or a pro as a photo card, two to a row or in a rail. */
const meta: Meta<typeof ServiceCard> = { title: 'AU/ServiceCard', component: ServiceCard }
export default meta
type Story = StoryObj<typeof ServiceCard>

export const Services: Story = {
    render: () => (
        <Room>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <ServiceCard asChild name="Headlight Restoration & Polish" length="30 min" price="$67.15"><a href="#a" /></ServiceCard>
                <ServiceCard asChild name="Protection & Restoration" length="12 hr" price="$1,950.00"><a href="#b" /></ServiceCard>
                <ServiceCard asChild name="A service with no photo and a long name" length="1 hr" price="$80.00"><a href="#c" /></ServiceCard>
            </div>
        </Room>
    ),
}

export const Pros: Story = {
    render: () => (
        <Room>
            <div className="au-rail">
                <ProCard asChild name="Kerbside Car Care" line="Surry Hills · 4.8" style={{ width: 212 }}><a href="#k" /></ProCard>
                <ProCard asChild name="Cinderbank Car Care" line="Brunswick · 5.0" style={{ width: 212 }}><a href="#c" /></ProCard>
            </div>
        </Room>
    ),
}
