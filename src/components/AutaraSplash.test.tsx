import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { AutaraSplash } from './AutaraSplash'

/**
 * What AutaraSplash promises, on the DOM and in its stylesheet. jsdom has no
 * media queries and no animation, so the motion contract is read from
 * `utilities/splash.css` itself.
 */

const CSS = readFileSync(resolve(process.cwd(), 'src/utilities/splash.css'), 'utf8')
const CODE = CSS.replace(/\/\*[\s\S]*?\*\//g, '')
const INDEX = readFileSync(resolve(process.cwd(), 'src/utilities/index.css'), 'utf8')

function mediaBlock(query: string): string {
    const start = CODE.indexOf(`@media (${query})`)
    expect(start, `no @media (${query}) block`).toBeGreaterThanOrEqual(0)
    let depth = 0
    for (let i = CODE.indexOf('{', start); i < CODE.length; i++) {
        if (CODE[i] === '{') depth++
        else if (CODE[i] === '}' && --depth === 0) return CODE.slice(start, i)
    }
    throw new Error('unbalanced')
}

describe('AutaraSplash', () => {
    it('is a status named "Loading" by default', () => {
        render(<AutaraSplash />)
        expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    })

    it('hides from assistive tech when decorative', () => {
        const { container } = render(<AutaraSplash decorative />)
        expect(screen.queryByRole('status')).toBeNull()
        expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    })

    it('draws eight rays, each a base and a lit copy, and the ring', () => {
        const { container } = render(<AutaraSplash decorative />)
        expect(container.querySelectorAll('.autara-splash-ray')).toHaveLength(8)
        expect(container.querySelectorAll('.autara-splash-ray-base')).toHaveLength(8)
        expect(container.querySelectorAll('.autara-splash-ray-lit')).toHaveLength(8)
        expect(container.querySelectorAll('.autara-splash-ring')).toHaveLength(1)
    })

    // AUTM-2042 (2026-11-08): an animation on an SVG child runs on the main
    // thread, so a cold start's long task froze the rays mid-flight.
    it('draws every moving part as an HTML layer, never an SVG child', () => {
        const { container } = render(<AutaraSplash decorative />)
        const moving = container.querySelectorAll(
            '.autara-splash-rays, .autara-splash-ray, .autara-splash-ray-drift, .autara-splash-ray-base, .autara-splash-ray-lit, .autara-splash-ring'
        )
        expect(moving).toHaveLength(1 + 8 * 4 + 1)
        for (const el of moving) expect(el.tagName, el.className).toBe('SPAN')
        expect(container.querySelectorAll('svg [class]')).toHaveLength(0)
        // The turn is the subtree's first animation, before any ray's.
        expect(container.querySelector('.autara-splash-frame')?.firstElementChild).toHaveClass('autara-splash-rays')
    })

    it('names each ray by the way it drifts, clockwise from the top', () => {
        const { container } = render(<AutaraSplash decorative />)
        const rays = [...container.querySelectorAll<HTMLElement>('.autara-splash-ray')]
        expect(rays.map((r) => r.dataset.ray)).toEqual(['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'])
        expect(rays.map((r) => r.style.getPropertyValue('--i'))).toEqual(['0', '1', '2', '3', '4', '5', '6', '7'])
    })

    it('places its layers from its own stylesheet, so it draws without Tailwind', () => {
        expect(CODE).toMatch(/\.autara-splash\s*\{[^}]*display:\s*inline-flex/)
        expect(CODE).toMatch(/\.autara-splash-frame\s*\{[^}]*position:\s*relative[^}]*width:\s*100%[^}]*height:\s*100%/)
        expect(CODE).toMatch(/\.autara-splash-ray-lit,\s*\.autara-splash-ring\s*\{[^}]*position:\s*absolute[^}]*inset:\s*0/)
        expect(CODE).toMatch(/\.autara-splash-frame svg\s*\{[^}]*width:\s*100%[^}]*height:\s*100%/)
    })

    it('keeps every keyframe free of var(), and every ray moves along its own direction', () => {
        const keyframes = CODE.match(/@keyframes[^{]+\{[\s\S]*?\n\}/g) ?? []
        for (const k of keyframes) expect(k).not.toContain('var(')
        // 94 of the 500 units for the settle, 12.5 for the drift; 0.7071 each way on a diagonal.
        const D = 0.7071
        const dirs: Record<string, [number, number]> = {
            n: [0, -1], ne: [D, -D], e: [1, 0], se: [D, D], s: [0, 1], sw: [-D, D], w: [-1, 0], nw: [-D, -D],
        }
        const vector = (name: string) => {
            const body = keyframes.find((k) => k.startsWith(`@keyframes ${name} `))
            expect(body, name).toBeDefined()
            const m = body!.match(/translate\((-?[\d.]+)%,\s*(-?[\d.]+)%\)/)
            return [Number(m![1]) * 5, Number(m![2]) * 5]
        }
        for (const [dir, [ux, uy]] of Object.entries(dirs)) {
            const [sx, sy] = vector(`autara-splash-settle-${dir}`)
            expect(sx).toBeCloseTo(ux * 94, 2)
            expect(sy).toBeCloseTo(uy * 94, 2)
            const [dx, dy] = vector(`autara-splash-drift-${dir}`)
            expect(dx).toBeCloseTo(ux * 12.5, 2)
            expect(dy).toBeCloseTo(uy * 12.5, 2)
            if (dir !== 'n') {
                expect(CODE).toContain(`.autara-splash-ray[data-ray='${dir}'] {\n        animation-name: autara-splash-settle-${dir};`)
                expect(CODE).toContain(
                    `.autara-splash-ray[data-ray='${dir}'] > .autara-splash-ray-drift {\n        animation-name: autara-splash-drift-${dir};`
                )
            }
        }
    })

    it('sizes in rem and defaults to the deep ground', () => {
        const { container } = render(<AutaraSplash decorative size={112} />)
        const root = container.firstElementChild as HTMLElement
        expect(root.style.width).toBe('7rem')
        expect(root).toHaveAttribute('data-on', 'deep')
    })

    it('shifts its timeline by `elapsed`, and starts at the hold without the intro', () => {
        const t0 = (el: Element | null) => (el as HTMLElement).style.getPropertyValue('--autara-splash-t0')
        expect(t0(render(<AutaraSplash decorative />).container.firstElementChild)).toBe('0ms')
        expect(t0(render(<AutaraSplash decorative elapsed={2500} />).container.firstElementChild)).toBe('-2500ms')
        expect(t0(render(<AutaraSplash decorative intro={false} />).container.firstElementChild)).toBe('-1000ms')
    })

    it('is in the published utilities', () => {
        expect(INDEX).toContain('@import "./splash.css";')
    })

    it('puts lime on deep and dark only: paper and the light theme use the accent', () => {
        expect(CODE).toMatch(/\.autara-splash\s*\{[^}]*--autara-splash-lit:\s*var\(--lime/)
        expect(CODE).toMatch(/\[data-on='paper'\][\s\S]*?--autara-splash-lit:\s*var\(--accent/)
        expect(CODE).toMatch(/\[data-theme='dark'\] \.autara-splash\[data-on='theme'\][\s\S]*?--autara-splash-lit:\s*var\(--lime/)
    })

    it('moves with transform and opacity only', () => {
        const keyframes = CODE.match(/@keyframes[^{]+\{[\s\S]*?\n\}/g) ?? []
        expect(keyframes.length).toBeGreaterThan(0)
        for (const k of keyframes) {
            const props = [...k.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1])
            for (const p of props) expect(['transform', 'opacity']).toContain(p)
        }
    })

    it('fills the hold forwards only, so it never overrides the arrival before it starts', () => {
        const motion = mediaBlock('prefers-reduced-motion: no-preference')
        for (const name of ['autara-splash-drift', 'autara-splash-glow', 'autara-splash-dim']) {
            // The fill keyword that ends this animation's shorthand (the delay
            // has a comma inside its var() fallback, so split on neither).
            const fill = motion.match(new RegExp(`${name}[\\s\\S]{0,200}?\\b(forwards|both|backwards)\\b`))?.[1]
            expect(fill, name).toBe('forwards')
        }
    })

    it('under reduced motion keeps only the glow, restated past the global clamp', () => {
        const reduce = mediaBlock('prefers-reduced-motion: reduce')
        expect(reduce).toContain('autara-splash-glow')
        expect(reduce).not.toMatch(/autara-splash-(settle|turn|ring|drift)/)
        expect(reduce).toMatch(/animation-duration:\s*1800ms !important/)
        expect(reduce).toMatch(/animation-iteration-count:\s*infinite !important/)
    })
})
