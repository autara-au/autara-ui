'use client'

import * as React from 'react'
import type { ReactElement, ReactNode } from 'react'
import { cn } from '../lib/cn'
import { motionDurations, motionTiming } from '../lib/motion-tokens'

/**
 * AppTabBar: an app's top-level destinations, one tap away (AUTM-1781).
 *
 * The customer app's dock, as designed (canvas "Customer app", AppBookings and
 * AppHome; Don, 2026-10-09: "bottom navigation should be the same design like
 * that we have designed"):
 *
 *            ╭──────────────────────────────────╮
 *            │ ╭────────────────╮               │
 *            │ │ ▣  Bookings  ① │    ✉ ③    ◯   │
 *            │ ╰────────────────╯               │
 *            ╰──────────────────────────────────╯
 *
 * Two variants of one list, so the destinations, their order and their
 * counts cannot drift between a phone and a desktop:
 *
 *   - `bar` (default): the phone's dock. A pill of ink floating above the
 *     bottom edge, clear of the home indicator. Every destination is an icon,
 *     56 by 52px; the current one opens into a lime pill with its icon and its
 *     name. Hidden from `hideFrom` up (md by default), where the same items
 *     sit in the top bar.
 *   - `inline`: the same items in a row for an app bar on a tablet or a
 *     desktop, every name shown, the current one in the lime pill. At least
 *     44px tall.
 *
 * Motion. When the current destination changes, the lime pill slides from the
 * tab it left to the tab it lands on while the tabs move to their new places
 * and the new name fades in: FLIP, transform and opacity only, on the app
 * vocabulary's `--motion-tab` (450ms, the slide TabsList's pill makes) on the
 * house ease-out. It also plays when the bar is
 * mounted again by the next page (an app whose every page draws its own bar),
 * because the last positions are remembered per `label`. Under
 * `prefers-reduced-motion: reduce` nothing moves; the pill is simply there.
 *
 * Counts are a small brand disc on the tab, ringed in the colour behind it.
 * In the dock, the CURRENT tab carries its count inside the lime pill, right
 * after the name: an ink disc with a lime figure, centred, no ring and no
 * overlap, the pill growing to fit (AUTM-1802, Don 2026-10-10).
 *
 * Large text (AUTM-1816). The current tab's name in the dock never wraps.
 * When the dock cannot fit it on one line (200% text on a phone), the pill
 * shows the icon and the count only; the name stays in the accessibility tree
 * and the tab is still announced "Messages, 3 unread". Whether it fits is
 * measured, not guessed from a breakpoint: the dock's natural width with the
 * name (the same answer whether the name is drawn or not, so it cannot
 * flip-flop) against the room the dock has. Never a sideways scroll.
 * The disc is drawn, not read: `badgeLabel` is what a screen reader hears,
 * joined to the tab's name ("Messages, 3 unread"), because a bare number means
 * nothing out of sight. A tab's name is always in the accessibility tree, also
 * while only its icon is drawn. The current tab carries `aria-current="page"`.
 *
 * Links: autara-ui never imports a router. Pass `element` (an EMPTY framework
 * link, e.g. `<Link href="/account/bookings" />`) and the tab's content is
 * cloned into it, as BackButton and AccountMenu do; or pass `href` for a
 * plain anchor.
 *
 * Content under the dock needs room: give the page a bottom padding of
 * `calc(6.5rem + env(safe-area-inset-bottom))` below the breakpoint.
 */

export interface AppTabBarItem {
    /** Stable key. Also seeds the default `data-testid`. */
    key: string
    label: string
    /** The tab's glyph, about 22px. Decorative: the label names the tab. */
    icon: ReactNode
    /** Drawn while the tab is current. Defaults to `icon`. */
    activeIcon?: ReactNode
    /** A plain anchor. Ignored when `element` is supplied. */
    href?: string
    /** An EMPTY framework link; the tab's content is cloned into it. */
    element?: ReactElement
    /** The current destination. */
    active?: boolean
    /** A count on the tab. 0, null and undefined draw nothing. */
    badge?: number | null
    /**
     * How the count is spoken, e.g. "3 unread". Joined to the label in the
     * tab's accessible name. Without it the count is drawn but not heard.
     */
    badgeLabel?: string
    /** Overrides the derived `data-testid`. A shipped one is public API. */
    testId?: string
}

export interface AppTabBarProps {
    items: AppTabBarItem[]
    /** The navigation landmark's name. Also keys the remembered positions. @default 'Main' */
    label?: string
    /** @default 'bar' */
    variant?: 'bar' | 'inline'
    /**
     * `bar` only: the width from which the dock is hidden (the destinations
     * move to the top bar there). @default 'md'
     */
    hideFrom?: 'md' | 'lg' | 'never'
    className?: string
    /** Seeds each tab's `data-testid` (`${testIdPrefix}-${key}`). @default 'app-tab' */
    testIdPrefix?: string
}

const HIDE_FROM: Record<NonNullable<AppTabBarProps['hideFrom']>, string> = {
    md: 'md:hidden',
    lg: 'lg:hidden',
    never: '',
}

/** Counts past 99 read "99+", so the disc never outgrows the tab. */
function countText(n: number): string {
    return n > 99 ? '99+' : String(n)
}

/* ─── Remembered geometry, for the slide between two tabs ──────────────── */

type Box = { left: number; width: number }
type Snapshot = { active: string | null; track: Box; items: Record<string, Box> }

/**
 * The last laid-out positions of each bar, by variant and label. Module scope
 * on purpose: a page that draws its own bar unmounts the old one before the
 * new one mounts, and this is what lets the new one start where the old one
 * stopped. Viewport x, so it survives the remount; the dock does not scroll.
 */
const memory = new Map<string, Snapshot>()

function boxOf(el: Element): Box {
    const r = el.getBoundingClientRect()
    return { left: r.left, width: r.width }
}

function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** A layout effect in the browser, a no-op warning-free effect on the server. */
const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect


/**
 * Slide from the remembered layout to this one. Every tab moves from its old x
 * to its new x; the lime pill (inside the current tab) also starts at the old
 * current tab's box, scaled to its width, so it reads as one pill travelling.
 * The track (the ink behind the dock) eases between its two widths.
 */
function playSlide(list: HTMLUListElement, prev: Snapshot, next: Snapshot, activeKey: string | null) {
    if (typeof list.animate !== 'function') return
    // The same slide TabsList's pill makes: `--motion-tab` on the house ease-out.
    const timing = motionTiming('tab')

    const track = list.querySelector<HTMLElement>('[data-tab-track]')
    if (track && prev.track.width > 0 && next.track.width > 0) {
        const sx = prev.track.width / next.track.width
        const dx = prev.track.left - next.track.left
        if (Math.abs(sx - 1) > 0.002 || Math.abs(dx) > 0.5) {
            track.animate([{ transform: `translateX(${dx}px) scaleX(${sx})` }, { transform: 'none' }], timing)
        }
    }

    for (const li of Array.from(list.querySelectorAll<HTMLElement>('[data-tab-key]'))) {
        const key = li.dataset.tabKey ?? ''
        const before = prev.items[key]
        const after = next.items[key]
        if (!before || !after) continue
        const dx = before.left - after.left
        if (Math.abs(dx) > 0.5) {
            li.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }], timing)
        }
        if (key !== activeKey) continue

        const pill = li.querySelector<HTMLElement>('[data-tab-pill]')
        const from = prev.active ? prev.items[prev.active] : undefined
        if (pill && from && after.width > 0) {
            // Relative to the tab, which is itself travelling by `dx`.
            const px = from.left - after.left - dx
            const sx = from.width / after.width
            pill.animate([{ transform: `translateX(${px}px) scaleX(${sx})` }, { transform: 'none' }], timing)
        }
        const name = li.querySelector<HTMLElement>('[data-tab-name]')
        name?.animate([{ opacity: 0 }, { opacity: 1 }], {
            ...motionTiming('row'),
            delay: motionDurations.stagger,
            fill: 'backwards',
        })
    }
}

/* ─── The tab ──────────────────────────────────────────────────────────── */

function TabContent({
    item,
    variant,
    compact = false,
}: {
    item: AppTabBarItem
    variant: 'bar' | 'inline'
    /** Dock only: the current tab draws its icon and count, not its name (it does not fit). */
    compact?: boolean
}) {
    const count = typeof item.badge === 'number' && item.badge > 0 ? item.badge : 0
    const icon = item.active && item.activeIcon ? item.activeIcon : item.icon
    const dock = variant === 'bar'
    const hideName = dock && !!item.active && compact
    /* AUTM-1802: the dock's current tab carries its count inside the pill,
       after the name: an ink disc, a lime figure, no ring, in the flow. */
    const inPill = dock && !!item.active && count > 0
    /* The count disc: in the dock at the tab's top right (the design's
       position, clear of the icon); inline, on the icon's corner, so it never
       sits on the name. */
    const badge = inPill ? (
        <span
            aria-hidden
            data-tab-count="selected"
            className="relative grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-[var(--on-lime)] px-[5px] text-xs leading-none font-bold text-[var(--lime)] tabular-nums"
        >
            {countText(count)}
        </span>
    ) :
        count > 0 ? (
            <span
                aria-hidden
                data-tab-count="count"
                className={cn(
                    'absolute grid h-5 min-w-5 place-items-center rounded-full border-2 bg-[var(--brand)] px-[5px] text-xs leading-none font-bold text-[var(--on-brand)] tabular-nums',
                    dock ? 'top-1 right-1.5' : '-top-2.5 -right-3',
                    item.active
                        ? 'border-[var(--lime)]'
                        : dock
                          ? 'border-[var(--surface-inverse)]'
                          : 'border-[var(--surface)]',
                )}
            >
                {countText(count)}
            </span>
        ) : null
    return (
        <>
            {item.active ? (
                <span
                    aria-hidden
                    data-tab-pill=""
                    className="absolute inset-0 origin-left rounded-full bg-[var(--lime)]"
                />
            ) : null}
            <span
                aria-hidden
                className={cn(
                    'relative grid size-[22px] shrink-0 place-items-center [&>svg]:size-[22px]',
                    item.active
                        ? 'text-[var(--on-lime)]'
                        : dock
                          ? 'text-[var(--text-on-inverse)] opacity-[0.78] group-hover:opacity-100'
                          : 'text-[var(--text-muted)] group-hover:text-[var(--text-strong)]',
                )}
            >
                {icon}
                {dock ? null : badge}
            </span>
            <span
                data-tab-name=""
                data-name-hidden={hideName ? '' : undefined}
                className={cn(
                    'leading-none font-bold',
                    /* AUTM-1816: in the dock the name never wraps (it read
                       "Me/ssa/ge/s" at 200% text); it hides instead. */
                    dock ? 'text-base whitespace-nowrap' : 'min-w-0 text-[0.9375rem] [overflow-wrap:anywhere]',
                    /* A hidden name is sr-only and nothing else: `relative`
                       would put its 1px and a gap back in the row. */
                    item.active
                        ? hideName
                            ? 'sr-only'
                            : 'relative text-[var(--on-lime)]'
                        : dock
                          ? 'sr-only'
                          : 'relative font-medium text-[var(--text-muted)] group-hover:text-[var(--text-strong)]',
                )}
            >
                {item.label}
            </span>
            {dock ? badge : null}
        </>
    )
}

/* ─── Does the dock fit its current tab's name? (AUTM-1816) ─────────────── */

let measureCtx: CanvasRenderingContext2D | null | undefined

/** The name's width on one line, from its own computed font (also while it is hidden). */
function nameWidth(name: HTMLElement): number {
    if (measureCtx === undefined) {
        try {
            measureCtx = document.createElement('canvas').getContext('2d')
        } catch {
            measureCtx = null
        }
    }
    if (!measureCtx) return 0
    const cs = getComputedStyle(name)
    measureCtx.font = cs.font || `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    return Math.ceil(measureCtx.measureText(name.textContent ?? '').width)
}

/**
 * The dock's natural width with every name it would draw, against the room
 * it has. The same answer whether the current name is drawn or hidden: a
 * hidden one (`data-name-hidden`) is added back with its gap.
 */
function dockNeedsCompact(nav: HTMLElement, list: HTMLElement): boolean {
    const ns = getComputedStyle(nav)
    const room = nav.clientWidth - (parseFloat(ns.paddingLeft) || 0) - (parseFloat(ns.paddingRight) || 0)
    if (room <= 0) return false
    const ls = getComputedStyle(list)
    const tabs = Array.from(list.querySelectorAll<HTMLElement>(':scope > li > *'))
    let needed =
        (parseFloat(ls.paddingLeft) || 0) +
        (parseFloat(ls.paddingRight) || 0) +
        (parseFloat(ls.columnGap) || 0) * Math.max(0, tabs.length - 1)
    for (const tab of tabs) {
        needed += Math.max(tab.scrollWidth, tab.offsetWidth)
        const hidden = tab.querySelector<HTMLElement>('[data-name-hidden]')
        if (hidden) needed += nameWidth(hidden) + (parseFloat(getComputedStyle(tab).columnGap) || 0)
    }
    return needed > room + 0.5
}

export function AppTabBar({
    items,
    label = 'Main',
    variant = 'bar',
    hideFrom = 'md',
    className,
    testIdPrefix = 'app-tab',
}: AppTabBarProps) {
    const listRef = React.useRef<HTMLUListElement>(null)
    const dock = variant === 'bar'
    const activeKey = items.find((i) => i.active)?.key ?? null
    const memoryKey = `${variant}:${label}`

    /* AUTM-1816: the dock's current tab drops its name when the dock cannot
       fit it. Measured before paint, and again when the dock's room or its
       contents change size (rotation, text size, the font arriving). */
    const navRef = React.useRef<HTMLElement>(null)
    const [compact, setCompact] = React.useState(false)
    const fit = React.useCallback(() => {
        const nav = navRef.current
        const list = listRef.current
        if (!dock || !nav || !list) return
        setCompact(dockNeedsCompact(nav, list))
    }, [dock])
    const signature = items.map((i) => `${i.key}:${i.label}:${i.badge ?? 0}:${i.active ? 1 : 0}`).join('|')
    useIsoLayoutEffect(fit, [fit, signature])
    React.useEffect(() => {
        if (!dock || typeof ResizeObserver === 'undefined') return
        const ro = new ResizeObserver(() => fit())
        if (navRef.current) ro.observe(navRef.current)
        if (listRef.current) ro.observe(listRef.current)
        const fonts = typeof document !== 'undefined' ? document.fonts : undefined
        fonts?.addEventListener?.('loadingdone', fit)
        return () => {
            ro.disconnect()
            fonts?.removeEventListener?.('loadingdone', fit)
        }
    }, [dock, fit])

    /* Measure after layout, before paint: slide from the remembered layout
       when the current tab is not the one it remembers, then remember this. */
    useIsoLayoutEffect(() => {
        const list = listRef.current
        if (!list) return
        const track = list.querySelector('[data-tab-track]')
        const next: Snapshot = {
            active: activeKey,
            track: track ? boxOf(track) : { left: 0, width: 0 },
            items: {},
        }
        for (const li of Array.from(list.querySelectorAll<HTMLElement>('[data-tab-key]'))) {
            next.items[li.dataset.tabKey ?? ''] = boxOf(li)
        }
        const prev = memory.get(memoryKey)
        memory.set(memoryKey, next)
        if (!prev || prev.active === activeKey || !activeKey || prefersReducedMotion()) return
        playSlide(list, prev, next, activeKey)
    }, [activeKey, memoryKey, items.length, compact])

    const tabClass = (active: boolean) =>
        cn(
            'group relative flex items-center rounded-full outline-none',
            'focus-visible:ring-2 focus-visible:ring-offset-2',
            dock
                ? 'focus-visible:ring-[var(--lime)] focus-visible:ring-offset-[var(--surface-inverse)]'
                : 'focus-visible:ring-[var(--accent)] focus-visible:ring-offset-[var(--background)]',
            /* AUTM-1816: the dock's spacing is in px (the values it always
               had at 100%), so 200% text grows the words, not the gaps: at
               rem, two icon tabs alone took 224px of a 390 phone. */
            dock
                ? active
                    ? 'min-h-[52px] gap-[8px] pr-[20px] pl-[16px]'
                    : 'h-[52px] w-[56px] justify-center'
                : active
                  ? 'min-h-11 gap-3 pr-4 pl-3'
                  : 'min-h-11 gap-3 px-3 hover:bg-[var(--band)]',
        )

    return (
        <nav
            ref={navRef}
            aria-label={label}
            data-variant={variant}
            data-compact={dock && compact ? '' : undefined}
            className={cn(
                dock
                    ? cn(
                          'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-[12px] pb-[calc(1rem+env(safe-area-inset-bottom))]',
                          HIDE_FROM[hideFrom],
                      )
                    : 'flex items-center',
                className,
            )}
        >
            <ul
                ref={listRef}
                className={cn(
                    'relative m-0 flex max-w-full list-none items-center p-0',
                    dock ? 'pointer-events-auto gap-[4px] p-[6px]' : 'gap-1',
                )}
            >
                {dock ? (
                    <span
                        aria-hidden
                        data-tab-track=""
                        className="absolute inset-0 origin-left rounded-full bg-[var(--surface-inverse)]"
                    />
                ) : null}
                {items.map((item) => {
                    const count = typeof item.badge === 'number' && item.badge > 0 ? item.badge : 0
                    const cls = tabClass(!!item.active)
                    const props = {
                        className: cls,
                        /* The name starts with the label (voice control matches
                           it), then the count in words. */
                        'aria-label': count > 0 && item.badgeLabel ? `${item.label}, ${item.badgeLabel}` : undefined,
                        'aria-current': item.active ? ('page' as const) : undefined,
                        'data-testid': item.testId ?? `${testIdPrefix}-${item.key}`,
                        'data-active': item.active ? '' : undefined,
                    }
                    const content = <TabContent item={item} variant={variant} compact={compact} />
                    const control = item.element ? (
                        React.cloneElement(
                            item.element as ReactElement<Record<string, unknown>>,
                            {
                                ...props,
                                className: cn((item.element.props as { className?: string }).className, cls),
                            },
                            content,
                        )
                    ) : (
                        <a href={item.href} {...props}>
                            {content}
                        </a>
                    )
                    return (
                        <li key={item.key} data-tab-key={item.key} className="relative flex min-w-0 shrink">
                            {control}
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
