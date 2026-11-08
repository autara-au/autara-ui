import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

/**
 * InfoRow — two-column key-value display.
 *
 * Used wherever a row of metadata reads as "label: value" — booking
 * detail summaries, customer profile cards, payment breakdowns,
 * invoice previews. Stack them in a plain `<div>`: rows read as separate
 * by their padding, never by a rule between them.
 *
 * Aesthetic:
 *   - Label muted ink, value strong ink
 *   - Tabular-nums on value for numeric alignment
 *   - `emphasised` bumps the value to font-bold (use for the row that
 *     anchors the group — e.g. the "Total" row in a payment summary)
 */

export interface InfoRowProps {
    label: string
    value: ReactNode
    /** Renders the value in font-bold instead of font-medium. */
    emphasised?: boolean
    className?: string
}

/*
 * AUTM-1594 — canvas v44 "Info row": 12px in, 15px.
 * AUTM-2042 (Don, 2026-11-08: "no hairlines throughout the app as we
 * decided"): the rule above and below each row is gone. A run of rows is
 * set apart by space alone: 12px above and below each, muted label against
 * strong value.
 */
export function InfoRow({ label, value, emphasised = false, className }: InfoRowProps) {
    return (
        <div
            className={cn(
                'flex items-start justify-between gap-3 py-3',
                className,
            )}
        >
            <span className="text-[0.9375rem] text-[var(--text-muted)]">{label}</span>
            <span
                className={cn(
                    'text-right text-[0.9375rem] tabular-nums text-[var(--text-strong)]',
                    emphasised ? 'font-bold' : 'font-medium',
                )}
            >
                {value}
            </span>
        </div>
    )
}
