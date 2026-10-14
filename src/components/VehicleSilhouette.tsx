import * as React from 'react'
import { cn } from '../lib/cn'
import { vehiclePaint, isVehicleBody, vehicleBodyLabel, type VehicleBody } from '../lib/vehicle-catalog'

/**
 * VehicleSilhouette: a side view of a car, one per body type, in the car's
 * paint (AUTM-1870, replacing AUTM-1720's ten 20px type glyphs).
 *
 * Where it shows: the picker's details step (the shape the model implies,
 * repainted as the customer taps a colour), each car in the garage, and the
 * saved cars at checkout. One drawing language: a flat body in the paint,
 * dark glass, dark tyres with a light hub, facing right, on a 200 x 84 box so
 * every body sits on the same ground and two cars side by side compare.
 *
 * The paint, glass and tyres are artwork, literal like CategoryArt's palette
 * and the same in both themes, as a photograph would be. The body's edge is
 * `currentColor` at low alpha, so it follows the consumer's text token: a
 * white car on paper and a black car on the dark page both keep an outline.
 * With no colour (or one we cannot name) the body takes `--band-press`, a
 * neutral that tracks the theme.
 *
 * Decorative by default (aria-hidden), because a card or a picker beside it
 * already says the car in words. Pass `title` where the drawing stands alone,
 * and it becomes an image with that name.
 *
 * No hooks and no 'use client', so a server component can draw it.
 */
export interface VehicleSilhouetteProps {
    /** The body type (the `VehicleType` enum). Unknown or empty draws OTHER. */
    body?: VehicleBody | string | null
    /** The car's colour as saved ("White", "Pearl white"), or a paint value. */
    color?: string | null
    /** Names the drawing for assistive tech; without it the drawing is hidden. */
    title?: string
    className?: string
    testId?: string
}

type Shape = {
    body: string
    /** Glass, drawn over the body. */
    glass: string[]
    /** Extra solid parts in the dark trim colour (a soft top, a chassis rail). */
    trim?: string[]
    /** Wheel centres on the x axis, and their radius. */
    wheels: [number, number]
    radius?: number
    wheelY?: number
}

/* Front on the right. Ground is y = 81; a wheel of radius 12.5 at y = 68.5
   touches it. Arches are the body path's own arcs, so nothing has to paint
   the page colour over the car to cut them. */
const SHAPES: Record<VehicleBody, Shape> = {
    SEDAN: {
        body: 'M10 70 L10 55 Q10 48 17 47 L42 45.5 L64 31 Q68 28 74 28 L116 28 Q122 28 126 31.5 L146 45 L180 47.5 Q190 48.5 190 57 L190 70 L170 70 A16 16 0 0 0 138 70 L62 70 A16 16 0 0 0 30 70 Z',
        glass: [
            'M50 44.5 L66 33 Q69 30.5 74 30.5 L92 30.5 L92 44.5 Z',
            'M96 44.5 L96 30.5 L115 30.5 Q120 30.5 123 33 L140 44.5 Z',
        ],
        wheels: [46, 154],
    },
    HATCHBACK: {
        body: 'M24 70 L24 52 Q24 46 27 42 L38 31 Q41 28.5 47 28.5 L110 28.5 Q117 28.5 121 32 L142 45 L176 47.5 Q186 48.5 186 57 L186 70 L170 70 A16 16 0 0 0 138 70 L62 70 A16 16 0 0 0 30 70 Z',
        glass: [
            'M36 44.5 L41 34 Q43 31 48 31 L76 31 L76 44.5 Z',
            'M80 44.5 L80 31 L109 31 Q115 31 118.5 34 L135 44.5 Z',
        ],
        wheels: [46, 154],
    },
    SUV: {
        body: 'M12 64 L12 44 Q12 36 17 32 L27 19 Q30 16 36 16 L116 16 Q123 16 127 20 L146 37 L180 40 Q190 41 190 49 L190 64 L172 64 A18 18 0 0 0 136 64 L64 64 A18 18 0 0 0 28 64 Z',
        glass: [
            'M22 34 L29.5 22.5 Q31.5 19 36 19 L58 19 L58 34 Z',
            'M62 34 L62 19 L90 19 L90 34 Z',
            'M94 34 L94 19 L116 19 Q121 19 124 22.5 L138 34 Z',
        ],
        /* Roof rails: what says SUV rather than a tall wagon at this size. */
        trim: ['M38 13.5 L112 13.5 Q114 13.5 114 15 L114 16 L36 16 L36 15 Q36 13.5 38 13.5 Z'],
        wheels: [46, 154],
        radius: 14,
        wheelY: 67,
    },
    WAGON: {
        body: 'M10 70 L10 52 Q10 44 14 40 L20 31 Q22.5 28 28 28 L116 28 Q122 28 126 31.5 L146 45 L180 47.5 Q190 48.5 190 57 L190 70 L170 70 A16 16 0 0 0 138 70 L62 70 A16 16 0 0 0 30 70 Z',
        glass: [
            'M22 44.5 L24 34 Q25 31 29 31 L54 31 L54 44.5 Z',
            'M58 44.5 L58 31 L92 31 L92 44.5 Z',
            'M96 44.5 L96 31 L115 31 Q120 31 123 33.5 L140 44.5 Z',
        ],
        wheels: [46, 154],
    },
    COUPE: {
        body: 'M12 70 L12 55 Q12 49 18 48 L40 46 L70 31 Q75 29 82 29 L110 29 Q117 29 122 33 L144 46 L180 48.5 Q190 49.5 190 57 L190 70 L170 70 A16 16 0 0 0 138 70 L62 70 A16 16 0 0 0 30 70 Z',
        glass: ['M56 44.5 L72 33.5 Q76 31.5 82 31.5 L109 31.5 Q115 31.5 119 34.5 L136 44.5 Z'],
        wheels: [46, 154],
    },
    CONVERTIBLE: {
        body: 'M12 70 L12 55 Q12 48 18 47 L118 45 L124 44 L136 30 L139.5 30.5 L130.5 45 L180 47.5 Q190 48.5 190 57 L190 70 L170 70 A16 16 0 0 0 138 70 L62 70 A16 16 0 0 0 30 70 Z',
        glass: [],
        trim: [
            'M22 47 Q23 40 33 40 L52 40 Q58 40 58 46.5 Z',
            'M74 46 L74 38 Q74 35.5 77 35.5 L81 35.5 Q84 35.5 84 38 L84 46 Z',
            'M98 45.5 L98 38 Q98 35.5 101 35.5 L105 35.5 Q108 35.5 108 38 L108 45.5 Z',
        ],
        wheels: [46, 154],
    },
    UTE: {
        body: 'M8 68 L8 44 L84 44 L84 30 Q84 25 90 25 L120 25 Q126 25 130 29.5 L146 43 L180 46 Q190 47 190 55 L190 68 L171 68 A17 17 0 0 0 137 68 L63 68 A17 17 0 0 0 29 68 Z',
        glass: [
            'M88 41 L88 28 L104 28 L104 41 Z',
            'M108 41 L108 28 L119 28 Q124 28 127 31.5 L139 41 Z',
        ],
        trim: ['M8 44 L84 44 L84 47 L8 47 Z'],
        wheels: [46, 154],
        radius: 13.5,
        wheelY: 67.5,
    },
    VAN: {
        body: 'M10 70 L10 22 Q10 12 20 12 L132 12 Q140 12 144 18 L160 40 L182 44 Q190 45.5 190 54 L190 70 L170 70 A16 16 0 0 0 138 70 L62 70 A16 16 0 0 0 30 70 Z',
        glass: [
            'M18 38 L18 20 Q18 18 20 18 L56 18 L56 38 Z',
            'M60 38 L60 18 L100 18 L100 38 Z',
            'M104 38 L104 18 L131 18 Q136 18 139 22 L152 38 Z',
        ],
        wheels: [46, 154],
    },
    TRUCK: {
        body: 'M140 66 L140 16 Q140 10 147 10 L176 10 Q183 10 185 16 L190 38 L190 66 L182 66 A18 18 0 0 0 146 66 Z M8 60 L8 10 Q8 6 12 6 L132 6 Q136 6 136 10 L136 60 Z',
        glass: ['M150 30 L150 16 L176 16 Q180 16 181 20 L184 30 Z'],
        trim: ['M14 60 L140 60 L140 65 L14 65 Z'],
        wheels: [40, 164],
        radius: 13,
    },
    OTHER: {
        body: 'M14 70 L14 50 Q14 42 20 40 L32 26 Q35 22 42 22 L114 22 Q121 22 125 26 L144 42 L178 45 Q188 46 188 55 L188 70 L170 70 A16 16 0 0 0 138 70 L62 70 A16 16 0 0 0 30 70 Z',
        glass: [
            'M34 39 L40 28 Q42 25 46 25 L80 25 L80 39 Z',
            'M84 39 L84 25 L113 25 Q118 25 121 28 L135 39 Z',
        ],
        wheels: [46, 154],
    },
}

/* Artwork colours: dark glass, dark rubber, a light alloy hub. */
const GLASS = '#26303f'
const GLASS_EDGE = '#ffffff'
const TRIM = '#22252b'
const TYRE = '#17181c'
const HUB = '#b9bec6'

/** The body a value draws, OTHER for anything unknown. */
export function silhouetteBody(body?: string | null): VehicleBody {
    return isVehicleBody(body) ? body : 'OTHER'
}

export function VehicleSilhouette({ body, color, title, className, testId }: VehicleSilhouetteProps) {
    const kind = silhouetteBody(body)
    const shape = SHAPES[kind]
    const paint = vehiclePaint(color)
    const r = shape.radius ?? 12.5
    const cy = shape.wheelY ?? 68.5
    const named = Boolean(title)
    return (
        <svg
            viewBox="0 0 200 84"
            role={named ? 'img' : undefined}
            aria-label={named ? title : undefined}
            aria-hidden={named ? undefined : true}
            focusable="false"
            data-testid={testId}
            data-body={kind}
            data-paint={paint?.value ?? 'none'}
            className={cn('block h-auto w-full text-[var(--text-strong)]', className)}
        >
            <path
                d={shape.body}
                fill={paint?.color ?? 'var(--band-press)'}
                stroke="currentColor"
                strokeOpacity={paint?.edge || !paint ? 0.42 : 0.3}
                strokeWidth={1.25}
                strokeLinejoin="round"
            />
            {(shape.trim ?? []).map((d) => (
                <path key={d} d={d} fill={TRIM} />
            ))}
            {shape.glass.map((d) => (
                /* The glass keeps a faint light edge, so a black car still has windows. */
                <path key={d} d={d} fill={GLASS} fillOpacity={0.86} stroke={GLASS_EDGE} strokeOpacity={0.22} strokeWidth={1} />
            ))}
            {shape.wheels.map((cx) => (
                <g key={cx}>
                    <circle cx={cx} cy={cy} r={r} fill={TYRE} stroke="currentColor" strokeOpacity={0.18} />
                    <circle cx={cx} cy={cy} r={r * 0.46} fill={HUB} />
                    <circle cx={cx} cy={cy} r={r * 0.14} fill={TYRE} />
                </g>
            ))}
        </svg>
    )
}

/** "Ute / Pickup" for a drawing's alt text, with the colour when known. */
export function vehicleSilhouetteTitle(body?: string | null, color?: string | null): string {
    const shape = vehicleBodyLabel(silhouetteBody(body)) ?? 'Vehicle'
    const paint = vehiclePaint(color)
    return paint ? `${paint.label} ${shape.toLowerCase()}` : shape
}
