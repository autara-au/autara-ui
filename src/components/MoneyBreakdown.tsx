import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { Badge } from './Badge'
import { MoneyFigure } from './MoneyFigure'

/**
 * MoneyBreakdown — lines of money, then the one that matters.
 *
 * Deposit now, balance after the job, cancellation fee, refund, total: the
 * customer web hand-built this list on the checkout review, both cancel
 * pages and the booking detail, each with its own alignment and its own
 * idea of which line is bold (AUTM-1185). This is the one shape.
 *
 * A `<dl>`, because a label/value list is what it is: screen readers read
 * "Deposit paid, 54 dollars" as a pair. Values are right-aligned on tabular
 * figures so amounts line up. `total` sits under a hairline and carries
 * the weight; `note` is the small print under it ("within 5 to 10 business
 * days", "GST included").
 *
 * AUTM-1594 — canvas v44 "Money breakdown": 15px rows in ink with the
 * amount in Bold, 10px apart; the total at 16px under a hairline. `title`
 * and `card` draw the sheet's specimen whole (a band card, 24px, 20px in,
 * a 16px Bold title); leave them off where the page already supplies the
 * card. Amounts come from the server and are never summed here.
 *
 * The values are ReactNode on purpose: the consumer formats money in its
 * own locale and currency (`A$54.00`); this component never touches a
 * number.
 *
 * AUTM-1797 / AUTM-1799: `variant="chips"` draws each row as a chip, the
 * amount in Black over its few words ("$54" over "On hold"), side by side,
 * coloured by what the money IS, in the house palette: `money` lime (paid,
 * refunded), `flight` aqua (on hold, a refund on its way), `act` purple
 * (yours to pay or confirm), `neutral` band (after the job, kept by the
 * pro). The same `<dl>`, the same ids: only the drawing changes, the value
 * still comes first for a screen reader as "On hold, 54 dollars".
 *
 * A chip's amount is never split: "$25.18" stays one figure on one line, at
 * any text size (it used to break mid-number at 200% text), and never runs
 * out of its chip: where the whole figure is wider than the chip, it scales
 * down to fit (MoneyFigure measures it). The chips sit side by side down to
 * 8rem each.
 *
 * AUTM-1856 (Don, 2026-10-13, every surface): no big coloured money tiles.
 * Every chip is the neutral band card with the amount in ink; what the money
 * is doing moves to a SMALL SOLID badge, `state`, coloured by `tone` (aqua on
 * hold or pending, lime paid or captured, purple yours to act on, grey a
 * balance still due). The label and the badge share the top line, the amount
 * sits under them. A row without `state` draws no badge, so `tone` alone no
 * longer paints anything. The `<dl>` is unchanged: the label and the badge
 * are the `<dt>` ("Deposit, Captured"), the amount the `<dd>`.
 */
export interface MoneyRow {
    label: ReactNode
    value: ReactNode
    /** Dim the row: a fee already covered, a line that is context not money owed. */
    muted?: boolean
    /** Bold the row without making it the total. */
    emphasis?: boolean
    /** `data-testid` on the row, so a spec can read one line. */
    testId?: string
    /** `variant="chips"`: what the money is, which colours the `state` badge. */
    tone?: MoneyTone
    /**
     * `variant="chips"`: what the money is doing, as a small solid badge beside
     * the label ("Captured", "On hold", "Balance due"). AUTM-1856.
     */
    state?: ReactNode
}

/** The state badge's palette: lime money in, aqua in flight, purple yours to act on, grey otherwise. */
export type MoneyTone = 'money' | 'flight' | 'act' | 'neutral'

/**
 * AUTM-1856: the badge, not the chip, carries the tone. Grey is band-press,
 * one step down from the band card it sits on, so it reads as a badge and
 * not as a hole in the card; its words are ink on it (16:1 light, 14:1 dark).
 */
const STATE_BADGE: Record<MoneyTone, { variant: 'lime' | 'aqua' | 'brand' | 'band'; className?: string }> = {
    money: { variant: 'lime' },
    flight: { variant: 'aqua' },
    act: { variant: 'brand' },
    neutral: { variant: 'band', className: 'bg-[var(--band-press)]' },
}

export interface MoneyBreakdownProps {
    rows: MoneyRow[]
    /** The line under the hairline, bold. */
    total?: MoneyRow
    /** Small print under the total. */
    note?: ReactNode
    /** Accessible name for the list, e.g. "Payment summary". */
    label?: string
    /** A visible heading over the rows ("If you cancel now"). */
    title?: ReactNode
    /** Draw the band card around it, as the sheet's specimen. */
    card?: boolean
    /** `list` (default): label and amount on a line. `chips`: each row a chip. */
    variant?: 'list' | 'chips'
    testId?: string
    className?: string
}

function Chip({ row }: { row: MoneyRow }) {
    const tone = row.tone ?? 'neutral'
    const badge = STATE_BADGE[tone]
    return (
        <div
            data-testid={row.testId}
            data-tone={tone}
            className="flex min-w-0 flex-col gap-1.5 rounded-[1.25rem] bg-[var(--band)] px-4 pt-3.5 pb-[0.9375rem] text-[var(--text-strong)]"
        >
            {/* The label and its state on one line, wrapping under each other
                when the chip is narrow or the text is large. */}
            <dt className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[0.9375rem] leading-snug font-medium text-[var(--text-muted)]">
                <span className="min-w-0">{row.label}</span>
                {row.state != null && row.state !== false ? (
                    <Badge variant={badge.variant} className={badge.className} data-money-state={tone}>
                        {row.state}
                    </Badge>
                ) : null}
            </dt>
            {/* Whole: an amount never breaks mid-number, and fits its chip. */}
            <MoneyFigure className="leading-[1.1] font-black tracking-[-0.02em] tabular-nums">{row.value}</MoneyFigure>
        </div>
    )
}

function Row({ row, total }: { row: MoneyRow; total?: boolean }) {
    return (
        <div
            data-testid={row.testId}
            className={cn(
                'flex items-baseline justify-between gap-4 leading-snug text-[var(--text-strong)]',
                total ? 'border-t border-[var(--hairline)] pt-2.5 text-base' : 'text-[0.9375rem]',
                row.emphasis && !total && 'font-bold',
                row.muted && 'text-[var(--text-subtle)]',
            )}
        >
            <dt className="min-w-0">{row.label}</dt>
            <dd className="shrink-0 font-bold tabular-nums">{row.value}</dd>
        </div>
    )
}

export function MoneyBreakdown({
    rows,
    total,
    note,
    label,
    title,
    card = false,
    variant = 'list',
    testId,
    className,
}: MoneyBreakdownProps) {
    if (variant === 'chips') {
        return (
            <div data-testid={testId} className={cn('flex flex-col gap-2.5', className)}>
                {title ? <p className="text-base leading-snug font-bold text-[var(--text-strong)]">{title}</p> : null}
                <dl
                    aria-label={label}
                    data-variant="chips"
                    className="m-0 grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-2.5"
                >
                    {rows.map((row, i) => (
                        <Chip key={i} row={row} />
                    ))}
                    {total ? <Chip row={total} /> : null}
                </dl>
                {note ? <p className="m-0 text-[0.8125rem] leading-relaxed text-[var(--text-subtle)]">{note}</p> : null}
            </div>
        )
    }
    return (
        <div
            data-testid={testId}
            className={cn(
                card && 'flex flex-col gap-2.5 rounded-[1.5rem] bg-[var(--band)] p-5 text-[var(--text-strong)]',
                className,
            )}
        >
            {title ? <p className="text-base leading-snug font-bold text-[var(--text-strong)]">{title}</p> : null}
            <dl aria-label={label} className="flex flex-col gap-2.5">
                {rows.map((row, i) => (
                    <Row key={i} row={row} />
                ))}
                {/* AUTM-1781: the total row carries its own rule. It was
                    wrapped in a div, which put its dt and dd two levels
                    under the dl (axe definition-list, dlitem). */}
                {total ? <Row row={total} total /> : null}
            </dl>
            {note ? (
                <p className={cn('text-[0.8125rem] leading-relaxed text-[var(--text-subtle)]', !card && 'mt-2')}>{note}</p>
            ) : null}
        </div>
    )
}
