'use client'

import * as React from 'react'

import { cn } from '../lib/cn'
import {
    addDays,
    dayOfMonth,
    daysBetween,
    isISODate,
    longDateLabel,
    monthGrid,
    monthYearLabel,
    weekdayIndex,
    WEEKDAY_LABELS,
} from '../lib/calendar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './Sheet'
import { Button } from './Button'

/**
 * How a day should read before it is chosen.
 *
 * `limited` is not decoration: a merchant deciding where to put a walk-in
 * wants to see the nearly-full day BEFORE tapping into it, which is the thing
 * a native date input can never show (AUTM-703, AUTM-707).
 */
export type DayState = 'available' | 'limited' | 'unavailable'

export interface DatePickerProps {
    /** `YYYY-MM-DD`, or `''` when nothing is chosen yet. */
    value: string
    onChange: (value: string) => void
    /**
     * Today, as `YYYY-MM-DD` **in the merchant's timezone**.
     *
     * Required, and deliberately not defaulted. A default would mean calling
     * `new Date()` in here, which picks the DEVICE's zone: a Perth merchant on
     * a tablet still set to Sydney would be shown tomorrow as today and lose a
     * bookable evening. `merchant_profiles.timezone` is the source of truth
     * (AUT-575) and only the caller knows it.
     */
    today: string
    /** Earliest selectable date, `YYYY-MM-DD`. Defaults to `today`. */
    min?: string
    /** Latest selectable date, `YYYY-MM-DD`. Unbounded when omitted. */
    max?: string
    /** Days offered on the rail before the merchant has to open the month. */
    stripDays?: number
    /** Per-day availability. Called for rail days and visible month cells. */
    dayState?: (date: string) => DayState
    disabled?: boolean
    /** Marks the control invalid for assistive tech and colours the edge. */
    invalid?: boolean
    /** Names the group for screen readers. @default 'Date' */
    label?: string
    testId?: string
    className?: string
}

function clampable(date: string, min: string, max?: string): boolean {
    if (date < min) return false
    if (max && date > max) return false
    return true
}

const DOT: Record<DayState, string | null> = {
    available: null,
    limited: 'var(--intent-warning-text)',
    unavailable: 'var(--intent-error-text)',
}

const STATE_WORD: Record<DayState, string> = {
    available: '',
    limited: ', nearly full',
    unavailable: ', unavailable',
}

/**
 * DatePicker — a rail of the coming days, with the full month one tap behind it.
 *
 * ── Why a rail and not a calendar ────────────────────────────────────────
 *
 * The moment this serves is a merchant taking a walk-in or a phone booking
 * with the customer waiting. Those jobs are nearly always inside a fortnight,
 * so the rail answers the common case in ONE tap where a calendar costs an
 * open, a read and a tap. Fresha and Booksy both landed on the same shape for
 * the same reason. The month sheet is still there for the job in November.
 *
 * ── What it refuses to do ────────────────────────────────────────────────
 *
 * It never reads the clock. `today` comes in from the caller in the shop's
 * timezone. See `lib/calendar.ts` for why that is the whole point.
 *
 * It never renders a date the merchant cannot pick as though they could: out
 * of range and `unavailable` days are `aria-disabled` and inert, rather than
 * accepting the tap and failing later in the form.
 */
export function DatePicker({
    value,
    onChange,
    today,
    min,
    max,
    stripDays = 14,
    dayState,
    disabled = false,
    invalid = false,
    label = 'Date',
    testId,
    className,
}: DatePickerProps) {
    const [monthOpen, setMonthOpen] = React.useState(false)
    const floor = isISODate(min) ? (min as string) : today
    const days = React.useMemo(
        () => Array.from({ length: stripDays }, (_, i) => addDays(floor, i)),
        [floor, stripDays],
    )

    /**
     * The rail is a radio group, so a screen reader says "3 of 14" rather than
     * reading fourteen unrelated buttons. That means ONE tab stop and arrow
     * keys inside it — the roving tabindex below — which is also what makes it
     * bearable with a keyboard.
     */
    const selectedIndex = days.indexOf(value)
    const [focusIndex, setFocusIndex] = React.useState(0)
    const activeIndex = selectedIndex >= 0 ? selectedIndex : focusIndex
    const railRef = React.useRef<HTMLDivElement>(null)

    const stateOf = React.useCallback(
        (date: string): DayState => {
            if (!clampable(date, floor, max)) return 'unavailable'
            return dayState?.(date) ?? 'available'
        },
        [dayState, floor, max],
    )

    function moveFocus(next: number) {
        const clamped = Math.max(0, Math.min(days.length - 1, next))
        setFocusIndex(clamped)
        const el = railRef.current?.querySelectorAll<HTMLButtonElement>('[data-day]')[clamped]
        el?.focus()
        el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }

    function onRailKeyDown(event: React.KeyboardEvent) {
        const map: Record<string, number> = {
            ArrowRight: activeIndex + 1,
            ArrowLeft: activeIndex - 1,
            ArrowDown: activeIndex + 7,
            ArrowUp: activeIndex - 7,
            Home: 0,
            End: days.length - 1,
        }
        if (!(event.key in map)) return
        event.preventDefault()
        moveFocus(map[event.key])
    }

    return (
        <div className={cn('flex flex-col gap-2', className)} data-testid={testId}>
            <div
                ref={railRef}
                role="radiogroup"
                aria-label={label}
                aria-invalid={invalid || undefined}
                onKeyDown={onRailKeyDown}
                className={cn(
                    'flex gap-1.5 overflow-x-auto pb-1',
                    // Momentum scrolling that stops on a whole day rather than
                    // halfway through one.
                    'snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                )}
            >
                {days.map((date, index) => {
                    const state = stateOf(date)
                    const isSelected = date === value
                    const isDisabled = disabled || state === 'unavailable'
                    const dot = DOT[state]
                    return (
                        <button
                            key={date}
                            type="button"
                            data-day={date}
                            data-testid={testId ? `${testId}-day-${date}` : undefined}
                            role="radio"
                            aria-checked={isSelected}
                            aria-disabled={isDisabled || undefined}
                            // One tab stop for the whole rail.
                            tabIndex={index === activeIndex ? 0 : -1}
                            onClick={() => {
                                if (isDisabled) return
                                setFocusIndex(index)
                                onChange(date)
                            }}
                            className={cn(
                                'snap-start shrink-0 rounded-[12px] border px-3 py-2',
                                'flex min-h-[3.25rem] min-w-[3.25rem] flex-col items-center justify-center gap-0.5',
                                'transition-colors focus-visible:outline-none focus-visible:ring-2',
                                'focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
                                'focus-visible:ring-offset-[var(--background)]',
                                isSelected
                                    ? // Rule 4: a solid fill, never a tint.
                                      'border-transparent bg-[var(--accent-fill)] text-[var(--on-accent)]'
                                    : 'border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-strong)]',
                                !isSelected &&
                                    !isDisabled &&
                                    'hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)]',
                                isDisabled && 'cursor-not-allowed opacity-40',
                            )}
                        >
                            <span
                                className={cn(
                                    'text-[0.6875rem] font-medium',
                                    isSelected
                                        ? 'text-[var(--on-accent)]/75'
                                        : 'text-[var(--text-muted)]',
                                )}
                            >
                                {WEEKDAY_LABELS[weekdayIndex(date)]}
                            </span>
                            <span className="text-[1.0625rem] font-bold leading-none tabular-nums">
                                {dayOfMonth(date)}
                            </span>
                            {/* Availability is carried by a WORD for screen
                                readers and by the dot for everyone else —
                                never by colour alone (WCAG 1.4.1). */}
                            <span
                                aria-hidden
                                className="block h-1 w-1 rounded-full"
                                style={{ background: dot ?? 'transparent' }}
                            />
                            <span className="sr-only">
                                {longDateLabel(date)}
                                {daysBetween(today, date) === 0 ? ', today' : ''}
                                {STATE_WORD[state]}
                            </span>
                        </button>
                    )
                })}
            </div>

            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    onClick={() => setMonthOpen(true)}
                    data-testid={testId ? `${testId}-more` : undefined}
                >
                    More dates
                </Button>
                {value ? (
                    <span className="text-[0.8125rem] text-[var(--text-muted)]">
                        {longDateLabel(value)}
                    </span>
                ) : null}
            </div>

            <MonthSheet
                open={monthOpen}
                onOpenChange={setMonthOpen}
                value={value}
                today={today}
                min={floor}
                max={max}
                stateOf={stateOf}
                onSelect={(date) => {
                    onChange(date)
                    setMonthOpen(false)
                }}
                testId={testId}
            />
        </div>
    )
}

interface MonthSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    value: string
    today: string
    min: string
    max?: string
    stateOf: (date: string) => DayState
    onSelect: (date: string) => void
    testId?: string
}

function MonthSheet({
    open,
    onOpenChange,
    value,
    today,
    min,
    max,
    stateOf,
    onSelect,
    testId,
}: MonthSheetProps) {
    const [cursor, setCursor] = React.useState(value || today)
    // Reopening on a stale month is disorienting, so re-anchor each time.
    React.useEffect(() => {
        if (open) setCursor(value || today)
    }, [open, value, today])

    const cells = React.useMemo(() => monthGrid(cursor), [cursor])
    const canGoBack = `${cursor.slice(0, 7)}-01` > min

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="flex max-h-[85dvh] flex-col gap-3">
                <SheetHeader>
                    <SheetTitle>Pick a date</SheetTitle>
                    <SheetDescription>{monthYearLabel(cursor)}</SheetDescription>
                </SheetHeader>

                <div className="flex items-center justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={!canGoBack}
                        onClick={() => setCursor(addDays(`${cursor.slice(0, 7)}-01`, -1))}
                    >
                        Back
                    </Button>
                    <span className="text-[0.9375rem] font-medium text-[var(--text-strong)]">
                        {monthYearLabel(cursor)}
                    </span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCursor(addDays(`${cursor.slice(0, 7)}-01`, 32))}
                    >
                        Next
                    </Button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                    {WEEKDAY_LABELS.map((day) => (
                        <span
                            key={day}
                            aria-hidden
                            className="py-1 text-[0.6875rem] font-medium text-[var(--text-muted)]"
                        >
                            {day}
                        </span>
                    ))}
                    {cells.map(({ date, inMonth }) => {
                        const state = stateOf(date)
                        const isSelected = date === value
                        const isDisabled = state === 'unavailable'
                        return (
                            <button
                                key={date}
                                type="button"
                                data-testid={testId ? `${testId}-cell-${date}` : undefined}
                                aria-pressed={isSelected}
                                aria-disabled={isDisabled || undefined}
                                onClick={() => !isDisabled && onSelect(date)}
                                className={cn(
                                    'flex min-h-[2.75rem] items-center justify-center rounded-[10px]',
                                    'text-[0.9375rem] tabular-nums transition-colors',
                                    'focus-visible:outline-none focus-visible:ring-2',
                                    'focus-visible:ring-[var(--accent)]',
                                    isSelected
                                        ? 'bg-[var(--accent-fill)] font-bold text-[var(--on-accent)]'
                                        : 'text-[var(--text-strong)] hover:bg-[var(--surface-elevated)]',
                                    !inMonth && !isSelected && 'text-[var(--text-muted)] opacity-50',
                                    isDisabled && 'cursor-not-allowed opacity-30 hover:bg-transparent',
                                    date === today && !isSelected && 'font-bold',
                                )}
                            >
                                {dayOfMonth(date)}
                                <span className="sr-only">
                                    {longDateLabel(date)}
                                    {STATE_WORD[state]}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </SheetContent>
        </Sheet>
    )
}
