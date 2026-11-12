import * as React from 'react'

/**
 * AUTM-1768 (QA-A11Y-01): keyboard focus goes back to where it was when a
 * dialog or a sheet closes, whether or not it was opened by a Radix trigger.
 *
 * Radix returns focus to `DialogTrigger` and nowhere else. Its content's
 * close handler is, in effect,
 *
 *     event.preventDefault(); context.triggerRef.current?.focus()
 *
 * so a dialog opened from component state (a Confirm button that sets
 * `open`, a row's menu item, a dock action) has no trigger ref and focus
 * lands on `<body>`. The next Tab starts again at the skip link and walks the
 * whole navigation rail: 12 to 23 presses to get back to the booking the
 * merchant was working on, measured on Confirm, Decline, Block time, Pause
 * new bookings and the service Category picker. Most dialogs in the
 * consumers are opened that way, so fixing it per screen would mean every
 * screen.
 *
 * What this does, once, for every `DialogContent` and `SheetContent`:
 *
 *   - when the content mounts, remember the element that held focus (Radix
 *     calls `onOpenAutoFocus` before it moves focus in, so
 *     `document.activeElement` is still the control that opened it);
 *   - when it closes, let the consumer's `onCloseAutoFocus` and then Radix's
 *     own handler run exactly as before, and only AFTER both, if focus has
 *     ended up nowhere (`<body>`, or an element that has left the page), put
 *     it back on the remembered element.
 *
 * So nothing that works today changes. A trigger still gets focus from Radix,
 * and this sees focus already placed and does nothing. A consumer that calls
 * `event.preventDefault()` in `onCloseAutoFocus` to send focus somewhere of
 * its own is left alone. A dialog that closes because another one opened
 * finds focus inside the new one and does nothing.
 *
 * Not covered, and said rather than hidden: if the dialog's content
 * autofocuses an element itself (an `autoFocus` input), React moves focus in
 * before Radix asks, `onOpenAutoFocus` does not fire, and there is nothing to
 * remember. Radix behaves the same way in that case.
 */
export function useReturnFocus(
    onOpenAutoFocus?: (event: Event) => void,
    onCloseAutoFocus?: (event: Event) => void
): {
    onOpenAutoFocus: (event: Event) => void
    onCloseAutoFocus: (event: Event) => void
} {
    const returnTo = React.useRef<HTMLElement | null>(null)

    const handleOpen = React.useCallback(
        (event: Event) => {
            const active = typeof document === 'undefined' ? null : document.activeElement
            returnTo.current =
                active instanceof HTMLElement && active !== document.body ? active : null
            onOpenAutoFocus?.(event)
        },
        [onOpenAutoFocus]
    )

    const handleClose = React.useCallback(
        (event: Event) => {
            onCloseAutoFocus?.(event)
            const target = returnTo.current
            returnTo.current = null
            // The consumer decided where focus goes. Leave it.
            if (event.defaultPrevented || !target) return
            // Radix's own handler runs after this one in the same dispatch and
            // focuses the trigger when there is one. Look once it has.
            afterCurrentTask(() => {
                const active = document.activeElement
                const lost = !active || active === document.body || !active.isConnected
                if (!lost || !target.isConnected) return
                target.focus({ preventScroll: true })
            })
        },
        [onCloseAutoFocus]
    )

    return { onOpenAutoFocus: handleOpen, onCloseAutoFocus: handleClose }
}

function afterCurrentTask(fn: () => void): void {
    if (typeof queueMicrotask === 'function') queueMicrotask(fn)
    else void Promise.resolve().then(fn)
}
