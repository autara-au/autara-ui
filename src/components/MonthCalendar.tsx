'use client'

import * as React from 'react'

import { cn } from '../lib/cn'
import {
    addDays,
    addMonths,
    dayOfMonth,
    isISODate,
    longDateLabel,
    monthGrid,
    monthYearLabel,
    startOfMonth,
    weekdayIndex,
    WEEKDAY_LABELS,
} from '../lib/calendar'
import { Button } from './Button'

/**
 * How a day should read before it is chosen.
 *
 * `limited` is not decoration: a merchant deciding where to put a walk-in
 * wants to see the nearly-full day BEFORE tapping into it, which is the thing
 * a native date input can never show (AUTM-703, AUTM-707).
 *
 * `closed` (AUTM-1633) is a day outside the merchant's hours. It is muted and
 * hatched, the way the merchant calendar shades out-of-hours time, and it is
 * STILL SELECTABLE: AUTM-707 made out-of-hours time a merchant's to take on
 * purpose ("Times outside your hours are still yours to take"), and a picker
 * that refused the day would contradict the time grid one tap later.
 * `unavailable` is the only state that cannot be chosen.
 *
 * `full` (AUTM-1867) is an open day with no free time left for the job in
 * hand. Dimmed (muted ink, no hatch, which stays the sign of closed) and
 * STILL SELECTABLE, for the same AUTM-707 reason as `closed`: the merchant may
 * squeeze a job in, and the time picker one tap later says what it overlaps.
 * Its word, "no free times", is what a screen reader hears in place of the dim.
 */
export type DayState = 'available' | 'limited' | 'full' | 'closed' | 'unavailable'

/** Availability in words, for screen readers. Never colour alone (WCAG 1.4.1). */
export const DAY_STATE_WORD: Record<DayState, string> = {
    available: '',
    limited: ', nearly full',
    full: ', no free times',
    closed: ', closed',
    unavailable: ', unavailable',
}

/** The dot under a day. `closed` carries the hatch instead. */
export const DAY_STATE_DOT: Record<DayState, string | null> = {
    available: null,
    limited: 'var(--intent-warning-text)',
    full: null,
    closed: null,
    unavailable: 'var(--intent-error-text)',
}

/**
 * The out-of-hours hatch. The same 135deg rule merchant-mobile draws on its
 * Day and Week grids (`.cal-slot--closed`), so a closed day in the picker and
 * closed time on the calendar read as one idea. Inline because the stripes
 * need a `color-mix` a Tailwind class cannot spell legibly.
 */
export const CLOSED_HATCH: React.CSSProperties = {
    backgroundImage:
        'repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in srgb, var(--text-subtle) 16%, transparent) 6px 7px)',
}

const WEEKDAY_NAMES = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
] as const

export interface MonthCalendarProps {
    /** The chosen day, `YYYY-MM-DD`, or `''`. */
    value: string
    /**
     * Today, as `YYYY-MM-DD` in the caller's timezone. Required for the same
     * reason as on DatePicker: this component never reads the clock.
     */
    today: string
    /** Earliest selectable day. Earlier days render but cannot be chosen. */
    min?: string
    /** Latest selectable day. Unbounded when omitted. */
    max?: string
    /** Per-day availability. `unavailable` is refused; `closed` is muted. */
    dayState?: (date: string) => DayState
    /** A day was chosen. Not called for an `unavailable` day. */
    onSelect: (date: string) => void
    /** Prefix for `-cell-<date>`, `-calendar-back` and `-calendar-next`. */
    testId?: string
    className?: string
}

function chunk<T>(items: T[], size: number): T[][] {
    const rows: T[][] = []
    for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size))
    return rows
}

function Chevron({ direction }: { direction: 'back' | 'forward' }) {
    return (
        <svg
            aria-hidden
            viewBox="0 0 24 24"
            // In em, so the chevron grows with text scaling like its label.
            className="size-[1.1em] shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d={direction === 'back' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
        </svg>
    )
}

/**
 * MonthCalendar — one month of days, any month, chosen by tap or by keyboard.
 *
 * AUTM-1633. It was the inside of DatePicker's "More dates" sheet: a grid of
 * buttons with no keyboard model, no mark on today, and every non-refused day
 * drawn the same. Don asked for "a date picker as an option to select any
 * date" on New booking, so the month became a component of its own, with a
 * story, rather than more code inside the rail.
 *
 * ── Keyboard: the WAI-ARIA date grid ─────────────────────────────────────
 *
 * ONE tab stop for the whole month (the day holding it is `active`), and
 * inside it: arrows move a day or a week, Home and End go to the start and
 * end of the week, Page Up and Page Down move a month, and with Shift a year.
 * Moving onto a day in another month turns the page. Enter and Space are the
 * button's own, so a key press and a tap are the same act. merchant-mobile's
 * calendar grids follow the same model (`lib/grid-keyboard.ts`, AUTM-1171).
 *
 * ── What it refuses ──────────────────────────────────────────────────────
 *
 * It never reads the clock, and it never offers a day it will refuse: a day
 * before `min` or after `max`, or `unavailable`, is `aria-disabled` and inert,
 * and the keyboard cannot walk past either bound.
 *
 * The month heading is a polite live region, so a screen reader hears the
 * month change when Page Down turns it; each day is named in full ("Saturday
 * 3 October, today, closed"), which carries what the dot and the hatch show.
 */
export function MonthCalendar({
    value,
    today,
    min,
    max,
    dayState,
    onSelect,
    testId,
    className,
}: MonthCalendarProps) {
    const lower = isISODate(min) ? (min as string) : undefined
    const upper = isISODate(max) ? (max as string) : undefined

    const clamp = React.useCallback(
        (date: string) => {
            if (lower && date < lower) return lower
            if (upper && date > upper) return upper
            return date
        },
        [lower, upper],
    )

    const stateOf = React.useCallback(
        (date: string): DayState => {
            if (lower && date < lower) return 'unavailable'
            if (upper && date > upper) return 'unavailable'
            return dayState?.(date) ?? 'available'
        },
        [dayState, lower, upper],
    )

    /** The day holding the tab stop. Its month is the month on screen. */
    const [active, setActive] = React.useState(() => clamp(isISODate(value) ? value : today))
    const gridRef = React.useRef<HTMLDivElement>(null)
    /** Set by the keyboard only: paging with Back/Next must not take focus. */
    const focusActive = React.useRef(false)

    React.useLayoutEffect(() => {
        if (!focusActive.current) return
        focusActive.current = false
        gridRef.current?.querySelector<HTMLElement>(`[data-date="${active}"]`)?.focus()
    }, [active])

    const headingId = React.useId()
    const cells = React.useMemo(() => monthGrid(active), [active])
    const weeks = React.useMemo(() => chunk(cells, 7), [cells])
    const month = startOfMonth(active)
    const canGoBack = !lower || month > lower
    const canGoForward = !upper || startOfMonth(addMonths(month, 1)) <= upper

    function page(delta: -1 | 1) {
        setActive(clamp(addMonths(active, delta)))
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
        const from = (event.target as HTMLElement).dataset?.date
        if (!from) return
        let next: string
        switch (event.key) {
            case 'ArrowLeft':
                next = addDays(from, -1)
                break
            case 'ArrowRight':
                next = addDays(from, 1)
                break
            case 'ArrowUp':
                next = addDays(from, -7)
                break
            case 'ArrowDown':
                next = addDays(from, 7)
                break
            case 'Home':
                next = addDays(from, -weekdayIndex(from))
                break
            case 'End':
                next = addDays(from, 6 - weekdayIndex(from))
                break
            case 'PageUp':
                next = addMonths(from, event.shiftKey ? -12 : -1)
                break
            case 'PageDown':
                next = addMonths(from, event.shiftKey ? 12 : 1)
                break
            default:
                return
        }
        event.preventDefault()
        const target = clamp(next)
        if (target === active) return
        focusActive.current = true
        setActive(target)
    }

    return (
        <div className={cn('@container flex flex-col gap-3', className)}>
            {/* Back and Next keep their printed words as their names (AUTM-1266,
                WCAG 2.5.3 Label in Name): "click Back" has to work by voice.
                Below 19rem of container (a 320 phone, or any phone at large
                text) Back and Next drop to their chevrons, their words kept
                for assistive tech, and the month wraps between them, rather
                than the three wrapping into stacked rows. Container queries in
                rem, so they follow text scale. */}
            <div className="flex items-center justify-between gap-x-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!canGoBack}
                    onClick={() => page(-1)}
                    leadingIcon={<Chevron direction="back" />}
                    data-testid={testId ? `${testId}-calendar-back` : undefined}
                    className="shrink-0 px-3 @max-[19rem]:min-w-11 @max-[19rem]:px-0"
                >
                    <span className="@max-[19rem]:sr-only">Back</span>
                </Button>
                <p
                    id={headingId}
                    aria-live="polite"
                    className="min-w-0 flex-1 text-center text-[1rem] font-bold text-[var(--text-strong)]"
                >
                    {monthYearLabel(active)}
                </p>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!canGoForward}
                    onClick={() => page(1)}
                    trailingIcon={<Chevron direction="forward" />}
                    data-testid={testId ? `${testId}-calendar-next` : undefined}
                    className="shrink-0 px-3 @max-[19rem]:min-w-11 @max-[19rem]:px-0"
                >
                    <span className="@max-[19rem]:sr-only">Next</span>
                </Button>
            </div>

            <div
                ref={gridRef}
                role="grid"
                aria-labelledby={headingId}
                onKeyDown={onKeyDown}
                className="flex flex-col gap-1"
            >
                {/* Below 15rem of container (large text on a phone) seven
                    columns cannot hold three-letter days or 15px figures, so
                    the days drop to one letter (still named in full) and the
                    figures step down. Measured: at 200% on a 320 phone the
                    three-letter row overlapped itself. */}
                <div role="row" className="grid grid-cols-7 gap-1 @max-[15rem]:gap-0">
                    {WEEKDAY_LABELS.map((day, i) => (
                        <div
                            key={day}
                            role="columnheader"
                            aria-label={WEEKDAY_NAMES[i]}
                            className="py-1 text-center text-[0.75rem] font-medium text-[var(--text-muted)]"
                        >
                            <span aria-hidden className="@max-[15rem]:hidden">
                                {day}
                            </span>
                            <span aria-hidden className="hidden @max-[15rem]:inline">
                                {day[0]}
                            </span>
                        </div>
                    ))}
                </div>
                {weeks.map((week) => (
                    <div
                        role="row"
                        key={week[0].date}
                        className="grid grid-cols-7 gap-1 @max-[15rem]:gap-0"
                    >
                        {week.map(({ date, inMonth }) => {
                            const state = stateOf(date)
                            const isSelected = date === value
                            const isToday = date === today
                            const isDisabled = state === 'unavailable'
                            const isActive = date === active
                            // Only `limited` earns a dot here. A refused day
                            // is already faded and says "unavailable" in its
                            // name; a red dot under every past day was noise.
                            const dot = state === 'limited' ? DAY_STATE_DOT.limited : null
                            return (
                                <div role="gridcell" aria-selected={isSelected} key={date}>
                                    <button
                                        type="button"
                                        data-date={date}
                                        data-calendar-active={isActive ? '' : undefined}
                                        data-testid={testId ? `${testId}-cell-${date}` : undefined}
                                        tabIndex={isActive ? 0 : -1}
                                        aria-label={`${longDateLabel(date)}${isToday ? ', today' : ''}${DAY_STATE_WORD[state]}`}
                                        aria-current={isToday ? 'date' : undefined}
                                        aria-disabled={isDisabled || undefined}
                                        onClick={() => {
                                            setActive(date)
                                            if (!isDisabled) onSelect(date)
                                        }}
                                        style={state === 'closed' && !isSelected ? CLOSED_HATCH : undefined}
                                        className={cn(
                                            'relative flex min-h-11 w-full items-center justify-center rounded-[0.75rem]',
                                            'text-[0.9375rem] tabular-nums transition-colors @max-[15rem]:text-[0.6875rem]',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                                            'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]',
                                            isSelected
                                                ? // A solid fill, never a tint.
                                                  'bg-[var(--accent-fill)] font-bold text-[var(--on-accent)]'
                                                : state === 'closed' || state === 'full'
                                                  ? 'font-medium text-[var(--text-muted)]'
                                                  : 'font-medium text-[var(--text-strong)]',
                                            !isSelected && !isDisabled && 'hover:bg-[var(--band)]',
                                            // Today is a ring, not a fill, so it never reads as chosen.
                                            isToday &&
                                                !isSelected &&
                                                'font-bold ring-[1.5px] ring-inset ring-[var(--text-strong)]',
                                            !inMonth && !isSelected && 'opacity-55',
                                            isDisabled && 'cursor-not-allowed opacity-35',
                                        )}
                                    >
                                        <span aria-hidden>{dayOfMonth(date)}</span>
                                        {dot && !isSelected ? (
                                            <span
                                                aria-hidden
                                                className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                                                style={{ background: dot }}
                                            />
                                        ) : null}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}
