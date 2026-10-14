import { useEffect, useState, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './Badge'
import { Button } from './Button'
import { LinkShareSheet, shareHrefs, type ShareTarget } from './LinkShareSheet'

/**
 * AUTM-1856: one link, ready to hand over. The payment link on a finished
 * job is the first consumer; the business link (AUTM-1637) is the pattern it
 * follows. The app draws the QR and supplies the presses; the sheet is the
 * same everywhere.
 */
const meta = {
    title: 'Molecules/LinkShareSheet',
    component: LinkShareSheet,
    parameters: { layout: 'centered' },
    args: { open: true, onOpenChange: () => {}, title: 'Payment link' },
} satisfies Meta<typeof LinkShareSheet>

export default meta
type Story = StoryObj<typeof meta>

const URL = 'https://pay.autara.au/b/7f3c2a9e'
const TEXT = 'Hi Elena, here is the link to pay the $132.30 left on your car care booking: ' + URL

/** Inline glyphs for the story only: the apps pass their own (Solar) icons. */
function Glyph({ d }: { d: string }) {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d={d} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}
const ICONS = {
    copy: <Glyph d="M8 8h11v11H8zM5 16V5h11" />,
    text: <Glyph d="M4 5h16v11H8l-4 4z" />,
    email: <Glyph d="M3 6h18v12H3zM3 7l9 6 9-6" />,
    share: <Glyph d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7" />,
}

const TARGETS: ShareTarget[] = [
    {
        id: 'copy',
        label: 'Copy link',
        doneLabel: 'Copied',
        doneAnnouncement: 'Link copied',
        icon: ICONS.copy,
        onSelect: () => true,
        testId: 'story-share-copy',
    },
    { id: 'text', label: 'Text message', icon: ICONS.text, href: shareHrefs.sms(TEXT) },
    {
        id: 'email',
        label: 'Email',
        icon: ICONS.email,
        href: shareHrefs.email({ subject: 'Your car care balance', body: TEXT }),
    },
    { id: 'open', label: 'Open page', icon: ICONS.share, href: URL, newTab: true },
]

/** A stand-in for the app's QR card (the app encodes and draws the real one). */
function QrStandIn() {
    return (
        <section className="flex flex-col gap-3 rounded-[1.5rem] bg-[var(--hero)] p-4 text-[var(--on-deep)]">
            <p className="text-[1.0625rem] leading-tight font-bold">Elena Quinn</p>
            <p className="-mt-2 text-[0.8125rem] font-medium opacity-80">Scan to pay $132.30</p>
            <div
                role="img"
                aria-label="QR code that opens the payment link"
                className="mx-auto grid aspect-square w-full max-w-[12rem] place-items-center rounded-[1rem] bg-white text-[0.8125rem] font-medium text-[var(--ink)]"
            >
                QR
            </div>
        </section>
    )
}

function Summary({
    state = 'Sent',
    tone = 'aqua',
    when = 'Sent 2:14 pm, expires 27 Oct',
}: {
    state?: ReactNode
    tone?: 'aqua' | 'lime' | 'band'
    when?: string
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
                <Badge variant={tone} className={tone === 'band' ? 'bg-[var(--band-press)]' : undefined}>
                    {state}
                </Badge>
            </div>
            <p className="text-[2rem] leading-[1.1] font-black tracking-[-0.02em] text-[var(--text-strong)] tabular-nums">
                $132.30
            </p>
            <p className="text-[0.875rem] text-[var(--text-muted)]">{when}</p>
        </div>
    )
}

function Opener(props: Parameters<typeof LinkShareSheet>[0]) {
    const [open, setOpen] = useState(true)
    return (
        <>
            <Button variant="secondary" onClick={() => setOpen(true)}>
                Send payment link
            </Button>
            <LinkShareSheet {...props} open={open} onOpenChange={setOpen} />
        </>
    )
}

/** The payment link, sent and waiting: amount and state, the QR, the ways out. */
export const PaymentLink: Story = {
    args: {
        title: 'Payment link',
        description: 'Elena pays the balance with this link. It works for 14 days.',
        summary: <Summary />,
        url: URL,
        qr: <QrStandIn />,
        targets: TARGETS,
        primary: { label: 'Share link', icon: ICONS.share, onClick: () => {}, testId: 'story-share-primary' },
        footnote: 'Paid by card through Stripe. You are told the moment it lands.',
    },
    render: (args) => <Opener {...args} />,
}

/** Paid: the state says so, and nothing about the link changes. */
export const Paid: Story = {
    args: {
        ...PaymentLink.args,
        summary: <Summary state="Paid" tone="lime" when="Paid 3:02 pm" />,
    },
    render: (args) => <Opener {...args} />,
}

/** Expired: grey, and the line says what to do. */
export const Expired: Story = {
    args: {
        ...PaymentLink.args,
        summary: <Summary state="Expired" tone="band" when="Expired 27 Oct. Share it again and it still works." />,
    },
    render: (args) => <Opener {...args} />,
}

/** No QR: one column, the link and its targets. */
export const WithoutQr: Story = {
    args: { ...PaymentLink.args, qr: undefined },
    render: (args) => <Opener {...args} />,
}

/** While the link is made: a skeleton where it will be, announced. */
export const Loading: Story = {
    args: { ...PaymentLink.args, url: null, loading: true },
    render: (args) => <Opener {...args} />,
}

/** The link could not be made: the sentence and a retry, nothing to share. */
export const CouldNotMakeLink: Story = {
    args: {
        ...PaymentLink.args,
        url: null,
        error: {
            message: "We couldn't create the payment link. Check your connection and try again.",
            onRetry: () => {},
        },
    },
    render: (args) => <Opener {...args} />,
}

/** After a press, a sentence in the sheet (never a toast behind it). */
export const WithNote: Story = {
    args: {
        ...PaymentLink.args,
        note: "Sharing isn't available here, so we copied the link. Paste it wherever you like.",
    },
    render: (args) => <Opener {...args} />,
}

function LargeText({ children }: { children: ReactNode }) {
    useEffect(() => {
        const root = document.documentElement
        const was = root.style.fontSize
        root.style.fontSize = '200%'
        return () => {
            root.style.fontSize = was
        }
    }, [])
    return <>{children}</>
}

/** 200% text: one column, the targets one to a row, nothing cut off. */
export const LargeTextOneColumn: Story = {
    args: PaymentLink.args,
    render: (args) => (
        <LargeText>
            <Opener {...args} />
        </LargeText>
    ),
}
