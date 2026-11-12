import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from './DropdownMenu'

/**
 * DropdownMenu — Radix dropdown in the Autara cream-canvas grammar.
 *
 * Content portals with a hairline edge; no drop shadow, no backdrop
 * blur. Items hover to `--surface-elevated`; Labels become editorial
 * eyebrows; Separators are hairlines. Solar Bold chevron on the
 * submenu trigger.
 *
 * Destructive items: pass `className="text-[var(--color-autara-error)]"`
 * to the `DropdownMenuItem` — there's no built-in variant axis to
 * keep the API surface tight.
 */
const meta: Meta = {
    title: 'Atoms/DropdownMenu',
    parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj

// ─── Solar Bold-style icons used in stories ────────────────────────
const KebabIcon: React.FC = () => (
    <svg
        aria-hidden
        viewBox="0 0 24 24"
        width="16"
        height="16"
        className="text-[var(--text-strong)]"
        fill="currentColor"
    >
        <circle cx="12" cy="5" r="1.6" />
        <circle cx="12" cy="12" r="1.6" />
        <circle cx="12" cy="19" r="1.6" />
    </svg>
)
const EyeIcon: React.FC = () => (
    <svg
        aria-hidden
        viewBox="0 0 24 24"
        width="16"
        height="16"
        className="shrink-0 text-[var(--text-muted)]"
        fill="currentColor"
    >
        <path d="M12 5C6 5 2 12 2 12s4 7 10 7 10-7 10-7-4-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" opacity="0.18" />
        <circle cx="12" cy="12" r="2.4" />
    </svg>
)
const PencilIcon: React.FC = () => (
    <svg
        aria-hidden
        viewBox="0 0 24 24"
        width="16"
        height="16"
        className="shrink-0 text-[var(--text-muted)]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M16 4l4 4-12 12H4v-4z" />
    </svg>
)
const CopyIcon: React.FC = () => (
    <svg
        aria-hidden
        viewBox="0 0 24 24"
        width="16"
        height="16"
        className="shrink-0 text-[var(--text-muted)]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
)
const TrashIcon: React.FC = () => (
    <svg
        aria-hidden
        viewBox="0 0 24 24"
        width="16"
        height="16"
        className="shrink-0 text-[var(--color-autara-error)]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
    </svg>
)

// ─── Default — simple kebab menu ───────────────────────────────────
export const Default: Story = {
    render: () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    Actions
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuItem>View profile</DropdownMenuItem>
                <DropdownMenuItem>Edit details</DropdownMenuItem>
                <DropdownMenuItem>Copy link</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    ),
}

// ─── With editorial label + separator + destructive ────────────────
export const Grouped: Story = {
    name: 'Grouped — Label + Separator + Destructive',
    render: () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    Booking actions
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[14rem]">
                <DropdownMenuLabel>This booking</DropdownMenuLabel>
                <DropdownMenuItem>
                    <EyeIcon />
                    View detail
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <PencilIcon />
                    Edit service
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <CopyIcon />
                    Copy invoice link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Danger zone</DropdownMenuLabel>
                <DropdownMenuItem className="text-[var(--color-autara-error)] data-[highlighted]:bg-[rgba(221,56,56,0.08)]">
                    <TrashIcon />
                    Cancel booking
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    ),
}

/**
 * AUTM-1483: the group labels on screen without a click. "This booking" and
 * "Danger zone" render as written, in sentence case at 0.75rem and weight
 * 500 with no letterspacing (the ListSection title treatment). They used to
 * render as letterspaced capitals.
 *
 * `modal={false}` so the open menu does not lock the canvas, and kept off the
 * docs page (`!autodocs`), where an open menu would sit over the other stories.
 */
export const GroupLabelsOpen: Story = {
    name: 'Group labels, open (AUTM-1483)',
    tags: ['!autodocs'],
    render: () => (
        <div className="min-h-[18rem]">
            <DropdownMenu defaultOpen modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        Booking actions
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[14rem]">
                    <DropdownMenuLabel>This booking</DropdownMenuLabel>
                    <DropdownMenuItem>
                        <EyeIcon />
                        View detail
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <CopyIcon />
                        Copy invoice link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Danger zone</DropdownMenuLabel>
                    <DropdownMenuItem className="text-[var(--color-autara-error)] data-[highlighted]:bg-[rgba(221,56,56,0.08)]">
                        <TrashIcon />
                        Cancel booking
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    ),
}

// ─── Submenu — nested actions ──────────────────────────────────────
export const WithSubmenu: Story = {
    name: 'Submenu — nested actions',
    render: () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    Move booking
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[14rem]">
                <DropdownMenuItem>Open detail</DropdownMenuItem>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        Reschedule to…
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem>Later today</DropdownMenuItem>
                        <DropdownMenuItem>Tomorrow 9:00</DropdownMenuItem>
                        <DropdownMenuItem>Tomorrow 14:00</DropdownMenuItem>
                        <DropdownMenuItem>Next available slot</DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Assign to…</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem>Maya R</DropdownMenuItem>
                        <DropdownMenuItem>Sam T</DropdownMenuItem>
                        <DropdownMenuItem>Jordan K</DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-[var(--color-autara-error)] data-[highlighted]:bg-[rgba(221,56,56,0.08)]">
                    Cancel booking
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    ),
}

// ─── In context — table row kebab ─────────────────────────────────
export const TableRowKebab: Story = {
    name: 'In context — table row kebab',
    render: () => (
        <div className="max-w-2xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]">
            <div className="grid grid-cols-[1fr_120px_120px_40px] items-center gap-4 border-b border-[var(--border-subtle)] px-5 py-3 text-[0.75rem] font-medium text-[var(--text-muted)]">
                <span>Customer</span>
                <span>Service</span>
                <span>Time</span>
                <span className="sr-only">Actions</span>
            </div>
            {[
                { name: 'Maya R', service: 'Full detail', time: '09:30' },
                { name: 'Sam T', service: 'Express', time: '11:00' },
                { name: 'Jordan K', service: 'Premium', time: '14:00' },
            ].map((row, i, arr) => (
                <div
                    key={row.name}
                    className={`grid grid-cols-[1fr_120px_120px_40px] items-center gap-4 px-5 py-3 text-sm ${
                        i < arr.length - 1
                            ? 'border-b border-[var(--border-subtle)]'
                            : ''
                    }`}
                >
                    <span className="text-[var(--text-strong)]">
                        {row.name}
                    </span>
                    <span className="text-[var(--text-muted)]">
                        {row.service}
                    </span>
                    <span className="text-[var(--text-muted)] tabular-nums">
                        {row.time}
                    </span>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            aria-label={`Actions for ${row.name}`}
                            className="grid h-8 w-8 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-elevated)] hover:text-[var(--text-strong)]"
                        >
                            <KebabIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[12rem]">
                            <DropdownMenuItem>
                                <EyeIcon />
                                View detail
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <PencilIcon />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <CopyIcon />
                                Copy customer link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-[var(--color-autara-error)] data-[highlighted]:bg-[rgba(221,56,56,0.08)]">
                                <TrashIcon />
                                Cancel booking
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ))}
        </div>
    ),
}

/* ─── AUTM-1594: every row is 44px ──────────────────────────────────────
 *
 * Plain rows were `py-2` around a 20px line, 36px to the finger. They now
 * carry a 44px MINIMUM, so a wrapped label or 200% text grows the row. These
 * open on load (`modal={false}`, so the canvas is not locked) and stay off
 * the docs page, where an open menu would sit over the other stories. The
 * dashed outline in the first one is the row box, drawn for review only.
 */
const OpenRows: React.FC<{ outline?: boolean }> = ({ outline = false }) => (
    <div className="min-h-[20rem]">
        {outline ? (
            <style>{'[data-story-rows] [role="menuitem"]{outline:1px dashed var(--accent);outline-offset:-1px}'}</style>
        ) : null}
        <DropdownMenu defaultOpen modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    Booking actions
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[14rem] max-w-[18rem]" data-story-rows="">
                <DropdownMenuItem>
                    <EyeIcon />
                    View detail
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <PencilIcon />
                    Reschedule
                </DropdownMenuItem>
                <DropdownMenuItem inset>Copy invoice link</DropdownMenuItem>
                <DropdownMenuItem>
                    <CopyIcon />
                    Send the customer a reminder about their deposit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-[var(--color-autara-error)]">
                    <TrashIcon />
                    Cancel booking
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
)

export const RowsOpen: Story = {
    name: 'Rows, 44px, open',
    tags: ['!autodocs'],
    render: () => <OpenRows outline />,
}

export const RowsOpenDark: Story = {
    name: 'Rows, 44px, open, dark',
    tags: ['!autodocs'],
    globals: { theme: 'dark' },
    render: () => <OpenRows />,
}

/** Scales the ROOT font size, as OS text scaling does. Rows grow, never clip. */
export const RowsOpenText200: Story = {
    name: 'Rows, 44px, open, 200% text',
    tags: ['!autodocs'],
    render: function RowsOpenText200Story() {
        React.useEffect(() => {
            const prev = document.documentElement.style.fontSize
            document.documentElement.style.fontSize = '200%'
            return () => {
                document.documentElement.style.fontSize = prev
            }
        }, [])
        return <OpenRows />
    },
}

/* ─── AUTM-1792: lifted off the page ─────────────────────────────────────
 *
 * Don, 2026-10-09, on the merchant portal: "there's no shadow or something
 * here when open the menu, fix it". A menu portals over whatever the page
 * has, usually paper on paper, so the surface step that carries depth
 * everywhere else is zero under it. `.floating-surface` gives it a firmer
 * hairline and a purple-tinted lift. The page behind is drawn so the lift has
 * something to lift off: a list of rows on paper and a band card, the two
 * grounds a menu actually opens over.
 */
const PageBehind: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="relative min-h-[24rem] bg-[var(--paper)] p-6 text-[var(--text-strong)]">
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="text-[0.8125rem] font-medium text-[var(--text-muted)]">Bookings</p>
                <p className="mt-1 text-2xl font-bold">Your schedule</p>
            </div>
            {children}
        </div>
        <ul className="mt-6 divide-y divide-[var(--hairline)] rounded-autara-lg border border-[var(--hairline)]">
            {['Full interior and exterior clean', 'Express wash', 'Cut and polish'].map((s, i) => (
                <li key={s} className="flex items-center justify-between px-5 py-4">
                    <span className="font-medium">{s}</span>
                    <span className="text-sm text-[var(--text-muted)]">{['09:00', '11:30', '14:00'][i]}</span>
                </li>
            ))}
        </ul>
        <div className="mt-4 rounded-autara-lg bg-[var(--band)] p-5 text-sm text-[var(--text-muted)]">
            A band card, the other ground a menu opens over.
        </div>
    </div>
)

const LiftedMenu = () => (
    <PageBehind>
        <DropdownMenu defaultOpen modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    Booking actions
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[14rem]">
                <DropdownMenuItem>
                    <EyeIcon />
                    View detail
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <PencilIcon />
                    Reschedule
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <CopyIcon />
                    Copy payment link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-[var(--color-autara-error)]">
                    <TrashIcon />
                    Cancel booking
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </PageBehind>
)

export const LiftedOverThePage: Story = {
    name: 'Lifted over the page (AUTM-1792)',
    tags: ['!autodocs'],
    render: () => <LiftedMenu />,
}

export const LiftedOverThePageDark: Story = {
    name: 'Lifted over the page, dark (AUTM-1792)',
    tags: ['!autodocs'],
    globals: { theme: 'dark' },
    render: () => <LiftedMenu />,
}
