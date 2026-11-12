/**
 * CategoryArt: the light art Autara draws where a photograph would be
 * (AUTM-1105), moved here from customer-web for AUTM-1800 so the merchant
 * portal's profile preview draws the same no-photo cover the profile page
 * does.
 *
 * Don, relaying the client: no car care or car wash photography on the
 * website, "something modern and tech vibe", "vector or 3d, noisy". So there
 * is no object here at all: each tile is light. Blurred forms in the bloom
 * palette (purple acts, aqua, lime) over a soft ground, one ribbon of light
 * across them, and a heavy feTurbulence grain so the surface has tooth. The
 * three kinds differ by hue family and by the direction the light moves. No
 * drop shadows; the depth is the blur. Inline SVG: crisp at any width, weighs
 * nothing.
 *
 * The palette is literal on purpose. It is artwork, not chrome, and it reads
 * the same in both themes, as a photograph would.
 *
 * No hooks and no 'use client', so a server component renders it. Gradient and
 * filter ids are `${idPrefix}-${kind}-*`: two pieces of the same kind on one
 * page need distinct prefixes, or the second resolves `url(#id)` against the
 * first (and a hidden first copy blanks the second).
 */
export type CategoryArtKind = 'exterior' | 'interior' | 'protection'

const KIND_BY_SLUG: Record<string, CategoryArtKind> = {
    'exterior-car-care-detailing': 'exterior',
    'interior-detailing-protection': 'interior',
    'protection-restoration': 'protection',
}

export function categoryArtKind(slug: string): CategoryArtKind | null {
    return KIND_BY_SLUG[slug] ?? null
}

const P = {
    purple: '#4e1bbd',
    purpleDeep: '#2a0f6e',
    violet: '#8b5cf6',
    aqua: '#4ceaff',
    aquaDeep: '#0d7288',
    lime: '#d4ff4f',
    limeDeep: '#7aa31a',
    ink: '#0e0a1a',
    paper: '#f6f4fb',
}

/* Per-kind composition: the ground, three light forms (an ellipse each,
   blurred), and the ribbon's path. Coordinates are in the 400x300 box. */
const ART: Record<
    CategoryArtKind,
    {
        ground: [string, string]
        forms: Array<{ cx: number; cy: number; rx: number; ry: number; rot: number; fill: string; o: number }>
        ribbon: { d: string; from: string; to: string }
    }
> = {
    exterior: {
        ground: [P.paper, '#ece6fb'],
        forms: [
            { cx: 110, cy: 210, rx: 170, ry: 110, rot: -18, fill: P.purple, o: 0.55 },
            { cx: 300, cy: 90, rx: 150, ry: 95, rot: 12, fill: P.aqua, o: 0.6 },
            { cx: 250, cy: 250, rx: 120, ry: 70, rot: -30, fill: P.violet, o: 0.5 },
        ],
        ribbon: { d: 'M-20 220 C 90 120, 200 260, 420 110', from: P.aqua, to: P.purple },
    },
    interior: {
        ground: [P.paper, '#e9f6ee'],
        forms: [
            { cx: 90, cy: 80, rx: 160, ry: 100, rot: 20, fill: P.lime, o: 0.55 },
            { cx: 310, cy: 220, rx: 170, ry: 110, rot: -14, fill: P.aqua, o: 0.5 },
            { cx: 210, cy: 140, rx: 110, ry: 60, rot: 8, fill: P.limeDeep, o: 0.35 },
        ],
        ribbon: { d: 'M-20 90 C 120 200, 260 40, 420 190', from: P.lime, to: P.aquaDeep },
    },
    protection: {
        ground: [P.paper, '#e9e4f7'],
        forms: [
            { cx: 200, cy: 260, rx: 220, ry: 110, rot: 0, fill: P.purpleDeep, o: 0.55 },
            { cx: 120, cy: 90, rx: 140, ry: 90, rot: -22, fill: P.aqua, o: 0.5 },
            { cx: 320, cy: 120, rx: 130, ry: 80, rot: 18, fill: P.purple, o: 0.55 },
        ],
        ribbon: { d: 'M-20 260 C 100 60, 300 320, 420 60', from: P.aqua, to: P.violet },
    },
}

export function CategoryArt({
    kind,
    className = '',
    idPrefix = 'cat',
}: {
    kind: CategoryArtKind
    className?: string
    /** Two pieces of the same kind on one page need distinct gradient ids. */
    idPrefix?: string
}) {
    const id = `${idPrefix}-${kind}`
    const art = ART[kind]
    return (
        <svg
            viewBox="0 0 400 300"
            role="img"
            aria-hidden
            className={className}
            preserveAspectRatio="xMidYMid slice"
        >
            <defs>
                <linearGradient id={`${id}-ground`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={art.ground[0]} />
                    <stop offset="100%" stopColor={art.ground[1]} />
                </linearGradient>
                <linearGradient id={`${id}-ribbon`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={art.ribbon.from} stopOpacity="0" />
                    <stop offset="35%" stopColor={art.ribbon.from} stopOpacity="0.95" />
                    <stop offset="65%" stopColor={art.ribbon.to} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={art.ribbon.to} stopOpacity="0" />
                </linearGradient>
                <filter id={`${id}-soft`} x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="34" />
                </filter>
                <filter id={`${id}-ribbon-soft`} x="-20%" y="-60%" width="140%" height="220%">
                    <feGaussianBlur stdDeviation="7" />
                </filter>
                <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                    <feComponentTransfer>
                        <feFuncA type="table" tableValues="0 0.28" />
                    </feComponentTransfer>
                </filter>
            </defs>

            <rect width="400" height="300" fill={`url(#${id}-ground)`} />

            <g filter={`url(#${id}-soft)`}>
                {art.forms.map((f, i) => (
                    <ellipse
                        key={i}
                        cx={f.cx}
                        cy={f.cy}
                        rx={f.rx}
                        ry={f.ry}
                        fill={f.fill}
                        opacity={f.o}
                        transform={`rotate(${f.rot} ${f.cx} ${f.cy})`}
                    />
                ))}
            </g>

            {/* the ribbon of light: a wide soft stroke and a thin bright core */}
            <path d={art.ribbon.d} fill="none" stroke={`url(#${id}-ribbon)`} strokeWidth="26" strokeLinecap="round" filter={`url(#${id}-ribbon-soft)`} opacity="0.75" />
            <path d={art.ribbon.d} fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

            {/* grain */}
            <rect width="400" height="300" filter={`url(#${id}-grain)`} style={{ mixBlendMode: 'soft-light' }} />
        </svg>
    )
}
