import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { ChipRow } from './ChipRow'

/**
 * AUTM-1756 follow-up. jsdom lays nothing out, so the scroll geometry is
 * stated per element; the glide, the drag and the keyboard reveal are
 * measured in ChipRow.browser.test.tsx.
 */
function geometry(el: HTMLElement, g: Partial<Record<'scrollWidth' | 'clientWidth' | 'scrollLeft', number>>) {
    for (const [k, v] of Object.entries(g)) {
        Object.defineProperty(el, k, { configurable: true, value: v, writable: true })
    }
    fireEvent.scroll(el)
}

async function settle() {
    await act(async () => {
        await new Promise((r) => requestAnimationFrame(() => r(null)))
    })
}

const slotOf = (button: HTMLElement) => button.closest('.chip-row__arrow') as HTMLElement
const isShown = (button: HTMLElement) => !slotOf(button).hasAttribute('data-hidden')

function Chips({ count = 6, onPick = () => {} }: { count?: number; onPick?: (i: number) => void }) {
    return (
        <>
            {Array.from({ length: count }, (_, i) => (
                <button key={i} type="button" onClick={() => onPick(i)}>
                    Chip {i + 1}
                </button>
            ))}
        </>
    )
}

afterEach(() => vi.restoreAllMocks())

describe('ChipRow (AUTM-1756 follow-up)', () => {
    it('is a named group whose row scrolls without a bar, with two named chevrons out of the tab order', async () => {
        render(
            <ChipRow label="Quick replies" data-testid="row">
                <Chips />
            </ChipRow>
        )
        const row = screen.getByRole('group', { name: 'Quick replies' })
        expect(row).toBe(screen.getByTestId('row'))
        expect(row.className).toContain('chip-row__scroller')
        expect(row.className).toContain('scroll-fade')
        expect(row.getAttribute('data-axis')).toBe('x')
        const next = screen.getByRole('button', { name: 'Scroll right' })
        const previous = screen.getByRole('button', { name: 'Scroll left' })
        for (const b of [next, previous]) {
            expect(b.getAttribute('tabindex')).toBe('-1')
            expect(b.getAttribute('aria-controls')).toBe(row.id)
        }
        // Every chip stays a tab stop.
        for (const chip of within(row).getAllByRole('button')) expect(chip.tabIndex).toBe(0)
        // Nothing to scroll yet (jsdom measures 0 in 0): both hidden.
        await settle()
        expect(isShown(next)).toBe(false)
        expect(isShown(previous)).toBe(false)
    })

    it('names its chevrons per prop', () => {
        render(
            <ChipRow label="Quick replies" nextLabel="Show more replies" previousLabel="Show earlier replies" nextTestId="n" previousTestId="p">
                <Chips />
            </ChipRow>
        )
        expect(screen.getByTestId('n').getAttribute('aria-label')).toBe('Show more replies')
        expect(screen.getByTestId('p').getAttribute('aria-label')).toBe('Show earlier replies')
    })

    it('shows the end chevron when the row overflows, the start one once it has moved, and neither past its end', async () => {
        render(
            <ChipRow label="Filter">
                <Chips />
            </ChipRow>
        )
        const row = screen.getByRole('group', { name: 'Filter' })
        const next = screen.getByRole('button', { name: 'Scroll right' })
        const previous = screen.getByRole('button', { name: 'Scroll left' })

        geometry(row, { scrollWidth: 700, clientWidth: 360, scrollLeft: 0 })
        await settle()
        expect([isShown(previous), isShown(next)]).toEqual([false, true])
        expect(row.hasAttribute('data-fade-end')).toBe(true)
        expect(row.hasAttribute('data-fade-start')).toBe(false)

        geometry(row, { scrollLeft: 120 })
        await settle()
        expect([isShown(previous), isShown(next)]).toEqual([true, true])

        geometry(row, { scrollLeft: 340 })
        await settle()
        expect([isShown(previous), isShown(next)]).toEqual([true, false])
    })

    it('draws no chevrons with arrows="never", and marks the box with its arrows mode', () => {
        const { container, rerender } = render(
            <ChipRow label="Filter" arrows="never">
                <Chips />
            </ChipRow>
        )
        expect(container.querySelectorAll('.chip-row__arrow')).toHaveLength(0)
        expect(container.querySelector('.chip-row')!.getAttribute('data-arrows')).toBe('never')
        rerender(
            <ChipRow label="Filter">
                <Chips />
            </ChipRow>
        )
        expect(container.querySelector('.chip-row')!.getAttribute('data-arrows')).toBe('auto')
    })

    it('a press moves the row a view at a time, instantly under reduced motion', async () => {
        vi.spyOn(window, 'matchMedia').mockImplementation(
            (q: string) => ({ matches: q.includes('reduce'), media: q }) as MediaQueryList
        )
        render(
            <ChipRow label="Filter">
                <Chips />
            </ChipRow>
        )
        const row = screen.getByRole('group', { name: 'Filter' })
        geometry(row, { scrollWidth: 1000, clientWidth: 360, scrollLeft: 0 })
        await settle()
        fireEvent.click(screen.getByRole('button', { name: 'Scroll right' }))
        expect(row.scrollLeft).toBe(360)
        fireEvent.click(screen.getByRole('button', { name: 'Scroll left' }))
        expect(row.scrollLeft).toBe(0)
    })

    it('hands focus to the last chip when the end chevron hides while it holds focus', async () => {
        render(
            <ChipRow label="Filter">
                <Chips />
            </ChipRow>
        )
        const row = screen.getByRole('group', { name: 'Filter' })
        const next = screen.getByRole('button', { name: 'Scroll right' })
        geometry(row, { scrollWidth: 700, clientWidth: 360, scrollLeft: 0 })
        await settle()
        next.focus()
        expect(document.activeElement).toBe(next)
        geometry(row, { scrollLeft: 340 })
        await settle()
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Chip 6' }))
    })

    it('in a radiogroup, the arrow keys move between chips and choose, wrapping at the ends', () => {
        function Radios() {
            const [value, setValue] = useState('a')
            return (
                <ChipRow role="radiogroup" label="When">
                    {['a', 'b', 'c'].map((v) => (
                        <button
                            key={v}
                            type="button"
                            role="radio"
                            aria-checked={value === v}
                            onClick={() => setValue(v)}
                        >
                            {v.toUpperCase()}
                        </button>
                    ))}
                </ChipRow>
            )
        }
        render(<Radios />)
        const [a, b, c] = screen.getAllByRole('radio')
        a.focus()
        fireEvent.keyDown(a, { key: 'ArrowRight' })
        expect(document.activeElement).toBe(b)
        expect(b.getAttribute('aria-checked')).toBe('true')
        fireEvent.keyDown(b, { key: 'End' })
        expect(document.activeElement).toBe(c)
        fireEvent.keyDown(c, { key: 'ArrowRight' })
        expect(document.activeElement).toBe(a)
        expect(a.getAttribute('aria-checked')).toBe('true')
    })

    it('in a tablist, the arrow keys move focus without activating, and stop at the ends', () => {
        const pick = vi.fn()
        render(
            <ChipRow role="tablist" label="Filter">
                {['All', 'Open', 'Done'].map((t) => (
                    <button key={t} type="button" role="tab" aria-selected={t === 'All'} onClick={() => pick(t)}>
                        {t}
                    </button>
                ))}
            </ChipRow>
        )
        const [all, open, done] = screen.getAllByRole('tab')
        all.focus()
        fireEvent.keyDown(all, { key: 'ArrowRight' })
        expect(document.activeElement).toBe(open)
        fireEvent.keyDown(open, { key: 'ArrowRight' })
        fireEvent.keyDown(done, { key: 'ArrowRight' })
        expect(document.activeElement).toBe(done)
        fireEvent.keyDown(done, { key: 'Home' })
        expect(document.activeElement).toBe(all)
        expect(pick).not.toHaveBeenCalled()
    })

    it('leaves the arrow keys alone in a plain group, and to a child that handles them', () => {
        const { rerender } = render(
            <ChipRow label="Filter">
                <Chips count={3} />
            </ChipRow>
        )
        const first = screen.getByRole('button', { name: 'Chip 1' })
        first.focus()
        fireEvent.keyDown(first, { key: 'ArrowRight' })
        expect(document.activeElement).toBe(first)

        const own = vi.fn((e: React.KeyboardEvent) => e.preventDefault())
        rerender(
            <ChipRow role="radiogroup" label="When" onKeyDown={own}>
                <button type="button" role="radio" aria-checked>
                    A
                </button>
                <button type="button" role="radio" aria-checked={false}>
                    B
                </button>
            </ChipRow>
        )
        const a = screen.getByRole('radio', { name: 'A' })
        a.focus()
        fireEvent.keyDown(a, { key: 'ArrowRight' })
        expect(own).toHaveBeenCalled()
        expect(document.activeElement).toBe(a)
    })

    it('as="ul" keeps list semantics, for a row of links', () => {
        render(
            <ChipRow as="ul" label="Sections">
                <li>
                    <a href="#services">Services</a>
                </li>
                <li>
                    <a href="#reviews">Reviews</a>
                </li>
            </ChipRow>
        )
        const list = screen.getByRole('list', { name: 'Sections' })
        expect(list.tagName).toBe('UL')
        expect(list.hasAttribute('role')).toBe(false)
        expect(within(list).getAllByRole('link')).toHaveLength(2)
    })

    it('forwards its ref to the row, and puts rootClassName on the box', () => {
        let node: HTMLElement | null = null
        const { container } = render(
            <ChipRow label="Filter" rootClassName="mt-4" ref={(n) => (node = n)}>
                <Chips count={2} />
            </ChipRow>
        )
        expect(node).toBe(screen.getByRole('group', { name: 'Filter' }))
        expect(container.querySelector('.chip-row')!.className).toContain('mt-4')
    })
})
