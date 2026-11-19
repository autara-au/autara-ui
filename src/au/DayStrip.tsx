import * as React from 'react'
import { ChipRow, type ChipRowArrows } from '../components/ChipRow'
import { cn } from '../lib/cn'

/**
 * DayStrip: the next days as capsules, the weekday over the date (the
 * two-week strip in Customer/TimePicker.swift). The picked day is the tile,
 * purple with white (AppTheme.brand). A day with nothing to book stays in
 * the strip, dimmed, so the week keeps its shape; say why in words beside it
 * (the caller's `reason`), never only by the dimming. Built on ChipRow, so it
 * swipes, drags and shows chevrons where there is a mouse.
 */
export interface StripDay {
    /** A stable key, usually the ISO date. */
    key: string
    /** "Sat". */
    weekday: string
    /** "21". */
    date: string
    /** The day's full name for a screen reader: "Saturday 21 November". */
    label: string
    /** Nothing to book on this day. It can still be picked, to read why. */
    closed?: boolean
    testId?: string
}

export interface DayStripProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange' | 'role'> {
    days: ReadonlyArray<StripDay>
    value: string | null
    onChange: (key: string) => void
    /** The row's accessible name. Default "Day". */
    label?: string
    nextTestId?: string
    previousTestId?: string
    /** ChipRow's chevrons: `auto` (default), `always` or `never`. */
    arrows?: ChipRowArrows
}

export function DayStrip({ days, value, onChange, label = 'Day', nextTestId, previousTestId, arrows, className, ...rest }: DayStripProps) {
    return (
        <ChipRow
            role="radiogroup"
            label={label}
            nextLabel="Later days"
            previousLabel="Earlier days"
            nextTestId={nextTestId}
            previousTestId={previousTestId}
            arrows={arrows}
            className={cn('au-day-strip', className)}
            {...rest}
        >
            {days.map((d) => {
                const on = d.key === value
                return (
                    <button
                        key={d.key}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={d.closed ? `${d.label}, nothing to book` : d.label}
                        data-testid={d.testId}
                        data-closed={d.closed ? '' : undefined}
                        className="au-day"
                        onClick={() => onChange(d.key)}
                    >
                        <span className="au-day__weekday" aria-hidden="true">{d.weekday}</span>
                        <span className="au-day__date" aria-hidden="true">{d.date}</span>
                    </button>
                )
            })}
        </ChipRow>
    )
}
