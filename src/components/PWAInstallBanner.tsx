"use client";

import * as React from 'react'
import { createPortal } from 'react-dom'
import { CONSENT_BANNER_OFFSET } from './ConsentBanner'
import { useReservedBottomSpace } from '../lib/reserved-bottom-space'
import { cn } from '../lib/cn'
import { CloseButton } from './IconButton'

/**
 * PWAInstallBanner — bottom-anchored "Add to home screen" affordance.
 *
 * Two paths:
 *   - Chrome / Android: listens for `beforeinstallprompt`, stashes the
 *     event, and on tap calls `event.prompt()`.
 *   - iOS Safari (no `beforeinstallprompt`): renders manual
 *     instructions ("Tap Share → Add to Home Screen").
 *
 * Anti-nag rules:
 *   - skip if already installed (display-mode: standalone)
 *   - skip if dismissed within `dismissTtlMs` (default 30 days)
 *   - wait `firstShowDelayMs` (default 12s) before surfacing
 *
 * Copy is parameterised so every Autara app can mount the same
 * banner. The "Add to home screen" eyebrow stays for consistency.
 *
 * Promoted from autara-customer-web 2026-05-30 (AUTAA-UI-007). The
 * customer-web original was Iconify-coupled; this version inlines the
 * Solar-style glyphs as SVGs (no icon dependency).
 *
 * ─── AUTM-1018: the role, the space, and the layer ──────────────────────
 *
 * This shipped carrying the SAME defects AUTM-852 had just fixed on
 * `ConsentBanner`, because the two were written months apart from the same
 * bad starting point rather than from each other. All four were verified in
 * this file before being changed, not taken from the report.
 *
 * ROLE. It claimed `role="dialog"` while being non-modal: it never moved
 * focus into itself, never trapped focus, had no Escape handler and restored
 * nothing on close. The role promises a window that has taken over and this
 * is a banner that has not — and stealing focus on first paint to nag about a
 * home-screen shortcut would be worse than the inaccuracy, so the answer is
 * the role, not the behaviour. It also made `getByRole("dialog")` ambiguous
 * the moment a real `Dialog` was on screen, which is exactly the page where
 * the overlap bugs live and exactly how the sibling defect stayed hidden.
 * `region` with a REQUIRED accessible name is the same answer `ConsentBanner`
 * landed on, for the same reasons, and reaches a screen reader's landmark
 * list. `alertdialog` (modal, and nothing here is urgent), `complementary`
 * (a landmark for content complementing the main content — an install nag is
 * not that) and `alert` / `aria-live` (interrupts) were rejected there and
 * are rejected here.
 *
 * SPACE. It was `fixed bottom-0` and reserved nothing, so it covered whatever
 * sat at the bottom of the page — the AUTM-787 / -845 / -839 defect, on a
 * banner that appears UNANNOUNCED 12 seconds in, which is worse than the
 * consent notice: the page was usable and then quietly was not. It now uses
 * the shared reservation in `../lib/reserved-bottom-space`, so scrolling
 * content gets body padding and fixed page chrome gets a measured custom
 * property. Same mechanism, same naming convention, one implementation.
 *
 * LAYER. It sat at `z-[55]`, ABOVE the library's `Dialog` and `Sheet` at
 * `z-50` — the AUTM-1000 bug with the ordering inverted, and reachable by
 * nothing more than leaving a page open for twelve seconds with a dialog
 * open. It is now `z-30`: under the modal layer, and one step under
 * `ConsentBanner` at `z-40` as well, because consent is a legal gate and an
 * install nag is the least important thing on the page. That ladder is
 * content < install banner (30) < consent (40) < Dialog / Sheet (50) <
 * `GradientBar` (60) < `Toast` (100).
 *
 * The two banners are also separated GEOMETRICALLY, not just by z: this one
 * sits on top of the consent notice via `CONSENT_BANNER_OFFSET`, dropping to
 * the viewport edge whenever no consent banner is up. Without that they
 * overlap on a phone and the reservation would claim space for two banners
 * while one was buried under the other.
 *
 * PORTAL. `position: fixed` resolves against the nearest ancestor with a
 * transform, a filter, a `backdrop-filter` or containment — not the viewport
 * (AUTM-721). Rendering inline meant any consumer that mounted this inside a
 * glass or animated wrapper got a banner anchored to that wrapper. It
 * portals to `document.body`, which also puts it behind Radix's modal
 * `aria-hidden` as a sibling rather than beside it.
 */

/**
 * The CSS custom property the banner publishes its measured height on, set on
 * `<html>` while it is showing and removed the moment it is dismissed or
 * installed. Named to match `CONSENT_BANNER_HEIGHT_VAR`.
 */
export const PWA_INSTALL_BANNER_HEIGHT_VAR = '--pwa-install-banner-height'

/**
 * Ready-made value for a `position: fixed` element that must stay clear of
 * THIS banner: `style={{ bottom: PWA_INSTALL_BANNER_OFFSET }}`. Falls back to
 * `0px`, so the element sits at the viewport edge whenever the banner is down.
 *
 * Reach for `BOTTOM_CHROME_OFFSET` instead when the page cannot know which of
 * the library's bottom banners are up — clearing only one of two still leaves
 * the element buried.
 */
export const PWA_INSTALL_BANNER_OFFSET = `var(${PWA_INSTALL_BANNER_HEIGHT_VAR}, 0px)`

const DEFAULT_STORAGE_KEY = 'autara.pwa.dismissedAt'
const DEFAULT_DISMISS_TTL_MS = 30 * 24 * 3600 * 1000
const DEFAULT_FIRST_SHOW_DELAY_MS = 12_000

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface PWAInstallBannerProps {
    /** App name shown in the banner copy. */
    appName?: string
    /** Eyebrow above the headline. Defaults to "Add to home screen". */
    eyebrow?: string
    /** Headline. Defaults to `"${appName} on your home screen"`. */
    headline?: string
    /** Body copy (Chrome path). */
    body?: string
    /** Body copy (iOS Safari manual-instructions path). */
    iosBody?: React.ReactNode
    /** Install button label. */
    installLabel?: string
    /** Dismiss button label. */
    dismissLabel?: string
    /** localStorage key for the anti-nag flag. */
    storageKey?: string
    /** TTL after dismiss before the banner can resurface. */
    dismissTtlMs?: number
    /** Delay after first paint before the banner is shown. */
    firstShowDelayMs?: number
    /**
     * Accessible name for the landmark. Required in practice — `region` is
     * only exposed to a screen reader's landmark list when it is named, so an
     * unnamed one is not the fix, it is a different bug. Defaults to a name
     * built from `appName`.
     */
    label?: string
    /**
     * Pad `document.body` by the banner's height so page content that scrolls
     * is not covered. Turn off only if the app scrolls inside its own
     * container rather than the document — the CSS custom property is
     * published either way, because a `position: fixed` bar needs it
     * regardless.
     */
    reserveBodySpace?: boolean
    /**
     * Root `data-testid`; the controls take `-install`, `-dismiss` and
     * `-close`.
     */
    testId?: string
    className?: string
}

/* ── Inlined Solar Linear glyphs ────────────────────────────────────── */

const SmartphoneIcon = () => (
    <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        aria-hidden
    >
        <rect
            x="7"
            y="2"
            width="10"
            height="20"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.6"
        />
        <path
            d="M10 18h4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
        />
    </svg>
)

const ShareLinearGlyph = () => (
    <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        aria-hidden
        className="inline-block align-middle"
    >
        <path
            d="M12 3v12M8 7l4-4 4 4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
        />
    </svg>
)

export function PWAInstallBanner({
    appName = 'Autara',
    eyebrow = 'Add to home screen',
    headline,
    body = 'Quick access, no app store, works offline.',
    iosBody,
    installLabel = 'Install',
    dismissLabel = 'Not now',
    storageKey = DEFAULT_STORAGE_KEY,
    dismissTtlMs = DEFAULT_DISMISS_TTL_MS,
    firstShowDelayMs = DEFAULT_FIRST_SHOW_DELAY_MS,
    label,
    reserveBodySpace = true,
    testId = 'pwa-install-banner',
    className,
}: PWAInstallBannerProps) {
    const [visible, setVisible] = React.useState(false)
    const [deferred, setDeferred] =
        React.useState<BeforeInstallPromptEvent | null>(null)
    const [iosManual, setIosManual] = React.useState(false)

    /* Callback ref, not a ref object: the banner portals, so the element only
     * exists on a later render and an effect keyed on a ref would never re-run
     * to see it. */
    const [panel, setPanel] = React.useState<HTMLDivElement | null>(null)
    useReservedBottomSpace(
        panel,
        PWA_INSTALL_BANNER_HEIGHT_VAR,
        reserveBodySpace
    )

    const resolvedHeadline = headline ?? `${appName} on your home screen`
    const resolvedLabel = label ?? `Add ${appName} to your home screen`
    const resolvedIosBody = iosBody ?? (
        <>
            Tap <ShareLinearGlyph /> Share, then{' '}
            <strong>Add to Home Screen</strong>. Quick access, no app store.
        </>
    )

    React.useEffect(() => {
        if (typeof window === 'undefined') return

        /* Feature-detected, not assumed: jsdom has no `matchMedia`, so an
         * unguarded call throws inside the effect and takes down any consumer
         * unit test that happens to render a page containing this banner. */
        if (
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(display-mode: standalone)').matches
        ) {
            return
        }
        if (
            'standalone' in window.navigator &&
            (window.navigator as Navigator & { standalone?: boolean })
                .standalone
        ) {
            return
        }

        const raw = window.localStorage.getItem(storageKey)
        if (raw) {
            const t = Number.parseInt(raw, 10)
            if (Number.isFinite(t) && Date.now() - t < dismissTtlMs) return
        }

        const onBeforeInstall = (e: Event) => {
            e.preventDefault()
            setDeferred(e as BeforeInstallPromptEvent)
            window.setTimeout(() => setVisible(true), firstShowDelayMs)
        }
        window.addEventListener('beforeinstallprompt', onBeforeInstall)

        const ua = window.navigator.userAgent
        const isIos = /iPhone|iPad|iPod/i.test(ua)
        const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua)
        if (isIos && isSafari) {
            setIosManual(true)
            window.setTimeout(() => setVisible(true), firstShowDelayMs)
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstall)
        }
    }, [storageKey, dismissTtlMs, firstShowDelayMs])

    function dismiss() {
        setVisible(false)
        try {
            window.localStorage.setItem(storageKey, String(Date.now()))
        } catch {
            /* localStorage can throw in private mode; close visually. */
        }
    }

    async function install() {
        if (!deferred) return
        await deferred.prompt()
        await deferred.userChoice
        setDeferred(null)
        setVisible(false)
        try {
            window.localStorage.setItem(storageKey, String(Date.now()))
        } catch {
            /* ignore */
        }
    }

    /* SSR-safe portal: `document` does not exist on the server, and the banner
     * is client-only anyway (its anti-nag flag lives in browser storage). */
    if (!visible || typeof document === 'undefined') return null

    return createPortal(
        <div
            ref={setPanel}
            /* `region`, not `dialog` — see the note at the top of the file. */
            role="region"
            aria-label={resolvedLabel}
            data-testid={testId}
            className={cn(
                /* z-30 — under the Dialog/Sheet layer at z-50 AND under the
                 * consent notice at z-40. `bottom` comes from the style below,
                 * not from `bottom-0`, so this rides above a consent banner
                 * instead of under it. */
                'fixed inset-x-0 z-30 px-4 sm:px-6 lg:hidden',
                className
            )}
            style={{
                bottom: CONSENT_BANNER_OFFSET,
                /* Clears the iOS home indicator. Part of the measured height,
                 * so the reservation stays correct. */
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)',
            }}
        >
            <div className="mx-auto max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
                <div className="flex items-start gap-3">
                    <span
                        aria-hidden
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-tint)] text-[var(--accent)]"
                    >
                        <SmartphoneIcon />
                    </span>
                    <div className="flex-1 min-w-0">
                        {/* The copy is capped and scrolls, and this is a 200%
                            text-scale requirement rather than a nicety. The
                            close control sits at the TOP of this row, so a
                            banner that outgrows the viewport pushes its own
                            dismiss button off the top of the screen and the
                            nag becomes permanent for the session. Capping the
                            copy bounds the banner without ever moving a
                            control out of reach: every one of them sits
                            outside this scroller. Mirrors ConsentBanner's
                            `max-h-[40vh]`, measured there at 200% on a 390x760
                            viewport.

                            `tabIndex` because a scrollable region has to be
                            operable from the keyboard (WCAG 2.1.1). Chrome
                            makes overflow containers focusable on its own now;
                            Safari does not. */}
                        <div
                            tabIndex={0}
                            className="max-h-[40vh] overflow-y-auto overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
                        >
                            {/* `--accent` is the text/border grade of the
                                brand purple. `--color-autara-purple` resolves
                                through `--accent-fill`, which is #6d3dd4 in
                                dark and measures ~2.4:1 on `--surface` — the
                                eyebrow was set in it, at 80% alpha on top.
                                AUTM-1483: sentence case at 0.8125rem, weight
                                500, no letterspacing (it was 10px capitals
                                tracked to 0.22em). */}
                            <p className="text-[0.8125rem] font-medium text-[var(--accent)] mb-1.5">
                                {eyebrow}
                            </p>
                            {/* font-medium, not font-bold: Satoshi ships 400 /
                                500 / 700 and the house rule puts headings of
                                this grade at 500. */}
                            <h3 className="text-[0.9375rem] font-medium text-[var(--text-strong)] tracking-[-0.005em] leading-snug">
                                {resolvedHeadline}
                            </h3>
                            <p className="mt-1 text-[0.78125rem] text-[var(--text-muted)] leading-relaxed">
                                {iosManual ? resolvedIosBody : body}
                            </p>
                        </div>
                        {/* `flex-wrap`: at 200% text scale two 44px-tall
                            buttons do not fit across a 375px phone beside the
                            icon and close columns, and without wrapping the
                            second one is clipped rather than moved. */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            {!iosManual && deferred ? (
                                <button
                                    type="button"
                                    onClick={install}
                                    data-testid={`${testId}-install`}
                                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-autara-purple)] px-4 py-2 text-[0.78125rem] font-medium text-white transition-colors hover:brightness-110"
                                >
                                    {installLabel}
                                    <span
                                        aria-hidden
                                        className="text-[0.8125rem] leading-none"
                                    >
                                        ↗
                                    </span>
                                </button>
                            ) : null}
                            <button
                                type="button"
                                onClick={dismiss}
                                data-testid={`${testId}-dismiss`}
                                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-2 text-[0.78125rem] font-medium text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:border-[var(--accent-border-soft)] transition-colors"
                            >
                                {dismissLabel}
                            </button>
                        </div>
                    </div>
                    {/* AUTM-1756: the library's one close control, a filled
                        44px disc (48px to a finger). Its rem size grows with
                        the text scale, as the 44px floor here did. */}
                    <CloseButton
                        label="Dismiss"
                        onClick={dismiss}
                        data-testid={`${testId}-close`}
                    />
                </div>
            </div>
        </div>,
        document.body
    )
}

PWAInstallBanner.displayName = 'PWAInstallBanner'
