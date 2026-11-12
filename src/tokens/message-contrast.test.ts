import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * AUTM-1806 (U7): the conversation tokens clear their floors in both themes.
 * Your own bubble is brand with white, the other side's is band (raised in
 * dark) with ink, a card in the thread is the same surface, and every text
 * colour the thread puts on them reads at 4.5:1. The bubble edge is the step
 * from the page, so the incoming bubble must also stand off paper.
 */

const CSS = readFileSync(resolve(process.cwd(), 'src/tokens/colors.css'), 'utf8')

type RGB = [number, number, number]

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

function token(name: string, theme: 'light' | 'dark'): { rgb: RGB; alpha: number } {
    const split = CSS.search(/^\[data-theme="dark"\] \{/m)
    if (split < 0) throw new Error('dark selector not found')
    const scope = theme === 'light' ? CSS.slice(0, split) : CSS.slice(split)
    const rgba = new RegExp(`--${name}:\\s*rgba\\(([^)]+)\\)`).exec(scope)
    if (rgba) {
        const [r, g, b, a] = rgba[1].split(',').map((n) => Number(n.trim()))
        return { rgb: [r, g, b], alpha: a }
    }
    const solid = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6});`).exec(scope)
    if (!solid) throw new Error(`--${name} not found in ${theme}`)
    return { rgb: hex(solid[1]), alpha: 1 }
}

const ratio = (fg: string, bg: string, theme: 'light' | 'dark') => {
    const f = token(fg, theme)
    const b = token(bg, theme)
    return contrast(over(f.rgb, f.alpha, b.rgb), b.rgb)
}

const AA = 4.5

describe('conversation tokens', () => {
    for (const theme of ['light', 'dark'] as const) {
        const pairs: Array<[string, string]> = [
            ['on-message-own', 'message-own'],
            ['message-own-meta', 'message-own'],
            ['on-message-incoming', 'message-incoming'],
            ['message-incoming-meta', 'message-incoming'],
            // The card: its text, its muted reason, its small print, its error.
            ['text-strong', 'message-card'],
            ['text-muted', 'message-card'],
            ['text-subtle', 'message-card'],
            ['danger', 'message-card'],
            ['text-strong', 'message-card-action'],
            ['text-strong', 'message-card-action-hover'],
            // The failed line and the "Sending" line sit on the page.
            ['danger', 'paper'],
            ['text-subtle', 'paper'],
        ]
        for (const [fg, bg] of pairs) {
            it(`${theme}: --${fg} reads on --${bg}`, () => {
                expect(ratio(fg, bg, theme)).toBeGreaterThanOrEqual(AA)
            })
        }

        it(`${theme}: the incoming bubble is a visible step off paper`, () => {
            expect(ratio('message-incoming', 'paper', theme)).toBeGreaterThan(1.05)
        })
    }
})
