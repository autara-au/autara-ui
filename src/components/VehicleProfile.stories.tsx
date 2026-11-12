import type { Meta, StoryObj } from '@storybook/react-vite'
import { VehicleProfile } from './VehicleProfile'

/**
 * VehicleProfile (AUTM-1878 follow-up): a car as a pro sees it, for the
 * merchant portal's vehicle sheet. The car (VehicleCard: the make's mark, the
 * paint dot, the plate), whose it is, this pro's jobs on it (each a row the
 * consumer opens) and what the customer said about it. A car typed in on the
 * booking has no history, and says so.
 */
const meta: Meta<typeof VehicleProfile> = {
    title: 'Molecules/VehicleProfile',
    component: VehicleProfile,
    parameters: { layout: 'padded' },
    decorators: [
        (Story) => (
            <div style={{ maxWidth: 420 }}>
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof VehicleProfile>

const vehicle = { make: 'Toyota', model: 'Corolla', body: 'SEDAN', color: 'White', year: 2021, registrationPlate: 'ABC123' }

export const WithHistory: Story = {
    args: {
        vehicle,
        customer: { name: 'Roy Lim' },
        jobs: [
            { id: 'bk-1', when: 'Sat 17 Oct', title: 'Interior refresh', amount: '$80.00', current: true, onOpen: () => undefined },
            { id: 'bk-0', when: 'Sat 2 Aug', title: 'Full interior and exterior clean', amount: '$189.00', onOpen: () => undefined },
            { id: 'bk-z', when: 'Tue 3 Jun', title: 'Express wash', amount: '$45.00', note: 'Cancelled', onOpen: () => undefined },
        ],
        notesTitle: 'Notes from Roy',
        notes: [
            { id: 'n-1', text: 'Dog hair in the back seat, fair warning.', when: 'Sat 2 Aug' },
            { id: 'n-2', text: 'Keys in the letterbox if I am not home.', when: 'Tue 3 Jun' },
        ],
        testId: 'vehicle-profile',
    },
}

export const FirstJob: Story = {
    name: 'First job on this car',
    args: {
        vehicle: { make: 'Mazda', model: 'CX-5', body: 'SUV', color: 'Red', year: 2019, registrationPlate: 'XYZ789' },
        customer: { name: 'Priya Nair' },
        jobs: [{ id: 'bk-1', when: 'Fri 16 Oct', title: 'Express wash and vacuum', amount: '$79.00', current: true }],
    },
}

export const TypedIn: Story = {
    name: 'Car typed in on the booking (no history)',
    args: {
        vehicle: { make: 'Holden', model: 'Commodore', color: 'Silver', registrationPlate: 'HLD001' },
        customer: { name: 'Sam Gray' },
        jobs: null,
    },
}
