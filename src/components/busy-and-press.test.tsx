import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { Button, buttonVariants } from './Button'
import { IconButton } from './IconButton'
import { ListSectionRow } from './ListSection'
import { FilterChipRow } from './FilterChipRow'
import { MessageComposer } from './MessageComposer'
import { ToastProvider, toast } from './Toast'

/**
 * AUTM-1708: one loading picture and one press across the library.
 *
 * Busy: every busy control shows the turning Autara mark and keeps its
 * resting name; nothing relabels itself "Saving…" or draws its own ring.
 * Press: Button (and so IconButton), ListSectionRow and FilterChipRow press
 * by default on the library's motion classes, with an opt-out.
 */

describe('one loading picture', () => {
    it('MessageComposer: Send keeps its name and turns the mark while sending', () => {
        render(<MessageComposer value="See you at 9" onChange={vi.fn()} onSend={vi.fn()} sending />)
        const send = screen.getByRole('button', { name: 'Send' })
        expect(send).toHaveAttribute('aria-busy', 'true')
        expect(send.querySelector('svg.autara-loader')).not.toBeNull()
        expect(send.textContent).not.toContain('Sending')
    })

    it('a loading Toast turns the mark in its icon disc; other kinds draw their glyph (AUTM-1871)', () => {
        render(<ToastProvider>{null}</ToastProvider>)
        act(() => {
            toast.loading('Saving your hours')
            toast.success('Saved')
        })
        const loading = document.querySelector('[data-toast-icon="loading"]')!
        expect(loading.querySelector('svg.autara-loader')).not.toBeNull()
        expect(loading).toHaveAttribute('aria-hidden', 'true')
        const success = document.querySelector('[data-toast-type="success"] [data-toast-icon]')!
        expect(success.querySelector('svg.autara-loader')).toBeNull()
        expect(success.querySelector('svg')).not.toBeNull()
    })

    /**
     * The grep from AUTM-1706's acceptance, kept as a test: no shipped module
     * or stylesheet draws its own spinner or relabels itself busy. The mark
     * lives in AutaraLoader and loader.css only.
     */
    it('no component draws its own spinner or relabels itself while busy', () => {
        const dirs = ['src/components', 'src/utilities']
        const offenders: string[] = []
        for (const dir of dirs) {
            for (const f of readdirSync(resolve(process.cwd(), dir))) {
                if (/\.(test|stories)\.tsx?$/.test(f) || f === 'loader.css' || f === 'AutaraLoader.tsx') continue
                if (!/\.(tsx?|css)$/.test(f)) continue
                const text = readFileSync(join(resolve(process.cwd(), dir), f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
                for (const pattern of [
                    'animate-spin',
                    'social-btn__spinner',
                    'autara-toast-spin',
                    'rotate(360deg)',
                    "'Cropping…'",
                    '`${confirmLabel}…`',
                ]) {
                    if (text.includes(pattern)) offenders.push(`${dir}/${f}: ${pattern}`)
                }
            }
        }
        expect(offenders).toEqual([])
    })
})

describe('one press', () => {
    it('Button presses by default: 97%, or 98.5% full width; never a link; opt-out', () => {
        const { rerender } = render(<Button>Book</Button>)
        const btn = () => screen.getByRole('button')
        expect(btn()).toHaveClass('motion-press')
        rerender(<Button fullWidth>Book</Button>)
        expect(btn()).toHaveClass('motion-press-row')
        expect(btn()).not.toHaveClass('motion-press')
        rerender(<Button variant="link">View all</Button>)
        expect(btn().className).not.toMatch(/motion-press/)
        rerender(<Button variant="light-link">View all</Button>)
        expect(btn().className).not.toMatch(/motion-press/)
        rerender(<Button press={false}>Book</Button>)
        expect(btn().className).not.toMatch(/motion-press/)
    })

    it('buttonVariants carries the same press, for a Link styled as a button', () => {
        expect(buttonVariants()).toMatch(/\bmotion-press\b/)
        expect(buttonVariants({ fullWidth: true })).toMatch(/\bmotion-press-row\b/)
        expect(buttonVariants({ variant: 'link' })).not.toMatch(/motion-press/)
        expect(buttonVariants({ press: false })).not.toMatch(/motion-press/)
    })

    it('IconButton inherits it through Button', () => {
        render(<IconButton icon={<span />} label="Notifications" />)
        expect(screen.getByRole('button', { name: 'Notifications' })).toHaveClass('motion-press')
    })

    it('ListSectionRow: a tappable row presses to 98.5% and takes a className', () => {
        const { rerender, container } = render(<ListSectionRow label="Payouts" onTap={vi.fn()} className="extra" />)
        const row = screen.getByRole('button', { name: /Payouts/ })
        expect(row).toHaveClass('motion-press-row', 'extra')
        rerender(<ListSectionRow label="Payouts" onTap={vi.fn()} press={false} />)
        expect(screen.getByRole('button', { name: /Payouts/ }).className).not.toMatch(/motion-press/)
        rerender(<ListSectionRow label="Plan" className="extra" />)
        // A static row does not press, but still takes the className.
        expect(container.firstElementChild).toHaveClass('extra')
        expect(container.firstElementChild!.className).not.toMatch(/motion-press/)
    })

    it('FilterChipRow: every chip presses and takes chipClassName', () => {
        const { rerender } = render(
            <FilterChipRow
                options={[
                    { value: 'all', label: 'All' },
                    { value: 'today', label: 'Today' },
                ]}
                value="all"
                onChange={vi.fn()}
                chipClassName="extra"
            />
        )
        for (const chip of screen.getAllByRole('tab')) expect(chip).toHaveClass('motion-press', 'extra')
        rerender(
            <FilterChipRow
                options={[{ value: 'all', label: 'All' }]}
                value="all"
                onChange={vi.fn()}
                press={false}
            />
        )
        expect(screen.getByRole('tab').className).not.toMatch(/motion-press/)
    })

    it('a busy or disabled Button does not press: the rule needs :not(:disabled)', () => {
        const css = readFileSync(resolve(process.cwd(), 'src/utilities/animations.css'), 'utf8')
        expect(css).toContain('.motion-press:active:not(:disabled, [aria-disabled="true"])')
        render(<Button busy>Book</Button>)
        expect(screen.getByRole('button')).toBeDisabled()
    })
})
