import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * AUTM-1756 (Don, 2026-10-05 and 2026-10-15): every icon-only control is a
 * FILLED disc, never a bare glyph or a faint ring. On light grounds it is the
 * Wise pattern, a soft lavender grey disc with an ink glyph (Don, of a mid
 * grey disc with a white glyph: "too much dark on white screen"); on dark
 * grounds a disc a step lighter than the surface with a white glyph.
 *
 * WHAT IS HELD TO WHICH BAR, and why. WCAG 1.4.11 (non-text contrast) asks for
 * 3:1 on the visual information REQUIRED TO IDENTIFY a control. For an icon
 * button that information is the icon: it says the control is there and what
 * it does. The W3C's Understanding note for 1.4.11 says as much for buttons
 * whose text or icon identifies them: the fill behind it is not required to
 * meet 3:1. So:
 *
 *   - the GLYPH against its disc is held to 4.5:1 (above the 3:1 it needs,
 *     because the glyph is the one thing that says "close" or "back"), on
 *     every tone, in both themes;
 *   - the DISC against its ground is held to a VISIBILITY floor, 1.2:1, not
 *     to 3:1. It has to read as a filled circle, so a target is visible and
 *     the faint ring cannot come back, but it does not identify the control.
 *     Holding it to 3:1 is what produced the mid grey disc Don rejected.
 *
 * Hover and press are a currentColor layer over the fill (icon-disc.css), so
 * they move the disc AWAY from the glyph's colour and never toward it: the
 * glyph's contrast at rest is its floor.
 *
 * All values are read from the token file, so a token change that breaks any
 * of these fails here.
 */

type RGB = [number, number, number]
type RGBA = [number, number, number, number]
type Theme = 'light' | 'dark'

const COLORS = readFileSync(resolve(__dirname, '..', 'tokens', 'colors.css'), 'utf8')

function lin(c: number): number {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
function lum([r, g, b]: RGB): number {
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
function ratio(a: RGB, b: RGB): number {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
}
function over([r, g, b, a]: RGBA, [br, bg, bb]: RGB): RGB {
    return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a)]
}
function scope(theme: Theme): string {
    const split = COLORS.search(/^\[data-theme="dark"\] \{/m)
    expect(split, 'dark block not found').toBeGreaterThan(0)
    return theme === 'light' ? COLORS.slice(0, split) : COLORS.slice(split)
}
function raw(name: string, theme: Theme): string {
    const m = new RegExp(`--${name}:\\s*([^;]+);`).exec(scope(theme))
    if (!m) throw new Error(`--${name} is not declared in ${theme}`)
    return m[1].trim()
}
function rgba(name: string, theme: Theme): RGBA {
    const v = raw(name, theme)
    const hex = /^#([0-9a-fA-F]{6})$/.exec(v)
    if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)).concat(1) as RGBA
    const fn = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(v)
    if (fn) return [Number(fn[1]), Number(fn[2]), Number(fn[3]), Number(fn[4])]
    throw new Error(`--${name} (${v}) is not a hex or rgba() value`)
}
function token(name: string, theme: Theme): RGB {
    const [r, g, b, a] = rgba(name, theme)
    if (a !== 1) throw new Error(`--${name} is translucent; give it a ground`)
    return [r, g, b]
}

const THEMES: Theme[] = ['light', 'dark']
const GLYPH = 4.5
const VISIBLE = 1.2

describe('IconButton: the glyph identifies the control, so it is held to 4.5:1 on its disc', () => {
    for (const theme of THEMES) {
        it.each([
            ['neutral', 'icon-disc', 'on-icon-disc'],
            ['danger', 'icon-disc', 'danger'],
            ['primary', 'lime', 'on-lime'],
            ['inverse', 'icon-disc-inverse', 'on-icon-disc-inverse'],
        ])(`${theme}: %s is at least 4.5:1`, (_name, disc, glyph) => {
            const r = ratio(token(glyph, theme), token(disc, theme))
            expect(r, `${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(GLYPH)
        })

        it.each(['brand', 'brand-deep', 'hero'])(`${theme}: ondark's white glyph is 4.5:1 on its disc over %s`, (ground) => {
            const disc = over(rgba('icon-disc-ondark', theme), token(ground, theme))
            const r = ratio(token('on-icon-disc-ondark', theme), disc)
            expect(r, `${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(GLYPH)
        })
    }

    it('light: the glyph is ink, a dark glyph on a soft disc (the Wise pattern)', () => {
        expect(token('on-icon-disc', 'light')).toEqual(token('strong', 'light'))
        expect(lum(token('icon-disc', 'light'))).toBeGreaterThan(0.5)
    })

    it('dark: the glyph is white, on a disc a step lighter than raised', () => {
        expect(token('on-icon-disc', 'dark')).toEqual([255, 255, 255])
        expect(lum(token('icon-disc', 'dark'))).toBeGreaterThan(lum(token('raised', 'dark')))
    })
})

describe('IconButton: the disc is visible on its ground (1.2:1 floor, not the 3:1 bar)', () => {
    for (const theme of THEMES) {
        it.each(['paper', 'band', 'raised'])(`${theme}: the neutral disc shows on %s`, (ground) => {
            const r = ratio(token('icon-disc', theme), token(ground, theme))
            expect(r, `${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(VISIBLE)
        })
        it.each(['brand', 'brand-deep', 'hero'])(`${theme}: the ondark disc shows on %s`, (ground) => {
            const g = token(ground, theme)
            const r = ratio(over(rgba('icon-disc-ondark', theme), g), g)
            expect(r, `${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(VISIBLE)
        })
        it(`${theme}: the inverse disc shows on the inverse surface`, () => {
            const r = ratio(token('icon-disc-inverse', theme), token('surface-inverse', theme))
            expect(r, `${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(VISIBLE)
        })
    }

    it('the inverse disc is the other theme\'s disc', () => {
        expect(token('icon-disc-inverse', 'light')).toEqual(token('icon-disc', 'dark'))
        expect(token('icon-disc-inverse', 'dark')).toEqual(token('icon-disc', 'light'))
    })
})

describe('the icon disc answers hover and press with a layer, never a colour token', () => {
    const css = readFileSync(resolve(__dirname, '..', 'utilities', 'icon-disc.css'), 'utf8')
    it('the layer is the glyph colour, under the glyph, on opacity', () => {
        expect(css).toMatch(/\.icon-disc::before\s*\{[^}]*background-color:\s*currentColor/)
        expect(css).toMatch(/\.icon-disc::before\s*\{[^}]*z-index:\s*-1/)
        expect(css).toMatch(/\.icon-disc::before\s*\{[^}]*transition:\s*opacity var\(--motion-hover/)
    })
    it('hover is 8% (pointer devices only), press 14%, neither while disabled or busy', () => {
        expect(css).toMatch(/@media \(hover: hover\)\s*\{\s*\.icon-disc:hover:not\(:disabled, \[aria-disabled="true"\], \[aria-busy="true"\]\)::before\s*\{\s*opacity:\s*0\.08/)
        expect(css).toMatch(/\.icon-disc:active:not\(:disabled, \[aria-disabled="true"\], \[aria-busy="true"\]\)::before\s*\{\s*opacity:\s*0\.14/)
    })
    it('never sets the element\'s own position (a caller\'s `absolute` must win)', () => {
        const rules = css.replace(/\/\*[\s\S]*?\*\//g, '')
        expect(rules).not.toMatch(/\.icon-disc\s*\{/)
    })
})
