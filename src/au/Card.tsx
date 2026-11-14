import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '../lib/cn'

/**
 * Card: the native `.card()` (autara-ios/Design/Components.swift). White on
 * the Stone room, 26pt corners, padding in 4pt steps. `asChild` makes the
 * whole card a link or a button (it then presses to 98%, PressStyle).
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Padding in points: 0, 8, 12, 16 (default), 20 or 24. */
    padding?: 0 | 8 | 12 | 16 | 20 | 24
    asChild?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
    { padding = 16, asChild, className, ...rest },
    ref,
) {
    const Comp = asChild ? Slot : 'div'
    return (
        <Comp
            ref={ref}
            className={cn('au-card', className)}
            data-pad={padding === 16 ? undefined : String(padding)}
            {...rest}
        />
    )
})

/** Rows on one card, split by the well's tone; `inset` starts the line past a disc. */
export function Rows({ inset, className, ...rest }: React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
    return <div className={cn('au-rows', className)} data-inset={inset ? '' : undefined} {...rest} />
}
