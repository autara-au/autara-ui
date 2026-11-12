import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { MediaFrame } from '../components/MediaFrame'
import { initialsOf } from '../lib/initials'
import { listenForBackNavigation, markNavigation } from '../lib/navigation-motion'
import { motionDurations } from '../lib/motion-tokens'

/**
 * AUTM-1781: the customer app's motion (Don, 2026-10-09, after the Fernly
 * reference), on the one vocabulary it shares with AUTM-1792. jsdom has no
 * stylesheet, so the CSS rules are read out of utilities/animations.css; the
 * components and helpers are rendered. CountUp's tests are in
 * components/CountUp.test.tsx; the tokens' in lib/motion-tokens.test.ts.
 */

const CSS = readFileSync(resolve(process.cwd(), 'src/utilities/animations.css'), 'utf8')
const CODE = CSS.replace(/\/\*[\s\S]*?\*\//g, '')
/** The "App screens" block: from its first keyframes to the end of the file. */
const APP = CODE.slice(CODE.indexOf('@keyframes autara-screen-push'))

function keyframes(name: string, from = CODE): string {
    const at = from.indexOf(`@keyframes ${name} {`)
    if (at < 0) throw new Error(`@keyframes ${name} not found`)
    let depth = 0
    for (let i = from.indexOf('{', at); i < from.length; i++) {
        if (from[i] === '{') depth++
        else if (from[i] === '}' && --depth === 0) return from.slice(at, i + 1)
    }
    throw new Error('unbalanced')
}

describe('the app motion CSS', () => {
    it.each(['autara-screen-push', 'autara-screen-back', 'autara-rise', 'autara-row-in', 'autara-pop', 'sheet-panel-in'])(
        '@keyframes %s animates transform and opacity only',
        (name) => {
            const props = [...keyframes(name).matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1])
            expect(props.length).toBeGreaterThan(0)
            expect(props.filter((p) => p !== 'transform' && p !== 'opacity')).toEqual([])
        }
    )

    it('every entrance starts present: opacity 0.001, never 0 or hidden', () => {
        for (const name of ['autara-screen-push', 'autara-screen-back', 'autara-rise', 'autara-row-in']) {
            expect(keyframes(name), name).toContain('opacity: 0.001')
        }
        expect(APP).not.toMatch(/visibility:\s*hidden/)
    })

    it('every animation runs only inside prefers-reduced-motion: no-preference', () => {
        // Split on the media blocks: a rule that animates must sit in one.
        const outside = APP.replace(/@media \(prefers-reduced-motion: no-preference\)[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, '')
        expect(outside).not.toMatch(/animation:/)
    })

    it('runs on the house ease-out: there is no second ease-out', () => {
        // AUTM-1781 drafted its own soft curve; the vocabulary is one, so it is gone.
        expect(CSS).not.toContain('--motion-ease-soft')
        const curves = [...APP.matchAll(/animation: ([\w-]+) var\(--motion-[\w-]+\) var\(--motion-ease-([\w]+)\)/g)]
        expect(curves.length).toBeGreaterThanOrEqual(5)
        for (const m of curves) expect(m[2], m[1]).toBe('out')
        expect(CODE).toMatch(/animation: autara-pop var\(--motion-pop\) var\(--motion-ease-out\)/)
    })

    it('rises 18px from 98.5%, rows 4px, the screen 6% sideways', () => {
        expect(keyframes('autara-rise')).toContain('translateY(18px) scale(0.985)')
        expect(keyframes('autara-row-in')).toContain('translateY(4px)')
        expect(keyframes('autara-screen-push')).toContain('translateX(6%)')
        expect(keyframes('autara-screen-back')).toContain('translateX(-6%)')
    })

    it('staggers sections on the page stagger (60ms, capped at the sixth), rows 30ms capped at the twelfth', () => {
        expect(APP).toContain('calc(var(--stagger-i, 0) * var(--motion-stagger))')
        expect(CODE).toContain('.motion-rise > :nth-child(n + 6) { --stagger-i: 5; }')
        expect(CODE).toContain('calc(var(--row-i, 0) * var(--motion-row-stagger))')
        expect(CODE).toContain('.motion-rows > :nth-child(n + 12) { --row-i: 11; }')
        expect(motionDurations.stagger).toBe(60)
        expect(motionDurations.rowStagger).toBe(30)
        expect(CODE).not.toContain('--motion-enter-stagger')
    })

    it('a screen slides only while html is marked, so a first load never does, on the tab pill\'s slide', () => {
        expect(APP).toMatch(/html\[data-nav="push"\] \.motion-screen \{/)
        expect(APP).not.toMatch(/^\.motion-screen \{/m)
        expect(APP).toContain('autara-screen-push var(--motion-tab) var(--motion-ease-out)')
        expect(CODE).not.toContain('--motion-slide')
    })

    it('a sheet and a dialog are the plain Sheet and Dialog: no second sheet class', () => {
        expect(CODE).not.toMatch(/motion-sheet-soft/)
        expect(keyframes('modal-panel-in')).toContain('translateY(14px) scale(0.98)')
        expect(motionDurations.sheetIn).toBe(350)
        expect(motionDurations.modalIn).toBe(350)
        // The bar rises on the sheet's own keyframes and token.
        expect(APP).toContain('animation: sheet-panel-in var(--motion-sheet-in) var(--motion-ease-out) both;')
    })

    it('a pop is the AUTM-1792 one: the class plays when it is put on, so a choice adds it', () => {
        // The customer app drafted a second, state-gated .motion-pop; the
        // published contract (autara-ui 8.5.0) is "add the class at the
        // moment of choice", as FilterChipRow does, so it is the only rule.
        const pops = [...CODE.matchAll(/^\s*(\.motion-pop[^{]*)\{/gm)].map((m) => m[1].trim())
        expect(pops).toEqual(['.motion-pop'])
    })
})

describe('markNavigation', () => {
    afterEach(() => {
        vi.useRealTimers()
        delete document.documentElement.dataset.nav
    })

    it('marks the direction, then clears it once the screen has had time to arrive', () => {
        vi.useFakeTimers()
        markNavigation('push')
        expect(document.documentElement.dataset.nav).toBe('push')
        vi.advanceTimersByTime(1000)
        expect(document.documentElement.dataset.nav).toBeUndefined()
    })

    it('a second mark replaces the first and keeps its own time', () => {
        vi.useFakeTimers()
        markNavigation('push')
        vi.advanceTimersByTime(800)
        markNavigation('back')
        vi.advanceTimersByTime(500)
        expect(document.documentElement.dataset.nav).toBe('back')
    })

    it('the browser Back marks back, until the listener is removed', () => {
        const stop = listenForBackNavigation()
        window.dispatchEvent(new PopStateEvent('popstate'))
        expect(document.documentElement.dataset.nav).toBe('back')
        delete document.documentElement.dataset.nav
        stop()
        window.dispatchEvent(new PopStateEvent('popstate'))
        expect(document.documentElement.dataset.nav).toBeUndefined()
    })
})

describe('MediaFrame', () => {
    it('draws a photo, fading in, at the ratio', () => {
        render(createElement(MediaFrame, { src: '/car.jpg', alt: 'A clean ute', ratio: '4 / 3', testId: 'm' }))
        const frame = screen.getByTestId('m')
        expect(frame.dataset.media).toBe('photo')
        expect(frame.style.aspectRatio).toBe('4 / 3')
        expect(screen.getByRole('img', { name: 'A clean ute' }).className).toContain('motion-crossfade')
    })

    it('falls back to initials on deep purple, named for a screen reader', () => {
        render(createElement(MediaFrame, { initials: 'FP', label: 'Fitzroy Paint Co', shape: 'tile', testId: 'm' }))
        const frame = screen.getByTestId('m')
        expect(frame.dataset.media).toBe('initials')
        expect(frame.className).toContain('bg-[var(--brand-deep)]')
        expect(frame.className).toContain('rounded-[14px]')
        expect(screen.getByRole('img', { name: 'Fitzroy Paint Co' }).textContent).toBe('FP')
    })

    it('a photo that fails to load falls back too', () => {
        render(createElement(MediaFrame, { src: '/gone.jpg', alt: '', initials: 'BM', testId: 'm' }))
        const img = screen.getByTestId('m').querySelector('img')!
        act(() => {
            img.dispatchEvent(new Event('error'))
        })
        expect(screen.getByTestId('m').dataset.media).toBe('initials')
    })

    it('the caller’s media wins over a photo, and loading wins over both', () => {
        const { rerender } = render(
            createElement(MediaFrame, { src: '/car.jpg', testId: 'm' }, createElement('div', null, 'map'))
        )
        expect(screen.getByTestId('m').dataset.media).toBe('media')
        rerender(createElement(MediaFrame, { src: '/car.jpg', loading: true, testId: 'm' }))
        expect(screen.getByTestId('m').dataset.media).toBe('loading')
    })

    it('initialsOf takes the first letters of the first two words', () => {
        expect(initialsOf('Fitzroy Paint Co')).toBe('FP')
        expect(initialsOf('Bayside')).toBe('B')
        expect(initialsOf('  ')).toBe('')
        expect(initialsOf(null)).toBe('')
    })
})
