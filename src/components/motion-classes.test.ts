import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * AUTM-967 — A CLASS THAT EMITS NOTHING IS WORSE THAN NO CLASS, because it
 * reads as done.
 *
 * Seven components styled their enter and exit with `animate-in`,
 * `fade-in-0`, `zoom-in-95` and `slide-in-from-*`. Those are
 * `tailwindcss-animate` utilities. The plugin is not a dependency of this
 * package, and it is not a dependency of merchant-mobile, merchant-web or
 * customer-web either — Tailwind generates utilities from the CONSUMER's
 * config, so even installing it here would not have been enough.
 *
 * The result: every dialog, sheet, tooltip, dropdown, select, phone-input
 * country list and nav menu across all three web surfaces appeared and
 * disappeared on the frame it was asked for. Nothing errored. Nothing warned.
 * The source read as though the animation was handled, which is the entire
 * reason it survived from the first Radix wrapper until now.
 *
 * This file makes that failure loud in three ways, and the third is the one
 * that generalises:
 *
 *   1. No component reaches for a plugin utility again.
 *   2. The plugin stays out of `package.json` — adding it would make the old
 *      classes resolve HERE and still not in a consumer, which is a worse
 *      state than today because it would look fixed in Storybook.
 *   3. Every animation a stylesheet names has keyframes that exist. A typo'd
 *      keyframe name is silent in exactly the same way, and that is the shape
 *      of the bug rather than the specific classes involved.
 *
 * A source scan, like its neighbours in this directory, because jsdom has no
 * stylesheet: a render assertion would pass while the real app was still
 * snapping. The behaviour itself is verified in a browser — see the AUTM-967
 * PR for `getComputedStyle(...).animationName` on each surface.
 */

const DIR = resolve(process.cwd(), 'src/components')
const CSS_PATH = resolve(process.cwd(), 'src/utilities/animations.css')
const CSS = readFileSync(CSS_PATH, 'utf8')
const PKG = JSON.parse(
    readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }

/** The `tailwindcss-animate` surface, as it was actually used here. */
const PLUGIN_UTILITIES =
    /\b(?:animate-in|animate-out|fade-in(?:-\d+)?|fade-out(?:-\d+)?|zoom-in(?:-\d+)?|zoom-out(?:-\d+)?|slide-in-from-\w+(?:-\d+)?|slide-out-to-\w+(?:-\d+)?)\b/

/** Strip comments — this file's whole subject gets quoted in them. */
function code(text: string): string {
    let inBlock = false
    return text
        .split('\n')
        .filter((line) => {
            const t = line.trim()
            if (t.startsWith('/*')) inBlock = true
            const was = inBlock
            if (t.endsWith('*/')) inBlock = false
            return !was && !t.startsWith('//') && !t.startsWith('*')
        })
        .join('\n')
}

function componentSources(): { file: string; text: string }[] {
    return readdirSync(DIR)
        .filter((f) => f.endsWith('.tsx') && !f.includes('.test.'))
        .map((f) => ({ file: f, text: code(readFileSync(join(DIR, f), 'utf8')) }))
}

describe('no component styles motion with a plugin that is not installed', () => {
    it('nothing reaches for a tailwindcss-animate utility', () => {
        const offenders = componentSources()
            .map(({ file, text }) => ({ file, hit: PLUGIN_UTILITIES.exec(text)?.[0] }))
            .filter((o) => o.hit)
            .map((o) => `${o.file} — ${o.hit}`)
        expect(
            offenders,
            'these emit nothing; use the classes in utilities/animations.css'
        ).toEqual([])
    })

    /**
     * Deliberately asserts the ABSENCE of the dependency.
     *
     * Installing it is the tempting small diff and it is the wrong fix: the
     * utilities would resolve in this package's Storybook and still not in a
     * consumer's build, so the bug would look fixed while staying broken in
     * the three apps that actually have users.
     */
    it('tailwindcss-animate is not a dependency, and should not become one', () => {
        const all = { ...PKG.dependencies, ...PKG.devDependencies }
        expect(Object.keys(all)).not.toContain('tailwindcss-animate')
    })
})

/**
 * The general guard. Pulls every `animation: <name> …` shorthand out of the
 * stylesheet and checks the keyframes exist, so a rename or a typo fails here
 * instead of silently reverting a surface to snapping.
 */
describe('every animation the stylesheet names actually exists', () => {
    const declared = new Set(
        [...CSS.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
    )
    // AUTM-1792: a shorthand can list several animations (a menu's fade on
    // one curve and its pop on another), so read every comma-separated
    // entry, not only the first.
    const used = [
        ...[...CSS.matchAll(/animation:\s*([^;]+);/g)].flatMap((m) =>
            m[1].split(',').map((part) => part.trim().split(/\s+/)[0])
        ),
        ...[...CSS.matchAll(/animation-name:\s*([\w-]+)/g)].map((m) => m[1]),
    ].filter((n) => /^[a-z][\w-]*$/.test(n) && n !== 'none')

    it('references at least the surfaces AUTM-967 covered', () => {
        expect(used.length).toBeGreaterThanOrEqual(10)
    })

    it('names no keyframe that was never declared', () => {
        expect([...new Set(used.filter((n) => !declared.has(n)))]).toEqual([])
    })

    it('declares no keyframe nothing uses', () => {
        // Scroll-reveal keyframes are driven from component classes, not from
        // an `animation:` shorthand in this file.
        const drivenElsewhere = new Set(['float', 'gradient-shift', 'scroll-x'])
        const orphans = [...declared].filter(
            (n) => !used.includes(n) && !drivenElsewhere.has(n)
        )
        expect(orphans).toEqual([])
    })
})

/**
 * The component-to-class contract. Each surface has to carry the class that
 * animates it, and that class has to be defined. Both halves matter: a
 * component with no class snaps, and a class with no rule snaps identically
 * while looking handled — which is the whole ticket.
 */
describe('every animated surface is wired to a rule that exists', () => {
    const WIRING: [string, string[]][] = [
        ['Dialog.tsx', ['overlay-scrim', 'modal-panel', 'dialog-panel--responsive']],
        ['Sheet.tsx', ['overlay-scrim', 'sheet-panel', 'sheet-panel--top', 'sheet-panel--bottom', 'sheet-panel--left', 'sheet-panel--right']],
        ['Tooltip.tsx', ['floating-panel']],
        ['DropdownMenu.tsx', ['floating-panel']],
        ['Select.tsx', ['floating-panel']],
        ['PhoneInput.tsx', ['floating-panel']],
        ['Popover.tsx', ['floating-panel']],
        ['NavigationMenu.tsx', ['nav-menu-content', 'nav-menu-viewport', 'nav-menu-indicator']],
        ['ServiceCard.tsx', ['service-card-reveal', 'motion-skeleton']],
        // AUTM-1678
        ['Reveal.tsx', ['reveal-view', 'reveal-stagger']],
        ['ScrollReveal.tsx', ['animate-on-scroll', 'animate-slide-left', 'animate-slide-right', 'animate-scale']],
        ['Skeleton.tsx', ['motion-skeleton']],
        ['AsyncSkeleton.tsx', ['motion-skeleton']],
        ['KpiCard.tsx', ['motion-skeleton']],
        ['StatTile.tsx', ['motion-skeleton']],
    ]

    it.each(WIRING)('%s carries its motion classes', (file, classes) => {
        const text = code(readFileSync(join(DIR, file), 'utf8'))
        // A class sits in a string literal between a quote or a space on each
        // side. Substring checks, for the CodeQL reason given further down.
        const edges = ["'", '"', '`', ' ']
        const carries = (c: string) =>
            edges.some((pre) => edges.some((post) => text.includes(`${pre}${c}${post}`)))
        expect(classes.filter((c) => !carries(c))).toEqual([])
    })

    /**
     * Substring rather than a built regex. The first version escaped `-` in
     * the class name and nothing else, which CodeQL correctly flags as
     * incomplete escaping (`js/incomplete-sanitization`) — harmless here,
     * since the input is a literal in the table above, but a pattern worth
     * not teaching. A selector ends in one of five characters, so checking
     * for them directly is both safer and easier to read.
     */
    it.each([...new Set(WIRING.flatMap(([, cs]) => cs))])(
        '.%s is defined in utilities/animations.css',
        (cls) => {
            const defined = [' ', ',', '[', '{', '\n'].some((end) =>
                CSS.includes(`.${cls}${end}`)
            )
            expect(defined, `.${cls} is referenced by a component but has no rule`).toBe(
                true
            )
        }
    )

    /**
     * Tooltip's open states are `delayed-open` and `instant-open`, never
     * `open`. A rule written as `[data-state="open"]` gives a tooltip an exit
     * animation and no entrance — which is a harder bug to see than no
     * animation at all, because it half works.
     */
    it('the floating-panel enter rule covers Tooltip’s open states', () => {
        expect(CSS).toContain('[data-state]:not([data-state="closed"])')
    })

    /**
     * Radix keeps an exiting node mounted until `animationend`. Without
     * `forwards` the surface snaps back to its resting state for one frame
     * before it unmounts, which reads as a flicker on close.
     */
    it('every exit rule holds its final frame', () => {
        // The ENTER rule for floating panels is written
        // `:not([data-state="closed"])` — it mentions the closed state in
        // order to exclude it, so matching on the substring alone reports the
        // entrance as an exit missing `forwards`.
        const exits = [
            ...CSS.matchAll(/(^|\n)([^{}]*\[data-state="closed"\][^{]*)\{([^}]*)\}/g),
        ]
            .filter((m) => !m[2].includes(':not('))
            .map((m) => m[3])
        expect(exits.length).toBeGreaterThanOrEqual(4)
        expect(exits.filter((b) => !b.includes('forwards'))).toEqual([])
    })
})

/**
 * The reason this ticket was not simply "add transitions". A user who has
 * asked their OS for less motion gets none, and every transform-carrying
 * surface is reset so a clamped animation can never leave a sheet parked
 * off-screen — an invisible modal with a focus trap in it is worse than an
 * unanimated one.
 */
describe('prefers-reduced-motion is respected', () => {
    it('the stylesheet has a reduce block that clamps duration', () => {
        expect(CSS).toContain('@media (prefers-reduced-motion: reduce)')
        expect(CSS).toMatch(/animation-duration:\s*0\.01ms\s*!important/)
    })

    it('the reduce block neutralises every motion offset', () => {
        const blocks = [
            ...CSS.matchAll(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/g),
        ].map((m) => m[1])
        const joined = blocks.join('\n')
        for (const v of ['--panel-dx', '--panel-dy', '--sheet-from', '--nav-dx']) {
            expect(joined, `${v} is not reset under reduced motion`).toContain(v)
        }
    })
})
