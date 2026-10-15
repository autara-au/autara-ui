import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { ScrollArea } from './ScrollArea'

/* jsdom lays nothing out, so the scroll geometry is given per element. */
function geometry(el: HTMLElement, g: Partial<Record<'scrollHeight' | 'clientHeight' | 'scrollWidth' | 'clientWidth' | 'scrollLeft' | 'scrollTop', number>>) {
    for (const [k, v] of Object.entries(g)) {
        Object.defineProperty(el, k, { configurable: true, value: v, writable: true })
    }
}

/* Run rAF-scheduled reads now. */
async function flush() {
    await act(async () => {
        await new Promise((r) => requestAnimationFrame(() => r(null)))
    })
}

afterEach(() => vi.useRealTimers())

describe('ScrollArea (AUTM-1756)', () => {
    it('is a contained vertical scroller by default', () => {
        render(<ScrollArea data-testid="area">rows</ScrollArea>)
        const area = screen.getByTestId('area')
        expect(area.className).toContain('scroll-area')
        expect(area).toHaveAttribute('data-orientation', 'vertical')
        expect(area.className).not.toContain('scroll-fade')
    })

    it('takes focus, as a named region, when it overflows and holds nothing focusable', async () => {
        const { rerender } = render(
            <ScrollArea data-testid="area" label="Terms">
                <p>Long text</p>
            </ScrollArea>
        )
        const area = screen.getByTestId('area')
        geometry(area, { scrollHeight: 900, clientHeight: 300 })
        // Content changes are watched; re-render to trigger a read.
        rerender(
            <ScrollArea data-testid="area" label="Terms">
                <p>Long text, longer</p>
            </ScrollArea>
        )
        await flush()
        expect(area).toHaveAttribute('tabindex', '0')
        expect(screen.getByRole('region', { name: 'Terms' })).toBe(area)
    })

    it('does not take focus when something inside it can (Tab already scrolls it)', async () => {
        render(
            <ScrollArea data-testid="area" label="Customers">
                <a href="/customers/1">Alex Chen</a>
            </ScrollArea>
        )
        const area = screen.getByTestId('area')
        geometry(area, { scrollHeight: 900, clientHeight: 300 })
        fireEvent.scroll(area)
        await flush()
        expect(area).not.toHaveAttribute('tabindex')
        expect(area).not.toHaveAttribute('role')
        expect(area).toHaveAttribute('aria-label', 'Customers')
    })

    it('does not take focus when it does not overflow', async () => {
        render(<ScrollArea data-testid="area">short</ScrollArea>)
        await flush()
        expect(screen.getByTestId('area')).not.toHaveAttribute('tabindex')
    })

    it('AUTM-1899: no longer marks itself for a scrollbar reveal (there is no bar to reveal)', () => {
        render(<ScrollArea data-testid="area">rows</ScrollArea>)
        const area = screen.getByTestId('area')
        fireEvent.pointerEnter(area)
        fireEvent.scroll(area)
        expect(area).not.toHaveAttribute('data-scrollbar-reveal')
        expect(area).not.toHaveAttribute('data-scrolling')
        expect(area).not.toHaveAttribute('data-scrollbar-tick')
    })

    it('horizontal fades the edge that has more, by default', async () => {
        render(
            <ScrollArea data-testid="row" orientation="horizontal" label="Filter">
                <button type="button">All</button>
            </ScrollArea>
        )
        const row = screen.getByTestId('row')
        expect(row.className).toContain('scroll-area-x')
        expect(row.className).toContain('scroll-fade')
        geometry(row, { scrollWidth: 800, clientWidth: 300, scrollLeft: 0 })
        fireEvent.scroll(row)
        await flush()
        expect(row).toHaveAttribute('data-fade-end')
        expect(row).not.toHaveAttribute('data-fade-start')
        geometry(row, { scrollLeft: 200 })
        fireEvent.scroll(row)
        await flush()
        expect(row).toHaveAttribute('data-fade-start')
        expect(row).toHaveAttribute('data-fade-end')
        geometry(row, { scrollLeft: 500 })
        fireEvent.scroll(row)
        await flush()
        expect(row).toHaveAttribute('data-fade-start')
        expect(row).not.toHaveAttribute('data-fade-end')
    })

    it('stickyOffset becomes the scroll padding under a sticky header', () => {
        render(
            <ScrollArea data-testid="area" stickyOffset="3.5rem">
                rows
            </ScrollArea>
        )
        expect(screen.getByTestId('area').style.getPropertyValue('--scroll-area-offset')).toBe('3.5rem')
    })

    it('renders as a list when asked, keeping the list role', () => {
        render(
            <ScrollArea as="ul" data-testid="list">
                <li>One</li>
            </ScrollArea>
        )
        expect(screen.getByTestId('list').tagName).toBe('UL')
        expect(screen.getByRole('list')).toBe(screen.getByTestId('list'))
    })

    it('an explicit tabIndex wins', async () => {
        render(
            <ScrollArea data-testid="area" tabIndex={-1}>
                rows
            </ScrollArea>
        )
        await flush()
        expect(screen.getByTestId('area')).toHaveAttribute('tabindex', '-1')
    })
})

describe('useScrollbarReveal (deprecated, AUTM-1899)', () => {
    it('is still exported, so existing callers compile, and does nothing', async () => {
        const { useRef } = await import('react')
        const { useScrollbarReveal } = await import('./ScrollArea')
        function Page() {
            const ref = useRef<HTMLDivElement>(null)
            useScrollbarReveal(ref)
            return <div ref={ref} data-testid="main" />
        }
        const { unmount } = render(<Page />)
        const main = screen.getByTestId('main')
        fireEvent.scroll(main)
        expect(main.attributes).toHaveLength(1)
        unmount()
    })

    it('stays in the package surface', async () => {
        const pkg = await import('../index')
        expect(typeof pkg.useScrollbarReveal).toBe('function')
        expect(typeof pkg.ScrollArea).toBe('object')
    })
})
