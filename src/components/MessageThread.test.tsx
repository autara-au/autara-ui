import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

/**
 * AUTM-1946: the loading, error and empty states are drawn in the same named,
 * focusable scroll host as the rows, so at 200% text they scroll with the
 * keyboard (axe scrollable-region-focusable on the portal Inbox).
 */
describe('MessageThread states', () => {
    // jsdom has no Element.scrollTo, which the thread calls as rows arrive.
    const realScrollTo = Element.prototype.scrollTo
    beforeEach(() => {
        Element.prototype.scrollTo = vi.fn()
    })
    afterEach(() => {
        Element.prototype.scrollTo = realScrollTo
    })

    const rows: MessageItem[] = [{ id: 'a', side: 'incoming', text: 'Is there power?', createdAt: T }]
    const states = {
        loading: { loading: true },
        error: { error: true, onRetry: () => {} },
        empty: { emptyState: <p>No messages yet</p> },
    } as const

    it.each(Object.entries(states))('%s: a named region that takes focus, with the focus ring', (state, props) => {
        render(<MessageThread items={[]} label="Messages with Sam" {...props} />)
        const region = screen.getByRole('region', { name: 'Messages with Sam' })
        expect(region.getAttribute('tabindex')).toBe('0')
        expect(region.getAttribute('data-state')).toBe(state)
        expect(region.className).toContain('overflow-y-auto')
        expect(region.className).toContain('focus-visible:ring-[var(--accent)]')
        region.focus()
        expect(document.activeElement).toBe(region)
    })

    it('is named by logLabel in every state, and becomes the log only once rows arrive', () => {
        const { rerender } = render(<MessageThread items={[]} loading logLabel="Messages with Sam" />)
        const region = screen.getByRole('region', { name: 'Messages with Sam' })
        expect(screen.queryByRole('log')).toBeNull()
        rerender(<MessageThread items={rows} logLabel="Messages with Sam" />)
        // The same element: a log that existed before the rows would read them all out.
        expect(screen.getByRole('log', { name: 'Messages with Sam' })).toBe(region)
    })

    it('loading is busy and says so; the rows clear both', () => {
        const { rerender } = render(<MessageThread items={[]} loading />)
        const region = screen.getByRole('region', { name: 'Messages' })
        expect(region.getAttribute('aria-busy')).toBe('true')
        expect(screen.getByRole('status').textContent).toBe('Loading messages')
        rerender(<MessageThread items={rows} />)
        expect(region.getAttribute('aria-busy')).toBeNull()
        expect(screen.getByRole('status').textContent).toBe('')
    })

    it('error is an alert inside the region, with a 44px Retry that calls back', () => {
        const onRetry = vi.fn()
        render(<MessageThread items={[]} error onRetry={onRetry} errorMessage="Check your connection and tap retry." />)
        const region = screen.getByRole('region', { name: 'Messages' })
        const alert = screen.getByRole('alert')
        expect(region.contains(alert)).toBe(true)
        expect(alert.textContent).toContain("Couldn't load messages")
        const retry = screen.getByRole('button', { name: 'Retry' })
        expect(retry.className).toContain('min-h-11')
        fireEvent.click(retry)
        expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('error without onRetry draws no dead button, and the region still takes focus', () => {
        render(<MessageThread items={[]} error />)
        expect(screen.queryByRole('button')).toBeNull()
        expect(screen.getByRole('region', { name: 'Messages' }).getAttribute('tabindex')).toBe('0')
    })

    it('Retry that goes back to loading leaves focus in the thread, not on the page', () => {
        const { rerender } = render(<MessageThread items={[]} error onRetry={() => {}} />)
        const region = screen.getByRole('region', { name: 'Messages' })
        const retry = screen.getByRole('button', { name: 'Retry' })
        retry.focus()
        expect(document.activeElement).toBe(retry)
        rerender(<MessageThread items={[]} loading onRetry={() => {}} />)
        expect(document.activeElement).toBe(region)
        expect(screen.getByRole('status').textContent).toBe('Loading messages')
    })

    it('focus on the host stays there as the rows arrive', () => {
        const { rerender } = render(<MessageThread items={[]} loading />)
        const region = screen.getByRole('region', { name: 'Messages' })
        region.focus()
        rerender(<MessageThread items={rows} />)
        expect(document.activeElement).toBe(region)
        expect(region.getAttribute('data-state')).toBe('thread')
    })

    it('never takes focus that was somewhere else on the page', () => {
        const { rerender } = render(
            <>
                <button type="button">Outside</button>
                <MessageThread items={[]} error onRetry={() => {}} />
            </>,
        )
        const outside = screen.getByRole('button', { name: 'Outside' })
        outside.focus()
        rerender(
            <>
                <button type="button">Outside</button>
                <MessageThread items={rows} />
            </>,
        )
        expect(document.activeElement).toBe(outside)
    })

    it('centres the error and the empty state with auto margins, which never cut off an overflow', () => {
        for (const props of [states.error, states.empty]) {
            const { unmount } = render(<MessageThread items={[]} {...props} />)
            const region = screen.getByRole('region', { name: 'Messages' })
            expect(region.className).not.toContain('items-center')
            expect(region.className).toContain('flex-col')
            expect((region.lastElementChild as HTMLElement).className).toContain('m-auto')
            unmount()
        }
    })

    it('keeps the fade and `before` to the rows', () => {
        render(<MessageThread items={[]} loading fadeTop before={<button type="button">Load earlier</button>} />)
        const region = screen.getByRole('region', { name: 'Messages' })
        region.scrollTop = 40
        fireEvent.scroll(region)
        expect(region.getAttribute('data-fade')).toBeNull()
        expect(screen.queryByRole('button', { name: 'Load earlier' })).toBeNull()
    })
})
