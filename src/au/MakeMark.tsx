import * as React from 'react'
import { cn } from '../lib/cn'
import { VehicleMakeMark } from '../components/VehicleMakeMark'

/**
 * MakeMark: a car's make as its badge (Toyota, BMW), from the same marks
 * every Autara app draws (VehicleMakeMark: Simple Icons' path, or the make's
 * initials). `disc` sets it in a 44pt white circle, as Home's top row does.
 */
export interface MakeMarkProps extends React.HTMLAttributes<HTMLSpanElement> {
    make: string | null | undefined
    disc?: boolean
}

export function MakeMark({ make, disc, className, ...rest }: MakeMarkProps) {
    return (
        <span className={cn('au-make-mark', className)} data-disc={disc ? '' : undefined} {...rest}>
            <VehicleMakeMark make={make ?? ''} />
        </span>
    )
}
