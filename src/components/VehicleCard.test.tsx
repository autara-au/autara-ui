import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { VehicleAddCard, VehicleCard, vehicleCardFacts } from './VehicleCard'

/** AUTM-1870: a saved car as itself, in the garage and as a checkout choice. */
describe('VehicleCard', () => {
    it('draws the car in its paint, the plate as a plate, Default, and the facts in words', () => {
        render(
            <VehicleCard
                make="Toyota"
                model="HiLux"
                body="UTE"
                color="White"
                year={2021}
                registrationPlate="ABC123"
                isDefault
                testId="card"
                actions={<button type="button">Edit</button>}
            />
        )
        const card = screen.getByTestId('card')
        expect(card.tagName).toBe('ARTICLE')
        expect(screen.getByRole('heading', { level: 2, name: 'Toyota HiLux' })).toBeTruthy()
        expect(card.textContent).toContain('Default')
        expect(card.querySelector('[data-slot="plate"]')?.textContent).toBe('Rego ABC123')
        expect(card.textContent).toContain('Ute / Pickup · 2021 · White')
        const drawing = card.querySelector('svg[data-body]')!
        expect(drawing.getAttribute('data-body')).toBe('UTE')
        expect(drawing.getAttribute('data-paint')).toBe('white')
        expect(drawing.getAttribute('aria-hidden')).toBe('true')
        expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy()
    })

    it('a colour it cannot paint is still said; an unknown type draws the generic car', () => {
        expect(vehicleCardFacts({ body: 'CAR', year: null, color: 'Purple' })).toBe('Purple')
        render(<VehicleCard make="Lada" model="Niva" body="CAR" color="Purple" testId="card" />)
        expect(screen.getByTestId('card').querySelector('svg')?.getAttribute('data-body')).toBe('OTHER')
    })

    it('as a choice, the cars of one name are a radio group', () => {
        const onChange = vi.fn()
        render(
            <div>
                <VehicleCard
                    make="Toyota"
                    model="HiLux"
                    body="UTE"
                    testId="a"
                    selectable={{ name: 'car', value: 'a', checked: true, onChange }}
                />
                <VehicleCard
                    make="Mazda"
                    model="CX-5"
                    body="SUV"
                    testId="b"
                    selectable={{ name: 'car', value: 'b', checked: false, onChange }}
                />
                <VehicleAddCard
                    label="Add a different car"
                    testId="new"
                    selectable={{ name: 'car', value: 'new', checked: false, onChange }}
                />
            </div>
        )
        const radios = screen.getAllByRole('radio') as HTMLInputElement[]
        expect(radios).toHaveLength(3)
        expect(radios[0]!.checked).toBe(true)
        expect(screen.getByTestId('a').getAttribute('data-selected')).toBe('true')
        expect(screen.getByRole('radio', { name: /Mazda CX-5/ })).toBeTruthy()
        fireEvent.click(radios[2]!)
        expect(onChange).toHaveBeenCalledWith('new')
    })

    it('Add a car is a button tile', () => {
        const onClick = vi.fn()
        render(<VehicleAddCard onClick={onClick} testId="add" description="A second car, a ute, the family van." />)
        fireEvent.click(screen.getByRole('button', { name: /Add a car/ }))
        expect(onClick).toHaveBeenCalledOnce()
    })
})
