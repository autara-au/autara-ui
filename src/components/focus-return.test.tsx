import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './Dialog'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './Sheet'

/**
 * AUTM-1768 (QA-A11Y-01). Closing a dialog or a sheet returns keyboard focus
 * to the control that opened it, including when that control is a plain
 * button setting `open` rather than a Radix trigger.
 *
 * Before: Radix returned focus to `DialogTrigger` only, so every dialog opened
 * from state dropped focus on `<body>`, and the next Tab started again at the
 * top of the page. Measured on the merchant portal at 12 to 23 Tab presses to
 * get back to the booking.
 */

function FromState({
    kind,
    onCloseAutoFocus,
}: {
    kind: 'dialog' | 'sheet'
    onCloseAutoFocus?: (event: Event) => void
}) {
    const [open, setOpen] = React.useState(false)
    return (
        <>
            <button type="button">Before</button>
            <button type="button" onClick={() => setOpen(true)}>
                Confirm booking
            </button>
            {kind === 'dialog' ? (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
                        <DialogTitle>Confirm this booking?</DialogTitle>
                        <DialogDescription>The customer is told straight away.</DialogDescription>
                        <button type="button" onClick={() => setOpen(false)}>
                            Confirm
                        </button>
                    </DialogContent>
                </Dialog>
            ) : (
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetContent side="bottom" onCloseAutoFocus={onCloseAutoFocus}>
                        <SheetTitle>Pause new bookings</SheetTitle>
                        <SheetDescription>Customers see you as away.</SheetDescription>
                        <button type="button" onClick={() => setOpen(false)}>
                            Pause
                        </button>
                    </SheetContent>
                </Sheet>
            )}
        </>
    )
}

describe('AUTM-1768: focus returns to the opener when a dialog closes', () => {
    for (const kind of ['dialog', 'sheet'] as const) {
        it(`${kind}: Escape returns focus to a button that opened it from state`, async () => {
            const user = userEvent.setup()
            render(<FromState kind={kind} />)
            const opener = screen.getByRole('button', { name: 'Confirm booking' })
            await user.click(opener)
            expect(await screen.findByRole('dialog')).toBeTruthy()
            // Focus moved into the dialog.
            await waitFor(() => expect(document.activeElement).not.toBe(opener))

            await user.keyboard('{Escape}')
            await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
            await waitFor(() => expect(document.activeElement).toBe(opener))
        })

        it(`${kind}: an action inside that closes it also returns focus`, async () => {
            const user = userEvent.setup()
            render(<FromState kind={kind} />)
            const opener = screen.getByRole('button', { name: 'Confirm booking' })
            await user.click(opener)
            const action = await screen.findByRole('button', {
                name: kind === 'dialog' ? 'Confirm' : 'Pause',
            })
            await user.click(action)
            await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
            await waitFor(() => expect(document.activeElement).toBe(opener))
        })

        it(`${kind}: a consumer that prevents the default keeps its own choice`, async () => {
            const user = userEvent.setup()
            render(
                <FromState
                    kind={kind}
                    onCloseAutoFocus={(event) => {
                        event.preventDefault()
                        ;(screen.getByRole('button', { name: 'Before' }) as HTMLElement).focus()
                    }}
                />
            )
            await user.click(screen.getByRole('button', { name: 'Confirm booking' }))
            await screen.findByRole('dialog')
            await user.keyboard('{Escape}')
            await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
            // Give the deferred check its chance to (wrongly) override.
            await new Promise((r) => setTimeout(r, 20))
            expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Before' }))
        })
    }

    it('a DialogTrigger still gets focus back, exactly as before', async () => {
        const user = userEvent.setup()
        render(
            <Dialog>
                <DialogTrigger>Block time</DialogTrigger>
                <DialogContent>
                    <DialogTitle>Block time</DialogTitle>
                    <DialogDescription>Nobody can book it.</DialogDescription>
                </DialogContent>
            </Dialog>
        )
        const trigger = screen.getByRole('button', { name: 'Block time' })
        await user.click(trigger)
        await screen.findByRole('dialog')
        await user.keyboard('{Escape}')
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
        await waitFor(() => expect(document.activeElement).toBe(trigger))
    })

    it('does nothing when the opener has left the page', async () => {
        const user = userEvent.setup()
        function Gone() {
            const [open, setOpen] = React.useState(false)
            const [showOpener, setShowOpener] = React.useState(true)
            return (
                <>
                    {showOpener ? (
                        <button type="button" onClick={() => setOpen(true)}>
                            Delete
                        </button>
                    ) : null}
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogContent>
                            <DialogTitle>Delete this service?</DialogTitle>
                            <DialogDescription>It is gone for good.</DialogDescription>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowOpener(false)
                                    setOpen(false)
                                }}
                            >
                                Delete it
                            </button>
                        </DialogContent>
                    </Dialog>
                </>
            )
        }
        render(<Gone />)
        await user.click(screen.getByRole('button', { name: 'Delete' }))
        await user.click(await screen.findByRole('button', { name: 'Delete it' }))
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
        await new Promise((r) => setTimeout(r, 20))
        expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull()
        // No throw, and focus is not on a detached node.
        expect(document.activeElement?.isConnected ?? true).toBe(true)
    })
})
