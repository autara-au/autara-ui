'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../lib/cn'

/**
 * Tabs — Radix tab primitive, segmented-control shape.
 *
 * ─── AUTM-1594: canvas v44 "Segmented" ──────────────────────────────────
 *
 * A band pill track; the tab you are on takes the SELECTED fill (#2e1070
 * with white in light, #8f6bff with ink in dark) and its label in Bold; the
 * rest are Medium at 72% ink. Selected is the same fill as the chosen
 * filter chip, so "selected" reads one way everywhere.
 *
 * The first build drew the active tab raised (white on band, 1.05:1), as v44
 * did. That was the step AUTM-974 (below) called invisible; the design
 * session changed it to the Selected fill on canvas v51 (2026-10-01).
 *
 * Drawn at the sheet's size (40px pills in a 48px track) with AUTM-622's
 * 44px floor kept as a hit area: each trigger carries a centred, unpainted
 * 44px pseudo-element, the pattern Switch uses. The track's 4px padding is
 * the room it needs.
 *
 * ─── AUTM-974: why the active tab is a solid fill now ───────────────────
 *
 * It used to be `bg-[var(--surface)]` with `ring-1 ring-inset` on a
 * `--surface-elevated` track. `--surface` is 1.05:1 from `--surface-elevated`,
 * so the fill was invisible and THE RING WAS THE TAB — a 1px outline was the
 * only thing telling the merchant which of Day / Today / Week / Month / List
 * they were looking at.
 *
 * That is rule 4 of the Autara Glass direction
 * (`knowledge/project_ui_direction_2026_09_01.md`), as Don extended it on
 * 2026-09-01 with a screenshot of exactly this: "no outline buttons or
 * sections, boxes as we discussed. everything should be solid." Emphasis is
 * carried by a SOLID fill — not a tint, not a ring, not an outlined box.
 *
 * Two things changed, and both follow from that one rule:
 *
 *   ACTIVE TRIGGER → `--act-fill` / `--on-act`. Rule 5 assigns purple to
 *   ACTS, and `tokens/glass.css` names "active nav" as one of them. The tab
 *   you are on is where you are acting. The fill is 9.5:1 from the track in
 *   light and 1.9:1 in dark, so it defines its own shape and has earned the
 *   right to drop the ring.
 *
 *   TRACK → keeps `--surface-elevated`, loses its border. A container whose
 *   fill is a whisper off the card and whose edge is a hairline is an
 *   outlined section box, which the same rule bans. The track is a ground,
 *   not an emphasis, so the ground is all it gets.
 *
 * ─── The focus ring, which a solid fill can quietly break ───────────────
 *
 * A solid accent fill under the house `ring-[var(--accent)]/35` focus ring is
 * how the merchant-mobile Today pass put purple on purple at 1.0:1 and lost a
 * keyboard user's place on the row they were most likely to be on. Two fixes,
 * both measured in `solid-emphasis.test.ts`:
 *
 *   - Full-strength `--accent`, not `/35`. At 35% over the track the ring
 *     measures ~1.9:1, under the 3:1 WCAG 2.4.11 asks of a focus indicator.
 *     At full strength it is 8.0:1 light / 3.4:1 dark against the track.
 *   - `ring-offset-[var(--surface-elevated)]`, not `--background`. The offset
 *     band is what separates the purple ring from the purple fill, so it has
 *     to be painted in the colour that is actually behind the tab. Pointing
 *     it at the page canvas drew a cream halo inside a dark track.
 *
 * Radius follows the ladder in `tokens/radii.css` rather than raw Tailwind
 * rungs: the track takes the shared control radius, the triggers take the
 * "control inside a control" rung one step tighter.
 *
 * Works in both themes off the token stack — there is no separate dark
 * companion to wait for any more.
 */
const Tabs = TabsPrimitive.Root

/** The selected trigger's box, relative to the list's padding edge. */
type PillBox = { x: number; y: number; w: number; h: number }

/**
 * AUTM-1792: the selected pill SLIDES to the tab you choose. Don, 2026-10-09,
 * asked for the motion of a dashboard he liked, where "the active pill slides
 * to the new item (one shared element moving, not a fade)".
 *
 * Drawn transform-only, so nothing animates a width: two round caps at the
 * pill's ends and a one-pixel bar between their centres scaled to the gap. A
 * scaled bar has no corners to distort and the caps never scale, so the pill
 * keeps its shape at every frame while all three move on one transition. The
 * trigger's own fill steps aside (`data-slide="ready"` on the list) once the
 * pill has measured, so a first paint, a server render and a reduced-motion
 * user all see the plain selected fill and never an empty track.
 */
function SlidingPill() {
    // The pill finds its list from its own host span: a child's layout effect
    // runs before the parent's ref is attached, so a ref passed down from
    // TabsList would still be null here on the first commit.
    const hostRef = React.useRef<HTMLSpanElement | null>(null)
    const [box, setBox] = React.useState<PillBox | null>(null)
    const [moving, setMoving] = React.useState(false)

    React.useLayoutEffect(() => {
        const list = hostRef.current?.parentElement
        if (!list) return
        const measure = () => {
            const active = list.querySelector<HTMLElement>('[role="tab"][data-state="active"]')
            if (!active || active.offsetWidth === 0) {
                setBox(null)
                return
            }
            setBox((prev) => {
                const next = {
                    x: active.offsetLeft,
                    y: active.offsetTop,
                    w: active.offsetWidth,
                    h: active.offsetHeight,
                }
                return prev &&
                    prev.x === next.x &&
                    prev.y === next.y &&
                    prev.w === next.w &&
                    prev.h === next.h
                    ? prev
                    : next
            })
        }
        measure()
        const mo = new MutationObserver(measure)
        mo.observe(list, { subtree: true, attributes: true, attributeFilter: ['data-state'] })
        const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
        ro?.observe(list)
        list.querySelectorAll('[role="tab"]').forEach((t) => ro?.observe(t))
        return () => {
            mo.disconnect()
            ro?.disconnect()
        }
    }, [])

    // Place the pill without a transition first, then let it move: a pill
    // that slid in from the corner on first paint would be motion about
    // nothing.
    React.useEffect(() => {
        if (!box || moving) return
        const id = requestAnimationFrame(() => setMoving(true))
        return () => cancelAnimationFrame(id)
    }, [box, moving])

    React.useEffect(() => {
        const list = hostRef.current?.parentElement
        if (!list) return
        if (box) list.setAttribute('data-slide', 'ready')
        else list.removeAttribute('data-slide')
    }, [box])

    const part = cn(
        'absolute left-0 top-0 bg-[var(--selected)]',
        moving &&
            'transition-transform duration-[var(--motion-tab)] ease-[var(--motion-ease-out)] motion-reduce:transition-none'
    )
    return (
        <span ref={hostRef} aria-hidden data-tabs-pill="" className="pointer-events-none absolute inset-0">
            {box ? (
                <>
                    <span
                        className={cn(part, 'rounded-full')}
                        style={{ width: box.h, height: box.h, transform: `translate(${box.x}px, ${box.y}px)` }}
                    />
                    <span
                        className={cn(part, 'origin-left')}
                        style={{
                            width: 1,
                            height: box.h,
                            transform: `translate(${box.x + box.h / 2}px, ${box.y}px) scaleX(${Math.max(box.w - box.h, 0)})`,
                        }}
                    />
                    <span
                        className={cn(part, 'rounded-full')}
                        style={{
                            width: box.h,
                            height: box.h,
                            transform: `translate(${box.x + box.w - box.h}px, ${box.y}px)`,
                        }}
                    />
                </>
            ) : null}
        </span>
    )
}

export interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
    /**
     * AUTM-1792: the selected pill slides to the chosen tab instead of
     * jumping. Off by default so no consumer changes until it asks.
     */
    slide?: boolean
    /**
     * `primary` (default): the selected tab is the Selected fill (purple).
     * `secondary` (Don, 2026-11-07, the merchant app's quiet pass): a paper
     * pill and an ink label on the band track, for a switch that sits under
     * a primary one (Bookings' Upcoming / Past under Day / Week / Month /
     * List), so a screen carries one purple selection, not two.
     */
    tone?: 'primary' | 'secondary'
}

const TabsList = React.forwardRef<React.ComponentRef<typeof TabsPrimitive.List>, TabsListProps>(
    ({ className, slide = false, tone = 'primary', children, ...props }, ref) => {
        return (
            <TabsPrimitive.List
                ref={ref}
                className={cn(
                    // `min-h-10`, not `h-10` — at 200% text scale a fixed height
                    // clips the labels instead of growing with them (AUTM-915).
                    /* AUTM-622 — 3.25rem, not 2.5rem. The list is the trigger's 44px
                     * floor plus its own 0.25rem padding on each side. Sized in rem
                     * and as a MINIMUM for the same reason the old value was: at 200%
                     * text scale a fixed height clips the label. */
                    'inline-flex min-h-12 items-center justify-center gap-1 rounded-full bg-[var(--band)] p-1 text-[var(--text-muted)]',
                    slide && 'relative',
                    // The pill and the trigger read --selected / --on-selected,
                    // so the tone is those two, scoped to this list.
                    tone === 'secondary' && '[--selected:var(--selected-quiet)] [--on-selected:var(--text-strong)]',
                    className
                )}
                data-tone={tone}
                {...props}
            >
                {slide ? <SlidingPill /> : null}
                {children}
            </TabsPrimitive.List>
        )
    }
)
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
    React.ComponentRef<typeof TabsPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
            /* AUTM-622 — was px-3 py-1.5 with no minimum, which rendered at
             * 32px on every width, not just phones: the Day/Today/Week/Month
             * switcher measured 32px tall on phone, tablet AND desktop. The
             * 44px floor is a cross-stack rule, and a segmented control the
             * merchant hits constantly is the worst place to be under it. */
            'relative inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-[0.9375rem] font-medium transition-colors',
            "before:absolute before:left-1/2 before:top-1/2 before:h-11 before:w-full before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
            'text-[var(--text-muted)] hover:text-[var(--text-strong)]',
            // See the focus-ring note in the header — full-strength accent,
            // and the offset band painted in the track that is really behind
            // it, because that band is what keeps a purple ring off a purple
            // fill.
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--band)]',
            'disabled:pointer-events-none disabled:opacity-50',
            'data-[state=active]:bg-[var(--selected)] data-[state=active]:font-bold data-[state=active]:text-[var(--on-selected)]',
            // AUTM-1792: under a sliding pill the trigger's own fill steps
            // aside, so the pill is what is seen moving.
            'in-data-[slide=ready]:data-[state=active]:bg-transparent',
            className
        )}
        {...props}
    />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
    React.ComponentRef<typeof TabsPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Content
        ref={ref}
        className={cn(
            'mt-3 text-[var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
            className
        )}
        {...props}
    />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
