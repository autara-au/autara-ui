'use client'

import {
    createElement,
    forwardRef,
    useCallback,
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type HTMLAttributes,
    type Ref,
} from 'react'
import { cn } from '../lib/cn'

/**
 * ScrollArea — a region that scrolls on its own (AUTM-1756).
 *
 * Don, 2026-10-15: "it's bad when I see the scroll bar, make it brand native
 * and optimize the scroll views throughout the app". The scrollbar itself is
 * styled for every element in the base layer (utilities/scrollbars.css). This
 * is the rest of a good scroll view, for the panels, drawers, list panes,
 * chat threads and chip rows that scroll inside a page:
 *
 *   - `overscroll-behavior: contain`: reaching the end never scrolls the
 *     page behind it or bounces the shell (`.scroll-area`).
 *   - `stickyOffset`: the height of a sticky header inside it, as
 *     `scroll-padding-top`, so a row brought into view by Tab or by
 *     `scrollIntoView` lands under the header, not behind it.
 *   - `fade` (default on for `orientation="horizontal"`): the edge that has
 *     more to show fades out, so a chip row says "there is more" instead of
 *     cutting a chip mid-word. A mask, so it works on any ground.
 *   - `data-scrolling` while it scrolls, which shows the thumb even when the
 *     pointer is elsewhere (keyboard, a programmatic scroll).
 *   - Keyboard: a region that overflows and holds nothing focusable takes
 *     `tabIndex={0}` (and `role="region"` with `label`) so arrow keys and
 *     Page Down scroll it; one that holds a link or a button does not, since
 *     Tab already moves through it and scrolls it (axe
 *     scrollable-region-focusable). The focus ring is inset, so a parent's
 *     overflow cannot clip it.
 *
 * One page scroll beats two. Use this where a region must scroll on its own
 * (a split pane's list beside a record, a drawer, a thread); a screen whose
 * page already scrolls needs no inner scroller at all.
 *
 *   <ScrollArea label="Customers" className="min-h-0 flex-1">{rows}</ScrollArea>
 *   <ScrollArea orientation="horizontal" label="Filter">{chips}</ScrollArea>
 */

export type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both'

type ScrollAreaElement = 'div' | 'section' | 'nav' | 'aside' | 'ul' | 'ol'

export interface ScrollAreaProps extends HTMLAttributes<HTMLElement> {
    /** The axis that scrolls. Default `vertical`. */
    orientation?: ScrollAreaOrientation
    /**
     * Accessible name. Becomes `aria-label`, with `role="region"` when the
     * area takes focus itself (nothing focusable inside).
     */
    label?: string
    /** Fade the edge that has more to show. Default: on for `horizontal`. */
    fade?: boolean
    /** A sticky header's height inside the area (any CSS length), as scroll padding. */
    stickyOffset?: string
    /** The element to render. Default `div`. */
    as?: ScrollAreaElement
}

const FOCUSABLE = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'summary',
    'iframe',
    'audio[controls]',
    'video[controls]',
    '[contenteditable]:not([contenteditable="false"])',
    '[tabindex]:not([tabindex="-1"])',
].join(',')

/** How long after the last scroll event the area still counts as scrolling. */
const SCROLL_IDLE_MS = 900

export interface ScrollEdges {
    /** There is more before what is shown (left, or above). */
    start: boolean
    /** There is more after what is shown (right, or below). */
    end: boolean
}

/**
 * Whether a scroller has more to show before or after what is visible, kept
 * current on scroll, on resize (text size, a split pane moving) and when its
 * content changes. rAF-batched, so a resize never loops the observer.
 *
 * Returns a callback ref for the host, so it follows a host that mounts later.
 * `inner` names the scroller inside the host when another component owns it
 * (FilterChipRow's tablist): `useScrollEdges('x', '[role="tablist"]')`.
 */
export function useScrollEdges(
    axis: 'x' | 'y' = 'x',
    inner?: string
): ScrollEdges & { ref: (node: HTMLElement | null) => void } {
    const [host, setHost] = useState<HTMLElement | null>(null)
    const [edges, setEdges] = useState<ScrollEdges>({ start: false, end: false })
    const ref = useCallback((node: HTMLElement | null) => setHost(node), [])
    useEffect(() => {
        const el = inner ? host?.querySelector<HTMLElement>(inner) : host
        if (!el) return
        let frame = 0
        const read = () => {
            const pos = axis === 'x' ? Math.abs(el.scrollLeft) : el.scrollTop
            const view = axis === 'x' ? el.clientWidth : el.clientHeight
            const size = axis === 'x' ? el.scrollWidth : el.scrollHeight
            const start = pos > 1
            const end = pos + view < size - 1
            setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
        }
        const schedule = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(read)
        }
        read()
        el.addEventListener('scroll', schedule, { passive: true })
        const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
        ro?.observe(el)
        const mo = typeof MutationObserver === 'undefined' ? null : new MutationObserver(schedule)
        mo?.observe(el, { childList: true, subtree: true, characterData: true })
        return () => {
            cancelAnimationFrame(frame)
            el.removeEventListener('scroll', schedule)
            ro?.disconnect()
            mo?.disconnect()
        }
    }, [host, inner, axis])
    return { ref, ...edges }
}

function assignRef<T>(ref: Ref<T> | undefined, value: T) {
    if (typeof ref === 'function') ref(value)
    else if (ref) (ref as { current: T }).current = value
}

export const ScrollArea = forwardRef<HTMLElement, ScrollAreaProps>(function ScrollArea(
    {
        orientation = 'vertical',
        label,
        fade,
        stickyOffset,
        as = 'div',
        className,
        style,
        tabIndex,
        role,
        children,
        ...rest
    },
    forwardedRef
) {
    const axis = orientation === 'horizontal' ? 'x' : 'y'
    const showFade = fade ?? orientation === 'horizontal'
    const edges = useScrollEdges(axis)
    const nodeRef = useRef<HTMLElement | null>(null)
    const [needsFocus, setNeedsFocus] = useState(false)

    const setRefs = useCallback(
        (node: HTMLElement | null) => {
            nodeRef.current = node
            edges.ref(node)
            assignRef(forwardedRef, node)
        },
        // edges.ref is stable (useCallback with no deps).
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [forwardedRef]
    )

    // Focusable only when it overflows and nothing inside can take focus.
    useEffect(() => {
        const el = nodeRef.current
        if (!el || tabIndex !== undefined) return
        let frame = 0
        const check = () => {
            const overflows =
                el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1
            const next = overflows && el.querySelector(FOCUSABLE) === null
            setNeedsFocus((prev) => (prev === next ? prev : next))
        }
        const schedule = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(check)
        }
        check()
        const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
        ro?.observe(el)
        const mo =
            typeof MutationObserver === 'undefined'
                ? null
                : new MutationObserver(schedule)
        mo?.observe(el, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['tabindex', 'disabled', 'href', 'contenteditable', 'hidden'],
        })
        return () => {
            cancelAnimationFrame(frame)
            ro?.disconnect()
            mo?.disconnect()
        }
    }, [tabIndex])

    // `data-scrolling` while it moves, set on the node so a scroll never
    // re-renders the list inside. And the thumb's repaint: Chromium does not
    // repaint a `::-webkit-scrollbar-thumb` when only the scroller's :hover
    // or :focus-within changes (measured: the computed colour changes, the
    // painted thumb does not until the next scroll). Toggling
    // `data-scrollbar-tick` changes the thumb's min-height by a hundredth of
    // a rem (utilities/scrollbars.css), which rebuilds the scrollbar's parts
    // without laying out anything inside the area.
    useEffect(() => {
        const el = nodeRef.current
        if (!el) return
        let timer: ReturnType<typeof setTimeout> | undefined
        const tick = () => el.toggleAttribute('data-scrollbar-tick')
        const onScroll = () => {
            if (!el.hasAttribute('data-scrolling')) el.setAttribute('data-scrolling', '')
            clearTimeout(timer)
            timer = setTimeout(() => {
                el.removeAttribute('data-scrolling')
                tick()
            }, SCROLL_IDLE_MS)
        }
        el.addEventListener('scroll', onScroll, { passive: true })
        el.addEventListener('pointerenter', tick)
        el.addEventListener('pointerleave', tick)
        el.addEventListener('focusin', tick)
        el.addEventListener('focusout', tick)
        return () => {
            clearTimeout(timer)
            el.removeEventListener('scroll', onScroll)
            el.removeEventListener('pointerenter', tick)
            el.removeEventListener('pointerleave', tick)
            el.removeEventListener('focusin', tick)
            el.removeEventListener('focusout', tick)
            el.removeAttribute('data-scrolling')
        }
    }, [])

    const focusable = tabIndex !== undefined ? tabIndex >= 0 : needsFocus
    const resolvedRole = role ?? (label && focusable && (as === 'div' || as === 'section') ? 'region' : undefined)
    const mergedStyle: CSSProperties | undefined = stickyOffset
        ? ({
              ...style,
              [axis === 'x' ? '--scroll-area-offset-inline' : '--scroll-area-offset']: stickyOffset,
          } as CSSProperties)
        : style

    return createElement(
        as,
        {
            ...rest,
            ref: setRefs,
            role: resolvedRole,
            'aria-label': label ?? rest['aria-label'],
            tabIndex: tabIndex ?? (needsFocus ? 0 : undefined),
            'data-orientation': orientation,
            'data-axis': axis,
            'data-fade-start': showFade && edges.start ? '' : undefined,
            'data-fade-end': showFade && edges.end ? '' : undefined,
            style: mergedStyle,
            className: cn(
                'scroll-area',
                orientation === 'horizontal' && 'scroll-area-x',
                orientation === 'both' && 'scroll-area-xy',
                showFade && 'scroll-fade',
                className
            ),
        },
        children
    )
})

ScrollArea.displayName = 'ScrollArea'
