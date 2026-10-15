'use client'

import {
    cloneElement,
    forwardRef,
    isValidElement,
    type ButtonHTMLAttributes,
    type ReactElement,
    type ReactNode,
} from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '../lib/cn'

/**
 * BackButton — the unified back affordance (AUTM-365; AUTM-1756).
 *
 * AUTM-1756 (Don, 2026-10-15, beside a bare back chevron and the invoice
 * record's "< Invoice" pill, which he prefers): Back says where it goes.
 *
 *   - With `label` (the destination, "Invoice", "Bookings", "Inbox") it is a
 *     filled PILL: the chevron and the destination inside one 44px control
 *     (48px to a finger), the icon disc's fill (`--icon-disc`) and ink. Its
 *     accessible name is "Back to Invoice" (an sr-only "Back to" before the
 *     visible word), so it contains what is seen (WCAG 2.5.3) and says what
 *     it does.
 *   - Without `label`, or with `compact`, it is the bare chevron on the icon
 *     disc, IconButton's anatomy, named `ariaLabel` ("Back"). Use that only
 *     where there is no room for the word. `compact="phone"` is the pill from
 *     40rem up and the disc below it; the name stays "Back to Invoice".
 *
 * Hover and press are the icon disc's (utilities/icon-disc.css): the glyph's
 * colour laid over the fill, and a 97% press (`.motion-press`), opacity and
 * scale only, the scale off under reduced motion. Focus is the library ring:
 * full `--accent` with a 2px offset band.
 *
 * `tone="ondark"` is the translucent white disc for brand, brand-deep and ink
 * grounds.
 *
 * The chevron is Solar's AltArrowLeft (Linear), inlined: autara-ui must not
 * depend on @solar-icons/react.
 *
 * Polymorphic via Radix `Slot` (asChild): compose with a framework Link.
 * autara-ui never imports next/link or react-router-dom. The visual content
 * is intrinsic, so pass the link element EMPTY and BackButton fills it:
 *
 *   <BackButton asChild label="Bookings">
 *     <Link href="/account/bookings" />
 *   </BackButton>
 *
 * Native shells that need extra behaviour (haptics, history pop) keep a thin
 * app-side wrapper and compose this for the visuals.
 */

export interface BackButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Where Back goes ("Invoice"), shown in the pill. Leave it out for the bare disc. */
    label?: string
    /** Accessible name when icon-only and no `label` is given. Default "Back". */
    ariaLabel?: string
    /**
     * Draw the disc without the word, where there is no room: `true` always,
     * `"phone"` below 40rem. The name keeps the destination.
     */
    compact?: boolean | 'phone'
    /** `neutral` (default), or `ondark` on brand, brand-deep and ink grounds. */
    tone?: 'neutral' | 'ondark'
    /** Compose with another component (e.g. framework Link) via Radix Slot. */
    asChild?: boolean
}

const ChevronGlyph = () => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-5 shrink-0">
        <path
            d="M15 19l-7-7 7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const TONE = {
    neutral: 'bg-[var(--icon-disc)] text-[var(--on-icon-disc)]',
    ondark: 'bg-[var(--icon-disc-ondark)] text-[var(--on-icon-disc-ondark)]',
} as const

export const BackButton = forwardRef<HTMLButtonElement, BackButtonProps>(
    function BackButton(
        { label, ariaLabel = 'Back', compact = false, tone = 'neutral', asChild, className, children, ...rest },
        ref
    ) {
        const Comp = asChild ? Slot : 'button'
        const pill = Boolean(label) && compact !== true
        const phoneDisc = pill && compact === 'phone'

        const content = (
            <>
                <ChevronGlyph />
                {label ? (
                    pill ? (
                        <span
                            className={cn(
                                'min-w-0 truncate',
                                // Below 40rem the word goes; the name keeps it.
                                phoneDisc && 'max-sm:sr-only'
                            )}
                        >
                            <span className="sr-only">Back to </span>
                            {label}
                        </span>
                    ) : null
                ) : null}
            </>
        )

        /* With asChild the consumer passes the link element EMPTY; its
           children become our intrinsic content so Slot can merge the
           root props onto it. */
        const slotted =
            asChild && isValidElement(children)
                ? cloneElement(children as ReactElement<{ children?: ReactNode }>, undefined, content)
                : content

        return (
            <Comp
                ref={ref}
                // The pill is named by its words ("Back to Invoice"); the disc
                // by its label, the destination kept when it is compact.
                aria-label={pill ? undefined : label ? `Back to ${label}` : ariaLabel}
                title={pill ? undefined : label ? `Back to ${label}` : ariaLabel}
                data-shape={pill ? (phoneDisc ? 'pill-phone-disc' : 'pill') : 'disc'}
                className={cn(
                    'icon-disc motion-press relative isolate inline-flex shrink-0 cursor-pointer select-none items-center justify-center rounded-full',
                    'min-h-11 min-w-11 pointer-coarse:min-h-12 pointer-coarse:min-w-12',
                    TONE[tone],
                    pill
                        ? cn(
                              'max-w-full gap-1 py-2 pl-2.5 pr-4 text-[0.9375rem] font-medium leading-tight',
                              phoneDisc && 'max-sm:size-11 max-sm:p-0 max-sm:pointer-coarse:size-12'
                          )
                        : 'size-11 p-0 pointer-coarse:size-12',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
                    className
                )}
                {...(asChild ? rest : { type: 'button' as const, ...rest })}
            >
                {slotted}
            </Comp>
        )
    }
)

BackButton.displayName = 'BackButton'
