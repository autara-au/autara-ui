/**
 * AUTM-1812: what a package is worth against its own services, in one place.
 *
 * A package (merchant-api `Bundle`) is priced by the pro, and each service in
 * it carries the price it had when it was bundled (`bundle_services.price`,
 * returned by `getBundleDetails` as `BundleServiceDetail.price`). The saving a
 * card shows is those services' total minus the package's price. Both apps
 * call this, so the merchant's catalogue and a customer's listing can never
 * disagree about it.
 *
 * Every input is a figure the server returned, in integer cents; this only
 * adds and subtracts them. The consumer converts the API's dollars to cents
 * once (`Math.round(amount * 100)`) and passes cents in.
 *
 * Fails closed: anything it cannot vouch for returns null and the card shows
 * the package's price alone, never a saving it cannot prove.
 *
 *   - No services: nothing to compare against.
 *   - A line that is not a whole, positive number of cents. merchant-api
 *     refuses a $0 line on every write (`invalidPriceMessage`), and
 *     `getBundleDetails` maps a legacy NULL line to 0; summing that 0 would
 *     understate the total, so such a package shows no saving at all.
 *   - A saving of zero or less. AUTM-683 stops a package costing more than its
 *     services in the form, but a package priced at exactly their total, or
 *     one read before that rule, has nothing to save, and "Save $0" is noise.
 *
 * In its own module, without 'use client', so a server component can call it.
 */

export interface PackageSavingInput {
    /** The package's own price, in cents. */
    packagePriceCents: number
    /** Each included service's price as the package holds it, in cents. */
    includedPriceCents: readonly number[]
}

export interface PackageSaving {
    /** What the included services cost on their own, in cents. */
    servicesTotalCents: number
    /** `servicesTotalCents` minus the package's price. Always above zero. */
    savingCents: number
}

function isWholePositiveCents(value: number): boolean {
    return Number.isSafeInteger(value) && value > 0
}

/** The saving on a package, or null when there is none to show (see above). */
export function packageSaving({ packagePriceCents, includedPriceCents }: PackageSavingInput): PackageSaving | null {
    if (!isWholePositiveCents(packagePriceCents)) return null
    if (includedPriceCents.length === 0) return null
    let servicesTotalCents = 0
    for (const cents of includedPriceCents) {
        if (!isWholePositiveCents(cents)) return null
        servicesTotalCents += cents
    }
    if (!Number.isSafeInteger(servicesTotalCents)) return null
    const savingCents = servicesTotalCents - packagePriceCents
    if (savingCents <= 0) return null
    return { servicesTotalCents, savingCents }
}

/** "1 service", "4 services": the count a package card names what it holds by. */
export function includedServicesLabel(count: number): string {
    return `${count} ${count === 1 ? 'service' : 'services'}`
}
