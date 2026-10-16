import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MessageCard } from './MessageCard'

/** AUTM-1806 (U3): the card shows what it is given, and its answers weigh the same. */
describe('MessageCard', () => {
    it('names itself by its title and draws the server figure and balance as given', () => {
        render(
            <MessageCard
                title="Pet hair removal"
                figure="+$40.00"
                balance="If you approve, your balance becomes $190.00."
                state="waiting"
            />,
        )
        expect(screen.getByRole('article', { name: 'Pet hair removal' })).toBeTruthy()
        expect(screen.getByText('+$40.00')).toBeTruthy()
        expect(screen.getByText('If you approve, your balance becomes $190.00.')).toBeTruthy()
    })

    it.each([
        ['waiting', 'Waiting'],
        ['approved', 'Approved'],
        ['declined', 'Declined'],
        ['expired', 'Expired'],
    ] as const)('state %s reads "%s" in a polite status', (state, word) => {
        render(<MessageCard title="x" state={state} />)
        expect(screen.getByRole('status').textContent).toBe(word)
        expect(screen.getByRole('article').getAttribute('data-state')).toBe(state)
    })

    it('declined and expired never wear a warning colour', () => {
        for (const state of ['declined', 'expired'] as const) {
            const { unmount } = render(<MessageCard title="x" state={state} />)
            const chip = screen.getByRole('status').firstElementChild as HTMLElement
            expect(chip.className).not.toMatch(/danger|amber|warning/)
            unmount()
        }
    })

    it('puts the secondary answer first, both the same size, with their names and ids', () => {
        const approve = vi.fn()
        const decline = vi.fn()
        render(
            <MessageCard
                title="Pet hair removal"
                primaryAction={{ label: 'Approve', ariaLabel: 'Approve Pet hair removal, $40.00', onClick: approve, testId: 'booking-detail-chat-extra-approve' }}
                secondaryAction={{ label: 'No thanks', ariaLabel: 'Decline Pet hair removal, $40.00', onClick: decline, testId: 'booking-detail-chat-extra-decline' }}
            />,
        )
        const buttons = screen.getAllByRole('button')
        expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([
            'Decline Pet hair removal, $40.00',
            'Approve Pet hair removal, $40.00',
        ])
        const size = (el: HTMLElement) => el.className.match(/min-h-\d+/)?.[0]
        expect(size(buttons[0])).toBe(size(buttons[1]))
        fireEvent.click(screen.getByTestId('booking-detail-chat-extra-approve'))
        fireEvent.click(screen.getByTestId('booking-detail-chat-extra-decline'))
        expect(approve).toHaveBeenCalledTimes(1)
        expect(decline).toHaveBeenCalledTimes(1)
    })

    it('while one answer is in flight the other cannot be pressed', () => {
        render(
            <MessageCard
                title="x"
                primaryAction={{ label: 'Approve', onClick: () => {}, busy: true }}
                secondaryAction={{ label: 'No thanks', onClick: () => {} }}
            />,
        )
        expect((screen.getByRole('button', { name: 'No thanks' }) as HTMLButtonElement).disabled).toBe(true)
        expect(screen.getByRole('article').getAttribute('aria-busy')).toBe('true')
    })

    it('a failed answer is an alert in words', () => {
        render(<MessageCard title="x" error="We couldn't save your answer. Nothing has changed. Try again." />)
        expect(screen.getByRole('alert').textContent).toContain("We couldn't save your answer")
    })

    it('draws a destructive answer as danger, red words on the quiet pill (AUTM-1878 follow-up)', () => {
        render(
            <MessageCard
                title="Roof box"
                state="waiting"
                secondaryAction={{ label: 'Remove', onClick: () => {}, destructive: true, testId: 'remove' }}
                primaryAction={{ label: 'Remind Sam', onClick: () => {} }}
            />,
        )
        expect(screen.getByTestId('remove').className).toContain('text-[var(--danger)]')
    })

  it('AUTM-1905: an action can lead with a hidden icon; the label stays its name', () => {
    render(
      <MessageCard
        title="Roof box clean and wax"
        primaryAction={{
          label: 'Remind Sam',
          onClick: () => {},
          leadingIcon: <svg data-testid="remind-icon" aria-hidden="true" />,
        }}
      />,
    )
    const button = screen.getByRole('button', { name: 'Remind Sam' })
    expect(button.querySelector('[data-testid="remind-icon"]')).not.toBeNull()
  })
})
