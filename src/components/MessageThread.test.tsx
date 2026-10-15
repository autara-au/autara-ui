import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MessageThread, type MessageItem } from './MessageThread'

const T = Date.UTC(2026, 9, 9, 9, 0)

/** AUTM-1806 (U1): rich rows and an honest send status. */
describe('MessageThread send status', () => {
    it('says Sending while in flight and nothing once sent', () => {
        const items: MessageItem[] = [
            { id: 'a', side: 'own', text: 'See you at nine.', createdAt: T, status: 'sending' },
            { id: 'b', side: 'own', text: 'Gate is open.', createdAt: T + 1, status: 'sent' },
        ]
        render(<MessageThread items={items} />)
        expect(screen.getAllByText('Sending')).toHaveLength(1)
        expect(screen.queryByText(/^Sent$/)).toBeNull()
    })

    it('a failed send keeps its text and offers a 44px retry that calls back', () => {
        const onRetry = vi.fn()
        render(
            <MessageThread
                items={[{ id: 'a', side: 'own', text: 'Gate code is 4821.', createdAt: T, status: 'failed', onRetry }]}
                retryTestId="booking-chat-message-retry"
            />,
        )
        expect(screen.getByText('Gate code is 4821.')).toBeTruthy()
        const retry = screen.getByRole('button', { name: 'Not sent. Tap to retry.' })
        expect(retry.getAttribute('data-testid')).toBe('booking-chat-message-retry')
        expect(retry.className).toContain('min-h-11')
        fireEvent.click(retry)
        expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('without a retry the failed line is words, not a dead button', () => {
        render(<MessageThread items={[{ id: 'a', side: 'own', text: 'x', createdAt: T, status: 'failed' }]} />)
        expect(screen.getByText('Not sent.')).toBeTruthy()
        expect(screen.queryByRole('button')).toBeNull()
    })

    it('never draws a send status on the other side', () => {
        render(<MessageThread items={[{ id: 'a', side: 'incoming', text: 'x', createdAt: T, status: 'failed' }]} />)
        expect(screen.queryByText(/Not sent/)).toBeNull()
    })

    it('says a new failure once, politely', () => {
        const items: MessageItem[] = [{ id: 'a', side: 'own', text: 'x', createdAt: T, status: 'sending' }]
        const { rerender } = render(<MessageThread items={items} />)
        const status = screen.getByRole('status')
        expect(status.textContent).toBe('')
        rerender(<MessageThread items={[{ ...items[0], status: 'failed', onRetry: () => {} }]} />)
        expect(screen.getByRole('status').textContent).toMatch(/wasn't sent/)
    })
})

describe('MessageThread rows and roles', () => {
    it('renders a body in place of the bubble, with its test id and side', () => {
        render(
            <MessageThread
                items={[
                    { id: 'm', side: 'incoming', text: 'Before', createdAt: T },
                    {
                        id: 'c',
                        side: 'incoming',
                        createdAt: T + 1000,
                        testId: 'booking-chat-extra-card',
                        body: <div>The card</div>,
                    },
                ]}
            />,
        )
        const row = screen.getByTestId('booking-chat-extra-card')
        expect(row.textContent).toContain('The card')
        // Sorted with the messages by time.
        const rows = Array.from(document.querySelectorAll('li'))
        expect(rows[1]).toBe(row)
    })

    it('is a named log only when asked, so it never nests in a consumer log', () => {
        const { rerender } = render(<MessageThread items={[{ id: 'a', side: 'own', text: 'x' }]} />)
        expect(screen.queryByRole('log')).toBeNull()
        rerender(<MessageThread items={[{ id: 'a', side: 'own', text: 'x' }]} logLabel="Messages with Sam" />)
        expect(screen.getByRole('log', { name: 'Messages with Sam' })).toBeTruthy()
    })

    it('says it is loading, since the skeleton is decorative', () => {
        render(<MessageThread items={[]} loading />)
        expect(screen.getByRole('status').textContent).toBe('Loading messages')
    })
})

/** AUTM-1878: keyboard scrolling, the fade and the slot above the rows. */
describe('MessageThread in a box', () => {
    const rows: MessageItem[] = [
        { id: 'a', side: 'incoming', text: 'Is there power?', createdAt: T },
        { id: 'b', side: 'own', text: 'Yes, by the garage.', createdAt: T + 1000 },
    ]

    it('the scroll area takes focus and is a named region when it is not a log', () => {
        render(<MessageThread items={rows} label="Messages with Sam" />)
        const region = screen.getByRole('region', { name: 'Messages with Sam' })
        expect(region.getAttribute('tabindex')).toBe('0')
        expect(screen.queryByRole('log')).toBeNull()
    })

    it('draws `before` above the first row, inside the scroll area', () => {
        render(<MessageThread items={rows} before={<button type="button">Load earlier</button>} />)
        const region = screen.getByRole('region', { name: 'Messages' })
        const load = screen.getByRole('button', { name: 'Load earlier' })
        expect(region.contains(load)).toBe(true)
        expect(load.compareDocumentPosition(screen.getByText('Is there power?')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('fades the top edge only once there is history above', () => {
        render(<MessageThread items={rows} fadeTop />)
        const region = screen.getByRole('region', { name: 'Messages' })
        expect(region.getAttribute('data-fade')).toBeNull()
        region.scrollTop = 40
        fireEvent.scroll(region)
        expect(region.getAttribute('data-fade')).toBe('top')
    })

    it('timestamps are at the body-small step', () => {
        render(<MessageThread items={rows} />)
        const stamp = document.querySelector('li p')!
        expect(stamp.className).toContain('text-[0.8125rem]')
    })
})
