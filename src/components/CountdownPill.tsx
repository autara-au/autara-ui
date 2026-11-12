import * as React from 'react'
import { badgeVariants } from './Badge'
import { cn } from '../lib/cn'

/**
 * CountdownPill: the time left on something that lapses, as a solid pill
 * whose colour says how close it is (AUTM-1819).
 *
 * Don, 2026-10-10, on the merchant portal's Today requests: "this blink is
 * super ugly, need a better one". The pulsing dot and the glowing bar came
 * out; the time left became this pill, purple while there is time, amber,
 * then red. It pops in once when it arrives, and only in the last stretch
 * does the red pill breathe, slowly. Nothing blinks. The booking record uses
 * the same pill (AUTM-1821).
 *
 * The fills are Badge's own sheet tones, so the label contrast is the one
 * `tokens/palette-contrast.test.ts` already pins (white on brand, amber and
 * danger-fill, the same in both themes):
 *
 *   calm   brand    more than the consumer's amber line away
 *   amber  amber    getting close
 *   red    danger   about to lapse
 *
 * The consumer decides the tone from a deadline the SERVER enforces and
 * passes the words ("6 h 51 min left"); this draws them. It does not tick:
 * `Countdown` is the self-ticking line, this is the presentational pill a
 * screen that already owns a clock puts its words in.
 *
 * Motion, from `utilities/animations.css` ("A countdown pill"):
 *   - `.motion-badge-in` on the root: a small scale-in and fade, once, on
 *     mount, `--motion-badge-in` on `--motion-ease-out`. A re-render or a
 *     tone change does not replay it. `pop={false}` for a pill that should
 *     simply be there.
 *   - `.motion-breathe-soft` on the fill when `breathe`: opacity to 85% and
 *     back every `--motion-breathe`. 85% is the floor that keeps the white
 *     label at 4.5:1 or better on paper, band and raised in both themes
 *     (CountdownPill.contrast.test.ts measures the trough).
 * Both sit inside `prefers-reduced-motion: no-preference`: a reduced-motion
 * reader gets the pill, still, with no pop and no breathe. The colour does
 * not cross-fade on a tone change (`transition-none`): the only things that
 * move are the two above, transform and opacity only.
 *
 * Large text: the pill is one line wherever it fits on a line of its own.
 * Where even that is too narrow (a 390 phone at 200% text has about 160px
 * for "23 h 59 min left" at 26px) the words wrap INSIDE the fill, balanced,
 * rather than running past it: Badge's `whitespace-nowrap` is lifted and the
 * fill is capped at its container. A consumer in a wrapping flex row gets
 * the pill moved to its own line first, because the root does not shrink.
 *
 * The words carry the urgency too, so colour is never the only signal. No
 * live region: a pill inside a row would announce every minute.
 */
export type CountdownPillTone = 'calm' | 'amber' | 'red'

const VARIANT = {
    calm: 'brand',
    amber: 'amber',
    red: 'danger',
} as const satisfies Record<CountdownPillTone, string>

/** The Badge sheet tone a countdown tone draws with. */
export function countdownPillVariant(tone: CountdownPillTone): (typeof VARIANT)[CountdownPillTone] {
    return VARIANT[tone] ?? VARIANT.calm
}

export interface CountdownPillProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** How close the deadline is. Default `calm` (purple). */
    tone?: CountdownPillTone
    /** Breathe slowly (opacity only). Meant for the last stretch of a red pill. */
    breathe?: boolean
    /** Pop in once on mount. Default true. */
    pop?: boolean
}

export const CountdownPill = React.forwardRef<HTMLSpanElement, CountdownPillProps>(
    ({ tone = 'calm', breathe = false, pop = true, className, children, ...props }, ref) => (
        /* Two spans so the two motions never fight over `opacity`: the root
           pops, the fill breathes, and the browser multiplies the two. Spans,
           not Badge's div, so the pill is phrasing content inside a button
           row. */
        <span
            ref={ref}
            data-tone={tone}
            data-breathing={breathe || undefined}
            className={cn('inline-flex max-w-full shrink-0', pop && 'motion-badge-in', className)}
            {...props}
        >
            <span
                className={cn(
                    badgeVariants({ variant: countdownPillVariant(tone) }),
                    'max-w-full whitespace-normal text-center leading-tight tabular-nums transition-none [text-wrap:balance]',
                    breathe && 'motion-breathe-soft'
                )}
            >
                {children}
            </span>
        </span>
    )
)
CountdownPill.displayName = 'CountdownPill'
