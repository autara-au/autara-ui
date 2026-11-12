import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ScrollStory, SCROLL_STORY_STILL_QUERY, type ScrollStoryStep } from './ScrollStory'

/* jsdom has neither matchMedia nor IntersectionObserver. The observer here
   records its callbacks so a test can say which sentinel crossed the line. */
type Observed = { callback: IntersectionObserverCallback; options?: IntersectionObserverInit; targets: Element[] }
let observers: Observed[] = []
let still = false

beforeEach(() => {
    observers = []
    still = false
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            record: Observed
            constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
                this.record = { callback, options, targets: [] }
                observers.push(this.record)
            }
            observe(el: Element) {
                this.record.targets.push(el)
            }
            unobserve() {}
            disconnect() {
                this.record.targets = []
            }
        }
    )
    window.matchMedia = vi.fn((query: string) => ({
        matches: query === SCROLL_STORY_STILL_QUERY ? still : false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia
    Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => {
    vi.unstubAllGlobals()
})

const STEPS: ScrollStoryStep[] = ['Today', 'Schedule', 'Inbox', 'Earnings'].map((label) => ({
    id: label.toLowerCase(),
    label,
    caption: `${label} line`,
    render: ({ phase }) => <div data-testid={`content-${label.toLowerCase()}`} data-phase={phase} />,
}))

/** The observer watching the sentinels: the one with the middle-line margin. */
const story = () => observers.find((o) => o.options?.rootMargin === '-50% 0px -50% 0px')!

function cross(index: number) {
    const target = story().targets[index]!
    act(() => {
        story().callback([{ isIntersecting: true, target } as unknown as IntersectionObserverEntry], {} as IntersectionObserver)
    })
}

describe('ScrollStory', () => {
    it('puts every step heading and caption in the page, in order, with the first current', () => {
        render(<ScrollStory steps={STEPS} label="Screens of the app" testId="s" />)
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Screens of the app')
        expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Today', 'Schedule', 'Inbox', 'Earnings'])
        for (const s of STEPS) expect(screen.getByText(`${s.label} line`)).toBeInTheDocument()
        expect(screen.getByTestId('s-tab-today')).toHaveAttribute('aria-current', 'step')
        expect(screen.getByTestId('s-line')).toHaveTextContent('Today line')
        expect(screen.getByTestId('s-count')).toHaveTextContent('1 of 4')
        expect(screen.getByRole('group', { name: 'Screens of the app' })).toBeInTheDocument()
    })

    it('mounts only the first step until the story is on screen and idle', () => {
        render(<ScrollStory steps={STEPS} label="x" />)
        expect(screen.getByTestId('content-today')).toBeInTheDocument()
        expect(screen.queryByTestId('content-schedule')).toBeNull()
    })

    it('mounts every step at once with eager', () => {
        render(<ScrollStory steps={STEPS} label="x" eager />)
        for (const s of STEPS) expect(screen.getByTestId(`content-${s.id}`)).toBeInTheDocument()
    })

    it('follows the sentinel across the middle of the viewport, and marks passed steps', () => {
        render(<ScrollStory steps={STEPS} label="x" testId="s" />)
        expect(story().targets).toHaveLength(4)
        cross(2)
        expect(screen.getByTestId('s-tab-inbox')).toHaveAttribute('aria-current', 'step')
        expect(screen.getByTestId('s-tab-today')).toHaveAttribute('data-done', 'true')
        expect(screen.getByTestId('s-tab-schedule')).toHaveAttribute('data-done', 'true')
        expect(screen.getByTestId('s-tab-earnings')).not.toHaveAttribute('data-done')
        expect(screen.getByTestId('s-line')).toHaveTextContent('Inbox line')
        expect(screen.getByTestId('s-count')).toHaveTextContent('3 of 4')
        expect(screen.getByTestId('content-inbox')).toHaveAttribute('data-phase', 'enter')
        expect(screen.getByTestId('content-today')).toHaveAttribute('data-phase', 'prev')
        // The hint is only for the first step.
        expect(screen.getByTestId('s-hint')).toHaveAttribute('data-hidden', 'true')
    })

    it('a chip scrolls the page to its step and shows it at once', () => {
        render(<ScrollStory steps={STEPS} label="x" testId="s" />)
        fireEvent.click(screen.getByTestId('s-tab-earnings'))
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1)
        expect(screen.getByTestId('s-tab-earnings')).toHaveAttribute('aria-current', 'step')
        // The steps it passes on the way do not flash by.
        cross(1)
        expect(screen.getByTestId('s-tab-earnings')).toHaveAttribute('aria-current', 'step')
    })

    it('with no pin (reduced motion or a short screen) a chip switches at once, and nothing is watched', () => {
        still = true
        render(<ScrollStory steps={STEPS} label="x" testId="s" />)
        expect(screen.getByTestId('s')).toHaveAttribute('data-still', 'true')
        expect(story()).toBeUndefined()
        fireEvent.click(screen.getByTestId('s-tab-schedule'))
        expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
        expect(screen.getByTestId('s-tab-schedule')).toHaveAttribute('aria-current', 'step')
        expect(screen.getByTestId('s-line')).toHaveTextContent('Schedule line')
    })

    it('gives each chip its own step timeline and the root their scope', () => {
        const { container } = render(<ScrollStory steps={STEPS} label="x" />)
        const root = container.firstElementChild as HTMLElement
        expect(root.getAttribute('style')).toContain('--scroll-story-steps: 4')
        const sentinels = container.querySelectorAll('.scroll-story-step')
        expect(sentinels).toHaveLength(4)
        sentinels.forEach((el, i) => {
            expect(el).toHaveAttribute('aria-hidden', 'true')
            expect(el).toHaveAttribute('data-step', String(i))
        })
    })

    it('says nothing on first step when the hint is turned off', () => {
        render(<ScrollStory steps={STEPS} label="x" testId="s" hint={null} />)
        expect(screen.queryByTestId('s-hint')).toBeNull()
    })

    // AUTM-1683: one progress track on the chips, no count and no hint.
    it('with indicator="track" draws no count and no hint, and the chips still say which step is current', () => {
        render(<ScrollStory steps={STEPS} label="x" testId="s" indicator="track" />)
        expect(screen.getByTestId('s')).toHaveAttribute('data-indicator', 'track')
        expect(screen.queryByTestId('s-count')).toBeNull()
        expect(screen.queryByTestId('s-hint')).toBeNull()
        expect(screen.getByTestId('s-tab-today')).toHaveAttribute('aria-current', 'step')
        cross(2)
        expect(screen.getByTestId('s-tab-inbox')).toHaveAttribute('aria-current', 'step')
        expect(screen.getByTestId('s-tab-today')).toHaveAttribute('data-done', 'true')
        // Every chip keeps its rail: together they are the track.
        expect(document.querySelectorAll('.scroll-story-rail .scroll-story-fill')).toHaveLength(STEPS.length)
    })

    it('defaults to chips, with the count', () => {
        render(<ScrollStory steps={STEPS} label="x" testId="s" />)
        expect(screen.getByTestId('s')).toHaveAttribute('data-indicator', 'chips')
        expect(screen.getByTestId('s-count')).toHaveTextContent('1 of 4')
    })
})
