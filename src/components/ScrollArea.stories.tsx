import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ScrollArea } from './ScrollArea'
import { FilterChipRow } from './FilterChipRow'
import { BackButton } from './BackButton'

/**
 * ScrollArea (AUTM-1756). A region that scrolls on its own: a split pane's
 * list, a drawer, a chat thread, a chip row. Contained overscroll, scroll
 * padding under a sticky header, edge fades on a horizontal row, the brand
 * thumb shown on hover and while scrolling, and focus only where nothing
 * inside can take it. One page scroll beats two: a screen whose page already
 * scrolls needs none of this.
 *
 * The thumb shows with a mouse or trackpad; overlay scrollbars (macOS by
 * default, phones) show only while scrolling.
 */
const meta: Meta<typeof ScrollArea> = {
    title: 'Layout/ScrollArea',
    component: ScrollArea,
    parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof ScrollArea>

const people = [
    'Alex Chen', 'Priya Nair', 'Sam Okafor', 'Mia Rossi', 'Jordan Lee', 'Noah Williams', 'Ava Brown',
    'Liam Smith', 'Zoe Martin', 'Ethan Clarke', 'Grace Kim', 'Oliver Jones', 'Chloe Davis', 'Lucas Wright',
    'Isla Walker', 'Jack Thompson', 'Ruby White', 'Henry Hall', 'Ella Young', 'Leo King',
]

function Row({ name, i }: { name: string; i: number }) {
    return (
        <li>
            <a
                href={`#customer-${i}`}
                className="flex min-h-14 items-center gap-3 rounded-xl px-3 text-[var(--text-strong)] hover:bg-[var(--band)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
            >
                <span className="grid size-9 place-items-center rounded-full bg-[var(--band)] text-xs font-bold">
                    {name.split(' ').map((p) => p[0]).join('')}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
                <span className="text-sm text-[var(--text-muted)]">{(i % 5) + 1} bookings</span>
            </a>
        </li>
    )
}

/** A list pane (Customers, Inbox): links inside, so it takes no focus itself. */
export const ListPane: Story = {
    render: () => (
        <div className="h-[24rem] w-[22rem] overflow-hidden rounded-[1.25rem] bg-[var(--paper)]">
            <ScrollArea as="ul" label="Customers" className="h-full p-2">
                {people.map((p, i) => (
                    <Row key={p} name={p} i={i} />
                ))}
            </ScrollArea>
        </div>
    ),
}

/** A sticky header inside: a row reached by Tab lands under it, not behind it. */
export const UnderAStickyHeader: Story = {
    render: () => (
        <div className="h-[24rem] w-[22rem] overflow-hidden rounded-[1.25rem] bg-[var(--paper)]">
            <ScrollArea label="Customers" stickyOffset="3.5rem" className="h-full">
                <div className="sticky top-0 z-10 flex h-14 items-center bg-[var(--paper)] px-4 font-bold">
                    Customers
                </div>
                <ul className="px-2 pb-2">
                    {people.map((p, i) => (
                        <Row key={p} name={p} i={i} />
                    ))}
                </ul>
            </ScrollArea>
        </div>
    ),
}

/** Edge case: nothing focusable inside, so the area itself takes focus. */
export const ReadOnlyText: Story = {
    render: () => (
        <ScrollArea label="Cancellation policy" className="h-48 w-[22rem] rounded-[1.25rem] bg-[var(--band)] p-4 text-[var(--text-strong)]">
            {Array.from({ length: 8 }, (_, i) => (
                <p key={i} className="mb-3">
                    Cancel up to 24 hours before the booking for a full refund of your deposit. Inside 24 hours the
                    deposit is kept by the pro, and the booking fee is refunded.
                </p>
            ))}
        </ScrollArea>
    ),
}

/** A horizontal row fades the edge that has more. */
export const ChipRow: Story = {
    render: () => (
        <div className="w-[20rem]">
            <ScrollArea orientation="horizontal" label="Filter the Inbox" className="flex gap-2.5 py-1">
                {['All', 'Requests', 'To pay', 'Messages', 'Reviews', 'Cancelled', 'Archived'].map((c) => (
                    <button
                        key={c}
                        type="button"
                        className="min-h-11 shrink-0 rounded-full bg-[var(--band)] px-4 text-sm font-medium text-[var(--text-strong)]"
                    >
                        {c}
                    </button>
                ))}
            </ScrollArea>
        </div>
    ),
}

/** FilterChipRow fades its own edges. */
export const FilterChips: Story = {
    render: function Render() {
        const [v, setV] = useState('all')
        return (
            <div className="w-[18rem]">
                <FilterChipRow
                    value={v}
                    onChange={setV}
                    ariaLabel="Booking status"
                    options={['all', 'pending', 'confirmed', 'in progress', 'completed', 'cancelled'].map((o) => ({
                        value: o,
                        label: o[0].toUpperCase() + o.slice(1),
                    }))}
                />
            </div>
        )
    },
}

/** In context: a list beside its record, each scrolling on its own; the page does not. */
export const SplitInContext: Story = {
    parameters: { layout: 'fullscreen' },
    render: () => (
        <div className="grid h-[32rem] grid-cols-[20rem_1fr] bg-[var(--background)]">
            <ScrollArea as="ul" label="Customers" className="border-r border-[var(--hairline)] p-2">
                {people.map((p, i) => (
                    <Row key={p} name={p} i={i} />
                ))}
            </ScrollArea>
            <ScrollArea label="Alex Chen" className="p-6 text-[var(--text-strong)]">
                <BackButton label="Customers" />
                <p className="mt-6 text-3xl font-bold">Alex Chen</p>
                {Array.from({ length: 14 }, (_, i) => (
                    <p key={i} className="mt-4 text-[var(--text-muted)]">
                        Booking {i + 1}: Full interior car care, $189.00
                    </p>
                ))}
            </ScrollArea>
        </div>
    ),
}

/** Both themes, side by side: the brand thumb in each. */
export const BothThemes: Story = {
    parameters: { layout: 'fullscreen' },
    render: () => (
        <div className="grid sm:grid-cols-2">
            {(['light', 'dark'] as const).map((t) => (
                <div key={t} data-theme={t} className="bg-[var(--background)] p-6">
                    <div className="h-[20rem] overflow-hidden rounded-[1.25rem] bg-[var(--paper)]">
                        <ScrollArea as="ul" label={`Customers, ${t}`} className="h-full p-2">
                            {people.map((p, i) => (
                                <Row key={p} name={p} i={i} />
                            ))}
                        </ScrollArea>
                    </div>
                </div>
            ))}
        </div>
    ),
}
