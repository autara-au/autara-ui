import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SwatchRadioGroup, type SwatchOption } from './SwatchRadioGroup'

// AUTM-1591's ten keys and text colours, as approved (canvas v50).
const PALETTE: SwatchOption[] = [
    { value: 'violet', label: 'Violet', color: '#5b2bd6', ink: '#ffffff' },
    { value: 'sky', label: 'Sky', color: '#1f6fe5', ink: '#ffffff' },
    { value: 'teal', label: 'Teal', color: '#0d7c72', ink: '#ffffff' },
    { value: 'leaf', label: 'Leaf', color: '#2f7d32', ink: '#ffffff' },
    { value: 'rose', label: 'Rose', color: '#c92a62', ink: '#ffffff' },
    { value: 'slate', label: 'Slate', color: '#475569', ink: '#ffffff' },
    { value: 'lime', label: 'Lime', color: '#d4ff4f', ink: '#0e0a1a' },
    { value: 'aqua', label: 'Aqua', color: '#4ceaff', ink: '#0e0a1a' },
    { value: 'sun', label: 'Sun', color: '#ffc83d', ink: '#0e0a1a' },
    { value: 'coral', label: 'Coral', color: '#ff8a65', ink: '#0e0a1a' },
]

const lin = (c: number) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const lum = (h: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
const contrast = (a: string, b: string) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
}

function mount(value: string | null = 'violet', onChange = vi.fn()) {
    render(
        <SwatchRadioGroup
            name="calendar-colour"
            label="Calendar colour"
            options={PALETTE}
            value={value}
            onChange={onChange}
            description="Jobs for this service show in this colour."
            testId="colour"
        />
    )
    return onChange
}

describe('SwatchRadioGroup (AUTM-1591)', () => {
    it('is a radio group named by its legend, each colour named by its name', () => {
        mount()
        expect(screen.getByRole('group', { name: 'Calendar colour' })).toBeInTheDocument()
        expect(screen.getAllByRole('radio')).toHaveLength(10)
        expect(screen.getByRole('radio', { name: 'Violet' })).toBeChecked()
        expect(screen.getByRole('radio', { name: 'Sky' })).not.toBeChecked()
    })

    it('reports the colour picked', async () => {
        const onChange = mount()
        await userEvent.click(screen.getByRole('radio', { name: 'Sun' }))
        expect(onChange).toHaveBeenCalledWith('sun')
    })

    it('rings and ticks the chosen swatch only, the tick in its ink', () => {
        mount('sun')
        const chosen = screen.getByTestId('colour-sun')
        expect(chosen.getAttribute('style')).toContain('0 0 0 4px var(--text-strong)')
        expect(chosen.querySelector('svg')?.getAttribute('stroke')).toBe('#0e0a1a')
        expect(screen.getByTestId('colour-violet').querySelector('svg')).toBeNull()
    })

    it('describes the group with its line', () => {
        mount()
        expect(screen.getByRole('group', { name: 'Calendar colour' })).toHaveAccessibleDescription(
            'Jobs for this service show in this colour.'
        )
    })

    it('every AUTM-1591 colour carries its text at 4.5:1 or better', () => {
        for (const o of PALETTE) {
            expect(contrast(o.color, o.ink), `${o.label} ${o.color} / ${o.ink}`).toBeGreaterThanOrEqual(4.5)
        }
    })

    it('edges a swatch the page would swallow, chosen or not (AUTM-1870)', () => {
        const options = [
            { value: 'white', label: 'White', color: '#f7f7f5', ink: '#0e0a1a', edge: true },
            { value: 'red', label: 'Red', color: '#b3202a', ink: '#ffffff' },
        ]
        const { rerender } = render(
            <SwatchRadioGroup name="paint" label="Colour" options={options} value={null} onChange={() => {}} testId="p" />
        )
        expect(screen.getByTestId('p-white').style.boxShadow).toBe('inset 0 0 0 1px var(--border-strong)')
        expect(screen.getByTestId('p-red').style.boxShadow).toBe('')
        rerender(<SwatchRadioGroup name="paint" label="Colour" options={options} value="white" onChange={() => {}} testId="p" />)
        expect(screen.getByTestId('p-white').style.boxShadow).toContain('inset 0 0 0 1px var(--border-strong)')
        expect(screen.getByTestId('p-white').style.boxShadow).toContain('0 0 0 4px var(--text-strong)')
    })
})
