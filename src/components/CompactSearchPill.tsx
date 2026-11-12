import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * CompactSearchPill — mobile sticky search affordance that pops down
 * once the user has scrolled past a larger hero search panel.
 *
 * Single-tap entry: a leading Solar magnifier glyph + a placeholder
 * row that opens the consumer's primary modal (typically the
 * "Service" picker), plus a trailing "Go" submit button.
 *
 * Visibility is consumer-controlled via the `visible` prop —
 * typically wired to an IntersectionObserver on a hero sentinel.
 * lg+ usually renders the larger `NavSearchPill` inside the navbar
 * instead, so CompactSearchPill is `lg:hidden` by default.
 *
 * Promoted from autara-customer-web 2026-05-30 (AUTAA-UI-007).
 */

export interface CompactSearchPillProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
    /** True → slide in; false → fade out + ignore pointer events. */
    visible: boolean
    /** Current value (e.g. selected service). */
    value: string
    /** Placeholder when `value` is empty. */
    placeholder?: string
    /** Opens the picker modal. */
    onOpen: () => void
    /** Fires the search. */
    onSubmit: () => void
    /** Submit button label. Defaults to "Go". */
    submitLabel?: string
    /** Aria-label fallback for the row. */
    ariaLabel?: string
}

const MagniferGlyph = () => (
    <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        aria-hidden
    >
        <circle
            cx="11"
            cy="11"
            r="7"
            stroke="currentColor"
            strokeWidth="1.8"
        />
        <path
            d="m20 20-3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
        />
    </svg>
)

export const CompactSearchPill = React.forwardRef<
    HTMLDivElement,
    CompactSearchPillProps
>(function CompactSearchPill(
    {
        visible,
        value,
        placeholder = 'Search',
        onOpen,
        onSubmit,
        submitLabel = 'Go',
        ariaLabel,
        className,
        ...divProps
    },
    ref,
) {
    return (
        <div
            ref={ref}
            aria-hidden={!visible}
            className={cn(
                'lg:hidden fixed inset-x-0 z-40 px-3 transition-[opacity,transform] duration-300',
                visible
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 -translate-y-2 pointer-events-none',
                className,
            )}
            style={{ top: 'calc(env(safe-area-inset-top) + 3.5rem)' }}
            {...divProps}
        >
            <div className="mx-auto max-w-5xl">
                <div className="flex items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-white/95 backdrop-blur-md pl-3 pr-1.5 py-1.5">
                    <span
                        aria-hidden
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--color-autara-purple)]/10 text-[var(--color-autara-purple)]"
                    >
                        <MagniferGlyph />
                    </span>
                    <button
                        type="button"
                        onClick={onOpen}
                        className="flex flex-1 min-w-0 items-center text-left text-[0.7812rem] font-medium truncate"
                        aria-label={
                            ariaLabel ??
                            `Search — currently ${value || placeholder.toLowerCase()}`
                        }
                    >
                        <span
                            className={cn(
                                'block truncate',
                                value
                                    ? 'text-[var(--text-strong)]'
                                    : 'text-[var(--text-subtle)]',
                            )}
                        >
                            {value || placeholder}
                        </span>
                    </button>
                    {/* AUTM-2025: the 36 to 40px pill button keeps its look; the 44px floor
                        (AUTM-622) is an unpainted hit area, as AUTM-1909 did for the pass. */}
                    <button
                        type="button"
                        onClick={onSubmit}
                        className="relative before:absolute before:left-1/2 before:top-1/2 before:h-11 before:w-full before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] ml-auto inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-autara-purple)] px-3.5 text-[0.7812rem] font-medium text-white transition-colors hover:brightness-110 shrink-0"
                        aria-label="Search the marketplace"
                    >
                        {submitLabel}
                        <span aria-hidden className="text-[0.9375rem] leading-none">
                            ↗
                        </span>
                    </button>
                </div>
            </div>
        </div>
    )
})
