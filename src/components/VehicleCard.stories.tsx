import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { VehicleAddCard, VehicleCard } from './VehicleCard'

/**
 * VehicleCard (AUTM-1870): the garage draws each car as itself, its plate as
 * a plate, Default in lime; Add a car is a tile of the same size. At
 * checkout the same cards are a radio group.
 */
const meta = {
    title: 'Molecules/VehicleCard',
    component: VehicleCard,
    parameters: { layout: 'padded' },
    args: { make: 'Toyota', model: 'HiLux', body: 'UTE', color: 'White', year: 2021, registrationPlate: 'ABC123', isDefault: true },
} satisfies Meta<typeof VehicleCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    render: (args) => (
        <div className="max-w-xs">
            <VehicleCard {...args} />
        </div>
    ),
}

const CARS = [
    { id: 'a', make: 'Toyota', model: 'HiLux', body: 'UTE', color: 'White', year: 2021, registrationPlate: 'ABC123', isDefault: true },
    { id: 'b', make: 'Mazda', model: 'CX-5', body: 'SUV', color: 'Red', year: 2019, registrationPlate: '1XY2ZZ', isDefault: false },
    { id: 'c', make: 'Volkswagen', model: 'Golf', body: 'HATCHBACK', color: 'Grey', year: null, registrationPlate: null, isDefault: false },
]

/** /account/vehicles: the cars, then Add a car as a tile. Actions are the consumer's. */
export const Garage: Story = {
    render: () => (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] gap-3 p-0">
            {CARS.map((c) => (
                <li key={c.id} className="flex">
                    <VehicleCard
                        {...c}
                        className="w-full"
                        actions={
                            <div className="flex flex-wrap gap-1 pt-1">
                                {c.isDefault ? null : (
                                    <Button variant="quiet" size="sm">
                                        Make default
                                    </Button>
                                )}
                                <Button variant="quiet" size="sm">
                                    Edit
                                </Button>
                            </div>
                        }
                    />
                </li>
            ))}
            <li className="flex">
                <VehicleAddCard className="w-full" description="A second car, a ute, the family van." onClick={() => {}} />
            </li>
        </ul>
    ),
}

function Choice() {
    const [value, setValue] = useState('a')
    return (
        <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="pb-2 text-[0.9375rem] font-medium text-[var(--text-strong)]">Your cars</legend>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,14rem),1fr))] gap-3">
                {CARS.map((c) => (
                    <VehicleCard key={c.id} {...c} selectable={{ name: 'car', value: c.id, checked: value === c.id, onChange: setValue }} />
                ))}
                <VehicleAddCard
                    label="Add a different car"
                    description="Saved for next time."
                    selectable={{ name: 'car', value: 'new', checked: value === 'new', onChange: setValue }}
                />
            </div>
        </fieldset>
    )
}

/** Checkout's vehicle step: one radio group, arrow keys move, the chosen card fills. */
export const CheckoutChoice: Story = { render: () => <Choice /> }

/** A long name and a colour the palette does not have: the name wraps, the colour is said. */
export const EdgeCases: Story = {
    args: {
        make: 'Mercedes-Benz',
        model: 'Range Rover Velar Autobiography Long Wheelbase',
        body: 'CAR',
        color: 'Purple',
        year: 1998,
        registrationPlate: 'LONGPLATE1',
        isDefault: false,
    },
    render: (args) => (
        <div className="max-w-[14rem]">
            <VehicleCard {...args} />
        </div>
    ),
}
