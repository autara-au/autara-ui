import { describe, expect, it } from 'vitest'
import {
    DROP_OFF_TAG,
    formatPriceCents,
    fromPrice,
    isMultiDay,
    listingPrice,
    serviceDurationLabel,
    serviceLocationLabel,
    workingDaysLabel,
} from './service-listing'

/** AUTM-1800: the words customer-web lists a service with, unchanged. */
const quote = (service: number, fee: number) => ({
    bookingFeeLabel: 'Booking fee',
    serviceTotalCents: service,
    bookingFeeTotalCents: fee,
    totalCents: service + fee,
})

describe('formatPriceCents', () => {
    it('prints A$ in en-AU with cents only when there are some', () => {
        expect(formatPriceCents(8000)).toBe('$80')
        expect(formatPriceCents(8392)).toBe('$83.92')
        expect(formatPriceCents(2_500_000)).toBe('$25,000')
        expect(formatPriceCents(99)).toBe('$0.99')
    })
})

describe('listingPrice', () => {
    it('leads with the total and names the parts when a fee applies (AUTM-1320)', () => {
        expect(listingPrice({ priceCents: 8000, priceBreakdown: quote(8000, 392) })).toEqual({
            headlineCents: 8392,
            headline: '$83.92',
            parts: { first: 'Service $80', second: '+ booking fee $3.92' },
            lines: [
                { label: 'Service', value: '$80' },
                { label: '+ booking fee', value: '$3.92' },
            ],
            includesFee: true,
            note: 'incl. $3.92 booking fee',
        })
    })

    it('shows the 99c minimum as an amount, never as a rate', () => {
        const price = listingPrice({ priceCents: 1000, priceBreakdown: quote(1000, 99) })
        expect(price.headline).toBe('$10.99')
        expect(price.lines?.[1]).toEqual({ label: '+ booking fee', value: '$0.99' })
        expect(JSON.stringify(price)).not.toMatch(/%/)
    })

    it('says the fee inside the total on one line, in the server\'s figure and label (AUTM-1866)', () => {
        expect(listingPrice({ priceCents: 1000, priceBreakdown: quote(1000, 99) }).note).toBe('incl. $0.99 booking fee')
        const named = listingPrice({
            priceCents: 8000,
            priceBreakdown: { ...quote(8000, 392), bookingFeeLabel: 'Service fee' },
        })
        expect(named.note).toBe('incl. $3.92 service fee')
        expect(named.headline).toBe('$83.92')
        expect(listingPrice({ priceCents: 8000, priceBreakdown: null }, { feeExpected: true }).note).toBe(
            'Plus a booking fee, shown before you pay',
        )
        expect(listingPrice({ priceCents: 8000, priceBreakdown: null }).note).toBeNull()
    })

    it('is the pro\'s price alone with no fee in the quote', () => {
        expect(listingPrice({ priceCents: 8000, priceBreakdown: quote(8000, 0) })).toEqual({
            headlineCents: 8000,
            headline: '$80',
            parts: null,
            lines: null,
            includesFee: false,
            note: null,
        })
    })

    it('says a fee is still to come when no quote arrived and one is expected, and nothing otherwise', () => {
        const unquoted = listingPrice({ priceCents: 8000, priceBreakdown: null }, { feeExpected: true })
        expect(unquoted.headline).toBe('$80')
        expect(unquoted.parts).toEqual({ first: 'Plus a booking fee,', second: 'shown before you pay' })
        expect(unquoted.lines).toEqual([{ label: 'Plus a booking fee,', value: 'shown before you pay' }])
        expect(listingPrice({ priceCents: 8000, priceBreakdown: null }).parts).toBeNull()
    })
})

describe('fromPrice', () => {
    it('picks the cheapest by what the customer pays, null with no services', () => {
        const from = fromPrice([
            { priceCents: 1000, priceBreakdown: quote(1000, 99) },
            { priceCents: 1050, priceBreakdown: quote(1050, 0) },
        ])
        expect(from?.headline).toBe('$10.50')
        expect(fromPrice([])).toBeNull()
    })
})

describe('serviceDurationLabel and the multi-day words', () => {
    it('words a duration', () => {
        expect(serviceDurationLabel(45)).toBe('45 min')
        expect(serviceDurationLabel(120)).toBe('2 hr')
        expect(serviceDurationLabel(150)).toBe('2 hr 30 min')
    })

    it('tells a multi-day job by its working days', () => {
        expect(isMultiDay(3)).toBe(true)
        expect(isMultiDay(0)).toBe(false)
        expect(isMultiDay(null)).toBe(false)
        expect(isMultiDay(Number.NaN)).toBe(false)
        expect(workingDaysLabel(1)).toBe('1 working day')
        expect(workingDaysLabel(3)).toBe('3 working days')
        expect(DROP_OFF_TAG).toBe('Drop off at the workshop')
    })
})

describe('serviceLocationLabel (AUTM-1866)', () => {
    it('says where a timed service is done, and claims nothing with no modes', () => {
        expect(serviceLocationLabel(['MOBILE'])).toBe('Comes to you')
        expect(serviceLocationLabel(['WORKSHOP'])).toBe('At the workshop')
        expect(serviceLocationLabel(['WORKSHOP', 'MOBILE'])).toBe('Comes to you or at the workshop')
        expect(serviceLocationLabel([])).toBeNull()
        expect(serviceLocationLabel(null)).toBeNull()
        expect(serviceLocationLabel(undefined)).toBeNull()
    })
})
