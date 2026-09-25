import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Spinner } from './Spinner'

/**
 * AUTM-1046 — the three promises the Spinner makes, asserted on the DOM.
 *
 * jsdom has no media queries, so the reduced-motion case is asserted the way
 * the rest of this directory asserts motion: the classes that carry it are
 * present. What they DO under `prefers-reduced-motion: reduce` is checked in
 * a browser (DevTools → Rendering → emulate the media feature).
 */
describe('Spinner', () => {
    it('is a status with the default label as its accessible name', () => {
        render(<Spinner />)
        const status = screen.getByRole('status')
        expect(status).toHaveTextContent('Loading')
        expect(screen.getByRole('status', { name: 'Loading' })).toBe(status)
    })

    it('announces a specific label when one is passed', () => {
        render(<Spinner label="Uploading photo" />)
        expect(screen.getByRole('status', { name: 'Uploading photo' })).toBeInTheDocument()
        // The label is for assistive tech only; visible copy is the caller's job.
        expect(screen.getByText('Uploading photo')).toHaveClass('sr-only')
    })

    it('is aria-hidden, silent and not a status when decorative', () => {
        const { container } = render(<Spinner decorative label="Uploading photo" />)
        const root = container.firstElementChild!
        expect(root).toHaveAttribute('aria-hidden', 'true')
        expect(root).not.toHaveAttribute('role')
        expect(screen.queryByRole('status')).toBeNull()
        expect(container.textContent).toBe('')
    })

    it('stops spinning and swaps to a static ring under reduced motion', () => {
        const { container } = render(<Spinner />)
        const svg = container.querySelector('[data-spinner-motion]')!
        expect(svg.getAttribute('class')).toContain('animate-spin')
        expect(svg.getAttribute('class')).toContain('motion-reduce:animate-none')

        // The moving arc hides, and a distinct still shape takes its place.
        expect(svg.querySelector('g')!.getAttribute('class')).toContain('motion-reduce:hidden')
        const still = container.querySelector('[data-spinner-reduced]')!
        expect(still.getAttribute('class')).toContain('hidden')
        expect(still.getAttribute('class')).toContain('motion-reduce:inline')
        expect(still.getAttribute('stroke-dasharray')).toBeTruthy()
    })

    it('never hardcodes the brand hex; tones resolve through tokens or currentColor', () => {
        const accent = render(<Spinner />).container.innerHTML
        expect(accent).toContain('text-[var(--accent)]')
        expect(accent.toLowerCase()).not.toContain('#4e1bbd')

        const photo = render(<Spinner tone="on-photo" />).container.firstElementChild!
        expect(photo).toHaveClass('text-white')

        const current = render(<Spinner tone="current" />).container.firstElementChild!
        expect(current.className).not.toMatch(/\btext-/)
    })

    it.each([
        ['sm', 'size-4'],
        ['md', 'size-6'],
        ['lg', 'size-10'],
    ] as const)('size %s renders %s', (size, cls) => {
        const { container } = render(<Spinner size={size} />)
        expect(container.querySelector('svg')!.getAttribute('class')).toContain(cls)
    })
})
