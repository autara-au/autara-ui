import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

/**
 * DateTile and WhenBlock: when, drawn rather than told (AUTM-1797, graduated
 * from customer-web under AUTM-1799).
 *
 * Don, 2026-10-09, on the customer booking screen: "still a lot of text
 * vibe". The research (Fresha's date picker, a calendar app's icon, Delta's
 * boarding pass) says a date reads fastest as a calendar leaf: the weekday,
 * the day in Satoshi Black, the month. WhenBlock puts the time beside it as a
 * figure and one short fact under it (the job's length), the way the booking
 * pass draws when.
 *
 * The tile is decoration (`aria-hidden`): the caller says the date in words
 * beside it, which WhenBlock does with `dayLabel` for a screen reader. Dates
 * are formatted in the BOOKING's zone (`timeZone`, the pro's clock), never
 * the reader's, so a customer abroad sees the day the pro means.
 */

export interface DateTileParts {
    /** "Sat" */
    weekday: string
    /** "17" */
    day: string
    /** "Oct" */
    month: string
}

/** The tile's three parts in `timeZone`; null for a missing or unreadable time. */
export function dateTileParts(iso: string | null | undefined, timeZone?: string | null, locale = 'en-AU'): DateTileParts | null {
    if (!iso) return null
    const ms = Date.parse(iso)
    if (!Number.isFinite(ms)) return null
    try {
        const parts = new Intl.DateTimeFormat(locale, {
            timeZone: timeZone || undefined,
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        }).formatToParts(new Date(ms))
        const part = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? ''
        return { weekday: part('weekday'), day: part('day'), month: part('month') }
    } catch {
        return null
    }
}

export interface DateTileProps {
    /** The moment, as ISO 8601. */
    iso: string | null | undefined
    /** The IANA zone the date is read in (the pro's). Defaults to the reader's. */
    timeZone?: string | null
    locale?: string
    /** `md` (64px wide) beside a time figure; `sm` (44px) in a list row. */
    size?: 'md' | 'sm'
    className?: string
}

/** A calendar leaf: weekday, the day in Black, the month. Paper, so it reads on deep and on band. */
export function DateTile({ iso, timeZone, locale, size = 'md', className }: DateTileProps) {
    const p = dateTileParts(iso, timeZone, locale)
    if (!p) return null
    const sm = size === 'sm'
    return (
        <span
            aria-hidden
            data-slot="date-tile"
            className={cn(
                'inline-flex shrink-0 flex-col items-center justify-center bg-[var(--paper)] leading-none text-[var(--strong)]',
                sm ? 'min-w-11 rounded-xl px-1 pt-[0.3125rem] pb-1.5' : 'min-w-16 rounded-2xl px-2 pt-2 pb-[0.5625rem]',
                className,
            )}
        >
            <span className={cn('font-bold text-[var(--accent)]', sm ? 'text-xs' : 'text-[0.8125rem]')}>{p.weekday}</span>
            <span
                className={cn(
                    'font-black tracking-[-0.02em] tabular-nums',
                    sm ? 'mt-0.5 mb-px text-[1.25rem]' : 'mt-1 mb-0.5 text-[1.75rem]',
                )}
            >
                {p.day}
            </span>
            <span
                className={cn(
                    'font-medium text-[color-mix(in_srgb,var(--strong)_72%,transparent)]',
                    sm ? 'text-xs' : 'text-[0.8125rem]',
                )}
            >
                {p.month}
            </span>
        </span>
    )
}

export interface WhenBlockProps extends Omit<DateTileProps, 'size' | 'className'> {
    /** The time as a figure: "9:00 am" (with the zone when the reader's differs). */
    time: ReactNode
    /** One short fact under it: "3 hr". */
    sub?: ReactNode
    /** The date in words for a screen reader ("Sat 17 Oct"); the tile is decoration. */
    dayLabel?: string | null
    /** `data-testid` on the text (the date, the time and the fact, as one). */
    testId?: string
    className?: string
}

/**
 * When, as a pass draws it: the tile, the time as a figure, one fact under it.
 * Drawn for a deep surface (BookingPass): the fact is `--on-deep-muted`. It
 * queries the pass (its container): under 15.5rem (very large text, or a
 * phone of 320px or less) the tile and the time stack and the time steps down.
 * A screen reader hears "Sat 17 Oct, 9:00 am, 3 hr".
 */
export function WhenBlock({ iso, timeZone, locale, time, sub, dayLabel, testId, className }: WhenBlockProps) {
    return (
        <div data-slot="when-block" className={cn('flex min-w-0 items-center gap-4 @max-[15.5rem]:flex-wrap', className)}>
            <DateTile iso={iso} timeZone={timeZone} locale={locale} />
            <p data-testid={testId} className="m-0 flex min-w-0 flex-col gap-1">
                {dayLabel ? <span className="sr-only">{dayLabel}, </span> : null}
                <span className="text-[2.125rem] leading-[1.05] font-black tracking-[-0.02em] tabular-nums [overflow-wrap:anywhere] @max-[15.5rem]:text-[1.625rem]">
                    {time}
                </span>
                {sub ? <span className="text-base font-medium text-[var(--on-deep-muted)]">{sub}</span> : null}
            </p>
        </div>
    )
}
