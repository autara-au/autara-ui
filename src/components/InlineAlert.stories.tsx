import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { InlineAlert } from './InlineAlert'

const meta = {
    title: 'Atoms/InlineAlert',
    component: InlineAlert,
    parameters: { layout: 'padded' },
    args: {
        children: 'Check your connection and try again.',
    },
} satisfies Meta<typeof InlineAlert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    render: (args) => (
        <div className="max-w-md">
            <InlineAlert {...args} />
        </div>
    ),
}

export const Tones: Story = {
    render: () => (
        <div className="flex max-w-md flex-col gap-3">
            <InlineAlert tone="info" title="Saved on this device only">
                Marketing preferences are kept in this browser for now.
            </InlineAlert>
            <InlineAlert tone="success" title="Saved">
                Your details are up to date.
            </InlineAlert>
            <InlineAlert tone="warning" title="Almost out of time">
                Free cancellation ends in 3 hours.
            </InlineAlert>
            <InlineAlert tone="error" title="That code didn't match">
                Try again, or request a new one below.
            </InlineAlert>
        </div>
    ),
}

export const WithAction: Story = {
    args: {
        tone: 'error',
        title: "We couldn't save your booking",
        children:
            'Something failed on our side, not your connection. Try again in a moment.',
        action: (
            <Button variant="glass" size="sm">
                Try again
            </Button>
        ),
    },
    render: (args) => (
        <div className="max-w-md">
            <InlineAlert {...args} />
        </div>
    ),
}

export const LongCopyNarrow: Story = {
    args: {
        tone: 'warning',
        title: 'This sign-in has no customer profile',
        children:
            "You're signed in, but this sign-in has no Autara customer profile, so nothing that needs your account can go through. This usually means a sign-up didn't finish. Sign out and sign in with your email address, or email support and we'll repair your account.",
    },
    render: (args) => (
        <div className="w-[280px]">
            <InlineAlert {...args} />
        </div>
    ),
}

/* ─── AUTM-1472: one live region, chosen by `role` ──────────────────────
 *
 * The root is the only live region; nothing inside it carries a role. The
 * default is `alert` for an error and `status` for the rest. Each story
 * below names the region it renders, so a screen-reader check knows what to
 * expect.
 */

const DUPLICATE_ACTIONS = (
    <>
        <Button size="sm">
            Continue
        </Button>
        {/* A text action: a quiet button is band on band here and vanishes. */}
        <Button variant="link" size="sm">
            Sign in instead
        </Button>
    </>
)

/**
 * In context: merchant-web's duplicate business warning (AUTM-1253). A
 * warning that must interrupt (`role="alert"`, one region) with the two ways
 * forward the owner has. It used to be wrapped in a second `role="alert"`
 * around the built-in `role="status"`, and was announced twice.
 */
export const WarningThatInterrupts: Story = {
    name: 'Warning that interrupts, two actions (role="alert")',
    args: {
        tone: 'warning',
        role: 'alert',
        title: 'This business may already be on Autara',
        children:
            'An account for Northside Mobile Car Care at 14 Pitt Street already exists. If it is yours, sign in to it. If it is a different business, you can continue.',
        action: DUPLICATE_ACTIONS,
    },
    render: (args) => (
        <div className="max-w-md">
            <InlineAlert {...args} />
        </div>
    ),
}

/**
 * `role="none"` for a consumer that already owns the live region (a form's
 * error summary, a toast region). The alert renders no role of its own.
 */
export const InsideConsumerRegion: Story = {
    name: 'Inside a consumer region (role="none")',
    args: {
        tone: 'error',
        role: 'none',
        title: 'Two fields need a look',
        children: 'Add a postcode and pick a suburb you travel to.',
    },
    render: (args) => (
        <div role="alert" className="max-w-md">
            <InlineAlert {...args} />
        </div>
    ),
}

export const RolesDark: Story = {
    name: 'Tones and two actions, dark',
    globals: { theme: 'dark' },
    render: () => (
        <div className="flex max-w-md flex-col gap-3">
            <InlineAlert tone="info" title="Saved on this device only">
                Marketing preferences are kept in this browser for now.
            </InlineAlert>
            <InlineAlert tone="warning" role="alert" title="This business may already be on Autara" action={DUPLICATE_ACTIONS}>
                An account at 14 Pitt Street already exists.
            </InlineAlert>
            <InlineAlert tone="error" title="That code didn't match">
                Try again, or request a new one below.
            </InlineAlert>
        </div>
    ),
}

/** Scales the ROOT font size, as OS text scaling does. The two actions wrap. */
export const TwoActionsText200: Story = {
    name: 'Two actions, 200% text',
    tags: ['!autodocs'],
    render: function TwoActionsText200Story() {
        React.useEffect(() => {
            const prev = document.documentElement.style.fontSize
            document.documentElement.style.fontSize = '200%'
            return () => {
                document.documentElement.style.fontSize = prev
            }
        }, [])
        return (
            <div className="max-w-[375px]">
                <InlineAlert tone="warning" role="alert" title="This business may already be on Autara" action={DUPLICATE_ACTIONS}>
                    An account at 14 Pitt Street already exists.
                </InlineAlert>
            </div>
        )
    },
}
