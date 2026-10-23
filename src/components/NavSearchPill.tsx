import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * NavSearchPill — three-field horizontal search pill designed to live
 * inside a navbar's center slot when the user has scrolled past a
 * larger hero search panel.
 *
 * Anatomy: `[Service · | · Where · | · When]  [Search button]`.
 *
 * State is consumer-owned: pass the current value for each field plus
 * an `onClick` handler that opens whatever modal / popover the
 * consumer uses to mutate it. NavSearchPill renders the chrome,
 * nothing more — no Service/Where/When pickers are coupled.
 *
 * Promoted from autara-customer-web 2026-05-30 (AUTAA-UI-007). The
 * lg+ pattern was originally inline inside Navbar.tsx; pulled into
 * autara-ui so merchant-web and admin can reuse the same silhouette
 * when their search flows land.
 */

export interface NavSearchPillField {
    label: string
    /** Display value (e.g. "Any service"). */
    value: string
    /** When true, the value is rendered in subtle/placeholder colour. */
    placeholder?: boolean
    /** Click handler — typically opens a modal/popover. */
    onClick: () => void
    ariaLabel?: string
    /** Hide on mobile widths (`hidden sm:flex`). Useful for the
     *  "When" field which crowds 375px viewports. */
    hideOnMobile?: boolean
}

export interface NavSearchPillProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
    fields: NavSearchPillField[]
    /** Submit handler — fired by the trailing Search button. */
    onSubmit: () => void
    /** Submit button label. Defaults to "Search". */
    submitLabel?: string
    /** Aria-label for the submit button. */
    submitAriaLabel?: string
}

const MagniferGlyph = () => (
    <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
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

export const NavSearchPill = React.forwardRef<
    HTMLDivElement,
    NavSearchPillProps
>(function NavSearchPill(
    {
        fields,
        onSubmit,
        submitLabel = 'Search',
        submitAriaLabel = 'Search',
        className,
        ...divProps
    },
    ref,
) {
    return (
        <div
            ref={ref}
            className={cn(
                'hidden lg:flex flex-1 min-w-0 items-center justify-center px-4 xl:px-6',
                className,
            )}
            {...divProps}
        >
            <div className="flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-white pl-2 pr-1.5 py-1.5">
                {fields.map((f, i) => (
                    <React.Fragment key={f.label}>
                        {i > 0 ? (
                            <span
                                aria-hidden
                                className="h-7 w-px bg-[var(--border-subtle)] shrink-0"
                            />
                        ) : null}
                        <PillField
                            label={f.label}
                            value={f.value}
                            placeholder={!!f.placeholder}
                            onClick={f.onClick}
                            ariaLabel={f.ariaLabel ?? f.label}
                            hideOnMobile={!!f.hideOnMobile}
                        />
                    </React.Fragment>
                ))}
                {/* AUTM-2025: the 36 to 40px pill button keeps its look; the 44px floor
                    (AUTM-622) is an unpainted hit area, as AUTM-1909 did for the pass. */}
                <button
                    type="button"
                    onClick={onSubmit}
                    aria-label={submitAriaLabel}
                    className="relative before:absolute before:left-1/2 before:top-1/2 before:h-11 before:w-full before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] ml-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-autara-purple)] px-4 text-[0.7812rem] font-medium text-white transition-colors hover:brightness-110 shrink-0"
                >
                    <MagniferGlyph />
                    {submitLabel}
                </button>
            </div>
        </div>
    )
})

function PillField({
    label,
    value,
    placeholder,
    onClick,
    ariaLabel,
    hideOnMobile,
}: {
    label: string
    value: string
    placeholder: boolean
    onClick: () => void
    ariaLabel: string
    hideOnMobile: boolean
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            className={cn(
                'group flex flex-1 min-w-0 flex-col items-start gap-0 rounded-xl px-3 py-1 text-left transition-colors hover:bg-[var(--surface-warm)]',
                hideOnMobile ? 'hidden sm:flex' : 'flex',
            )}
        >
            <span className="block text-[0.75rem] font-medium uppercase tracking-[0.2em] text-[var(--text-subtle)] leading-none">
                {label}
            </span>
            <span
                className={cn(
                    'mt-0.5 block w-full truncate text-[0.7812rem] font-medium leading-tight',
                    placeholder
                        ? 'text-[var(--text-subtle)]'
                        : 'text-[var(--text-strong)]',
                )}
            >
                {value}
            </span>
        </button>
    )
}
