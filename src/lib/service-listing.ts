/**
 * AUTM-1800: how a service is listed to a customer, in words, in one place.
 *
 * customer-web worded a service card's price and length itself
 * (`src/lib/listingPrice.ts`, `priceBreakdown.ts`, `multiDay.ts` and
 * `formatDuration` in the /m page's getMerchant.ts). The merchant portal now
 * previews the same card while the pro types the price, so those words moved
 * here unchanged and both apps call them: the card the merchant approves is
 * the card a customer sees.
 *
 * NO MONEY ARITHMETIC (AUTM-1302). Every figure is one the server returned:
 * customer-api's `priceBreakdown` on the profile, merchant-api's
 * `previewCustomerPrices` in the portal, both from the same fee engine. This
 * file picks and formats. The fee is never printed as a rate: under the
 * minimum a $10 service pays a fee that is not the rate times its price
 * (AUTM-1512).
 *
 * In its own module, without 'use client', so a server component can call it.
 */

const LOCALE = 'en-AU'
/** Held equal to `DEFAULT_CURRENCY` in @autara-au/autara-contracts. */
const CURRENCY = 'AUD'

/** Money as Autara prints it: A$ in en-AU, cents only when there are some. "$80", "$83.92". */
export function formatPriceCents(cents: number): string {
    return new Intl.NumberFormat(LOCALE, {
        style: 'currency',
        currency: CURRENCY,
        minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100)
}

/**
 * The parts of a server quote a listing reads: customer-api's
 * `PublicPriceBreakdown` and merchant-api's `CustomerPriceQuote` both fit.
 */
export interface ListingPriceBreakdown {
    /** What to call the fee. Rendered as given, never invented here. */
    bookingFeeLabel: string
    serviceTotalCents: number
    bookingFeeTotalCents: number
    /** Everything the customer pays. */
    totalCents: number
}

/** True when the quote carries a booking fee at all. */
export function hasBookingFee(breakdown: ListingPriceBreakdown): boolean {
    return breakdown.bookingFeeTotalCents > 0
}

/**
 * The parts line under a fee-inclusive price, in two pieces so it can wrap
 * between them and never strand an amount on a line of its own: "Service $80"
 * and "+ booking fee $3.92".
 */
export type ListingPriceParts = { first: string; second: string }

/** The same parts as labelled lines, for ServiceCard's `priceLines` (AUTM-1694). */
export type ListingPriceLine = { label: string; value: string }

export type ListingPrice = {
    /** The figure to lead with: the total when a fee applies, else the pro's price. */
    headlineCents: number
    /** `headlineCents`, formatted. */
    headline: string
    /** The parts line under the headline, or null when the headline is the whole story. */
    parts: ListingPriceParts | null
    /** `parts` as labelled lines, null exactly when `parts` is. */
    lines: ListingPriceLine[] | null
    /** True when the headline is a total with a booking fee inside it. */
    includesFee: boolean
    /**
     * AUTM-1866: the same facts as ONE small line under the headline, for
     * ServiceCard's `priceNote`: "incl. $0.99 booking fee" when the total has a
     * fee inside it, the "Plus a booking fee" line when no quote arrived and
     * one is expected, else null. The fee figure is the server's, formatted.
     */
    note: string | null
}

export interface ListingPriceInput {
    /** The pro's price, in cents. */
    priceCents: number
    /** The server's quote for it, or null when none arrived. */
    priceBreakdown: ListingPriceBreakdown | null
}

export interface ListingPriceOptions {
    /**
     * Whether this build expects a booking fee to apply. Only consulted when no
     * quote arrived: then the pro's price is all there is, and showing it bare
     * would understate what is paid, so it carries "Plus a booking fee, shown
     * before you pay". With no fee expected, a missing quote changes nothing.
     */
    feeExpected?: boolean
}

/**
 * The listing price of one service (AUTM-1320). Australian Consumer Law s48
 * asks for the single figure a customer will pay, at least as prominently as
 * any part of it, so with a booking fee the headline is the TOTAL and the
 * service price and the fee are named beneath it.
 */
export function listingPrice(
    { priceCents, priceBreakdown }: ListingPriceInput,
    { feeExpected = false }: ListingPriceOptions = {},
): ListingPrice {
    if (priceBreakdown && hasBookingFee(priceBreakdown)) {
        const feeLabel = priceBreakdown.bookingFeeLabel.toLowerCase()
        const lines: ListingPriceLine[] = [
            { label: 'Service', value: formatPriceCents(priceBreakdown.serviceTotalCents) },
            { label: `+ ${feeLabel}`, value: formatPriceCents(priceBreakdown.bookingFeeTotalCents) },
        ]
        return {
            headlineCents: priceBreakdown.totalCents,
            headline: formatPriceCents(priceBreakdown.totalCents),
            parts: { first: `${lines[0].label} ${lines[0].value}`, second: `${lines[1].label} ${lines[1].value}` },
            lines,
            includesFee: true,
            note: `incl. ${lines[1].value} ${feeLabel}`,
        }
    }
    const unquoted = priceBreakdown === null && feeExpected
    return {
        headlineCents: priceCents,
        headline: formatPriceCents(priceCents),
        parts: unquoted ? { first: 'Plus a booking fee,', second: 'shown before you pay' } : null,
        lines: unquoted ? [{ label: 'Plus a booking fee,', value: 'shown before you pay' }] : null,
        includesFee: false,
        note: unquoted ? 'Plus a booking fee, shown before you pay' : null,
    }
}

/**
 * The cheapest service's listing price, for "From $X". Chosen by the figure
 * the customer would pay, not by the pro's price, so the "from" is never lower
 * than a total actually on the list. Null with no services.
 */
export function fromPrice(services: readonly ListingPriceInput[], options?: ListingPriceOptions): ListingPrice | null {
    let cheapest: ListingPrice | null = null
    for (const svc of services) {
        const price = listingPrice(svc, options)
        if (cheapest === null || price.headlineCents < cheapest.headlineCents) cheapest = price
    }
    return cheapest
}

// ── How long it takes ────────────────────────────────────────────────────

/**
 * A service's length on its card: "45 min", "2 hr", "2 hr 30 min". Not for a
 * multi-day job, whose minutes are whole days (see `isMultiDay`).
 */
export function serviceDurationLabel(minutes: number): string {
    if (minutes < 60) return `${minutes} min`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m === 0 ? `${h} hr` : `${h} hr ${m} min`
}

/**
 * AUTM-1575: a working-days count worth treating as a multi-day workshop job.
 * Such a job lists its days, never a duration: its minutes are days x 1440,
 * fail-closed for readers that predate working days.
 */
export function isMultiDay(workingDays: number | null | undefined): workingDays is number {
    return typeof workingDays === 'number' && Number.isFinite(workingDays) && workingDays > 0
}

/** "3 working days". */
export function workingDaysLabel(workingDays: number): string {
    return `${workingDays} working ${workingDays === 1 ? 'day' : 'days'}`
}

/** The tag a multi-day service carries wherever it is listed. */
export const DROP_OFF_TAG = 'Drop off at the workshop'

// ── Where it is done ─────────────────────────────────────────────────────

/** A pro's booking modes, as customer-api's `availableBookingModes` names them. */
export type ListingBookingMode = 'MOBILE' | 'WORKSHOP'

/**
 * AUTM-1866: where a timed service is done, for the card's meta line after
 * its length: "Comes to you", "At the workshop", or both. Null with neither,
 * so nothing is claimed. Not for a multi-day job, which is always left at the
 * workshop and says so with `DROP_OFF_TAG`.
 */
export function serviceLocationLabel(modes: readonly string[] | null | undefined): string | null {
    const mobile = Boolean(modes?.includes('MOBILE'))
    const workshop = Boolean(modes?.includes('WORKSHOP'))
    if (mobile && workshop) return 'Comes to you or at the workshop'
    if (mobile) return 'Comes to you'
    if (workshop) return 'At the workshop'
    return null
}
