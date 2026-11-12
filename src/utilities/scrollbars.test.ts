import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/* AUTM-1739, AUTM-1756, AUTM-1899: the scrollbar rules are CSS only, so these
   hold the contract the story shows. With a mouse or a trackpad, nothing
   inside a page draws a bar (`scrollbar-width: none`, a zero-size
   `::-webkit-scrollbar` where that is unsupported); the page's own bar, on
   the root, keeps the brand thumb (`::-webkit-scrollbar` in Blink and WebKit,
   the standard properties in Firefox only); a finger and forced colours are
   left to the platform. scrollbars.browser.test.ts measures the same in
   Chromium. */
const rules = readFileSync(join(__dirname, 'scrollbars.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const tokens = readFileSync(join(__dirname, '..', 'tokens', 'scrollbar.css'), 'utf8')

/** The body of the first block opened by `opener` (which ends in `{`), by brace matching. */
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

const pointer = block(rules, /@media \(forced-colors: none\) and \(hover: hover\) and \(pointer: fine\)\s*\{/)
const webkit = block(rules, /@supports selector\(::-webkit-scrollbar\)\s*\{/)
const standard = block(rules, /@supports not selector\(::-webkit-scrollbar\)\s*\{/)
const fallback = block(rules, /@supports not \(scrollbar-width: none\)\s*\{/)

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
        expect(pointer).not.toBe('')
        expect(pointer).toContain(webkit)
        expect(pointer).toContain(standard)
        expect(pointer).toContain(fallback)
    })

    it('AUTM-1899: nothing inside a page draws a bar, at zero specificity', () => {
        expect(pointer).toMatch(/(^|\n)\s*:where\(:not\(:root\)\)\s*\{\s*scrollbar-width:\s*none;\s*\}/)
    })

    it('AUTM-1899: Blink and WebKit without scrollbar-width get a zero-size bar, never on <body> or the root', () => {
        expect(fallback).toMatch(/:where\(:not\(:root, body\)\)::-webkit-scrollbar\s*\{\s*width:\s*0;\s*height:\s*0;\s*\}/)
    })

    it('AUTM-1899: the page keeps its bar: nothing hides the root', () => {
        // `scrollbar-width: none` appears once, in the :where(:not(:root)) rule.
        expect(rules.match(/scrollbar-width:\s*none;/g)).toHaveLength(1)
        expect(rules).not.toMatch(/(^|[\s,{}]):root\s*\{[^}]*scrollbar-width:\s*none/)
        expect(rules).not.toMatch(/display:\s*none/)
    })

    it('Blink and WebKit draw the page a thin, rounded, inset thumb from the tokens, on the root only', () => {
        expect(webkit).toMatch(/:root::-webkit-scrollbar\s*\{[^}]*width:\s*var\(--scrollbar-size\)/)
        expect(webkit).toMatch(/:root::-webkit-scrollbar-thumb\s*\{[^}]*border-radius:\s*9999px/)
        expect(webkit).toMatch(/:root::-webkit-scrollbar-thumb\s*\{[^}]*background-clip:\s*padding-box/)
        expect(webkit).toMatch(/:root::-webkit-scrollbar-thumb\s*\{[^}]*background-color:\s*var\(--scrollbar-thumb\)/)
        expect(webkit).toMatch(
            /:root::-webkit-scrollbar-thumb:hover,\s*:root::-webkit-scrollbar-thumb:active\s*\{[^}]*var\(--scrollbar-thumb-hover\)/
        )
        // Every selector here is the root's: Chromium styles the viewport's
        // bar from <body> first when <body> has ::-webkit-scrollbar rules.
        const selectors = webkit.match(/[^{}]+(?=\{)/g) ?? []
        for (const list of selectors) {
            for (const sel of list.split(',')) expect(sel.trim()).toMatch(/^:root::-webkit-scrollbar/)
        }
    })

    it('never sets the standard properties where ::-webkit-scrollbar draws the page (Chromium 121+ would ignore the drawn thumb)', () => {
        expect(webkit).not.toMatch(/scrollbar-(width|color)\s*:/)
    })

    it('Firefox takes the standard properties on the root, from the same tokens', () => {
        expect(standard).toMatch(
            /^\s*:root\s*\{\s*scrollbar-width:\s*thin;\s*scrollbar-color:\s*var\(--scrollbar-thumb\) var\(--scrollbar-track\);\s*\}\s*$/
        )
    })

    it('AUTM-1899: the reveal is gone (nothing left to reveal)', () => {
        expect(rules).not.toMatch(/data-scrollbar-reveal|data-scrollbar-tick|data-scrolling/)
    })

    it('leave the system scrollbars alone under forced colours', () => {
        // Every rule sits inside a forced-colors: none guard.
        const guarded = rules.match(/@media \(forced-colors: none\)/g) ?? []
        expect(guarded.length).toBe(2)
        const outside = rules.replace(/@layer base\s*\{[\s\S]*\}\s*$/, '')
        expect(outside).not.toMatch(/scrollbar/)
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
