'use client'

import * as React from 'react'

import { cn } from '../lib/cn'
import { useIsMobile } from '../lib/use-is-mobile'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from './Sheet'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from './Dialog'
import { SearchInput } from './SearchInput'
import { Input } from './Input'
import { FormField } from './FormField'
import { Button } from './Button'
import { AsyncSkeleton } from './AsyncSkeleton'
import { ErrorCard } from './ErrorCard'
import { EmptyState } from './EmptyState'

/**
 * AddressPickerSheet — search an address, then confirm it on a map.
 *
 * Bottom sheet on phones, centered dialog on tablet/desktop (same shell
 * grammar as `PickerSheet`). Two steps in one surface: a debounced search
 * list, then a details step with the parsed fields and a draggable map pin.
 *
 * ## Why this is provider-agnostic
 *
 * autara-ui ships no map or geocoding dependency, and it must not: the
 * package is consumed by a Next app, a Vite app and a Capacitor WebView,
 * each of which needs a *differently restricted* Maps key. Pulling
 * `@vis.gl/react-google-maps` in here would force that dependency (and its
 * API-key story) on every consumer, including the ones that never render a
 * map.
 *
 * So this component owns the part that is genuinely reusable — the sheet,
 * the two-step flow, the parsed-address form, the async folds, the
 * fabricated-location guard, the a11y — and takes the provider in as three
 * async functions plus a `renderMap` render prop. The Google glue lives in
 * the consumer. When a second consumer needs the identical glue, graduate
 * *that* into an optional `@autara-au/autara-ui/maps-google` subpath rather
 * than widening this component's dependencies.
 *
 * ## The fabricated-location guard
 *
 * Ported from merchant-web's `BusinessAddressSelector` (AUTM-374), which
 * learned this the hard way: a merchant who typed an address without picking
 * a suggestion, and never touched the pin, was silently saved at the default
 * map center with an empty state code — geolocating every typed-only business
 * in Sydney. Here, `locationResolved` only flips true when a suggestion
 * actually resolved to coordinates or the merchant moved the pin, and
 * `Confirm` refuses until it does. It is a flag, not a comparison against a
 * hardcoded default coordinate, so it stays correct wherever the map opens.
 */

/** One row in the search list. Shape-compatible with a Places prediction. */
export interface AddressSuggestion {
    /** Stable id passed back to `resolveSuggestion` (e.g. a Places placeId). */
    id: string
    /** Bold first line — usually the street line. */
    primaryText: string
    /** Muted second line — usually suburb / state / country. */
    secondaryText?: string
}

/**
 * A real, located address. `lat`/`lng` are required by construction: the
 * picker will not let the user confirm without resolving a location, so
 * consumers never have to handle a half-address.
 */
export interface ResolvedAddress {
    street: string
    floorOrSuite?: string
    city: string
    /** ISO 3166-2 subdivision code where available (e.g. "VIC"). */
    state: string
    postalCode: string
    country?: string
    lat: number
    lng: number
}

export interface AddressMapRenderProps {
    /** Current pin position. */
    lat: number
    lng: number
    /** Call when the user drags the pin or taps a new point on the map. */
    onPinMove: (lat: number, lng: number) => void
}

export interface AddressPickerSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /**
     * Existing address, for edit mode. When set, the picker opens straight
     * to the details step with the location already treated as resolved.
     */
    value?: ResolvedAddress | null
    /** Fires with the confirmed address; the picker closes itself. */
    onConfirm: (address: ResolvedAddress) => void

    /** Debounced (300ms) as the user types. Rejections render the error fold. */
    searchAddresses: (query: string) => Promise<AddressSuggestion[]>
    /**
     * Turn a picked suggestion into a full address + coordinates. Returning
     * `null` is treated as "couldn't resolve that one" and surfaces an error
     * rather than advancing with a half-filled form.
     */
    resolveSuggestion: (suggestionId: string) => Promise<ResolvedAddress | null>
    /**
     * Re-parse the address after the pin moves. Optional — without it the pin
     * still sets the coordinates, it just won't refresh the text fields.
     */
    reverseGeocode?: (lat: number, lng: number) => Promise<ResolvedAddress | null>
    /**
     * Render the map. Omit it and the details step is fields-only — which
     * also means a manually-typed address can never be confirmed, because
     * nothing can resolve its coordinates. That is deliberate.
     */
    renderMap?: (props: AddressMapRenderProps) => React.ReactNode
    /** Where the map opens before anything is resolved. Defaults to Melbourne. */
    defaultCenter?: { lat: number; lng: number }

    title?: string
    description?: string
    searchPlaceholder?: string
    confirmLabel?: string
    /** Show the optional floor / unit field. @default true */
    showFloorField?: boolean
    /**
     * Require a resolved location before confirming. @default true — only
     * turn this off for a surface where an unlocatable address is genuinely
     * acceptable.
     */
    requireResolvedLocation?: boolean
}

const DEBOUNCE_MS = 300
/** Melbourne — the launch city. */
const DEFAULT_CENTER = { lat: -37.8136, lng: 144.9631 }

const BLANK: ResolvedAddress = {
    street: '',
    floorOrSuite: '',
    city: '',
    state: '',
    postalCode: '',
    lat: DEFAULT_CENTER.lat,
    lng: DEFAULT_CENTER.lng,
}

// Inline Solar-linear glyphs — autara-ui carries no icon dependency.
function BackGlyph() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function PinGlyph() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
            <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" />
        </svg>
    )
}

export function AddressPickerSheet(props: AddressPickerSheetProps) {
    const {
        open,
        onOpenChange,
        value = null,
        onConfirm,
        searchAddresses,
        resolveSuggestion,
        reverseGeocode,
        renderMap,
        defaultCenter = DEFAULT_CENTER,
        title = 'Business address',
        description,
        searchPlaceholder = 'Search your address',
        confirmLabel = 'Confirm address',
        showFloorField = true,
        requireResolvedLocation = true,
    } = props

    const isMobile = useIsMobile()

    const [step, setStep] = React.useState<'search' | 'details'>('search')
    const [query, setQuery] = React.useState('')
    const [suggestions, setSuggestions] = React.useState<AddressSuggestion[]>([])
    const [searching, setSearching] = React.useState(false)
    const [searchError, setSearchError] = React.useState<string | null>(null)
    const [resolving, setResolving] = React.useState(false)
    /** Bumped by the error fold's Retry — re-runs the search effect for an
     *  unchanged query, which a plain `setQuery(q => q)` would not (React
     *  bails out of an identical state write). */
    const [retryToken, setRetryToken] = React.useState(0)

    const [draft, setDraft] = React.useState<ResolvedAddress>(BLANK)
    const [locationResolved, setLocationResolved] = React.useState(false)
    const [confirmError, setConfirmError] = React.useState<string | null>(null)

    /** Guards against a slow earlier search overwriting a newer one. */
    const searchSeq = React.useRef(0)

    // Reset to a clean slate every time the picker opens, so a cancelled
    // edit never leaks into the next one. Edit mode (a `value`) opens
    // straight to details with the location already trusted — it came from
    // a previous confirm, which enforced the same guard.
    React.useEffect(() => {
        if (!open) return
        searchSeq.current += 1
        setQuery('')
        setSuggestions([])
        setSearching(false)
        setSearchError(null)
        setResolving(false)
        setConfirmError(null)
        if (value) {
            setDraft({ ...value, floorOrSuite: value.floorOrSuite ?? '' })
            setLocationResolved(true)
            setStep('details')
        } else {
            setDraft({ ...BLANK, lat: defaultCenter.lat, lng: defaultCenter.lng })
            setLocationResolved(false)
            setStep('search')
        }
        // Intentionally keyed on the open edge only — re-running when the
        // caller re-creates `value` mid-edit would discard the user's typing.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    // Debounced search. The sequence guard matters more than the debounce:
    // Places latency is spiky, and a 2-character query resolving after a
    // 9-character one would otherwise repopulate the list with stale rows.
    React.useEffect(() => {
        if (step !== 'search') return
        const trimmed = query.trim()
        if (!trimmed) {
            searchSeq.current += 1
            setSuggestions([])
            setSearching(false)
            setSearchError(null)
            return
        }

        const seq = ++searchSeq.current
        setSearching(true)
        setSearchError(null)

        const timer = setTimeout(() => {
            searchAddresses(trimmed)
                .then((results) => {
                    if (seq !== searchSeq.current) return
                    setSuggestions(results)
                })
                .catch(() => {
                    if (seq !== searchSeq.current) return
                    setSuggestions([])
                    setSearchError(
                        "We couldn't search addresses just now — check your connection and try again.",
                    )
                })
                .finally(() => {
                    if (seq !== searchSeq.current) return
                    setSearching(false)
                })
        }, DEBOUNCE_MS)

        return () => clearTimeout(timer)
    }, [query, step, retryToken, searchAddresses])

    async function handlePick(suggestion: AddressSuggestion) {
        setResolving(true)
        setSearchError(null)
        try {
            const resolved = await resolveSuggestion(suggestion.id)
            if (!resolved) {
                setSearchError(
                    "We couldn't pin that address down. Try another suggestion, or enter it manually and drop the pin yourself.",
                )
                return
            }
            setDraft({ ...resolved, floorOrSuite: resolved.floorOrSuite ?? '' })
            setLocationResolved(true)
            setConfirmError(null)
            setStep('details')
        } catch {
            setSearchError(
                "We couldn't look up that address — check your connection and try again.",
            )
        } finally {
            setResolving(false)
        }
    }

    function handleManualEntry() {
        setDraft((d) => ({ ...d, street: query.trim() || d.street }))
        setLocationResolved(false)
        setConfirmError(null)
        setStep('details')
    }

    async function handlePinMove(lat: number, lng: number) {
        // Moving the pin IS the merchant resolving their location — it's the
        // escape hatch for addresses Places can't find (new estates, depots,
        // unnamed service roads).
        setDraft((d) => ({ ...d, lat, lng }))
        setLocationResolved(true)
        setConfirmError(null)
        if (!reverseGeocode) return
        try {
            const resolved = await reverseGeocode(lat, lng)
            if (!resolved) return
            setDraft((d) => ({
                ...resolved,
                // Keep what the merchant typed by hand — reverse geocoding
                // never knows the unit number, and clobbering it is worse
                // than a stale suburb.
                floorOrSuite: d.floorOrSuite || (resolved.floorOrSuite ?? ''),
                lat,
                lng,
            }))
        } catch {
            // Best-effort: the pin has already set the coordinates, which is
            // the part that matters. A failed re-parse leaves the typed
            // fields alone rather than blocking the merchant.
        }
    }

    function setField(key: keyof ResolvedAddress, next: string) {
        setDraft((d) => ({ ...d, [key]: next }))
        setConfirmError(null)
    }

    function handleConfirm() {
        if (!draft.street.trim()) {
            setConfirmError('Add the street address before confirming.')
            return
        }
        if (requireResolvedLocation && !locationResolved) {
            setConfirmError(
                renderMap
                    ? 'Pick your address from the suggestions, or move the pin on the map, so we can locate your business accurately.'
                    : 'Pick your address from the suggestions so we can locate your business accurately.',
            )
            return
        }
        // State is checked separately from the location. It is not about the
        // pin — it is what timezone inference reads (AUT-575), so a booking
        // saved without it lands in the wrong zone. Checking it as part of the
        // location guard used to dead-end the merchant: with no
        // `reverseGeocode` wired up, moving the pin resolves the coordinates
        // but never fills the state, and the "move the pin" copy then asks
        // them to redo something they already did.
        if (requireResolvedLocation && !draft.state.trim()) {
            setConfirmError(
                'Add your state — we use it to keep your booking times in the right timezone.',
            )
            return
        }
        onConfirm({
            ...draft,
            street: draft.street.trim(),
            floorOrSuite: draft.floorOrSuite?.trim() || undefined,
            city: draft.city.trim(),
            state: draft.state.trim().toUpperCase(),
            postalCode: draft.postalCode.trim(),
        })
        onOpenChange(false)
    }

    const searchStep = (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
            <SearchInput
                autoFocus
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={searchPlaceholder}
            />

            {resolving ? (
                <AsyncSkeleton variant="list" count={1} rowHeight="h-14" />
            ) : searchError ? (
                <ErrorCard
                    message={searchError}
                    onRetry={() => setRetryToken((t) => t + 1)}
                />
            ) : searching ? (
                <AsyncSkeleton variant="list" count={4} rowHeight="h-14" />
            ) : query.trim() && suggestions.length === 0 ? (
                <EmptyState
                    title="No matching addresses"
                    description="Check the spelling, or enter the address yourself and drop the pin on the map."
                />
            ) : suggestions.length > 0 ? (
                <ul
                    role="listbox"
                    aria-label="Address suggestions"
                    className="-mx-1 flex max-h-[min(50vh,360px)] flex-col gap-1.5 overflow-y-auto px-1 py-0.5"
                >
                    {suggestions.map((s) => (
                        <li key={s.id}>
                            <button
                                type="button"
                                role="option"
                                aria-selected={false}
                                onClick={() => void handlePick(s)}
                                className={cn(
                                    'flex min-h-[44px] w-full items-start gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors',
                                    'border-[var(--border-subtle)] bg-[var(--surface)]',
                                    'hover:border-autara-purple/35',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]',
                                )}
                            >
                                <span
                                    aria-hidden="true"
                                    className="mt-0.5 shrink-0 text-[var(--text-subtle)]"
                                >
                                    <PinGlyph />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-[var(--text-strong)]">
                                        {s.primaryText}
                                    </span>
                                    {s.secondaryText ? (
                                        <span className="block truncate text-xs text-[var(--text-muted)]">
                                            {s.secondaryText}
                                        </span>
                                    ) : null}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="px-1 py-6 text-center text-sm text-[var(--text-muted)]">
                    Start typing your address — we&rsquo;ll suggest matches.
                </p>
            )}

            <button
                type="button"
                onClick={handleManualEntry}
                className={cn(
                    'min-h-[44px] w-full rounded-2xl border border-dashed px-4 py-3 text-sm font-medium transition-colors',
                    'border-[var(--border-subtle)] text-[var(--text-muted)]',
                    'hover:border-autara-purple/35 hover:text-[var(--text-strong)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]',
                )}
            >
                Enter address manually
            </button>
        </div>
    )

    const detailsStep = (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            <FormField label="Street address" htmlFor="address-street" required>
                <Input
                    id="address-street"
                    value={draft.street}
                    onChange={(e) => setField('street', e.target.value)}
                    autoComplete="street-address"
                />
            </FormField>

            {showFloorField ? (
                <FormField
                    label="Floor / unit"
                    htmlFor="address-floor"
                    description="Optional — helps customers find the right door."
                >
                    <Input
                        id="address-floor"
                        value={draft.floorOrSuite ?? ''}
                        onChange={(e) => setField('floorOrSuite', e.target.value)}
                        placeholder="Unit 4, Level 2"
                    />
                </FormField>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
                <FormField label="Suburb / city" htmlFor="address-city">
                    <Input
                        id="address-city"
                        value={draft.city}
                        onChange={(e) => setField('city', e.target.value)}
                        autoComplete="address-level2"
                    />
                </FormField>
                <FormField label="State" htmlFor="address-state">
                    <Input
                        id="address-state"
                        value={draft.state}
                        onChange={(e) => setField('state', e.target.value)}
                        autoComplete="address-level1"
                    />
                </FormField>
            </div>

            <FormField label="Postcode" htmlFor="address-postcode">
                <Input
                    id="address-postcode"
                    value={draft.postalCode}
                    onChange={(e) => setField('postalCode', e.target.value)}
                    inputMode="numeric"
                    autoComplete="postal-code"
                />
            </FormField>

            {renderMap ? (
                <div className="space-y-2">
                    <p className="text-sm text-[var(--text-muted)]">
                        Drag the pin to your entrance — this is where customers
                        will be sent.
                    </p>
                    <div className="h-56 w-full overflow-hidden rounded-2xl border border-[var(--border-subtle)]">
                        {renderMap({
                            lat: draft.lat,
                            lng: draft.lng,
                            onPinMove: (lat, lng) => void handlePinMove(lat, lng),
                        })}
                    </div>
                    {!locationResolved ? (
                        <p className="text-xs text-[var(--text-subtle)]">
                            Move the pin to set your exact location.
                        </p>
                    ) : null}
                </div>
            ) : null}

            {confirmError ? (
                <p
                    role="alert"
                    className="rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-2 text-sm text-rose-800"
                >
                    {confirmError}
                </p>
            ) : null}
        </div>
    )

    const footer =
        step === 'details' ? (
            <div className="flex shrink-0 gap-2 border-t border-[var(--border-subtle)] pt-4">
                <Button
                    variant="outline"
                    fullWidth
                    onClick={() => onOpenChange(false)}
                >
                    Cancel
                </Button>
                <Button variant="dark" fullWidth onClick={handleConfirm}>
                    {confirmLabel}
                </Button>
            </div>
        ) : null

    // Always offer the way back to search — including in edit mode, where the
    // picker opened straight to details. Gating this on `!value` looked
    // reasonable (there is no search step "behind" an edit) but broke the
    // single most important case: a merchant who moved premises could only
    // hand-retype the new address field by field, because the one affordance
    // that would let them search for it was hidden precisely because they
    // already had an address.
    const backButton =
        step === 'details' ? (
            <button
                type="button"
                onClick={() => {
                    setStep('search')
                    setConfirmError(null)
                }}
                className={cn(
                    'mb-1 inline-flex min-h-11 items-center gap-1 self-start rounded-autara-sm text-sm font-medium text-[var(--accent)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]'
                )}
            >
                <BackGlyph /> {value ? 'Search for a different address' : 'Search again'}
            </button>
        ) : null

    const body = (
        <>
            {step === 'search' ? searchStep : detailsStep}
            {footer}
        </>
    )

    // Radix auto-wires `aria-describedby` to a Description that only exists
    // when the caller passed `description`, and console-warns when that id
    // resolves to nothing. Explicitly passing `undefined` is the documented
    // opt-out — but it has to be *absent* (not `undefined`) when we do render
    // a Description, or it would strip Radix's own wiring. Hence the spread.
    const noDescription = description
        ? {}
        : ({ 'aria-describedby': undefined } as const)

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent
                    side="bottom"
                    {...noDescription}
                    className="flex max-h-[90vh] flex-col gap-3 px-6 pb-[calc(env(safe-area-inset-bottom)+16px)]"
                >
                    <SheetHeader className="px-0 pb-2">
                        {backButton}
                        <SheetTitle>
                            {step === 'search' ? title : 'Confirm your address'}
                        </SheetTitle>
                        {description ? (
                            <SheetDescription>{description}</SheetDescription>
                        ) : null}
                    </SheetHeader>
                    {body}
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                {...noDescription}
                className="flex max-h-[85vh] max-w-lg flex-col gap-3"
            >
                <DialogHeader>
                    {backButton}
                    <DialogTitle>
                        {step === 'search' ? title : 'Confirm your address'}
                    </DialogTitle>
                    {description ? (
                        <DialogDescription>{description}</DialogDescription>
                    ) : null}
                </DialogHeader>
                {body}
            </DialogContent>
        </Dialog>
    )
}
