import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '../lib/cn'
import { withInner } from './slot'

/**
 * Chip: a choice in a row of choices; the selected one is the tile
 * (Customer/Pieces.swift). A white capsule 44pt tall on the room. `fact`
 * draws a statement instead (the pro's rating, Comes to you): 40pt, medium,
 * not a control. Put a row of them in autara-ui's ChipRow.
 */
export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: React.ReactNode
    on?: boolean
    fact?: boolean
    asChild?: boolean
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(function Chip(
    { icon, on, fact, asChild, className, children, type, ...rest },
    ref,
) {
    const data = {
        className: cn('au-chip', className),
        'data-on': on ? '' : undefined,
        'data-fact': fact ? '' : undefined,
    }
    if (fact) {
        return (
            <span {...data} {...(rest as React.HTMLAttributes<HTMLSpanElement>)}>
                {icon}
                {children}
            </span>
        )
    }
    if (asChild) {
        return (
            <Slot ref={ref} {...data} {...rest}>
                {withInner(children, <>{icon}{(React.Children.only(children) as React.ReactElement<{ children?: React.ReactNode }>).props.children}</>)}
            </Slot>
        )
    }
    return (
        <button ref={ref} type={type ?? 'button'} aria-pressed={on === undefined ? undefined : on} {...data} {...rest}>
            {icon}
            {children}
        </button>
    )
})
