import { describe, expect, it } from 'vitest'
import {
    AU_VEHICLE_CATALOG,
    VEHICLE_BODIES,
    VEHICLE_PAINTS,
    findVehicleMake,
    inferVehicleBody,
    isVehicleBody,
    otherVehicleMakes,
    popularVehicleMakes,
    searchVehicleCatalog,
    vehicleBodyLabel,
    vehiclePaint,
    vehicleSlug,
} from './vehicle-catalog'

/**
 * AUTM-1870: the catalog VehiclePicker searches. Its names are customer-api's
 * (`src/functions/vehicles/vehicleData.ts`), so a car picked here is a catalog
 * car to the server's is_custom_make / is_custom_model check as well.
 */
describe('AU vehicle catalog', () => {
    it('carries customer-api\'s makes, spelled as the server spells them', () => {
        // customer-api's list, less its "Other" (the picker's Not listed is that).
        // A make added there and not here is still saveable, typed: change both.
        expect(AU_VEHICLE_CATALOG.map((m) => m.name).sort()).toEqual(
            [
                'Alfa Romeo', 'Audi', 'BMW', 'BYD', 'Chery', 'Cupra', 'Ford', 'Genesis', 'GWM', 'Holden', 'Honda',
                'Hyundai', 'Isuzu', 'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Mazda', 'Mercedes-Benz', 'MG',
                'MINI', 'Mitsubishi', 'Nissan', 'Peugeot', 'Porsche', 'RAM', 'Renault', 'Skoda', 'Subaru', 'Suzuki',
                'Tesla', 'Toyota', 'Volkswagen', 'Volvo',
            ].sort()
        )
        expect(findVehicleMake('toyota')?.models.map((m) => m.name)).toContain('HiLux')
    })

    it('gives every model a body customer-api\'s VehicleType declares, once per make', () => {
        for (const make of AU_VEHICLE_CATALOG) {
            expect(make.models.length, make.name).toBeGreaterThan(0)
            const names = make.models.map((m) => m.name.toLowerCase())
            expect(new Set(names).size, make.name).toBe(names.length)
            for (const model of make.models) expect(isVehicleBody(model.body), `${make.name} ${model.name}`).toBe(true)
        }
        expect(VEHICLE_BODIES.map((b) => b.value)).toEqual([
            'SEDAN', 'HATCHBACK', 'SUV', 'WAGON', 'COUPE', 'CONVERTIBLE', 'UTE', 'VAN', 'TRUCK', 'OTHER',
        ])
    })

    it('shows twelve popular makes as tiles and the rest by name', () => {
        expect(popularVehicleMakes().map((m) => m.name)).toEqual([
            'Toyota', 'Ford', 'Mazda', 'Kia', 'Hyundai', 'Mitsubishi', 'MG', 'Tesla', 'BYD', 'Isuzu', 'Nissan', 'Subaru',
        ])
        const others = otherVehicleMakes().map((m) => m.name)
        expect(others[0]).toBe('Alfa Romeo')
        expect(others).toHaveLength(AU_VEHICLE_CATALOG.length - 12)
    })

    it('infers the body from the model: a HiLux is a ute', () => {
        expect(inferVehicleBody('Toyota', 'Hilux')).toBe('UTE')
        expect(inferVehicleBody('toyota', 'RAV4')).toBe('SUV')
        expect(inferVehicleBody('Mazda', 'MX-5')).toBe('CONVERTIBLE')
        expect(inferVehicleBody('Toyota', 'Starlet')).toBeNull()
        expect(inferVehicleBody('Lada', 'Niva')).toBeNull()
        expect(vehicleBodyLabel('UTE')).toBe('Ute / Pickup')
    })
})

describe('searchVehicleCatalog: one box for make or model', () => {
    const first = (q: string) => searchVehicleCatalog(q)[0]

    it('"Hilux" goes straight to Toyota HiLux', () => {
        expect(first('Hilux')).toEqual({ kind: 'model', make: 'Toyota', model: 'HiLux', body: 'UTE' })
        expect(first('hil')).toMatchObject({ make: 'Toyota', model: 'HiLux' })
    })

    it('reads spacing and punctuation the way people type them', () => {
        expect(first('land cruiser')).toMatchObject({ make: 'Toyota', model: 'LandCruiser' })
        expect(first('cx5')).toMatchObject({ make: 'Mazda', model: 'CX-5' })
        expect(first('model y')).toMatchObject({ make: 'Tesla', model: 'Model Y' })
        expect(first('dmax')).toMatchObject({ make: 'Isuzu', model: 'D-Max' })
    })

    it('narrows make plus model, and finds a make by what people call it', () => {
        expect(first('toyota hil')).toMatchObject({ make: 'Toyota', model: 'HiLux' })
        expect(first('ford ranger')).toMatchObject({ make: 'Ford', model: 'Ranger' })
        expect(searchVehicleCatalog('VW')).toContainEqual({ kind: 'make', make: 'Volkswagen' })
        expect(searchVehicleCatalog('merc')).toContainEqual({ kind: 'make', make: 'Mercedes-Benz' })
    })

    it('a make brings its models, after any model that matched outright', () => {
        const toy = searchVehicleCatalog('toy')
        expect(toy.filter((r) => r.kind === 'model').every((r) => r.make === 'Toyota')).toBe(true)
        expect(toy).toContainEqual({ kind: 'make', make: 'Toyota' })
    })

    it('caps the list, and has nothing for nothing', () => {
        expect(searchVehicleCatalog('a').filter((r) => r.kind === 'model').length).toBeLessThanOrEqual(8)
        expect(searchVehicleCatalog('   ')).toEqual([])
        expect(searchVehicleCatalog('zzzz')).toEqual([])
    })
})

describe('vehiclePaint', () => {
    it('names the paint a saved colour means', () => {
        expect(vehiclePaint('White')?.value).toBe('white')
        expect(vehiclePaint('pearl white')?.value).toBe('white')
        expect(vehiclePaint('Gray')?.value).toBe('grey')
        expect(vehiclePaint('Navy')?.value).toBe('blue')
        expect(vehiclePaint('Purple')).toBeNull()
        expect(vehiclePaint('')).toBeNull()
    })

    it('stores the label, and edges the two paints a white page swallows', () => {
        expect(VEHICLE_PAINTS.filter((p) => p.edge).map((p) => p.label)).toEqual(['White', 'Silver'])
        expect(new Set(VEHICLE_PAINTS.map((p) => p.value)).size).toBe(VEHICLE_PAINTS.length)
    })

    it('slugs a name for an id', () => {
        expect(vehicleSlug('Mercedes-Benz')).toBe('mercedes-benz')
        expect(vehicleSlug('HS PHEV')).toBe('hs-phev')
        expect(vehicleSlug('e:Ny1')).toBe('e-ny1')
    })
})
