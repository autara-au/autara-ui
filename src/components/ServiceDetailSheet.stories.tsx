import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ServiceDetailSheet, type ServiceDetailSheetProps } from './ServiceDetailSheet'
import { ServiceCard } from './ServiceCard'
import { Button } from './Button'
import {
    DROP_OFF_TAG,
    listingPrice,
    serviceDurationLabel,
    serviceLocationLabel,
    workingDaysLabel,
} from '../lib/service-listing'

/**
 * AUTM-1866: the sheet a menu card opens (Don, 2026-10-14). Photo, the full
 * description, duration and where, the all-in total with its fee line, and
 * Book: a solid brand purple pill with a trailing arrow. A bottom sheet on a
 * phone, a centred card from `sm`. Check each at the phone and desktop
 * viewports and in the Theme toolbar's dark.
 */
const meta = {
    title: 'Marketplace/ServiceDetailSheet',
    component: ServiceDetailSheet,
    parameters: { layout: 'fullscreen' },
    args: {
        open: true,
        onOpenChange: () => {},
        name: 'Tyre shine',
        description:
            'Tyres cleaned and dressed with a water-based shine that dries to a satin finish, never greasy.\nSafe on every tyre wall, and it will not sling onto the paint.',
        coverImageUrl: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=70',
        durationLabel: '15 min',
        locationLabel: 'At the workshop',
        priceLabel: '$10.99',
        priceNote: 'incl. $0.99 booking fee',
        bookHref: '#book-tyre-shine',
    },
} satisfies Meta<typeof ServiceDetailSheet>

export default meta
type Story = StoryObj<typeof meta>

/** Open, reopen from the button behind it. */
function Opened(args: Story['args']) {
    const [open, setOpen] = useState(true)
    return (
        <div className="p-6">
            <Button variant="quiet" onClick={() => setOpen(true)}>
                Open the service
            </Button>
            <ServiceDetailSheet {...(args as ServiceDetailSheetProps)} open={open} onOpenChange={setOpen} />
        </div>
    )
}

/** With a photo and a booking fee. */
export const Default: Story = { render: (args) => <Opened {...args} /> }

/** No photo, no placeholder: the text starts under the title. */
export const NoPhoto: Story = { args: { coverImageUrl: null }, render: (args) => <Opened {...args} /> }

/** A long description scrolls in the body; the title and the foot stay put. */
export const LongDescription: Story = {
    args: {
        name: 'Interior steam clean',
        description:
            'Hot-water extraction on carpets and cloth seats, leather cleaned and conditioned, headliner spot-cleaned, every vent and seam steamed, glass inside and out, and the boot done the same way.\n\nWe bring our own water and power, so it can be done in a driveway or a car park. Allow the seats an hour to dry before a long drive.\n\nPet hair is removed with rubber blades before the extraction, so it does not mat into the carpet. Child seats can be taken out and done separately on request.\n\nAnything left in the car is bagged and put on the passenger seat.',
        coverImageUrl: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1200&q=70',
        durationLabel: '2 hr',
        priceLabel: '$188.82',
        priceNote: 'incl. $8.82 booking fee',
    },
    render: (args) => <Opened {...args} />,
}

/** No fee charged: the price alone. */
export const NoFee: Story = { args: { priceLabel: '$10', priceNote: null }, render: (args) => <Opened {...args} /> }

/** A pro who comes to you or works at the workshop. Approved to wrap on a phone. */
export const ComesToYou: Story = {
    args: { locationLabel: serviceLocationLabel(['MOBILE', 'WORKSHOP']) },
    render: (args) => <Opened {...args} />,
}

/** A multi-day job: working days and the drop-off tag on the meta line. */
export const MultiDay: Story = {
    args: {
        name: 'Ceramic coating, two layers',
        description: 'Decontamination, a single-stage polish and two layers of coating, cured overnight between them.',
        coverImageUrl: null,
        durationLabel: null,
        locationLabel: null,
        workingDaysLabel: workingDaysLabel(3),
        chips: [{ label: DROP_OFF_TAG }],
        priceLabel: '$944.10',
        priceNote: 'incl. $44.10 booking fee',
    },
    render: (args) => <Opened {...args} />,
}

/** Not bookable yet: the price alone, no Book. */
export const NotBookable: Story = {
    args: { bookHref: undefined, priceLabel: 'Price on request', priceNote: null },
    render: (args) => <Opened {...args} />,
}

/** Dark. */
export const Dark: Story = {
    globals: { theme: 'dark' },
    parameters: { backgrounds: { default: 'Paper, dark' } },
    render: (args) => <Opened {...args} />,
}

/* ─── In context ──────────────────────────────────────────────────────── */

type Row = {
    id: string
    name: string
    description?: string
    photo?: string
    minutes: number
    days?: number
    serviceCents: number
    feeCents: number
}

const ROWS: Row[] = [
    { id: 'tyre', name: 'Tyre shine', description: 'Tyres cleaned and dressed with a water-based shine that dries to a satin finish.', photo: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=900&q=70', minutes: 15, serviceCents: 1000, feeCents: 99 },
    { id: 'interior', name: 'Interior steam clean', description: 'Hot-water extraction on carpets and cloth seats, leather cleaned and conditioned, headliner spot-cleaned, every vent and seam steamed.', photo: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=900&q=70', minutes: 120, serviceCents: 18000, feeCents: 882 },
    { id: 'ceramic', name: 'Ceramic coating, two layers', description: 'Decontamination, a single-stage polish and two layers of coating, cured overnight.', minutes: 4320, days: 3, serviceCents: 90000, feeCents: 4410 },
    { id: 'headlights', name: 'Headlight restoration', minutes: 60, serviceCents: 12000, feeCents: 588 },
]

/** One service's words, from the library's helpers, for the card and the sheet alike. */
function words(row: Row, modes: string[]) {
    const price = listingPrice({
        priceCents: row.serviceCents,
        priceBreakdown: {
            bookingFeeLabel: 'Booking fee',
            serviceTotalCents: row.serviceCents,
            bookingFeeTotalCents: row.feeCents,
            totalCents: row.serviceCents + row.feeCents,
        },
    })
    const multiDay = row.days != null
    return {
        name: row.name,
        description: row.description,
        coverImageUrl: row.photo,
        durationLabel: multiDay ? null : serviceDurationLabel(row.minutes),
        workingDaysLabel: multiDay ? workingDaysLabel(row.days as number) : null,
        locationLabel: multiDay ? null : serviceLocationLabel(modes),
        chips: multiDay ? [{ label: DROP_OFF_TAG }] : undefined,
        priceLabel: price.headline,
        priceNote: price.note,
    }
}

/**
 * The pro's page: tap a card to read the service in the sheet; Book on the
 * card or in the sheet goes to checkout. The card and its Book are two focus
 * stops; Escape closes the sheet and focus returns to the card.
 */
export const OnTheProPage: Story = {
    render: function Render() {
        const [openId, setOpenId] = useState<string | null>('tyre')
        const open = ROWS.find((r) => r.id === openId)
        return (
            <section aria-labelledby="pro-services" className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
                <h2 id="pro-services" className="mb-4 text-xl font-bold text-[var(--text-strong)]">
                    Services
                </h2>
                <ul className="service-card-grid service-card-grid--adaptive" role="list">
                    {ROWS.map((row) => (
                        <li key={row.id}>
                            <ServiceCard
                                layout="menu"
                                {...words(row, ['WORKSHOP'])}
                                onOpen={() => setOpenId(row.id)}
                                bookHref={`#book-${row.id}`}
                                testIds={{ action: 'merchant-profile-service-book', book: 'merchant-profile-service-book-pill' }}
                            />
                        </li>
                    ))}
                </ul>
                {open ? (
                    <ServiceDetailSheet
                        open={Boolean(openId)}
                        onOpenChange={(next) => (next ? null : setOpenId(null))}
                        {...words(open, ['WORKSHOP'])}
                        bookHref={`#book-${open.id}`}
                        testId="merchant-profile-service-sheet"
                        testIds={{ book: 'merchant-profile-service-sheet-book' }}
                    />
                ) : null}
            </section>
        )
    },
}

/**
 * The booking picker: tap a card to read it in the sheet; the state light
 * chooses without opening; Book in the sheet chooses and continues.
 */
export const InThePicker: Story = {
    render: function Render() {
        const [chosen, setChosen] = useState<string | null>(null)
        const [openId, setOpenId] = useState<string | null>('interior')
        const [went, setWent] = useState<string | null>(null)
        const open = ROWS.find((r) => r.id === openId)
        return (
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
                <h1 id="picker-heading" className="text-[1.75rem] font-black leading-tight text-[var(--text-strong)]">
                    Pick a service
                </h1>
                <div role="radiogroup" aria-labelledby="picker-heading" className="mt-6">
                    <ul className="service-card-grid service-card-grid--adaptive" role="list">
                        {ROWS.map((row) => (
                            <li key={row.id} data-testid="booking-service-select">
                                <ServiceCard
                                    layout="menu"
                                    nameAs="h2"
                                    {...words(row, ['MOBILE', 'WORKSHOP'])}
                                    groupName="picker-sheet"
                                    value={row.id}
                                    selected={chosen === row.id}
                                    onSelect={() => setChosen(row.id)}
                                    onOpen={() => setOpenId(row.id)}
                                    testIds={{ action: 'booking-service-radio', open: 'booking-service-open' }}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="mt-6 text-sm text-[var(--text-muted)]" aria-live="polite">
                    {went ? `Continuing to checkout with ${went}` : chosen ? `${ROWS.find((r) => r.id === chosen)?.name} selected` : 'Choose a service to continue'}
                </p>
                {open ? (
                    <ServiceDetailSheet
                        open={Boolean(openId)}
                        onOpenChange={(next) => (next ? null : setOpenId(null))}
                        {...words(open, ['MOBILE', 'WORKSHOP'])}
                        onBook={() => {
                            setChosen(open.id)
                            setOpenId(null)
                            setWent(open.name)
                        }}
                        testId="booking-service-sheet"
                        testIds={{ book: 'booking-service-sheet-book' }}
                    />
                ) : null}
            </div>
        )
    },
}
