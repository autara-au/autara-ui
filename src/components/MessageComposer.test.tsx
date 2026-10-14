import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MessageComposer } from './MessageComposer'

/** AUTM-1878: the inset layout, and the keys both layouts share. */
describe('MessageComposer', () => {
    it('inset: the leading control and Send sit inside one field', () => {
        render(
            <MessageComposer
                layout="inset"
                value="On my way"
                onChange={() => {}}
                onSend={() => {}}
                leading={<button type="button">Add an extra</button>}
                sendTestId="chat-send"
            />,
        )
        const field = document.querySelector('[data-composer-field]')!
        expect(field).toBeTruthy()
        expect(field.contains(screen.getByRole('button', { name: 'Add an extra' }))).toBe(true)
        const send = screen.getByRole('button', { name: 'Send' })
        expect(field.contains(send)).toBe(true)
        expect(send.getAttribute('data-testid')).toBe('chat-send')
        expect(field.contains(screen.getByRole('textbox', { name: 'Message' }))).toBe(true)
    })

    it('Enter sends, Shift+Enter does not, and an IME commit does not', () => {
        for (const layout of ['dock', 'inset'] as const) {
            const onSend = vi.fn()
            const { unmount } = render(
                <MessageComposer layout={layout} value="Gate code is 4412" onChange={() => {}} onSend={onSend} />,
            )
            const box = screen.getByRole('textbox', { name: 'Message' })
            fireEvent.keyDown(box, { key: 'Enter', shiftKey: true })
            expect(onSend).not.toHaveBeenCalled()
            fireEvent.keyDown(box, { key: 'Enter', isComposing: true })
            expect(onSend).not.toHaveBeenCalled()
            fireEvent.keyDown(box, { key: 'Enter' })
            expect(onSend).toHaveBeenCalledTimes(1)
            unmount()
        }
    })

    it('inset: Send waits for words, and the field stays editable while one sends', () => {
        const onSend = vi.fn()
        const { rerender } = render(<MessageComposer layout="inset" value="  " onChange={() => {}} onSend={onSend} />)
        fireEvent.click(screen.getByRole('button', { name: 'Send' }))
        expect(onSend).not.toHaveBeenCalled()
        rerender(<MessageComposer layout="inset" value="Next one" onChange={() => {}} onSend={onSend} sending />)
        expect((screen.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement).disabled).toBe(false)
        expect(screen.getByRole('button', { name: 'Send' }).getAttribute('aria-busy')).toBe('true')
    })
})
