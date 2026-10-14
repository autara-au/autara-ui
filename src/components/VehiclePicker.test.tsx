import { describe, expect, it } from 'vitest'
import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import {
    EMPTY_VEHICLE_PICKER_VALUE,
    VehiclePicker,
    validateVehiclePicker,
    vehiclePickerStepFor,
    type VehiclePickerErrors,
    type VehiclePickerValue,
} from './VehiclePicker'

/**
 * AUTM-1870. The picker is controlled; this harness holds the value the way a
 * consumer does and counts the customer's taps, so the "a common car in at
 * most three taps" acceptance is a test, not a claim.
 */
function Harness({
    initial = EMPTY_VEHICLE_PICKER_VALUE,
    errors,
    onValue,
}: {
    initial?: VehiclePickerValue
    errors?: VehiclePickerErrors
    onValue?: (v: VehiclePickerValue) => void
}) {
    const [value, setValue] = useState(initial)
    return (
        <VehiclePicker
            value={value}
            errors={errors}
            testIdPrefix="vp"
            onChange={(v) => {
                setValue(v)
                onValue?.(v)
            }}
        />
    )
}

function last(calls: VehiclePickerValue[]): VehiclePickerValue {
    return calls[calls.length - 1]!
}

describe('VehiclePicker', () => {
    it('Toyota HiLux, white: search, the result, the swatch; the consumer\'s button is the third tap', () => {
        const values: VehiclePickerValue[] = []
        render(<Harness onValue={(v) => values.push(v)} />)
        expect(screen.getByTestId('vp-picker').dataset.step).toBe('make')

        fireEvent.change(screen.getByTestId('vp-search'), { target: { value: 'Hilux' } })
        fireEvent.click(screen.getByTestId('vp-result-toyota-hilux')) // tap 1
        expect(last(values)).toMatchObject({ make: 'Toyota', model: 'HiLux', body: 'UTE' })
        expect(screen.getByTestId('vp-picker').dataset.step).toBe('details')
        // The type is inferred and shown, with Change; no type chips to tap.
        expect(screen.getByTestId('vp-type-current').textContent).toBe('Ute / Pickup')
        expect(screen.queryByTestId('vp-type-UTE')).toBeNull()

        fireEvent.click(screen.getByRole('radio', { name: 'White' })) // tap 2
        expect(last(values).color).toBe('White')
        expect(screen.getByTestId('vp-silhouette').getAttribute('data-paint')).toBe('white')
        expect(screen.getByTestId('vp-silhouette').getAttribute('data-body')).toBe('UTE')
        expect(validateVehiclePicker(last(values))).toEqual({})
    })

    it('Enter takes the best match', () => {
        const values: VehiclePickerValue[] = []
        render(<Harness onValue={(v) => values.push(v)} />)
        const search = screen.getByTestId('vp-search')
        fireEvent.change(search, { target: { value: 'ranger' } })
        fireEvent.keyDown(search, { key: 'Enter' })
        expect(last(values)).toMatchObject({ make: 'Ford', model: 'Ranger', body: 'UTE' })
    })

    it('a make tile, then that make\'s models as chips', () => {
        const values: VehiclePickerValue[] = []
        render(<Harness onValue={(v) => values.push(v)} />)
        fireEvent.click(screen.getByTestId('vp-make-option-mazda'))
        expect(screen.getByTestId('vp-picker').dataset.step).toBe('model')
        expect(screen.getByRole('heading', { name: 'Mazda' })).toBeTruthy()
        fireEvent.click(screen.getByTestId('vp-model-option-cx-5'))
        expect(last(values)).toMatchObject({ make: 'Mazda', model: 'CX-5', body: 'SUV' })
        // Back from the details goes to Find, with the search empty.
        fireEvent.click(screen.getByTestId('vp-change'))
        expect(screen.getByTestId('vp-picker').dataset.step).toBe('make')
        expect((screen.getByTestId('vp-search') as HTMLInputElement).value).toBe('')
    })

    it('More makes shows the rest; Not listed types the car in, with the type chips open', () => {
        const values: VehiclePickerValue[] = []
        render(<Harness onValue={(v) => values.push(v)} />)
        expect(screen.queryByTestId('vp-make-option-volvo')).toBeNull()
        fireEvent.click(screen.getByTestId('vp-make-more'))
        expect(screen.getByTestId('vp-make-option-volvo')).toBeTruthy()

        fireEvent.change(screen.getByTestId('vp-search'), { target: { value: 'Lada' } })
        expect(screen.getByTestId('vp-no-results')).toBeTruthy()
        fireEvent.click(screen.getByTestId('vp-result-custom'))
        expect((screen.getByTestId('vp-make') as HTMLInputElement).value).toBe('Lada')
        fireEvent.change(screen.getByTestId('vp-model'), { target: { value: 'Niva' } })
        // AUTM-1539: each type radio is named by its visible label, never the enum.
        fireEvent.click(screen.getByRole('radio', { name: 'Station wagon' }))
        expect(last(values)).toMatchObject({ make: 'Lada', model: 'Niva', body: 'WAGON' })
        for (const name of ['Sedan', 'SUV / Crossover', 'Ute / Pickup', 'Van / People mover']) {
            expect(screen.getByRole('radio', { name })).toBeTruthy()
        }
    })

    it('a model the make does not list is typed under that make', () => {
        const values: VehiclePickerValue[] = []
        render(<Harness onValue={(v) => values.push(v)} />)
        fireEvent.click(screen.getByTestId('vp-make-option-toyota'))
        fireEvent.click(screen.getByTestId('vp-model-custom'))
        expect(screen.queryByTestId('vp-make')).toBeNull()
        fireEvent.change(screen.getByTestId('vp-model'), { target: { value: 'Starlet' } })
        expect(last(values)).toMatchObject({ make: 'Toyota', model: 'Starlet', body: '' })
        expect(screen.getByTestId('vp-type')).toBeTruthy()
    })

    it('opens a saved car on its details, typed when the catalog does not know it', () => {
        expect(vehiclePickerStepFor({ ...EMPTY_VEHICLE_PICKER_VALUE, make: 'Toyota', model: 'Corolla' })).toBe('details')
        expect(vehiclePickerStepFor({ ...EMPTY_VEHICLE_PICKER_VALUE, make: 'Toyota' })).toBe('model')
        expect(vehiclePickerStepFor({ ...EMPTY_VEHICLE_PICKER_VALUE, make: 'Lada' })).toBe('details')
        render(
            <Harness
                initial={{ ...EMPTY_VEHICLE_PICKER_VALUE, make: 'Lada', model: 'Niva', body: 'SUV', color: 'Green' }}
            />
        )
        expect((screen.getByTestId('vp-make') as HTMLInputElement).value).toBe('Lada')
        expect((screen.getByRole('radio', { name: 'Green' }) as HTMLInputElement).checked).toBe(true)
    })

    it('rego is upper-cased and year keeps digits only', () => {
        const values: VehiclePickerValue[] = []
        render(
            <Harness
                initial={{ ...EMPTY_VEHICLE_PICKER_VALUE, make: 'Toyota', model: 'Corolla', body: 'HATCHBACK' }}
                onValue={(v) => values.push(v)}
            />
        )
        fireEvent.change(screen.getByTestId('vp-rego'), { target: { value: 'abc123' } })
        expect(last(values).registrationPlate).toBe('ABC123')
        fireEvent.change(screen.getByTestId('vp-year'), { target: { value: '20a21' } })
        expect(last(values).year).toBe('2021')
    })

    it('every message is announced where it can be fixed (AUTM-1538)', () => {
        const empty = validateVehiclePicker(EMPTY_VEHICLE_PICKER_VALUE)
        expect(empty).toEqual({ make: 'Enter the make.', model: 'Enter the model.', body: "Pick the type that's closest." })
        const { unmount } = render(<Harness errors={empty} />)
        expect(screen.getByRole('alert').textContent).toBe('Search for your car, or pick its make.')
        expect(screen.getByTestId('vp-search').getAttribute('aria-invalid')).toBe('true')
        unmount()

        render(
            <Harness
                initial={{ ...EMPTY_VEHICLE_PICKER_VALUE, make: 'Lada', model: 'Niva' }}
                errors={{ body: "Pick the type that's closest.", year: 'Enter a year between 1950 and 2027.' }}
            />
        )
        const alerts = screen.getAllByRole('alert').map((a) => a.textContent)
        expect(alerts).toContain("Pick the type that's closest.")
        expect(within(screen.getByTestId('vp-type')).getByRole('alert')).toBeTruthy()
    })

    it('validates the year against next year', () => {
        const now = new Date('2026-10-14T00:00:00Z')
        const car = { ...EMPTY_VEHICLE_PICKER_VALUE, make: 'Toyota', model: 'Corolla', body: 'HATCHBACK' as const }
        expect(validateVehiclePicker({ ...car, year: '2027' }, now)).toEqual({})
        expect(validateVehiclePicker({ ...car, year: '2028' }, now).year).toBe('Enter a year between 1950 and 2027.')
        expect(validateVehiclePicker({ ...car, year: '1949' }, now).year).toBeTruthy()
    })
})
