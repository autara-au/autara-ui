import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { AU_VEHICLE_CATALOG, vehicleSlug } from '../lib/vehicle-catalog'
import { VEHICLE_MAKE_LOGO_PATHS, VEHICLE_MAKE_LOGO_SOURCE } from '../lib/vehicle-make-logos'
import { VehicleMakeMark, hasVehicleMakeLogo, vehicleMakeLogoPath, vehicleMakeMonogram } from './VehicleMakeMark'

/** AUTM-1870: a make's mark, bundled from Simple Icons, or its monogram. */
describe('VehicleMakeMark', () => {
    it('draws the bundled mark in currentColor, hidden from assistive tech', () => {
        const { container } = render(<VehicleMakeMark make="Toyota" />)
        const svg = container.querySelector('svg')!
        expect(svg.getAttribute('data-mark')).toBe('logo')
        expect(svg.getAttribute('aria-hidden')).toBe('true')
        expect(svg.querySelector('path')!.getAttribute('fill')).toBe('currentColor')
        expect(svg.querySelector('path')!.getAttribute('d')).toBe(VEHICLE_MAKE_LOGO_PATHS.toyota)
    })

    it('draws a monogram where Simple Icons has no mark', () => {
        const { container } = render(<VehicleMakeMark make="GWM" />)
        const svg = container.querySelector('svg')!
        expect(svg.getAttribute('data-mark')).toBe('monogram')
        expect(svg.textContent).toBe('GWM')
        expect(vehicleMakeMonogram('Holden')).toBe('H')
        expect(vehicleMakeMonogram('Land Rover')).toBe('LR')
        expect(vehicleMakeMonogram('Mercedes-Benz')).toBe('MB')
        expect(vehicleMakeMonogram('BYD')).toBe('BYD')
        expect(vehicleMakeMonogram('  ')).toBe('?')
    })

    it('every catalog make has a mark or a monogram, and every mark is a catalog make', () => {
        const slugs = AU_VEHICLE_CATALOG.map((m) => vehicleSlug(m.name))
        for (const key of Object.keys(VEHICLE_MAKE_LOGO_PATHS)) expect(slugs, key).toContain(key)
        const withLogo = AU_VEHICLE_CATALOG.filter((m) => hasVehicleMakeLogo(m.name)).map((m) => m.name)
        expect(withLogo).toHaveLength(Object.keys(VEHICLE_MAKE_LOGO_PATHS).length)
        // AUTM-2147: 42 of the 80 makes. Simple Icons carries the rest of the supercar and luxury makes too.
        expect(withLogo).toHaveLength(42)
        for (const make of ['Ferrari', 'Lamborghini', 'McLaren', 'Porsche', 'Aston Martin', 'Bentley', 'Rolls-Royce', 'Maserati']) {
            expect(withLogo, make).toContain(make)
        }
        const monograms = AU_VEHICLE_CATALOG.filter((m) => !hasVehicleMakeLogo(m.name)).map((m) => m.name)
        for (const make of ['BYD', 'GWM', 'Holden', 'Isuzu', 'Land Rover', 'Lexus', 'Mercedes-Benz', 'Lotus', 'Proton', 'Mahindra']) {
            expect(monograms, make).toContain(make)
        }
        expect(VEHICLE_MAKE_LOGO_SOURCE).toMatch(/^simple-icons@\d+\.\d+\.\d+$/)
    })
})

/**
 * AUTM-2147: the merchant's job ticket shows the mark for the make a booking
 * carries, which a person typed, and keeps its car icon when there is none.
 */
describe('vehicleMakeLogoPath / hasVehicleMakeLogo: the make as a booking stores it', () => {
    it('finds the mark by the catalog name, in any case and spacing', () => {
        expect(vehicleMakeLogoPath('Toyota')).toBe(VEHICLE_MAKE_LOGO_PATHS.toyota)
        expect(vehicleMakeLogoPath('toyota')).toBe(VEHICLE_MAKE_LOGO_PATHS.toyota)
        expect(vehicleMakeLogoPath('  TOYOTA ')).toBe(VEHICLE_MAKE_LOGO_PATHS.toyota)
        expect(vehicleMakeLogoPath('Rolls Royce')).toBe(VEHICLE_MAKE_LOGO_PATHS['rolls-royce'])
        expect(vehicleMakeLogoPath('RollsRoyce')).toBe(VEHICLE_MAKE_LOGO_PATHS['rolls-royce'])
        expect(vehicleMakeLogoPath('Citroën')).toBe(VEHICLE_MAKE_LOGO_PATHS.citroen)
    })

    it('finds the mark by what people call the make', () => {
        expect(vehicleMakeLogoPath('VW')).toBe(VEHICLE_MAKE_LOGO_PATHS.volkswagen)
        expect(vehicleMakeLogoPath('vw')).toBe(VEHICLE_MAKE_LOGO_PATHS.volkswagen)
        expect(vehicleMakeLogoPath('Chevy')).toBe(VEHICLE_MAKE_LOGO_PATHS.chevrolet)
        expect(vehicleMakeLogoPath('Lambo')).toBe(VEHICLE_MAKE_LOGO_PATHS.lamborghini)
        expect(hasVehicleMakeLogo('Aston')).toBe(true)
    })

    it('has nothing for a make without a mark, an alias of one, a custom make or no make', () => {
        expect(hasVehicleMakeLogo('Mercedes-Benz')).toBe(false)
        expect(hasVehicleMakeLogo('Merc')).toBe(false)
        expect(hasVehicleMakeLogo('Holden')).toBe(false)
        expect(hasVehicleMakeLogo('Lada')).toBe(false)
        expect(hasVehicleMakeLogo('')).toBe(false)
        expect(hasVehicleMakeLogo('   ')).toBe(false)
        expect(hasVehicleMakeLogo(null)).toBe(false)
        expect(hasVehicleMakeLogo(undefined)).toBe(false)
    })

    it('draws the alias\'s mark, not a monogram of the alias', () => {
        const { container } = render(<VehicleMakeMark make="VW" />)
        const svg = container.querySelector('svg')!
        expect(svg.getAttribute('data-mark')).toBe('logo')
        expect(svg.querySelector('path')!.getAttribute('d')).toBe(VEHICLE_MAKE_LOGO_PATHS.volkswagen)
    })
})
