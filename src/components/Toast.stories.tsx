import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useRef } from 'react'
import { Button } from './Button'
import { ToastProvider, toast, useToast, type Toast, type ToastPosition } from './Toast'

/**
 * Toast (AUTM-1871): one line, two at most, on the raised token surface, with
 * a type icon in the brand's meaning colours (purple to act, lime money in,
 * red a problem), an inline action and the large round Close. 6 s, pausing on
 * hover and focus; three at most; bursts about one booking collapse into one;
 * swipe to dismiss; bottom right on a desktop, top on a phone (`auto`).
 *
 * The notification stories fire on mount and stay (duration 0), so the
 * toasts can be looked at, and screenshotted, in both themes and at both
 * widths. The words are the merchant copy from backend-services
 * `notifications/merchantCopy.ts`.
 *
 * References (Mobbin), and what was taken (the full list is on AUTM-1871):
 *  - Telegram's one-line toast with an inline action: steal the one line and
 *    the text action.
 *  - Wise's snackbar (one line, one "Undo"): steal; avoid its ink capsule,
 *    which Don ruled out for the token surface.
 *  - Airwallex and Microsoft Copilot: a light toast with a coloured status
 *    icon, top or bottom right on the web: steal the icon disc and the corner.
 */
const meta: Meta = {
    title: 'Atoms/Toast',
    parameters: { layout: 'padded' },
    decorators: [
        (Story) => (
            <ToastProvider>
                <Story />
            </ToastProvider>
        ),
    ],
}
export default meta
type Story = StoryObj

const Panel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
        <div className="text-[0.75rem] font-medium text-[var(--text-muted)]">Trigger</div>
        <div className="flex flex-wrap gap-2">{children}</div>
    </div>
)

// ─── The merchant notification glyphs (Solar Linear, inlined) ──────
const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const CalendarAdd = () => (
    <svg viewBox="0 0 24 24" aria-hidden>
        <path {...s} d="M7 4V2.5M17 4V2.5M2.5 9h19M12 12.5v5M9.5 15h5M4.5 4h15a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    </svg>
)
const WalletIn = () => (
    <svg viewBox="0 0 24 24" aria-hidden>
        <path {...s} d="M3 8.5h15a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-12a2 2 0 0 1 2-2h11M16.5 14.5h.01" />
    </svg>
)
const CardCross = () => (
    <svg viewBox="0 0 24 24" aria-hidden>
        <path {...s} d="M2.5 9.5h19M15.5 15.5l4 4M19.5 15.5l-4 4M21.5 12V8a3 3 0 0 0-3-3h-13a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h7" />
    </svg>
)
const Chat = () => (
    <svg viewBox="0 0 24 24" aria-hidden>
        <path {...s} d="M12 21a9 9 0 1 0-8-4.9L3 21l4.9-1A9 9 0 0 0 12 21ZM8 12h.01M12 12h.01M16 12h.01" />
    </svg>
)

/** What the merchant portal fires for each (merchant-mobile lib/notification-toast.ts). */
const DEPOSIT_PAID: Omit<Toast, 'id'> = {
    title: 'Dinah Laurel Lance paid the $25.18 deposit',
    description: 'Exterior Car Care, Sat 17 Oct at 09:40.',
    icon: <WalletIn />,
    tone: 'money',
    action: { label: 'View', onClick: () => undefined },
    groupKey: 'booking:b1',
    testId: 'toast-notification',
}
const NEW_REQUEST: Omit<Toast, 'id'> = {
    title: 'New request from Quentin Lance',
    description: 'Interior Clean, Mon 19 Oct at 11:00. Answer by Sun 18 Oct at 09:15.',
    icon: <CalendarAdd />,
    tone: 'act',
    action: { label: 'Answer', onClick: () => undefined },
    groupKey: 'booking:b2',
    testId: 'toast-notification',
}
const PAYMENT_FAILED: Omit<Toast, 'id'> = {
    title: 'Your $120.00 payout came back',
    description: 'Your bank returned it, so the money is in your Stripe balance.',
    icon: <CardCross />,
    tone: 'problem',
    action: { label: 'View', onClick: () => undefined },
    groupKey: 'payout:po_2',
    testId: 'toast-notification',
}

/** Fires once on mount and keeps the toasts on screen. */
function FiresOnMount({ toasts }: { toasts: Array<Omit<Toast, 'id'>> }) {
    const fired = useRef(false)
    const { addToast } = useToast()
    useEffect(() => {
        if (fired.current) return
        fired.current = true
        for (const t of toasts) addToast({ ...t, duration: 0 })
    }, [addToast, toasts])
    return null
}

const Again: React.FC<{ toasts: Array<Omit<Toast, 'id'>> }> = ({ toasts }) => (
    <Panel>
        <Button variant="outline" size="sm" onClick={() => toasts.forEach((t) => toast(t))}>
            Fire again
        </Button>
    </Panel>
)

// ─── The three Don named ───────────────────────────────────────────

/** Money in: lime. "View" opens the booking. */
export const DepositPaid: Story = {
    name: 'Notification: deposit paid (money in)',
    render: () => (
        <>
            <FiresOnMount toasts={[DEPOSIT_PAID]} />
            <Again toasts={[DEPOSIT_PAID]} />
        </>
    ),
}

/** Something to do: purple. The action is the thing itself: Answer. */
export const NewRequest: Story = {
    name: 'Notification: new request with Answer (act)',
    render: () => (
        <>
            <FiresOnMount toasts={[NEW_REQUEST]} />
            <Again toasts={[NEW_REQUEST]} />
        </>
    ),
}

/** A problem: red. */
export const PaymentFailed: Story = {
    name: 'Notification: payout failed (a problem)',
    render: () => (
        <>
            <FiresOnMount toasts={[PAYMENT_FAILED]} />
            <Again toasts={[PAYMENT_FAILED]} />
        </>
    ),
}

/** Three at most; the newest at the edge the stack grows from. */
export const StackOfThree: Story = {
    name: 'Stack of three',
    render: () => (
        <>
            <FiresOnMount toasts={[DEPOSIT_PAID, NEW_REQUEST, PAYMENT_FAILED]} />
            <Panel>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        toast({
                            title: 'Moira Dearden Queen sent you a message',
                            description: 'Exterior Car Care, Sat 17 Oct at 09:40.',
                            icon: <Chat />,
                            tone: 'act',
                            action: { label: 'Reply', onClick: () => undefined },
                            groupKey: 'booking:b3',
                        })
                    }
                >
                    Fire a fourth (pushes the oldest out)
                </Button>
            </Panel>
        </>
    ),
}

/**
 * One customer action, one toast: confirmed and paid, then an extra approved
 * within the minute, for the same booking. The second replaces the first's
 * words in place and restarts its time.
 */
export const BurstCollapses: Story = {
    name: 'A burst about one booking is one toast',
    render: () => (
        <Panel>
            <Button
                variant="outline"
                size="sm"
                onClick={() => {
                    toast({ ...DEPOSIT_PAID, title: 'Dinah Laurel Lance confirmed and paid $25.18' })
                    setTimeout(
                        () =>
                            toast({
                                ...DEPOSIT_PAID,
                                title: 'Dinah Laurel Lance approved a $25.00 extra',
                                description: 'Pet hair removal. Also confirmed and paid $25.18.',
                            }),
                        900
                    )
                }}
            >
                Confirm, pay, approve an extra
            </Button>
        </Panel>
    ),
}

// ─── The generic kinds ─────────────────────────────────────────────
export const SingleCapsules: Story = {
    name: 'Kinds: default, success, error, warning, info, loading',
    render: () => (
        <Panel>
            <Button variant="outline" size="sm" onClick={() => toast('Synced your bookings calendar.')}>
                Default
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.success('Booking confirmed for 09:30 tomorrow.')}>
                Success
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.error("We couldn't reach the booking service. Try again in a moment.")}>
                Error
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.warning('Your ABN check expires in 3 days.')}>
                Warning
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info('Two services were sorted into Exterior.')}>
                Info
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.loading('Sending your booking request')}>
                Loading
            </Button>
        </Panel>
    ),
}

export const WithAction: Story = {
    name: 'With an action',
    render: () => (
        <Panel>
            <Button
                variant="outline"
                size="sm"
                onClick={() =>
                    toast({
                        type: 'info',
                        description: 'Profile draft saved.',
                        action: { label: 'View', onClick: () => toast.success('Opened your draft.') },
                    })
                }
            >
                Toast with action
            </Button>
        </Panel>
    ),
}

// ─── One toast that changes as the work goes ───────────────────────
export const StatusMorph: Story = {
    name: 'Status morph: sending, then sent',
    render: () => {
        const idRef = useRef<string | null>(null)
        useEffect(() => {
            return () => {
                if (idRef.current) toast.dismiss(idRef.current)
            }
        }, [])
        return (
            <Panel>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        const id = toast.loading('Taking the deposit')
                        idRef.current = id
                        setTimeout(() => toast.update(id, { type: 'loading', description: 'Telling the merchant' }), 900)
                        setTimeout(() => {
                            toast.update(id, { type: 'success', description: 'Booking confirmed', duration: 3500 })
                            idRef.current = null
                        }, 1800)
                    }}
                >
                    Run morph
                </Button>
            </Panel>
        )
    },
}

// ─── Positions ─────────────────────────────────────────────────────
const POSITIONS: ToastPosition[] = ['auto', 'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']

/** Each tile fires through its own provider, so the demo does not fight the singleton. */
const PositionTile: React.FC<{ pos: ToastPosition }> = ({ pos }) => {
    const { addToast } = useToast()
    return (
        <div className="space-y-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
            <div className="text-[0.75rem] font-medium text-[var(--text-muted)]">{pos}</div>
            <Button variant="outline" size="sm" onClick={() => addToast({ type: 'success', description: `Fired from ${pos}` })}>
                Fire toast
            </Button>
        </div>
    )
}

/**
 * `auto` is the default: top centre under 40rem (a phone), bottom right from
 * it. A consumer mounts ONE provider at the root; this grid is Storybook-only.
 */
export const Positions: Story = {
    name: 'Positions: auto and the six anchors',
    decorators: [(Story) => <Story />],
    render: () => (
        <div className="grid grid-cols-3 gap-3">
            {POSITIONS.map((pos) => (
                <ToastProvider key={pos} position={pos}>
                    <PositionTile pos={pos} />
                </ToastProvider>
            ))}
        </div>
    ),
}

// ─── Two lines at most (AUTM-1883) ─────────────────────────────────
const REMINDER = 'Reminder sent to Priya by text and email. Next one possible at 15:35.'

/**
 * AUTM-1883 (Don, 2026-10-15): a toast wraps to two lines, never one
 * truncated line. At large text on a phone (under 20em across) nothing is
 * clamped and the toast keeps every word.
 */
export const TwoLines: Story = {
    name: 'Two lines at most (phone)',
    parameters: { viewport: { defaultViewport: 'phone' } },
    render: () => (
        <>
            <FiresOnMount toasts={[{ type: 'success', description: REMINDER }]} />
            <Panel>
                <Button variant="outline" size="sm" onClick={() => toast.success(REMINDER)}>
                    Reminder sent
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast.error('Priya was reminded at 15:15. Next one possible at 15:30.')}>
                    Too soon
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        toast({
                            type: 'success',
                            description: 'INV-2026-0102 is ready. Your browser blocked the download.',
                            duration: 8000,
                            action: { label: 'Open PDF', onClick: () => undefined },
                        })
                    }
                >
                    Two lines with an action
                </Button>
            </Panel>
        </>
    ),
}
