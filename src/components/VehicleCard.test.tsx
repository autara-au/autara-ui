import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { VehicleAddCard, VehicleCard, vehicleCardFacts } from './VehicleCard'

/** AUTM-1870: a saved car as itself, in the garage and as a checkout choice. */
describe('VehicleCard', () => {
    it('draws the car as its make mark and a dot of its paint, the plate as a plate, Default, and the facts in words', () => {
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
        expect(card.textContent).toContain('Ute / Pickup \u00b7 2021 \u00b7 White')
        // No car illustration (Don, 2026-10-15): the mark in the image slot, the paint as a dot.
        expect(card.querySelector('[data-slot="image"] svg[data-mark="logo"]')).toBeTruthy()
        expect(card.querySelector('[data-slot="paint"]')?.getAttribute('data-paint')).toBe('white')
        expect(card.querySelector('[data-slot="paint"]')?.getAttribute('aria-hidden')).toBe('true')
        expect(card.querySelector('svg[data-body]')).toBeNull()
        expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy()
    })

    it('a photo fills the image slot when there is one (AUTM-1882), the paint dot kept', () => {
        render(<VehicleCard make="Toyota" model="HiLux" color="Red" photoUrl="https://example.test/hilux.jpg" testId="card" />)
        const slot = screen.getByTestId('card').querySelector('[data-slot="image"]')!
        expect(slot.querySelector('img')?.getAttribute('src')).toBe('https://example.test/hilux.jpg')
        expect(slot.querySelector('img')?.getAttribute('alt')).toBe('')
        expect(slot.querySelector('[data-slot="mark"]')).toBeNull()
        expect(slot.querySelector('[data-slot="paint"]')?.getAttribute('data-paint')).toBe('red')
    })

    it('a colour it cannot paint is still said, with no dot; a make without a logo has its monogram', () => {
        expect(vehicleCardFacts({ body: 'CAR', year: null, color: 'Purple' })).toBe('Purple')
        render(<VehicleCard make="Lada" model="Niva" body="CAR" color="Purple" testId="card" />)
        const card = screen.getByTestId('card')
        expect(card.querySelector('[data-slot="paint"]')).toBeNull()
        expect(card.querySelector('svg[data-mark="monogram"]')?.textContent).toBe('L')
        expect(card.textContent).toContain('Purple')
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
