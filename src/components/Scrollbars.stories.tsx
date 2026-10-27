import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { MessageComposer } from './MessageComposer'
import { MessageThread, type MessageItem } from './MessageThread'
import { ScrollArea } from './ScrollArea'

/**
 * # Scrollbars
 *
 * AUTM-1899 (Don, 2026-10-16, on the merchant booking chat: "scrollbars
 * everywhere showing, can we hide them? for better UI?"). From
 * utilities/scrollbars.css, in the base layer, for every consumer:
 *
 * - **Inside a page** (a list pane, a chat thread, a drawer, a dialog, a
 *   table, a textarea): no scrollbar with a mouse or a trackpad, at rest, on
 *   hover or while scrolling, and no lane where one would be. The wheel, the
 *   trackpad, a finger and the keyboard (Tab in, then Page Down or the
 *   arrows) still scroll it. Where more is hidden matters, show it in the
 *   layout: a fade (ScrollArea `fade`), a cut-off row, a chevron (ChipRow).
 * - **The page itself**: the thin, rounded brand thumb on the root, as
 *   before (AUTM-1739, AUTM-1756), so a document page looks the same. In
 *   these stories that is the bar at the canvas's right edge. On a
 *   brand-deep page, `.scroll-on-deep` on <html> takes the lighter purple.
 * - **Forced colours** (Windows High Contrast): the system's own bars,
 *   everywhere. **A finger**: the platform's overlay bar while scrolling.
 *
 * Check: scroll each box with the wheel, then Tab into the list and press
 * Page Down; flip the Theme toolbar; emulate forced colours in DevTools
 * (Rendering, "Emulate CSS media feature forced-colors") to see the system
 * bars come back.
 */
const meta = {
    title: 'Foundations/Scrollbars',
    parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const rows = Array.from({ length: 24 }, (_, i) => `Booking ${i + 1}, Full interior clean, $189`)

const card = 'rounded-2xl bg-[var(--band)] p-4 text-[var(--text-strong)]'

function Boxes() {
    const [note, setNote] = useState(
        'Gate code 4471. The car is in the second bay on the left, keys with reception.\n'.repeat(6)
    )
    const [message, setMessage] = useState('On my way')
    return (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))]">
            <section className={card} aria-label="A list">
                <h3 className="mb-2 font-bold">A list (a pane, a sheet, a dropdown)</h3>
                <ScrollArea as="ul" label="Bookings" className="max-h-48">
                    {rows.map((r) => (
                        <li key={r} className="py-2">
                            {r}
                        </li>
                    ))}
                </ScrollArea>
            </section>
            <section className={card} aria-label="A wide table">
                <h3 className="mb-2 font-bold">A table, both ways</h3>
                <ScrollArea orientation="both" label="Bookings table" className="max-h-48">
                    <table className="min-w-[40rem] border-collapse">
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={r}>
                                    <td className="px-3 py-1.5">{i + 1}</td>
                                    <td className="px-3 py-1.5">{r}</td>
                                    <td className="px-3 py-1.5">Tue 13 Oct</td>
                                    <td className="px-3 py-1.5">Confirmed</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ScrollArea>
            </section>
            <section className={card} aria-label="A long note">
                <h3 className="mb-2 font-bold">A textarea with more than it shows</h3>
                <textarea
                    aria-label="Access notes"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="field-textarea h-32 min-h-0"
                />
            </section>
            <section className={card} aria-label="A one-line message">
                <h3 className="mb-2 font-bold">Edge case: a one-line message box</h3>
                <MessageComposer
                    layout="inset"
                    value={message}
                    onChange={setMessage}
                    onSend={() => setMessage('')}
                    placeholder="Message Alex"
                    className="px-0"
                />
            </section>
        </div>
    )
}

/** Boxes that scroll inside a page draw no bar; the page's own bar (right edge) is the brand thumb. */
export const InsideAPage: Story = {
    render: () => (
        <div className="bg-[var(--background)] p-6 text-[var(--text-strong)]">
            <h2 className="mb-4 text-2xl font-bold">Inside a page: no bar</h2>
            <Boxes />
            {/* Taller than the canvas, so the page itself scrolls and shows its bar. */}
            <p className="mt-6 text-[var(--text-muted)]">The page scrolls too: its bar is the only one.</p>
            <div className="h-[120vh]" />
        </div>
    ),
}

/** A brand-deep page: `.scroll-on-deep` and the deep ground on <html> give the page's bar the lighter purple. */
export const DeepPage: Story = {
    render: function Render() {
        useEffect(() => {
            const root = document.documentElement
            root.classList.add('scroll-on-deep')
            // storybook.css paints <html> cream with !important; an inline
            // !important is the one thing that beats it.
            root.style.setProperty('background', 'var(--hero)', 'important')
            return () => {
                root.classList.remove('scroll-on-deep')
                root.style.removeProperty('background')
            }
        }, [])
        return (
            <div className="min-h-[200vh] bg-[var(--hero)] p-6 text-[var(--on-deep)]">
                <h2 className="text-2xl font-bold text-[var(--on-deep)]">On the brand-deep ground</h2>
                <p className="mt-2 max-w-[30em]">The page&apos;s bar, at the right edge, is the lighter purple.</p>
            </div>
        )
    },
}

const BASE = Date.UTC(2026, 9, 16, 9, 0)
const MIN = 60 * 1000
const THREAD: MessageItem[] = Array.from({ length: 18 }, (_, i) => ({
    id: String(i),
    side: i % 3 === 0 ? 'incoming' : 'own',
    text:
        i % 3 === 0
            ? 'Hi, is there anything I should do with the car before you arrive?'
            : 'Nothing at all, just leave it unlocked and clear the boot if you can.',
    createdAt: BASE + i * 7 * MIN,
}))

/** In context: the merchant Inbox, a list beside a conversation, each scrolling on its own, with no bar in either. */
export const InboxInContext: Story = {
    render: function Render() {
        const [draft, setDraft] = useState('')
        return (
            <div className="grid h-[36rem] grid-cols-[20rem_1fr] bg-[var(--background)] text-[var(--text-strong)]">
                <ScrollArea as="ul" label="Inbox" className="border-r border-[var(--hairline)] p-2">
                    {rows.map((r, i) => (
                        <li key={r}>
                            <a
                                href={`#booking-${i}`}
                                className="flex min-h-14 items-center rounded-xl px-3 hover:bg-[var(--band)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
                            >
                                {r}
                            </a>
                        </li>
                    ))}
                </ScrollArea>
                <div className="flex min-h-0 flex-col">
                    <ScrollArea label="Conversation with Alex" className="min-h-0 flex-1 p-4">
                        <MessageThread items={THREAD} />
                    </ScrollArea>
                    <MessageComposer
                        layout="inset"
                        value={draft}
                        onChange={setDraft}
                        onSend={() => setDraft('')}
                        placeholder="Message Alex"
                    />
                </div>
            </div>
        )
    },
}
