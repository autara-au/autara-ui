import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComposerAttachMenu } from './ComposerAttachMenu'

/** AUTM-1806 (U5). */
describe('ComposerAttachMenu', () => {
    it('is a named 44px disc that opens a sheet of the rows it was given', () => {
        render(
            <ComposerAttachMenu
                triggerTestId="booking-chat-attach-open"
                items={[{ id: 'extra', label: 'Add an extra', onSelect: () => {}, testId: 'booking-chat-extra-add' }]}
            />,
        )
        const plus = screen.getByRole('button', { name: 'Add a photo or an extra' })
        expect(plus.getAttribute('data-testid')).toBe('booking-chat-attach-open')
        expect(plus.className).toContain('size-11')
        fireEvent.click(plus)
        expect(screen.getByRole('dialog', { name: 'Add to the conversation' })).toBeTruthy()
        expect(screen.getByTestId('booking-chat-extra-add').textContent).toContain('Add an extra')
    })

    it('closes first, then runs the chosen row', async () => {
        const onSelect = vi.fn()
        render(<ComposerAttachMenu items={[{ id: 'extra', label: 'Add an extra', onSelect }]} />)
        fireEvent.click(screen.getByRole('button', { name: 'Add a photo or an extra' }))
        fireEvent.click(screen.getByRole('button', { name: /Add an extra/ }))
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
        await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1))
    })

    it('runs nothing when dismissed', async () => {
        const onSelect = vi.fn()
        render(<ComposerAttachMenu items={[{ id: 'extra', label: 'Add an extra', onSelect }]} />)
        fireEvent.click(screen.getByRole('button', { name: 'Add a photo or an extra' }))
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
        expect(onSelect).not.toHaveBeenCalled()
    })

    // AUTM-1878 follow-up: the anchored menu from 768 up.
    it('as a menu: role menu with the rows, a disabled row kept but not chosen, and the chosen row runs after it closes', async () => {
        const run = vi.fn()
        const never = vi.fn()
        render(
            <ComposerAttachMenu
                layout="menu"
                label="Add to the conversation"
                triggerTestId="plus"
                items={[
                    { id: 'extra', label: 'Add an extra', description: 'Confirm the booking first', onSelect: never, disabled: true, testId: 'extra' },
                    { id: 'confirm', label: 'Confirm the booking', onSelect: run, testId: 'confirm' },
                ]}
            />,
        )
        const user = userEvent.setup()
        const plus = screen.getByTestId('plus')
        expect(plus.getAttribute('aria-haspopup')).toBe('menu')
        await user.click(plus)
        expect(await screen.findByRole('menu')).toBeTruthy()
        expect(screen.getByTestId('extra').getAttribute('data-disabled')).not.toBeNull()
        // Escape closes it and gives focus back to the +.
        await user.keyboard('{Escape}')
        expect(screen.queryByRole('menu')).toBeNull()
        expect(plus).toHaveFocus()
        await user.click(plus)
        await user.click(await screen.findByTestId('confirm'))
        await waitFor(() => expect(run).toHaveBeenCalledTimes(1))
        expect(never).not.toHaveBeenCalled()
        expect(screen.queryByRole('menu')).toBeNull()
    })
})
