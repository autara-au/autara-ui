import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfirmDialog } from './ConfirmDialog'

/**
 * AUTM-1185 — the rules the merchant app learned (AUTM-923) travel with the
 * component: the safe option is never disabled, even while loading, and the
 * parts are named for E2E.
 */
describe('ConfirmDialog', () => {
    it('names its parts from testId and never disables the safe option', () => {
        render(
            <ConfirmDialog
                open
                title="Remove this vehicle?"
                description="It won't be offered at checkout any more."
                confirmLabel="Remove"
                cancelLabel="Keep it"
                tone="destructive"
                loading
                errorMessage="We couldn't remove it."
                onConfirm={vi.fn()}
                onClose={vi.fn()}
                testId="garage-remove"
            />,
        )
        expect(screen.getByTestId('garage-remove')).toBeTruthy()
        const cancel = screen.getByTestId('garage-remove-cancel') as HTMLButtonElement
        expect(cancel.disabled).toBe(false)
        expect(cancel.textContent).toBe('Close')
        const confirm = screen.getByTestId('garage-remove-confirm') as HTMLButtonElement
        expect(confirm.disabled).toBe(true)
        expect(screen.getByTestId('garage-remove-error').getAttribute('role')).toBe('alert')
    })

    it('AUTM-1708: loading turns the Autara mark on the confirm, keeping its name and width', () => {
        render(
            <ConfirmDialog
                open
                title="Remove this address?"
                description="It won't be offered at checkout any more."
                confirmLabel="Remove"
                loading
                onConfirm={vi.fn()}
                onClose={vi.fn()}
                testId="address-remove"
            />,
        )
        const confirm = screen.getByTestId('address-remove-confirm') as HTMLButtonElement
        // Still named "Remove", not "Remove…": a spec that reads the label
        // finds the same text it found at rest.
        expect(screen.getByRole('button', { name: 'Remove' })).toBe(confirm)
        expect(confirm.getAttribute('aria-busy')).toBe('true')
        expect(confirm.disabled).toBe(true)
        expect(confirm.querySelector('svg.autara-loader')).not.toBeNull()
        expect(confirm.textContent).not.toContain('…')
    })

    // AUTM-1838 (Don, 2026-10-12): lime is the one primary action, and a
    // destructive confirm is never lime: red words on band, never a red fill.
    it('AUTM-1838: a destructive confirm is danger, never lime; a primary confirm is lime', () => {
        const { unmount } = render(
            <ConfirmDialog
                open
                title="Cancel this booking?"
                description="The customer is told at once."
                confirmLabel="Cancel booking"
                cancelLabel="Keep booking"
                tone="destructive"
                onConfirm={vi.fn()}
                onClose={vi.fn()}
                testId="booking-cancel"
            />,
        )
        const destructive = screen.getByTestId('booking-cancel-confirm').className
        expect(destructive).not.toMatch(/lime/)
        expect(destructive).not.toMatch(/bg-\[var\(--strong\)\]/)
        expect(destructive).toMatch(/text-\[var\(--danger\)\]/)
        expect(destructive).toMatch(/bg-\[var\(--band\)\]/)
        expect(screen.getByTestId('booking-cancel-cancel').className).not.toMatch(/lime/)
        unmount()

        render(
            <ConfirmDialog
                open
                title="Send the request?"
                description="The customer has 24 hours to answer."
                confirmLabel="Send request"
                onConfirm={vi.fn()}
                onClose={vi.fn()}
                testId="reschedule"
            />,
        )
        expect(screen.getByTestId('reschedule-confirm').className).toMatch(/bg-\[var\(--lime\)\]/)
    })

    it('calls onClose, not onConfirm, when dismissed', () => {
        const onClose = vi.fn()
        const onConfirm = vi.fn()
        render(
            <ConfirmDialog
                open
                title="Sign out?"
                description="You can sign back in any time."
                confirmLabel="Sign out"
                onConfirm={onConfirm}
                onClose={onClose}
                testId="sign-out"
            />,
        )
        screen.getByTestId('sign-out-cancel').click()
        expect(onClose).toHaveBeenCalledTimes(1)
        expect(onConfirm).not.toHaveBeenCalled()
    })
})
