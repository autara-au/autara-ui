import { useState, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { ChipRow, type ChipRowArrows } from './ChipRow'

/**
 * FilterChipRow — single-select pill row used as the secondary
 * filter on filtered-list screens (booking status, inbox filter,
 * service status, notification tab).
 *
 * AUTM-1594 — canvas v44 "Filter chips": pills, 13px Medium. The active chip
 * is the selected colour (#2e1070, #8f6bff in dark) with its own ink; the
 * rest are band with ink. The row scrolls horizontally on narrow surfaces.
 * Drawn at the sheet's 36px with AUTM-622's 44px floor kept as a hit area
 * (the unpainted pseudo-element Switch and Tabs use). The row scrolls, and a
 * scroller clips what pokes out of it, so the row carries 4px of vertical
 * padding: that is where the extra 8px of target lives.
 *
 * ─── AUTM-974: the inactive chip lost its border ────────────────────────
 *
 * The active chip was already solid; the inactive ones were
 * `border border-[var(--border-subtle)]` on `--surface`, i.e. outlined boxes
 * sitting next to a solid one. Rule 4 of the Autara Glass direction bans
 * outlines outright, and there was a second reason to go: a row of five
 * hairline rectangles is five rectangles competing with the one chip that is
 * meant to stand out. Emphasis reads better when the unemphasised things stop
 * drawing themselves.
 *
 * The focus ring moved with it. `ring-[var(--color-autara-purple)]/35` with no
 * offset drew a translucent purple line directly against the ink capsule —
 * 1.8:1, under the 3:1 WCAG 2.4.11 asks of a focus indicator. It is now
 * full-strength `--accent` with a 2px offset band in the page canvas.
 *
 * Why a single component vs leaving each consumer to roll its own:
 *   - The previous inline pattern was duplicated 4× across
 *     merchant-mobile screens with slightly different paddings and
 *     transitions — drift waiting to happen.
 *   - The "ink active + outline inactive" pair is a canonical
 *     Autara editorial pattern; consolidate so future tweaks land
 *     in one place.
 *
 * Type parameter `V` lets the consumer keep their own value union
 * (string / null / enum) without casting at the callsite.
 *
 * ─── AUTM-1756 follow-up: a ChipRow, with no scrollbar ──────────────────
 *
 * The row is a `ChipRow` (Don, 2026-10-15: "instead of scrollbar can add an
 * chevron arrow in the ending, to move it. also dragable"): no bar, a chevron
 * on the fade at the end that has more, a mouse or pen drag, and the arrow
 * keys between chips (it is a tablist; activation stays on Enter, Space or a
 * click, so a filter that refetches does not fire per key). Every chip stays
 * in the tab order, as before. `className` still lands on the tablist.
 */

export interface FilterChipOption<V> {
    /** Stable value used in equality + onChange. */
    value: V
    /** Visible label. */
    label: ReactNode
}

export interface FilterChipRowProps<V> {
    options: FilterChipOption<V>[]
    /** The currently active value — `null` is a valid value if your
     *  union includes "all" as `null`. */
    value: V
    onChange: (value: V) => void
    /** ARIA label for the row; defaults to "Filter". */
    ariaLabel?: string
    /** Merged onto the row (the tablist). */
    className?: string
    /** Merged onto every chip. */
    chipClassName?: string
    /** Each chip presses to 97% (`motion-press`, AUTM-1708). Default true. */
    press?: boolean
    /**
     * AUTM-1756: fade the edge that has more chips to show when the row
     * scrolls (a phone, large text, a narrow pane), instead of cutting a chip
     * mid-word. Default true.
     */
    fade?: boolean
    /** The chevrons, as ChipRow takes them. Default `auto` (where a fine pointer exists). */
    arrows?: ChipRowArrows
    /** The end chevron's accessible name. Default "More filters". */
    nextLabel?: string
    /** The start chevron's accessible name. Default "Earlier filters". */
    previousLabel?: string
    /** Classes for the box around the row (margins, `flex-1`, `min-w-0`). */
    rootClassName?: string
}

export function FilterChipRow<V>({
    options,
    value,
    onChange,
    ariaLabel = 'Filter',
    className,
    chipClassName,
    press = true,
    fade = true,
    arrows = 'auto',
    nextLabel = 'More filters',
    previousLabel = 'Earlier filters',
    rootClassName,
}: FilterChipRowProps<V>) {
    /* AUTM-1792: the chip the merchant just chose pops (`.motion-pop`, 100 to
       104 to 99%, off under reduced motion). Only a CHOICE pops: the chip
       selected on first render stays still, because a pop on every screen
       arrival is noise. Choosing the chip that is already on does not pop. */
    const [popped, setPopped] = useState<number | null>(null)
    return (
        <ChipRow
            role="tablist"
            label={ariaLabel}
            fade={fade}
            arrows={arrows}
            nextLabel={nextLabel}
            previousLabel={previousLabel}
            rootClassName={rootClassName}
            className={cn(
                // 10px between chips, as the sheet spaces them.
                // -mt-1 cancels the top padding's offset, so the chips sit
                // where the row starts; the padding is only there to hold
                // the hit area. ChipRow keeps the row contained, without a
                // bar, and a chip reached by Tab clear of the fade.
                '-mx-1 -mt-1 mb-0 gap-2.5 px-1 py-1',
                className,
            )}
        >
            {options.map((o, i) => {
                const active = o.value === value
                return (
                    <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => {
                            setPopped(i)
                            onChange(o.value)
                        }}
                        className={cn(
                            /* A pill (canvas v44), which supersedes the 8px rung
                               the 2026-09-01 shape rule gave chips. */
                            /* AUTM-622 — `min-h-11` (44px). This was MISSED by the
                               first pass at that ticket, which fixed `Switch` and
                               `Tabs` and shipped in 5.3.1 while the ticket also
                               names this component. A board audit caught it: the
                               chips were still `px-3 py-1.5` with no minimum and
                               rendered at 32px, so anyone closing AUTM-622 on
                               5.3.1 would have closed it over a live defect.

                               A MINIMUM in rem, not a fixed height, for the same
                               reason Tabs uses one: at 200% text scale the label
                               is taller than 44px and the control has to grow
                               with it rather than clip. */
                            'relative shrink-0 min-h-9 rounded-full px-3 py-1.5 text-[0.8125rem] font-medium transition-colors',
                            "before:absolute before:left-1/2 before:top-1/2 before:h-11 before:w-full before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
                            active
                                ? 'bg-[var(--selected)] text-[var(--on-selected)]'
                                : 'bg-[var(--band)] text-[var(--text-strong)] hover:bg-[var(--band-press)]',
                            press && 'motion-press',
                            popped === i && active && 'motion-pop',
                            chipClassName,
                        )}
                    >
                        {o.label}
                    </button>
                )
            })}
        </ChipRow>
    )
}
