'use client'

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
    type CSSProperties,
    type ElementType,
    type PointerEvent,
    type ReactNode,
} from 'react'
import { cn } from '../lib/cn'

/**
 * ScrollStory — steps that play while the page scrolls past them, then let go.
 *
 * AUTM-1679 (Don, 2026-10-04, on the merchant landing: "when scrolling it
 * should stop the scroll and show those screens while scrolling. and continue
 * next sections normal scroll"; then "in scroll stop section we should show
 * some indicator or something you are scrolling, make it more dynamic and
 * interactive"). Built for merchant-web's hero first and customer-web next.
 *
 * A stage (the pin) sticks in the viewport inside a wrapper one step of
 * scroll taller per step. Scrolling through the wrapper moves the story
 * through its steps; after the last, the wrapper ends, the pin goes with it,
 * and the page scrolls on as normal.
 *
 * What it promises:
 *   - No scroll-jacking. Nothing listens to wheel, touch or scroll, nothing
 *     calls preventDefault, nothing snaps. The page moves exactly as the
 *     visitor moves it; only the stage changes.
 *   - The active step comes from IntersectionObserver: one invisible sentinel
 *     per step, a step of scroll tall, watched against a line across the
 *     middle of the viewport. No code runs per frame.
 *   - The indicator: chips name the steps and say which is current
 *     (`aria-current="step"`), a count says "2 of 4", and each chip's rail
 *     FILLS as the page scrolls through its step. The fill is a CSS
 *     scroll-driven animation on that step's sentinel (a named view timeline,
 *     inset to the middle line), so it too runs with no listener; where
 *     scroll-driven animations are not supported, a step's rail is full once
 *     it is current or passed.
 *   - A hint on the first step ("Scroll to see the app", or what you pass)
 *     that fades as the first step's scroll begins.
 *   - `indicator="track"` (AUTM-1683, Don 2026-10-05: no separate "1 of 3"
 *     counter, on autara.au and merchants.autara.au alike): the chips become
 *     one segmented bar whose rails sit flush along its foot and meet, so
 *     they read as ONE progress track filling left to right as the page
 *     scrolls. No count and no hint are drawn; `aria-current="step"` on the
 *     chips still says which step is showing.
 *   - A chip scrolls the page to its step. While that scroll runs, the steps
 *     it passes do not flash by.
 *   - No pin under `prefers-reduced-motion: reduce`, nor on a viewport under
 *     36rem tall (a landscape phone, browser zoom, or large text: rem in a
 *     media query follows the visitor's text size). There the chips are a
 *     plain switcher and the step changes at once. `SCROLL_STORY_STILL_QUERY`
 *     is that query; the stylesheet uses the same one.
 *   - `tilt`: a small turn of the stage toward a mouse pointer, on hover
 *     devices only, never on touch or in the still layout. One pointermove
 *     listener on the stage, written through requestAnimationFrame.
 *   - Every step's heading and caption are in the server HTML, in order. The
 *     first step's content renders on the server; the others mount once the
 *     story is on screen and the page is idle (`eager` mounts them all).
 *   - Transform and opacity only. The pin's boxes are sized by the viewport,
 *     not by their content, so nothing moves the page when a step's pictures
 *     load or change.
 *
 * Styling hooks (utilities/scroll-story.css): `--scroll-story-top` (room at
 * the pin's top for a fixed header; the pin itself sits at the very top, so
 * a header that hides and shows never moves it), `--scroll-story-step` and
 * `--scroll-story-step-compact` (scroll per step, wide and below 48rem), and
 * the chip colours. Defaults are for a brand-deep ground.
 */

export type ScrollStoryPhase = 'active' | 'enter' | 'prev' | 'idle'

export interface ScrollStoryStepState {
    /** `active` on first paint; `enter` arriving, `prev` leaving, `idle` otherwise. */
    phase: ScrollStoryPhase
    index: number
}

export interface ScrollStoryStep {
    /** Stable key: ids and test ids are built from it. */
    id: string
    /** The chip's label and the step's (visually hidden) heading. */
    label: string
    /** One line under the stage, crossfaded per step. */
    caption?: ReactNode
    /** The stage for this step. Every mounted step renders; style by `phase`. */
    render: (state: ScrollStoryStepState) => ReactNode
}

export interface ScrollStoryProps {
    steps: readonly ScrollStoryStep[]
    /** Names the chip group and the story's visually hidden heading. */
    label: string
    /** The story heading's level; each step's heading is one below. Default 2. */
    headingLevel?: 2 | 3 | 4 | 5
    /** Prefix for test ids: the root, `-tab-{id}` per chip, `-line` on the current caption, `-count`, `-hint`. */
    testId?: string
    /** Under the count on the first step, fading as its scroll begins. `null` for none. */
    hint?: ReactNode
    /** The count's words. Default "2 of 4". */
    formatCount?: (current: number, total: number) => string
    /** Turn the stage a little toward a mouse pointer. */
    tilt?: boolean
    /** Mount every step's content on the server and first paint. */
    eager?: boolean
    /**
     * `chips` (default): separate chips, each with its own rail, and the count
     * and hint under them. `track`: one segmented bar whose rails form a
     * single progress track; no count, no hint (`formatCount` and `hint` are
     * ignored).
     */
    indicator?: 'chips' | 'track'
    className?: string
    style?: CSSProperties
}

/** No pin: reduced motion, or a viewport too short to hold one. Same query as scroll-story.css. */
export const SCROLL_STORY_STILL_QUERY = '(prefers-reduced-motion: reduce), (max-height: 36rem)'

/* Read once a chip's scroll has settled, should no scrollend event come. */
const SETTLE_FALLBACK_MS = 1500
/* The largest turn of the stage, in degrees, at the stage's edge. */
const TILT_DEG = 3

function subscribeStill(onChange: () => void) {
    const mq = window.matchMedia(SCROLL_STORY_STILL_QUERY)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
}
const stillSnapshot = () => window.matchMedia(SCROLL_STORY_STILL_QUERY).matches
const stillServerSnapshot = () => false

const defaultCount = (current: number, total: number) => `${current} of ${total}`

export function ScrollStory({
    steps,
    label,
    headingLevel = 2,
    testId,
    hint = 'Scroll to see each one',
    formatCount = defaultCount,
    tilt = false,
    eager = false,
    indicator = 'chips',
    className,
    style,
}: ScrollStoryProps) {
    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const sentinels = useRef<Array<HTMLDivElement | null>>([])
    const activeRef = useRef(0)
    /* A chip's step, held while the page scrolls to it. */
    const heading = useRef<number | null>(null)
    const tiltFrame = useRef<number | null>(null)

    const [active, setActive] = useState(0)
    const [prev, setPrev] = useState<number | null>(null)
    const [warm, setWarm] = useState(eager)
    const still = useSyncExternalStore(subscribeStill, stillSnapshot, stillServerSnapshot)

    const show = useCallback((next: number) => {
        if (next === activeRef.current) return
        setWarm(true)
        setPrev(activeRef.current)
        activeRef.current = next
        setActive(next)
    }, [])

    /* Mount the other steps once the story is on screen and the page is idle. */
    useEffect(() => {
        const el = rootRef.current
        if (!el || warm) return
        const hasIdle = typeof window.requestIdleCallback === 'function'
        let idle: number | undefined
        const io = new IntersectionObserver(
            ([entry]) => {
                if (!entry?.isIntersecting || idle !== undefined) return
                const warmUp = () => setWarm(true)
                idle = hasIdle
                    ? window.requestIdleCallback(warmUp, { timeout: 2000 })
                    : (globalThis.setTimeout(warmUp, 1200) as unknown as number)
            },
            { threshold: 0.05 }
        )
        io.observe(el)
        return () => {
            io.disconnect()
            if (idle === undefined) return
            if (hasIdle) window.cancelIdleCallback(idle)
            else globalThis.clearTimeout(idle)
        }
    }, [warm])

    /* The story: which sentinel is across the middle of the viewport. */
    useEffect(() => {
        if (still) return
        const io = new IntersectionObserver(
            (entries) => {
                if (heading.current !== null) return
                for (const entry of entries) {
                    if (entry.isIntersecting) show(Number((entry.target as HTMLElement).dataset.step))
                }
            },
            { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
        )
        for (const el of sentinels.current) if (el) io.observe(el)
        return () => io.disconnect()
    }, [still, show, steps.length])

    useEffect(
        () => () => {
            if (tiltFrame.current !== null) cancelAnimationFrame(tiltFrame.current)
        },
        []
    )

    /** A chip: scroll to its step, or, with no pin, change at once. */
    function go(next: number) {
        const sentinel = sentinels.current[next]
        if (still || !sentinel) {
            show(next)
            return
        }
        heading.current = next
        show(next)
        let timer = 0
        const settle = () => {
            window.removeEventListener('scrollend', settle)
            window.clearTimeout(timer)
            heading.current = null
            /* Where the scroll came to rest, should the visitor have scrolled
               on meanwhile: the step across the middle, read once. */
            const middle = window.innerHeight / 2
            const here = sentinels.current.findIndex((el) => {
                const r = el?.getBoundingClientRect()
                return r ? r.top <= middle && r.bottom > middle : false
            })
            if (here !== -1) show(here)
        }
        window.addEventListener('scrollend', settle)
        timer = window.setTimeout(settle, SETTLE_FALLBACK_MS)
        sentinel.scrollIntoView({ block: 'start' })
    }

    function onPointerMove(e: PointerEvent<HTMLDivElement>) {
        if (!tilt || still || e.pointerType !== 'mouse') return
        const stage = stageRef.current
        if (!stage) return
        const { clientX, clientY } = e
        if (tiltFrame.current !== null) return
        tiltFrame.current = requestAnimationFrame(() => {
            tiltFrame.current = null
            const r = stage.getBoundingClientRect()
            const x = (clientX - r.left) / r.width - 0.5
            const y = (clientY - r.top) / r.height - 0.5
            stage.style.setProperty('--scroll-story-tilt-y', `${(x * 2 * TILT_DEG).toFixed(2)}deg`)
            stage.style.setProperty('--scroll-story-tilt-x', `${(-y * 2 * TILT_DEG).toFixed(2)}deg`)
        })
    }
    function onPointerLeave() {
        const stage = stageRef.current
        if (!stage) return
        stage.style.removeProperty('--scroll-story-tilt-x')
        stage.style.removeProperty('--scroll-story-tilt-y')
    }

    const Heading = `h${headingLevel}` as ElementType
    const StepHeading = `h${headingLevel + 1}` as ElementType
    const timelines = steps.map((_, i) => `--scroll-story-${i}`).join(', ')

    return (
        <div
            ref={rootRef}
            className={cn('scroll-story', className)}
            data-testid={testId}
            data-still={still ? 'true' : undefined}
            data-indicator={indicator}
            style={{ '--scroll-story-steps': steps.length, timelineScope: timelines, ...style } as CSSProperties}
        >
            <Heading className="scroll-story-sr">{label}</Heading>
            <div className="scroll-story-pin">
                <div className="scroll-story-bar">
                    <div className="scroll-story-chips" role="group" aria-label={label}>
                        {steps.map((s, i) => (
                            <button
                                key={s.id}
                                type="button"
                                className="scroll-story-chip"
                                aria-current={i === active ? 'step' : undefined}
                                data-done={i < active ? 'true' : undefined}
                                data-testid={testId ? `${testId}-tab-${s.id}` : undefined}
                                onClick={() => go(i)}
                            >
                                {s.label}
                                <span className="scroll-story-rail" aria-hidden="true">
                                    <span
                                        className="scroll-story-fill"
                                        style={{ animationTimeline: `--scroll-story-${i}` } as CSSProperties}
                                    />
                                </span>
                            </button>
                        ))}
                    </div>
                    {indicator === 'chips' ? (
                        <p className="scroll-story-count" aria-hidden="true" data-testid={testId ? `${testId}-count` : undefined}>
                            {formatCount(active + 1, steps.length)}
                            {hint !== null ? (
                                <span
                                    className="scroll-story-hint"
                                    data-hidden={active > 0 ? 'true' : undefined}
                                    data-testid={testId ? `${testId}-hint` : undefined}
                                >
                                    {hint}
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M12 5v14" />
                                        <path d="M6 13l6 6 6-6" />
                                    </svg>
                                </span>
                            ) : null}
                        </p>
                    ) : null}
                </div>
                <div
                    ref={stageRef}
                    className="scroll-story-stage"
                    data-tilt={tilt && !still ? 'true' : undefined}
                    onPointerMove={tilt ? onPointerMove : undefined}
                    onPointerLeave={tilt ? onPointerLeave : undefined}
                >
                    {steps.map((s, i) => {
                        const phase: ScrollStoryPhase =
                            i === active ? (prev === null ? 'active' : 'enter') : i === prev ? 'prev' : 'idle'
                        return (
                            /* One step: its heading and caption, then its
                               stage. The wrapper is display: contents, so
                               every stage shares one cell and every caption
                               another (scroll-story.css). */
                            <div key={s.id} className="scroll-story-screen">
                                <div className="scroll-story-caption" data-active={i === active ? 'true' : undefined}>
                                    <StepHeading className="scroll-story-sr">{s.label}</StepHeading>
                                    {s.caption ? (
                                        <p
                                            className="scroll-story-line"
                                            data-testid={testId && i === active ? `${testId}-line` : undefined}
                                        >
                                            {s.caption}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="scroll-story-shot" data-phase={phase}>
                                    {i === 0 || warm || i === active ? s.render({ phase, index: i }) : null}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            {steps.map((s, i) => (
                <div
                    key={s.id}
                    ref={(el) => {
                        sentinels.current[i] = el
                    }}
                    className="scroll-story-step"
                    data-step={i}
                    aria-hidden="true"
                    style={{ '--scroll-story-k': i, viewTimelineName: `--scroll-story-${i}` } as CSSProperties}
                />
            ))}
        </div>
    )
}
