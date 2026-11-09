import type { CSSProperties, JSX, ReactNode, SVGProps } from 'react'

/**
 * AUTM-2114: Autara's own icon set, replacing Solar (Don, 2026-11-08: "remove
 * solar icons and make our own icon set for autara"). The first glyphs were
 * drawn and approved in merchant-mobile (AUTM-2042) and are ported here
 * unchanged; the rest follow their grammar.
 *
 * Grammar
 * - A 24 grid, live area about 3.4 to 20.6, 1.7 strokes, round caps and
 *   joins, soft 2.4 to 4 radii, the geometry of the Autara mark.
 * - Object icons are duotone: a body behind the line art, drawn in the icon's
 *   OWN colour at 16% (`currentColor`, `fill-opacity: var(--icon-body)`).
 *   A fixed lavender body and a lime active fill were tried first and Don
 *   turned them down the same day ("not compatible when dark and light"), so
 *   everything derives from the one colour the caller sets and reads the same
 *   in both themes. Details are the line colour; the personality is the shapes
 *   plus the body.
 * - Utility glyphs (chevrons, close, check, add, arrows, copy...) are line
 *   only: no body. They sit inside buttons and text.
 * - `active` deepens the body to 30%. The icon never picks a brand colour:
 *   the caller colours the current item (the rail uses `--accent`).
 * - `--icon-body` is a public knob: `style={{ '--icon-body': 1 }}` fills the
 *   body solid (a rated star), `0` drops it.
 *
 * Decorative by default (`aria-hidden`): the label beside an icon names it.
 * An icon that stands alone names itself through its control's label, never
 * through the svg.
 */
export interface AutaraIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
    /** Pixel size or any CSS length (`'1.25em'` scales with the label). 22 by default. */
    size?: number | string
    /** The current item: the body deepens from 16% to 30%. Colour it yourself (the rail uses the accent). */
    active?: boolean
}

/** Every Autara icon has this shape, so a nav item can hold one as `Icon: AutaraIconComponent`. */
export type AutaraIconComponent = (props: AutaraIconProps) => JSX.Element

/** The duotone body: the icon's own colour, faint at rest, firmer active. */
export const BODY: CSSProperties = { fill: 'currentColor', fillOpacity: 'var(--icon-body, 0.16)' }

/** A solid detail in the line colour (a dot, a ray, a sparkle). */
export const DETAIL: CSSProperties = { fill: 'currentColor' }

/** The value `active` sets `--icon-body` to. */
export const ACTIVE_BODY = '0.3'

/**
 * The svg every glyph draws into. Internal: consumers import the glyphs, so a
 * one-off glyph drawn in an app cannot drift from the family.
 */
export function AutaraIcon({
    glyph,
    size = 22,
    active = false,
    style,
    children,
    ...rest
}: AutaraIconProps & { glyph: string; children: ReactNode }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            focusable="false"
            data-icon={glyph}
            data-active={active || undefined}
            style={active ? ({ '--icon-body': ACTIVE_BODY, ...style } as CSSProperties) : style}
            {...rest}
        >
            {children}
        </svg>
    )
}
