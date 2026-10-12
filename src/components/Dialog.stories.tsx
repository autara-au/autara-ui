import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './Dialog'
import { FormField } from './FormField'
import { Input } from './Input'
import { InlineAlert } from './InlineAlert'

/**
 * Dialog — Radix dialog on the cream canvas.
 *
 * - `--surface` (white) fill, `--text-strong` ink, hairline ring.
 * - Ink overlay at 55% opacity, no backdrop blur — flat editorial scrim.
 * - Solar Bold close at the top-right.
 *
 * Header / Footer / Title / Description are typographic helpers — pick
 * the ones you need and arrange freely inside `DialogContent`.
 */
const meta: Meta = {
    title: 'Atoms/Dialog',
    parameters: { layout: 'centered' },
}
export default meta
type Story = StoryObj

// ─── Default — confirm action ──────────────────────────────────────
export const ConfirmAction: Story = {
    render: () => (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Confirm action
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cancel this booking?</DialogTitle>
                    <DialogDescription>
                        The customer will be refunded the $25 deposit
                        immediately. You won&apos;t be able to undo this
                        action.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" size="sm">
                        Keep booking
                    </Button>
                    <Button variant="destructive" size="sm">
                        Cancel booking
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ),
}

// ─── With form fields ──────────────────────────────────────────────
export const WithForm: Story = {
    render: () => (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="dark" size="sm">
                    Edit service
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit service</DialogTitle>
                    <DialogDescription>
                        Change the name and base price. Customers see the
                        update next time they open your profile.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                    <label className="grid gap-1.5">
                        <span className="text-[0.8125rem] font-medium text-[var(--text-muted)]">
                            Service name
                        </span>
                        <input
                            defaultValue="Full interior detail"
                            className="h-10 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--color-autara-purple)]/35 focus:ring-2 focus:ring-[var(--color-autara-purple)]/15"
                        />
                    </label>
                    <label className="grid gap-1.5">
                        <span className="text-[0.8125rem] font-medium text-[var(--text-muted)]">
                            Base price (AUD)
                        </span>
                        <input
                            defaultValue="129"
                            inputMode="numeric"
                            className="h-10 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--color-autara-purple)]/35 focus:ring-2 focus:ring-[var(--color-autara-purple)]/15"
                        />
                    </label>
                </div>
                <DialogFooter>
                    <Button variant="outline" size="sm">
                        Cancel
                    </Button>
                    <Button variant="dark" size="sm">
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ),
}

// ─── Long content — proves scroll behaviour inside content ─────────
export const LongContent: Story = {
    render: () => (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Read terms
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Merchant terms — summary</DialogTitle>
                    <DialogDescription>
                        Highlights from the merchant terms. Full text linked
                        below.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
                    {[
                        'You keep the full price of every booking. The customer pays the booking fee on top.',
                        'Payouts settle weekly to your linked Stripe Connect account.',
                        'Bookings unconfirmed after 30 minutes auto-expire and release the customer hold.',
                        'Disputes opened within 24 hours of completion are reviewed by Autara support; outcomes published within 7 days.',
                        'Suspension can occur for repeated no-shows, fraudulent ABN, or safety-related complaints.',
                    ].map((p, i) => (
                        <p key={i}>{p}</p>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" size="sm">
                        View full terms
                    </Button>
                    <Button variant="dark" size="sm">
                        I agree
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ),
}

/* ─── layout="responsive" (AUTM-1594) ───────────────────────────────────
 *
 * A bottom sheet below `sm` and a centred card from `sm`, header and actions
 * pinned, the body scrolling between them. Switch the Storybook viewport to
 * iPhone SE (375) and Desktop to see both, and the Theme toolbar for dark.
 *
 * These open on load so the layout can be checked without a click, and stay
 * off the docs page (`!autodocs`), where an open modal would sit over every
 * other story. `Responsive, from a trigger` is the one to use for the
 * motion, focus return and Escape.
 */

function MapPlaceholder() {
    return (
        <div
            aria-hidden
            className="relative grid h-56 w-full place-items-center overflow-hidden rounded-2xl bg-[var(--band)] sm:h-72"
        >
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" className="text-[var(--accent)]">
                <path d="M12 2a7.5 7.5 0 0 0-7.5 7.5c0 5.25 6.6 11.7 6.9 12a.85.85 0 0 0 1.2 0c.3-.3 6.9-6.75 6.9-12A7.5 7.5 0 0 0 12 2Zm0 10.25a2.75 2.75 0 1 1 0-5.5 2.75 2.75 0 0 1 0 5.5Z" />
            </svg>
        </div>
    )
}

/** The form in merchant-web's Business address dialog, the reference. */
function AddressForm({ error }: { error?: string }) {
    return (
        <div className="flex flex-col gap-4">
            <FormField label="Street address">
                <Input defaultValue="14 Pitt Street" autoComplete="address-line1" />
            </FormField>
            <FormField label="Floor or suite (optional)">
                <Input placeholder="Floor, suite, unit" autoComplete="address-line2" />
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="City">
                    <Input defaultValue="Sydney" autoComplete="address-level2" />
                </FormField>
                <FormField label="Postal code">
                    <Input defaultValue="2000" inputMode="numeric" autoComplete="postal-code" />
                </FormField>
            </div>
            <div className="flex flex-col gap-2">
                <p className="m-0 text-[0.9375rem] text-[var(--text-muted)]">
                    Drag the pin to your entrance, or tap the map to move it.
                </p>
                <MapPlaceholder />
            </div>
            {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
        </div>
    )
}

function AddressDialog({
    defaultOpen = true,
    error,
    trigger,
}: {
    defaultOpen?: boolean
    error?: string
    trigger?: React.ReactNode
}) {
    return (
        <Dialog defaultOpen={defaultOpen}>
            {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
            <DialogContent layout="responsive" size="lg" data-testid="story-address-dialog">
                <DialogHeader>
                    <DialogTitle>Business address</DialogTitle>
                    <DialogDescription>
                        Where customers find you. Only shown once a booking is paid.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <AddressForm error={error} />
                </DialogBody>
                <DialogFooter>
                    <Button variant="quiet">Cancel</Button>
                    <Button>Confirm address</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/**
 * In context: merchant-web's Business address dialog, the pattern this layout
 * graduates. A form and a map, taller than a phone. On a phone the body
 * scrolls under the title and the hairline appears under it once it does.
 */
export const Responsive: Story = {
    name: 'Responsive, Business address in context',
    tags: ['!autodocs'],
    parameters: { layout: 'fullscreen' },
    render: () => <AddressDialog />,
}

/** The same dialog, from its trigger: the motion, focus return and Escape. */
export const ResponsiveFromTrigger: Story = {
    name: 'Responsive, from a trigger',
    render: () => (
        <AddressDialog
            defaultOpen={false}
            trigger={<Button>Edit business address</Button>}
        />
    ),
}

/** Dark theme, stamped on `<html>` the way a consuming app does it. */
export const ResponsiveDark: Story = {
    name: 'Responsive, dark',
    tags: ['!autodocs'],
    globals: { theme: 'dark' },
    parameters: { layout: 'fullscreen' },
    render: () => <AddressDialog error="We couldn't place that address. Check the street and postcode, then try again." />,
}

/**
 * A dialog that fits. Short content sizes the panel to itself: no empty
 * space, and no hairline under the title because nothing scrolls under it.
 */
export const ResponsiveShort: Story = {
    name: 'Responsive, content that fits',
    tags: ['!autodocs'],
    parameters: { layout: 'fullscreen' },
    render: () => (
        <Dialog defaultOpen>
            <DialogContent layout="responsive">
                <DialogHeader>
                    <DialogTitle>Pause new bookings?</DialogTitle>
                    <DialogDescription>
                        Your profile stays up. Customers see you are back from the date you choose.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <FormField label="Back from">
                        <Input type="date" defaultValue="2026-10-13" />
                    </FormField>
                </DialogBody>
                <DialogFooter>
                    <Button variant="quiet">Keep taking bookings</Button>
                    <Button>Pause</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ),
}

const SUBURBS = [
    'Alexandria', 'Annandale', 'Balmain', 'Bondi', 'Bronte', 'Camperdown', 'Chippendale',
    'Coogee', 'Darlinghurst', 'Erskineville', 'Glebe', 'Leichhardt', 'Marrickville',
    'Newtown', 'Paddington', 'Potts Point', 'Pyrmont', 'Redfern', 'Rozelle', 'Surry Hills',
    'Waterloo', 'Woollahra', 'Zetland',
]

/**
 * Edge: a long list. Only the body scrolls; the title and both actions stay
 * on screen at every height. Scroll it to see the header's hairline arrive.
 */
export const ResponsiveLongList: Story = {
    name: 'Responsive, long list',
    tags: ['!autodocs'],
    parameters: { layout: 'fullscreen' },
    render: () => (
        <Dialog defaultOpen>
            <DialogContent layout="responsive">
                <DialogHeader>
                    <DialogTitle>Suburbs you travel to</DialogTitle>
                    <DialogDescription>Customers in these suburbs can book you to come to them.</DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <ul className="m-0 flex list-none flex-col p-0">
                        {SUBURBS.map((name, i) => (
                            <li key={name}>
                                <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 border-b border-[var(--hairline)] py-2 text-base">
                                    {name}
                                    <input type="checkbox" defaultChecked={i % 3 === 0} className="size-5 accent-[var(--accent-fill)]" />
                                </label>
                            </li>
                        ))}
                    </ul>
                </DialogBody>
                <DialogFooter>
                    <Button variant="quiet">Clear all</Button>
                    <Button>Save 8 suburbs</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ),
}

/**
 * Edge: a title long enough to wrap, and two long action labels. The title
 * stays clear of the close control, and when the two actions cannot sit side
 * by side they stack with the primary on top.
 */
export const ResponsiveLongCopy: Story = {
    name: 'Responsive, long title and labels',
    tags: ['!autodocs'],
    parameters: { layout: 'fullscreen' },
    render: () => (
        <Dialog defaultOpen>
            <DialogContent layout="responsive">
                <DialogHeader>
                    <DialogTitle>Move every booking on Saturday 11 October to the following week?</DialogTitle>
                    <DialogDescription>
                        Each customer is asked to approve the new time. Anyone who declines keeps their original booking.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <p className="m-0 text-[0.9375rem] text-[var(--text-muted)]">
                        Four bookings are affected. Requests expire after 24 hours.
                    </p>
                </DialogBody>
                <DialogFooter>
                    <Button variant="quiet">Keep Saturday as it is</Button>
                    <Button>Ask customers to move to the following Saturday</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ),
}

/**
 * Edge: 200% text. Scales the ROOT font size, as OS text scaling does (a
 * wrapper's font size would scale nothing sized in rem). The panel stays
 * inside the viewport, the body scrolls, and the actions stack when they no
 * longer fit side by side.
 */
export const ResponsiveText200: Story = {
    name: 'Responsive, 200% text',
    tags: ['!autodocs'],
    parameters: { layout: 'fullscreen' },
    render: function ResponsiveText200Story() {
        React.useEffect(() => {
            const prev = document.documentElement.style.fontSize
            document.documentElement.style.fontSize = '200%'
            return () => {
                document.documentElement.style.fontSize = prev
            }
        }, [])
        return <AddressDialog />
    },
}

/**
 * AUTM-1768: opened from state, with no `DialogTrigger`, the way most
 * consumer dialogs are (a Confirm button that sets `open`). Tab to "Confirm
 * booking", press Enter, then Escape: focus lands back on "Confirm booking",
 * not at the top of the page. Before this, Radix had no trigger to return to
 * and focus fell to `<body>`.
 */
export const FocusReturnsWithoutTrigger: Story = {
    name: 'Focus returns, opened from state',
    render: function FocusReturnsWithoutTriggerStory() {
        const [open, setOpen] = React.useState(false)
        return (
            <div className="flex flex-col items-start gap-3">
                <Button variant="quiet">Message customer</Button>
                <Button onClick={() => setOpen(true)}>
                    Confirm booking
                </Button>
                <Button variant="quiet">Decline</Button>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent layout="responsive">
                        <DialogHeader>
                            <DialogTitle>Confirm this booking?</DialogTitle>
                            <DialogDescription>
                                Sam is told straight away and the time is held for them.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="quiet" onClick={() => setOpen(false)}>
                                Not yet
                            </Button>
                            <Button onClick={() => setOpen(false)}>
                                Confirm
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        )
    },
}
