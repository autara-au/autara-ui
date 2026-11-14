import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * AUTM-2140 (Don, 2026-11-14) — the glass pill: one field family. 52px,
 * fully round, glass with a 1px top lip and no ring at rest; a hairline that
 * lights under the cursor and carries a scroll glint; focus the accent edge
 * at 75% and a faint tint with no halo; an error the danger edge at 70%.
 * Reads the stylesheet, because jsdom has none and a render assertion would
 * pass on wrong CSS.
 */
const CSS = readFileSync(resolve(process.cwd(), 'src/utilities/forms.css'), 'utf8')

function block(selector: string): string {
    const at = CSS.indexOf(`\n${selector} {`)
    if (at < 0) throw new Error(`${selector} not found`)
    return CSS.slice(at, CSS.indexOf('}', at))
}

describe('the field family (AUTM-2140, the glass pill)', () => {
    it('the tokens: 52px, the pill, 18px in, the concept glass in both themes', () => {
        const light = block(':root,\n[data-theme="light"]')
        expect(light).toContain('--field-height: 3.25rem;')
        expect(light).toContain('--field-radius: 999px;')
        expect(light).toContain('--field-pad: 1.125rem;')
        expect(light).toContain('--field-glass: rgb(255 255 255 / 0.78);')
        expect(light).toContain('--field-lip: rgb(255 255 255 / 0.9);')
        expect(light).toContain('--field-hair: transparent;')
        expect(light).toContain('--field-shine: color-mix(in srgb, var(--accent) 60%, transparent);')
        expect(light).toContain('--field-focus-edge: color-mix(in srgb, var(--accent) 75%, transparent);')
        expect(light).toContain('--field-error-edge: color-mix(in srgb, var(--danger) 70%, transparent);')
        const dark = block(':root[data-theme="dark"],\n[data-theme="dark"]')
        expect(dark).toContain('--field-glass: rgb(255 255 255 / 0.055);')
        expect(dark).toContain('--field-lip: rgb(255 255 255 / 0.06);')
        expect(dark).toContain('--field-shine: rgb(255 255 255 / 0.7);')
        expect(dark).toContain('--field-glint: rgb(255 255 255 / 0.28);')
    })

    it('the light can fade: --edge-spot is a registered colour', () => {
        expect(CSS).toMatch(/@property --edge-spot \{\s*syntax: '<color>';\s*inherits: true;/)
    })

    it('the edge is a masked 1px ring: cursor light over glint over the resting hair', () => {
        const b = block('.glass-edge::before')
        expect(b).toContain('padding: var(--field-edge-width);')
        expect(b).toContain('radial-gradient(90px circle at var(--edge-x, -999px) var(--edge-y, -999px), var(--edge-spot), transparent 70%)')
        expect(b).toContain('from var(--edge-sheen, 210deg)')
        expect(b).toContain('linear-gradient(var(--edge-ring), var(--edge-ring))')
        expect(b).toContain('mask-composite: exclude;')
        expect(b).toContain('transition: --edge-spot var(--motion-hover, 160ms) var(--motion-ease-out, ease-out);')
    })

    it('the glass: fill, blur, a 1px top lip, never a drop shadow', () => {
        const b = block('.glass-edge::after')
        expect(b).toContain('background-color: var(--edge-fill);')
        expect(b).toContain('backdrop-filter: blur(var(--field-blur)) saturate(var(--field-saturate));')
        expect(b).toContain('box-shadow: inset 0 1px 0 var(--field-lip);')
        expect(b).not.toMatch(/box-shadow:[^;]*\d+px \d+px [1-9]/)
    })

    it('focus is the accent edge and the tint, no outline, no halo', () => {
        const b = block(
            '.field-shell:focus-within,\n.field-group:focus-within,\n.field-trigger:is(:focus-visible, [aria-expanded="true"], [data-state="open"]),\n.glass-edge[data-field-focus]'
        )
        expect(b).toContain('outline: none;')
        expect(b).toContain('--edge-ring: var(--field-focus-edge);')
        expect(b).toContain('--edge-fill: var(--field-glass-focus);')
        expect(b).not.toContain('box-shadow')
    })

    it('a trigger takes the focus look from the keyboard or when open, never from a mouse focus', () => {
        expect(CSS).not.toMatch(/\.field-trigger:focus[,\s{]/)
    })

    it('an error is the danger edge, and holds while focused (declared after focus)', () => {
        const err = CSS.indexOf('--edge-ring: var(--field-error-edge);')
        const foc = CSS.indexOf('--edge-ring: var(--field-focus-edge);')
        expect(err).toBeGreaterThan(foc)
        expect(CSS).toContain('.field-trigger[aria-invalid="true"]')
    })

    it('hover steps the fill only for a hover-capable pointer, so a tap leaves nothing behind', () => {
        const at = CSS.indexOf('.glass-edge:hover')
        expect(CSS.lastIndexOf('@media (hover: hover)', at)).toBeGreaterThan(CSS.lastIndexOf('}\n}', at))
    })

    it('the bare .field-input is the same glass with the edges as inset shadows', () => {
        const b = block('.field-input')
        expect(b).toContain('height: var(--field-height);')
        expect(b).toContain('border-radius: var(--field-radius);')
        expect(b).toContain('background-color: var(--field-glass);')
        expect(b).toContain('border: 0;')
        expect(b).toContain('font-size: 1.0625rem;')
        const f = block('.field-input:focus,\n.field-input:focus-visible')
        expect(f).toContain('inset 0 0 0 var(--field-edge-width) var(--field-focus-edge)')
        expect(block('.field-input[aria-invalid="true"],\n.field-input[aria-invalid="true"]:focus,\n.field-input[aria-invalid="true"]:focus-visible')).toContain(
            'var(--field-error-edge)'
        )
        expect(block('.field-input:disabled')).toContain('opacity: 0.6;')
    })

    it('.field-textarea is the same field, 96px tall at least, the multi-line corner', () => {
        const b = block('.field-textarea')
        expect(b).toContain('min-height: 6rem;')
        expect(b).toContain('border-radius: var(--field-radius-multi);')
        expect(b).toContain('font-size: 1.0625rem;')
    })

    it('the shell sets no width or flex, so a consumer layout class lands on the field', () => {
        const b = block('.field-shell')
        expect(b).not.toMatch(/\bwidth:/)
        expect(b).not.toMatch(/\bflex:/)
        expect(b).not.toMatch(/\bmargin/)
    })

    it('the control inherits the shell type, so text-center and tabular-nums on Input still land', () => {
        const b = block('.field-shell-control')
        for (const p of ['font: inherit;', 'text-align: inherit;', 'font-variant-numeric: inherit;', 'letter-spacing: inherit;'])
            expect(b).toContain(p)
    })

    it('forced colours and reduced transparency still give the field an edge', () => {
        expect(CSS).toMatch(/@media \(forced-colors: active\)[\s\S]*border: 1px solid CanvasText;/)
        expect(CSS).toMatch(/@media \(prefers-reduced-transparency: reduce\)[\s\S]*--field-hair: var\(--field-edge\);/)
    })

    it('no field rule sets a size in px', () => {
        const fieldRules = CSS.split('\n.').filter((r) => /^field-(input|textarea|shell)/.test(r))
        for (const r of fieldRules) expect(r).not.toMatch(/(height|font-size|padding):\s*\d+px/)
    })
})
