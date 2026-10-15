import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/* AUTM-1739, AUTM-1756: the scrollbar rules are CSS only, so these hold the
   contract the story shows: brand thumb from tokens, a drawn rounded thumb in
   Blink and WebKit, the standard properties only where those are absent,
   shown on hover, focus and while scrolling, nothing under forced colours or
   for a finger, and nothing hidden. */
const rules = readFileSync(join(__dirname, 'scrollbars.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const tokens = readFileSync(join(__dirname, '..', 'tokens', 'scrollbar.css'), 'utf8')

/** The body of the first `@supports <cond> {` block, by brace matching. */
function block(src: string, opener: RegExp): string {
    const m = opener.exec(src)
    if (!m) return ''
    let depth = 0
    for (let i = m.index + m[0].length - 1; i < src.length; i++) {
        if (src[i] === '{') depth++
        else if (src[i] === '}') {
            depth--
            if (depth === 0) return src.slice(m.index + m[0].length, i)
        }
    }
    return ''
}

const webkit = block(rules, /@supports selector\(::-webkit-scrollbar\)\s*\{/)
const standard = block(rules, /@supports not selector\(::-webkit-scrollbar\)\s*\{/)

describe('scrollbars', () => {
    it('are in the base layer, so a consumer rule still wins', () => {
        expect(rules).toMatch(/@layer base\s*\{/)
    })

    it('AUTM-1756: the thumb is the brand, from --accent, 3:1 or better where it shows', () => {
        expect(tokens).toMatch(/--scrollbar-thumb:\s*color-mix\(in srgb, var\(--accent\) 60%, transparent\);/)
        expect(tokens).toMatch(/--scrollbar-thumb-hover:\s*color-mix\(in srgb, var\(--accent\) 80%, transparent\);/)
        expect(tokens).not.toMatch(/--scrollbar-thumb:\s*color-mix\(in srgb, var\(--text-strong\)/)
    })

    it('re-declare the tokens on a themed island', () => {
        expect(tokens).toMatch(/:root,\s*:host,\s*\[data-theme\]\s*\{/)
    })

    it('apply only to a pointer that hovers, outside forced colours', () => {
        expect(rules).toMatch(/@media \(forced-colors: none\) and \(hover: hover\) and \(pointer: fine\)/)
    })

    it('Blink and WebKit draw a thin, rounded, inset thumb from the tokens', () => {
        expect(webkit).toMatch(/::-webkit-scrollbar\s*\{[^}]*width:\s*var\(--scrollbar-size\)/)
        expect(webkit).toMatch(/::-webkit-scrollbar-thumb\s*\{[^}]*border-radius:\s*9999px/)
        expect(webkit).toMatch(/::-webkit-scrollbar-thumb\s*\{[^}]*background-clip:\s*padding-box/)
        expect(webkit).toMatch(/::-webkit-scrollbar-thumb:hover,\s*::-webkit-scrollbar-thumb:active\s*\{[^}]*var\(--scrollbar-thumb-hover\)/)
    })

    it('never sets the standard properties where ::-webkit-scrollbar is drawn (Chromium 121+ would ignore the drawn thumb)', () => {
        expect(webkit).not.toMatch(/scrollbar-(width|color)\s*:/)
        // and outside both @supports blocks, nothing sets them either
        const outside = rules.replace(webkit, '').replace(standard, '')
        expect(outside).not.toMatch(/scrollbar-(width|color)\s*:/)
    })

    it('show on hover, on focus inside, while scrolling, and always for the page', () => {
        for (const sel of [':root', ':hover', ':focus-within', '\\[data-scrolling\\]']) {
            expect(webkit).toMatch(new RegExp(`${sel}::-webkit-scrollbar-thumb[^{]*\\{[^}]*var\\(--scrollbar-thumb\\)|${sel}::-webkit-scrollbar-thumb,`))
        }
        expect(standard).toMatch(/:root,\s*:hover,\s*:focus-within,\s*\[data-scrolling\]\s*\{\s*scrollbar-color:\s*var\(--scrollbar-thumb\) var\(--scrollbar-track\);/)
    })

    it('Firefox takes the standard properties from the same tokens', () => {
        expect(standard).toMatch(/scrollbar-width:\s*thin;/)
        expect(standard).toMatch(/scrollbar-color:\s*var\(--scrollbar-thumb\) var\(--scrollbar-track\);/)
    })

    it('leave the system scrollbars alone under forced colours', () => {
        // Every rule sits inside a forced-colors: none guard.
        const guarded = rules.match(/@media \(forced-colors: none\)/g) ?? []
        expect(guarded.length).toBe(2)
        const outside = rules.replace(/@layer base\s*\{[\s\S]*\}\s*$/, '')
        expect(outside).not.toMatch(/scrollbar/)
    })

    it('never hide a scrollbar', () => {
        expect(rules).not.toMatch(/scrollbar-width:\s*none/)
        expect(rules).not.toMatch(/display:\s*none/)
    })

    it('take a lighter purple on a brand-deep ground, on a transparent track', () => {
        expect(rules).toMatch(/\.scroll-on-deep,\s*\[data-ground="deep"\]/)
        expect(tokens).toMatch(/--scrollbar-track:\s*transparent;/)
        expect(tokens).toMatch(/--scrollbar-thumb-deep:\s*color-mix\(in srgb, var\(--brand\) \d+%, var\(--on-deep\)\);/)
    })

    it('are imported by the token and utility entry points', () => {
        const tokenIndex = readFileSync(join(__dirname, '..', 'tokens', 'index.css'), 'utf8')
        const utilIndex = readFileSync(join(__dirname, 'index.css'), 'utf8')
        expect(tokenIndex).toContain('@import "./scrollbar.css";')
        expect(utilIndex).toContain('@import "./scrollbars.css";')
        expect(utilIndex).toContain('@import "./scroll-area.css";')
        expect(utilIndex).toContain('@import "./icon-disc.css";')
    })
})

/* The thumb's contrast, measured as the token comment states it. */
describe('the brand thumb can be found (3:1 on every ground it scrolls over)', () => {
    type RGB = [number, number, number]
    const hex = (h: string): RGB => [0, 2, 4].map((i) => parseInt(h.slice(1 + i, 3 + i), 16)) as RGB
    const lin = (c: number) => {
        const s = c / 255
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    }
    const lum = ([r, g, b]: RGB) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
    const ratio = (a: RGB, b: RGB) => {
        const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
        return (hi + 0.05) / (lo + 0.05)
    }
    const mix = (fg: RGB, bg: RGB, a: number): RGB => fg.map((c, i) => c * a + bg[i] * (1 - a)) as RGB
    const share = Number(/--scrollbar-thumb:\s*color-mix\(in srgb, var\(--accent\) (\d+)%/.exec(tokens)?.[1]) / 100

    const colors = readFileSync(join(__dirname, '..', 'tokens', 'colors.css'), 'utf8')
    const split = colors.search(/^\[data-theme="dark"\] \{/m)
    const token = (name: string, theme: 'light' | 'dark'): RGB => {
        const src = theme === 'light' ? colors.slice(0, split) : colors.slice(split)
        const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6});`).exec(src)
        if (!m) throw new Error(`--${name} in ${theme}`)
        return hex(m[1])
    }

    it.each([
        ['light', 'paper'],
        ['light', 'band'],
        ['light', 'raised'],
        ['dark', 'paper'],
        ['dark', 'band'],
        ['dark', 'raised'],
    ] as const)('%s, on %s', (theme, ground) => {
        const g = token(ground, theme)
        const r = ratio(mix(token('accent', theme), g, share), g)
        expect(r, `${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(3)
    })
})
