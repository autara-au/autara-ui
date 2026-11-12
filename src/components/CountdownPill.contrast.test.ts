import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * AUTM-1819: the countdown pill's label stays at 4.5:1 through the breathe.
 *
 * `.motion-breathe-soft` takes the whole pill (fill AND label) down to its
 * trough opacity and back, so for that moment both are blended with whatever
 * the pill sits on. This composites each tone's fill and ink at the trough
 * over paper, band and raised, in both themes, and measures the label. The
 * trough is read out of animations.css, the tones out of Badge.tsx (through
 * CountdownPill's mapping) and the colours out of colors.css, so a change to
 * any of them is caught here.
 */
const COLORS = readFileSync(resolve(process.cwd(), 'src/tokens/colors.css'), 'utf8')
const BADGE = readFileSync(resolve(process.cwd(), 'src/components/Badge.tsx'), 'utf8')
const PILL = readFileSync(resolve(process.cwd(), 'src/components/CountdownPill.tsx'), 'utf8')
const MOTION = readFileSync(resolve(process.cwd(), 'src/utilities/animations.css'), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    ''
)

const AA_BODY = 4.5
type RGB = [number, number, number]
type Theme = 'light' | 'dark'

function srgbToLinear(c: number): number {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
function luminance([r, g, b]: RGB): number {
    return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}
function contrast(a: RGB, b: RGB): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
}
function hex(h: string): RGB {
    const v = h.replace('#', '')
    return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16)) as RGB
}
function over(top: RGB, alpha: number, ground: RGB): RGB {
    return top.map((c, i) => Math.round(c * alpha + ground[i] * (1 - alpha))) as RGB
}
function scope(theme: Theme): string {
    const split = COLORS.search(/^:root\[data-theme="dark"\],?\s*$/m)
    if (split < 0) throw new Error('dark selector not found: did colors.css move?')
    return theme === 'light' ? COLORS.slice(0, split) : COLORS.slice(split)
}
function token(name: string, theme: Theme): RGB {
    const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(scope(theme))
    if (!m) throw new Error(`--${name} not found as a hex in the ${theme} scope`)
    return hex(m[1])
}
function variantTokens(variant: string): { fill: string; ink: string } {
    const line = new RegExp(`\\b${variant}:\\s*\`([^\`]+)\``).exec(BADGE)
    if (!line) throw new Error(`variant ${variant} not found in Badge.tsx`)
    const fill = /bg-\[var\(--([a-z0-9-]+)\)\]/.exec(line[1])
    const ink = /text-\[var\(--([a-z0-9-]+)\)\]/.exec(line[1])
    if (!fill || !ink) throw new Error(`variant ${variant} has no var() fill or ink`)
    return { fill: fill[1], ink: ink[1] }
}

const trough = (() => {
    const kf = /@keyframes autara-breathe-soft \{([\s\S]*?)\n\}/.exec(MOTION)
    if (!kf) throw new Error('autara-breathe-soft not found')
    const values = [...kf[1].matchAll(/opacity:\s*([\d.]+)/g)].map((m) => Number(m[1]))
    return Math.min(...values)
})()

const variants = (() => {
    const map = /const VARIANT = \{([\s\S]*?)\}/.exec(PILL)
    if (!map) throw new Error('VARIANT map not found in CountdownPill.tsx')
    return [...map[1].matchAll(/(\w+):\s*'(\w+)'/g)].map((m) => ({ tone: m[1], variant: m[2] }))
})()

describe('CountdownPill: the label reads through the breathe (AUTM-1819)', () => {
    it('finds the trough and the three tones', () => {
        expect(trough).toBeGreaterThan(0)
        expect(trough).toBeLessThan(1)
        expect(variants.map((v) => v.tone)).toEqual(['calm', 'amber', 'red'])
    })

    for (const { tone, variant } of variants) {
        for (const theme of ['light', 'dark'] as Theme[]) {
            for (const ground of ['paper', 'band', 'raised']) {
                it(`${tone} (${variant}) on ${ground} in ${theme}: at rest and at the trough`, () => {
                    const { fill, ink } = variantTokens(variant)
                    const g = token(ground, theme)
                    const f = token(fill, theme)
                    const t = token(ink, theme)
                    expect(contrast(t, f)).toBeGreaterThanOrEqual(AA_BODY)
                    expect(contrast(over(t, trough, g), over(f, trough, g))).toBeGreaterThanOrEqual(AA_BODY)
                })
            }
        }
    }
})
