import { useEffect, useState, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChoiceChips, type ChoiceChipOption } from './ChoiceChips'

/**
 * AUTM-1867: pick one of a few in one tap. The merchant's "Book a customer
 * in" opens on its most-booked services and the next free times as chips.
 */
const meta = {
    title: 'Molecules/ChoiceChips',
    component: ChoiceChips,
    parameters: { layout: 'padded' },
    args: { options: [], value: '', onChange: () => {}, label: 'Service' },
} satisfies Meta<typeof ChoiceChips>

export default meta
type Story = StoryObj<typeof meta>

const SERVICES: ChoiceChipOption[] = [
    { value: 'full', label: 'Full interior and exterior clean' },
    { value: 'express', label: 'Express wash' },
    { value: 'interior', label: 'Interior clean' },
    { value: 'paint', label: 'Paint correction' },
]

const TIMES: ChoiceChipOption[] = [
    { value: '09:00', label: '9:00 am' },
    { value: '09:30', label: '9:30 am' },
    { value: '11:00', label: '11:00 am' },
    { value: '13:30', label: '1:30 pm' },
    { value: '14:00', label: '2:00 pm', disabled: true, reason: 'another booking runs through this time' },
    { value: '15:30', label: '3:30 pm' },
]

function Live({ options, start = '', ...rest }: Omit<Parameters<typeof ChoiceChips>[0], 'value' | 'onChange'> & { start?: string }) {
    const [value, setValue] = useState(start)
    return (
        <div className="max-w-[44rem] space-y-3">
            <ChoiceChips {...rest} options={options} value={value} onChange={setValue} />
            <p className="text-[0.8125rem] text-[var(--text-muted)]">Chosen: {value || 'nothing yet'}</p>
        </div>
    )
}

/** Services, most booked first, with More opening the full list. */
export const Services: Story = {
    render: () => (
        <Live
            label="Service"
            options={SERVICES}
            start="full"
            action={{ label: 'More', onClick: () => {}, opensDialog: true }}
        />
    ),
}

/** Times for a day, one taken (struck through, its reason read out), and Pick another day. */
export const Times: Story = {
    render: () => (
        <div className="space-y-2">
            <p className="text-[0.8125rem] font-medium text-[var(--text-muted)]">Today, Tue 14 Oct</p>
            <Live
                label="Times today"
                options={TIMES}
                action={{ label: 'Pick another day', onClick: () => {}, opensDialog: true }}
            />
        </div>
    ),
}

/** One row that scrolls sideways, for a phone. */
export const Row: Story = {
    render: () => (
        <div className="max-w-[390px]">
            <Live label="Times today" layout="row" options={TIMES} action={{ label: 'Pick another day', onClick: () => {} }} />
        </div>
    ),
}

/** Nothing chosen and the form refused: the group says it is invalid. */
export const Invalid: Story = {
    render: () => <Live label="Service" options={SERVICES} invalid />,
}

function LargeText({ children }: { children: ReactNode }) {
    useEffect(() => {
        const root = document.documentElement
        const was = root.style.fontSize
        root.style.fontSize = '200%'
        return () => {
            root.style.fontSize = was
        }
    }, [])
    return <>{children}</>
}

/** 200% text: the chips grow and wrap, none cut off. */
export const LargeTextWraps: Story = {
    render: () => (
        <LargeText>
            <div className="max-w-[390px]">
                <Live label="Service" options={SERVICES} start="express" action={{ label: 'More', onClick: () => {} }} />
            </div>
        </LargeText>
    ),
}
