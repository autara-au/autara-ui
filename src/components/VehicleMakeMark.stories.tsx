import type { Meta, StoryObj } from '@storybook/react-vite'
import { VehicleIcon } from '../icons'
import { AU_VEHICLE_CATALOG } from '../lib/vehicle-catalog'
import { VehicleMakeMark, hasVehicleMakeLogo } from './VehicleMakeMark'

/**
 * VehicleMakeMark (AUTM-1870): every catalog make's mark, Simple Icons where
 * it carries the make, a monogram in the same weight where it does not. Flip
 * the Theme toolbar: the marks take the text token.
 */
const meta = {
    title: 'Molecules/VehicleMakeMark',
    component: VehicleMakeMark,
    parameters: { layout: 'padded' },
    args: { make: 'Toyota' },
} satisfies Meta<typeof VehicleMakeMark>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    render: (args) => (
        <span className="text-[2rem] text-[var(--text-strong)]">
            <VehicleMakeMark {...args} />
        </span>
    ),
}

/** The whole catalog, as the picker's tiles draw it. */
export const EveryMake: Story = {
    render: () => (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
            {AU_VEHICLE_CATALOG.map((m) => (
                <div
                    key={m.name}
                    className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-[var(--radius-autara-md)] bg-[var(--band)] p-2 text-[0.9375rem] font-medium text-[var(--text-strong)]"
                >
                    <VehicleMakeMark make={m.name} className="size-7" />
                    {m.name}
                </div>
            ))}
        </div>
    ),
}

/**
 * AUTM-2147, in context: the merchant's job ticket ("The car" panel, on the
 * deep hero surface). It shows the mark only when Simple Icons has one, and
 * keeps its car icon otherwise (no monogram there): Mercedes-Benz has no
 * mark, "Lada" is a make the customer typed. Makes are written as bookings
 * store them, so "VW" and "toyota" find their marks. The make stays in words.
 */
export const MarkOrCarIcon: Story = {
    render: () => (
        <div className="flex flex-wrap gap-3">
            {['toyota', 'VW', 'Ferrari', 'Rolls-Royce', 'Mercedes-Benz', 'Lada'].map((make) => (
                <div
                    key={make}
                    className="flex w-36 flex-col items-start gap-1.5 rounded-[var(--radius-autara-lg)] bg-[var(--hero)] p-4 text-[var(--on-deep)]"
                >
                    {hasVehicleMakeLogo(make) ? (
                        <VehicleMakeMark make={make} className="size-11" />
                    ) : (
                        <VehicleIcon size={44} aria-hidden />
                    )}
                    <span className="text-[0.9375rem] font-bold">{make}</span>
                </div>
            ))}
        </div>
    ),
}
