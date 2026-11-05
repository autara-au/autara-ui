import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * AutaraSplash: the Autara mark arriving, then holding while an app starts.
 *
 * Don, 2026-11-05, for every splash and boot screen of the merchant app:
 * "combine Settle and Aperture, a smooth motion, settle a bit increased", and
 * "only highlight the active triangle with lime green, only on business deep
 * backgrounds and dark."
 *
 * ─── When to use it ─────────────────────────────────────────────────────
 *
 * A whole screen that is waiting for the app: the pre-JS boot shell, the boot
 * gate, a sign-in landing. NOT inline and NOT for a page that has a heading
 * to show; that is `AutaraLoader` (which Button, Spinner and Toast draw).
 *
 * ─── The motion ─────────────────────────────────────────────────────────
 *
 * Intro, about one second, once:
 *   - the eight rays drift in from 1.5 times A's travel and settle
 *     clockwise, 30ms apart, while the whole set turns 36 degrees into
 *     place, like a lens closing;
 *   - the ring lands as they finish;
 *   - the motion system's one ease-out (`--motion-ease-out`, an expo curve),
 *     no overshoot.
 * Holding, until the screen goes:
 *   - the rays rest at half light, and one at a time, clockwise, a ray
 *     brightens and drifts a touch outward, then settles back, on a sine
 *     ease, so the light flows round the mark; one lap is 1800ms.
 * Transform and opacity only. The lit ray is a second path over the ray
 * whose opacity moves, so no colour is ever animated.
 *
 * ─── Colour, by what it sits on (`on`) ─────────────────────────────────
 *
 *   deep    (default) the business deep purple: a white mark, the lit ray LIME
 *   dark    the near-black ground: a white mark, the lit ray LIME
 *   paper   white: the `--accent` mark, the lit ray the same accent at full
 *   theme   paper in the light theme, dark in the dark one
 * Lime is only ever on deep and dark (Don), where it measures 12.8:1 and
 * 16.9:1. Solid fills; the logo's gradient is the logo's, not a loader's.
 *
 * ─── Continuity (`elapsed`) ─────────────────────────────────────────────
 *
 * An app draws this twice in a row: the static HTML before any JavaScript,
 * then the same mark from React. Pass `elapsed` (ms since the first one
 * started, usually `performance.now()` at mount) and every delay is shifted
 * by it, so React picks the timeline up where the HTML left it instead of
 * replaying the intro. `intro={false}` starts at the hold.
 *
 * ─── Reduced motion ─────────────────────────────────────────────────────
 *
 * No intro and no drift: the mark is simply there. The light still goes
 * round, by opacity alone, because a mark that never changes reads as a
 * stuck screen (AutaraLoader's rule, AUTM-1706).
 */

export type AutaraSplashSize = 64 | 80 | 96 | 112 | 128
export type AutaraSplashOn = 'deep' | 'dark' | 'paper' | 'theme'

/** `logo-mark.svg`'s eight rays, clockwise from the top, as AutaraLoader draws them. */
const RAYS: { d: string; ux: number; uy: number }[] = [
    { d: 'M176.3 15h147.8l-73.9 76.4z', ux: 0, uy: -1 },
    { d: 'M364.3 31.7l104.5 104.5-106.3 1.8z', ux: 0.7071, uy: -0.7071 },
    { d: 'M485.4 176.3v147.8l-76.4-73.9z', ux: 1, uy: 0 },
    { d: 'M468.8 364.3l-104.5 104.5-1.8-106.3z', ux: 0.7071, uy: 0.7071 },
    { d: 'M324.2 485.5H176.4l73.9-76.4z', ux: 0, uy: 1 },
    { d: 'M136.2 468.8L31.7 364.3l106.3-1.8z', ux: -0.7071, uy: 0.7071 },
    { d: 'M15 324.2V176.4l76.4 73.9z', ux: -1, uy: 0 },
    { d: 'M31.6 136.2L136.2 31.7l1.8 106.3z', ux: -0.7071, uy: -0.7071 },
]

/** Where the hold begins on the timeline: the intro has settled by then. */
const HOLD_AT_MS = 1000

export interface AutaraSplashProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'role' | 'children'> {
    /** 64 to 128. Default 96. */
    size?: AutaraSplashSize
    /** What it sits on, which picks the colours. Default `deep`. */
    on?: AutaraSplashOn
    /** Play the arrival. `false` starts at the hold. Default true. */
    intro?: boolean
    /** Milliseconds of the timeline already played elsewhere (see Continuity). */
    elapsed?: number
    /** Announced to screen readers. Default "Loading". */
    label?: string
    /** Visible text already says so: hide it from assistive tech. */
    decorative?: boolean
}

export const AutaraSplash = React.forwardRef<HTMLSpanElement, AutaraSplashProps>(function AutaraSplash(
    {
        size = 96,
        on = 'deep',
        intro = true,
        elapsed = 0,
        label = 'Loading',
        decorative = false,
        className,
        style,
        ...props
    },
    ref
) {
    const labelId = React.useId()
    const rem = `${size / 16}rem`
    const offset = Math.max(0, intro ? elapsed : Math.max(elapsed, HOLD_AT_MS))
    return (
        <span
            ref={ref}
            data-size={size}
            data-on={on}
            className={cn('autara-splash inline-flex shrink-0 items-center justify-center', className)}
            style={{ width: rem, height: rem, ['--autara-splash-t0' as string]: `${-Math.round(offset)}ms`, ...style }}
            {...(decorative ? { 'aria-hidden': true } : { role: 'status', 'aria-labelledby': labelId })}
            {...props}
        >
            <svg aria-hidden focusable="false" viewBox="0.2 0.3 500 500" className="block size-full overflow-visible">
                <g className="autara-splash-rays">
                    {RAYS.map((r, i) => (
                        <g
                            key={i}
                            className="autara-splash-ray"
                            style={
                                {
                                    '--i': i,
                                    '--ux': r.ux,
                                    '--uy': r.uy,
                                } as React.CSSProperties
                            }
                        >
                            <path className="autara-splash-ray-base" d={r.d} />
                            <path className="autara-splash-ray-lit" d={r.d} />
                        </g>
                    ))}
                </g>
                <circle className="autara-splash-ring" cx="250.2" cy="250.3" r="100.6" fill="none" strokeWidth="67.1" />
            </svg>
            {decorative ? null : (
                <span id={labelId} className="sr-only">
                    {label}
                </span>
            )}
        </span>
    )
})

AutaraSplash.displayName = 'AutaraSplash'
