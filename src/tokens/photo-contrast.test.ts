import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * AUTM-1882: what the photo components draw on a photo reads on ANY photo.
 * A photo can be pure white or pure black, so every pair is measured over
 * both, with --photo-scrim between: the remove disc's cross, the words and
 * the aqua upload ring on a tile, and the viewer's previous and next. The
 * tiles with no photo (refused, erased) put their words on band, and the
 * viewer's stage is --ink. Both themes, read from the token file.
 */

const CSS = readFileSync(resolve(process.cwd(), 'src/tokens/colors.css'), 'utf8')

type RGB = [number, number, number]
type Theme = 'light' | 'dark'

const lin = (c: number) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const luminance = ([r, g, b]: RGB) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const over = (fg: RGB, a: number, bg: RGB) => bg.map((c, i) => c + a * (fg[i] - c)) as RGB
const contrast = (a: RGB, b: RGB) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
}
const hex = (h: string) => [0, 2, 4].map((i) => parseInt(h.slice(1 + i, 3 + i), 16)) as RGB

function token(name: string, theme: Theme): { rgb: RGB; alpha: number } {
    const split = CSS.search(/^\[data-theme="dark"\] \{/m)
    if (split < 0) throw new Error('dark selector not found')
    // The dark block overrides; a token it does not declare is inherited from light.
    const scopes = theme === 'light' ? [CSS.slice(0, split)] : [CSS.slice(split), CSS.slice(0, split)]
    for (const scope of scopes) {
        const rgba = new RegExp(`--${name}:\\s*rgba\\(([^)]+)\\)`).exec(scope)
        if (rgba) {
            const [r, g, b, a] = rgba[1].split(',').map((n) => Number(n.trim()))
            return { rgb: [r, g, b], alpha: a }
        }
        const solid = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6});`).exec(scope)
        if (solid) return { rgb: hex(solid[1]), alpha: 1 }
    }
    throw new Error(`--${name} not found in ${theme}`)
}

const solid = (name: string, theme: Theme): RGB => {
    const t = token(name, theme)
    if (t.alpha !== 1) throw new Error(`--${name} is translucent`)
    return t.rgb
}

const WHITE: RGB = [255, 255, 255]
const BLACK: RGB = [0, 0, 0]

/** The scrim laid over a photo of colour `photo`. */
function scrimOver(photo: RGB, theme: Theme): RGB {
    const scrim = token('photo-scrim', theme)
    return over(scrim.rgb, scrim.alpha, photo)
}

describe('photo tokens', () => {
    for (const theme of ['light', 'dark'] as const) {
        for (const [name, photo] of [
            ['white', WHITE],
            ['black', BLACK],
        ] as const) {
            it(`${theme}: --on-photo reads at 4.5:1 on the scrim over a ${name} photo`, () => {
                expect(contrast(solid('on-photo', theme), scrimOver(photo, theme))).toBeGreaterThanOrEqual(4.5)
            })
            it(`${theme}: the aqua upload ring shows at 3:1 on the scrim over a ${name} photo`, () => {
                expect(contrast(solid('aqua', theme), scrimOver(photo, theme))).toBeGreaterThanOrEqual(3)
            })
        }

        for (const [name, photo] of [
            ['white', WHITE],
            ['black', BLACK],
        ] as const) {
            it(`${theme}: a control's glyph reads at 4.5:1 on the photo disc over a ${name} photo`, () => {
                const disc = token('photo-disc', theme)
                expect(contrast(solid('on-photo', theme), over(disc.rgb, disc.alpha, photo))).toBeGreaterThanOrEqual(4.5)
            })
        }

        // The IconButton floor (IconButton.colour.test.ts): the disc must read as
        // a filled circle where there is no photo behind it.
        for (const ground of ['ink', 'band', 'paper']) {
            it(`${theme}: the photo disc shows as a disc on --${ground}`, () => {
                const disc = token('photo-disc', theme)
                const g = solid(ground, theme)
                expect(contrast(over(disc.rgb, disc.alpha, g), g)).toBeGreaterThanOrEqual(1.2)
            })
        }

        it(`${theme}: the scrim is the same in both themes, because the photo is`, () => {
            expect(token('photo-scrim', theme)).toEqual(token('photo-scrim', 'light'))
            expect(token('on-photo', theme)).toEqual(token('on-photo', 'light'))
            expect(token('photo-disc', theme)).toEqual(token('photo-disc', 'light'))
        })

        it(`${theme}: the viewer's words and controls read on its --ink stage`, () => {
            expect(contrast(solid('on-photo', theme), solid('ink', theme))).toBeGreaterThanOrEqual(4.5)
        })

        // A refused or erased tile has no photo: its words sit on band.
        for (const fg of ['text-strong', 'text-muted', 'text-subtle', 'danger']) {
            it(`${theme}: --${fg} reads on band, a tile with no photo`, () => {
                const f = token(fg, theme)
                const band = solid('band', theme)
                expect(contrast(over(f.rgb, f.alpha, band), band)).toBeGreaterThanOrEqual(4.5)
            })
        }
    }

    it('records the measured figures the token comment quotes', () => {
        const text = contrast(solid('on-photo', 'light'), scrimOver(WHITE, 'light'))
        const ring = contrast(solid('aqua', 'light'), scrimOver(WHITE, 'light'))
        expect(text.toFixed(1)).toBe('8.0')
        expect(ring.toFixed(1)).toBe('5.6')
    })
})
