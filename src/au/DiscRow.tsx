import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { withInner } from './slot'
import { cn } from '../lib/cn'

/**
 * DiscRow: Wise's row grammar, a disc, a label, a value (Components.swift).
 * The disc is 44pt in the room's tone; the row is at least 56pt. `asChild`
 * makes the row a link or a button; put a chevron in `trailing` when it goes
 * somewhere.
 */
export interface DiscRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    icon: React.ReactNode
    title: React.ReactNode
    detail?: React.ReactNode
    trailing?: React.ReactNode
    /** The disc's fill; the well (default) on a card, `card` on the room. */
    discFill?: 'well' | 'card'
    asChild?: boolean
}

export const DiscRow = React.forwardRef<HTMLDivElement, DiscRowProps>(function DiscRow(
    { icon, title, detail, trailing, discFill = 'well', asChild, className, children, ...rest },
    ref,
) {
    const inner = (
        <>
            <span className="au-disc" style={discFill === 'card' ? { background: 'var(--au-card)' } : undefined}>
                {icon}
            </span>
            <span className="au-disc-row__text">
                <span className="au-disc-row__title">{title}</span>
                {detail ? <span className="au-disc-row__detail">{detail}</span> : null}
            </span>
            {trailing ? <span className="au-disc-row__trailing">{trailing}</span> : null}
        </>
    )
    if (asChild) {
        // The child (a link or a button) becomes the row; the disc and text go inside it.
        return (
            <Slot ref={ref} className={cn('au-disc-row', className)} {...rest}>
                {withInner(children, inner)}
            </Slot>
        )
    }
    return (
        <div ref={ref} className={cn('au-disc-row', className)} {...rest}>
            {inner}
        </div>
    )
})
