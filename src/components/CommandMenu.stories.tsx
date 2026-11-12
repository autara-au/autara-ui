import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CommandMenu, type CommandMenuGroup } from './CommandMenu'

/** No action addon here (`storybook/test` is not installed): a quiet no-op. */
const fn = () => () => {}

/**
 * CommandMenu: the ⌘K "jump to" palette (Don, 2026-11-07, the modern shell).
 * Screens to go to and actions to start, filtered by every word typed, run
 * with Enter. Try "new", "inv" or "calendar".
 */
const GROUPS: CommandMenuGroup[] = [
    {
        label: 'Go to',
        items: [
            { id: 'today', label: 'Today', onSelect: fn() },
            { id: 'bookings', label: 'Bookings', keywords: ['calendar', 'schedule'], onSelect: fn() },
            { id: 'inbox', label: 'Inbox', keywords: ['messages', 'requests'], onSelect: fn() },
            { id: 'customers', label: 'Customers', onSelect: fn() },
            { id: 'earnings', label: 'Earnings', keywords: ['payouts', 'money'], onSelect: fn() },
            { id: 'invoices', label: 'Invoices', onSelect: fn() },
        ],
    },
    {
        label: 'Actions',
        items: [
            { id: 'new-booking', label: 'New booking', onSelect: fn() },
            { id: 'new-invoice', label: 'New invoice', onSelect: fn() },
            { id: 'add-service', label: 'Add service', onSelect: fn() },
            { id: 'share', label: 'Share booking link', keywords: ['qr'], onSelect: fn() },
        ],
    },
    {
        label: 'Settings',
        items: [
            { id: 'hours', label: 'Opening hours', hint: 'Settings', keywords: ['availability'], onSelect: fn() },
            { id: 'billing', label: 'Plan and billing', hint: 'Settings', onSelect: fn() },
        ],
    },
]

const meta = {
    title: 'Molecules/CommandMenu',
    component: CommandMenu,
    parameters: { layout: 'fullscreen' },
    args: { open: true, onOpenChange: fn(), groups: GROUPS },
    render: function Render(args) {
        const [open, setOpen] = React.useState(args.open)
        return (
            <div className="min-h-[36rem] bg-[var(--paper)] p-6">
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="rounded-full bg-[var(--band)] px-4 py-2.5 text-sm text-[var(--text-muted)]"
                >
                    Jump to… ⌘K
                </button>
                <CommandMenu {...args} open={open} onOpenChange={setOpen} />
            </div>
        )
    },
} satisfies Meta<typeof CommandMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}

export const Closed: Story = { args: { open: false } }
