import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { AU_VEHICLE_CATALOG, vehicleSlug } from '../lib/vehicle-catalog'
import { VEHICLE_MAKE_LOGO_PATHS, VEHICLE_MAKE_LOGO_SOURCE } from '../lib/vehicle-make-logos'
import { VehicleMakeMark, hasVehicleMakeLogo, vehicleMakeMonogram } from './VehicleMakeMark'

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
        expect(withLogo).toHaveLength(23)
        const monograms = AU_VEHICLE_CATALOG.filter((m) => !hasVehicleMakeLogo(m.name)).map((m) => m.name)
        expect(monograms.sort()).toEqual(
            ['Alfa Romeo', 'BYD', 'Chery', 'Cupra', 'GWM', 'Genesis', 'Holden', 'Isuzu', 'Jaguar', 'Land Rover', 'Lexus', 'Mercedes-Benz'].sort()
        )
        expect(VEHICLE_MAKE_LOGO_SOURCE).toMatch(/^simple-icons@\d+\.\d+\.\d+$/)
    })
})
