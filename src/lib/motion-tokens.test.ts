import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
    MOTION_STAGGER_CAP,
    motionDurations,
    motionEasings,
    motionStaggerDelay,
    motionTiming,
    motionTokens,
    motionTransition,
    type MotionTransitionName,
} from './motion-tokens'

/**
 * AUTM-1594 — the JS motion tokens and `utilities/animations.css` cannot
 * drift. The stylesheet is the source; this reads every `--motion-*`
 * declaration out of it and checks the JS object holds exactly those, both
 * ways, so a token added, renamed, retimed or removed on either side fails
 * here instead of putting a framer-motion surface out of step with the CSS
 * ones beside it.
 */

const CSS = readFileSync(resolve(process.cwd(), 'src/utilities/animations.css'), 'utf8')

/** `--motion-sheet-in: 280ms;` from the stylesheet, comments stripped. */
function cssTokens(): Map<string, string> {
    const code = CSS.replace(/\/\*[\s\S]*?\*\//g, '')
    const tokens = new Map<string, string>()
    for (const m of code.matchAll(/(--motion-[\w-]+)\s*:\s*([^;]+);/g)) {
        const [, name, value] = m
        if (tokens.has(name) && tokens.get(name) !== value.trim()) {
            throw new Error(`${name} is declared twice with different values`)
        }
        tokens.set(name, value.trim())
    }
    return tokens
}

/** `--motion-sheet-in` → `sheetIn`. */
function camel(cssName: string): string {
    return cssName
        .replace(/^--motion-/, '')
        .replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
}

function ms(value: string): number {
    const m = /^([\d.]+)(ms|s)$/.exec(value)
    if (!m) throw new Error(`not a duration: ${value}`)
    return m[2] === 's' ? Number(m[1]) * 1000 : Number(m[1])
}

function bezier(value: string): number[] {
    const m = /^cubic-bezier\(([^)]+)\)$/.exec(value)
    if (!m) throw new Error(`not a cubic-bezier: ${value}`)
    return m[1].split(',').map((p) => Number(p.trim()))
}

describe('motion tokens match utilities/animations.css', () => {
    const tokens = cssTokens()
    const durations = [...tokens].filter(([name]) => !name.startsWith('--motion-ease-'))
    const easings = [...tokens].filter(([name]) => name.startsWith('--motion-ease-'))

    it('finds the tokens at all', () => {
        // A regex that stopped matching would otherwise pass every check below
        // against an empty list.
        expect(durations.length).toBeGreaterThanOrEqual(10)
        // out, in and pop. AUTM-1781: one ease-out, so no fourth (soft) curve.
        expect(easings).toHaveLength(3)
    })

    it('every duration in the stylesheet is in motionDurations, at the same value', () => {
        const fromCss = Object.fromEntries(durations.map(([name, value]) => [camel(name), ms(value)]))
        expect(motionDurations).toEqual(fromCss)
    })

    it('every easing in the stylesheet is in motionEasings, at the same curve', () => {
        const fromCss = Object.fromEntries(
            easings.map(([name, value]) => [name.replace(/^--motion-ease-/, ''), bezier(value)])
        )
        expect(motionEasings).toEqual(fromCss)
    })

    it('motionTokens is the same two objects', () => {
        expect(motionTokens.durationMs).toBe(motionDurations)
        expect(motionTokens.ease).toBe(motionEasings)
    })
})

describe('motionTransition', () => {
    it('gives framer-motion seconds, and the curve the stylesheet pairs', () => {
        expect(motionTransition('sheetIn')).toEqual({ duration: 0.35, ease: motionEasings.out })
        expect(motionTransition('sheetOut')).toEqual({ duration: 0.2, ease: motionEasings.in })
        expect(motionTransition('panelOut')).toEqual({ duration: 0.12, ease: motionEasings.in })
    })

    it('AUTM-1678: reveal, settle, hover, press and crossfade are not exits, so they run on ease-out', () => {
        // The pairing used to be "ends in In means ease-out", which sent every
        // new token without a suffix to the exit curve.
        for (const name of ['reveal', 'settle', 'hover', 'press', 'crossfade', 'pageIn'] as const) {
            expect(motionTransition(name).ease, name).toBe(motionEasings.out)
        }
        expect(motionTransition('pageOut')).toEqual({ duration: 0.12, ease: motionEasings.in })
        expect(motionTransition('reveal')).toEqual({ duration: 0.48, ease: motionEasings.out })
    })

    it('pairs every enter with ease-out and every exit with ease-in, as the CSS rules do', () => {
        // Read the pairing from the rules themselves, not from the name.
        for (const m of CSS.matchAll(/var\(--motion-([\w-]+)\)\s+var\(--motion-ease-(out|in)\)/g)) {
            const [, token, curve] = m
            const name = camel(`--motion-${token}`) as MotionTransitionName
            expect(motionTransition(name).ease, `${token} runs on ease-${curve} in the CSS`).toBe(
                motionEasings[curve as 'out' | 'in']
            )
        }
    })
})

describe('motionStaggerDelay (AUTM-1678)', () => {
    it('steps 60ms for children 1 to 6, then holds at 300ms', () => {
        expect([0, 1, 2, 3, 4, 5, 6, 7, 20].map(motionStaggerDelay)).toEqual([
            0, 60, 120, 180, 240, 300, 300, 300, 300,
        ])
    })

    it('is the stylesheet\'s own cap: six children step, the rest share the last step', () => {
        expect(MOTION_STAGGER_CAP).toBe(6)
        expect(CSS).toContain(':nth-child(n + 6) { --stagger-i: 5; }')
    })

    it('never returns a negative or fractional step', () => {
        expect(motionStaggerDelay(-3)).toBe(0)
        expect(motionStaggerDelay(2.7)).toBe(120)
    })
})

describe('motionTiming (AUTM-1781)', () => {
    it('gives the Web Animations API milliseconds and a CSS curve, paired as motionTransition pairs it', () => {
        expect(motionTiming('tab')).toEqual({ duration: 450, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' })
        expect(motionTiming('menuOut')).toEqual({ duration: 150, easing: 'cubic-bezier(0.4, 0, 1, 1)' })
        for (const name of ['enter', 'row', 'pop', 'count', 'sheetIn', 'modalIn'] as const) {
            expect(motionTiming(name).duration, name).toBe(motionDurations[name])
            expect(motionTiming(name).easing, name).toBe(`cubic-bezier(${motionTransition(name).ease.join(', ')})`)
        }
    })
})
