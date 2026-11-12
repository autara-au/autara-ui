import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'
import { Button } from './Button'
import { InstallOffer, InstallSteps } from './InstallOffer'
import { catchInstallPrompt, useInstallOffer } from '../lib/install-prompt'

/**
 * InstallOffer (AUTM-1906): "add this app to your home screen", once, in the
 * page. Customer-web's AUTM-1781 offer, promoted for the merchant portal.
 *
 * The card is presentational; WHETHER it shows is `useInstallOffer` (the
 * browser can install, not already installed, not already answered), and
 * WHERE is the surface's call. The "Live" story wires the two together with a
 * synthesised `beforeinstallprompt`, the one thing Storybook cannot get from
 * a real browser.
 *
 * Why not `PWAInstallBanner`: it is fixed to the bottom edge (the portal's
 * dock and toasts live there), hidden from 1024px (an iPad Pro and every
 * desktop), listens only after it mounts (the event has usually fired by
 * then), and misses iPadOS Safari, which reports a Mac user agent.
 */

/** A page column's width, so the card reads at the size a surface gives it. */
const column: Decorator = (Story) => (
    <div className="max-w-xl">
        <Story />
    </div>
)

const meta = {
    title: 'Molecules/InstallOffer',
    component: InstallOffer,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'A one-time, in-page offer to install the web app. `prompt` path: Install opens the browser dialog (Chrome, Edge). `apple-mobile` path: Share, then Add to Home Screen (iPhone, iPad). A labelled region, never a dialog. Behaviour lives in `useInstallOffer`; call `catchInstallPrompt()` once at the app root.',
            },
        },
    },
    args: {
        path: 'prompt',
        title: 'Install Autara for business',
        body: 'Open your bookings from your home screen or Dock in one tap, full screen, like an app.',
        onDismiss: () => {},
        onInstall: () => {},
    },
    decorators: [column],
} satisfies Meta<typeof InstallOffer>

export default meta
type Story = StoryObj<typeof meta>

/** A stand-in app icon: brand gradient, white mark, as the merchant app's icon draws it. */
const APP_ICON = `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset=".35" stop-color="#4e1bbd"/><stop offset="1" stop-color="#47b1ff"/></linearGradient></defs><rect width="96" height="96" fill="url(#g)"/><circle cx="48" cy="48" r="17" fill="none" stroke="#fff" stroke-width="10"/></svg>',
)}`

export const Prompt: Story = {
    name: 'Chrome and Edge: one tap',
}

export const AppleMobile: Story = {
    name: 'iPad and iPhone: Share, then Add to Home Screen',
    args: {
        path: 'apple-mobile',
        title: 'Add Autara for business to your Home Screen',
        body: 'It opens full screen with its own icon, like an app.',
    },
}

export const WithAppIcon: Story = {
    name: 'With the app icon (what lands on the home screen)',
    args: {
        icon: <img src={APP_ICON} alt="" />,
    },
}

/**
 * EDGE CASE: a 320px phone, or a wider one at 200% text. The breakpoint is a
 * container query in rem (18rem of card), so it follows text scale: below it
 * the mark moves above the words instead of squeezing them, and the buttons
 * wrap rather than clip. Both stay 44px. Set the browser's text size to 200%
 * on a phone-width canvas to see the same thing at full width.
 */
export const Narrow: Story = {
    name: 'Edge case: a 320px column',
    args: { path: 'apple-mobile', title: 'Add Autara for business to your Home Screen', body: 'It opens full screen with its own icon.' },
    decorators: [
        (Story) => (
            <div style={{ width: 320 }}>
                <Story />
            </div>
        ),
    ],
}

/* ── layout="row" (AUTM-2048) ─────────────────────────────────────────────
 * Don, 2026-10-27, direction A of the AUTM-1906 proofs: the merchant portal's
 * offer as one slim row at the end of Today's main column, about a third of
 * the card's height. Gate 2: the merchant, idle, after the day's work, once
 * per browser; it should read as a row of the product (Wise's round mark,
 * title, one line, one action, filled close disc), not a banner. The close is
 * named "No thanks" on the portal because dismissing is for good on that
 * browser. The card above stays the default (customer-web draws it). In the
 * page column of this file (36rem), wide enough for the one-line mode. */

const ROW_PROMPT = {
    layout: 'row' as const,
    title: 'Install Autara for business',
    body: 'Opens to Today in its own window.',
    dismissLabel: 'No thanks',
    icon: <img src={APP_ICON} alt="" />,
    testId: 'today-install-offer',
}

export const Row: Story = {
    name: 'Row: Chrome and Edge, one tap',
    args: ROW_PROMPT,
}

export const RowAppleMobile: Story = {
    name: 'Row: iPad and iPhone, the Share steps under the words',
    args: {
        ...ROW_PROMPT,
        path: 'apple-mobile',
        title: 'Add Autara for business to your Home Screen',
        body: 'Opens to Today, full screen, from its own icon.',
    },
}

/** A phone's column (390): Install drops under the words; the close stays top right. */
export const RowPhone: Story = {
    name: 'Row: a 390 phone',
    args: ROW_PROMPT,
    decorators: [
        (Story) => (
            <div style={{ width: 358 }}>
                <Story />
            </div>
        ),
    ],
}

/**
 * EDGE CASE: a 320px phone, or any phone at 200% text. Under 19rem of row the
 * mark and the close share the top line and the words, Install or the steps
 * take the full width under them. rem, so text size moves it too.
 */
export const RowNarrow: Story = {
    name: 'Row edge case: a 320px column, iPhone steps',
    args: {
        ...ROW_PROMPT,
        path: 'apple-mobile',
        title: 'Add Autara for business to your Home Screen',
        body: 'Opens to Today, full screen, from its own icon.',
    },
    decorators: [
        (Story) => (
            <div style={{ width: 288 }}>
                <Story />
            </div>
        ),
    ],
}

/** EDGE CASE: browser text at 200% on a desktop column, the way the portal's text scale sets it. */
export const RowText200: Story = {
    name: 'Row edge case: 200% text',
    args: ROW_PROMPT,
    decorators: [
        (Story) => {
            React.useEffect(() => {
                const root = document.documentElement
                const before = root.style.fontSize
                root.style.fontSize = '200%'
                return () => {
                    root.style.fontSize = before
                }
            }, [])
            return <Story />
        },
    ],
}

/** The phone-glyph mark, when the surface passes no icon. */
export const RowWithoutIcon: Story = {
    name: 'Row: no app icon',
    args: { ...ROW_PROMPT, icon: undefined },
}

/** Every browser's words, as a surface's "Install the app" help shows them. */
export const StepsForEveryBrowser: Story = {
    name: 'InstallSteps: every browser',
    render: () => (
        <div className="flex flex-col gap-6">
            {(['apple-mobile', 'mac-safari', 'android', 'desktop', 'other'] as const).map((platform) => (
                <div key={platform}>
                    <p className="mb-2 text-[0.8125rem] font-medium text-[var(--text-muted)]">{platform}</p>
                    <InstallSteps platform={platform} />
                </div>
            ))}
        </div>
    ),
}

const LIVE_KEY = 'storybook.installOffer'

function LiveOffer() {
    React.useEffect(() => catchInstallPrompt(), [])
    const [round, setRound] = React.useState(0)
    return (
        <div className="flex flex-col gap-4">
            <LiveCard key={round} />
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="quiet"
                    onClick={() => {
                        const evt = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
                            prompt: () => Promise<void>
                            userChoice: Promise<{ outcome: string }>
                        }
                        evt.prompt = async () => {}
                        evt.userChoice = Promise.resolve({ outcome: 'dismissed' })
                        window.dispatchEvent(evt)
                    }}
                >
                    Fire beforeinstallprompt
                </Button>
                <Button
                    size="sm"
                    variant="quiet"
                    onClick={() => {
                        window.localStorage.removeItem(LIVE_KEY)
                        setRound((r) => r + 1)
                    }}
                >
                    Forget the answer
                </Button>
            </div>
        </div>
    )
}

function LiveCard() {
    const offer = useInstallOffer({ storageKey: LIVE_KEY })
    if (!offer.path) {
        return <p className="text-[0.9375rem] text-[var(--text-muted)]">No offer: nothing to install yet, or already answered.</p>
    }
    return (
        <InstallOffer
            path={offer.path}
            title="Install Autara for business"
            body="Open your bookings from your home screen or Dock in one tap."
            onInstall={() => void offer.install()}
            onDismiss={offer.dismiss}
        />
    )
}

/**
 * The behaviour, live: nothing until the browser's event arrives (press
 * "Fire"), then the one-tap path; Not now or Install hides it for good, until
 * "Forget the answer". On an iPad the Share path shows straight away.
 */
export const Live: Story = {
    name: 'Live: useInstallOffer',
    render: () => <LiveOffer />,
}
