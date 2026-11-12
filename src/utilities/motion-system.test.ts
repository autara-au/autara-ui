import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render } from '@testing-library/react'
import { createElement } from 'react'
import { Reveal } from '../components/Reveal'
import { motionDurations } from '../lib/motion-tokens'

/**
 * AUTM-1678: the motion system's rules, read out of the stylesheet.
 *
 * jsdom has no stylesheet and no media queries, so a render assertion would
 * pass while a real browser animated a box or ignored reduced motion. These
 * read `utilities/animations.css` itself: what each new keyframe animates,
 * which media block each moving rule sits in, and that the scroll-driven
 * stagger step still matches the timed one. Behaviour in a browser, with the
 * media query emulated, is in the AUTM-1678 PR.
 */

const CSS = readFileSync(resolve(process.cwd(), 'src/utilities/animations.css'), 'utf8')

interface Rule {
    selector: string
    body: string
    /** Enclosing at-rule preludes, outermost first. */
    context: string[]
}

/** A small brace-matching walk: enough for this file, which is plain CSS. */
function rules(css: string): Rule[] {
    const code = css.replace(/\/\*[\s\S]*?\*\//g, '')
    const out: Rule[] = []
    const stack: string[] = []
    let buf = ''
    for (let i = 0; i < code.length; i++) {
        const ch = code[i]
        if (ch === '{') {
            const prelude = buf.trim()
            buf = ''
            if (prelude.startsWith('@') && !prelude.startsWith('@keyframes')) {
                stack.push(prelude)
                continue
            }
            // A style rule or a keyframes block: read to its matching brace.
            let depth = 1
            let j = i + 1
            while (j < code.length && depth > 0) {
                if (code[j] === '{') depth++
                else if (code[j] === '}') depth--
                j++
            }
            out.push({ selector: prelude, body: code.slice(i + 1, j - 1), context: [...stack] })
            i = j - 1
        } else if (ch === '}') {
            stack.pop()
            buf = ''
        } else {
            buf += ch
        }
    }
    return out
}

const ALL = rules(CSS)

function keyframes(name: string): string {
    const k = ALL.find((r) => r.selector === `@keyframes ${name}`)
    if (!k) throw new Error(`@keyframes ${name} not found`)
    return k.body
}

/** Property names declared inside a keyframes body or a rule body. */
function properties(body: string): string[] {
    return [...body.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1])
}

const NEW_KEYFRAMES = [
    'autara-reveal',
    'autara-settle',
    'autara-page-in',
    'autara-page-out',
    'autara-skeleton',
    'autara-fade-in',
    // AUTM-1792
    'floating-pop-in',
    'autara-pop',
    'autara-row-in',
    'autara-shimmer',
    'modal-panel-in',
    'modal-panel-out',
    // AUTM-1819
    'autara-badge-in',
    'autara-breathe-soft',
]

describe('AUTM-1678: transform and opacity only', () => {
    it.each(NEW_KEYFRAMES)('@keyframes %s animates nothing but transform and opacity', (name) => {
        const props = new Set(properties(keyframes(name)))
        expect(props.size).toBeGreaterThan(0)
        expect([...props].filter((p) => !['transform', 'opacity'].includes(p))).toEqual([])
    })

    it('the press and hover states change only scale and translate', () => {
        const states = ALL.filter((r) => /\.motion-(press|press-row|hover-lift)[^,{]*:(active|hover)/.test(r.selector))
        expect(states.length).toBeGreaterThanOrEqual(4)
        for (const r of states) {
            expect(properties(r.body).filter((p) => !['scale', 'translate'].includes(p)), r.selector).toEqual([])
        }
    })

    it('the interactive transition list names no layout property', () => {
        const t = ALL.find((r) => r.selector.includes('.motion-press,') && r.body.includes('transition'))
        expect(t).toBeDefined()
        for (const layout of ['width', 'height', 'margin', 'padding', 'top', 'left', 'filter', 'box-shadow', ' all ']) {
            expect(t!.body, layout).not.toContain(layout)
        }
    })
})

describe('AUTM-1678: reduced motion is designed, not only clamped', () => {
    const NO_PREF = 'prefers-reduced-motion: no-preference'

    /**
     * Every rule that MOVES something sits inside `no-preference`, so a
     * reduced-motion user sees the end state. The global clamp alone would
     * not do: it shortens duration but not delay, and a staggered child with
     * `both` would sit invisible for its delay.
     */
    it.each([
        ['.reveal-view', 'animation'],
        ['.reveal-stagger > *', 'animation'],
        ['.motion-stagger > *', 'animation'],
        ['.motion-settle', 'animation'],
        ['.motion-skeleton', 'animation'],
        ['::view-transition-new(autara-page)', 'animation'],
        ['.motion-press:active', 'scale'],
        ['.motion-press-row:active', 'scale'],
        ['.motion-hover-lift:hover', 'translate'],
        // AUTM-1792
        ['.floating-panel--pop[data-state]', 'animation'],
        ['.motion-pop', 'animation'],
        ['.motion-rows > *', 'animation'],
        ['.motion-shimmer::after', 'animation'],
        // AUTM-1819
        ['.motion-badge-in', 'animation'],
        ['.motion-breathe-soft', 'animation'],
    ])('%s moves only inside prefers-reduced-motion: no-preference', (selector, prop) => {
        const moving = ALL.filter(
            (r) => r.selector.startsWith(selector) && properties(r.body).includes(prop)
        )
        expect(moving.length, `${selector} declares no ${prop} at all`).toBeGreaterThan(0)
        for (const r of moving) {
            expect(r.context.some((c) => c.includes(NO_PREF)), `${r.selector} moves outside no-preference`).toBe(true)
        }
    })

    it('hover lift is pointer only', () => {
        const lift = ALL.filter((r) => r.selector.startsWith('.motion-hover-lift:hover'))
        for (const r of lift) expect(r.context.some((c) => c.includes('(hover: hover)'))).toBe(true)
    })

    it('a route change swaps instantly under reduce', () => {
        const reduce = ALL.filter(
            (r) => r.selector.includes('::view-transition-new(autara-page)') && r.context.some((c) => c.includes('reduce'))
        )
        expect(reduce.map((r) => r.body.trim())).toContain('animation: none;')
    })

    it('the crossfade is the one thing kept under reduce, and it is opacity only', () => {
        const keep = ALL.find(
            (r) => r.selector === '.motion-crossfade' && r.context.some((c) => c.includes('reduce'))
        )
        expect(keep?.body).toContain('animation-duration: var(--motion-crossfade) !important')
        expect(CSS).toMatch(/\.motion-crossfade \{\s*animation: autara-fade-in /)
    })

    it('the file header states the reduced form of every token family', () => {
        const header = CSS.slice(CSS.indexOf('Reduced motion, per token'))
        for (const family of ['reveal', 'stagger', 'settle', 'page', 'hover', 'press', 'skeleton', 'crossfade']) {
            expect(header, family).toContain(family)
        }
    })
})

describe('AUTM-1678: stagger', () => {
    it('the scroll-driven step keeps the timed proportions: 40% x stagger / reveal', () => {
        const step = /--reveal-stagger-step:\s*([\d.]+)%/.exec(CSS)
        expect(step).not.toBeNull()
        expect(Number(step![1])).toBeCloseTo((40 * motionDurations.stagger) / motionDurations.reveal, 5)
    })

    it('the timed stagger delays by index on the token, capped at the sixth child', () => {
        const timed = ALL.find((r) => r.selector === '.motion-stagger > *' && r.body.includes('animation-delay'))
        expect(timed?.body).toContain('calc(var(--stagger-i, 0) * var(--motion-stagger))')
        const cap = ALL.find((r) => r.body.trim() === '--stagger-i: 5;')
        expect(cap?.selector).toContain('.motion-stagger > :nth-child(n + 6)')
        expect(cap?.selector).toContain('.reveal-stagger > :nth-child(n + 6)')
    })

    it('the legacy .animate-on-scroll family is on the same 16px and the same tokens', () => {
        const code = CSS.replace(/\/\*[\s\S]*?\*\//g, '')
        expect(code).not.toMatch(/\b0\.7s\b|\b700ms\b|28px|40px/)
        const legacy = ALL.filter((r) => /^\.animate-(on-scroll|slide-left|slide-right|scale)$/.test(r.selector))
        expect(legacy).toHaveLength(4)
        for (const r of legacy) expect(r.body).toContain('var(--motion-reveal) var(--motion-ease-out)')
        expect(keyframes('autara-reveal')).toContain('translateY(16px)')
    })
})

describe('Reveal stagger (AUTM-1678)', () => {
    it('renders the plain reveal by default', () => {
        const { container } = render(createElement(Reveal, null, 'x'))
        expect(container.firstElementChild?.className).toBe('reveal-view')
    })

    it('with stagger, the block stays still and its children reveal', () => {
        const { container } = render(
            createElement(Reveal, { as: 'ul', stagger: true }, createElement('li', null, 'a'), createElement('li', null, 'b'))
        )
        const el = container.firstElementChild as HTMLElement
        expect(el.tagName).toBe('UL')
        expect(el.className).toBe('reveal-stagger')
        // At rest in server HTML: no inline style, no hidden state, no script.
        expect(el.getAttribute('style')).toBeNull()
        expect([...el.children].every((c) => c.getAttribute('style') === null)).toBe(true)
    })
})

describe('AUTM-1792: pops, rows and counts', () => {
    it('only the pop moves on the overshoot curve, and never opacity', () => {
        const onPop = ALL.filter((r) => r.body.includes('var(--motion-ease-pop)'))
        expect(onPop.length).toBeGreaterThan(0)
        for (const r of onPop) {
            // The overshoot drives the movement keyframes only; the fade beside
            // it runs on ease-out.
            expect(r.body).toMatch(/floating-pop-in var\(--motion-menu-in\) var\(--motion-ease-pop\)/)
            expect(r.body).toMatch(/autara-fade-in var\(--motion-menu-in\) var\(--motion-ease-out\)/)
        }
    })

    it('a menu closes faster than it opens', () => {
        expect(motionDurations.menuOut).toBeLessThan(motionDurations.menuIn)
    })

    it('rows step 30ms and stop stepping at the twelfth', () => {
        expect(CSS).toContain('.motion-rows > :nth-child(n + 12) { --row-i: 11; }')
        expect(motionDurations.rowStagger).toBe(30)
    })

    it('the shimmer is hidden, not merely slowed, under reduce', () => {
        const hide = ALL.find(
            (r) => r.selector === '.motion-shimmer::after' && r.context.some((c) => c.includes('motion: reduce'))
        )
        expect(hide?.body).toContain('display: none')
    })
})
