import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { StatTile, type StatTone } from './StatTile'

/**
 * StatsStrip — horizontal row of compact stat tiles. One pattern,
 * many consumers (merchant Bookings stats, Customers stats, Services
 * stats, Earnings KPIs; admin overview).
 *
 * Aesthetic:
 *   - Hairline-bordered tiles on the cream canvas
 *   - Sentence-case label from `StatTile` (0.8125rem, weight 500, no
 *     letterspacing since AUTM-1161)
 *   - Bold tabular-nums value
 *   - No drop shadow (Autara house rule)
 *   - 2 columns on phone (always); collapses neatly into 1×N rows on
 *     wider surfaces by accepting a `columns` prop
 *
 * `value={null}` (or `loading`) renders a pulse-skeleton bar where the
 * value would go — preserves the tile's shape so the layout doesn't
 * reflow when data arrives.
 *
 * AUTM-726 — this no longer draws the tile. `StatTile` does, and this is
 * the grid around it. Before that they were separate implementations of the
 * same idea, which is how merchant-mobile ended up with a hand-made KPI on
 * Today that looked better than the shared one everywhere else. If you are
 * changing how a stat LOOKS, change StatTile; this file only owns layout.
 *
 * Three stat surfaces still exist: `StatTile` (one stat), `StatsStrip` (a
 * grid of them) and `KpiCard` (a single tile with a trend chip). Use
 * `KpiCard` only when you need the trend chip.
 */

export interface StatItem {
    label: string
    /** Pre-formatted value. `null` or `undefined` → loading skeleton. */
    value?: ReactNode
    caption?: string
    /** Optional 20 px icon glyph rendered top-right of the tile. */
    icon?: ReactNode
    /** AUTM-726 — semantic accent tick. See StatTile for the mapping. */
    tone?: StatTone
    /**
     * AUTM-713 — promote this one tile to the accent fill. At most ONE per
     * strip: the point is that a merchant's eye lands on the number that
     * answers their question, and two heroes is no hero. See StatTile.
     */
    hero?: boolean
    /** `quiet`: the cell opens what the figure is made of. */
    onClick?: () => void
    /** `data-testid` on the tile or cell (a public API for QA). */
    testId?: string
    /** `quiet`: a zero or an unknown figure, drawn muted. */
    muted?: boolean
}

export interface StatsStripProps {
    stats: StatItem[]
    /** Force the loading state across every tile. */
    loading?: boolean
    /** Override the column count at the `sm` breakpoint and up.
     *  Defaults to `min(stats.length, 4)`. */
    columns?: 2 | 3 | 4
    className?: string
    /**
     * `tiles` (default): a grid of band tiles.
     *
     * `quiet` (Don, 2026-11-07, the merchant app's quiet pass): ONE band
     * holding the stats as cells (`StatTile variant="cell"`), a 13px label
     * over a bold figure, no tile of its own and no Black weight. For a row
     * of figures that support a screen rather than lead it: under Today's
     * hero, over a list of customers or invoices. In a narrow strip (a
     * phone, 200% text) the cells become rows, label left and figure right.
     */
    variant?: 'tiles' | 'quiet'
    /** `quiet`: the cells' top figure size (StatTile `figureSize`). */
    figureSize?: 'md' | 'lg'
}

const COLUMN_CLASS: Record<2 | 3 | 4, string> = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
}

const QUIET_COLUMNS: Record<1 | 2 | 3 | 4, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
}

export function StatsStrip({
    stats,
    loading = false,
    columns,
    className,
    variant = 'tiles',
    figureSize = 'lg',
}: StatsStripProps) {
    if (variant === 'quiet') {
        const n = (columns ?? Math.min(Math.max(stats.length, 1), 4)) as 1 | 2 | 3 | 4
        return (
            /* Named, so the cells can lay out as rows when THIS strip is
               narrow, whatever container sits around it. */
            <div className="stats-strip-host @container/strip">
                <div
                    data-variant="quiet"
                    className={cn(
                        'stats-strip grid gap-1 rounded-[1.25rem] bg-[var(--band)] p-1.5 @max-[22em]/strip:grid-cols-1',
                        QUIET_COLUMNS[n],
                        className,
                    )}
                >
                    {stats.map((s, i) => (
                        <div key={i} className="grid min-w-0 [container-type:inline-size]">
                            <StatTile
                                variant="cell"
                                label={s.label}
                                value={s.value}
                                caption={s.caption}
                                muted={s.muted}
                                figureSize={figureSize}
                                loading={loading}
                                onClick={s.onClick}
                                testId={s.testId}
                            />
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    const cols: 2 | 3 | 4 = columns ?? (Math.min(stats.length, 4) as 2 | 3 | 4)
    /* AUTM-1792 — on a phone the strip is two columns, and three stats left
       the third alone on a row with the hero squeezed into half a phone,
       where "$13,880" ran out of its tile. With an odd count the hero now
       leads the full width (or, with no hero, the last tile takes the row);
       from `sm` every tile is a column again. */
    const odd = stats.length % 2 === 1
    const heroIndex = stats.findIndex((s) => s.hero)
    const wideIndex = !odd ? -1 : heroIndex >= 0 ? heroIndex : stats.length - 1
    return (
        /* The strip's own container, so it can go to ONE column when the text
           is large (an em container query: 200% text reads as less room). */
        <div className="stats-strip-host @container">
            <div
                className={cn(
                    'stats-strip grid grid-flow-row-dense grid-cols-2 gap-3 @max-[20em]:grid-cols-1',
                    COLUMN_CLASS[cols],
                    className
                )}
            >
                {stats.map((s, i) => (
                    <div
                        key={i}
                        /* Each tile is a size container, so its figure can
                           size to it (StatTile `stat-tile-figure`). */
                        className={cn(
                            'grid min-w-0 [container-type:inline-size]',
                            i === wideIndex && 'col-span-2 @max-[20em]:col-span-1 sm:col-span-1',
                            i === wideIndex && i === heroIndex && 'order-first sm:order-none'
                        )}
                    >
                        <StatTile
                            label={s.label}
                            value={s.value}
                            caption={s.caption}
                            icon={s.icon}
                            tone={s.tone}
                            hero={s.hero}
                            loading={loading}
                            onClick={s.onClick}
                            testId={s.testId}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
