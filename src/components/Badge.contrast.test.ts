import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * AUTM-1812: the quiet count (`count-quiet`) reads in both themes.
 *
 * It painted `--brand-deep` text, which is #2e1070 in light AND dark, so on
 * dark paper (#0e0a1a) the number measured about 1.4:1: the merchant portal's
 * Services filter chips showed blank discs in dark mode. Text-grade purple is
 * `--accent`, which flips with the theme (workspace rule: never the literal
 * brand hex for text on dark).
 *
 * Measured from the real files: the variant's own class string in Badge.tsx
 * and the token values in colors.css, so a change to either is caught.
 */

const COLORS = readFileSync(resolve(process.cwd(), 'src/tokens/colors.css'), 'utf8')
const BADGE = readFileSync(resolve(process.cwd(), 'src/components/Badge.tsx'), 'utf8')

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
/** Split at the dark block's selector, anchored at column 0 so prose mentions in comments do not count. */
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

/** The fill and ink tokens of one variant, read from its class string in Badge.tsx. */
function variantTokens(variant: string): { fill: string; ink: string } {
    const line = new RegExp(`'${variant}':\\s*\`([^\`]+)\``).exec(BADGE)
    if (!line) throw new Error(`variant ${variant} not found in Badge.tsx`)
    const fill = /bg-\[var\(--([a-z0-9-]+)\)\]/.exec(line[1])
    const ink = /text-\[var\(--([a-z0-9-]+)\)\]/.exec(line[1])
    if (!fill || !ink) throw new Error(`variant ${variant} has no var() fill or ink`)
    return { fill: fill[1], ink: ink[1] }
}

describe('Badge count-quiet: readable in both themes (AUTM-1812)', () => {
    const { fill, ink } = variantTokens('count-quiet')

    it('uses text-grade purple, not a static ink', () => {
        expect(ink).toBe('accent')
        expect(ink).not.toBe('brand-deep')
    })

    for (const theme of ['light', 'dark'] as Theme[]) {
        it(`clears ${AA_BODY}:1 for its number on its fill in ${theme}`, () => {
            const ratio = contrast(token(ink, theme), token(fill, theme))
            expect(ratio).toBeGreaterThanOrEqual(AA_BODY)
        })
    }

    it('would have failed in dark with the old ink (the regression this pins)', () => {
        expect(contrast(token('brand-deep', 'dark'), token(fill, 'dark'))).toBeLessThan(AA_BODY)
    })
})
