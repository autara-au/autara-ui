import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * CategoryRail — horizontal-snap browse-by-category row used between
 * the hero and the marketplace rails on customer-facing surfaces.
 *
 * Layout:
 *   - mobile: `overflow-x-auto snap-x snap-mandatory` rail, scrollable
 *     by swipe. Each tile is a fixed `w-[200px]` snap target.
 *   - lg+: collapses to a 3-column grid; the snap behaviour drops
 *     because there's no scroll axis anymore.
 *
 * Polymorphic links via `linkAs`: pass your framework's link
 * component (`next/link`, `react-router-dom` `Link`, etc). Defaults
 * to a plain `<a>` so the component is usable in any stack.
 *
 * Icons are accepted as React nodes (one per category) so consumers
 * can use whichever icon library they ship — `@solar-icons/react`,
 * inlined SVGs, etc. No icon dependency in autara-ui itself.
 *
 * Promoted from autara-customer-web 2026-05-30 (AUTAA-UI-007).
 */

export interface CategoryRailItem {
    /** URL slug — passed to consumer-supplied `href` builder, or used
     *  directly via the optional `href` field below. */
    slug: string
    /** Display label (e.g. "Mobile detailing"). */
    label: string
    /** Pre-rendered icon node (e.g. `<MagniferLinear width={20} />`). */
    icon: React.ReactNode
    /** One-line description under the label. */
    blurb: string
    /** Absolute href for the tile. */
    href: string
}

export interface CategoryRailProps
    extends React.HTMLAttributes<HTMLElement> {
    /** Editorial eyebrow above the title (uppercase, tracked). */
    eyebrow?: string
    /** Section title. */
    title: string
    /** Optional "See all" link target. Renders only when present. */
    seeAllHref?: string
    seeAllLabel?: string
    /** Categories rendered as tiles. */
    categories: CategoryRailItem[]
    /** Polymorphic Link component for SPA navigation. Defaults to <a>. */
    linkAs?: React.ElementType
    /** Footer micro-copy on every tile. Defaults to "Find a pro". */
    tileFooterLabel?: string
}

const ArrowGlyph = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
    >
        <path
            d="M7 17 17 7M9 7h8v8"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

export const CategoryRail = React.forwardRef<HTMLElement, CategoryRailProps>(
    function CategoryRail(
        {
            eyebrow,
            title,
            seeAllHref,
            seeAllLabel = 'See all',
            categories,
            linkAs,
            tileFooterLabel = 'Find a pro',
            className,
            ...sectionProps
        },
        ref,
    ) {
        const Link = (linkAs ?? 'a') as React.ElementType
        const headingId = React.useId()

        return (
            <section
                ref={ref}
                aria-labelledby={headingId}
                className={cn('pt-8 pb-12 lg:pt-16 lg:pb-20', className)}
                {...sectionProps}
            >
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 lg:mb-10 flex items-baseline justify-between gap-4">
                        <div>
                            {eyebrow ? (
                                <p className="text-[0.75rem] font-medium uppercase tracking-[0.22em] text-[var(--color-autara-purple)]/80 mb-3">
                                    {eyebrow}
                                </p>
                            ) : null}
                            <h2
                                id={headingId}
                                className="text-[1.5rem] sm:text-[1.75rem] lg:text-[2.25rem] font-bold text-[var(--text-strong)] tracking-[-0.025em] leading-[1.05]"
                            >
                                {title}
                            </h2>
                        </div>
                        {seeAllHref ? (
                            <Link
                                href={seeAllHref}
                                className="hidden sm:inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-[var(--text-muted)] hover:text-[var(--color-autara-purple)] transition-colors shrink-0"
                            >
                                {seeAllLabel}
                                <span aria-hidden className="text-[0.875rem] leading-none">
                                    ↗
                                </span>
                            </Link>
                        ) : null}
                    </div>

                    {/* Tiles */}
                    <ul
                        className="
                            flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory
                            scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6
                            lg:grid lg:grid-cols-3 lg:gap-4 lg:mx-0 lg:px-0 lg:overflow-visible
                        "
                    >
                        {categories.map((c) => (
                            <li
                                key={c.slug}
                                className="shrink-0 w-[200px] sm:w-[220px] snap-start lg:w-auto"
                            >
                                <Link
                                    href={c.href}
                                    className="group block h-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-6 transition-colors hover:border-[var(--color-autara-purple)]/30 hover:bg-[var(--surface-warm)] active:bg-[var(--surface-warm)]"
                                >
                                    <span
                                        aria-hidden
                                        className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--color-autara-purple)]/10 text-[var(--color-autara-purple)] mb-4"
                                    >
                                        {c.icon}
                                    </span>
                                    <h3 className="text-[1rem] sm:text-[1.0625rem] font-bold text-[var(--text-strong)] tracking-[-0.005em] leading-snug group-hover:text-[var(--color-autara-purple)] transition-colors">
                                        {c.label}
                                    </h3>
                                    <p className="mt-1.5 text-[0.8125rem] text-[var(--text-muted)] leading-relaxed">
                                        {c.blurb}
                                    </p>
                                    <p
                                        aria-hidden
                                        className="mt-4 inline-flex items-center gap-1 text-[0.75rem] font-medium uppercase tracking-[0.18em] text-[var(--text-subtle)] group-hover:text-[var(--color-autara-purple)] transition-colors"
                                    >
                                        {tileFooterLabel}
                                        <ArrowGlyph />
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        )
    },
)
