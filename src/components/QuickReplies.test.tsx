import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { QuickReplies } from './QuickReplies'

/** AUTM-1806 (U4). */
describe('QuickReplies', () => {
    const replies = [
        { id: 'late', label: "I'm running late" },
        { id: 'here', label: "I'm here", value: "I'm here, out the front." },
    ]

    it('is a named group of 44px chips that wrap', () => {
        render(<QuickReplies replies={replies} onSelect={() => {}} chipTestId="booking-chat-quick-reply" />)
        const group = screen.getByRole('group', { name: 'Quick replies' })
        expect(group.className).toContain('flex-wrap')
        const chips = screen.getAllByTestId('booking-chat-quick-reply')
        expect(chips).toHaveLength(2)
        for (const chip of chips) expect(chip.className).toContain('min-h-11')
        expect(chips[1].getAttribute('data-reply-id')).toBe('here')
    })

    it('hands the reply back to fill the composer, and sends nothing itself', () => {
        const onSelect = vi.fn()
        render(<QuickReplies replies={replies} onSelect={onSelect} />)
        fireEvent.click(screen.getByRole('button', { name: "I'm here" }))
        expect(onSelect).toHaveBeenCalledWith(replies[1])
    })

    it('draws nothing with no replies', () => {
        const { container } = render(<QuickReplies replies={[]} onSelect={() => {}} />)
        expect(container.firstChild).toBeNull()
    })
})

/** AUTM-1878: one line that scrolls sideways. */
describe('QuickReplies layout="row"', () => {
    it('is still the named group, on one line, chips that never wrap their words', () => {
        render(
            <QuickReplies
                layout="row"
                replies={[
                    { id: 'a', label: 'On my way' },
                    { id: 'b', label: '15 minutes away' },
                ]}
                onSelect={() => {}}
            />,
        )
        const group = screen.getByRole('group', { name: 'Quick replies' })
        expect(group.getAttribute('data-layout')).toBe('row')
        // AUTM-1756 follow-up: a ChipRow, one line with no scrollbar
        // (utilities/chip-row.css), and its chevrons named for replies.
        expect(group.className).toContain('chip-row__scroller')
        expect(screen.getByRole('button', { name: 'Show more replies' }).getAttribute('aria-controls')).toBe(group.id)
        expect(screen.getByRole('button', { name: 'Show earlier replies' })).toBeTruthy()
        for (const chip of within(group).getAllByRole('button')) {
            expect(chip.className).toContain('shrink-0')
            expect(chip.className).toContain('min-h-11')
        }
    })
})

describe('QuickReplies per-chip test id', () => {
    it("a chip's own testId wins over chipTestId", () => {
        render(
            <QuickReplies
                replies={[
                    { id: 'a', label: 'Pet hair removal · $40' },
                    { id: 'custom', label: 'Custom extra', testId: 'booking-addon-add-open' },
                ]}
                chipTestId="booking-addon-suggestion"
                onSelect={() => {}}
            />,
        )
        expect(screen.getByRole('button', { name: 'Custom extra' }).getAttribute('data-testid')).toBe('booking-addon-add-open')
        expect(screen.getByRole('button', { name: 'Pet hair removal · $40' }).getAttribute('data-testid')).toBe(
            'booking-addon-suggestion',
        )
    })
})
