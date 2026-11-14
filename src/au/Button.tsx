import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '../lib/cn'

/**
 * Button: `AUButtonStyle` (Components.swift). Lime is the one primary;
 * `quiet` sits on a card, `onPlate` on the hero, `onHero` is the hero's own
 * ink as the fill (Done on the booked screen), `card` a white capsule on the
 * room. A capsule 48pt tall by default; `wide` fills the row. Presses to 97%.
 *
 * Never muted when disabled: say it with `aria-disabled` and the reason in
 * text (AUTM-1719); the colours stay.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    kind?: 'lime' | 'quiet' | 'onPlate' | 'onHero' | 'card'
    height?: 44 | 48 | 52 | 54
    wide?: boolean
    asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { kind = 'lime', height = 48, wide, asChild, className, type, ...rest },
    ref,
) {
    const Comp = asChild ? Slot : 'button'
    return (
        <Comp
            ref={ref}
            className={cn('au-btn', className)}
            data-kind={kind === 'lime' ? undefined : kind}
            data-height={height === 48 ? undefined : String(height)}
            data-wide={wide ? '' : undefined}
            {...(asChild ? {} : { type: type ?? 'button' })}
            {...rest}
        />
    )
})
