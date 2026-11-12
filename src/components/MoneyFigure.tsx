'use client'

import * as React from 'react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

/**
 * A money chip's amount (AUTM-1799): whole, and inside its chip, whatever
 * the font and whatever the amount.
 *
 * An amount never wraps ("$25.18" never "$25.1" over "8"), so in a chip too
 * narrow for it at its full size (a 270px card at 200% text, or a long
 * amount) it would run out of the chip. CSS cannot see how wide a figure is
 * in the face the reader actually gets (CI's Linux fonts set "$25.18" wider
 * than a Mac), so this measures: when the whole figure is wider than its
 * room, it scales the size down to fit, and only then. A figure that fits
 * keeps its full size, so a chip that fits today looks exactly as it did.
 * Before hydration (a server-rendered page) the figure is at its full size.
 *
 * Internal to MoneyBreakdown's chips; it renders the `<dd>`.
 */
export function MoneyFigure({ children, className }: { children: ReactNode; className?: string }) {
    const box = React.useRef<HTMLElement>(null)
    const figure = React.useRef<HTMLSpanElement>(null)

    useIsomorphicLayoutEffect(() => {
        const dd = box.current
        const span = figure.current
        if (!dd || !span) return
        const fit = () => {
            dd.style.removeProperty('--figure-fit')
            const room = dd.clientWidth
            const need = span.getBoundingClientRect().width
            // 1% spare for glyph rounding; three decimals keep it stable.
            if (room > 0 && need > room) {
                dd.style.setProperty('--figure-fit', String(Math.floor((room / need) * 990) / 1000))
            }
        }
        fit()
        if (typeof ResizeObserver === 'undefined') return
        // The room changes with the chip; the figure with the text size, the
        // face arriving late, or a counting amount.
        const observer = new ResizeObserver(fit)
        observer.observe(dd)
        observer.observe(span)
        document.fonts?.ready.then(fit).catch(() => undefined)
        return () => observer.disconnect()
    }, [children])

    return (
        <dd
            ref={box}
            className={cn('m-0 text-[length:calc(2rem*var(--figure-fit,1))] whitespace-nowrap', className)}
        >
            <span ref={figure} className="inline-block">
                {children}
            </span>
        </dd>
    )
}
