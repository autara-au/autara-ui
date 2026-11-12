import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AsyncSkeleton } from './AsyncSkeleton'
import { EmptyState } from './EmptyState'
import { ErrorCard } from './ErrorCard'
import { MessageThread } from './MessageThread'
import { Stepper } from './Stepper'

/**
 * AUTM-1221 — the feedback grammar, on the Autara Glass rules.
 *
 * Every one of these was a treatment the house rules retired that shipped in
 * the library anyway, so every consumer inherited it. They assert CLASSES and
 * ATTRIBUTES rather than pixels, because jsdom has no layout engine (see
 * tap-targets.test.tsx for the same caveat stated at length).
 */
describe('feedback grammar', () => {
    it('Stepper names its progress bar, and does not letterspace its eyebrow', () => {
        // AUTM-1213: an accessible name does not inherit from the nav.
        render(
            <Stepper
                ariaLabel="Booking progress"
                currentStep={0}
                steps={[
                    { id: 'a', label: 'Service' },
                    { id: 'b', label: 'Vehicle' },
                ]}
            />,
        )
        const bar = screen.getByRole('progressbar', { name: 'Booking progress' })
        expect(bar).toHaveAttribute('aria-valuetext', 'Step 1 of 2: Service')
        expect(bar.className).not.toContain('rounded-full')

        const eyebrow = screen.getByText(/Step 1 of 2/)
        expect(eyebrow.className).not.toContain('editorial-eyebrow')
        expect(eyebrow.className).not.toContain('uppercase')
    })

    it('MessageThread leaves the separator casing to the consumer formatter', () => {
        render(
            <MessageThread
                items={[
                    { id: '1', text: 'Morning', side: 'them', createdAt: '2026-09-10T09:00:00Z' },
                ]}
                formatTimestamp={() => 'Today at 9:00 am'}
            />,
        )
        const stamp = screen.getByText('Today at 9:00 am')
        expect(stamp.className).not.toContain('uppercase')
        expect(stamp.className).not.toContain('tracking-[0.18em]')
    })

    it('ErrorCard offers its retry as the lime action, never an outline', () => {
        render(<ErrorCard message="We could not load this." onRetry={() => {}} />)
        const retry = screen.getByRole('button', { name: 'Retry' })
        // AUTM-1594 drew it ink on the band card; AUTM-1838 (no black
        // buttons, Don 2026-10-12) makes it the lime primary.
        expect(retry.className).toContain('bg-[var(--lime)]')
        expect(retry.className).not.toContain('bg-[var(--strong)]')
        expect(retry.className).not.toContain('border')
        // The sheet's 44px strong action, across the card.
        expect(retry.className).toContain('min-h-11')
        expect(retry.className).toContain('w-full')
    })

    it('EmptyState is the sheet\'s band card, never a tint in a dashed box', () => {
        // AUTM-1594 — canvas v44 "Empty": a band card with the icon in a
        // raised disc. No dashed edge, no tint, no outline.
        const { container } = render(
            <EmptyState icon={<span>·</span>} title="No vehicles saved yet" />,
        )
        expect(container.innerHTML).not.toContain('border-dashed')
        expect(container.innerHTML).not.toContain('rgba(78,27,189')
        expect(container.firstElementChild!.className).toContain('bg-[var(--band)]')
        expect(container.innerHTML).toContain('bg-[var(--raised)]')
    })

    it('AsyncSkeleton says what is loading when it is told, and stays silent when it is not', () => {
        const { rerender, container } = render(<AsyncSkeleton variant="list" count={2} />)
        // No label: the shapes carry no information, so they announce nothing.
        expect(container.querySelector('[role="status"]')).toBeNull()
        expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()

        rerender(<AsyncSkeleton variant="list" count={2} label="Loading your bookings" />)
        const status = screen.getByRole('status')
        expect(status.textContent).toBe('Loading your bookings')
        // Visible, not sr-only: a slow connection is worth telling everyone about.
        expect(status.className).not.toContain('sr-only')
    })
})
