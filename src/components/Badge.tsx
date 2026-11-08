import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/cn'

/**
 * Badge — the inline pill for status, category and counts.
 *
 * AUTM-1594 — canvas v44 "Status and counts": solid, rounded pills, 28px,
 * 13px Medium, 12px in. Purple acts or is live, aqua is in flight, lime is
 * done. No tints, no outlines. The tones:
 *
 *   brand    pending, confirmed           amber    awaiting customer
 *   aqua     in progress                  lime     completed, default
 *   danger   the merchant's Cancelled     band     no-show, expired, meta
 *   waiting  the customer's "Awaiting confirmation" / "Payment incomplete":
 *            ink (white in dark), because the next move is someone else's
 *   off      the customer's Cancelled: band with danger text
 *
 * Counts are the `count` variants: a 22px disc that widens with the number,
 * 12px Bold. Purple in navigation, a solid neutral disc when quiet, red on
 * the bell and the dock (`count-alert`), and lime with ink on an ACTIVE or
 * SELECTED row (`count-selected`: the current rail item, the chosen filter
 * chip). AUTM-1753, Don 2026-10-09: `count-quiet` on the selected fill drew
 * "99+" as a dark pill on purple in dark mode, "fix that with a better one,
 * like a lime green badge". Lime on ink is 16.9:1 in both themes, and lime
 * is already the colour that means "this one" on the selected row's fill.
 *
 * The shape is a pill by default now; the sheet supersedes AUTM-211's
 * parallelogram default. `shape="parallelogram"` still draws the tilted slab
 * where a consumer asks for it.
 *
 * Every earlier variant name still renders, as the sheet tone that does its
 * job (see LEGACY). AUTM-1485 goes with them: `destructive` and `success`
 * failed AA under their white labels (4.47:1 and 3.51:1); as danger and
 * lime they are 6.57:1 and 16.9:1.
 *
 * AUTM-1107: labels are set in the case the consumer passes, never
 * letterspaced uppercase. Sizes are rem (AUTM-948), so a badge grows with
 * the reader's text size; `min-h`, never a fixed height (AUTM-915).
 */

type SheetTone =
    | 'brand'
    | 'amber'
    | 'aqua'
    | 'lime'
    | 'danger'
    | 'band'
    | 'waiting'
    | 'off'
    | 'count'
    | 'count-quiet'
    | 'count-alert'
    | 'count-selected'

type LegacyTone =
    | 'purple'
    | 'act'
    | 'primary'
    | 'light-primary'
    | 'flight'
    | 'dark-aqua'
    | 'money'
    | 'success'
    | 'dark-lime'
    | 'light-success'
    | 'live'
    | 'warning'
    | 'light-warning'
    | 'destructive'
    | 'light-destructive'
    | 'neutral'
    | 'default'
    | 'dark-default'
    | 'light-default'
    | 'info'

/** Each legacy name resolves to the sheet tone that does its job. */
const LEGACY: Record<LegacyTone, SheetTone> = {
    purple: 'brand',
    act: 'brand',
    primary: 'brand',
    'light-primary': 'brand',
    flight: 'aqua',
    'dark-aqua': 'aqua',
    money: 'lime',
    success: 'lime',
    'dark-lime': 'lime',
    'light-success': 'lime',
    live: 'lime',
    warning: 'amber',
    'light-warning': 'amber',
    destructive: 'danger',
    'light-destructive': 'danger',
    neutral: 'band',
    default: 'band',
    'dark-default': 'band',
    'light-default': 'band',
    info: 'band',
}

const PILL = 'min-h-7 px-3 py-0.5 text-[0.8125rem]'
const COUNT = 'min-h-[1.375rem] min-w-[1.375rem] justify-center px-[0.4375rem] text-xs font-bold'

const TONES: Record<SheetTone, string> = {
    brand: `${PILL} bg-[var(--brand)] text-[var(--on-brand)]`,
    amber: `${PILL} bg-[var(--amber)] text-[var(--on-amber)]`,
    aqua: `${PILL} bg-[var(--aqua)] text-[var(--on-aqua)]`,
    lime: `${PILL} bg-[var(--lime)] text-[var(--on-lime)]`,
    danger: `${PILL} bg-[var(--danger-fill)] text-[var(--on-danger-fill)]`,
    band: `${PILL} bg-[var(--band)] text-[var(--text-strong)]`,
    waiting: `${PILL} bg-[var(--strong)] text-[var(--on-strong)]`,
    off: `${PILL} bg-[var(--band)] text-[var(--danger)]`,
    count: `${COUNT} bg-[var(--brand)] text-[var(--on-brand)]`,
    // AUTM-1812: --accent, not --brand-deep. Brand-deep is #2e1070 in BOTH
    // themes, so on dark paper the quiet count measured about 1.4:1 (the
    // portal's Services filter chips in dark mode). Text-grade purple is
    // --accent: 9.5:1 on paper in light, 10.3:1 in dark (Badge.contrast.test).
    // AUTM-2042 (Don, 2026-11-08: no hairlines): it was paper ringed by a 1px
    // hairline, white on a white page or on the near-white band chip, the
    // ring all that set it apart. Solid badges: the neutral disc fill, which
    // stands off paper and band alike in both themes.
    'count-quiet': `${COUNT} bg-[var(--icon-disc)] text-[var(--accent)]`,
    'count-alert': `${COUNT} bg-[var(--alert)] text-[var(--on-alert)]`,
    'count-selected': `${COUNT} bg-[var(--lime)] text-[var(--on-lime)]`,
}

const VARIANTS = {
    ...TONES,
    ...(Object.fromEntries(
        Object.entries(LEGACY).map(([legacy, tone]) => [legacy, TONES[tone]]),
    ) as Record<LegacyTone, string>),
}

const badgeVariants = cva(
    'inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-medium leading-tight transition-colors',
    {
        variants: {
            variant: VARIANTS,
            shape: {
                pill: 'rounded-full',
                parallelogram: '[transform:skewX(-12deg)] !rounded-md select-none',
            },
        },
        defaultVariants: {
            variant: 'band',
            shape: 'pill',
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant, shape, children, ...props }, ref) => {
        const resolvedShape = shape ?? 'pill'
        return (
            <div
                ref={ref}
                className={cn(badgeVariants({ variant, shape: resolvedShape }), className)}
                {...props}
            >
                {resolvedShape === 'parallelogram' ? (
                    /* Counter-skew so the label sits upright while the fill
                       reads as a tilted ribbon. */
                    <span className="inline-flex items-center gap-1 [transform:skewX(12deg)]">
                        {children}
                    </span>
                ) : (
                    children
                )}
            </div>
        )
    }
)
Badge.displayName = 'Badge'

export { Badge, badgeVariants }
