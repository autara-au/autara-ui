import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

/**
 * StatTile — a single stat. THE stat treatment; `StatsStrip` is just this
 * tile in a grid.
 *
 * AUTM-726 — this began life as a private `TodayKpi` inside merchant-mobile's
 * TodayScreen. It was a large part of why Today read as designed while every
 * other screen — all of which reached for the plainer `StatsStrip` — read as
 * defaulted. Same design system, two treatments, and the better one was the
 * one that happened to be hand-made. Graduating it here means there is one
 * tile, and `StatsStrip` composes it rather than duplicating it.
 *
 * The device: a quiet sentence-case label, then the number doing the
 * shouting, then a caption that says what the number is worth NEXT TO
 * SOMETHING.
 *
 * ── AUTM-1161: the tick and the uppercase are gone ───────────────────────
 *
 * This file used to argue that the 3px accent tick was "the only place the
 * accent palette is spent, which is what keeps it reading as meaning rather
 * than decoration". `project_ui_direction_2026_09_01.md` says the exact
 * opposite about the exact same device, under rule 5:
 *
 *   "Before this, aqua and lime existed only as 3px dashes above KPI labels
 *    — two of three brand colours were decoration, which is why the product
 *    read as 'a purple app' rather than as Autara."
 *
 * Both cannot be true, and the record contradicting itself is why this
 * survived three passes of polish. Don settled it on 2026-09-07 by choosing
 * concept E off the stat-tile sheet: the tick goes.
 *
 * The direction doc wins on the merits too. A 3px dash cannot carry a
 * meaning nobody has been taught — no merchant learns "aqua means in
 * flight" from a hairline above a label — so it was decoration defended as
 * semantics. Where the accent now earns its place is the caption's delta,
 * where the colour restates something the words already say.
 *
 * The uppercase went with it. Letterspaced uppercase micro-labels are a
 * machine-written tell Don has rejected by name, and here they also forced
 * "TODAY'S REVENUE" and "PENDING PAYOUTS" onto two ragged lines, which is
 * what pushed the day's agenda down the screen.
 *
 * `tone` is kept in the props and deliberately unused (`_tone`): every
 * consumer passing it keeps compiling, the call sites still document what a
 * tile means, and the hook is there if the accent is ever spent here again.
 * Deleting it would be a breaking change that buys nothing.
 */
export type StatTone = 'money-in' | 'money-out' | 'brand' | 'none'

/** Direction of a caption's leading delta. Colours it, nothing else. */
export type StatTrend = 'up' | 'down'

/* Only ever applied to the leading delta in a caption, never to the number.
 * `--intent-*-text` is the themed, contrast-tuned pair; the raw brand lime
 * measures far too low on a light surface to carry text. */
const TREND: Record<StatTrend, string> = {
    up: 'var(--intent-success-text)',
    down: 'var(--intent-error-text)',
}

export interface StatTileProps {
    label: string
    /**
     * Pre-formatted. `null`/`undefined` renders the skeleton, not a zero.
     *
     * AUTM-1792: any node, so a figure can count up as it arrives
     * (`<CountUp value={407} format={aud} />`). It was always rendered as
     * `{value}`, so a string or a number still means exactly what it did.
     */
    value?: ReactNode
    caption?: string | null
    /**
     * @deprecated AUTM-1161 — the 3px tick this drove is gone; see the note
     * at the top of the file. Still accepted so no consumer breaks, and still
     * worth passing: it documents what a tile means, and is the hook if the
     * accent is ever spent here again.
     */
    tone?: StatTone
    /**
     * Colours the leading delta of `caption` when it starts with one, e.g.
     * "+18% on last Tuesday". Pass it ONLY alongside a real comparison —
     * never to make a flat number look like good news.
     */
    trend?: StatTrend
    /** Optional glyph, rendered top-right. Kept for StatsStrip compatibility. */
    icon?: ReactNode
    /** Force the skeleton even when a value is present. */
    loading?: boolean
    /**
     * Fill the tile with the brand accent. AUTM-713 — "one hero per screen":
     * a strip of identical white cards gives four numbers equal weight when
     * only one of them answers the question the merchant came with.
     *
     * Measured on merchant-mobile before this existed: Today spends 2.8% of
     * its pixels on brand purple and Customers 0.4%, and the whole difference
     * is Today's one solid quick-action tile. Everything else is white cards
     * on the canvas, which is why light mode read as "fully white". The tick
     * cannot carry that on its own — it is 3px.
     *
     * Use it on AT MOST ONE tile per surface. Two heroes is no hero, and the
     * emphasis stops meaning "start here".
     *
     * And only when the value is worth the emphasis — pass an expression,
     * not a bare `true`. A hero is an answer, so a tile with nothing to say
     * should not wear one: Invoices showing a full-bleed purple **$0
     * outstanding** was the first thing this variant produced, and it drew
     * the eye to the one number that was not news (the $343 collected was).
     * Zero owed, zero pending, no reviews yet — those are calm states, and a
     * screen with no hero is the correct rendering of a calm state.
     *
     * Do NOT make the fill migrate to whichever tile happens to be non-empty.
     * Emphasis that moves between surfaces teaches nothing; it just makes the
     * layout unstable. Hero that tile, or hero nothing.
     *
     * The tone tick is deliberately dropped when hero — the fill already
     * spends the accent, and a lime tick on a purple field reads as a bug.
     * Semantics are preserved by which tile you promote, not by its tick.
     *
     * Consequence, and it is intentional: without the tick the hero's label
     * starts at the padding edge, ~27px left of its ticked neighbours', so a
     * mixed strip's labels do not share a left edge. That is the very
     * misalignment `tone` defaults to `brand` to avoid (see above) — the
     * exception holds because the fill gives the hero its own frame, and
     * inside that frame the label lines up with its own value instead. Don't
     * "fix" it by re-adding an invisible tick.
     */
    hero?: boolean
    /**
     * Makes the whole tile the control, and the reason it is `onClick` rather
     * than a `to` or an `href`.
     *
     * AUTM-1161 — the tiles were inert everywhere. A merchant reading
     * "Pending payouts $5,454" has an obvious next question and no way to
     * ask it, so four numbers become a dead end.
     *
     * This package is consumed by two Next.js apps and one react-router app.
     * A `to` prop would have to reach for a router, coupling every consumer
     * to whichever one this file happened to pick. The consumer already knows
     * how it navigates: it passes `() => navigate('/earnings')` or a
     * `router.push`, and the tile stays router-agnostic.
     */
    onClick?: () => void
    /**
     * Names the tile for E2E. Not decoration: `autara-web-automation` locates
     * by `data-testid`, so a shipped one is a public API. Without it a stat
     * tile's only handle is its label text, which a copy change breaks.
     */
    testId?: string
    className?: string
    /**
     * `tile` (default): the 20px band tile with a 40px Black figure.
     *
     * `cell`: one cell of a quiet strip (`StatsStrip variant="quiet"`; Don,
     * 2026-11-07, the merchant app's quiet pass). No fill of its own, since
     * the strip is the one band; a 13px label over a bold figure, never
     * Black and never lime, because Black is for a screen's one hero and a
     * row of equal Black figures has none. `hero` and `tone` are ignored.
     * Where the strip is narrow (a phone, 200% text) the cell lays out as a
     * row, the label left and the figure right.
     */
    variant?: 'tile' | 'cell'
    /** `cell`: the figure is a zero, or unknown, so it whispers (muted ink). */
    muted?: boolean
    /**
     * `cell`: the figure's top size. `md` 18px, for a strip under a hero (the
     * merchant's Today); `lg` 22px, for a strip that leads its screen. It
     * shrinks below that to fit its cell (`cqi`; the cell is a size
     * container).
     */
    figureSize?: 'md' | 'lg'
}

/**
 * The quiet strip's cell. Its own function, so the tile above stays as it
 * was for every consumer that did not ask for a cell.
 */
function StatCell({
    label,
    value,
    caption,
    loading,
    muted,
    figureSize,
    onClick,
    testId,
    className,
}: Pick<StatTileProps, 'label' | 'value' | 'caption' | 'loading' | 'muted' | 'figureSize' | 'onClick' | 'testId' | 'className'>) {
    const interactive = typeof onClick === 'function'
    const shell = cn(
        'flex min-h-11 w-full min-w-0 flex-col items-start justify-center gap-1 rounded-[0.875rem] px-3 py-2.5 text-left transition-colors',
        // The narrow strip: one row per stat, as a settings list reads.
        '@max-[22em]/strip:flex-row @max-[22em]/strip:flex-wrap @max-[22em]/strip:items-center @max-[22em]/strip:justify-between @max-[22em]/strip:gap-x-3',
        interactive &&
            'hover:bg-[var(--band-press)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--band)]',
        className,
    )
    const body = (
        <>
            <span title={label} className="min-w-0 truncate text-[0.8125rem] leading-tight font-medium text-[var(--text-muted)]">
                {label}
            </span>
            {loading || value == null ? (
                <span aria-hidden className="block h-5 w-16 motion-skeleton rounded-md bg-[var(--band-press)]" />
            ) : (
                <span
                    className={cn(
                        // Bold, tabular, one line; sized down to its cell.
                        'stat-tile-figure leading-tight font-bold tabular-nums whitespace-nowrap',
                        figureSize === 'lg' ? 'text-[clamp(1rem,14cqi,1.375rem)]' : 'text-[clamp(0.9375rem,14cqi,1.125rem)]',
                        muted ? 'text-[var(--text-muted)]' : 'text-[var(--text-strong)]',
                    )}
                >
                    {value}
                </span>
            )}
            {caption ? (
                <span className="w-full text-[0.8125rem] leading-snug text-[var(--text-muted)] @max-[22em]/strip:order-last">
                    {caption}
                </span>
            ) : null}
        </>
    )
    if (!interactive) {
        return (
            <div className={shell} data-testid={testId}>
                {body}
            </div>
        )
    }
    return (
        // Named by its words ("Still to collect $0.00"): a cell is small
        // enough that the figure is the point of pressing it.
        <button type="button" onClick={onClick} data-testid={testId} className={shell}>
            {body}
        </button>
    )
}

export function StatTile({
    label,
    value,
    caption,
    tone: _tone = 'brand',
    trend,
    icon,
    loading = false,
    hero = false,
    onClick,
    testId,
    className,
    variant = 'tile',
    muted = false,
    figureSize = 'md',
}: StatTileProps) {
    if (variant === 'cell') {
        return (
            <StatCell
                label={label}
                value={value}
                caption={caption}
                loading={loading}
                muted={muted}
                figureSize={figureSize}
                onClick={onClick}
                testId={testId}
                className={className}
            />
        )
    }
    const interactive = typeof onClick === 'function'
    const shell = cn(
        /* AUTM-1426 — the same column layout whether the shell is a <div>
         * or a <button>: a button centres its content vertically by default,
         * so an interactive tile beside a static one sat its number 15px
         * lower (Today beside Pending payouts, 2026-09-24). */
        /* AUTM-1594 — canvas v44 "Stat tiles": a 20px tile, 20px in. The
         * hero is the --hero surface (brand-deep, brand in dark) with a lime
         * figure; the plain tile is band. No border on either: the fill is
         * the edge, and depth is the step between paper, band and raised. */
        'flex flex-col items-stretch justify-start rounded-[1.25rem] p-5 text-left transition-colors',
        hero ? 'bg-[var(--hero)]' : 'bg-[var(--band)]',
        // The hover is a border and fill shift, never a translate: a card
        // that floats on hover contradicts the interactive rule these tokens
        // already set.
        interactive &&
            (hero
                ? 'hover:bg-[color-mix(in_srgb,var(--hero),white_8%)]'
                : 'hover:bg-[var(--band-press)]'),
        interactive &&
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
        className,
    )

    const body = (
        <>
            {/* AUTM-1426 — the header row is ALWAYS the icon's height (h-7) and the
                label is ALWAYS one line, so the value below starts at the same
                y in every tile of a row. Before this, a tile with an icon next
                to one without, or a label that wrapped, pushed its number down
                (seen on the marketing capture of Today, 2026-09-24). The label
                truncates rather than wraps; it keeps its full text in `title`. */}
            {/* AUTM-1594: the row is 20px (was 28), the label's own line, so a
                tile sits at the sheet's height; it is still the same height
                in every tile, which is what AUTM-1426 needs. */}
            <div className="mb-1.5 flex min-h-5 items-start justify-between gap-2">
                <p
                    title={label}
                    className={cn(
                        'min-w-0 truncate text-[0.9375rem] font-medium leading-5',
                        hero
                            ? // AUTM-1594: on-deep at 78%, as the sheet draws
                              // it. AUTM-1194 lifted this to full strength
                              // because 75% on the old purple fill measured
                              // 4.36:1; on brand-deep the 78% label is 9.3:1
                              // (7.9:1 on the hover fill); in dark, 82% on
                              // brand is 6.8:1.
                              'text-[var(--on-deep-muted)]'
                            : 'text-[var(--text-muted)]',
                    )}
                >
                    {label}
                </p>
                {icon ? (
                    <span
                        aria-hidden
                        className={cn(
                            'grid size-5 shrink-0 place-items-center rounded-full',
                            hero
                                ? 'bg-[var(--on-deep)]/15 text-[var(--on-deep)]'
                                : 'bg-[var(--raised)] text-[var(--accent)]',
                        )}
                    >
                        {icon}
                    </span>
                ) : null}
            </div>
            {loading || value == null ? (
                <span
                    aria-hidden
                    className={cn(
                        'block h-10 w-24 motion-skeleton rounded-md',
                        hero ? 'bg-[var(--on-deep)]/20' : 'bg-[var(--band-press)]',
                    )}
                />
            ) : (
                <p
                    className={cn(
                        // The sheet's figure: 40px Black. On the hero it is
                        // lime, which AUTM-1592 asked for (the figure and the
                        // label could not be coloured separately).
                        //
                        // AUTM-1792: sized to the tile, down to 24px, so a
                        // long figure ("$13,880" in a phone's half-width
                        // tile) fits instead of running out of it. `cqi` is
                        // the tile's width when the tile is a size container
                        // (StatsStrip makes it one); with no container it
                        // resolves against the viewport, so a tile outside a
                        // strip is 40px as before.
                        'stat-tile-figure text-[clamp(1.5rem,22cqi,2.5rem)] font-black leading-none tabular-nums whitespace-nowrap',
                        hero ? 'text-[var(--lime)]' : 'text-[var(--text-strong)]',
                    )}
                >
                    {value}
                </p>
            )}
            {caption ? (
                <p
                    className={cn(
                        'mt-1.5 text-[0.875rem] leading-snug',
                        hero ? 'text-[var(--on-deep-muted)]' : 'text-[var(--text-muted)]',
                    )}
                    /* On a hero the fill already owns the colour, and a green
                     * delta on brand purple reads as a defect rather than as
                     * good news. The rest of the caption stays muted either
                     * way — only the delta is coloured. */
                    style={trend && !hero ? { color: TREND[trend] } : undefined}
                >
                    {caption}
                </p>
            ) : null}
        </>
    )

    if (!interactive) {
        return (
            <div className={shell} data-testid={testId}>
                {body}
            </div>
        )
    }

    return (
        <button
            type="button"
            onClick={onClick}
            data-testid={testId}
            /* The figure is already read out by the text inside; naming the
             * control "Today $426" would say each of them twice. The label
             * alone names where it goes. */
            aria-label={`${label}, open details`}
            className={cn(shell, 'w-full')}
        >
            {body}
        </button>
    )
}
