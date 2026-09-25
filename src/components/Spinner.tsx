import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * Spinner — an indeterminate "this is still working" indicator (AUTM-1046).
 *
 * ─── When to use it, and when not to ────────────────────────────────────
 *
 * For work in progress on something that is ALREADY on screen: a photo
 * uploading into its frame, a save running on a form the merchant is looking
 * at. The thing exists; the spinner says it is being worked on.
 *
 * NOT for content that has not arrived yet. When the eventual shape is known,
 * a shape-matched `Skeleton` / `AsyncSkeleton` is the rule ("Skeletons >
 * spinners"). And when a real percentage is available, `Progress` is better
 * than either, because it says how long is left.
 *
 * ─── Why it exists ──────────────────────────────────────────────────────
 *
 * merchant-mobile's photo uploaders laid a static "Uploading…" caption over
 * the picture. Nothing moved, so on a slow workshop connection a running
 * upload looked the same as a stuck one, which is when people tap again or
 * back out. autara-ui had no indeterminate indicator (`Progress` is
 * percentage only), and the only spinner in the package was private to
 * `Toast`. The geometry here is that one — a quarter arc over a faint track —
 * so the two read as the same object.
 *
 * ─── Colour ─────────────────────────────────────────────────────────────
 *
 *   tone="accent"    (default) `--accent`, the text/border-grade purple that
 *                    stays readable in both themes. Never the literal brand
 *                    hex, which measures ~1:1 on dark surfaces.
 *   tone="current"   inherits `currentColor` — inside a button, or anywhere
 *                    the caller sets the colour with a `text-*` class.
 *   tone="on-photo"  white, for use over an image. It needs a dark scrim
 *                    under it: white over `bg-black/60` on a white photo is
 *                    ~5.7:1, while white over the bare photo can be 1:1.
 *
 * ─── Accessibility ──────────────────────────────────────────────────────
 *
 * `role="status"` with the label as visually hidden text, so a screen reader
 * hears "Uploading photo" rather than a bare "Loading". Be specific with
 * `label`. Pass `decorative` when visible text beside the spinner already
 * says the same thing; the spinner is then `aria-hidden` and announces
 * nothing, so the word is not read twice.
 *
 * ─── Reduced motion ─────────────────────────────────────────────────────
 *
 * Under `prefers-reduced-motion: reduce` it does NOT spin, and it does not
 * pulse either: it swaps to a STATIC dashed ring. A frozen quarter arc would
 * look exactly like the stuck state this component exists to rule out, so the
 * reduced-motion state is a different, still shape rather than the same shape
 * standing still. The label is unchanged, so assistive tech hears the same
 * thing either way. (The global clamp in `utilities/animations.css` would
 * stop the rotation on its own; `motion-reduce:animate-none` says so here
 * rather than relying on it.)
 */

const SIZE = {
    sm: 'size-4',
    md: 'size-6',
    lg: 'size-10',
} as const

const TONE = {
    accent: 'text-[var(--accent)]',
    current: '',
    'on-photo': 'text-white',
} as const

export type SpinnerSize = keyof typeof SIZE
export type SpinnerTone = keyof typeof TONE

export interface SpinnerProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'role' | 'children'> {
    /** `sm` 1rem, `md` 1.5rem, `lg` 2.5rem. Rem, so it scales with system text size. */
    size?: SpinnerSize
    /** `accent` (default), `current` to inherit the text colour, `on-photo` for white over a scrim. */
    tone?: SpinnerTone
    /**
     * What is being worked on, announced to screen readers. "Uploading photo"
     * beats "Loading". Ignored when `decorative`.
     */
    label?: string
    /**
     * Visible text next to the spinner already says what is happening. The
     * spinner becomes `aria-hidden` and is not announced.
     */
    decorative?: boolean
}

const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
    ({ size = 'md', tone = 'accent', label = 'Loading', decorative = false, className, ...props }, ref) => {
        // `status` does not take its name from content, so the hidden label
        // is wired as the accessible name as well as being the live text.
        const labelId = React.useId()
        return (
            <span
                ref={ref}
                className={cn('inline-flex shrink-0 items-center justify-center', TONE[tone], className)}
                {...(decorative
                    ? { 'aria-hidden': true }
                    : { role: 'status', 'aria-labelledby': labelId })}
                {...props}
            >
                <svg
                    aria-hidden
                    focusable="false"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    data-spinner-motion=""
                    className={cn(SIZE[size], 'animate-spin motion-reduce:animate-none')}
                >
                    {/* Moving state: a faint full track plus a quarter arc. */}
                    <g className="motion-reduce:hidden">
                        <circle cx="12" cy="12" r="10" opacity="0.25" />
                        <path d="M22 12a10 10 0 0 0-10-10" />
                    </g>
                    {/* Reduced-motion state: a still, dashed ring. 8 dashes of
                        equal length round a circumference of 2π·10 ≈ 62.8. */}
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        strokeDasharray="4.85 3"
                        data-spinner-reduced=""
                        className="hidden motion-reduce:inline"
                    />
                </svg>
                {decorative ? null : (
                    <span id={labelId} className="sr-only">
                        {label}
                    </span>
                )}
            </span>
        )
    }
)
Spinner.displayName = 'Spinner'

export { Spinner }
