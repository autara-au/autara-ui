import * as React from 'react'

/**
 * rise(): content rises into place as a screen arrives, each piece a beat
 * after the last (`.rise(index)` in Components.swift). Spread it on the
 * piece: `<Card {...rise(2)} />`. Reduced motion shows it at once.
 */
export function rise(index = 0): { className: string; style: React.CSSProperties } {
    return { className: 'au-rise', style: { ['--au-rise-index' as string]: index } }
}

/** A loading block in the shape of what is coming (Loadable in Pieces.swift). */
export function Skeleton({
    shape = 'card',
    height,
    className,
    style,
    ...rest
}: React.HTMLAttributes<HTMLDivElement> & { shape?: 'card' | 'plate'; height: number | string }) {
    return (
        <div
            aria-hidden="true"
            className={['au-skeleton au-pulse', className].filter(Boolean).join(' ')}
            data-shape={shape === 'plate' ? 'plate' : undefined}
            style={{ height, ...style }}
            {...rest}
        />
    )
}
