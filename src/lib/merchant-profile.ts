/**
 * AUTM-1800: the words a pro's public profile says about them, in one place.
 *
 * These lived in customer-web (`src/app/m/[merchantId]/_lib/openState.ts` and
 * `locationLabel.ts`) while the profile page was the only thing that drew a
 * pro as a customer sees them. The merchant portal now previews the same
 * profile while the pro edits it, so the derivations moved here, unchanged, and
 * both apps call them: a preview that worded the door state or the kicker on
 * its own would drift from the page the first time either changed.
 *
 * In its own module, without 'use client', so a server component can call it
 * (the profile page is server rendered; see `initials.ts`).
 */

/* The platform's region defaults, held equal to `DEFAULT_LOCALE` and
 * `DEFAULT_TIMEZONE` in @autara-au/autara-contracts (src/region). autara-ui
 * does not depend on contracts, so they are restated here, once. */
export const PROFILE_DEFAULT_LOCALE = 'en-AU'
export const PROFILE_DEFAULT_TIMEZONE = 'Australia/Sydney'

/** The public profile's booking modes, as customer-api sends them. */
export type ProfileBookingMode = 'MOBILE' | 'WORKSHOP'

// ── The door state (AUTM-874, AUTM-880) ──────────────────────────────────

/*
 * "Open now" has to mean now, in the merchant's own clock.
 *
 *  1. Merchant clock, not viewer clock. `merchant_profiles.timezone` is the
 *     source of truth for anything time-shaped (AUT-575), so the status is the
 *     same for a visitor in Brisbane, Colombo or UTC. `now` is a parameter for
 *     tests and for a render that pins one timestamp; never the viewer's zone.
 *  2. Never claim open on data we can't read. Missing, malformed or inverted
 *     windows resolve to CLOSED: over-claiming costs a booking, under-claiming
 *     only sends someone to the hours table.
 */

export type MerchantHours = ReadonlyArray<{
    day: string
    open: string | null
    close: string | null
}>

export type MerchantOpenState =
    /** Inside today's window right now, with room to fit the shortest service. */
    | { status: 'OPEN'; open: string; close: string }
    /**
     * AUTM-880: inside today's window, but not for long enough to book. At
     * 16:50 with a 60-minute shortest service and a 17:00 close, "Open now" is
     * literally true and practically a lie.
     */
    | { status: 'CLOSING_SOON'; open: string; close: string }
    /** Has hours today, but they start later. */
    | { status: 'OPENS_LATER'; open: string; close: string }
    /** No hours today at all, or today's window has already closed. */
    | { status: 'CLOSED' }

export type MerchantOpenStatus = MerchantOpenState['status']

const CLOSED: MerchantOpenState = { status: 'CLOSED' }

/** "HH:MM" to minutes since local midnight. Null for anything unparseable. */
function toMinutes(hhmm: string | null | undefined): number | null {
    if (!hhmm) return null
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
    if (!m) return null
    const hours = Number(m[1])
    const minutes = Number(m[2])
    if (hours > 23 || minutes > 59) return null
    return hours * 60 + minutes
}

/**
 * The merchant's current weekday ("Mon") and minute of the day.
 *
 * `hourCycle: 'h23'` rather than `hour12: false` on purpose: the latter renders
 * midnight as "24" under some ICU builds, which would put the minutes a full
 * day ahead and flip a just-past-midnight merchant to closed.
 */
export function merchantLocalClock(
    timezone: string | null | undefined,
    now: Date = new Date(),
): { weekday: string; minutes: number } {
    const parts = new Intl.DateTimeFormat(PROFILE_DEFAULT_LOCALE, {
        timeZone: timezone || PROFILE_DEFAULT_TIMEZONE,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(now)

    const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''

    return {
        weekday: read('weekday'),
        minutes: Number(read('hour')) * 60 + Number(read('minute')),
    }
}

/**
 * The merchant's open or closed status against their own local time. The
 * window is half-open, `[open, close)`, so a shop closing at 17:00 is not open
 * at 17:00.
 *
 * `shortestServiceMinutes` (AUTM-880) is optional: omitted, the status
 * describes the door only; supplied, it tells "open" from "open long enough to
 * book". Arithmetic on data the profile already holds, not an availability
 * read, so it can still over-promise a taken slot; it removes only the case
 * where nothing could possibly fit.
 */
export function getMerchantOpenState(
    hours: MerchantHours,
    timezone: string | null | undefined,
    now: Date = new Date(),
    shortestServiceMinutes?: number | null,
): MerchantOpenState {
    const clock = merchantLocalClock(timezone, now)
    const today = hours.find((h) => h.day === clock.weekday)
    if (!today || !today.open || !today.close) return CLOSED

    const openMinutes = toMinutes(today.open)
    const closeMinutes = toMinutes(today.close)
    if (openMinutes === null || closeMinutes === null) return CLOSED

    /* An inverted window is bad data or an overnight shift the `{from,to}`
       shape cannot express. Neither is safe to read as open. */
    if (closeMinutes <= openMinutes) return CLOSED

    if (clock.minutes < openMinutes) {
        return { status: 'OPENS_LATER', open: today.open, close: today.close }
    }
    if (clock.minutes < closeMinutes) {
        /* Only downgrade on a usable duration: guessing "Closing soon" on
           unknown data would under-claim on a shop that is bookable. */
        const fits =
            typeof shortestServiceMinutes !== 'number' ||
            !Number.isFinite(shortestServiceMinutes) ||
            shortestServiceMinutes <= 0 ||
            clock.minutes + shortestServiceMinutes <= closeMinutes
        return { status: fits ? 'OPEN' : 'CLOSING_SOON', open: today.open, close: today.close }
    }
    return CLOSED
}

/**
 * One phrasing of the status, so every place that shows it agrees. `lead` is
 * the state and `detail` the time that makes it actionable ("closes 17:00",
 * never the whole window: at 16:50 the window implies the day is bookable).
 */
export function openStateCopy(state: MerchantOpenState): { lead: string; detail: string | null } {
    switch (state.status) {
        case 'OPEN':
            return { lead: 'Open now', detail: `closes ${state.close}` }
        case 'CLOSING_SOON':
            return { lead: 'Closing soon', detail: `closes ${state.close}` }
        case 'OPENS_LATER':
            return { lead: 'Closed now', detail: `opens ${state.open}` }
        default:
            return { lead: 'Closed today', detail: null }
    }
}

/** The flat one-line form: "Open now · closes 17:00". */
export function describeOpenState(state: MerchantOpenState): string {
    const { lead, detail } = openStateCopy(state)
    return detail ? `${lead} · ${detail}` : lead
}

/**
 * AUTM-1265: an away-mode resume time as a sentence fragment, in the
 * MERCHANT's timezone. Null when it will not parse (never "Invalid Date" at a
 * customer) or is in the past (a promise that has already lapsed is worse than
 * none).
 */
export function formatPauseUntil(
    iso: string | null | undefined,
    timezone: string | null | undefined,
    now: Date = new Date(),
): string | null {
    if (!iso) return null
    const when = new Date(iso)
    if (Number.isNaN(when.getTime())) return null
    if (when.getTime() <= now.getTime()) return null

    return new Intl.DateTimeFormat(PROFILE_DEFAULT_LOCALE, {
        timeZone: timezone || PROFILE_DEFAULT_TIMEZONE,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: 'numeric',
        minute: '2-digit',
    }).format(when)
}

// ── Where they work (AUTM-891) ───────────────────────────────────────────

/*
 * Whether the pro travels to the customer or the customer drives to a
 * workshop decides whether the service is usable at all, so getting it
 * backwards is worse than omitting it: the unknown case says nothing.
 * `availableBookingModes` is the input because the resolver always fills it
 * (FIXED to WORKSHOP, BOTH to both, MOBILE or null to MOBILE); `serviceArea`
 * is hardcoded null by the resolver and cannot be trusted to say which.
 */

export type LocationLabel = {
    /** Screen-reader term for the <dt>. */
    term: string
    /** Emphasised lead, e.g. "Comes to you". Null when the place IS the lead. */
    lead: string | null
    /** Trailing detail: a radius, or the suburb for a workshop. */
    detail: string | null
    /** Whether `detail` carries the emphasis instead of `lead`. */
    emphasiseDetail: boolean
}

export type ProfilePlaceInput = {
    availableBookingModes?: ReadonlyArray<ProfileBookingMode | string> | null
    locationLine?: string | null
}

export function deriveLocationLabel(
    input: ProfilePlaceInput & { serviceArea?: { radiusKm?: number | null } | null },
): LocationLabel | null {
    const modes = input.availableBookingModes ?? []
    const mobile = modes.includes('MOBILE')
    const workshop = modes.includes('WORKSHOP')
    const place = input.locationLine?.trim() || null
    const radiusKm = input.serviceArea?.radiusKm ?? null

    /* A radius only means something for a pro who travels, and only when the
       API sent one (it is null for everyone today). */
    const radius = mobile && typeof radiusKm === 'number' && radiusKm > 0 ? `within ${radiusKm} km` : null

    if (mobile && workshop) {
        /* Lead with travel, the differentiator, but name the workshop so a
           customer who would rather drive knows they can. */
        return {
            term: 'Service area',
            lead: 'Comes to you',
            detail: place ? `or visit them in ${place}` : radius,
            emphasiseDetail: false,
        }
    }

    if (mobile) {
        /* The service area, not an address: a customer of a mobile pro should
           never turn up at their base. The suburb only as orientation. */
        return {
            term: 'Service area',
            lead: 'Comes to you',
            detail: radius ?? (place ? `based in ${place}` : null),
            emphasiseDetail: false,
        }
    }

    if (workshop) {
        /* A workshop pro with no address tells the customer nothing they can
           act on, and "Workshop" alone invites them to look for one. */
        return place ? { term: 'Location', lead: 'Workshop in', detail: place, emphasiseDetail: true } : null
    }

    return null
}

/**
 * The line over the business name, on the profile and its share card
 * (AUTM-1513), so the two never describe a pro differently. Suburb and state
 * as the profile carries them, never a street (AUTM-1004).
 */
export function profileKicker(input: ProfilePlaceInput): string {
    const modes = input.availableBookingModes ?? []
    const mobileOnly = modes.includes('MOBILE') && !modes.includes('WORKSHOP')
    const place = input.locationLine?.trim() || null
    return `${mobileOnly ? 'Mobile car-care pro' : 'Car-care pro'}${place ? ` in ${place}` : ''}`
}

/**
 * The mode fact under the name (AUTM-1116): "Mobile & workshop", "Comes to
 * you", "Workshop", or null when the modes say neither.
 */
export function bookingModeLabel(modes: ReadonlyArray<ProfileBookingMode | string> | null | undefined): string | null {
    const list = modes ?? []
    const mobile = list.includes('MOBILE')
    const workshop = list.includes('WORKSHOP')
    if (mobile && workshop) return 'Mobile & workshop'
    if (mobile) return 'Comes to you'
    if (workshop) return 'Workshop'
    return null
}

/**
 * The letter on the no-photo cover (AUTM-546): the first character of the
 * business name, upper-cased. A name that is empty or starts with a space
 * would leave the tile blank, so it falls back to "A".
 */
export function profileMonogram(name: string | null | undefined): string {
    return (name ?? '').trim().charAt(0).toUpperCase() || 'A'
}
