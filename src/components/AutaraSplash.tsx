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
 * ─── Why every moving part is an HTML layer (AUTM-2042, 2026-11-08) ────────
 *
 * Don: "intial loading spin still feels like lagging". On a cold start the
 * bundle blocks the main thread for 650ms inside the one-second arrival, and
 * browsers run an animation on an SVG child (`<g>`, `<path>`, `<circle>`) on
 * the main thread, so the rays froze mid-flight and then snapped to rest. Only
 * transform and opacity on an HTML element run on the compositor (Chrome, and
 * Safari and WKWebView, which the iPad app is). So each moving part here is a
 * `<span>` holding a whole-mark `<svg>` with just its own shape, and the
 * stylesheet animates the spans; nothing inside an SVG has a class the motion
 * reads. The layers are placed by `utilities/splash.css` alone (no Tailwind),
 * because the merchant app's pre-JS shell draws this from static HTML with
 * only that stylesheet inlined.
 *
 *   .autara-splash            the box (the stylesheet sets its display)
 *     .autara-splash-frame    every layer is absolute inside it
 *       .autara-splash-rays   the 36 degree turn
 *         .autara-splash-ray[data-ray]     the settle, per direction
 *           .autara-splash-ray-drift       the hold's drift
 *             .autara-splash-ray-base      half light
 *             .autara-splash-ray-lit       the glow
 *       .autara-splash-ring   the ring landing
 *
 * Each ray keeps its own path from the logo: they are rotations of the top
 * ray only to within 0.23 units (the logo's one-decimal rounding), and a ray
 * drawn upright in a layer turned 45 degrees would be resampled by the
 * compositor on every diagonal. The settle and the drift are on two spans so
 * no element runs two transform animations at once.
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

/**
 * `logo-mark.svg`'s eight rays, clockwise from the top, as AutaraLoader draws
 * them. `dir` names the way each one drifts out (the stylesheet's keyframes
 * carry the vector, since a `var()` in a keyframe can keep an animation off
 * the compositor).
 */
const RAYS: { d: string; dir: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' }[] = [
    { d: 'M176.3 15h147.8l-73.9 76.4z', dir: 'n' },
    { d: 'M364.3 31.7l104.5 104.5-106.3 1.8z', dir: 'ne' },
    { d: 'M485.4 176.3v147.8l-76.4-73.9z', dir: 'e' },
    { d: 'M468.8 364.3l-104.5 104.5-1.8-106.3z', dir: 'se' },
    { d: 'M324.2 485.5H176.4l73.9-76.4z', dir: 's' },
    { d: 'M136.2 468.8L31.7 364.3l106.3-1.8z', dir: 'sw' },
    { d: 'M15 324.2V176.4l76.4 73.9z', dir: 'w' },
    { d: 'M31.6 136.2L136.2 31.7l1.8 106.3z', dir: 'nw' },
]

/** The mark's 500 unit box; its centre (250.2, 250.3) is exactly 50% 50%. */
const VIEW_BOX = '0.2 0.3 500 500'

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
            className={cn('autara-splash', className)}
            style={{ width: rem, height: rem, ['--autara-splash-t0' as string]: `${-Math.round(offset)}ms`, ...style }}
            {...(decorative ? { 'aria-hidden': true } : { role: 'status', 'aria-labelledby': labelId })}
            {...props}
        >
            <span aria-hidden className="autara-splash-frame">
                <span className="autara-splash-rays">
                    {RAYS.map((r, i) => (
                        <span
                            key={r.dir}
                            className="autara-splash-ray"
                            data-ray={r.dir}
                            style={{ '--i': i } as React.CSSProperties}
                        >
                            <span className="autara-splash-ray-drift">
                                <span className="autara-splash-ray-base">
                                    <svg focusable="false" viewBox={VIEW_BOX}>
                                        <path d={r.d} />
                                    </svg>
                                </span>
                                <span className="autara-splash-ray-lit">
                                    <svg focusable="false" viewBox={VIEW_BOX}>
                                        <path d={r.d} />
                                    </svg>
                                </span>
                            </span>
                        </span>
                    ))}
                </span>
                <span className="autara-splash-ring">
                    <svg focusable="false" viewBox={VIEW_BOX}>
                        <circle cx="250.2" cy="250.3" r="100.6" fill="none" strokeWidth="67.1" />
                    </svg>
                </span>
            </span>
            {decorative ? null : (
                <span id={labelId} className="autara-splash-label sr-only">
                    {label}
                </span>
            )}
        </span>
    )
})

AutaraSplash.displayName = 'AutaraSplash'
