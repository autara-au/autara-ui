import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import {
    AddressPickerSheet,
    type AddressMapRenderProps,
    type AddressSuggestion,
    type ResolvedAddress,
} from './AddressPickerSheet'
import { Button } from './Button'

const meta: Meta = {
    title: 'Molecules/AddressPickerSheet',
    parameters: { layout: 'centered' },
}
export default meta
type Story = StoryObj

// ─── Fake provider ────────────────────────────────────────────────────────
// Stands in for Google Places. The component is deliberately provider-
// agnostic (see the file header), which is exactly what makes it storyable
// without a Maps API key — the same reason the consumer's Google adapter can
// be swapped later without touching this component.

const FIXTURES: Array<AddressSuggestion & { resolved: ResolvedAddress }> = [
    {
        id: 'p1',
        primaryText: '14 Rokeby Street',
        secondaryText: 'Collingwood VIC 3066, Australia',
        resolved: {
            street: '14 Rokeby Street',
            city: 'Collingwood',
            state: 'VIC',
            postalCode: '3066',
            country: 'AU',
            lat: -37.8003,
            lng: 144.9878,
        },
    },
    {
        id: 'p2',
        primaryText: '140 Rokeby Road',
        secondaryText: 'Subiaco WA 6008, Australia',
        resolved: {
            street: '140 Rokeby Road',
            city: 'Subiaco',
            state: 'WA',
            postalCode: '6008',
            country: 'AU',
            lat: -31.9469,
            lng: 115.8262,
        },
    },
    {
        id: 'p3',
        primaryText: '3 Rokeby Place',
        secondaryText: 'Bentleigh East VIC 3165, Australia',
        resolved: {
            street: '3 Rokeby Place',
            city: 'Bentleigh East',
            state: 'VIC',
            postalCode: '3165',
            country: 'AU',
            lat: -37.9226,
            lng: 145.0561,
        },
    },
]

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
    await wait(450)
    const q = query.toLowerCase()
    return FIXTURES.filter(
        (f) =>
            f.primaryText.toLowerCase().includes(q) ||
            (f.secondaryText ?? '').toLowerCase().includes(q),
    ).map(({ id, primaryText, secondaryText }) => ({ id, primaryText, secondaryText }))
}

async function resolveSuggestion(id: string): Promise<ResolvedAddress | null> {
    await wait(300)
    return FIXTURES.find((f) => f.id === id)?.resolved ?? null
}

async function reverseGeocode(lat: number, lng: number): Promise<ResolvedAddress> {
    await wait(250)
    return {
        street: '22 Peel Street',
        city: 'Collingwood',
        state: 'VIC',
        postalCode: '3066',
        country: 'AU',
        lat,
        lng,
    }
}

/** Stands in for the consumer's real map. Clicking moves the "pin". */
function FakeMap({ lat, lng, onPinMove }: AddressMapRenderProps) {
    return (
        <button
            type="button"
            onClick={() => onPinMove(lat + 0.0012, lng + 0.0009)}
            className="grid h-full w-full place-items-center bg-[var(--surface-warm,#F5F2EA)] text-center"
        >
            <span className="text-xs text-[var(--text-muted)]">
                (map stands in for Google Maps)
                <br />
                <span className="font-medium text-[var(--text-strong)]">
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                </span>
                <br />
                tap to move the pin
            </span>
        </button>
    )
}

// ─── Harness ──────────────────────────────────────────────────────────────

function Harness({
    initial = null,
    ...overrides
}: {
    initial?: ResolvedAddress | null
} & Partial<React.ComponentProps<typeof AddressPickerSheet>>) {
    const [open, setOpen] = React.useState(false)
    const [saved, setSaved] = React.useState<ResolvedAddress | null>(initial)

    return (
        <div className="w-full max-w-[420px] space-y-4">
            <Button variant="dark" onClick={() => setOpen(true)}>
                {saved ? 'Change address' : 'Set business address'}
            </Button>

            {saved ? (
                <pre className="overflow-x-auto rounded-xl bg-[var(--band)] p-3 text-xs text-[var(--text-muted)]">
                    {JSON.stringify(saved, null, 2)}
                </pre>
            ) : (
                <p className="text-sm text-[var(--text-muted)]">Nothing saved yet.</p>
            )}

            <AddressPickerSheet
                open={open}
                onOpenChange={setOpen}
                value={saved}
                onConfirm={setSaved}
                searchAddresses={searchAddresses}
                resolveSuggestion={resolveSuggestion}
                reverseGeocode={reverseGeocode}
                renderMap={(p) => <FakeMap {...p} />}
                {...overrides}
            />
        </div>
    )
}

// ─── Stories ──────────────────────────────────────────────────────────────

/** Type "rokeby" to see the debounced search, then pick a suggestion. */
export const Default: Story = {
    render: () => <Harness />,
}

/**
 * Edit mode — an address already exists, so the picker opens straight to the
 * details step with the location trusted (it passed the guard on the way in).
 *
 * "Search for a different address" must be present here. This is the merchant
 * who moved premises: without it they can only retype the new address field by
 * field, and the affordance that would let them search for it is hidden
 * precisely because they already have one. Found by the merchant-mobile
 * integration pass, not by reading the code.
 */
export const EditingAnExistingAddress: Story = {
    render: () => (
        <Harness
            initial={{
                street: '14 Rokeby Street',
                floorOrSuite: 'Unit 2',
                city: 'Collingwood',
                state: 'VIC',
                postalCode: '3066',
                country: 'AU',
                lat: -37.8003,
                lng: 144.9878,
            }}
        />
    ),
}

/**
 * The AUTM-374 guard. Tap "Enter address manually", type a street, and try to
 * confirm — it refuses until the pin is moved, because nothing has resolved a
 * real location yet. This is the case that previously geolocated every
 * typed-only merchant at the map's default center.
 */
export const FabricatedLocationIsRefused: Story = {
    render: () => <Harness />,
}

/**
 * No map provider. The fields still work, but a manually-entered address can
 * never be confirmed — there is nothing that could resolve its coordinates,
 * and the copy says so instead of failing silently.
 */
export const WithoutAMap: Story = {
    render: () => <Harness renderMap={undefined} />,
}

/** Search provider is down — error fold with a working Retry. */
export const SearchFails: Story = {
    render: () => (
        <Harness
            searchAddresses={async () => {
                await wait(300)
                throw new Error('places unavailable')
            }}
        />
    ),
}

/** Nothing matches — empty fold points at the manual-entry escape hatch. */
export const NoResults: Story = {
    render: () => <Harness searchAddresses={async () => { await wait(300); return [] }} />,
}

/**
 * A picked suggestion that can't be resolved to coordinates. Surfaces an
 * error rather than advancing to a half-filled form.
 */
export const SuggestionCannotBeResolved: Story = {
    render: () => <Harness resolveSuggestion={async () => { await wait(250); return null }} />,
}

/**
 * In context — the merchant business-profile row this was built for. The row
 * shows the saved address; tapping it opens the picker.
 */
export const InMerchantBusinessProfile: Story = {
    render: function InContext() {
        const [open, setOpen] = React.useState(false)
        const [address, setAddress] = React.useState<ResolvedAddress | null>({
            street: '14 Rokeby Street',
            floorOrSuite: 'Unit 2',
            city: 'Collingwood',
            state: 'VIC',
            postalCode: '3066',
            country: 'AU',
            lat: -37.8003,
            lng: 144.9878,
        })

        return (
            <div className="w-full max-w-[420px] rounded-[1.5rem] bg-[var(--band)] p-5">
                <p className="text-[0.8125rem] font-medium text-[var(--text-subtle)]">
                    Business profile
                </p>
                <h2 className="mt-1.5 text-xl font-bold text-[var(--text-strong)]">
                    Where you work from
                </h2>

                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="mt-4 flex min-h-[44px] w-full items-center justify-between gap-3 rounded-2xl bg-[var(--raised)] px-4 py-3 text-left transition-colors hover:bg-[var(--band-press)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-autara-purple/35 focus-visible:ring-offset-2"
                >
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-[var(--text-strong)]">
                            {address ? address.street : 'Add your business address'}
                        </span>
                        <span className="block truncate text-xs text-[var(--text-muted)]">
                            {address
                                ? [address.floorOrSuite, address.city, address.state, address.postalCode]
                                      .filter(Boolean)
                                      .join(', ')
                                : 'Customers use this to find you'}
                        </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium text-autara-purple">
                        {address ? 'Change' : 'Add'}
                    </span>
                </button>

                <AddressPickerSheet
                    open={open}
                    onOpenChange={setOpen}
                    value={address}
                    onConfirm={setAddress}
                    searchAddresses={searchAddresses}
                    resolveSuggestion={resolveSuggestion}
                    reverseGeocode={reverseGeocode}
                    renderMap={(p) => <FakeMap {...p} />}
                />
            </div>
        )
    },
}
