import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

/**
 * FactRows: place and car as icon rows with no "Where" or "Vehicle" over
 * them (AUTM-1797, graduated from customer-web under AUTM-1799).
 *
 * Uber Eats' order card and Fresha's checkout card let an icon say what a
 * row is. Still a definition list: each label is a visually hidden `dt`, so
 * a screen reader hears "Where, 41 Smith Street" as a pair (AUTM-1214's
 * rule: exactly one div between the dl and its dt and dd). The icon is the
 * caller's (the package carries no icon set); it sits in a band disc.
 */
export interface FactRow {
    key: string
    /** About 20px, decorative: the label names the row. */
    icon: ReactNode
    /** For a screen reader only ("Where", "Vehicle"). */
    label: string
    value: ReactNode
    /** One short line under the value ("Street address once your deposit is charged"). */
    note?: ReactNode
    /** `data-testid` on the value. */
    testId?: string
}

export interface FactRowsProps {
    rows: FactRow[]
    /** Accessible name of the list. */
    label?: string
    className?: string
}

export function FactRows({ rows, label = 'Booking details', className }: FactRowsProps) {
    if (rows.length === 0) return null
    return (
        <dl aria-label={label} data-slot="fact-rows" className={cn('motion-rows m-0 flex min-w-0 flex-col gap-1', className)}>
            {rows.map((r) => (
                <div key={r.key} className="min-w-0">
                    <dt className="sr-only">{r.label}</dt>
                    <dd className="m-0 flex min-h-12 items-center gap-3.5 text-[1.0625rem] leading-[1.35] font-medium text-[var(--text-strong)]">
                        <span
                            aria-hidden
                            className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--band)] text-[var(--text-strong)] [&_svg]:size-5"
                        >
                            {r.icon}
                        </span>
                        <span className="flex min-w-0 flex-col [overflow-wrap:break-word]">
                            <span data-testid={r.testId}>{r.value}</span>
                            {r.note ? (
                                <span className="mt-0.5 text-sm font-normal text-[var(--text-muted)]">{r.note}</span>
                            ) : null}
                        </span>
                    </dd>
                </div>
            ))}
        </dl>
    )
}
