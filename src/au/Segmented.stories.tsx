import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Segmented } from './Segmented'
import { Card } from './Card'
import { Room } from './_story'

/** AU/Segmented (AUTM-2202): one choice of a few; the choice is the purple tile and slides. */
const meta: Meta = { title: 'AU/Segmented' }
export default meta
type Story = StoryObj

function ListOrMap() {
    const [v, setV] = React.useState<'list' | 'map'>('list')
    return (
        <Segmented
            label="Show"
            full={false}
            value={v}
            onChange={setV}
            options={[
                { value: 'list', label: 'List' },
                { value: 'map', label: 'Map' },
            ]}
        />
    )
}

function DayParts() {
    const [v, setV] = React.useState<'morning' | 'afternoon' | 'evening'>('morning')
    return (
        <Segmented
            label="Part of the day"
            value={v}
            onChange={setV}
            options={[
                { value: 'morning', label: 'Morning' },
                { value: 'afternoon', label: 'Afternoon' },
                { value: 'evening', label: 'Evening', disabled: true },
            ]}
        />
    )
}

export const OnTheRoom: Story = {
    render: () => (
        <Room>
            <ListOrMap />
            <DayParts />
        </Room>
    ),
}

export const OnACard: Story = {
    render: () => (
        <Room>
            <Card>
                <DayParts />
            </Card>
        </Room>
    ),
}
