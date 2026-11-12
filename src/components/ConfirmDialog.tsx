import type { ReactNode } from 'react'
import { Button } from './Button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './Dialog'
import { InlineAlert } from './InlineAlert'

/**
 * ConfirmDialog — the pause before anything irreversible.
 *
 * Graduated from merchant-mobile's ConfirmActionDialog (AUTM-1185) so the
 * customer web, which had no confirm on any destructive action (remove a
 * vehicle, unfavourite a pro, cancel a booking, sign out), gets the same
 * one. Cancel a booking, remove a card, sign out: a side effect the person
 * cannot easily reverse deserves one more tap, and that tap should read
 * the same everywhere.
 *
 * Rules the merchant app learned, kept:
 *   - The safe option is NEVER disabled. It is the one a person reaches
 *     for when they opened this by mistake, so it must always work. While
 *     the request is in flight its label becomes "Close": "Keep booking"
 *     would claim the action did not happen, and it may already have.
 *   - Dismissible while loading, deliberately (AUTM-923): Escape is also
 *     what Android's hardware back dispatches. Dismissing does not recall
 *     an in-flight request; the status line says so.
 *   - The secondary is the glass button, never outline (Autara Glass
 *     direction: secondary = flat glass).
 *
 * `children` is a slot between the description and the footer: a reason
 * select, the refund lines, a note field. `testId` names the parts for E2E:
 * `{testId}` on the panel, `{testId}-confirm`, `{testId}-cancel`,
 * `{testId}-error`.
 */
export interface ConfirmDialogProps {
    open: boolean
    title: string
    /** Short prose describing what confirming does. */
    description: ReactNode
    /** Verb label for the confirm button: "Cancel booking", "Remove", "Sign out". */
    confirmLabel: string
    /** The safe option. Default "Cancel"; pass "Keep booking" and the like where "Cancel" would read as the destructive verb. */
    cancelLabel?: string
    /**
     * `destructive` for anything that deletes, cancels, voids, discards or
     * refunds: the confirm is `danger` (red words on band), never lime.
     */
    tone?: 'primary' | 'destructive'
    loading?: boolean
    /** Rendered as an error InlineAlert above the footer. */
    errorMessage?: string | null
    onConfirm: () => void
    onClose: () => void
    /** Extra content between the description and the footer. */
    children?: ReactNode
    testId?: string
}

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel,
    cancelLabel = 'Cancel',
    tone = 'primary',
    loading = false,
    errorMessage = null,
    onConfirm,
    onClose,
    children,
    testId,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent
                className="w-[calc(100%-2rem)] max-w-md"
                data-testid={testId}
                aria-busy={loading || undefined}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                {children ? <div className="mt-4">{children}</div> : null}

                {loading ? (
                    <p
                        role="status"
                        className="mt-4 rounded-2xl bg-[var(--band)] px-4 py-3 text-[0.9375rem] text-[var(--text-muted)]"
                    >
                        Working on it. Closing this won&rsquo;t stop it.
                    </p>
                ) : null}

                {errorMessage ? (
                    <InlineAlert
                        tone="error"
                        className="mt-4"
                        testId={testId ? `${testId}-error` : undefined}
                    >
                        {errorMessage}
                    </InlineAlert>
                ) : null}

                {/* AUTM-1594 — canvas v44: quiet Cancel and the action, side by
                    side and full width. AUTM-1838 (Don, 2026-10-12): the action
                    is lime, and a destructive one is `danger` (band, red
                    words), never lime and never a red fill. */}
                <DialogFooter className="mt-2 flex-row gap-2.5">
                    <Button
                        variant="quiet"
                        size="md"
                        fullWidth
                        onClick={onClose}
                        data-testid={testId ? `${testId}-cancel` : undefined}
                    >
                        {loading ? 'Close' : cancelLabel}
                    </Button>
                    {/* AUTM-1708: Button's busy state, the turning Autara mark
                        at full strength. The label stays `confirmLabel`, so the
                        width holds and the accessible name does not change while
                        the request runs; it used to become "Remove…" at 45%. */}
                    <Button
                        variant={tone === 'destructive' ? 'danger' : 'primary'}
                        size="md"
                        fullWidth
                        busy={loading}
                        onClick={onConfirm}
                        data-testid={testId ? `${testId}-confirm` : undefined}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
