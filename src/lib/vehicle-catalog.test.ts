import { createHash } from 'node:crypto'
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
/**
 * The catalog's every make and model name, one line per make ("Toyota:86|Aurion|..."),
 * makes and models in plain sort order, hashed. customer-api's
 * `tests/unit/vehicleData.test.ts` hashes its list (less "Other")
 * the same way and pins the SAME value, so the two lists match name for name
 * (AUTM-2005). Adding a make or model: add it to both lists, then change this
 * value in both tests.
 */
const CATALOG_FINGERPRINT = '2cf7a971b0039aea'

function catalogFingerprint(catalog: { name: string; models: { name: string }[] }[]): string {
    const lines = catalog
        .map((make) => `${make.name}:${make.models.map((m) => m.name).sort().join('|')}`)
        .sort()
    return createHash('sha256').update(lines.join('\n')).digest('hex').slice(0, 16)
}

describe('AU vehicle catalog', () => {
    it('carries customer-api\'s makes, spelled as the server spells them', () => {
        // customer-api's list, less its "Other" (the picker's Not listed is that).
        // AUTM-2005: every make sold in Australia (the Green Vehicle Guide) and the supercar and luxury makes.
        expect(AU_VEHICLE_CATALOG.map((m) => m.name).sort()).toEqual(
            [
                'Abarth', 'Alfa Romeo', 'Alpina', 'Alpine', 'Aston Martin', 'Audi', 'BMW', 'BYD', 'Bentley', 'Bugatti',
                'Cadillac', 'Caterham', 'Chery', 'Chevrolet', 'Chrysler', 'Citroen', 'Cupra', 'Deepal', 'Denza',
                'Dodge', 'Farizon', 'Ferrari', 'Fiat', 'Ford', 'Foton', 'GAC', 'GWM', 'Geely', 'Genesis', 'HSV',
                'Holden', 'Honda', 'Hyundai', 'Ineos', 'Infiniti', 'Isuzu', 'Jaecoo', 'Jaguar', 'Jeep', 'Kia',
                'Koenigsegg', 'LDV', 'Lamborghini', 'Land Rover', 'Leapmotor', 'Lexus', 'Lotus', 'MG', 'MINI',
                'Mahindra', 'Maserati', 'Mazda', 'McLaren', 'Mercedes-Benz', 'Mitsubishi', 'Morgan', 'Nissan', 'Omoda',
                'Opel', 'Pagani', 'Peugeot', 'Polestar', 'Porsche', 'Proton', 'RAM', 'Renault', 'Rolls-Royce', 'Saab',
                'Skoda', 'Smart', 'SsangYong', 'Subaru', 'Suzuki', 'Tata', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo',
                'XPENG', 'Zeekr',
            ].sort()
        )
        expect(findVehicleMake('toyota')?.models.map((m) => m.name)).toContain('HiLux')
    })

    it('matches customer-api\'s list name for name (the shared fingerprint)', () => {
        expect(catalogFingerprint(AU_VEHICLE_CATALOG)).toBe(CATALOG_FINGERPRINT)
    })

    it('never renames a make a saved car already carries (AUTM-1870\'s 35 stay as spelled)', () => {
        const names = AU_VEHICLE_CATALOG.map((m) => m.name)
        for (const make of [
            'Alfa Romeo', 'Audi', 'BMW', 'BYD', 'Chery', 'Cupra', 'Ford', 'Genesis', 'GWM', 'Holden', 'Honda',
            'Hyundai', 'Isuzu', 'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Mazda', 'Mercedes-Benz', 'MG',
            'MINI', 'Mitsubishi', 'Nissan', 'Peugeot', 'Porsche', 'RAM', 'Renault', 'Skoda', 'Subaru', 'Suzuki',
            'Tesla', 'Toyota', 'Volkswagen', 'Volvo',
        ]) {
            expect(names, make).toContain(make)
        }
        /* One make per brand: the guide's Great Wall, Haval and KGM are aliases, not makes. */
        expect(findVehicleMake('Great Wall')).toBeNull()
        expect(findVehicleMake('Mercedes-AMG')).toBeNull()
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
        expect(others[0]).toBe('Abarth')
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

    it('finds the AUTM-2005 makes by name, by what people call them, and by a model', () => {
        for (const make of ['Ferrari', 'Lamborghini', 'McLaren', 'Aston Martin', 'Bentley', 'Rolls-Royce', 'Maserati', 'Lotus', 'Polestar', 'LDV', 'SsangYong']) {
            expect(searchVehicleCatalog(make), make).toContainEqual({ kind: 'make', make })
        }
        expect(searchVehicleCatalog('lambo')).toContainEqual({ kind: 'make', make: 'Lamborghini' })
        expect(searchVehicleCatalog('KGM')).toContainEqual({ kind: 'make', make: 'SsangYong' })
        expect(searchVehicleCatalog('chevy')).toContainEqual({ kind: 'make', make: 'Chevrolet' })
        expect(first('urus')).toMatchObject({ make: 'Lamborghini', model: 'Urus', body: 'SUV' })
        expect(first('rolls cullinan')).toMatchObject({ make: 'Rolls-Royce', model: 'Cullinan' })
        expect(first('polestar 2')).toMatchObject({ make: 'Polestar', model: '2' })
        expect(first('grenadier')).toMatchObject({ make: 'Ineos', model: 'Grenadier' })
        expect(inferVehicleBody('Ferrari', 'Portofino')).toBe('CONVERTIBLE')
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

// AUTM-1878 follow-up: a finish word never outranks the paint's own name.
describe('vehiclePaint with a finish in the name', () => {
    it('reads "Deep Black Pearl" as black and "Pearl White" as white', () => {
        expect(vehiclePaint('Deep Black Pearl')?.value).toBe('black')
        expect(vehiclePaint('Pearl White')?.value).toBe('white')
        expect(vehiclePaint('pearl')?.value).toBe('white')
    })
})
