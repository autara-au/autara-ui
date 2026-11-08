import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

/**
 * AUTM-2042 (Don, 2026-11-08): `illustration`, "the cut-out object on the grey
 * band tile". jsdom has no layout, so the layout is read from the classes.
 */
describe('EmptyState', () => {
    it('without an illustration is the left-aligned card it was, icon disc and full-width action', () => {
        const { container } = render(
            <EmptyState icon={<span>i</span>} title="No bookings yet" action={<button>Add a service</button>} />
        )
        const card = container.firstElementChild as HTMLElement
        expect(card.className).toBe(
            'flex flex-col gap-2.5 rounded-[1.5rem] bg-[var(--band)] p-5 text-[var(--text-strong)] '
        )
        expect(card).not.toHaveAttribute('data-layout')
        expect(container.querySelector('[data-slot="illustration"]')).toBeNull()
        expect(container.querySelector('.rounded-full.size-11')).not.toBeNull()
        expect(screen.getByRole('button').parentElement!.className).toBe('flex flex-col')
    })

    it('with an illustration centres the band card: the picture, then the words, then the action at its own width', () => {
        const { container } = render(
            <EmptyState
                illustration={<img src="cutout.webp" alt="" />}
                title="No bookings yet"
                description="New requests will appear here."
                action={<button>Share your link</button>}
                className="mt-4"
            />
        )
        const card = container.firstElementChild as HTMLElement
        expect(card).toHaveAttribute('data-layout', 'illustrated')
        expect(card.className).toContain('bg-[var(--band)]')
        expect(card.className).toContain('rounded-[1.5rem]')
        expect(card.className).toMatch(/\bitems-center\b/)
        expect(card.className).toMatch(/\btext-center\b/)
        expect(card.className).toMatch(/\bmt-4$/)

        const box = container.querySelector('[data-slot="illustration"]') as HTMLElement
        expect(box).toHaveAttribute('aria-hidden', 'true')
        expect(box.className).toMatch(/\bw-40\b/) // 10rem, so it scales with text
        expect(box.className).toMatch(/\bmax-w-full\b/) // and never overflows a narrow card at 200%
        expect(box.className).toMatch(/\baspect-square\b/)
        expect(box.className).toContain('[&>img]:object-contain')
        expect(card.firstElementChild).toBe(box) // above the title

        const actionRow = screen.getByRole('button').parentElement!
        expect(actionRow.className).toMatch(/\bitems-center\b/) // not stretched
        // The picture is not announced; the title says what is empty.
        expect(screen.queryByRole('img')).toBeNull()
    })

    it('takes the illustration over the icon when both are passed', () => {
        const { container } = render(
            <EmptyState icon={<span data-testid="icon">i</span>} illustration={<img src="x.webp" alt="" />} title="Empty" />
        )
        expect(container.querySelector('[data-slot="illustration"]')).not.toBeNull()
        expect(screen.queryByTestId('icon')).toBeNull()
        expect(container.querySelector('.rounded-full')).toBeNull()
    })

    it('treats an empty illustration as none', () => {
        const { container } = render(<EmptyState illustration={null} icon={<span>i</span>} title="Empty" />)
        expect(container.querySelector('[data-slot="illustration"]')).toBeNull()
        expect(container.firstElementChild).not.toHaveAttribute('data-layout')
    })

    it('adds no motion of its own', () => {
        const { container } = render(<EmptyState illustration={<img src="x.webp" alt="" />} title="Empty" />)
        expect(container.innerHTML).not.toMatch(/animate-|motion-|transition/)
    })
})
