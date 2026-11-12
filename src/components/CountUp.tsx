'use client'

import * as React from 'react'
import { cn } from '../lib/cn'
import { motionDurations } from '../lib/motion-tokens'

/**
 * CountUp: a figure that counts up to its value once, when it arrives.
 *
 * AUTM-1792. Don, 2026-10-09, pointing at a dashboard he liked: "can you see
 * this smooth animation, can we apply slight animation in our app too". Its
 * money tiles count from zero to their value as the page lands. This is that,
 * on `--motion-count` (900ms) and the house ease-out, and nothing else:
 *
 * - **The real value is in the page from the first frame.** It is rendered
 *   at full size and transparent while a copy counts over it (`aria-hidden`),
 *   so a screen reader, a test and a copy-paste all read the true figure and
 *   the box never changes size under the count. The copy is removed before it
 *   would show the final string, so exactly one element ever reads it.
 * - **Once per arrival.** It counts on mount. A value that changes later (a
 *   refetch, a live update) is shown at once: a figure that re-counts on every
 *   poll reads as a fault, not as motion.
 * - **Reduced motion shows the value**, with no count at all; so does a
 *   browser with no `requestAnimationFrame`.
 *
 * Format is the caller's, applied to the intermediate numbers too, so the
 * count reads in the same units throughout. Two ways to give it:
 *
 * - `format`, a function (`formatAud`, a percentage, a count). Client only:
 *   a function cannot cross from a server component.
 * - `formatOptions` and `locale` (AUTM-1781), plain data for
 *   `Intl.NumberFormat`, so a server component can pass them. With `text`, the
 *   final value exactly as the page already prints it; keep the two in step,
 *   or the last frame visibly snaps.
 *
 *     <CountUp value={407} format={formatWholeAud} />
 *     <CountUp value={85.5} text="$85.50" formatOptions={{ style: 'currency', currency: 'AUD' }} />
 *
 * `format` wins when both are given. Pair with `tabular-nums` on the figure
 * so the digits do not jitter.
 */
export interface CountUpProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
    /** The figure to land on. */
    value: number
    /** How to print a number; used for the count and the final value. */
    format?: (n: number) => string
    /**
     * AUTM-1781: `Intl.NumberFormat` options for the count (and for the final
     * value when there is no `text`). Serialisable, unlike `format`.
     */
    formatOptions?: Intl.NumberFormatOptions
    /** AUTM-1781: the locale `formatOptions` formats in. @default 'en-AU' */
    locale?: string
    /** AUTM-1781: the final value as the page prints it. Defaults to the formatted `value`. */
    text?: string
    /** Where the count starts. */
    from?: number
    /** Milliseconds. Defaults to `--motion-count`. */
    duration?: number
    /** AUTM-1781: `data-testid` on the figure, as the library's other components take it. */
    testId?: string
}

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

const defaultFormat = (n: number) => Math.round(n).toLocaleString()

/** Ease-out quart: close to `--motion-ease-out` and cheap to evaluate. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)

function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false
}

function canAnimate(): boolean {
    return typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
}

export function CountUp({
    value,
    format,
    formatOptions,
    locale,
    text,
    from = 0,
    duration = motionDurations.count,
    testId,
    className,
    ...props
}: CountUpProps) {
    // `format` first; then `Intl.NumberFormat` when the caller gave it options
    // or a locale; otherwise the plain whole number this has always printed.
    const intl = React.useMemo(
        () =>
            formatOptions || locale ? new Intl.NumberFormat(locale ?? 'en-AU', formatOptions) : null,
        // Options are usually an inline literal: key on their content, not identity.
        [locale, JSON.stringify(formatOptions ?? null)]
    )
    const print = format ?? (intl ? (n: number) => intl.format(n) : defaultFormat)
    const finalText = text ?? print(value)
    const [shown, setShown] = React.useState<string | null>(null)
    // Set once the count has FINISHED (or was skipped). Not "started": React's
    // StrictMode mounts, cleans up and mounts again in development, and a
    // started flag stopped the second mount from counting, which left the
    // counting copy on screen for good.
    const finished = React.useRef(false)
    const printRef = React.useRef(print)
    printRef.current = print
    const finalRef = React.useRef(finalText)
    finalRef.current = finalText

    useIsoLayoutEffect(() => {
        if (finished.current) return
        if (prefersReducedMotion() || !canAnimate() || value === from || !Number.isFinite(value)) {
            finished.current = true
            return
        }
        const target = value
        const printNow = printRef.current
        const end = printNow(target)
        const shownFinal = finalRef.current
        let frame = 0
        const t0 = performance.now()
        setShown(printNow(from))
        // The clock is read here, not taken from rAF's argument: the two share
        // an origin in a browser but not under a test's fake clock, where the
        // count then never finished.
        const tick = () => {
            const t = Math.max(0, Math.min((performance.now() - t0) / duration, 1))
            const frameText = printNow(from + (target - from) * easeOut(t))
            // Stop before the copy would read the final figure, so only the
            // real value ever does.
            if (t >= 1 || frameText === end || frameText === shownFinal) {
                finished.current = true
                setShown(null)
                return
            }
            setShown(frameText)
            frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => {
            cancelAnimationFrame(frame)
            if (!finished.current) setShown(null)
        }
        // Once per arrival: a later value is shown at once (see the header),
        // so this deliberately depends on nothing.
    }, [])

    const counting = shown !== null
    return (
        <span
            data-count-up=""
            data-testid={testId}
            className={cn('relative inline-block', className)}
            {...props}
        >
            <span style={counting ? { opacity: 0 } : undefined}>{finalText}</span>
            {counting ? (
                <span aria-hidden className="pointer-events-none absolute inset-0 whitespace-nowrap">
                    {shown}
                </span>
            ) : null}
        </span>
    )
}
