import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Tabs, TabsList, TabsTrigger } from './Tabs'

/**
 * AUTM-1792: the sliding pill. jsdom has no layout, so the triggers'
 * offsets are stubbed; what is asserted is that the pill follows the
 * selected trigger, stays out of the accessibility tree, and only takes the
 * trigger's fill once it has somewhere to be.
 */
function stubBoxes() {
    const boxes: Record<string, [number, number]> = { Day: [4, 50], Week: [58, 60], Month: [122, 70] }
    for (const [name, [left, width]] of Object.entries(boxes)) {
        const el = screen.getByRole('tab', { name })
        Object.defineProperty(el, 'offsetLeft', { configurable: true, value: left })
        Object.defineProperty(el, 'offsetTop', { configurable: true, value: 4 })
        Object.defineProperty(el, 'offsetWidth', { configurable: true, value: width })
        Object.defineProperty(el, 'offsetHeight', { configurable: true, value: 40 })
    }
}

function Switcher({ slide = true }: { slide?: boolean }) {
    return (
        <Tabs defaultValue="Day">
            <TabsList slide={slide} aria-label="View">
                <TabsTrigger value="Day">Day</TabsTrigger>
                <TabsTrigger value="Week">Week</TabsTrigger>
                <TabsTrigger value="Month">Month</TabsTrigger>
            </TabsList>
        </Tabs>
    )
}

describe('TabsList slide (AUTM-1792)', () => {
    it('draws no pill unless asked', () => {
        const { container } = render(<Switcher slide={false} />)
        expect(container.querySelector('[data-tabs-pill]')).toBeNull()
        expect(screen.getByRole('tablist').getAttribute('data-slide')).toBeNull()
    })

    it('follows the selected tab, hidden from assistive tech', async () => {
        const { container } = render(<Switcher />)
        stubBoxes()
        // A tab change is what the observer measures on.
        await act(async () => {
            fireEvent.mouseDown(screen.getByRole('tab', { name: 'Month' }), { button: 0 })
        })
        await act(async () => {})
        const pill = container.querySelector('[data-tabs-pill]')
        expect(pill).not.toBeNull()
        expect(pill?.getAttribute('aria-hidden')).toBe('true')
        const [left, middle, right] = Array.from(pill!.children) as HTMLElement[]
        expect(left.style.transform).toBe('translate(122px, 4px)')
        expect(middle.style.transform).toBe('translate(142px, 4px) scaleX(30)')
        expect(right.style.transform).toBe('translate(152px, 4px)')
        expect(screen.getByRole('tablist').getAttribute('data-slide')).toBe('ready')
    })

    it('never animates a width: every part moves by transform alone', async () => {
        const { container } = render(<Switcher />)
        stubBoxes()
        await act(async () => {
            fireEvent.mouseDown(screen.getByRole('tab', { name: 'Week' }), { button: 0 })
        })
        await act(async () => {})
        for (const part of Array.from(container.querySelector('[data-tabs-pill]')!.children)) {
            expect(part.className).not.toMatch(/transition-(all|\[width|width)/)
        }
    })
})
