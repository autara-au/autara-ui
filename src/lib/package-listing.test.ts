import { describe, expect, it } from 'vitest'
import { includedServicesLabel, packageSaving } from './package-listing'

/** AUTM-1812: a package's saving is its services' total minus its price, from the server's figures. */
describe('packageSaving', () => {
    it('is the services total minus the package price', () => {
        // Two services at $280 and $242 ($522) sold together for $470.
        expect(packageSaving({ packagePriceCents: 47_000, includedPriceCents: [28_000, 24_200] })).toEqual({
            servicesTotalCents: 52_200,
            savingCents: 5_200,
        })
    })

    it('keeps cents exact, with no floating point drift', () => {
        // 0.1 + 0.2 in dollars is the classic trap; in cents it is 10 + 20.
        expect(packageSaving({ packagePriceCents: 25, includedPriceCents: [10, 20] })).toEqual({
            servicesTotalCents: 30,
            savingCents: 5,
        })
        expect(packageSaving({ packagePriceCents: 19_995, includedPriceCents: [9_999, 9_999, 1_999] })).toEqual({
            servicesTotalCents: 21_997,
            savingCents: 2_002,
        })
    })

    it('shows nothing when the package costs exactly what its services do', () => {
        expect(packageSaving({ packagePriceCents: 52_200, includedPriceCents: [28_000, 24_200] })).toBeNull()
    })

    it('shows nothing when the package costs more (AUTM-683 stops this in the form; old rows may predate it)', () => {
        expect(packageSaving({ packagePriceCents: 60_000, includedPriceCents: [28_000, 24_200] })).toBeNull()
    })

    it('shows nothing for a package with no services', () => {
        expect(packageSaving({ packagePriceCents: 10_000, includedPriceCents: [] })).toBeNull()
    })

    it('fails closed on a line it cannot vouch for, rather than understating the total', () => {
        // getBundleDetails maps a legacy NULL line price to 0.
        expect(packageSaving({ packagePriceCents: 10_000, includedPriceCents: [8_000, 0] })).toBeNull()
        expect(packageSaving({ packagePriceCents: 10_000, includedPriceCents: [8_000, -500] })).toBeNull()
        expect(packageSaving({ packagePriceCents: 10_000, includedPriceCents: [8_000, Number.NaN] })).toBeNull()
        // Dollars passed by mistake are not whole cents.
        expect(packageSaving({ packagePriceCents: 10_000, includedPriceCents: [80.5, 40] })).toBeNull()
    })

    it('fails closed on a package price it cannot vouch for', () => {
        expect(packageSaving({ packagePriceCents: 0, includedPriceCents: [8_000] })).toBeNull()
        expect(packageSaving({ packagePriceCents: Number.NaN, includedPriceCents: [8_000] })).toBeNull()
        expect(packageSaving({ packagePriceCents: 99.5, includedPriceCents: [8_000] })).toBeNull()
    })
})

describe('includedServicesLabel', () => {
    it('counts in words', () => {
        expect(includedServicesLabel(1)).toBe('1 service')
        expect(includedServicesLabel(4)).toBe('4 services')
    })
})
