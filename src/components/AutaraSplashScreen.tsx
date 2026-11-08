import * as React from 'react'
import { cn } from '../lib/cn'
import { AutaraSplash } from './AutaraSplash'

/**
 * AutaraSplashScreen: a whole screen that waits on the app, on the business
 * deep purple, edge to edge, in both themes (Don, 2026-11-05: every splash of
 * the merchant app and the merchant site).
 *
 * The mark sits at the EXACT centre, between two spaces that grow alike from
 * nothing (`flex: 1 1 0px`; a 0% basis reads as `content` in a column with no
 * set height and pushes the mark up by half the caption), and the caption
 * hangs in the lower one. A caption that changes or grows a line never moves
 * the mark, so a pre-JS shell that draws the mark alone hands over without a
 * jump. Only when the caption needs more than the lower half does the upper
 * space give way, and past that the screen scrolls: at 200% text on a short
 * phone the mark stays in view and no word is clipped.
 *
 * The container is the status (its caption, or `label`, is what a screen
 * reader hears), so the mark is decorative. The caption is a line, never a
 * heading: a transitional screen's words are its status, not its title.
 *
 * One timeline for waits that follow each other: see `useSplashElapsed`.
 */

/* ─── One timeline across back-to-back waits ─────────────────────────────
 *
 * Waits come back to back: the pre-JS shell, then the boot gate; a Suspense
 * fallback, then the screen's own "Signing you in". Each is a new element,
 * and a new element would replay the one-second arrival, so the mark would
 * land twice. A wait that mounts while another is up, or within a frame of
 * one leaving, continues the same timeline. A wait that starts after the
 * page has shown content plays the arrival, as a new wait should.
 *
 * Where the timeline is read from, in order:
 *   - `splashRun`, kept by every splash React has mounted (`origin` is when
 *     the run began, on `performance.now()`);
 *   - a splash already in the document that React never mounted: the static
 *     HTML shell, or a server Suspense fallback the client renders past. It
 *     is still in the document while its replacement renders, so its own
 *     animation says how far it has got, plus its shift
 *     (`--autara-splash-t0`).
 * A splash that is hydrating renders 0, as the server did, so the markup
 * matches; its animation has been running since the HTML painted, which is
 * what it then records. Built in merchant-web for AUTM-2042 and moved here. */
const splashRun = { origin: null as number | null, mounted: 0, leftAt: -Infinity }
const HANDOVER_MS = 250
const noSubscription = () => () => {}

/* The clock is the glow, read by name (AUTM-2042, 2026-11-08). It loops
 * forever, so its `currentTime` keeps counting; the first animation in the
 * subtree is the rays' 900ms turn, and a finished animation holds its
 * `currentTime` at its end, so a hand-off after the arrival read 900ms however
 * long the shell had been up, and the rays brightened and dimmed again. Every
 * part's animation starts together, so any running one tells the same time:
 * the first is the fallback. */
function playedSoFar(el: HTMLElement | null | undefined): number | null {
    const anims = el?.getAnimations?.({ subtree: true }) ?? []
    const anim =
        anims.find((a) => (a as Partial<CSSAnimation>).animationName === 'autara-splash-glow') ?? anims[0]
    if (!el || typeof anim?.currentTime !== 'number') return null
    const shift = -parseFloat(el.style.getPropertyValue('--autara-splash-t0')) || 0
    return anim.currentTime + shift
}

/** Milliseconds of the splash timeline already played, read once at mount. */
export function useSplashElapsed(ref: React.RefObject<HTMLSpanElement | null>): number {
    const hydrating = React.useSyncExternalStore(
        noSubscription,
        () => false,
        () => true
    )
    const [elapsed] = React.useState(() => {
        if (typeof window === 'undefined' || hydrating) return 0
        const now = performance.now()
        const { origin, mounted, leftAt } = splashRun
        if (origin !== null && (mounted > 0 || now - leftAt < HANDOVER_MS)) return now - origin
        return playedSoFar(document.querySelector<HTMLElement>('.autara-splash')) ?? 0
    })
    React.useEffect(() => {
        splashRun.mounted += 1
        if (splashRun.mounted === 1) {
            splashRun.origin = performance.now() - (playedSoFar(ref.current) ?? elapsed)
        }
        return () => {
            splashRun.mounted -= 1
            if (splashRun.mounted === 0) splashRun.leftAt = performance.now()
        }
    }, [elapsed, ref])
    return elapsed
}

export interface AutaraSplashScreenProps {
    /** The status line under the mark ("Getting things ready…"). Optional. */
    caption?: React.ReactNode
    /** A second, quieter line under the caption. */
    detail?: React.ReactNode
    /** What a screen reader hears. Default: the caption when it is text, else "Loading". */
    label?: string
    /** `fixed` covers the page from any layout (default); `fill` fills its parent. */
    position?: 'fixed' | 'fill'
    /** Play the arrival. `false` starts at the hold (a native launch screen is already up). */
    intro?: boolean
    /** Test id on the status container. */
    testId?: string
    className?: string
}

export function AutaraSplashScreen({
    caption,
    detail,
    label,
    position = 'fixed',
    intro = true,
    testId,
    className,
}: AutaraSplashScreenProps) {
    const markRef = React.useRef<HTMLSpanElement>(null)
    const elapsed = useSplashElapsed(markRef)
    const name = label ?? (typeof caption === 'string' ? caption : 'Loading')
    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-label={name}
            data-testid={testId}
            className={cn(
                'overflow-y-auto bg-[var(--brand-deep)] text-[var(--on-deep)]',
                position === 'fixed' ? 'fixed inset-0 z-50' : 'relative h-full min-h-dvh w-full',
                className
            )}
        >
            <div className="flex min-h-full flex-col items-center px-6">
                <div aria-hidden className="min-h-0 flex-[1_1_0px]" />
                <AutaraSplash ref={markRef} size={96} on="deep" elapsed={elapsed} intro={intro} decorative className="shrink-0" />
                <div className="w-full flex-[1_1_0px]">
                    {caption || detail ? (
                        <div className="mx-auto mb-8 mt-6 max-w-[28rem] text-center">
                            {caption ? (
                                <p className="text-[0.9375rem] font-medium leading-snug text-[var(--on-deep-muted)]">{caption}</p>
                            ) : null}
                            {detail ? (
                                <p className="mt-1 text-sm leading-snug text-[var(--on-deep-muted)]">{detail}</p>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
