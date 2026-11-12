import { describe, expect, it } from 'vitest'
import {
    bookingModeLabel,
    deriveLocationLabel,
    describeOpenState,
    formatPauseUntil,
    getMerchantOpenState,
    merchantLocalClock,
    openStateCopy,
    profileKicker,
    profileMonogram,
    type MerchantHours,
} from './merchant-profile'

/* Brisbane has no daylight saving, so a UTC instant is always +10 there. */
const BNE = 'Australia/Brisbane'
const at = (localHHMM: string, isoDate = '2026-10-10') => {
    // 2026-10-10 is a Saturday.
    const [h, m] = localHHMM.split(':').map(Number)
    return new Date(Date.UTC(Number(isoDate.slice(0, 4)), Number(isoDate.slice(5, 7)) - 1, Number(isoDate.slice(8, 10)), h - 10, m))
}
const SAT_HOURS: MerchantHours = [
    { day: 'Fri', open: '08:00', close: '18:00' },
    { day: 'Sat', open: '08:30', close: '17:00' },
    { day: 'Sun', open: null, close: null },
]

describe('merchantLocalClock', () => {
    it('reads the weekday and minutes in the merchant zone, midnight as 0', () => {
        expect(merchantLocalClock(BNE, at('00:42'))).toEqual({ weekday: 'Sat', minutes: 42 })
        expect(merchantLocalClock(BNE, at('13:05'))).toEqual({ weekday: 'Sat', minutes: 13 * 60 + 5 })
    })

    it('falls back to Sydney when the merchant has no zone', () => {
        expect(merchantLocalClock(null, new Date('2026-07-01T00:00:00Z')).minutes).toBe(10 * 60)
    })
})

describe('getMerchantOpenState', () => {
    it('is closed before midnight rolls into opening hours (AUTM-874)', () => {
        expect(getMerchantOpenState(SAT_HOURS, BNE, at('00:42'))).toEqual({
            status: 'OPENS_LATER',
            open: '08:30',
            close: '17:00',
        })
    })

    it('is open inside the half-open window and closed at the close', () => {
        expect(getMerchantOpenState(SAT_HOURS, BNE, at('09:00')).status).toBe('OPEN')
        expect(getMerchantOpenState(SAT_HOURS, BNE, at('17:00')).status).toBe('CLOSED')
    })

    it('says closing soon when the shortest service no longer fits (AUTM-880)', () => {
        expect(getMerchantOpenState(SAT_HOURS, BNE, at('16:50'), 60).status).toBe('CLOSING_SOON')
        expect(getMerchantOpenState(SAT_HOURS, BNE, at('16:00'), 60).status).toBe('OPEN')
        // Unknown durations never downgrade.
        expect(getMerchantOpenState(SAT_HOURS, BNE, at('16:50'), 0).status).toBe('OPEN')
        expect(getMerchantOpenState(SAT_HOURS, BNE, at('16:50'), null).status).toBe('OPEN')
    })

    it('never claims open on data it cannot read', () => {
        expect(getMerchantOpenState([], BNE, at('10:00')).status).toBe('CLOSED')
        expect(getMerchantOpenState([{ day: 'Sat', open: '9am', close: '17:00' }], BNE, at('10:00')).status).toBe(
            'CLOSED',
        )
        expect(getMerchantOpenState([{ day: 'Sat', open: '18:00', close: '02:00' }], BNE, at('19:00')).status).toBe(
            'CLOSED',
        )
        expect(getMerchantOpenState([{ day: 'Sat', open: '25:00', close: '26:00' }], BNE, at('10:00')).status).toBe(
            'CLOSED',
        )
    })
})

describe('openStateCopy and describeOpenState', () => {
    it('words each state once', () => {
        expect(describeOpenState({ status: 'OPEN', open: '08:30', close: '17:00' })).toBe('Open now · closes 17:00')
        expect(describeOpenState({ status: 'CLOSING_SOON', open: '08:30', close: '17:00' })).toBe(
            'Closing soon · closes 17:00',
        )
        expect(describeOpenState({ status: 'OPENS_LATER', open: '08:30', close: '17:00' })).toBe(
            'Closed now · opens 08:30',
        )
        expect(openStateCopy({ status: 'CLOSED' })).toEqual({ lead: 'Closed today', detail: null })
    })
})

describe('formatPauseUntil', () => {
    const now = new Date('2026-10-10T00:00:00Z')
    it('is null for nothing, garbage and the past', () => {
        expect(formatPauseUntil(null, BNE, now)).toBeNull()
        expect(formatPauseUntil('not a date', BNE, now)).toBeNull()
        expect(formatPauseUntil('2026-10-09T00:00:00Z', BNE, now)).toBeNull()
    })
    it('formats a future time in the merchant zone', () => {
        const out = formatPauseUntil('2026-10-12T22:00:00Z', BNE, now)
        expect(out).toMatch(/Tuesday/)
        expect(out).toMatch(/13 October/)
        expect(out).toMatch(/8:00/)
    })
})

describe('deriveLocationLabel', () => {
    it('leads with travel for a mobile pro and never gives an address', () => {
        expect(deriveLocationLabel({ availableBookingModes: ['MOBILE'], locationLine: 'Fitzroy, VIC' })).toEqual({
            term: 'Service area',
            lead: 'Comes to you',
            detail: 'based in Fitzroy, VIC',
            emphasiseDetail: false,
        })
        expect(
            deriveLocationLabel({ availableBookingModes: ['MOBILE'], serviceArea: { radiusKm: 15 } })?.detail,
        ).toBe('within 15 km')
    })

    it('names the workshop for both, and says nothing for a workshop with no place', () => {
        expect(
            deriveLocationLabel({ availableBookingModes: ['MOBILE', 'WORKSHOP'], locationLine: 'Fitzroy, VIC' })?.detail,
        ).toBe('or visit them in Fitzroy, VIC')
        expect(deriveLocationLabel({ availableBookingModes: ['WORKSHOP'], locationLine: 'Fitzroy, VIC' })).toEqual({
            term: 'Location',
            lead: 'Workshop in',
            detail: 'Fitzroy, VIC',
            emphasiseDetail: true,
        })
        expect(deriveLocationLabel({ availableBookingModes: ['WORKSHOP'], locationLine: '  ' })).toBeNull()
        expect(deriveLocationLabel({ availableBookingModes: [] })).toBeNull()
    })
})

describe('profileKicker, bookingModeLabel and profileMonogram', () => {
    it('words the kicker by mode and place', () => {
        expect(profileKicker({ availableBookingModes: ['MOBILE'], locationLine: 'Fitzroy, VIC' })).toBe(
            'Mobile car-care pro in Fitzroy, VIC',
        )
        expect(profileKicker({ availableBookingModes: ['MOBILE', 'WORKSHOP'], locationLine: null })).toBe(
            'Car-care pro',
        )
    })

    it('labels the modes, null when there are none', () => {
        expect(bookingModeLabel(['MOBILE', 'WORKSHOP'])).toBe('Mobile & workshop')
        expect(bookingModeLabel(['MOBILE'])).toBe('Comes to you')
        expect(bookingModeLabel(['WORKSHOP'])).toBe('Workshop')
        expect(bookingModeLabel(null)).toBeNull()
    })

    it('takes the first letter, with a fallback for a blank name', () => {
        expect(profileMonogram('  wish car care')).toBe('W')
        expect(profileMonogram('')).toBe('A')
        expect(profileMonogram(undefined)).toBe('A')
    })
})
