'use client'

import * as React from 'react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

/**
 * ListSection + ListSectionRow — the canonical Autara
 * settings / account / preferences list pattern.
 *
 *   Group title
 *   ┌─────────────────────────────────────────────┐
 *   │ [Icon] Row label                  Value  ›  │
 *   │ ────────────────────────────────────────── │
 *   │ [Icon] Row label                  Value  ›  │
 *   └─────────────────────────────────────────────┘
 *
 * Used across merchant-mobile Settings, customer-web account hub,
 * admin user-profile sections. The visual treatment matches Autara's
 * editorial cream surface — hairline borders, no drop shadows, ink
 * label color over a `--surface` fill.
 *
 * The chevron auto-renders when `onTap` is provided. `trailing` slots
 * a custom value (e.g. a status pill, a Switch, a price) before the
 * chevron.
 *
 * Section title is optional — for a single group of rows without a
 * label (e.g. a sign-out row at the bottom of a settings screen) omit
 * `title`.
 *
 * AUTM-1138 — the section title is SENTENCE CASE, not a letterspaced
 * uppercase eyebrow.
 *
 * It shipped as `text-[10px] uppercase tracking-[0.18em]`, which is the
 * treatment Don has rejected repeatedly across the surfaces. It is also the
 * loudest possible way to render the least important text on the screen: a
 * group label is scaffolding, and tracking it out to 0.18em turns four quiet
 * words into a banner while the rows underneath — the actual content — sit at
 * a normal weight. Sentence case at `--text-muted` lets the rows lead.
 *
 * AUTM-1594 — canvas v44 "Row in a card": the group is a band card (24px,
 * 14px in) and each row is its own raised card inside it (16px radius,
 * 14 x 16 in, 10px apart), so there are no dividers and no outline. The
 * label is 16px Bold, the description 14px at 72% ink, the trailing value
 * ink. `accent` draws the sheet's 4px brand bar at the row's left edge, the
 * mark of a row that is waiting on someone. Icons sit in a band disc; a
 * destructive row's label and icon take the danger colour, never a tint.
 *
 * The type is in `rem`, not `px`. All four sizes here were hardcoded pixels,
 * so the whole pattern ignored OS Dynamic Type on every surface that uses it —
 * settings screens being exactly where someone who has scaled their text goes
 * to change things. The rem values are exact equivalents at a 16px root
 * (10→0.625 was lifted to 0.75 for the title; 14→0.875; 12→0.75), so nothing
 * moves at default scale and they only diverge where they should.
 */

/**
 * AUTM-1781: `variant="plain"`, the grouped list on a WHITE ground. Don,
 * 2026-10-09, on the customer booking page: "only cream colour boxes, feels
 * empty". The card variant puts every group in a band box; a page of them is
 * a stack of cream. `plain` keeps the grouping and drops the box: a 17px Bold
 * title, then rows on the page's own paper, set apart by space (AUTM-2042,
 * Don 2026-11-08: no hairlines; they were divided by rules, as Airbnb's
 * trip page and Fresha's appointment page draw them). Cream is then free to mean "these
 * belong together" where a caller still wants a card.
 *
 * Rows also gained what a detail page needs and a settings page did not:
 *   - `href` / `element`: a row that is a link (an EMPTY framework link is
 *     cloned around the row, as AccountMenu and BackButton do); `external`
 *     opens a new tab, says so, and trades the chevron for an arrow.
 *   - `leading`: drawn as given, for an avatar or a photo, where `icon`
 *     always sits in the band disc.
 *   - `wrap`: label and description wrap instead of truncating, for an
 *     address or a time that must be read whole.
 *   - `label` and `description` take nodes, so a time can carry its
 *     visually hidden zone hint.
 */

type ListVariant = 'card' | 'plain' | 'quiet'
const ListVariantContext = React.createContext<ListVariant>('card')

export interface ListSectionProps {
    title?: string
    children: ReactNode
    className?: string
    /**
     * @default 'card' (the band box of white row cards). `plain`: rows on the
     * page's paper, apart by space. `quiet`: one band surface, the rows on it with no card of
     * their own (Don, 2026-11-07), for a settings screen of several groups.
     */
    variant?: ListVariant
    /** The title's element. @default 'h2' */
    titleAs?: 'h2' | 'h3'
    /** An id on the title, so the section can be `aria-labelledby` it. */
    titleId?: string
    /** Content between the title and the rows, e.g. a one-line policy. */
    lead?: ReactNode
    /** Pass-through for the section, e.g. `aria-labelledby` or a test id. */
    sectionProps?: React.HTMLAttributes<HTMLElement> & Record<`data-${string}`, string | undefined>
}

export function ListSection({
    title,
    children,
    className,
    variant = 'card',
    titleAs = 'h2',
    titleId,
    lead,
    sectionProps,
}: ListSectionProps) {
    const Title = titleAs
    const plain = variant === 'plain'
    return (
        <ListVariantContext.Provider value={variant}>
            <section
                {...sectionProps}
                aria-labelledby={sectionProps?.['aria-labelledby'] ?? (title && titleId ? titleId : undefined)}
                className={cn('mt-6 first:mt-0', className)}
            >
                {title ? (
                    <Title
                        id={titleId}
                        className={
                            plain
                                ? 'mb-1 text-[1.0625rem] leading-snug font-bold text-[var(--text-strong)]'
                                : 'mb-2 px-1 text-[0.875rem] font-medium text-[var(--text-muted)]'
                        }
                    >
                        {title}
                    </Title>
                ) : null}
                {lead ? (
                    <div className={cn('text-[0.9375rem] leading-relaxed text-[var(--text-muted)]', plain ? 'mb-1' : 'mb-2 px-1')}>
                        {lead}
                    </div>
                ) : null}
                <div
                    className={
                        plain
                            ? 'flex flex-col gap-1'
                            : variant === 'quiet'
                              ? 'flex flex-col gap-0.5 rounded-[1.5rem] bg-[var(--band)] p-1.5'
                              : 'flex flex-col gap-2.5 rounded-[1.5rem] bg-[var(--band)] p-3.5'
                    }
                >
                    {children}
                </div>
            </section>
        </ListVariantContext.Provider>
    )
}

export interface ListSectionRowProps {
    icon?: ReactNode
    /** Drawn as given in place of the icon disc: an avatar, a photo. */
    leading?: ReactNode
    label: ReactNode
    description?: ReactNode
    /** Value on the right, e.g. a Switch, a pill, a numeric label, etc. */
    trailing?: ReactNode
    onTap?: () => void
    /** The row is a plain anchor. Ignored when `element` is supplied. */
    href?: string
    /** With `href`: opens in a new tab, says so, and draws an arrow, not a chevron. */
    external?: boolean
    /** An EMPTY framework link, cloned around the row's content. */
    element?: React.ReactElement
    /** Label, description and trailing value wrap instead of truncating or spilling. */
    wrap?: boolean
    /** Renders label + icon in the danger colour. Use for sign-out
     *  / delete-account rows. */
    destructive?: boolean
    /** The sheet's 4px brand bar at the left edge: a row waiting on someone. */
    accent?: boolean
    /**
     * A tappable row presses to 98.5% (`motion-press-row`, AUTM-1708). Default
     * true; only applies with `onTap`, `href` or `element`.
     */
    press?: boolean
    /** Merged onto the row's root (the button when `onTap` is set). */
    className?: string
    testId?: string
}

export function ListSectionRow({
    icon,
    leading,
    label,
    description,
    trailing,
    onTap,
    href,
    external = false,
    element,
    wrap = false,
    destructive = false,
    accent = false,
    press = true,
    className,
    testId,
}: ListSectionRowProps) {
    const variant = React.useContext(ListVariantContext)
    const plain = variant === 'plain'
    const quiet = variant === 'quiet'
    const isLink = !!element || !!href
    const interactive = !!onTap || isLink

    const rootClass = cn(
        'flex min-h-11 w-full items-center gap-3 text-left transition-colors',
        plain
            ? 'rounded-xl px-0 py-3.5'
            : quiet
              ? // The quiet pass (Don, 2026-11-07): the row sits on the
                // group's band, no card of its own, so a group is one surface
                // and not a box inside a box.
                'rounded-[1.125rem] px-3.5 py-3'
              : 'rounded-2xl bg-[var(--raised)] px-4 py-3.5',
        interactive &&
            (plain
                ? 'hover:bg-[var(--band)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] sm:-mx-2 sm:w-[calc(100%+1rem)] sm:px-2'
                : quiet
                  ? 'hover:bg-[var(--band-press)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--band)]'
                  : 'hover:bg-[var(--paper)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--band)]'),
        interactive && press && 'motion-press-row',
        className,
    )

    const content = (
        <>
            {accent ? (
                <span aria-hidden className="w-1 shrink-0 self-stretch rounded-full bg-[var(--brand)]" />
            ) : null}
            {leading ? (
                <span className="flex shrink-0 items-center">{leading}</span>
            ) : icon ? (
                <span
                    aria-hidden
                    className={cn(
                        // On a quiet group the disc is paper, so it still
                        // reads on the band it sits on.
                        'grid size-10 shrink-0 place-items-center rounded-full',
                        quiet ? 'bg-[var(--paper)]' : 'bg-[var(--band)]',
                        destructive ? 'text-[var(--danger)]' : 'text-[var(--accent)]',
                    )}
                >
                    {icon}
                </span>
            ) : null}
            {/* The same div and p as before AUTM-1781: merchant-mobile's Plan
                screen styles `section > div > div > div.flex-1`. */}
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <p
                    className={cn(
                        'text-base leading-snug font-bold',
                        wrap ? '[overflow-wrap:anywhere]' : 'truncate',
                        destructive ? 'text-[var(--danger)]' : 'text-[var(--text-strong)]',
                    )}
                >
                    {label}
                </p>
                {description ? (
                    <p
                        className={cn(
                            'text-sm leading-snug text-[var(--text-muted)]',
                            wrap ? '[overflow-wrap:anywhere]' : 'truncate',
                        )}
                    >
                        {description}
                    </p>
                ) : null}
            </div>
            {trailing ? (
                <span
                    className={cn(
                        'text-[0.9375rem] text-[var(--text-strong)]',
                        // With `wrap` the value may shrink and wrap too: a long
                        // value ("$54.00 · Sent to your card") spilled past a
                        // phone at 200% text (AUTM-1781; merchant-mobile's Plan
                        // screen worked around the same, AUTM-1649).
                        wrap ? 'min-w-0 shrink text-right [overflow-wrap:break-word]' : 'shrink-0',
                    )}
                >
                    {trailing}
                </span>
            ) : null}
            {href && external ? <span className="sr-only">(opens in a new tab)</span> : null}
            {interactive ? (
                external ? (
                    // Solar ArrowRightUp Linear: leaves the app.
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-[var(--text-subtle)]">
                        <path d="M7 17 17 7m0 0H9m8 0v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ) : (
                    // Solar `AltArrowRight` Linear, inlined so autara-ui doesn't
                    // depend on @solar-icons/react.
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                        className="shrink-0 text-[var(--text-subtle)]"
                    >
                        <path
                            d="m9 6 6 6-6 6"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )
            ) : null}
        </>
    )

    if (element) {
        return React.cloneElement(
            element as React.ReactElement<Record<string, unknown>>,
            {
                className: cn((element.props as { className?: string }).className, rootClass),
                'data-testid': testId,
            },
            content,
        )
    }
    if (href) {
        return (
            <a
                href={href}
                className={rootClass}
                data-testid={testId}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
                {content}
            </a>
        )
    }
    if (onTap) {
        return (
            <button type="button" onClick={onTap} className={rootClass} data-testid={testId}>
                {content}
            </button>
        )
    }
    return (
        <div className={rootClass} data-testid={testId}>
            {content}
        </div>
    )
}
