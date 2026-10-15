'use client'

import * as React from 'react'

import { cn } from '../lib/cn'
import { useLabelFor } from '../lib/use-label-for'
import {
    addDays,
    dateLabelFrom,
    dayOfMonth,
    daysBetween,
    isISODate,
    longDateLabel,
    weekdayIndex,
    WEEKDAY_LABELS,
} from '../lib/calendar'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './Dialog'
import { Button } from './Button'
import {
    CLOSED_HATCH,
    DAY_STATE_DOT,
    DAY_STATE_WORD,
    MonthCalendar,
    type DayState,
} from './MonthCalendar'

export type { DayState }

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
    /**
     * Per-day availability. Called for rail days and visible month cells.
     * `closed` days are muted and hatched but still selectable; only
     * `unavailable` days are refused (AUTM-1633).
     */
    dayState?: (date: string) => DayState
    /**
     * A line under the month calendar's title, e.g. what a muted day means.
     * Omit it and the calendar carries only its title.
     */
    calendarNote?: string
    disabled?: boolean
    /** Marks the control invalid for assistive tech and colours the edge. */
    invalid?: boolean
    /** Names the group for screen readers. @default 'Date' */
    label?: string
    /**
     * AUTM-1267 — the id a caller's `<Label htmlFor>` points at. It goes on
     * the group, the label names the group, and a click on the label focuses
     * the day holding the tab stop. See `lib/use-label-for.ts`.
     */
    id?: string
    testId?: string
    className?: string
}

function clampable(date: string, min: string, max?: string): boolean {
    if (date < min) return false
    if (max && date > max) return false
    return true
}

/**
 * AUTM-1633 — how many days sit before a chosen day when the rail has to move
 * to show it. Three: the day before and after are what a merchant compares
 * ("Thursday or Friday?"), and at seven pills to a phone's rail the chosen one
 * lands in the middle of what is visible.
 */
const RAIL_LEAD = 3

/** Solar Bold "Calendar", inlined so autara-ui does not depend on an icon set. */
function CalendarIcon() {
    return (
        <svg
            aria-hidden
            viewBox="0 0 24 24"
            // In em, so the icon grows with the label under text scaling.
            className="size-[1.2em] shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
            <path d="M8 3v4M16 3v4M3.5 10h17" />
        </svg>
    )
}

/**
 * AUTM-1373 — the rail's mouse affordance.
 *
 * The rail hides its scrollbar on purpose: a scrollbar under fourteen day
 * pills looks like a bug on a tablet, and a finger does not need one. What
 * that left behind was a rail holding 806px of days in a 400px box with no
 * scrollbar and no arrows, so half the fortnight was unreachable with a mouse
 * and nothing on screen said those days existed. QA measured 7 of 14 days
 * visible, and before the sheet was pinned the only way to reach day 8 was to
 * drag the whole sheet sideways, which was itself the other half of that bug.
 *
 * Shown only where the pointer is FINE. A touch device scrolls the rail by
 * dragging it and always could, so arrows there would spend two day-widths of
 * a phone's rail on a problem it does not have. An iPad with a trackpad
 * reports a fine pointer and gets them, which is the case that matters most.
 *
 * Deliberately `aria-hidden` and out of the tab order. The rail is a
 * radiogroup with ONE tab stop and arrow keys inside it, which is already a
 * better keyboard route than two buttons; exposing these would add two tab
 * stops to a control built to have one, and would read to a screen reader as a
 * second way to do what the arrow keys already do. Nothing becomes
 * mouse-only: every day is still a radio in the group.
 */
const RailArrow: React.FC<{
    direction: 'back' | 'forward'
    disabled: boolean
    onPress: () => void
    testId?: string
}> = ({ direction, disabled, onPress, testId }) => (
    <button
        type="button"
        aria-hidden
        tabIndex={-1}
        disabled={disabled}
        onClick={onPress}
        data-testid={testId}
        className={cn(
            // `hidden` until the pointer is fine — see the note above.
            'hidden shrink-0 items-center justify-center rounded-[12px] border',
            '[@media(pointer:fine)]:flex',
            'min-h-[3.25rem] w-7 border-[var(--border-subtle)] bg-[var(--surface)]',
            'text-[var(--text-muted)] transition-colors',
            disabled
                ? 'cursor-not-allowed opacity-30'
                : 'hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-strong)]',
        )}
    >
        <svg
            aria-hidden
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d={direction === 'back' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
        </svg>
    </button>
)

/**
 * DatePicker — a rail of the coming days, with the full month one tap behind it.
 *
 * ── AUTM-1633: any date, and the rail follows ────────────────────────────
 *
 * Don, 2026-10-03: "dates are very limited but I like the UI". The month was
 * already behind the rail, behind a ghost "More dates" link that read as a
 * footnote. It is now a "Pick a date" button with a calendar icon, and it
 * opens `MonthCalendar` as the library's responsive dialog: a bottom sheet on
 * a phone, a centred card from `sm`. Choosing a day there that the rail does
 * not hold MOVES the rail to it (three days before it, see `RAIL_LEAD`) and
 * scrolls it into view selected, so the merchant sees their choice where they
 * left off rather than a fortnight that no longer contains it.
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
    calendarNote,
    disabled = false,
    invalid = false,
    label = 'Date',
    id,
    testId,
    className,
}: DatePickerProps) {
    const [monthOpen, setMonthOpen] = React.useState(false)
    const floor = isISODate(min) ? (min as string) : today

    /**
     * AUTM-1633 — where the rail starts. Today's fortnight (from `floor`)
     * unless the chosen day is beyond it; then the rail moves to hold it.
     * Kept in state so a tap on another day of a moved rail does not snap it
     * back, and adjusted DURING render (React's derived-state pattern) so the
     * moved rail is what the very first paint shows.
     */
    const anchorFor = React.useCallback(
        (date: string) => {
            if (!isISODate(date) || date < addDays(floor, stripDays)) return floor
            return addDays(date, -Math.min(RAIL_LEAD, Math.floor((stripDays - 1) / 2)))
        },
        [floor, stripDays],
    )
    const [railStart, setRailStart] = React.useState(() => anchorFor(value))
    let start = railStart
    const holdsValue =
        !isISODate(value) || value < floor || (value >= start && value < addDays(start, stripDays))
    if (start < floor || !holdsValue) start = anchorFor(value)
    if (start !== railStart) setRailStart(start)

    const days = React.useMemo(
        () => Array.from({ length: stripDays }, (_, i) => addDays(start, i)),
        [start, stripDays],
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
    const calendarRef = React.useRef<HTMLDivElement>(null)

    const stateOf = React.useCallback(
        (date: string): DayState => {
            if (!clampable(date, floor, max)) return 'unavailable'
            return dayState?.(date) ?? 'available'
        },
        [dayState, floor, max],
    )

    /**
     * AUTM-1373 — where the rail currently sits, so an arrow that can do
     * nothing looks like it. Read off the element rather than tracked, because
     * the rail is also moved by dragging, by the keyboard's `scrollIntoView`
     * and by a resize.
     */
    const [reach, setReach] = React.useState({ scrollable: false, back: false, forward: false })

    const measureReach = React.useCallback(() => {
        const el = railRef.current
        if (!el) return
        // A pixel of tolerance: a fractional scrollWidth on a zoomed page
        // would otherwise leave the forward arrow live at the far end for ever.
        const max = el.scrollWidth - el.clientWidth
        setReach({ scrollable: max > 1, back: el.scrollLeft > 1, forward: el.scrollLeft < max - 1 })
    }, [])

    React.useEffect(() => {
        const el = railRef.current
        if (!el) return
        measureReach()
        el.addEventListener('scroll', measureReach, { passive: true })
        // The rail's width changes with the dialog, the window and the tablet's
        // orientation, and none of those fires `scroll`.
        const observer =
            typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measureReach)
        observer?.observe(el)
        return () => {
            el.removeEventListener('scroll', measureReach)
            observer?.disconnect()
        }
        // `days` is a dependency because a new range resets the geometry.
    }, [measureReach, days])

    /**
     * Three days a press, measured off the rail rather than assumed: a day
     * pill's width answers to the root font size, so it changes under the
     * merchant's text scaling.
     */
    function nudge(direction: -1 | 1) {
        const el = railRef.current
        if (!el) return
        const cells = el.querySelectorAll<HTMLElement>('[data-day]')
        const measured = cells.length > 1 ? cells[1].offsetLeft - cells[0].offsetLeft : 0
        // A rail that is laid out but not visible — inside a collapsed panel,
        // or an inactive tab — measures 0, so a third of the box is the floor
        // rather than a scroll of nothing.
        const pitch = measured > 0 ? measured : Math.round(el.clientWidth / 3)
        el.scrollBy({ left: direction * pitch * 3, behavior: 'smooth' })
    }

    /**
     * AUTM-1633 — bring the chosen day into view whenever it changes: after a
     * pick in the month calendar, or a prefilled day nine days out. Sets
     * `scrollLeft` on the rail itself rather than calling `scrollIntoView`,
     * which would also scroll every scrolling ancestor (the dialog body this
     * usually sits in) to line the pill up vertically.
     */
    React.useLayoutEffect(() => {
        const rail = railRef.current
        if (!rail || !isISODate(value)) return
        const pill = rail.querySelector<HTMLElement>(`[data-day="${value}"]`)
        if (!pill) return
        const left = pill.offsetLeft
        const right = left + pill.offsetWidth
        if (left < rail.scrollLeft) rail.scrollLeft = left
        else if (right > rail.scrollLeft + rail.clientWidth) rail.scrollLeft = right - rail.clientWidth
    }, [value, start])

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

    const labelledBy = useLabelFor(id, () =>
        railRef.current?.querySelector<HTMLElement>('[role="radio"][tabindex="0"]'),
    )

    return (
        <div className={cn('flex flex-col gap-2', className)} data-testid={testId}>
            {/* AUTM-1373 — the arrows sit BESIDE the rail, not over it.
                Floating them on top would cover the first and last day pill,
                and a gradient fade to soften that would have to guess which
                surface the host put behind the rail. They are rendered only
                when there is somewhere to scroll, so a short rail that fits
                carries no chrome at all. */}
            <div className="flex items-start gap-1">
                {reach.scrollable ? (
                    <RailArrow
                        direction="back"
                        disabled={disabled || !reach.back}
                        onPress={() => nudge(-1)}
                        testId={testId ? `${testId}-earlier` : undefined}
                    />
                ) : null}
                <div
                    ref={railRef}
                    id={id}
                    role="radiogroup"
                    aria-labelledby={labelledBy}
                    aria-label={labelledBy ? undefined : label}
                    aria-invalid={invalid || undefined}
                    onKeyDown={onRailKeyDown}
                    className={cn(
                        // AUTM-1373 — `relative` makes the rail the containing block
                        // for each day's `sr-only` label, which is absolutely
                        // positioned. Without it those labels escaped the rail's
                        // overflow and widened the nearest positioned ancestor: in
                        // a scrolling dialog the whole sheet scrolled sideways
                        // (805px of content in a 448px sheet) instead of the rail.
                        'relative flex gap-1.5 overflow-x-auto pb-1',
                        // Momentum scrolling that stops on a whole day rather than
                        // halfway through one.
                        'snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                    )}
                >
                    {days.map((date, index) => {
                        const state = stateOf(date)
                        const isSelected = date === value
                        const isDisabled = disabled || state === 'unavailable'
                        const isClosed = state === 'closed' && !isSelected
                        // AUTM-1867 — open, but nothing free: dimmed ink, no hatch.
                        const isFull = state === 'full' && !isSelected
                        const dot = DAY_STATE_DOT[state]
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
                                style={isClosed ? CLOSED_HATCH : undefined}
                                className={cn(
                                    'snap-start shrink-0 rounded-[12px] border px-3 py-2',
                                    'flex min-h-[3.25rem] min-w-[3.25rem] flex-col items-center justify-center gap-0.5',
                                    'transition-colors focus-visible:outline-none focus-visible:ring-2',
                                    'focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
                                    'focus-visible:ring-offset-[var(--background)]',
                                    isSelected
                                        ? // Rule 4: a solid fill, never a tint.
                                          'border-transparent bg-[var(--accent-fill)] text-[var(--on-accent)]'
                                        : isClosed
                                          ? // AUTM-1633 — closed but still yours: muted ink over the hatch.
                                            'border-dashed border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-muted)]'
                                          : isFull
                                            ? 'border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-muted)]'
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
                                    {DAY_STATE_WORD[state]}
                                </span>
                            </button>
                        )
                    })}
                </div>
                {reach.scrollable ? (
                    <RailArrow
                        direction="forward"
                        disabled={disabled || !reach.forward}
                        onPress={() => nudge(1)}
                        testId={testId ? `${testId}-later` : undefined}
                    />
                ) : null}
            </div>

            {/* AUTM-1633 — the way to any date. A band pill with a calendar
                icon, where it was a ghost "More dates" that read as a footnote.
                The test id keeps its `-more` suffix: QA's suite opens the month
                by it (autara-web-automation NewBookingPage, InvoiceFormPage). */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Button
                    type="button"
                    variant="quiet"
                    size="sm"
                    disabled={disabled}
                    onClick={() => setMonthOpen(true)}
                    leadingIcon={<CalendarIcon />}
                    aria-haspopup="dialog"
                    data-testid={testId ? `${testId}-more` : undefined}
                >
                    Pick a date
                </Button>
                {value ? (
                    <span className="text-[0.875rem] text-[var(--text-muted)]">
                        {dateLabelFrom(today, value)}
                    </span>
                ) : null}
            </div>

            <Dialog open={monthOpen} onOpenChange={setMonthOpen}>
                <DialogContent
                    ref={calendarRef}
                    layout="responsive"
                    className="sm:max-w-[26rem]"
                    data-testid={testId ? `${testId}-calendar` : undefined}
                    // No description means no `aria-describedby`, rather than
                    // Radix pointing it at nothing.
                    {...(calendarNote ? {} : { 'aria-describedby': undefined })}
                    // Open on the day holding the calendar's tab stop, not on
                    // Back (the first tabbable control), so arrows work at once.
                    onOpenAutoFocus={(event) => {
                        const day = calendarRef.current?.querySelector<HTMLElement>(
                            '[data-calendar-active]',
                        )
                        if (!day) return
                        event.preventDefault()
                        day.focus()
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Pick a date</DialogTitle>
                        {calendarNote ? <DialogDescription>{calendarNote}</DialogDescription> : null}
                    </DialogHeader>
                    <DialogBody>
                        <MonthCalendar
                            value={value}
                            today={today}
                            min={floor}
                            max={max}
                            dayState={dayState}
                            onSelect={(date) => {
                                onChange(date)
                                setMonthOpen(false)
                            }}
                            testId={testId}
                        />
                    </DialogBody>
                </DialogContent>
            </Dialog>
        </div>
    )
}
