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
