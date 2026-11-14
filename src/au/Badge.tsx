import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * Badge: a status on the hero (Components.swift). `ghost` is the hero's soft
 * chip, `inFlight` aqua for what is happening now. Off the hero, `done` is
 * lime, `needsYou` the act purple and `quiet` the room's well.
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    kind?: 'ghost' | 'inFlight' | 'done' | 'needsYou' | 'quiet'
}

export function Badge({ kind = 'ghost', className, ...rest }: BadgeProps) {
    return <span className={cn('au-badge', className)} data-kind={kind === 'ghost' ? undefined : kind} {...rest} />
}
