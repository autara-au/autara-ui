import type { JSX, ReactNode, SVGProps } from 'react'

/**
 * AUTM-2114: Autara's own icon set, replacing Solar (Don, 2026-11-08: "remove
 * solar icons and make our own icon set for autara").
 *
 * Grammar (Don, 2026-11-09: "I like the solar icons type"; "Draw ours in
 * Solar style", the 8 rail icons approved by popup the same day, the other
 * 70 drawn to match). Our own paths, never Solar's.
 * - Linear at rest: a 24 grid, 1.5 strokes, round caps and joins, squircle
 *   corners, the odd solid dot. No duotone body.
 * - Bold when `active`: a filled twin, one evenodd path in currentColor with
 *   the details knocked out, computed from the line geometry so the pair
 *   always matches. Every object icon has one, and so do the closed utility
 *   glyphs (the ringed set, error, warning, blocked, play, pause, lock,
 *   more). Open utility glyphs (chevrons, arrows, close, check) stay line.
 * - The icon never picks a colour: everything is `currentColor`, so it reads
 *   the same in light and dark (Don turned down a fixed second colour on
 *   2026-11-08). The caller colours the current item (the rail uses the accent).
 * - Sources and the generator: `.design-proofs/icons-solar-style-2026-11-09/`
 *   in the workspace (linear/, bold/, _build/).
 *
 * Decorative by default (`aria-hidden`): the label beside an icon names it.
 * An icon that stands alone names itself through its control's label, never
 * through the svg.
 */
export interface AutaraIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
    /** Pixel size or any CSS length (`'1.25em'` scales with the label). 22 by default. */
    size?: number | string
    /** The current item: draws the filled Bold twin. Colour it yourself (the rail uses the accent). */
    active?: boolean
}

/** Every Autara icon has this shape, so a nav item can hold one as `Icon: AutaraIconComponent`. */
export type AutaraIconComponent = (props: AutaraIconProps) => JSX.Element

/**
 * The svg every glyph draws into. Internal: consumers import the glyphs, so a
 * one-off glyph drawn in an app cannot drift from the family.
 */
export function AutaraIcon({
    glyph,
    size = 22,
    active = false,
    style,
    bold,
    children,
    ...rest
}: AutaraIconProps & {
    glyph: string
    children: ReactNode
    /**
     * Don, 2026-11-09 ("Draw ours in Solar style"): a filled twin for the
     * selected state, the way Solar pairs Linear with Bold. When a glyph has
     * one, `active` draws it instead of the line art: currentColor fill, no
     * stroke, details knocked out as negative space. A glyph without one
     * (an open utility glyph) keeps its line art.
     */
    bold?: ReactNode
}) {
    const filled = active && bold != null
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill={filled ? 'currentColor' : 'none'}
            stroke={filled ? 'none' : 'currentColor'}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            focusable="false"
            data-icon={glyph}
            data-active={active || undefined}
            data-weight={filled ? 'bold' : 'linear'}
            style={style}
            {...rest}
        >
            {filled ? bold : children}
        </svg>
    )
}
