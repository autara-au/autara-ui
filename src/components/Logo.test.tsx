import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Logo } from './Logo'

describe('Logo', () => {
    it('names itself for a screen reader', () => {
        render(<Logo />)
        expect(screen.getByRole('img', { name: 'Autara' })).toBeInTheDocument()
    })

    it('names the pair ONCE as a business lockup', () => {
        // AUTM-1158 — the first cut passed `aria-hidden` to the inner mark
        // without declaring it in LogoProps, so React dropped it and the SVG
        // kept `role="img" aria-label="Autara"` INSIDE a span already named
        // "Autara for business". A screen reader read the brand twice.
        //
        // Caught by rendering the markup rather than by reading the JSX, and
        // it type-checked perfectly either way.
        render(<Logo lockup="business" />)
        const all = screen.getAllByRole('img')
        expect(all).toHaveLength(1)
        expect(all[0]).toHaveAttribute('aria-label', 'Autara for business')
    })

    it('carries the descriptor as real text, not a background', () => {
        // It must survive a copy-paste and a text-only rendering, and it must
        // never be hidden at a breakpoint: both consumers previously wrote it
        // `hidden sm:inline`, so on a phone the merchant product wore the
        // consumer brand exactly.
        const { container } = render(<Logo lockup="business" />)
        expect(container.textContent).toContain('for business')
        expect(container.querySelector('.hidden')).toBeNull()
    })

    it('scales the descriptor with the mark rather than pinning it', () => {
        // The two cannot be set independently: `em` resolves against the
        // inherited font-size, not the SVG's box, so a fixed caption size
        // drifts the moment the mark is resized.
        const { container: sm } = render(<Logo lockup="business" size="sm" />)
        const { container: xl } = render(<Logo lockup="business" size="xl" />)
        expect(sm.querySelector('svg')?.getAttribute('class')).toContain('h-5')
        expect(xl.querySelector('svg')?.getAttribute('class')).toContain('h-9')
        expect(sm.innerHTML).toContain('text-[0.6875rem]')
        expect(xl.innerHTML).toContain('text-base')
    })

    it('ignores the lockup when the wordmark is rendered alone', () => {
        // `textOnly` exists for narrow chrome; a descriptor there would defeat
        // the reason the orb was dropped in the first place.
        render(<Logo textOnly lockup="business" />)
        expect(screen.getByRole('img', { name: 'Autara' })).toBeInTheDocument()
        expect(screen.queryByText('for business')).toBeNull()
    })
})

describe('the business lockup stays on one line (AUTM-1792)', () => {
    it('never lets the descriptor wrap', () => {
        render(<Logo lockup="business" size="sm" />)
        expect(screen.getByText('for business').className).toContain('whitespace-nowrap')
    })
})

describe('every logo has its own orb gradient (AUTM-1792)', () => {
    it('gives two logos on one page different gradient ids, each used by its own orb', () => {
        const { container } = render(
            <>
                <Logo />
                <Logo lockup="business" />
            </>
        )
        const ids = Array.from(container.querySelectorAll('linearGradient')).map((g) => g.id)
        expect(ids).toHaveLength(2)
        expect(new Set(ids).size).toBe(2)
        const fills = Array.from(container.querySelectorAll('path[fill^="url(#"]')).map((p) => p.getAttribute('fill'))
        expect(fills).toEqual(ids.map((id) => `url(#${id})`))
    })
})

describe('the mark alone, wordmark={false} (AUTM-1792)', () => {
    it('draws the orb and none of the lettering', () => {
        // Don, 2026-10-09: the portal shows the icon, not the text logo. The
        // full logo is six letter paths plus the orb; the mark is the orb.
        const { container: full } = render(<Logo />)
        const { container: mark } = render(<Logo wordmark={false} />)
        expect(full.querySelectorAll('svg path')).toHaveLength(7)
        expect(mark.querySelectorAll('svg path')).toHaveLength(1)
        expect(mark.querySelector('svg')?.getAttribute('viewBox')).toBe('10.8 8.8 239.7 239.7')
    })

    it('names itself "Autara" on its own, and hides when told to', () => {
        const { rerender } = render(<Logo wordmark={false} />)
        expect(screen.getByRole('img', { name: 'Autara' })).toBeInTheDocument()
        rerender(<Logo wordmark={false} aria-hidden />)
        expect(screen.queryByRole('img')).toBeNull()
    })

    it('becomes mark, hairline, descriptor in the business lockup, named once', () => {
        // The accessible name is the pair's, "Autara for business", exactly
        // once: the mark inside is decorative.
        const { container } = render(<Logo lockup="business" wordmark={false} size="sm" />)
        const all = screen.getAllByRole('img')
        expect(all).toHaveLength(1)
        expect(all[0]).toHaveAttribute('aria-label', 'Autara for business')
        expect(container.querySelectorAll('svg path')).toHaveLength(1)
        expect(container.querySelector('svg')?.getAttribute('class')).toContain('h-5')
        expect(screen.getByText('for business').className).toContain('whitespace-nowrap')
        expect(container.textContent).toBe('for business')
    })

    it('keeps the lockup on the same row geometry with or without the lettering', () => {
        // Same wrapper classes and the same size class on the mark: swapping
        // the lettering out must not move the rhythm around it.
        const { container: a } = render(<Logo lockup="business" size="md" />)
        const { container: b } = render(<Logo lockup="business" size="md" wordmark={false} />)
        expect(b.firstElementChild?.className).toBe(a.firstElementChild?.className)
        expect(b.querySelector('svg')?.getAttribute('class')).toBe(a.querySelector('svg')?.getAttribute('class'))
    })

    it('wins over textOnly, which would otherwise draw nothing', () => {
        const { container } = render(<Logo textOnly wordmark={false} />)
        expect(container.querySelectorAll('svg path')).toHaveLength(1)
    })

    it('gives two marks their own gradient ids', () => {
        const { container } = render(
            <>
                <Logo wordmark={false} />
                <Logo wordmark={false} />
            </>
        )
        const ids = Array.from(container.querySelectorAll('linearGradient')).map((g) => g.id)
        expect(ids).toHaveLength(2)
        expect(new Set(ids).size).toBe(2)
    })
})

describe('the white tone (AUTM-1792)', () => {
    it('paints the orb solid white and draws no gradient', () => {
        const { container } = render(<Logo wordmark={false} tone="white" />)
        expect(container.querySelector('linearGradient')).toBeNull()
        expect(container.querySelector('path')?.getAttribute('fill')).toBe('#ffffff')
    })

    it('whitens the orb of the full logo too, leaving the lettering on currentColor', () => {
        const { container } = render(<Logo tone="white" />)
        expect(container.querySelector('linearGradient')).toBeNull()
        const fills = Array.from(container.querySelectorAll('svg > path')).map((p) => p.getAttribute('fill'))
        expect(fills).toEqual(['#ffffff'])
        expect(container.querySelector('g')?.getAttribute('fill')).toBe('currentColor')
    })

    it('is carried into the business lockup', () => {
        const { container } = render(<Logo lockup="business" wordmark={false} tone="white" />)
        expect(container.querySelector('path')?.getAttribute('fill')).toBe('#ffffff')
    })

    it('leaves the default exactly as it was: brand gradient, full lettering', () => {
        // merchant-web and customer-web render <Logo /> and
        // <Logo lockup="business" />; neither may change.
        const { container } = render(<Logo lockup="business" />)
        expect(container.querySelectorAll('linearGradient')).toHaveLength(1)
        expect(container.querySelectorAll('svg path')).toHaveLength(7)
        expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 901.2 257.4')
        expect(container.querySelector('svg > path')?.getAttribute('fill')).toMatch(/^url\(#autara-logo-orb-/)
    })
})
