'use client'

import {
    createElement,
    forwardRef,
    useCallback,
    useEffect,
    useId,
    useRef,
    type FocusEvent as ReactFocusEvent,
    type HTMLAttributes,
    type KeyboardEvent as ReactKeyboardEvent,
    type ReactNode,
    type Ref,
} from 'react'
import { cn } from '../lib/cn'
import { motionDurations, motionEasings } from '../lib/motion-tokens'
import { IconButton } from './IconButton'
import { useScrollEdges } from './ScrollArea'

/**
 * ChipRow: one line of chips that scrolls sideways, with no scrollbar
 * (AUTM-1756 follow-up).
 *
 * Don, 2026-10-15, of the chat's quick replies under a thick lavender bar:
 * "instead of scrollbar can add an chevron arrow in the ending, to move it.
 * also dragable, because scrollbar is bit ugly." So a chip row never draws a
 * bar (the vertical brand bars of AUTM-1756 stay where they are), and says
 * "there is more" three ways instead:
 *
 *   - the edge that has more fades out (`.scroll-fade`, `useScrollEdges`);
 *   - a round chevron (IconButton, 44px, 48px to a finger) sits on that fade:
 *     the end one when the row overflows, the start one once it has moved.
 *     A press moves about one view of chips, to the first chip the fade was
 *     cutting, on the house ease-out (`--motion-tab`, 450ms), instantly under
 *     reduced motion. Each is hidden when there is nothing more that way;
 *   - a mouse or a pen drags the row (pointer events, 6px before it counts as
 *     a drag, so a drag never fires a chip's click). A finger keeps the
 *     browser's own swipe and its momentum.
 *
 * The chevrons are a pointer affordance: `arrows="auto"` (default) shows them
 * wherever a fine pointer exists (a mouse, a trackpad, a pen; an iPad with a
 * trackpad counts), and a finger-only phone keeps the fade and the swipe, as
 * LinkedIn's and Shopee's reply chips do. `arrows="always"` shows them to a
 * finger as well.
 *
 * Keyboard: every chip stays in the tab order (the chevrons are out of it:
 * Tab already reaches every chip), and a chip that takes focus from the
 * keyboard is brought into view clear of the fade, by the row alone (the page
 * never jumps). With `role="listbox"`, `"radiogroup"` or `"tablist"` the
 * arrow keys move between chips, Home and End jump; a radio is also chosen,
 * as a native radio group does. A child that handles its own arrow keys
 * (ChoiceChips, DatePicker) calls `preventDefault()` and the row stands back.
 *
 * References (Mobbin, 2026-10-15): Tripadvisor's and DoorDash's web chip rows
 * end in a round arrow disc over the cut (steal); LinkedIn and Shopee reply
 * chips swipe on a phone with no control (steal, for a finger); Fresha shows
 * three time chips and a More button rather than scrolling (avoid here: a
 * quick reply must be one tap).
 *
 *   <ChipRow label="Quick replies" nextLabel="Show more replies" className="gap-2">
 *     {replies.map((r) => <Button key={r.id} size="sm" variant="quiet">{r.label}</Button>)}
 *   </ChipRow>
 *
 * `className` styles the scrolling row itself (gap, padding), `rootClassName`
 * the box around it (margins, flex sizing). The ref is the scrolling row.
 * Left to right only, like every Autara surface.
 */

export type ChipRowRole = 'group' | 'list' | 'listbox' | 'radiogroup' | 'tablist'
export type ChipRowArrows = 'auto' | 'always' | 'never'

export interface ChipRowProps extends Omit<HTMLAttributes<HTMLElement>, 'role'> {
    /** The row's accessible name ("Quick replies", "Filter the Inbox"). */
    label?: string
    /**
     * `group` (default), `list` (implied by `as="ul"`), or a composite whose
     * chips the arrow keys move between: `listbox`, `radiogroup`, `tablist`.
     */
    role?: ChipRowRole
    /** The scrolling element. `ul` / `ol` for a row of links in `li`s. Default `div`. */
    as?: 'div' | 'ul' | 'ol'
    /** The chevrons: `auto` (default) where a fine pointer exists, `always`, or `never`. */
    arrows?: ChipRowArrows
    /** The end chevron's accessible name. Default "Scroll right". */
    nextLabel?: string
    /** The start chevron's accessible name. Default "Scroll left". */
    previousLabel?: string
    /** `data-testid` on the end chevron. */
    nextTestId?: string
    /** `data-testid` on the start chevron. */
    previousTestId?: string
    /** Fade the edge that has more. Default true. */
    fade?: boolean
    /** Drag with a mouse or a pen. Default true. A finger always swipes. */
    drag?: boolean
    /** Classes for the box around the row (margins, `flex-1`, `min-w-0`). */
    rootClassName?: string
    children?: ReactNode
}

/** How far a mouse or a pen moves, in CSS px, before a press becomes a drag. */
export const CHIP_ROW_DRAG_THRESHOLD = 6

/** What counts as a chip: the outermost of these inside the row. */
const ITEM =
    'button, a[href], [role="radio"], [role="option"], [role="tab"], [data-chip-row-item]'

/** The chips the arrow keys move between, in a composite row. */
const NAV_ITEM = '[role="radio"], [role="option"], [role="tab"]'

/** The chip that is the current choice, brought into view on arrival. */
const CHOSEN =
    '[aria-checked="true"], [aria-selected="true"], [aria-pressed="true"], [aria-current]:not([aria-current="false"])'

const NAV_ROLES = new Set<ChipRowRole>(['listbox', 'radiogroup', 'tablist'])

function chips(row: HTMLElement): HTMLElement[] {
    const all = Array.from(row.querySelectorAll<HTMLElement>(ITEM))
    return all.filter((el) => !all.some((other) => other !== el && other.contains(el)))
}

function navChips(row: HTMLElement): HTMLElement[] {
    return Array.from(row.querySelectorAll<HTMLElement>(NAV_ITEM)).filter(
        (el) =>
            !(el as HTMLButtonElement).disabled &&
            el.getAttribute('aria-disabled') !== 'true' &&
            el.closest('[hidden]') === null
    )
}

/** The room kept clear at each end for the fade and the chevron, in px. */
function edgeOf(row: HTMLElement): number {
    if (typeof getComputedStyle === 'undefined') return 0
    const value = parseFloat(getComputedStyle(row).scrollPaddingInlineStart)
    return Number.isFinite(value) ? value : 0
}

/** A chip's start and end along the row's content, in px. */
function spanOf(row: HTMLElement, chip: HTMLElement): { start: number; end: number } {
    const box = row.getBoundingClientRect()
    const r = chip.getBoundingClientRect()
    const start = r.left - box.left - row.clientLeft + row.scrollLeft
    return { start, end: start + r.width }
}

/**
 * Where a press of a chevron takes the row: the chip the end fade was
 * cutting becomes the first whole chip after the start fade (and the mirror
 * for the start chevron), so a press moves about one view of chips and never
 * leaves a chip cut at the edge it came from. A chip wider than the view, or
 * no chips, falls back to a view less the two edges.
 */
export function chipRowPageTarget(row: HTMLElement, direction: 1 | -1): number {
    const view = row.clientWidth
    const max = Math.max(0, row.scrollWidth - view)
    const left = row.scrollLeft
    const edge = Math.min(edgeOf(row), view / 3)
    const stride = Math.max(view - 2 * edge, view / 3)
    const items = chips(row).map((c) => spanOf(row, c))
    let target: number
    if (direction === 1) {
        const limit = left + view - edge
        const cut = items.find((s) => s.end > limit + 1)
        target = cut ? cut.start - edge : left + stride
        if (target <= left + 8) target = left + stride
    } else {
        const limit = left + edge
        const cut = [...items].reverse().find((s) => s.start < limit - 1)
        target = cut ? cut.end - (view - edge) : left - stride
        if (target >= left - 8) target = left - stride
    }
    return Math.round(Math.min(max, Math.max(0, target)))
}

/** A CSS cubic-bezier as a function of progress, for a scroll driven from JS. */
function cubicBezier(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
    const cx = 3 * x1
    const bx = 3 * (x2 - x1) - cx
    const ax = 1 - cx - bx
    const cy = 3 * y1
    const by = 3 * (y2 - y1) - cy
    const ay = 1 - cy - by
    const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
    const sampleY = (t: number) => ((ay * t + by) * t + cy) * t
    const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx
    return (x) => {
        if (x <= 0) return 0
        if (x >= 1) return 1
        let t = x
        for (let i = 0; i < 8; i++) {
            const error = sampleX(t) - x
            if (Math.abs(error) < 1e-5) return sampleY(t)
            const slope = slopeX(t)
            if (Math.abs(slope) < 1e-6) break
            t -= error / slope
        }
        let lo = 0
        let hi = 1
        t = x
        for (let i = 0; i < 30; i++) {
            const v = sampleX(t)
            if (Math.abs(v - x) < 1e-5) break
            if (v < x) lo = t
            else hi = t
            t = (lo + hi) / 2
        }
        return sampleY(t)
    }
}

/* Built on first use: nothing in a shipped module may run at import (AUTM-1688). */
let easeOutCurve: ((x: number) => number) | null = null
function easeOut(x: number): number {
    easeOutCurve ??= cubicBezier(...motionEasings.out)
    return easeOutCurve(x)
}

function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

function assignRef<T>(ref: Ref<T> | undefined, value: T) {
    if (typeof ref === 'function') ref(value)
    else if (ref) (ref as { current: T }).current = value
}

const Chevron = ({ direction }: { direction: 'previous' | 'next' }) => (
    // Solar's AltArrowLeft / AltArrowRight (Linear), inlined as BackButton's is.
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
            d={direction === 'previous' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

export const ChipRow = forwardRef<HTMLElement, ChipRowProps>(function ChipRow(
    {
        label,
        role,
        as = 'div',
        arrows = 'auto',
        nextLabel = 'Scroll right',
        previousLabel = 'Scroll left',
        nextTestId,
        previousTestId,
        fade = true,
        drag = true,
        rootClassName,
        className,
        id,
        onKeyDown,
        onFocus,
        children,
        ...rest
    },
    forwardedRef
) {
    const autoId = useId()
    const rowId = id ?? `chip-row-${autoId.replace(/:/g, '')}`
    const edges = useScrollEdges('x')
    const rowRef = useRef<HTMLElement | null>(null)
    const previousRef = useRef<HTMLButtonElement | null>(null)
    const nextRef = useRef<HTMLButtonElement | null>(null)
    const glide = useRef<{ frame: number; snap: string; behavior: string } | null>(null)

    const setRow = useCallback(
        (node: HTMLElement | null) => {
            rowRef.current = node
            edges.ref(node)
            assignRef(forwardedRef, node)
        },
        // edges.ref is stable (useCallback with no deps).
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [forwardedRef]
    )

    const stopGlide = useCallback(() => {
        const el = rowRef.current
        const g = glide.current
        if (!g) return
        cancelAnimationFrame(g.frame)
        if (el) {
            el.style.scrollSnapType = g.snap
            el.style.scrollBehavior = g.behavior
        }
        glide.current = null
    }, [])

    /**
     * Move the row to `to` on the house ease-out. Snap is held off while it
     * moves (a snapping row re-snaps every frame of a scroll set from script)
     * and put back at the end, where the target already sits on a chip.
     */
    const glideTo = useCallback(
        (to: number) => {
            const el = rowRef.current
            if (!el) return
            stopGlide()
            const from = el.scrollLeft
            if (Math.abs(to - from) < 1) return
            if (prefersReducedMotion() || typeof requestAnimationFrame === 'undefined') {
                el.scrollLeft = to
                return
            }
            const state = {
                frame: 0,
                snap: el.style.scrollSnapType,
                behavior: el.style.scrollBehavior,
            }
            glide.current = state
            el.style.scrollSnapType = 'none'
            el.style.scrollBehavior = 'auto'
            const duration = motionDurations.tab
            let began: number | null = null
            const step = (now: number) => {
                if (glide.current !== state) return
                if (began === null) began = now
                const progress = Math.min(1, (now - began) / duration)
                el.scrollLeft = from + (to - from) * easeOut(progress)
                if (progress < 1) state.frame = requestAnimationFrame(step)
                else stopGlide()
            }
            state.frame = requestAnimationFrame(step)
        },
        [stopGlide]
    )

    const page = useCallback(
        (direction: 1 | -1) => {
            const el = rowRef.current
            if (el) glideTo(chipRowPageTarget(el, direction))
        },
        [glideTo]
    )

    /** Bring a chip into view clear of the fades, scrolling the row alone. */
    const reveal = useCallback((chip: HTMLElement) => {
        const el = rowRef.current
        if (!el || chip === el) return
        const edge = Math.min(edgeOf(el), el.clientWidth / 3)
        const { start, end } = spanOf(el, chip)
        const left = el.scrollLeft
        if (start < left + edge) el.scrollLeft = Math.max(0, start - edge)
        else if (end > left + el.clientWidth - edge) el.scrollLeft = end - el.clientWidth + edge
    }, [])

    /* The chosen chip (a checked radio, a selected tab or option, a pressed
       toggle, the current link) is in view on arrival, clear of the fades,
       rather than cut at the edge or past it. Once, on mount: after that the
       row is where the person left it. */
    useEffect(() => {
        const el = rowRef.current
        if (!el || typeof requestAnimationFrame === 'undefined') return
        const frame = requestAnimationFrame(() => {
            const chosen = el.querySelector<HTMLElement>(CHOSEN)
            if (chosen) reveal(chosen)
        })
        return () => cancelAnimationFrame(frame)
    }, [reveal])

    // Any hand on the row stops a glide in flight.
    useEffect(() => {
        const el = rowRef.current
        if (!el) return
        el.addEventListener('wheel', stopGlide, { passive: true })
        el.addEventListener('touchstart', stopGlide, { passive: true })
        return () => {
            el.removeEventListener('wheel', stopGlide)
            el.removeEventListener('touchstart', stopGlide)
            stopGlide()
        }
    }, [stopGlide])

    /**
     * Mouse and pen drag. Nothing happens on press, so a click is a click;
     * past the threshold the row captures the pointer and follows it, and the
     * click that the release would fire is swallowed. Touch is left alone:
     * the browser's swipe has momentum this would not.
     */
    useEffect(() => {
        const el = rowRef.current
        if (!el || !drag) return
        let press: { id: number; x: number; left: number; moved: boolean; snap: string } | null = null
        let swallow = false
        let swallowTimer: ReturnType<typeof setTimeout> | undefined
        const down = (e: PointerEvent) => {
            if (e.pointerType === 'touch' || e.button !== 0) return
            if (el.scrollWidth <= el.clientWidth + 1) return
            stopGlide()
            press = { id: e.pointerId, x: e.clientX, left: el.scrollLeft, moved: false, snap: el.style.scrollSnapType }
        }
        const move = (e: PointerEvent) => {
            if (!press || e.pointerId !== press.id) return
            const dx = e.clientX - press.x
            if (!press.moved) {
                if (Math.abs(dx) < CHIP_ROW_DRAG_THRESHOLD) return
                press.moved = true
                try {
                    el.setPointerCapture(e.pointerId)
                } catch {
                    // A synthetic pointer has nothing to capture; the drag still follows it.
                }
                el.style.scrollSnapType = 'none'
                el.setAttribute('data-dragging', '')
            }
            e.preventDefault()
            el.scrollLeft = press.left - dx
        }
        const end = (e: PointerEvent) => {
            if (!press || e.pointerId !== press.id) return
            if (press.moved) {
                try {
                    if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId)
                } catch {
                    // Already released.
                }
                el.style.scrollSnapType = press.snap
                el.removeAttribute('data-dragging')
                // The click this release fires lands in the same task; a
                // release that fires none must not eat the next real click.
                swallow = e.type === 'pointerup'
                clearTimeout(swallowTimer)
                swallowTimer = setTimeout(() => {
                    swallow = false
                }, 0)
            }
            press = null
        }
        const click = (e: MouseEvent) => {
            if (!swallow) return
            swallow = false
            e.preventDefault()
            e.stopPropagation()
        }
        // A link chip would start the browser's own drag of the link.
        const dragstart = (e: DragEvent) => {
            if (press) e.preventDefault()
        }
        el.addEventListener('pointerdown', down)
        el.addEventListener('pointermove', move)
        el.addEventListener('pointerup', end)
        el.addEventListener('pointercancel', end)
        el.addEventListener('click', click, true)
        el.addEventListener('dragstart', dragstart)
        return () => {
            clearTimeout(swallowTimer)
            el.removeEventListener('pointerdown', down)
            el.removeEventListener('pointermove', move)
            el.removeEventListener('pointerup', end)
            el.removeEventListener('pointercancel', end)
            el.removeEventListener('click', click, true)
            el.removeEventListener('dragstart', dragstart)
            el.removeAttribute('data-dragging')
        }
    }, [drag, stopGlide])

    /* A chevron that hides while it holds focus (it was pressed to the end,
       or a screen reader activated it) hands focus to the chip it uncovered,
       so focus is never dropped on the page. */
    useEffect(() => {
        const el = rowRef.current
        if (!el || typeof document === 'undefined') return
        const active = document.activeElement
        const takeable = () => chips(el).filter((c) => c.tabIndex >= 0)
        if (!edges.end && active && active === nextRef.current) {
            const list = takeable()
            list[list.length - 1]?.focus({ preventScroll: true })
        } else if (!edges.start && active && active === previousRef.current) {
            takeable()[0]?.focus({ preventScroll: true })
        }
    }, [edges.start, edges.end])

    const resolvedRole: ChipRowRole | undefined = role ?? (as === 'div' ? 'group' : undefined)
    const navigable = resolvedRole !== undefined && NAV_ROLES.has(resolvedRole)

    function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
        onKeyDown?.(event)
        const el = rowRef.current
        if (event.defaultPrevented || !navigable || !el) return
        const items = navChips(el)
        const at = items.indexOf(document.activeElement as HTMLElement)
        if (at === -1 || items.length === 0) return
        const radio = resolvedRole === 'radiogroup'
        const last = items.length - 1
        let next: number
        switch (event.key) {
            case 'ArrowRight':
                next = radio ? (at + 1) % items.length : Math.min(last, at + 1)
                break
            case 'ArrowLeft':
                next = radio ? (at - 1 + items.length) % items.length : Math.max(0, at - 1)
                break
            case 'ArrowDown':
                if (!radio) return
                next = (at + 1) % items.length
                break
            case 'ArrowUp':
                if (!radio) return
                next = (at - 1 + items.length) % items.length
                break
            case 'Home':
                next = 0
                break
            case 'End':
                next = last
                break
            default:
                return
        }
        event.preventDefault()
        const chip = items[next]
        chip.focus({ preventScroll: true })
        reveal(chip)
        // A radio is chosen as focus reaches it, as a native radio group does.
        if (radio && chip.getAttribute('aria-checked') !== 'true') chip.click()
    }

    function handleFocus(event: ReactFocusEvent<HTMLElement>) {
        onFocus?.(event)
        const target = event.target as HTMLElement
        let keyboard = true
        try {
            keyboard = target.matches(':focus-visible')
        } catch {
            // An engine without :focus-visible: treat every focus as keyboard.
        }
        // A chip pressed with the mouse is already where the pointer is; only
        // keyboard focus moves the row, so a press never shifts it underfoot.
        if (keyboard) reveal(target)
    }

    const row = createElement(
        as,
        {
            ...rest,
            ref: setRow,
            id: rowId,
            role: resolvedRole === 'list' && as !== 'div' ? undefined : resolvedRole,
            'aria-label': label ?? rest['aria-label'],
            'aria-orientation': resolvedRole === 'listbox' ? 'horizontal' : undefined,
            'data-axis': 'x',
            'data-overflow': edges.start || edges.end ? '' : undefined,
            'data-drag': drag ? '' : undefined,
            'data-fade-start': fade && edges.start ? '' : undefined,
            'data-fade-end': fade && edges.end ? '' : undefined,
            onKeyDown: handleKeyDown,
            onFocus: handleFocus,
            className: cn('chip-row__scroller', fade && 'scroll-fade', className),
        },
        children
    )

    const arrow = (side: 'previous' | 'next') => {
        const more = side === 'next' ? edges.end : edges.start
        return (
            <div className="chip-row__arrow" data-side={side} data-hidden={more ? undefined : ''}>
                <IconButton
                    ref={side === 'next' ? nextRef : previousRef}
                    icon={<Chevron direction={side} />}
                    label={side === 'next' ? nextLabel : previousLabel}
                    // Tab already walks every chip; the chevrons are for a pointer.
                    tabIndex={-1}
                    aria-controls={rowId}
                    data-testid={side === 'next' ? nextTestId : previousTestId}
                    onClick={() => page(side === 'next' ? 1 : -1)}
                />
            </div>
        )
    }

    return (
        <div className={cn('chip-row', rootClassName)} data-arrows={arrows}>
            {arrows === 'never' ? null : arrow('previous')}
            {row}
            {arrows === 'never' ? null : arrow('next')}
        </div>
    )
})

ChipRow.displayName = 'ChipRow'
