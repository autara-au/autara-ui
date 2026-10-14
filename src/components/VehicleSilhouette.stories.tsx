import type { Meta, StoryObj } from '@storybook/react-vite'
import { VEHICLE_BODIES, VEHICLE_PAINTS } from '../lib/vehicle-catalog'
import { VehicleSilhouette } from './VehicleSilhouette'

/**
 * VehicleSilhouette (AUTM-1870): one side view per body type, in the car's
 * paint. Flip the Theme toolbar: the outline follows the text token, so a
 * white car on paper and a black car on the dark page both keep an edge.
 */
const meta = {
    title: 'Molecules/VehicleSilhouette',
    component: VehicleSilhouette,
    parameters: { layout: 'padded' },
    args: { body: 'UTE', color: 'White' },
    argTypes: {
        body: { control: 'select', options: VEHICLE_BODIES.map((b) => b.value) },
        color: { control: 'select', options: ['', ...VEHICLE_PAINTS.map((p) => p.label)] },
    },
} satisfies Meta<typeof VehicleSilhouette>

export default meta
type Story = StoryObj<typeof meta>

/** One body, the controls choose the shape and the paint. */
export const Default: Story = {
    render: (args) => (
        <div className="max-w-sm rounded-[var(--radius-autara-md)] bg-[var(--paper)] p-4">
            <VehicleSilhouette {...args} />
        </div>
    ),
}

/** Every body on one ground, so two shapes compare. No paint draws the neutral body. */
export const EveryBody: Story = {
    render: () => (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {VEHICLE_BODIES.map((b) => (
                <figure key={b.value} className="m-0 flex flex-col gap-1 rounded-[var(--radius-autara-md)] bg-[var(--band)] p-3">
                    <VehicleSilhouette body={b.value} />
                    <figcaption className="text-[0.8125rem] text-[var(--text-muted)]">{b.label}</figcaption>
                </figure>
            ))}
        </div>
    ),
}

/** Every paint the picker offers, on a hatch. */
export const EveryPaint: Story = {
    render: () => (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {VEHICLE_PAINTS.map((p) => (
                <figure key={p.value} className="m-0 flex flex-col gap-1 rounded-[var(--radius-autara-md)] bg-[var(--paper)] p-3">
                    <VehicleSilhouette body="HATCHBACK" color={p.label} />
                    <figcaption className="text-[0.8125rem] text-[var(--text-muted)]">{p.label}</figcaption>
                </figure>
            ))}
        </div>
    ),
}

/** Named, where the drawing stands alone: an image with that name. */
export const Named: Story = {
    args: { body: 'SUV', color: 'Blue', title: 'Blue SUV' },
}
