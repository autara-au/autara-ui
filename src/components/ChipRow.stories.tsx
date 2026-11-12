import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChipRow } from './ChipRow'
import { Button } from './Button'
import { ChoiceChips } from './ChoiceChips'
import { DatePicker } from './DatePicker'
import { FilterChipRow } from './FilterChipRow'
import { MessageComposer } from './MessageComposer'
import { QuickReplies, type QuickReply } from './QuickReplies'

/**
 * ChipRow (AUTM-1756 follow-up). One line of chips that scrolls sideways
 * with NO scrollbar. Don, 2026-10-15: "instead of scrollbar can add an
 * chevron arrow in the ending, to move it. also dragable, because scrollbar
 * is bit ugly."
 *
 * - The edge with more fades; a round chevron sits on it (the end one when it
 *   overflows, the start one once it has moved), hidden when there is nothing
 *   more that way. A press moves about one view of chips on the house
 *   ease-out, instantly with reduced motion.
 * - Drag it with a mouse or a pen; a drag never fires a chip's click. A finger
 *   keeps the browser's swipe and momentum.
 * - Tab walks every chip and brings each into view clear of the fade; in a
 *   listbox, radiogroup or tablist the arrow keys move between chips.
 *
 * The chevrons show wherever a fine pointer exists (`arrows="auto"`). Storybook
 * on a laptop has one; a phone emulator without a mouse does not, so the
 * `Touch` story asks for `arrows="always"`. FilterChipRow, QuickReplies
 * `layout="row"`, ChoiceChips `layout="row"` and DatePicker's day rail are all
 * this row.
 *
 * Check every story in both themes (the toolbar), and `BothThemes` side by side.
 */
const meta: Meta<typeof ChipRow> = {
    title: 'Layout/ChipRow',
    component: ChipRow,
    parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof ChipRow>

const FILTERS = ['All', 'Requests', 'Payment due', 'Messages', 'In progress', 'Reviews', 'Cancelled', 'Archived']

const MERCHANT_REPLIES: QuickReply[] = [
    { id: 'omw', label: 'On my way' },
    { id: '15', label: '15 minutes away' },
    { id: 'arrived', label: "I've arrived" },
    { id: 'late', label: 'Running about 15 minutes late' },
    { id: 'done', label: 'All done, ready to collect' },
    { id: 'gate', label: "What's the gate code?" },
]

function PressedChips({ labels = FILTERS, initial = labels[0] }: { labels?: string[]; initial?: string }) {
    const [on, setOn] = useState(initial)
    return (
        <>
            {labels.map((l) => (
                <button
                    key={l}
                    type="button"
                    aria-pressed={on === l}
                    onClick={() => setOn(l)}
                    className={`motion-press inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-4 text-[0.8125rem] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${
                        on === l
                            ? 'bg-[var(--selected)] text-[var(--on-selected)]'
                            : 'bg-[var(--band)] text-[var(--text-strong)] hover:bg-[var(--band-press)]'
                    }`}
                >
                    {l}
                </button>
            ))}
        </>
    )
}

/** A filter row in a 360px pane: the end fades and holds a chevron. Press it, or drag the row. */
export const Default: Story = {
    render: () => (
        <div className="w-[22.5rem]">
            <ChipRow label="Filter the Inbox" className="gap-2.5">
                <PressedChips />
            </ChipRow>
        </div>
    ),
}

/**
 * The chosen chip is in the middle: the row arrives with it in view, clear of
 * the fades, so both ends fade and both chevrons show.
 */
export const BothEnds: Story = {
    render: () => (
        <div className="w-[22.5rem]">
            <ChipRow label="Filter the Inbox" className="gap-2.5">
                <PressedChips initial="In progress" />
            </ChipRow>
        </div>
    ),
}

/** Everything fits: no fade, no chevron, nothing to drag. */
export const Fits: Story = {
    render: () => (
        <div className="w-[36rem]">
            <ChipRow label="Filter" className="gap-2.5">
                <PressedChips labels={['All', 'Requests', 'Payment due']} />
            </ChipRow>
        </div>
    ),
}

/** `arrows="always"`: the chevrons for a finger too (they are 48px under a coarse pointer). */
export const Touch: Story = {
    parameters: { viewport: { defaultViewport: 'phone' } },
    render: () => (
        <div className="max-w-[22.5rem]">
            <ChipRow label="Filter the Inbox" arrows="always" className="gap-2.5">
                <PressedChips />
            </ChipRow>
        </div>
    ),
}

/**
 * In context: the chat's quick replies above the composer (merchant), the
 * row that started this. A chip fills the box; it never sends. The end
 * chevron is "Show more replies".
 */
export const QuickRepliesInContext: Story = {
    parameters: { layout: 'fullscreen' },
    render: function QuickRepliesStory() {
        const [value, setValue] = useState('')
        return (
            <div className="flex h-[22rem] max-w-[24.375rem] flex-col justify-end bg-[var(--paper)]">
                <div className="px-4 pb-2">
                    <QuickReplies
                        layout="row"
                        replies={MERCHANT_REPLIES}
                        onSelect={(r) => setValue(r.value ?? r.label)}
                    />
                </div>
                <MessageComposer value={value} onChange={setValue} onSend={() => setValue('')} />
            </div>
        )
    },
}

/** Light and dark side by side: the disc on the fade, on paper and on the dark ground. */
export const BothThemes: Story = {
    parameters: { layout: 'fullscreen' },
    render: () => (
        <div className="grid sm:grid-cols-2">
            {(['light', 'dark'] as const).map((t) => (
                <div key={t} data-theme={t} className="space-y-6 bg-[var(--background)] p-6">
                    <div className="max-w-[22.5rem] rounded-[1.25rem] bg-[var(--paper)] p-4">
                        <QuickReplies layout="row" replies={MERCHANT_REPLIES} onSelect={() => {}} />
                    </div>
                    <div className="max-w-[22.5rem]">
                        <FilterChipRow
                            ariaLabel={`Booking status, ${t}`}
                            value="all"
                            onChange={() => {}}
                            options={['all', 'pending', 'confirmed', 'in progress', 'completed', 'cancelled'].map((o) => ({
                                value: o,
                                label: o[0].toUpperCase() + o.slice(1),
                            }))}
                        />
                    </div>
                </div>
            ))}
        </div>
    ),
}

/** A radiogroup (ChoiceChips `layout="row"`): arrow keys move and choose; the action sits after the row, never past its edge. */
export const Radiogroup: Story = {
    render: function RadiogroupStory() {
        const [v, setV] = useState('0900')
        const times = ['0800', '0830', '0900', '0930', '1000', '1030', '1100', '1130', '1200']
        return (
            <div className="w-[22.5rem]">
                <ChoiceChips
                    label="Free times"
                    layout="row"
                    value={v}
                    onChange={setV}
                    options={times.map((t) => ({ value: t, label: `${t.slice(0, 2)}:${t.slice(2)}` }))}
                    action={{ label: 'Other time', onClick: () => {}, opensDialog: true }}
                />
            </div>
        )
    },
}

/** DatePicker's day rail is this row: chevrons "Earlier days" and "Later days", snap on whole days. */
export const DayRail: Story = {
    render: function DayRailStory() {
        const [d, setD] = useState('2026-10-16')
        return (
            <div className="w-[22.5rem] rounded-[1.25rem] bg-[var(--paper)] p-4">
                <DatePicker label="Day" value={d} onChange={setD} today="2026-10-15" testId="rail" />
            </div>
        )
    },
}

/** A row of links (`as="ul"`), as a pro page's section nav. */
export const Links: Story = {
    render: () => (
        <nav aria-label="Sections" className="w-[20rem]">
            <ChipRow as="ul" label="Sections" className="gap-2">
                {['Services', 'Packages', 'Reviews', 'About', 'Hours', 'Location'].map((s) => (
                    <li key={s}>
                        <a
                            href={`#${s.toLowerCase()}`}
                            className="inline-flex h-11 items-center rounded-xl px-4 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                        >
                            {s}
                        </a>
                    </li>
                ))}
            </ChipRow>
        </nav>
    ),
}

/** Edge case: 200% text on a phone. The chevron grows with the text; the row still never draws a bar. */
export const LargeText: Story = {
    parameters: { viewport: { defaultViewport: 'phone' } },
    render: function LargeTextStory() {
        useEffect(() => {
            const prev = document.documentElement.style.fontSize
            document.documentElement.style.fontSize = '200%'
            return () => {
                document.documentElement.style.fontSize = prev
            }
        }, [])
        return (
            <ChipRow label="Filter the Inbox" arrows="always" className="gap-2">
                <PressedChips labels={FILTERS.slice(0, 5)} />
            </ChipRow>
        )
    },
}

/** Edge case: one chip wider than the row. A press moves a view less the two edges. */
export const OneLongChip: Story = {
    render: () => (
        <div className="w-[16rem]">
            <ChipRow label="Suggestions" className="gap-2">
                <Button variant="quiet" size="sm" className="whitespace-nowrap">
                    Hot-water extraction on carpets and cloth seats, leather conditioned
                </Button>
                <Button variant="quiet" size="sm">
                    Wax
                </Button>
            </ChipRow>
        </div>
    ),
}
