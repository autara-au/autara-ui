'use client'

import * as React from 'react'

import { cn } from '../lib/cn'
import { useLabelFor } from '../lib/use-label-for'
import { isISOTime, timeLabel, timeSlots } from '../lib/calendar'

/**
 * `unavailable` covers both "the shop is shut then" and "that slot is already
 * taken". The distinction matters to the merchant, so the caller supplies the
 * wording through `reasonFor` rather than this component guessing.
 */
export type SlotState = 'available' | 'unavailable'

export interface TimePickerProps {
    /** `HH:mm` in 24-hour form, or `''` when nothing is chosen. */
    value: string
    onChange: (value: string) => void
    /** First slot offered. @default '06:00' */
    startTime?: string
    /** Last slot offered, inclusive. @default '20:00' */
    endTime?: string
    /** Minutes between slots. @default 30 */
    intervalMinutes?: number
    /** Per-slot availability. Everything is available when omitted. */
    slotState?: (time: string) => SlotState
    /** Why a slot is unavailable, read out by screen readers. */
    reasonFor?: (time: string) => string | undefined
    disabled?: boolean
    invalid?: boolean
    /** Names the group for screen readers. @default 'Time' */
    label?: string
    /**
     * AUTM-1267 — the id a caller's `<Label htmlFor>` points at. It goes on
     * the group, the label names the group, and a click on the label focuses
     * the slot holding the tab stop. See `lib/use-label-for.ts`.
     */
    id?: string
    testId?: string
    className?: string
}

/**
 * TimePicker — the shop's bookable times as a grid, with the taken ones out.
 *
 * ── Why a grid rather than a spinner or a native field ───────────────────
 *
 * A native `<input type="time">` can express exactly one thing: a time. It
 * cannot say the shop is shut at 7am, and it cannot say 10:30 is already
 * gone. So the merchant picks, finishes the form, and the save fails on
 * `bookings_active_slot_uniq` with the customer still standing there
 * (AUTM-707). A grid shows the conflict at the moment of choosing, which is
 * the only time it is cheap to act on.
 *
 * ── The off-grid value ───────────────────────────────────────────────────
 *
 * A booking made at 10:20 under a 15-minute interval still has to render as
 * selected after the merchant moves to 30-minute slots. `timeSlots` folds the
 * current value in wherever it belongs rather than dropping it, because a
 * field that quietly shows nothing reads as data loss.
 */
export function TimePicker({
    value,
    onChange,
    startTime = '06:00',
    endTime = '20:00',
    intervalMinutes = 30,
    slotState,
    reasonFor,
    disabled = false,
    invalid = false,
    label = 'Time',
    id,
    testId,
    className,
}: TimePickerProps) {
    const slots = React.useMemo(
        () => timeSlots(startTime, endTime, intervalMinutes, isISOTime(value) ? value : null),
        [startTime, endTime, intervalMinutes, value],
    )

    const selectedIndex = slots.indexOf(value)
    const [focusIndex, setFocusIndex] = React.useState(0)
    const activeIndex = selectedIndex >= 0 ? selectedIndex : focusIndex
    const gridRef = React.useRef<HTMLDivElement>(null)

    const buttons = () =>
        Array.from(gridRef.current?.querySelectorAll<HTMLButtonElement>('[data-slot]') ?? [])

    /**
     * The grid reflows with `auto-fill`, and it reflows again at 200% text
     * scale, so the column count cannot be a constant. Measuring where the
     * second row starts is the only way Up and Down move by a real row rather
     * than by a number that was true on one screen.
     */
    function columnCount(): number {
        const items = buttons()
        if (items.length === 0) return 1
        const top = items[0].offsetTop
        const wrapped = items.findIndex((el) => el.offsetTop > top)
        return wrapped === -1 ? items.length : wrapped
    }

    function moveFocus(next: number) {
        const clamped = Math.max(0, Math.min(slots.length - 1, next))
        setFocusIndex(clamped)
        const el = buttons()[clamped]
        el?.focus()
        el?.scrollIntoView({ block: 'nearest' })
    }

    function onKeyDown(event: React.KeyboardEvent) {
        const columns = columnCount()
        const map: Record<string, number> = {
            ArrowRight: activeIndex + 1,
            ArrowLeft: activeIndex - 1,
            ArrowDown: activeIndex + columns,
            ArrowUp: activeIndex - columns,
            Home: 0,
            End: slots.length - 1,
        }
        if (!(event.key in map)) return
        event.preventDefault()
        moveFocus(map[event.key])
    }

    const labelledBy = useLabelFor(id, () =>
        gridRef.current?.querySelector<HTMLElement>('[role="radio"][tabindex="0"]'),
    )

    return (
        <div
            ref={gridRef}
            id={id}
            role="radiogroup"
            aria-labelledby={labelledBy}
            aria-label={labelledBy ? undefined : label}
            aria-invalid={invalid || undefined}
            onKeyDown={onKeyDown}
            data-testid={testId}
            className={cn(
                // `auto-fill` with a rem floor is what makes this survive
                // system text scaling: the columns thin out on their own, so
                // there is no breakpoint to get wrong (AUTM-963 — a media
                // query would not react to the root font size at all).
                'grid gap-1.5',
                // 5.75rem, not 5.25: measured on the merchant app at iPad
                // width, a 5.25rem column leaves a 68px content box and
                // "10:00 am" needs more than that at 15px, so half the grid
                // wrapped to two lines and the rows came out 44px and 47px
                // tall. The floor has to clear the WIDEST label, which is a
                // two-digit hour with a two-digit minute and a suffix.
                'grid-cols-[repeat(auto-fill,minmax(5.75rem,1fr))]',
                className,
            )}
        >
            {slots.map((slot, index) => {
                const state = slotState?.(slot) ?? 'available'
                const isSelected = slot === value
                const isDisabled = disabled || state === 'unavailable'
                const reason = state === 'unavailable' ? reasonFor?.(slot) : undefined
                return (
                    <button
                        key={slot}
                        type="button"
                        data-slot={slot}
                        data-testid={testId ? `${testId}-slot-${slot}` : undefined}
                        role="radio"
                        aria-checked={isSelected}
                        aria-disabled={isDisabled || undefined}
                        tabIndex={index === activeIndex ? 0 : -1}
                        onClick={() => {
                            if (isDisabled) return
                            setFocusIndex(index)
                            onChange(slot)
                        }}
                        className={cn(
                            'flex min-h-[2.75rem] items-center justify-center rounded-[12px] border',
                            // A time is one token; breaking "10:00 am" across
                            // two lines makes it read as two values and gives
                            // the grid ragged row heights.
                            'whitespace-nowrap px-2 text-[0.9375rem] tabular-nums transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2',
                            'focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
                            'focus-visible:ring-offset-[var(--background)]',
                            isSelected
                                ? 'border-transparent bg-[var(--accent-fill)] font-medium text-[var(--on-accent)]'
                                : 'border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-strong)]',
                            !isSelected &&
                                !isDisabled &&
                                'hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)]',
                            // Struck through as well as dimmed, so the state
                            // survives a greyscale screen and a low-contrast
                            // one. Opacity alone is not a signal.
                            isDisabled && 'cursor-not-allowed text-[var(--text-muted)] line-through opacity-45',
                        )}
                    >
                        {timeLabel(slot)}
                        {isDisabled ? (
                            <span className="sr-only">{reason ? `, ${reason}` : ', unavailable'}</span>
                        ) : null}
                    </button>
                )
            })}
        </div>
    )
}
