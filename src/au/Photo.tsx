'use client'

import * as React from 'react'
import { cn } from '../lib/cn'
import { initials as initialsOf } from './Avatar'

/**
 * RemotePhoto: a photo from the CDN. Until it loads, or if there is none,
 * the pro's initials on a quiet tile: every pro has a face, never an empty
 * box (Customer/Pieces.swift). Size and corners come from the caller.
 * Decorative unless `alt` is given.
 */
export interface RemotePhotoProps extends React.HTMLAttributes<HTMLSpanElement> {
    src?: string | null
    /** The name whose initials stand in for a missing photo. */
    name?: string | null
    alt?: string
    /** Corner radius in px. */
    radius?: number
    /** `eager` for the first screen's cover. */
    loading?: 'lazy' | 'eager'
}

export function RemotePhoto({ src, name, alt = '', radius, loading = 'lazy', className, style, ...rest }: RemotePhotoProps) {
    const [failed, setFailed] = React.useState(false)
    const show = Boolean(src) && !failed
    return (
        <span
            className={cn('au-photo', className)}
            style={radius === undefined ? style : { borderRadius: radius, ...style }}
            aria-hidden={alt ? undefined : true}
            {...rest}
        >
            {show ? null : <span className="au-photo__initials">{initialsOf(name)}</span>}
            {show ? (
                <img src={src ?? undefined} alt={alt} loading={loading} decoding="async" onError={() => setFailed(true)} />
            ) : null}
        </span>
    )
}
