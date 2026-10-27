import * as React from 'react'
import { cn } from '../lib/cn'
import type { InstallPlatform } from '../lib/install-prompt'
import { Button } from './Button'

/**
 * InstallOffer: "add this app to your home screen", once, in the page.
 *
 * AUTM-1906. Promoted from autara-customer-web's `InstallOffer` (AUTM-1781
 * decision 4, "offered once, never a banner on arrival") for the merchant
 * portal, so both apps draw one offer. Its behaviour (when to show, the answer
 * remembered) is `useInstallOffer` in `lib/install-prompt`; this is the card.
 *
 * In the page, not fixed. Both apps' bottom edge belongs to something else
 * (the booking's bar, the portal's dock and toasts), and an offer that covers
 * work is the AUTM-1018 failure `PWAInstallBanner` shipped with. It sits where
 * the surface puts it, after the things that need the person.
 *
 * Two paths:
 *   - `prompt`       the browser can install in one tap (Chrome, Edge).
 *                    Install opens the browser's own dialog.
 *   - `apple-mobile` an iPhone or iPad, where nothing can open the install
 *                    for the person: the card explains Share, then Add to
 *                    Home Screen, with the Share glyph they will look for.
 *
 * A labelled region (a `section` named by its heading), never a dialog: it
 * takes no focus and traps nothing. The heading level is the surface's, so it
 * sits in the page's outline; type classes go on a span inside it, because
 * both apps style h1 to h6 with an unlayered rule that beats utilities.
 *
 * Anatomy: the EmptyState band card (20px in, a 44px mark, an 18px bold title,
 * a 15px muted line). The mark is the app's own icon when the surface passes
 * one, so the person sees what will be on their home screen. Install is the
 * card's one primary; Not now is a ghost. Below 18rem of card (a 320 phone,
 * or 200% text) the mark moves above the words rather than squeezing them.
 */

export interface InstallOfferProps {
    /** Which offer: one-tap install, or the Share steps on an iPhone or iPad. */
    path: 'prompt' | 'apple-mobile'
    /** "Add Autara to your Home Screen". Sentence case. */
    title: string
    /** Why, in a sentence. Shown on both paths. */
    body: React.ReactNode
    /** The app's own icon (an `<img>`), drawn 44px in a rounded square. Decorative. */
    icon?: React.ReactNode
    /** The install button's label (prompt path). Default "Install". */
    installLabel?: string
    /** The dismiss button's label. Default "Not now". */
    dismissLabel?: string
    onInstall?: () => void
    onDismiss: () => void
    /** The title's heading level in the surface's outline. Default 2. */
    headingLevel?: 2 | 3
    /** Root `data-testid`; the buttons take `-install` and `-dismiss`, the steps `-steps`. */
    testId?: string
    className?: string
}

export function InstallOffer({
    path,
    title,
    body,
    icon,
    installLabel = 'Install',
    dismissLabel = 'Not now',
    onInstall,
    onDismiss,
    headingLevel = 2,
    testId = 'install-offer',
    className,
}: InstallOfferProps) {
    const titleId = React.useId()
    const Heading = headingLevel === 3 ? 'h3' : 'h2'
    return (
        <section
            aria-labelledby={titleId}
            data-testid={testId}
            data-path={path}
            className={cn('@container rounded-2xl bg-[var(--band)] p-5', className)}
        >
            <div className="flex flex-col gap-3 @min-[18rem]:flex-row @min-[18rem]:items-start @min-[18rem]:gap-4">
                <span
                    aria-hidden
                    className="grid size-11 flex-none place-items-center overflow-hidden rounded-[0.75rem] bg-[var(--raised)] text-[var(--text-strong)] [&>img]:size-full [&>img]:object-cover"
                >
                    {icon ?? <HomeScreenGlyph />}
                </span>
                <div className="min-w-0 flex-1">
                    <Heading id={titleId}>
                        <span className="block text-lg leading-snug font-bold text-[var(--text-strong)]">{title}</span>
                    </Heading>
                    <p className="mt-1 text-[0.9375rem] leading-normal text-[var(--text-muted)]">{body}</p>
                    {path === 'apple-mobile' ? (
                        <InstallSteps platform="apple-mobile" className="mt-3" testId={`${testId}-steps`} />
                    ) : null}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        {path === 'prompt' ? (
                            <Button size="sm" variant="primary" onClick={onInstall} data-testid={`${testId}-install`}>
                                {installLabel}
                            </Button>
                        ) : null}
                        <Button size="sm" variant="ghost" onClick={onDismiss} data-testid={`${testId}-dismiss`}>
                            {dismissLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}

InstallOffer.displayName = 'InstallOffer'

export interface InstallStepsProps {
    /** From `installPlatform()`. */
    platform: InstallPlatform
    /** `data-testid` on the list. */
    testId?: string
    className?: string
}

/**
 * How to install from this browser, as numbered steps: the offer's iPhone and
 * iPad path, and the surface's "Install the app" help for every other browser.
 *
 * The words name what is on screen (Share, Add to Home Screen, Add to Dock),
 * spelled as each browser spells it, in bold, so the person can match them.
 * They avoid saying exactly where a control sits, because that moves between
 * versions: iOS 26 Safari put Share under More on an iPhone.
 */
export function InstallSteps({ platform, testId, className }: InstallStepsProps) {
    const steps = INSTALL_STEPS[platform]
    return (
        <ol data-testid={testId} data-platform={platform} className={cn('flex flex-col gap-2', className)}>
            {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-[0.9375rem] leading-normal text-[var(--text-strong)]">
                    <span
                        aria-hidden
                        className="grid size-6 flex-none place-items-center rounded-full bg-[var(--raised)] text-[0.8125rem] font-bold"
                    >
                        {i + 1}
                    </span>
                    <span className="min-w-0 pt-px">{step}</span>
                </li>
            ))}
        </ol>
    )
}

InstallSteps.displayName = 'InstallSteps'

const INSTALL_STEPS: Record<InstallPlatform, React.ReactNode[]> = {
    'apple-mobile': [
        <>
            Tap <strong>Share</strong> <ShareGlyph /> in the browser&apos;s toolbar. On an iPhone it can be under{' '}
            <strong>More</strong>.
        </>,
        <>
            Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.
        </>,
    ],
    'mac-safari': [
        <>
            In the menu bar, choose <strong>File</strong>, then <strong>Add to Dock</strong>.
        </>,
        <>
            Choose <strong>Add</strong>. It opens in its own window from the Dock.
        </>,
    ],
    android: [
        <>Open the browser&apos;s menu.</>,
        <>
            Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.
        </>,
    ],
    desktop: [
        <>
            Choose the install icon at the end of the address bar, or <strong>Install</strong> in the browser&apos;s
            menu.
        </>,
        <>
            Confirm with <strong>Install</strong>. It opens in its own window.
        </>,
    ],
    other: [
        <>Open this page in Chrome, Edge or Safari.</>,
        <>Install it from that browser&apos;s menu.</>,
    ],
}

/* ── Inlined Solar Linear glyphs (no icon dependency, as PWAInstallBanner) ── */

/** Safari's Share symbol, a box with an arrow out of the top. */
function ShareGlyph() {
    return (
        <svg
            viewBox="0 0 24 24"
            width="1.1em"
            height="1.1em"
            fill="none"
            aria-hidden
            className="inline-block align-[-0.15em]"
        >
            <path d="M12 3v12M8 7l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    )
}

/** A phone with an app tile on it, when the surface passes no icon. */
function HomeScreenGlyph() {
    return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
            <rect x="6" y="2" width="12" height="20" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
            <rect x="9.5" y="7.5" width="5" height="5" rx="1.25" stroke="currentColor" strokeWidth="1.6" />
            <path d="M10.5 18.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    )
}
