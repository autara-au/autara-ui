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
    /** Pre-formatted. `null`/`undefined` renders the skeleton, not a zero. */
    value?: string | number | null
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
}: StatTileProps) {
    const interactive = typeof onClick === 'function'
    const shell = cn(
        /* AUTM-1426 — the same column layout whether the shell is a <div>
         * or a <button>: a button centres its content vertically by default,
         * so an interactive tile beside a static one sat its number 15px
         * lower (Today beside Pending payouts, 2026-09-24). */
        'flex flex-col items-stretch justify-start rounded-[14px] px-5 py-[18px] text-left transition-colors',
        hero
            ? // No border: the fill IS the edge. A hairline on a filled
              // tile reads as a seam against its own colour.
              'bg-[var(--accent-fill)]'
            : 'border border-[var(--border-subtle)] bg-[var(--surface)]',
        // The hover is a border and fill shift, never a translate: a card
        // that floats on hover contradicts the interactive rule these tokens
        // already set.
        interactive &&
            (hero
                ? 'hover:bg-[var(--accent-fill-hover)]'
                : 'hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)]'),
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
            <div className="mb-3 flex min-h-7 items-start justify-between gap-2">
                <p
                    title={label}
                    className={cn(
                        'min-w-0 truncate text-[0.8125rem] font-medium leading-7',
                        hero
                            ? // AUTM-1194 — full on-accent. At 75% the label
                              // measured 4.36:1 on the dark accent fill (and
                              // about 3.6:1 on its hover fill), under the 4.5:1
                              // floor for text this size. The value still
                              // out-shouts it through size and weight.
                              'text-[var(--on-accent)]'
                            : 'text-[var(--text-muted)]',
                    )}
                >
                    {label}
                </p>
                {icon ? (
                    <span
                        aria-hidden
                        className={cn(
                            'grid h-7 w-7 shrink-0 place-items-center rounded-lg',
                            hero
                                ? 'bg-[var(--on-accent)]/15 text-[var(--on-accent)]'
                                : 'bg-[var(--accent-tint)] text-[var(--accent)]',
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
                        'block h-8 w-24 animate-pulse rounded-md',
                        hero
                            ? 'bg-[var(--on-accent)]/20'
                            : 'bg-[var(--surface-elevated)]',
                    )}
                />
            ) : (
                <p
                    className={cn(
                        'text-[2rem] font-bold leading-none tabular-nums tracking-[-0.02em]',
                        hero ? 'text-[var(--on-accent)]' : 'text-[var(--text-strong)]',
                    )}
                >
                    {value}
                </p>
            )}
            {caption ? (
                <p
                    className={cn(
                        'mt-2 text-[0.875rem]',
                        // AUTM-1194 — full on-accent, as the label above.
                        hero ? 'text-[var(--on-accent)]' : 'text-[var(--text-muted)]',
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
