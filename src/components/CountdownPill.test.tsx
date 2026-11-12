import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render } from '@testing-library/react'
import { badgeVariants } from './Badge'
import { cn } from '../lib/cn'
import { CountdownPill, countdownPillVariant } from './CountdownPill'

/**
 * AUTM-1819: the countdown pill on the merchant portal's Today requests and
 * the booking record. The fills are Badge's sheet tones (their contrast is
 * palette-contrast.test.ts's; the breathing trough is
 * CountdownPill.contrast.test.ts's). These pin the mapping, the markup and
 * the motion classes.
 */
const CSS = readFileSync(resolve(process.cwd(), 'src/utilities/animations.css'), 'utf8')
const CODE = CSS.replace(/\/\*[\s\S]*?\*\//g, '')

describe('CountdownPill', () => {
    it.each([
        ['calm', 'brand'],
        ['amber', 'amber'],
        ['red', 'danger'],
    ] as const)('%s draws with the %s Badge tone', (tone, variant) => {
        expect(countdownPillVariant(tone)).toBe(variant)
        const root = render(<CountdownPill tone={tone}>6 h 51 min left</CountdownPill>).container.firstElementChild!
        const fill = root.firstElementChild!
        // Through cn(), as Badge itself renders it (tailwind-merge drops the
        // base leading for the pill's own text size).
        // It swaps out two: `transition-colors` (transition-none) and
        // `whitespace-nowrap` (it wraps inside the fill at large text).
        const swapped = ['transition-colors', 'whitespace-nowrap']
        for (const cls of cn(badgeVariants({ variant })).split(' ').filter((c) => !swapped.includes(c))) {
            expect(fill.classList.contains(cls), cls).toBe(true)
        }
        expect(root.getAttribute('data-tone')).toBe(tone)
        expect(root.textContent).toBe('6 h 51 min left')
    })

    it('is calm (purple) by default', () => {
        const root = render(<CountdownPill>2 h left</CountdownPill>).container.firstElementChild!
        expect(root.getAttribute('data-tone')).toBe('calm')
    })

    it('is phrasing content, so it can sit inside a button row', () => {
        const { container } = render(
            <button type="button">
                <CountdownPill>12 min left</CountdownPill>
            </button>
        )
        expect(container.querySelector('button div')).toBeNull()
        expect(container.querySelectorAll('button span').length).toBe(2)
    })

    it('pops in on mount by default, and can be told not to', () => {
        const on = render(<CountdownPill>1 h left</CountdownPill>).container.firstElementChild!
        expect(on.classList.contains('motion-badge-in')).toBe(true)
        const off = render(<CountdownPill pop={false}>1 h left</CountdownPill>).container.firstElementChild!
        expect(off.classList.contains('motion-badge-in')).toBe(false)
    })

    it('breathes only when asked, on the fill, never on the root that pops', () => {
        const still = render(<CountdownPill tone="red">29 min left</CountdownPill>).container.firstElementChild!
        expect(still.querySelector('.motion-breathe-soft')).toBeNull()
        expect(still.hasAttribute('data-breathing')).toBe(false)

        const breathing = render(
            <CountdownPill tone="red" breathe>
                29 min left
            </CountdownPill>
        ).container.firstElementChild!
        expect(breathing.classList.contains('motion-breathe-soft')).toBe(false)
        expect(breathing.firstElementChild!.classList.contains('motion-breathe-soft')).toBe(true)
        expect(breathing.getAttribute('data-breathing')).toBe('true')
    })

    it('does not cross-fade its colour on a tone change: only the pop and the breathe move', () => {
        const fill = render(<CountdownPill tone="amber">1 h left</CountdownPill>).container.firstElementChild!
            .firstElementChild!
        expect(fill.classList.contains('transition-none')).toBe(true)
        expect(fill.classList.contains('transition-colors')).toBe(false)
    })

    it('wraps inside its fill rather than past it when a line of its own is too narrow', () => {
        const root = render(<CountdownPill>23 h 59 min left</CountdownPill>).container.firstElementChild!
        const fill = root.firstElementChild!
        // The root keeps its size in a wrapping row (so it moves to a line of
        // its own first) and never outgrows its container; the fill wraps.
        expect(root.classList.contains('shrink-0')).toBe(true)
        expect(root.classList.contains('max-w-full')).toBe(true)
        expect(fill.classList.contains('max-w-full')).toBe(true)
        expect(fill.classList.contains('whitespace-normal')).toBe(true)
        expect(fill.classList.contains('whitespace-nowrap')).toBe(false)
    })

    it('passes test ids, labels and classes through to the root', () => {
        const root = render(
            <CountdownPill data-testid="today-request-countdown" aria-hidden className="ml-2">
                3 h left
            </CountdownPill>
        ).container.firstElementChild!
        expect(root.getAttribute('data-testid')).toBe('today-request-countdown')
        expect(root.getAttribute('aria-hidden')).toBe('true')
        expect(root.classList.contains('ml-2')).toBe(true)
    })
})

describe('the countdown pill motion (utilities/animations.css)', () => {
    function block(name: string): string {
        const at = CODE.indexOf(`@keyframes ${name} {`)
        expect(at, name).toBeGreaterThanOrEqual(0)
        let depth = 0
        for (let i = CODE.indexOf('{', at); i < CODE.length; i++) {
            if (CODE[i] === '{') depth++
            else if (CODE[i] === '}' && --depth === 0) return CODE.slice(at, i + 1)
        }
        throw new Error('unbalanced')
    }

    it('the arrival is a small scale-in and a fade on the house ease-out, once', () => {
        const kf = block('autara-badge-in')
        expect(kf).toContain('opacity: 0.001')
        expect(kf).toContain('scale(0.92)')
        expect(CODE).toContain('animation: autara-badge-in var(--motion-badge-in) var(--motion-ease-out) both;')
        expect(CODE).toMatch(/--motion-badge-in:\s*240ms;/)
    })

    it('the breathe is opacity only, on the breathe token, a symmetric loop with no ring', () => {
        const kf = block('autara-breathe-soft')
        expect([...kf.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]).every((p) => p === 'opacity')).toBe(true)
        expect(CODE).toContain('animation: autara-breathe-soft var(--motion-breathe) ease-in-out infinite;')
    })

    it('both move only inside prefers-reduced-motion: no-preference', () => {
        const outside = CODE.replace(
            /@media \(prefers-reduced-motion: no-preference\)[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g,
            ''
        )
        expect(outside).not.toMatch(/animation:\s*autara-badge-in/)
        expect(outside).not.toMatch(/animation:\s*autara-breathe-soft/)
    })
})
