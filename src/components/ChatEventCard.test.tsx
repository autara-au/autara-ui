import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { ChatEventCard, type ChatEventTone } from './ChatEventCard'

/** AUTM-1881: a booking event from Autara, said as one, with at most one action. */
describe('ChatEventCard', () => {
    it('names itself as from Autara, then the title, and describes itself by the detail', () => {
        render(
            <ChatEventCard
                tone="done"
                title="Booking confirmed"
                detail="$40.00 deposit charged. See you Sat 18 Oct, 9:00 am."
                time="9:41 am"
                dateTime="2026-10-15T09:41:00+11:00"
            />,
        )
        const card = screen.getByRole('article', { name: 'From Autara: Booking confirmed' })
        expect(card.getAttribute('aria-describedby')).toBeTruthy()
        expect(screen.getByText('$40.00 deposit charged. See you Sat 18 Oct, 9:00 am.')).toBeTruthy()
        const time = card.querySelector('time')
        expect(time?.textContent).toBe('9:41 am')
        expect(time?.getAttribute('datetime')).toBe('2026-10-15T09:41:00+11:00')
    })

    it('draws one action at most, and runs it', () => {
        const onClick = vi.fn()
        render(<ChatEventCard tone="action" title="Job complete, $80.00 to pay" time="1:12 pm" action={{ label: 'Pay $80.00', onClick }} />)
        const buttons = screen.getAllByRole('button')
        expect(buttons).toHaveLength(1)
        fireEvent.click(buttons[0])
        expect(onClick).toHaveBeenCalledOnce()
    })

    it('has no button and no description without an action or a detail', () => {
        render(<ChatEventCard tone="progress" title="Car care started" time="9:04 am" />)
        expect(screen.queryByRole('button')).toBeNull()
        expect(screen.getByRole('article').getAttribute('aria-describedby')).toBeNull()
    })

    it('the action is the lime primary on an action card and the raised quiet one otherwise', () => {
        const { unmount } = render(<ChatEventCard tone="action" title="x" time="1 pm" action={{ label: 'Pay', onClick: () => {} }} />)
        expect(screen.getByRole('button').className).not.toMatch(/message-card-action/)
        unmount()
        render(<ChatEventCard tone="closed" title="x" time="1 pm" action={{ label: 'Book another time', onClick: () => {} }} />)
        expect(screen.getByRole('button').className).toMatch(/bg-\[var\(--message-card-action\)\]/)
    })

    it.each(['action', 'progress', 'done', 'closed'] as const)('tone %s draws a disc with a glyph, hidden from screen readers', (tone) => {
        render(<ChatEventCard tone={tone} title="x" time="1 pm" />)
        const card = screen.getByRole('article')
        expect(card.getAttribute('data-tone')).toBe(tone)
        const disc = card.querySelector('[data-slot="disc"]') as HTMLElement
        expect(disc.getAttribute('aria-hidden')).toBe('true')
        expect(disc.querySelector('svg')).toBeTruthy()
    })

    it('a closed card never wears a warning colour', () => {
        render(<ChatEventCard tone="closed" title="Booking cancelled" time="1 pm" />)
        const disc = screen.getByRole('article').querySelector('[data-slot="disc"]') as HTMLElement
        expect(disc.className).not.toMatch(/danger|amber|warning|alert/)
    })

    it('rises in only when it arrived live', () => {
        const { unmount } = render(<ChatEventCard tone="done" title="x" time="1 pm" />)
        expect(screen.getByRole('article').className).not.toMatch(/motion-rows/)
        unmount()
        render(<ChatEventCard tone="done" title="x" time="1 pm" arrived />)
        expect(screen.getByRole('article').className).toMatch(/motion-rows/)
    })
})

/**
 * The glyph is what makes each disc read (lime on band is about 1:1), so the
 * glyph's ink on the disc's fill must clear 4.5:1 in both themes. Measured
 * from the real files: the DISC map in ChatEventCard.tsx and colors.css.
 */
describe('ChatEventCard disc contrast', () => {
    const COLORS = readFileSync(resolve(process.cwd(), 'src/tokens/colors.css'), 'utf8')
    const CARD = readFileSync(resolve(process.cwd(), 'src/components/ChatEventCard.tsx'), 'utf8')
    type RGB = [number, number, number]
    type Theme = 'light' | 'dark'
    const lin = (c: number) => {
        const s = c / 255
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    }
    const lum = ([r, g, b]: RGB) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
    const ratio = (a: RGB, b: RGB) => {
        const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
        return (hi + 0.05) / (lo + 0.05)
    }
    const scope = (theme: Theme) => {
        const split = COLORS.search(/^:root\[data-theme="dark"\],?\s*$/m)
        if (split < 0) throw new Error('dark selector not found: did colors.css move?')
        return theme === 'light' ? COLORS.slice(0, split) : COLORS.slice(split)
    }
    const token = (name: string, theme: Theme): RGB => {
        const m = new RegExp(`--${name}:\\s*#([0-9a-fA-F]{6})`).exec(scope(theme))
        if (!m) throw new Error(`--${name} not found as a hex in the ${theme} scope`)
        return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) as RGB
    }
    const disc = (tone: ChatEventTone) => {
        const line = new RegExp(`\\b${tone}:\\s*"([^"]+)"`).exec(CARD)
        if (!line) throw new Error(`tone ${tone} not found in the DISC map`)
        const fill = /bg-\[var\(--([a-z0-9-]+)\)\]/.exec(line[1])
        const ink = /text-\[var\(--([a-z0-9-]+)\)\]/.exec(line[1])
        if (!fill || !ink) throw new Error(`tone ${tone} has no var() fill or ink`)
        return { fill: fill[1], ink: ink[1] }
    }

    for (const theme of ['light', 'dark'] as const) {
        it.each(['action', 'progress', 'done', 'closed'] as const)(`${theme}: the %s glyph clears 4.5:1 on its disc`, (tone) => {
            const { fill, ink } = disc(tone)
            expect(ratio(token(ink, theme), token(fill, theme))).toBeGreaterThanOrEqual(4.5)
        })
    }
})
