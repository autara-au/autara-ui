import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * AUTM-1719: buttons keep their real colour when disabled and busy, so the
 * colour a person sees in those states is the resting colour, and it has to
 * READ. WCAG exempts a disabled control from contrast; Autara no longer
 * mutes it, so this holds every variant's label to 4.5:1 on its own fill in
 * light and dark, which is now also the disabled and busy contrast. The busy
 * mark is drawn in the label colour, so it inherits the same ratio.
 *
 * Read from the token files and social.css, so a token change that breaks a
 * label fails here.
 */

type RGB = [number, number, number]
type Theme = 'light' | 'dark'

const COLORS = readFileSync(resolve(process.cwd(), 'src/tokens/colors.css'), 'utf8')
const SOCIAL = readFileSync(resolve(process.cwd(), 'src/utilities/social.css'), 'utf8')
const BUTTON = readFileSync(resolve(process.cwd(), 'src/components/Button.tsx'), 'utf8')

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
function hex(h: string): RGB {
    const v = h.replace('#', '')
    return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16)) as RGB
}
/** `fg` at `alpha` over an opaque `bg`. */
function over(fg: RGB, alpha: number, bg: RGB): RGB {
    return fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha))) as RGB
}

/** Light is everything before the column-0 dark block (see solid-emphasis.test.ts for why). */
function scope(theme: Theme): string {
    const split = COLORS.search(/^\[data-theme="dark"\] \{/m)
    expect(split, 'dark block not found').toBeGreaterThan(0)
    return theme === 'light' ? COLORS.slice(0, split) : COLORS.slice(split)
}
function token(name: string, theme: Theme): RGB {
    const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6});`).exec(scope(theme))
    if (!m) throw new Error(`--${name} is not an opaque hex in ${theme}`)
    return hex(m[1])
}

const AA = 4.5
const THEMES: Theme[] = ['light', 'dark']

/** Each sheet variant: its label, and the fill it sits on (its own, or the page). */
const VARIANTS: [string, string, (t: Theme) => RGB][] = [
    ['primary', 'on-lime', (t) => token('lime', t)],
    ['quiet', 'text-strong', (t) => token('band', t)],
    // AUTM-1838: the destructive action, red words on band, and on its hover.
    ['danger', 'danger', (t) => token('band', t)],
    ['danger (hover)', 'danger', (t) => token('band-press', t)],
    ['ghost', 'text-strong', (t) => token('background', t)],
    ['link', 'accent', (t) => token('background', t)],
    // Translucent white over the brand-deep hero it is drawn for.
    ['ondeep', 'on-deep', (t) => over([255, 255, 255], 0.14, token('hero', t))],
]

describe('Button: every variant label reads on its fill, which is now also its disabled and busy colour', () => {
    it('the variant table above is still what Button.tsx draws', () => {
        expect(BUTTON).toContain('bg-[var(--lime)] text-[var(--on-lime)]')
        expect(BUTTON).toContain('bg-[var(--band)] text-[var(--danger)]')
        // AUTM-1838: no black buttons. `strong` is a name for primary.
        expect(BUTTON).not.toContain('bg-[var(--strong)]')
        expect(BUTTON).toContain('bg-[var(--band)] text-[var(--text-strong)]')
        expect(BUTTON).toContain('bg-[rgba(255,255,255,0.14)] text-[var(--on-deep)]')
        expect(BUTTON).toContain('text-[var(--accent)]')
    })

    for (const theme of THEMES) {
        it.each(VARIANTS)(`${theme}: %s label (--%s) is at least 4.5:1 on its fill`, (_v, ink, fill) => {
            const r = ratio(token(ink, theme), fill(theme))
            expect(r, `${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA)
        })
    }
})

describe('SocialButton: provider colours read, and nothing mutes them', () => {
    it('no opacity on the disabled or busy rules', () => {
        const code = SOCIAL.replace(/\/\*[\s\S]*?\*\//g, '')
        const rules = [...code.matchAll(/([^{}]*(?::disabled|aria-busy)[^{]*)\{([^}]*)\}/g)]
        expect(rules.length).toBeGreaterThan(0)
        for (const [, sel, body] of rules) expect(body, sel.trim()).not.toMatch(/opacity|filter/)
    })

    // Each provider's text on its fill, from social.css. Mobile dark is
    // transparent, so it is measured on the dark page.
    it.each([
        ['google light', '#1f1f1f', '#ffffff'],
        ['google dark', '#e3e3e3', '#131314'],
        ['apple light', '#ffffff', '#000000'],
        ['apple dark', '#000000', '#ffffff'],
        ['mobile light', '#0e0a1a', '#ffffff'],
        ['mobile dark', '#ffffff', '#0e0a1a'],
    ])('%s is at least 4.5:1', (_name, ink, fill) => {
        expect(SOCIAL.toLowerCase()).toContain(ink)
        expect(ratio(hex(ink), hex(fill))).toBeGreaterThanOrEqual(AA)
    })
})
