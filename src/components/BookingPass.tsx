import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { initialsOf } from '../lib/initials'
import { MediaFrame } from './MediaFrame'

/**
 * BookingPass: a booking as a pass (AUTM-1797, graduated from customer-web
 * under AUTM-1799).
 *
 * Apple Wallet, Delta's boarding pass and Fresha's voucher answer who, what
 * and when without a sentence. On brand-deep: the pro's face (their photo,
 * or their initials, decision 3 of 2026-10-09), their name and the service,
 * an action beside them (the 44px message disc), then a tear line with two
 * notches and `when` (a WhenBlock). One card per booking, on the signed-in
 * booking screen and the emailed link.
 *
 * The name is a plain anchor when `href` is given: the package never imports
 * a router (a full navigation to the pro's public page is fine). No shadow:
 * the deep fill is the edge. A query container, so WhenBlock steps its figure
 * down at very large text (rem follows the reader's text size), under
 * 15.5rem of the pass's content box (a 320px screen less the paddings).
 */
export interface BookingPassProps {
    /** The pro's trading name. */
    name: string
    /** Their photo; their initials on brand when there is none. */
    photo?: string | null
    /** The pro's page, a tap on their name. */
    href?: string | null
    /** The service: "Paint correction, single stage". */
    sub?: ReactNode
    /** Beside the pro: their message disc, when messaging is open. */
    action?: ReactNode
    /** Under the tear line: a WhenBlock. Omit for a booking whose time is said elsewhere. */
    when?: ReactNode
    /** Accessible name of the section. */
    label?: string
    /** `data-testid` on the section. */
    testId?: string
    /** `data-testid` on the service line. */
    subTestId?: string
    className?: string
}

export function BookingPass({
    name,
    photo,
    href,
    sub,
    action,
    when,
    label = 'Your booking',
    testId,
    subTestId,
    className,
}: BookingPassProps) {
    const nameClass =
        'm-0 text-[1.125rem] leading-tight font-bold text-[var(--on-deep)] no-underline [overflow-wrap:break-word]'
    return (
        <section
            aria-label={label}
            data-testid={testId}
            data-slot="booking-pass"
            className={cn(
                '@container flex min-w-0 flex-col gap-4 rounded-[1.75rem] bg-[var(--brand-deep)] px-[1.125rem] pt-4 pb-[1.125rem] text-[var(--on-deep)]',
                className,
            )}
        >
            {/* The pass is its own container, so the fold is measured on its
                content box: 15.5rem there is a 20rem (320px) screen less the
                page's and the pass's padding (about 76px). It folds where the
                customer-web original folded, at very large text or on a phone
                of 320px or less, never at 390 or 375 at normal text. */}
            <div className="flex min-w-0 items-center gap-3.5 @max-[15.5rem]:flex-wrap">
                {/* The initials disc is brand on the deep pass, so the face reads as a face. */}
                <MediaFrame
                    shape="round"
                    src={photo}
                    alt=""
                    initials={initialsOf(name)}
                    className="size-14 [--brand-deep:var(--brand)]"
                />
                {/* Grows from its content (basis auto, not flex-1's 0), so at very
                    large text the row wraps: the face over the name, not the
                    name squeezed to a word a line beside it. */}
                <div className="flex min-w-0 flex-[1_1_auto] flex-col gap-0.5">
                    {href ? (
                        <a
                            href={href}
                            className={cn(
                                nameClass,
                                'relative inline-flex min-h-6 items-center self-start rounded-sm hover:underline hover:underline-offset-[0.2em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lime)]',
                                /* AUTM-1909 — the 44px floor (AUTM-622) as an unpainted hit area,
                                   the pattern FilterChipRow and Tabs use: the name is drawn at its
                                   text's height (24px at 100%), and was a 24px tap target. */
                                "before:absolute before:left-1/2 before:top-1/2 before:h-11 before:w-full before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
                            )}
                        >
                            {name}
                        </a>
                    ) : (
                        <p className={nameClass}>{name}</p>
                    )}
                    {sub ? (
                        <p
                            data-testid={subTestId}
                            className="m-0 text-[0.9375rem] leading-[1.35] text-[var(--on-deep-muted)] [overflow-wrap:break-word]"
                        >
                            {sub}
                        </p>
                    ) : null}
                </div>
                {action}
            </div>
            {when ? (
                <>
                    <span
                        aria-hidden
                        className="relative -mx-[1.125rem] block border-t-2 border-dashed border-[var(--hairline-deep)] before:absolute before:-top-[0.6875rem] before:-left-2.5 before:size-5 before:rounded-full before:bg-[var(--paper)] before:content-[''] after:absolute after:-top-[0.6875rem] after:-right-2.5 after:size-5 after:rounded-full after:bg-[var(--paper)] after:content-['']"
                    />
                    {when}
                </>
            ) : null}
        </section>
    )
}
