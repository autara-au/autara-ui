import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '../lib/cn'
import { withInner } from './slot'

/**
 * CircleButton: a white circle holding one icon; always labelled, always
 * 44pt (Components.swift). `dot` marks something unread. `asChild` for a link.
 */
export interface CircleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ReactNode
    /** The accessible name; there is no visible text. */
    label: string
    dot?: boolean
    fill?: 'card' | 'well'
    size?: 44 | 48
    asChild?: boolean
}

export const CircleButton = React.forwardRef<HTMLButtonElement, CircleButtonProps>(function CircleButton(
    { icon, label, dot, fill = 'card', size = 44, asChild, className, children, type, ...rest },
    ref,
) {
    const inner = (
        <>
            {icon}
            {dot ? <span className="au-circle-btn__dot" aria-hidden="true" /> : null}
        </>
    )
    const data = {
        className: cn('au-circle-btn', className),
        'aria-label': label,
        'data-fill': fill === 'card' ? undefined : fill,
        'data-size': size === 44 ? undefined : String(size),
    }
    if (asChild) {
        return (
            <Slot ref={ref} {...data} {...rest}>
                {withInner(children, inner)}
            </Slot>
        )
    }
    return (
        <button ref={ref} type={type ?? 'button'} {...data} {...rest}>
            {inner}
        </button>
    )
})
