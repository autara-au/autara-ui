import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * AUTM-1792: every floating surface lifts off the page.
 *
 * Don, 2026-10-09, on the merchant portal: "there's no shadow or something
 * here when open the menu, fix it". A menu, popover or select list portals
 * over whatever the consumer has on the page, usually paper on paper, so it
 * needs its own edge and lift. A source scan, like `motion-classes.test.ts`,
 * because jsdom has no stylesheet: a render assertion would pass while the
 * real panel melted into the page. The pixels are in the AUTM-1792 PR.
 */

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8')
const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

describe('floating surfaces carry the lift', () => {
    it.each([
        'DropdownMenu.tsx',
        'Select.tsx',
        'PhoneInput.tsx',
        'Popover.tsx',
        'MultiSelect.tsx',
        'AccountMenu.tsx',
    ])('%s puts .floating-surface on its panel', (file) => {
        expect(code(read(`src/components/${file}`))).toContain('floating-surface')
    })

    it.each(['Tooltip.tsx', 'Toast.tsx'])('%s, a capsule with no edge to firm, takes shadow-float', (file) => {
        expect(code(read(`src/components/${file}`))).toContain('shadow-float')
    })

    it('a panel does not also set its own hairline colour, which would hide the class edge behind a utility', () => {
        const dropdown = code(read('src/components/DropdownMenu.tsx'))
        expect(dropdown).not.toMatch(/const SURFACE[\s\S]*?border-\[var\(--border-subtle\)\][\s\S]*?\)/)
    })
})

describe('the lift itself', () => {
    const shadows = code(read('src/tokens/shadows.css'))
    const glass = code(read('src/utilities/glass.css'))

    it('defines the edge and the shadow in both themes', () => {
        // AUTM-1800: the light block also scopes a light island, `[data-theme="light"]`.
        const light = /:root,\s*:host(?:,\s*\[data-theme="light"\])?\s*\{([^}]*)\}/.exec(shadows)?.[1] ?? ''
        const dark = /\[data-theme="dark"\]\s*\{([^}]*)\}/.exec(shadows)?.[1] ?? ''
        for (const block of [light, dark]) {
            expect(block).toContain('--float-edge')
            expect(block).toContain('--float-shadow')
        }
    })

    it('is tinted, never black (the Unified Design System rule)', () => {
        const values = [...shadows.matchAll(/--float-shadow:([^;]+);/g)].map((m) => m[1])
        expect(values).toHaveLength(2)
        for (const v of values) {
            expect(v).not.toMatch(/rgba?\(\s*0\s*,\s*0\s*,\s*0\b/)
            expect(v).not.toMatch(/#000\b|#000000\b|\bblack\b/)
        }
    })

    it('keeps every in-page shadow token at none', () => {
        for (const name of ['card', 'card-hover', 'cta', 'autara', 'autara-md', 'autara-lg']) {
            expect(shadows).toMatch(new RegExp(`--shadow-${name}:\\s*none;`))
        }
    })

    it('is declared after .glass-surface, so it wins on a glass Popover', () => {
        expect(glass.indexOf('.floating-surface {')).toBeGreaterThan(glass.indexOf('.glass-surface {'))
    })

    it('keeps the glass inset highlight and drops the shadow under forced colours', () => {
        const rule = /\.floating-surface \{([^}]*)\}/.exec(glass)?.[1] ?? ''
        expect(rule).toContain('inset 0 1px 0 var(--glass-hi)')
        expect(rule).toContain('var(--float-shadow)')
        expect(glass).toMatch(/@media \(forced-colors: active\)\s*\{\s*\.floating-surface\s*\{\s*box-shadow: none;/)
    })
})
