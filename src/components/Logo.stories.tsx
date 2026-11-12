import type { Meta, StoryObj } from '@storybook/react-vite'
import { Logo } from './Logo'

const meta: Meta<typeof Logo> = {
    title: 'Design System/Logo',
    component: Logo,
    parameters: { layout: 'centered' },
}
export default meta
type Story = StoryObj<typeof Logo>

export const Default: Story = {}

export const TextOnly: Story = { args: { textOnly: true } }

export const Small: Story = { args: { className: 'h-5 w-auto' } }
export const Medium: Story = { args: { className: 'h-7 w-auto' } }
export const Large: Story = { args: { className: 'h-12 w-auto' } }

export const InTopBar: Story = {
    name: 'In context — TopBar chrome',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="flex w-[640px] items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3">
            <Logo className="h-6 w-auto text-[var(--text-strong)]" />
            <span className="ml-auto text-[0.75rem] text-[var(--text-muted)]">
                Merchant portal
            </span>
        </div>
    ),
}

export const InvertedInk: Story = {
    name: 'On dark surface — wordmark white',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="grid h-40 w-[640px] place-items-center rounded-2xl bg-[#0E0A1A] text-white">
            <Logo className="h-9 w-auto" />
        </div>
    ),
}

/**
 * AUTM-1158 — the merchant-facing lockup.
 *
 * Merchant and customer are two products wearing one wordmark: a merchant
 * signing in to run their business saw exactly what a customer sees booking a
 * wash. Concept E from the 2026-09-07 sheet, chosen by Don out of six.
 *
 * The hairline is a separator, not emphasis, so it is not the outline rule 4
 * bans. Without it the two halves read as unrelated objects placed near each
 * other, which was the first cut and what he rejected.
 */
export const BusinessLockup: Story = {
    name: 'Business lockup',
    render: () => (
        <div className="flex flex-col gap-6 text-[var(--text-strong)]">
            <Logo lockup="business" size="xl" />
            <Logo lockup="business" size="lg" />
            <Logo lockup="business" size="md" />
            <Logo lockup="business" size="sm" />
        </div>
    ),
}

/**
 * The descriptor is never hidden at a breakpoint. Both consumers had
 * hand-composed this with `hidden sm:inline`, so on a phone — merchant
 * mobile's primary form factor — the distinction vanished exactly where the
 * two products are easiest to confuse. `size` shrinks the whole lockup
 * instead.
 */
export const BusinessLockupAtAppBarSize: Story = {
    name: 'Business lockup, app-bar size',
    render: () => (
        <div className="w-[22rem] rounded-xl border border-[var(--border-subtle)] p-3 text-[var(--text-strong)]">
            <Logo lockup="business" size="md" />
        </div>
    ),
}

/**
 * AUTM-1792: the mark alone.
 *
 * Don, 2026-10-09, looking at the merchant portal's rail in dark mode: show
 * only the white icon, not the text logo. `wordmark={false}` draws the orb
 * without the lettering; `tone="white"` paints it solid white for a dark
 * surface, where the gradient's purple end sinks into the ground.
 */
export const MarkOnly: Story = {
    name: 'Mark alone, brand and white',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="flex gap-4">
            <div
                data-theme="light"
                className="grid h-40 w-64 place-items-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--background)]"
            >
                <Logo wordmark={false} className="h-12 w-auto" />
            </div>
            <div data-theme="dark" className="grid h-40 w-64 place-items-center rounded-2xl bg-[var(--background)]">
                <Logo wordmark={false} tone="white" className="h-12 w-auto" />
            </div>
        </div>
    ),
}

/**
 * AUTM-1792: the business lockup without the lettering: mark, hairline,
 * "for business". Same row height, gap and hairline as the full lockup at each
 * size, so swapping it in moves nothing. The accessible name is still
 * "Autara for business", once; the mark inside is decorative.
 *
 * The hairline and descriptor follow the theme tokens, so on a dark ground
 * pick `tone="white"` and they flip with `data-theme="dark"` on their own.
 */
export const BusinessLockupMark: Story = {
    name: 'Business lockup, mark only',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="flex gap-4">
            {(
                [
                    { theme: 'light', tone: 'brand' },
                    { theme: 'dark', tone: 'white' },
                ] as const
            ).map((col) => (
                <div
                    key={col.theme}
                    data-theme={col.theme}
                    className="flex flex-col gap-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--background)] p-6 text-[var(--text-strong)]"
                >
                    <Logo lockup="business" wordmark={false} tone={col.tone} size="xl" />
                    <Logo lockup="business" wordmark={false} tone={col.tone} size="lg" />
                    <Logo lockup="business" wordmark={false} tone={col.tone} size="md" />
                    <Logo lockup="business" wordmark={false} tone={col.tone} size="sm" />
                </div>
            ))}
        </div>
    ),
}

/** The full lockup beside the mark-only one, so the unchanged rhythm is visible. */
export const BusinessLockupMarkBesideFull: Story = {
    name: 'Business lockup, full beside mark only',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="flex w-[22rem] flex-col gap-4 rounded-xl border border-[var(--border-subtle)] p-3 text-[var(--text-strong)]">
            <Logo lockup="business" size="md" />
            <Logo lockup="business" size="md" wordmark={false} />
        </div>
    ),
}
