import type { Meta, StoryObj } from '@storybook/react-vite'
import { FactRows } from './FactRows'

/**
 * AUTM-1797 / AUTM-1799: place and car as icon rows, no labels over them. The
 * labels are still there, for a screen reader, as each row's `dt`.
 */
const meta: Meta<typeof FactRows> = {
    title: 'App shell/FactRows',
    component: FactRows,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <div style={{ maxWidth: 390 }}>{Story()}</div>],
}
export default meta
type Story = StoryObj<typeof FactRows>

const Pin = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
        <circle cx="12" cy="9.5" r="2.5" />
    </svg>
)
const Car = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path d="M4 15.5V12l2-5h12l2 5v3.5M4 15.5h16M4 15.5V18h3v-2.5M20 15.5V18h-3v-2.5" />
    </svg>
)

export const Default: Story = {
    args: {
        rows: [
            { key: 'where', icon: <Pin />, label: 'Where', value: '41 Smith Street, Fitzroy, VIC, 3065' },
            { key: 'car', icon: <Car />, label: 'Vehicle', value: '2021 Toyota LandCruiser, white, BXY41K' },
        ],
    },
}

/** A row with its one short line: why the street is not shown yet. */
export const WithNote: Story = {
    args: {
        rows: [
            { key: 'where', icon: <Pin />, label: 'Where', value: 'Their workshop', note: 'Street address once your deposit is charged' },
            { key: 'car', icon: <Car />, label: 'Vehicle', value: 'Toyota Corolla, sedan' },
        ],
    },
}

/** A long address wraps at a word under its icon. */
export const LongValue: Story = {
    args: {
        rows: [
            {
                key: 'where',
                icon: <Pin />,
                label: 'Where (your address)',
                value: 'Unit 14, 1287 Mount Alexander Road, Essendon West, VIC, 3040',
            },
        ],
    },
}
