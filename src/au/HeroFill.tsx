import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '../lib/cn'

/**
 * HeroFill: the app's hero surface, one per screen (`.hero()` in Swift).
 * Flat ink with white and lime on it for the customer app (AppTheme.ink, Don
 * 2026-11-15); the deep purple plate under `[data-au-theme="merchant"]`.
 */
export interface HeroFillProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Corner radius in px; the plate's 32 by default. */
    radius?: number
    asChild?: boolean
}

export const HeroFill = React.forwardRef<HTMLDivElement, HeroFillProps>(function HeroFill(
    { radius, asChild, className, style, ...rest },
    ref,
) {
    const Comp = asChild ? Slot : 'div'
    return (
        <Comp
            ref={ref}
            className={cn('au-hero', className)}
            style={radius === undefined ? style : { borderRadius: radius, ...style }}
            {...rest}
        />
    )
})

/**
 * Plate: the merchant app's deep purple brand plate. The texture is the
 * app's own image, given as `--au-plate-texture: url(...)`; without it the
 * plate is flat deep purple.
 */
export function Plate({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('au-plate', className)} {...rest} />
}
