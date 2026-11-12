import { useId } from 'react'
import { cn } from '../lib/cn'

/**
 * Logo — Autara primary wordmark + orb mark, inlined SVG.
 *
 * Source: the primary `autara` brand wordmark with the radiating
 * orb mark on the left. Inlined as a React component so consumers
 * can:
 *   - Theme the wordmark via `currentColor` (set the surrounding
 *     text color and the letters follow)
 *   - Size via Tailwind utility classes (no layout shift from image
 *     load)
 *   - Avoid a per-asset HTTP round-trip on cold launch
 *
 * The orb gradient (purple → aqua) stays brand-locked regardless of
 * surrounding text color — the wordmark is the only themable part.
 *
 * Default size is `h-7 w-auto` (~28 px tall). Override via className.
 * Pass `textOnly` to omit the orb (useful in narrow detail-screen
 * chrome).
 *
 * ── `lockup="business"` (AUTM-1158) ──────────────────────────────────────
 *
 * Merchant and customer are two products wearing one wordmark. A merchant
 * signing in to run their business saw exactly what a customer sees booking
 * a wash, which is a real identity problem and not a decorative one.
 *
 * The shape is concept E from the 2026-09-07 lockup sheet, chosen by Don out
 * of six: mark and wordmark as they ship, a vertical hairline, then the
 * descriptor. The stacked variants read better at hero size but lose the
 * descriptor first when vertical room is tight, and every surface this
 * appears on is an app bar or a card header.
 *
 * The hairline is a SEPARATOR, not emphasis, so it is not the outline
 * direction rule 4 bans — it is the same family as the hairline that defines
 * a glass edge. Without it the two halves read as unrelated objects placed
 * near each other, which was the first cut and what Don rejected.
 *
 * `size` rather than a free className for the descriptor, because it has to
 * scale WITH the mark and CSS cannot derive a font-size from an SVG's height
 * (`em` resolves against inherited font-size, not the box). Two independent
 * knobs drift apart; these are set together.
 *
 * The descriptor is NEVER hidden at a breakpoint. Both consumers had
 * hand-composed this with `hidden sm:inline`, so on a phone — merchant
 * mobile's primary form factor — the distinction vanished exactly where the
 * two products are easiest to confuse.
 */

/*
 * ── `wordmark={false}` and `tone="white"` (AUTM-1792) ────────────────────
 *
 * Don, 2026-10-09, looking at the merchant portal's rail in dark mode: show
 * only the white icon and "| for business", not the text logo. Inside the
 * product the merchant already knows which brand they are in, so the lettering
 * is the redundant half; the mark carries the identity and the descriptor
 * carries the product.
 *
 * `wordmark={false}` draws the orb alone. With `lockup="business"` that is
 * mark, hairline, descriptor: the same row, the same gap, the same height, so
 * nothing around it moves. The mark is drawn in a square box (the orb centred
 * with a little air, the proportions of the standalone mark file consumers
 * already ship) so `h-*` gives it a matching width via `w-auto`.
 *
 * `tone="white"` paints the orb solid white for dark surfaces, where the
 * brand gradient's purple end sinks into the ground. It colours the ORB ONLY,
 * and the wordmark (when drawn) is `currentColor` as ever. The hairline and
 * descriptor follow the theme tokens, which already flip under
 * `data-theme="dark"`, so a consumer picks `white` when it is on the dark
 * theme (or a dark island) and the lockup reads on either ground.
 *
 * Both default to the previous behaviour, so merchant-web and customer-web
 * are untouched.
 */

/** Sizes the mark and its descriptor together — see the note above. */
export type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

/** The orb's colour: the brand gradient, or solid white for a dark surface. */
export type LogoTone = 'brand' | 'white'

const LOCKUP_SIZES: Record<LogoSize, { logo: string; text: string; rule: string }> = {
    sm: { logo: 'h-5', text: 'text-[0.6875rem]', rule: 'my-0.5' },
    md: { logo: 'h-6', text: 'text-xs', rule: 'my-1' },
    lg: { logo: 'h-7', text: 'text-sm', rule: 'my-1' },
    xl: { logo: 'h-9', text: 'text-base', rule: 'my-1.5' },
}

export interface LogoProps {
    className?: string
    /** Render the wordmark only (no orb). */
    textOnly?: boolean
    /**
     * Append a product descriptor. `business` renders "Autara | for business"
     * for the merchant-facing surfaces. Ignored with `textOnly`.
     */
    lockup?: 'business'
    /** Only meaningful with `lockup` — sizes mark and descriptor together. */
    size?: LogoSize
    /**
     * Draw the "autara" lettering. `false` draws the orb mark alone; with
     * `lockup="business"` the lockup becomes mark, hairline, "for business".
     * Wins over `textOnly`, since the two together would draw nothing.
     * Default `true`.
     */
    wordmark?: boolean
    /**
     * The orb's colour: `brand` (default) is the purple to aqua gradient;
     * `white` is solid white, for dark surfaces. Colours the orb only; the
     * wordmark follows `currentColor`.
     */
    tone?: LogoTone
    /**
     * Hide the mark from the accessibility tree.
     *
     * Load-bearing, and it was silently dropped before AUTM-1158 declared it:
     * the SVG carries `role="img" aria-label="Autara"`, so the lockup — which
     * names the whole pair "Autara for business" — had a second named image
     * inside it and a screen reader read the brand twice. Verified by
     * rendering the markup, not by reading the JSX.
     */
    'aria-hidden'?: boolean
}

/** The orb, shared by the full logo and the mark alone. */
const ORB_PATH =
    'M130.7,64.5c-35.5,0-64.2,28.7-64.2,64.2s28.7,64.2,64.2,64.2,64.2-28.7,64.2-64.2-28.7-64.2-64.2-64.2ZM130.7,160.8c-17.7,0-32.1-14.4-32.1-32.1s14.4-32.1,32.1-32.1,32.1,14.4,32.1,32.1-14.4,32.1-32.1,32.1ZM166.1,241.3h-70.8l35.4-36.6,35.4,36.6ZM95.3,16h70.8l-35.4,36.6-35.4-36.6ZM243.3,93.3v70.8l-36.6-35.4,36.6-35.4ZM18,164.1v-70.8l36.6,35.4-36.6,35.4ZM235.3,183.3l-50.1,50.1-.9-50.9,50.9.9ZM26,74.1l50.1-50.1.9,50.9-50.9-.9ZM185.3,24l50.1,50.1-50.9.9.9-50.9ZM76,233.4l-50.1-50.1,50.9-.9-.9,50.9Z'

function OrbGradient({ id }: { id: string }) {
    return (
        <linearGradient id={id} x1="84.7" y1="237" x2="176.7" y2="20.3" gradientUnits="userSpaceOnUse">
            <stop offset=".4" stopColor="#4e1bbd" />
            <stop offset=".5" stopColor="#4d2cc4" />
            <stop offset=".7" stopColor="#4b5ad9" />
            <stop offset="1" stopColor="#47a4f9" />
        </linearGradient>
    )
}

export function Logo({
    className,
    textOnly = false,
    lockup,
    size = 'lg',
    wordmark = true,
    tone = 'brand',
    'aria-hidden': ariaHidden,
}: LogoProps) {
    /* AUTM-1792: the orb's gradient id is per instance. It was a fixed
       "autara-logo-orb", and with two logos on a page the second one's
       `url(#...)` resolved to the FIRST one's gradient; when that first copy
       sat in a display:none subtree (the merchant portal's rail on a phone)
       the orb on the visible one drew nothing. `useId` is in React's server
       build, so this stays usable from a server component. */
    const orbId = `autara-logo-orb-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
    if (lockup === 'business' && !textOnly) {
        const s = LOCKUP_SIZES[size]
        return (
            // One accessible name for the pair. Both children are hidden from
            // the tree so a screen reader reads "Autara for business" once,
            // rather than "Autara" followed by a loose "for business".
            <span
                role="img"
                aria-label="Autara for business"
                className={cn('inline-flex items-center gap-2.5', className)}
            >
                <Logo aria-hidden wordmark={wordmark} tone={tone} className={cn(s.logo, 'w-auto')} />
                <span
                    aria-hidden
                    className={cn(
                        'w-px self-stretch bg-[var(--border-subtle)]',
                        s.rule,
                    )}
                />
                {/* AUTM-1792: never wraps. In the merchant portal's rail the
                    lockup has exactly its own width, and the descriptor
                    broke onto two lines ("for / business"), which is the
                    stacked lockup Don ruled wrong on 2026-10-09. */}
                <span
                    aria-hidden
                    className={cn(
                        'whitespace-nowrap font-medium text-[var(--text-subtle)]',
                        s.text,
                    )}
                >
                    for business
                </span>
            </span>
        )
    }

    if (!wordmark) {
        // The orb alone, in a square box. It is the same path as the full
        // logo's orb (one source of truth), centred in a viewBox with about
        // 3% air on each side, the proportions of the standalone mark file.
        return (
            <svg
                viewBox="10.8 8.8 239.7 239.7"
                className={cn('h-7 w-auto', className)}
                aria-hidden={ariaHidden || undefined}
                aria-label={ariaHidden ? undefined : 'Autara'}
                role={ariaHidden ? undefined : 'img'}
            >
                {tone === 'brand' && (
                    <defs>
                        <OrbGradient id={orbId} />
                    </defs>
                )}
                <path fill={tone === 'white' ? '#ffffff' : `url(#${orbId})`} d={ORB_PATH} />
            </svg>
        )
    }

    if (textOnly) {
        return (
            <svg
                viewBox="288 60 590 140"
                className={cn('h-7 w-auto', className)}
                fill="currentColor"
                aria-hidden={ariaHidden || undefined}
                aria-label={ariaHidden ? undefined : 'Autara'}
                role={ariaHidden ? undefined : 'img'}
            >
                <path d="M288.4,196.2l52-135.2h25.8l52,135.2h-24.6l-12.7-34.1h-56.2l-12.7,34.1h-23.6ZM332,142.4h41.5l-13.5-36.5-7.1-24.4-7.1,24.4-13.7,36.5Z" />
                <path d="M427.1,164.7v-67.3h22.2v60.5c0,11.9,4,20,18.9,20s21.8-10.5,21.8-26.4v-54.2h22.4v98.6h-22.4v-28.4c-3.6,15.3-13.5,28.4-32.7,28.4s-30.2-11.3-30.2-31.4Z" />
                <path d="M539.4,167.7v-53h-15.1v-17.3h15.1v-11.7l22.2-14.1v25.8h29.6v17.3h-29.6v47.6c0,10.5,5,13.1,11.5,13.1s13.1-6.2,15.9-11.7l6.9,19.8c-4.2,6.2-13.7,12.7-27.8,12.7s-28.8-11.5-28.8-28.6Z" />
                <path d="M603.3,173.2c0-13.7,9.5-22,25.2-28.2l32.3-13.7c-.8-9.7-5.2-16.3-18.5-16.3s-23,7.5-28.6,17.7l-13.3-15.9c7.5-10.3,22.6-21.4,44.1-21.4s37.5,13.7,37.5,37.5v36.3c0,4.4,1.6,5.8,5.2,5.8h6.2v21h-13.7c-10.3,0-18.5-6.7-18.5-20.6v-7.1c-3,12.7-12.3,27.8-32.5,27.8s-25.4-8.9-25.4-22.8ZM636.6,178.8c14.7,0,24.6-8.7,24.6-21.8v-10.3l-24.8,11.1c-8.3,3.8-11.7,7.1-11.7,12.1s3.8,8.9,11.9,8.9Z" />
                <path d="M710.5,196v-98.6h22.2v27.4c3.6-15.5,13.3-29.4,30.6-29.4s21,7.9,21,22.2-2.6,16.3-4.4,19.3h-22.8c3.2-3.2,6.2-9.5,6.2-15.1s-2.6-9.7-9.1-9.7c-11.1,0-21.4,12.7-21.4,28.8v55.2h-22.2Z" />
                <path d="M793,173.2c0-13.7,9.5-22,25.2-28.2l32.3-13.7c-.8-9.7-5.2-16.3-18.5-16.3s-23,7.5-28.6,17.7l-13.3-15.9c7.5-10.3,22.6-21.4,44.1-21.4s37.5,13.7,37.5,37.5v36.3c0,4.4,1.6,5.8,5.2,5.8h6.2v21h-13.7c-10.3,0-18.5-6.7-18.5-20.6v-7.1c-3,12.7-12.3,27.8-32.5,27.8s-25.4-8.9-25.4-22.8ZM826.4,178.8c14.7,0,24.6-8.7,24.6-21.8v-10.3l-24.8,11.1c-8.3,3.8-11.7,7.1-11.7,12.1s3.8,8.9,11.9,8.9Z" />
            </svg>
        )
    }

    return (
        <svg
            viewBox="0 0 901.2 257.4"
            className={cn('h-7 w-auto', className)}
            aria-hidden={ariaHidden || undefined}
            aria-label={ariaHidden ? undefined : 'Autara'}
            role={ariaHidden ? undefined : 'img'}
        >
            {tone === 'brand' && (
                <defs>
                    <OrbGradient id={orbId} />
                </defs>
            )}

            <g fill="currentColor">
                <path d="M288.4,196.2l52-135.2h25.8l52,135.2h-24.6l-12.7-34.1h-56.2l-12.7,34.1h-23.6ZM332,142.4h41.5l-13.5-36.5-7.1-24.4-7.1,24.4-13.7,36.5Z" />
                <path d="M427.1,164.7v-67.3h22.2v60.5c0,11.9,4,20,18.9,20s21.8-10.5,21.8-26.4v-54.2h22.4v98.6h-22.4v-28.4c-3.6,15.3-13.5,28.4-32.7,28.4s-30.2-11.3-30.2-31.4Z" />
                <path d="M539.4,167.7v-53h-15.1v-17.3h15.1v-11.7l22.2-14.1v25.8h29.6v17.3h-29.6v47.6c0,10.5,5,13.1,11.5,13.1s13.1-6.2,15.9-11.7l6.9,19.8c-4.2,6.2-13.7,12.7-27.8,12.7s-28.8-11.5-28.8-28.6Z" />
                <path d="M603.3,173.2c0-13.7,9.5-22,25.2-28.2l32.3-13.7c-.8-9.7-5.2-16.3-18.5-16.3s-23,7.5-28.6,17.7l-13.3-15.9c7.5-10.3,22.6-21.4,44.1-21.4s37.5,13.7,37.5,37.5v36.3c0,4.4,1.6,5.8,5.2,5.8h6.2v21h-13.7c-10.3,0-18.5-6.7-18.5-20.6v-7.1c-3,12.7-12.3,27.8-32.5,27.8s-25.4-8.9-25.4-22.8ZM636.6,178.8c14.7,0,24.6-8.7,24.6-21.8v-10.3l-24.8,11.1c-8.3,3.8-11.7,7.1-11.7,12.1s3.8,8.9,11.9,8.9Z" />
                <path d="M710.5,196v-98.6h22.2v27.4c3.6-15.5,13.3-29.4,30.6-29.4s21,7.9,21,22.2-2.6,16.3-4.4,19.3h-22.8c3.2-3.2,6.2-9.5,6.2-15.1s-2.6-9.7-9.1-9.7c-11.1,0-21.4,12.7-21.4,28.8v55.2h-22.2Z" />
                <path d="M793,173.2c0-13.7,9.5-22,25.2-28.2l32.3-13.7c-.8-9.7-5.2-16.3-18.5-16.3s-23,7.5-28.6,17.7l-13.3-15.9c7.5-10.3,22.6-21.4,44.1-21.4s37.5,13.7,37.5,37.5v36.3c0,4.4,1.6,5.8,5.2,5.8h6.2v21h-13.7c-10.3,0-18.5-6.7-18.5-20.6v-7.1c-3,12.7-12.3,27.8-32.5,27.8s-25.4-8.9-25.4-22.8ZM826.4,178.8c14.7,0,24.6-8.7,24.6-21.8v-10.3l-24.8,11.1c-8.3,3.8-11.7,7.1-11.7,12.1s3.8,8.9,11.9,8.9Z" />
            </g>

            <path fill={tone === 'white' ? '#ffffff' : `url(#${orbId})`} d={ORB_PATH} />
        </svg>
    )
}
