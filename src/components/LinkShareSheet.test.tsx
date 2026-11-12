import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { LinkShareSheet, displayLink, shareHrefs, type ShareTarget } from './LinkShareSheet'

/** AUTM-1856. */
describe('LinkShareSheet', () => {
    const url = 'https://pay.autara.au/b/7f3c2a9e'

    function sheet(extra: Partial<Parameters<typeof LinkShareSheet>[0]> = {}) {
        return render(
            <LinkShareSheet
                open
                onOpenChange={() => {}}
                title="Payment link"
                url={url}
                {...extra}
            />,
        )
    }

    it('shows the link without its scheme, as one selectable string', () => {
        sheet()
        const link = screen.getByTestId('link-share-sheet-url')
        expect(link.textContent).toBe('pay.autara.au/b/7f3c2a9e')
        expect(link.className).toContain('select-all')
    })

    it('draws a link target as an anchor with its href, and a press target as a 48px button', () => {
        const targets: ShareTarget[] = [
            { id: 'text', label: 'Text message', href: shareHrefs.sms('Pay here ' + url), testId: 't-text' },
            { id: 'copy', label: 'Copy link', onSelect: () => true, doneLabel: 'Copied', testId: 't-copy' },
        ]
        sheet({ targets })
        const group = screen.getByRole('group', { name: 'Ways to send it' })
        const text = within(group).getByRole('link', { name: 'Text message' })
        expect(text.getAttribute('href')).toBe('sms:?&body=' + encodeURIComponent('Pay here ' + url))
        expect(screen.getByTestId('t-copy').className).toContain('min-h-12')
    })

    it('flips a press that answers true to its done label, says it, then comes back', async () => {
        vi.useFakeTimers()
        try {
            const onSelect = vi.fn(() => true)
            sheet({
                targets: [{ id: 'copy', label: 'Copy link', onSelect, doneLabel: 'Copied', doneAnnouncement: 'Link copied' }],
            })
            await act(async () => {
                fireEvent.click(screen.getByRole('button', { name: 'Copy link' }))
            })
            expect(onSelect).toHaveBeenCalledTimes(1)
            expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy()
            expect(screen.getByTestId('link-share-sheet-note').textContent).toBe('Link copied')
            await act(async () => {
                vi.advanceTimersByTime(2300)
            })
            expect(screen.getByRole('button', { name: 'Copy link' })).toBeTruthy()
        } finally {
            vi.useRealTimers()
        }
    })

    it('leaves the label alone when the press does not answer true', async () => {
        sheet({ targets: [{ id: 'copy', label: 'Copy link', onSelect: () => false, doneLabel: 'Copied' }] })
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Copy link' }))
        })
        expect(screen.queryByRole('button', { name: 'Copied' })).toBeNull()
    })

    it('loading: an announced skeleton, no link, and the primary held', () => {
        sheet({ url: null, loading: true, primary: { label: 'Share link', onClick: () => {}, testId: 'p' } })
        const status = screen.getByTestId('link-share-sheet-loading')
        expect(status.getAttribute('role')).toBe('status')
        expect(status.textContent).toContain('Getting the link ready')
        expect(screen.queryByTestId('link-share-sheet-url')).toBeNull()
        expect((screen.getByTestId('p') as HTMLButtonElement).disabled).toBe(true)
    })

    it('error: the sentence and a retry, nothing to share', () => {
        const onRetry = vi.fn()
        sheet({ url: null, error: { message: "We couldn't create the payment link.", onRetry } })
        expect(screen.getByText("We couldn't create the payment link.")).toBeTruthy()
        fireEvent.click(screen.getByRole('button', { name: /retry/i }))
        expect(onRetry).toHaveBeenCalled()
        expect(screen.queryByTestId('link-share-sheet-url')).toBeNull()
    })

    it('runs the primary action', () => {
        const onClick = vi.fn()
        sheet({ primary: { label: 'Share link', onClick, testId: 'p' } })
        fireEvent.click(screen.getByTestId('p'))
        expect(onClick).toHaveBeenCalled()
    })

    it('puts the summary above the body', () => {
        sheet({ summary: <p>$132.30</p> })
        expect(screen.getByTestId('link-share-sheet-summary').textContent).toBe('$132.30')
    })
})

describe('shareHrefs and displayLink', () => {
    it('encodes an email subject and body', () => {
        expect(shareHrefs.email({ subject: 'Your balance', body: 'Pay & go' })).toBe(
            'mailto:?subject=Your%20balance&body=Pay%20%26%20go',
        )
    })
    it('drops only the scheme', () => {
        expect(displayLink('https://autara.au/m/1?service=2')).toBe('autara.au/m/1?service=2')
    })
})
