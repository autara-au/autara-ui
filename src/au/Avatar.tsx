import * as React from 'react'
import { cn } from '../lib/cn'

/** "MA" from "McRaven Auto": the first letters of the first two words (Swift `initials`). */
export function initials(name: string | null | undefined): string {
    return (name ?? '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0] ?? '')
        .join('')
        .toUpperCase()
}

/**
 * Avatar: initials in a 44pt disc (Components.swift). The selected tile's
 * colours on the room; `onPlate` turns it white with the hero's ink on the
 * hero. A photo, when there is one, fills the disc. Decorative: the name is
 * always written beside it.
 */
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
    name?: string | null
    /** Overrides the initials worked out from `name`. */
    text?: string
    src?: string | null
    onPlate?: boolean
    size?: 44 | 64 | 68
}

export function Avatar({ name, text, src, onPlate, size = 44, className, ...rest }: AvatarProps) {
    return (
        <span
            aria-hidden="true"
            className={cn('au-avatar', className)}
            data-on-plate={onPlate ? '' : undefined}
            data-size={size === 44 ? undefined : String(size)}
            {...rest}
        >
            {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : (text ?? initials(name))}
        </span>
    )
}
