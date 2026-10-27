import type { Meta, StoryObj } from '@storybook/react-vite'
import { BackButton } from './BackButton'

/**
 * BackButton (AUTM-365; AUTM-1756). Back says where it goes: with `label`
 * it is a filled pill, the chevron and the destination, as the merchant dock
 * draws "< Invoice" (Don's preference, 2026-10-15). Without one, or with
 * `compact`, it is the bare chevron on the 44px icon disc, for places with no
 * room for the word. The name is always "Back to <destination>" when there is
 * one. Tab to see the focus ring; check both themes with the toolbar.
 */
const meta: Meta<typeof BackButton> = {
    title: 'Molecules/BackButton',
    component: BackButton,
    parameters: { layout: 'centered' },
}
export default meta
type Story = StoryObj<typeof BackButton>

/** The labelled pill, the default wherever there is room. */
export const Pill: Story = {
    args: { label: 'Invoice' },
}

/** The bare chevron on the disc, only where the word does not fit. */
export const Disc: Story = {
    args: { ariaLabel: 'Back' },
}

/** No room, but the destination is known: the disc, named "Back to Bookings". */
export const Compact: Story = {
    args: { label: 'Bookings', compact: true },
}

/** The pill from 40rem up, the disc on a phone. Resize the canvas to see it. */
export const CompactOnPhone: Story = {
    args: { label: 'Inbox', compact: 'phone' },
}

export const AsLink: Story = {
    name: 'asChild — framework link',
    render: () => (
        <BackButton asChild label="Bookings">
            {/* Stands in for next/link / react-router Link */}
            <a href="#bookings" />
        </BackButton>
    ),
}

export const LongLabel: Story = {
    name: 'Edge — long label truncates in its box',
    render: () => (
        <div className="w-60">
            <BackButton label="Booking EF51E4, Full interior car care" />
        </div>
    ),
}

export const OnDark: Story = {
    name: 'On a brand-deep ground',
    render: () => (
        <div className="flex items-center gap-3 rounded-[1.25rem] bg-[var(--brand-deep)] p-4">
            <BackButton tone="ondark" label="Bookings" />
            <BackButton tone="ondark" />
        </div>
    ),
}

export const InContext: Story = {
    name: 'In context — detail-screen header',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="max-w-xl">
            <div className="mb-4">
                <BackButton asChild label="Bookings">
                    <a href="#bookings" />
                </BackButton>
            </div>
            <div className="text-[0.8125rem] font-medium text-[var(--text-muted)]">Booking EF51E4</div>
            <p className="mt-2 text-3xl font-bold tracking-[-0.03em] text-[var(--text-strong)]">
                Full interior car care
            </p>
        </div>
    ),
}

/** Both themes side by side. */
export const BothThemes: Story = {
    parameters: { layout: 'fullscreen' },
    render: () => (
        <div className="grid sm:grid-cols-2">
            {(['light', 'dark'] as const).map((t) => (
                <div key={t} data-theme={t} className="flex items-center gap-3 bg-[var(--background)] p-6">
                    <BackButton label="Invoice" />
                    <BackButton />
                </div>
            ))}
        </div>
    ),
}
