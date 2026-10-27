import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { SwatchRadioGroup, type SwatchOption } from './SwatchRadioGroup'

/**
 * SwatchRadioGroup — the service form's "Calendar colour" (AUTM-1591, canvas
 * v50). The palette below is AUTM-1591's ten fixed keys and their text
 * colours, as Don approved them on 1 Oct: six take white text, four take
 * ink. Every pairing carries block text at 4.5:1 or better (Sky lowest,
 * 4.7:1); SwatchRadioGroup.test.tsx measures them.
 *
 * The keys themselves are a contracts enum (AUTM-1591's contracts half);
 * the consumer maps them to these options.
 */
const meta = {
    title: 'Molecules/SwatchRadioGroup',
    component: SwatchRadioGroup,
    parameters: { layout: 'padded' },
} satisfies Meta<typeof SwatchRadioGroup>

export default meta
type Story = StoryObj<typeof meta>

const WHITE = '#ffffff'
const INK = '#0e0a1a'

const SERVICE_COLOURS: SwatchOption[] = [
    { value: 'violet', label: 'Violet', color: '#5b2bd6', ink: WHITE },
    { value: 'sky', label: 'Sky', color: '#1f6fe5', ink: WHITE },
    { value: 'teal', label: 'Teal', color: '#0d7c72', ink: WHITE },
    { value: 'leaf', label: 'Leaf', color: '#2f7d32', ink: WHITE },
    { value: 'rose', label: 'Rose', color: '#c92a62', ink: WHITE },
    { value: 'slate', label: 'Slate', color: '#475569', ink: WHITE },
    { value: 'lime', label: 'Lime', color: '#d4ff4f', ink: INK },
    { value: 'aqua', label: 'Aqua', color: '#4ceaff', ink: INK },
    { value: 'sun', label: 'Sun', color: '#ffc83d', ink: INK },
    { value: 'coral', label: 'Coral', color: '#ff8a65', ink: INK },
]

function CalendarColour({ initial = 'violet', disabled = false }: { initial?: string; disabled?: boolean }) {
    const [value, setValue] = useState<string | null>(initial)
    const chosen = SERVICE_COLOURS.find((o) => o.value === value)
    return (
        <SwatchRadioGroup
            name="calendar-colour"
            label="Calendar colour"
            options={SERVICE_COLOURS}
            value={value}
            onChange={setValue}
            disabled={disabled}
            testId="service-form-colour"
            description={`${chosen ? `${chosen.label}. ` : ''}Jobs for this service show in this colour on your calendar. New services get the next unused colour.`}
        />
    )
}

/** As on MpServiceForm: ten in a row from `sm`. Flip the Theme toolbar for dark. */
export const ServiceForm: Story = {
    args: { name: '', options: [], value: null, onChange: () => {}, label: '' },
    render: () => <CalendarColour />,
}

/** As on MpServiceFormPhone: five in a row below `sm`. */
export const Phone: Story = {
    args: { name: '', options: [], value: null, onChange: () => {}, label: '' },
    parameters: { viewport: { defaultViewport: 'phone' } },
    render: () => (
        <div className="max-w-[390px]">
            <CalendarColour />
        </div>
    ),
}

/** An ink-text swatch chosen: the tick takes the ink. */
export const InkSwatchChosen: Story = {
    args: { name: '', options: [], value: null, onChange: () => {}, label: '' },
    render: () => <CalendarColour initial="sun" />,
}

/** Nothing chosen yet (a consumer that has not assigned a default). */
export const NoneChosen: Story = {
    args: { name: '', options: [], value: null, onChange: () => {}, label: '' },
    render: () => <CalendarColour initial="" />,
}

export const Disabled: Story = {
    args: { name: '', options: [], value: null, onChange: () => {}, label: '' },
    render: () => <CalendarColour disabled />,
}

/**
 * AUTM-1870: `size="lg"` (56px) where the colour is the main choice, and
 * `edge` on the swatches a white page would swallow: a car's paint, five to
 * a row at every width.
 */
function CarPaint() {
    const [value, setValue] = useState<string | null>('white')
    return (
        <SwatchRadioGroup
            name="car-paint"
            label="Colour (optional)"
            size="lg"
            columns={5}
            compactColumns={5}
            options={[
                { value: 'white', label: 'White', color: '#f7f7f5', ink: INK, edge: true },
                { value: 'silver', label: 'Silver', color: '#c9ccd1', ink: INK, edge: true },
                { value: 'grey', label: 'Grey', color: '#666b73', ink: WHITE },
                { value: 'black', label: 'Black', color: '#1c1d21', ink: WHITE },
                { value: 'blue', label: 'Blue', color: '#1f4fa8', ink: WHITE },
            ]}
            value={value}
            onChange={setValue}
            testId="car-paint"
        />
    )
}

export const LargeWithEdges: Story = {
    args: { name: '', options: [], value: null, onChange: () => {}, label: '' },
    render: () => <CarPaint />,
}
