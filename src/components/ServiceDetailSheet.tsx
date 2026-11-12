'use client'

import { Fragment, useId, useRef, useState, type ElementType, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { buttonVariants } from './Button'
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './Dialog'
import { ArrowRightIcon, type ServiceCardChip } from './ServiceCard'

/**
 * ServiceDetailSheet: one service, read in full, then booked (AUTM-1866).
 *
 * Don, 2026-10-14: tapping a service card (`ServiceCard layout="menu"`, with
 * `onOpen`) opens a simple detail sheet. It has the photo, the full description,
 * the duration and where, the price with its fee line, and Book. It is the
 * same sheet on a pro's page and in the booking picker, so it lives here. Its
 * words come from the same helpers as the card (`listingPrice().note`,
 * `serviceDurationLabel`, `serviceLocationLabel`), so the two never disagree.
 *
 * References (the PR carries the links and verdicts): Insight Timer's room
 * sheet (photo, then the title, then the full text: steal); Fresha's package
 * sheet (a large title over a dot-joined meta line: steal); Fresha's web
 * picker (the price beside the action at the foot: adapt).
 *
 * Layout: Dialog `layout="responsive"`, a bottom sheet on a phone and a
 * centred card from `sm`, so the motion, reduced motion, focus return, Escape
 * and the 200% text behaviour are the Dialog's. The title is Satoshi 900 (a
 * sheet title). The meta line is the sheet's description, so a screen reader
 * hears "Tyre shine, dialog, 15 min · At the workshop". The body (the photo
 * and the full description) is the part that scrolls. The foot is pinned: the
 * all-in total, with the fee on one small line, and Book.
 *
 * Book is the card's own Book: a solid brand purple pill with a white label
 * and a trailing arrow (`--accent-fill` under `--on-accent`, 4.5:1 in both
 * themes), never lime, which stays the page's one primary. It is a link
 * through `as` (`bookHref`) or a button (`onBook`). With neither, the
 * service is not bookable, and the foot shows the price alone.
 *
 * No photo, no placeholder: the text starts at the top. A photo that fails to
 * load removes its box.
 */

export interface ServiceDetailSheetTestIds {
    /** The title (the service's name). */
    title?: string
    /** The meta line: duration or working days, where, and any chips. */
    meta?: string
    /** The full description. */
    description?: string
    /** The headline price. */
    price?: string
    /** The one line under the price, e.g. "incl. $0.99 booking fee". */
    priceNote?: string
    /** Book. */
    book?: string
}

export interface ServiceDetailSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    name: string
    /** In full, line breaks kept. */
    description?: string | null
    /** CDN URL for the photo, in a plain <img>. Prefer `media` in Next. */
    coverImageUrl?: string | null
    /** The consumer's own image element (e.g. next/image with `fill`), placed in a positioned box. Wins over `coverImageUrl`. */
    media?: ReactNode
    /** "45 min". */
    durationLabel?: string | null
    /** "3 working days", for a multi-day job. */
    workingDaysLabel?: string | null
    /** "At the workshop", "Comes to you" (`serviceLocationLabel`). */
    locationLabel?: string | null
    /** More parts of the meta line, e.g. the drop-off tag. Icons are not drawn. */
    chips?: ReadonlyArray<ServiceCardChip>
    /** The headline: the all-in total, pre-formatted. */
    priceLabel: string
    /** e.g. "From". */
    pricePrefix?: string
    /** ONE small line under the total, e.g. "incl. $0.99 booking fee" (`listingPrice().note`). */
    priceNote?: string | null
    /** Default "Book". */
    bookLabel?: string
    /** Book as a link, through `as` (e.g. Next's `Link`). */
    bookHref?: string
    /** The link component for `bookHref`. Default `a`. */
    as?: ElementType
    /** Book as a button, e.g. choose the service and continue. `bookHref` wins. */
    onBook?: () => void
    /** The close button's accessible name. Default "Close". */
    closeLabel?: string
    /** `data-testid` on the sheet. */
    testId?: string
    testIds?: ServiceDetailSheetTestIds
    className?: string
}

/* The Book pill, the card's own at the sheet's 52px size. */
const BOOK =
    'gap-2 bg-[var(--accent-fill)] text-[var(--on-accent)] not-disabled:hover:bg-[var(--accent-fill-hover)]'

export function ServiceDetailSheet({
    open,
    onOpenChange,
    name,
    description,
    coverImageUrl,
    media,
    durationLabel,
    workingDaysLabel,
    locationLabel,
    chips,
    priceLabel,
    pricePrefix,
    priceNote,
    bookLabel = 'Book',
    bookHref,
    as,
    onBook,
    closeLabel = 'Close',
    testId,
    testIds,
    className,
}: ServiceDetailSheetProps) {
    const priceId = useId()
    const contentRef = useRef<HTMLDivElement>(null)
    // Which URL failed, as on the card: a new URL gets its own chance.
    const [failedUrl, setFailedUrl] = useState<string | null>(null)
    const imageFailed = Boolean(coverImageUrl) && failedUrl === coverImageUrl
    const hasPhoto = Boolean(media) || (Boolean(coverImageUrl) && !imageFailed)
    const text = description?.trim() || null

    const meta: ServiceCardChip[] = []
    if (workingDaysLabel) meta.push({ label: workingDaysLabel })
    if (durationLabel) meta.push({ label: durationLabel })
    if (locationLabel) meta.push({ label: locationLabel })
    if (chips) meta.push(...chips)

    const LinkComp = (as ?? 'a') as ElementType
    const bookClass = cn(buttonVariants({ variant: 'quiet', size: 'lg' }), BOOK)
    const bookText = (
        <>
            {bookLabel}
            <ArrowRightIcon />
            <span className="sr-only"> {name}</span>
        </>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                layout="responsive"
                size="md"
                closeLabel={closeLabel}
                data-testid={testId}
                data-slot="service-detail-sheet"
                className={className}
                ref={contentRef}
                // No meta line: say there is no description, rather than Radix pointing at none.
                {...(meta.length > 0 ? {} : { 'aria-describedby': undefined })}
                // Focus Book on open, as LinkShareSheet focuses its primary: the
                // dialog's name and meta line are announced, Enter books, Tab
                // reaches the rest. Without Book, Radix's default (the first
                // focusable) stands.
                onOpenAutoFocus={(event) => {
                    const book = contentRef.current?.querySelector<HTMLElement>('[data-slot="book"]')
                    if (!book) return
                    event.preventDefault()
                    book.focus({ preventScroll: true })
                }}
            >
                <DialogHeader>
                    <DialogTitle data-testid={testIds?.title} className="[overflow-wrap:anywhere]">
                        {name}
                    </DialogTitle>
                    {meta.length > 0 ? (
                        <DialogDescription
                            data-testid={testIds?.meta}
                            className="text-[0.9375rem] leading-snug text-[var(--text-muted)] [overflow-wrap:anywhere]"
                        >
                            {meta.map((part, i) => (
                                <Fragment key={i}>
                                    {i > 0 ? ' · ' : null}
                                    <span data-testid={part.testId}>{part.label}</span>
                                </Fragment>
                            ))}
                        </DialogDescription>
                    ) : null}
                </DialogHeader>

                {hasPhoto || text ? (
                    // Nothing in the body takes focus, so it does, for a
                    // keyboard user to scroll a long description.
                    <DialogBody tabIndex={0} className="focus-visible:outline-2 focus-visible:outline-[var(--accent)]">
                        {hasPhoto ? (
                            <div
                                data-slot="media"
                                className="relative mb-5 aspect-[16/10] overflow-hidden rounded-2xl bg-[var(--band)]"
                            >
                                {media ?? (
                                    <img
                                        src={coverImageUrl ?? undefined}
                                        alt=""
                                        decoding="async"
                                        onError={() => setFailedUrl(coverImageUrl ?? null)}
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                )}
                            </div>
                        ) : null}
                        {text ? (
                            <p
                                data-testid={testIds?.description}
                                data-slot="description"
                                className="whitespace-pre-line text-base leading-relaxed text-[var(--text-strong)] [overflow-wrap:anywhere]"
                            >
                                {text}
                            </p>
                        ) : null}
                    </DialogBody>
                ) : null}

                {/* From `sm` the footer packs its children to the end; this one row spans it. */}
                <DialogFooter className="sm:[&>*]:flex-1">
                    {/* One row: the total and its fee line, then Book. It wraps
                        at 200% text, Book dropping under the price. */}
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                        <div id={priceId} className="min-w-0">
                            <p className="text-xl font-bold leading-tight tabular-nums text-[var(--text-strong)]">
                                {pricePrefix ? (
                                    <span className="mr-1 text-sm font-medium text-[var(--text-muted)]">{pricePrefix}</span>
                                ) : null}
                                <span data-testid={testIds?.price}>{priceLabel}</span>
                                {priceNote ? <span className="sr-only">, </span> : null}
                            </p>
                            {priceNote ? (
                                <p
                                    data-testid={testIds?.priceNote}
                                    data-slot="price-note"
                                    className="mt-0.5 text-[0.8125rem] leading-snug tabular-nums text-[var(--text-muted)]"
                                >
                                    {priceNote}
                                </p>
                            ) : null}
                        </div>
                        {bookHref ? (
                            <LinkComp
                                href={bookHref}
                                aria-describedby={priceId}
                                data-slot="book"
                                data-testid={testIds?.book}
                                className={bookClass}
                            >
                                {bookText}
                            </LinkComp>
                        ) : onBook ? (
                            <button
                                type="button"
                                onClick={() => onBook()}
                                aria-describedby={priceId}
                                data-slot="book"
                                data-testid={testIds?.book}
                                className={bookClass}
                            >
                                {bookText}
                            </button>
                        ) : null}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
