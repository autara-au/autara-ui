import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BackButton } from './BackButton'

describe('BackButton (AUTM-1756)', () => {
    it('with a destination it is the labelled pill, named "Back to <destination>"', () => {
        render(<BackButton label="Invoice" />)
        const button = screen.getByRole('button', { name: 'Back to Invoice' })
        expect(button).toHaveAttribute('data-shape', 'pill')
        // The visible word is in the name (WCAG 2.5.3), and the name says
        // what the control does.
        expect(button).toHaveTextContent('Invoice')
        expect(button.className).toContain('bg-[var(--icon-disc)]')
        expect(button.className).toContain('font-medium')
        expect(button.className).toContain('min-h-11')
        expect(button.className).toContain('pointer-coarse:min-h-12')
    })

    it('without a destination it is the bare chevron on the 44px disc, named Back', () => {
        render(<BackButton />)
        const button = screen.getByRole('button', { name: 'Back' })
        expect(button).toHaveAttribute('data-shape', 'disc')
        expect(button.className).toContain('size-11')
        expect(button.className).toContain('pointer-coarse:size-12')
        expect(button.className).toContain('bg-[var(--icon-disc)]')
    })

    it('compact keeps the destination in the name where there is no room for the word', () => {
        render(<BackButton label="Bookings" compact />)
        const button = screen.getByRole('button', { name: 'Back to Bookings' })
        expect(button).toHaveAttribute('data-shape', 'disc')
        expect(button).not.toHaveTextContent('Bookings')
    })

    it('compact="phone" is the pill from 40rem up and the disc below it', () => {
        render(<BackButton label="Inbox" compact="phone" />)
        const button = screen.getByRole('button', { name: 'Back to Inbox' })
        expect(button).toHaveAttribute('data-shape', 'pill-phone-disc')
        expect(button.className).toContain('max-sm:size-11')
        expect(screen.getByText('Inbox').className).toContain('max-sm:sr-only')
    })

    it('answers the pointer like the icon disc, with the library focus ring', () => {
        render(<BackButton label="Invoice" />)
        const cls = screen.getByRole('button').className
        expect(cls).toMatch(/\bicon-disc\b/)
        expect(cls).toMatch(/\bmotion-press\b/)
        expect(cls).toContain('focus-visible:ring-[var(--accent)]')
        expect(cls).toContain('focus-visible:ring-offset-2')
    })

    it('ondark is the translucent white disc for brand grounds', () => {
        render(<BackButton tone="ondark" />)
        expect(screen.getByRole('button').className).toContain('bg-[var(--icon-disc-ondark)]')
    })

    it('fires onClick', async () => {
        const onClick = vi.fn()
        render(<BackButton label="Invoice" onClick={onClick} />)
        await userEvent.click(screen.getByRole('button'))
        expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('composes with a link through asChild, filling the empty element', () => {
        render(
            <BackButton asChild label="Bookings">
                <a href="/account/bookings" />
            </BackButton>
        )
        const link = screen.getByRole('link', { name: 'Back to Bookings' })
        expect(link).toHaveAttribute('href', '/account/bookings')
        expect(link).not.toHaveAttribute('type')
    })
})
