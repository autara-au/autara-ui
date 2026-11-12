import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChoiceCard, ChoiceGroup } from './ChoiceCard'

/** AUTM-1195 — a real radio group, and a disabled card says why. */
describe('ChoiceCard', () => {
    it('is a radio group whose cards select through the radio', () => {
        const onChange = vi.fn()
        render(
            <ChoiceGroup name="t" value="a" onChange={onChange} legend="Type">
                <ChoiceCard value="a" label="A" testId="card-a" dataField="type" />
                <ChoiceCard value="b" label="B" testId="card-b" />
                <ChoiceCard value="c" label="C" disabled disabledLabel="Booked" testId="card-c" />
            </ChoiceGroup>,
        )
        const radios = screen.getAllByRole('radio') as HTMLInputElement[]
        expect(radios).toHaveLength(3)
        expect(radios[0].checked).toBe(true)
        expect(radios[0].getAttribute('data-field')).toBe('type')
        expect(screen.getByTestId('card-a').getAttribute('data-selected')).toBe('true')
        radios[1].click()
        expect(onChange).toHaveBeenCalledWith('b')
        expect(radios[2].disabled).toBe(true)
        expect(screen.getByTestId('card-c').textContent).toContain('Booked')
    })

    it('announces its error when it appears (AUTM-1538)', () => {
        render(
            <ChoiceGroup name="t" value={null} onChange={() => {}} legend="Type" error="Pick the type that's closest.">
                <ChoiceCard value="a" label="A" />
            </ChoiceGroup>,
        )
        expect(screen.getByRole('alert').textContent).toBe("Pick the type that's closest.")
        expect(screen.getByRole('group').getAttribute('aria-invalid')).toBe('true')
    })
})
