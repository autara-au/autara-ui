'use client'

import * as React from 'react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

/**
 * MediaFrame: the slot where a screen shows its subject (AUTM-1781).
 *
 * The customer research's principle 5: the pro's work leads. A booking opens
 * on the service's photo, the day of a workshop visit on a map, and a pro with
 * no photo yet on their initials on deep purple, never a grey box or an icon
 * in a frame. Photos are data the pro has to give (decision 3, 2026-10-09);
 * this frame is what makes each of the three cases look intended.
 *
 * What it draws, first match wins:
 *
 *   1. `loading`: a still band block at the final size, pulsing
 *      (`motion-skeleton`), so nothing moves when the media lands.
 *   2. `children`: anything the caller owns, a map or a framework image
 *      (`next/image` with `fill`). It fills the frame.
 *   3. `src`: a plain photo, `object-cover`. It fades in once decoded
 *      (`motion-crossfade`).
 *   4. `initials`: the fallback, on `--brand-deep` in Satoshi Black, sized to
 *      the frame. `label` names it for a screen reader ("Fitzroy Paint Co").
 *
 * `overlay` sits on top in the top-left corner, for a back control or a
 * status chip on a full-bleed header.
 *
 * Shapes, from the customer app's tokens (AppTokens, radii):
 *   - `frame` (default): a photograph, 24px corners, at `ratio`.
 *   - `tile`: a square, 14px corners (the pro card's 52px tile).
 *   - `round`: a circle (the live booking's pro, a chat header).
 * `tile` and `round` take their size from the caller (`className="size-13"`).
 *
 * The frame never animates its box; only the media inside fades, opacity only.
 */

export interface MediaFrameProps {
    /** A photo URL. Ignored when `children` is given. */
    src?: string | null
    /** The photo's alt text. Empty string for a decorative photo. */
    alt?: string
    /** A map, a framework image, any media the caller owns. Fills the frame. */
    children?: ReactNode
    /** The fallback's letters, e.g. "FP". Two at most are drawn. */
    initials?: string | null
    /** What the fallback is, for a screen reader. Omit when the name is said beside it. */
    label?: string
    /** `frame` only: the aspect ratio, as CSS. @default '16 / 9' */
    ratio?: string
    /** @default 'frame' */
    shape?: 'frame' | 'tile' | 'round'
    loading?: boolean
    /** Drawn over the media, top left (a back control, a chip). */
    overlay?: ReactNode
    className?: string
    testId?: string
}

const SHAPE: Record<NonNullable<MediaFrameProps['shape']>, string> = {
    frame: 'w-full rounded-3xl',
    tile: 'aspect-square rounded-[14px]',
    round: 'aspect-square rounded-full',
}

export function MediaFrame({
    src,
    alt = '',
    children,
    initials,
    label,
    ratio = '16 / 9',
    shape = 'frame',
    loading = false,
    overlay,
    className,
    testId,
}: MediaFrameProps) {
    const [failed, setFailed] = React.useState(false)
    const photo = !children && src && !failed ? src : null
    const kind = loading ? 'loading' : children ? 'media' : photo ? 'photo' : 'initials'

    return (
        <div
            data-testid={testId}
            data-media={kind}
            className={cn(
                'relative isolate shrink-0 overflow-hidden [container-type:size]',
                SHAPE[shape],
                kind === 'initials' ? 'bg-[var(--brand-deep)]' : 'bg-[var(--band)]',
                className,
            )}
            style={shape === 'frame' ? { aspectRatio: ratio } : undefined}
        >
            {kind === 'loading' ? (
                <span aria-hidden className="motion-skeleton absolute inset-0 bg-[var(--band-press)]" />
            ) : kind === 'media' ? (
                <div className="motion-crossfade absolute inset-0 [&>*]:h-full [&>*]:w-full">{children}</div>
            ) : kind === 'photo' ? (
                <img
                    src={photo!}
                    alt={alt}
                    decoding="async"
                    loading="lazy"
                    onError={() => setFailed(true)}
                    className="motion-crossfade absolute inset-0 h-full w-full object-cover"
                />
            ) : (
                <span
                    role={label ? 'img' : undefined}
                    aria-label={label}
                    aria-hidden={label ? undefined : true}
                    className="absolute inset-0 grid place-items-center font-black tracking-[-0.02em] text-[var(--on-deep)] select-none"
                    style={{ fontSize: shape === 'frame' ? '28cqmin' : '38cqmin', lineHeight: 1 }}
                >
                    {(initials ?? '').slice(0, 2)}
                </span>
            )}
            {overlay ? <div className="absolute top-3 left-3 z-10 flex items-center gap-2">{overlay}</div> : null}
        </div>
    )
}
