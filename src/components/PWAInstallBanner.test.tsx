import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type * as React from 'react'
import { render, screen, act, cleanup, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    PWAInstallBanner,
    PWA_INSTALL_BANNER_HEIGHT_VAR,
} from './PWAInstallBanner'
import { ConsentBanner, CONSENT_BANNER_HEIGHT_VAR } from './ConsentBanner'
import { Dialog, DialogContent, DialogTitle } from './Dialog'

/**
 * AUTM-1018 — guards for the four defects this banner carried, plus the a11y
 * items found sweeping it.
 *
 * Every assertion here was checked by REVERTING the behaviour it guards and
 * confirming the test goes red. A guard that passes against the broken
 * component is worse than no guard, because it makes the next person
 * confident. Which revert breaks which block is recorded on each one.
 *
 * TWO THINGS THIS ENVIRONMENT CANNOT DO, stated so nobody reads more into the
 * file than is there:
 *
 *   1. jsdom has no layout engine. `getBoundingClientRect` returns zeroes and
 *      every `offsetHeight` is 0, so a test that claims to MEASURE anything
 *      here would pass against any implementation. The class and attribute
 *      assertions below are the contract; `offsetHeight` is stubbed to a real
 *      measured number so the reservation assertions are about the value the
 *      component publishes, not about a truthy string. Real geometry — tap
 *      target sizes, the 200% text-scale reflow, whether the banner actually
 *      paints over a dialog — belongs in a consumer's Playwright suite, which
 *      has a browser.
 *
 *   2. jsdom has no stylesheet, so a computed `z-index` would be empty
 *      regardless. The Tailwind class IS the contract for the layer.
 */

const SRC = resolve(process.cwd(), 'src/components/PWAInstallBanner.tsx')

/** Heights the stubbed layout reports, by `data-testid`. Mutable so a reflow
 *  can be simulated. 140px is what the install banner measured on a 375x812
 *  phone; 298px is the consent banner's number from AUTM-787. */
let measured: Record<string, number> = {
    'pwa-install-banner': 140,
    'consent-banner': 298,
}

/**
 * Stub observers, so a test can deliver a reflow the way layout would.
 *
 * `observe()` is RECORDED rather than ignored, and `fireReflow` only calls
 * back the observers actually watching the node. This is not incidental: the
 * AUTM-852 pass first wrote a stub that captured the callback in its
 * constructor and fired it unconditionally, which left the reflow guard green
 * with `observer.observe(node)` deleted from the component. Keep `observe`
 * mattering.
 */
interface StubObserver {
    cb: ResizeObserverCallback
    targets: Set<Element>
}
let observers: StubObserver[] = []

function fireReflow(target: Element) {
    act(() => {
        observers
            .filter((o) => o.targets.has(target))
            .forEach((o) =>
                o.cb([] as unknown as ResizeObserverEntry[], {} as ResizeObserver)
            )
    })
}

const originalOffsetHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetHeight'
)

beforeEach(() => {
    /* The banner is gated behind a `setTimeout`, so every test drives the
     * clock rather than waiting on it. */
    vi.useFakeTimers()
    measured = { 'pwa-install-banner': 140, 'consent-banner': 298 }
    observers = []
    window.localStorage.clear()

    /* jsdom does not implement matchMedia at all. A browser does, and answers
     * `false` for a tab that is not running as an installed PWA, which is the
     * case every one of these tests is about. */
    vi.stubGlobal(
        'matchMedia',
        (query: string) =>
            ({
                matches: false,
                media: query,
                addEventListener() {},
                removeEventListener() {},
            }) as unknown as MediaQueryList
    )

    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        get() {
            const id = this.getAttribute('data-testid')
            return (id && measured[id]) || 0
        },
    })

    vi.stubGlobal(
        'ResizeObserver',
        class {
            private entry: StubObserver
            constructor(cb: ResizeObserverCallback) {
                this.entry = { cb, targets: new Set() }
                observers.push(this.entry)
            }
            observe(target: Element) {
                this.entry.targets.add(target)
            }
            unobserve(target: Element) {
                this.entry.targets.delete(target)
            }
            disconnect() {
                this.entry.targets.clear()
            }
        }
    )
})

afterEach(() => {
    /* Unmount BEFORE resetting the globals below. Vitest runs afterEach hooks
     * in reverse registration order, so RTL's auto-cleanup would otherwise fire
     * after this block and let a hook's restore-on-unmount land on an
     * already-reset body — which leaks a padding into the next test and reads
     * as a bug in the component. */
    cleanup()
    vi.useRealTimers()
    if (originalOffsetHeight) {
        Object.defineProperty(
            HTMLElement.prototype,
            'offsetHeight',
            originalOffsetHeight
        )
    }
    vi.unstubAllGlobals()
    document.documentElement.style.removeProperty(PWA_INSTALL_BANNER_HEIGHT_VAR)
    document.documentElement.style.removeProperty(CONSENT_BANNER_HEIGHT_VAR)
    document.body.style.paddingBottom = ''
})

/**
 * Drive the component past its anti-nag gate the way Chrome does.
 *
 * The banner is invisible until `beforeinstallprompt` fires AND the first-show
 * delay elapses, so every test needs this. `firstShowDelayMs: 0` still goes
 * through a `setTimeout`, hence the timer flush.
 */
function show(props: Partial<React.ComponentProps<typeof PWAInstallBanner>> = {}) {
    const utils = render(<PWAInstallBanner firstShowDelayMs={0} {...props} />)
    fireInstallPrompt()
    return utils
}

function fireInstallPrompt() {
    act(() => {
        const evt = new Event('beforeinstallprompt') as Event & {
            prompt: () => Promise<void>
            userChoice: Promise<{ outcome: string }>
        }
        evt.prompt = async () => {}
        evt.userChoice = Promise.resolve({ outcome: 'dismissed' })
        window.dispatchEvent(evt)
    })
    act(() => {
        vi.advanceTimersByTime(1)
    })
}

function publishedHeight(v = PWA_INSTALL_BANNER_HEIGHT_VAR) {
    return document.documentElement.style.getPropertyValue(v)
}

/** Comments stripped, for the source scans below. See the note on the scan
 *  block for why this is load-bearing rather than tidiness. */
function sourceWithoutComments() {
    return readFileSync(SRC, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|\s)\/\/.*$/gm, '$1')
}

/**
 * The headline defect. `role="dialog"` on a banner that never moves focus,
 * never traps it, has no Escape handler and restores nothing is a promise the
 * component does not keep — and it makes `getByRole("dialog")` ambiguous on
 * exactly the page where the overlap bugs live.
 *
 * Goes red if the root's role is changed back to "dialog" — confirmed: 4
 * failures, three for the landmark being absent under any name and one for the
 * dialog count.
 */
describe('it is a named landmark, not a dialog', () => {
    it('exposes a region with an accessible name built from the app name', () => {
        show({ appName: 'Autara' })
        expect(
            screen.getByRole('region', {
                name: 'Add Autara to your home screen',
            })
        ).toBeInTheDocument()
    })

    it('takes a custom label', () => {
        show({ label: 'Install this app' })
        expect(
            screen.getByRole('region', { name: 'Install this app' })
        ).toBeInTheDocument()
    })

    it('claims no dialog role', () => {
        show()
        expect(screen.queryByRole('dialog')).toBeNull()
        expect(screen.queryByRole('alertdialog')).toBeNull()
    })

    /**
     * The state that hid the sibling defect: a real modal on screen with the
     * banner up. `getByRole` throws on more than one match, so this asserts
     * the ambiguity is gone rather than asserting a count.
     */
    it('leaves getByRole("dialog") unambiguous with a real Dialog open', () => {
        render(
            <Dialog open>
                <DialogContent>
                    <DialogTitle>Verify your phone</DialogTitle>
                </DialogContent>
            </Dialog>
        )
        show()

        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAccessibleName('Verify your phone')
        expect(dialog).not.toBe(screen.getByTestId('pwa-install-banner'))
    })

    it('the dismiss controls are real buttons, reachable by keyboard', async () => {
        show()
        /* Hand the clock back before driving the keyboard. user-event's own
         * scheduling deadlocks against vi's fake timers here even with
         * `advanceTimers` wired, and the banner is already on screen by this
         * point so nothing further needs the fake clock. */
        vi.useRealTimers()
        const user = userEvent.setup()

        const close = screen.getByRole('button', { name: 'Dismiss' })
        close.focus()
        expect(document.activeElement).toBe(close)
        await user.keyboard('{Enter}')

        expect(screen.queryByTestId('pwa-install-banner')).toBeNull()
    })
})

/**
 * The half of the reservation that answers a `position: fixed` action bar.
 * Body padding does nothing for one of those, so the measurement itself has to
 * be readable from CSS.
 *
 * Goes red if `root.style.setProperty(heightVar, ...)` is removed from
 * `apply()` in `../lib/reserved-bottom-space` — confirmed: 4 failures.
 */
describe('it publishes its measured height for fixed page chrome', () => {
    it('sets the custom property on <html> while it is showing', () => {
        show()
        expect(publishedHeight()).toBe('140px')
    })

    it('re-measures when the banner reflows', () => {
        show()
        expect(publishedHeight()).toBe('140px')

        // Narrower viewport wraps the copy and the banner grows. This is the
        // case a hardcoded height gets wrong.
        measured['pwa-install-banner'] = 212
        fireReflow(screen.getByTestId('pwa-install-banner'))
        expect(publishedHeight()).toBe('212px')
    })

    /**
     * Belt and braces on top of the observer, and it earns its place twice
     * here: ResizeObserver delivers on the frame loop so a throttled rAF can
     * leave the value stale, AND this banner is `lg:hidden`, so crossing the
     * breakpoint stops it being rendered at all — a non-rendered element is
     * skipped by ResizeObserver, and `resize` is what zeroes the reservation.
     *
     * Goes red if `window.addEventListener('resize', apply)` is removed —
     * confirmed: 1 failure, and only this one. Deleting `observer.observe(node)`
     * instead fails only the reflow test above, so the two paths are covered
     * independently rather than one masking the other.
     */
    it('re-measures on a window resize even if no observer fires', () => {
        show()
        observers = []

        measured['pwa-install-banner'] = 0 // crossed the lg breakpoint
        act(() => {
            window.dispatchEvent(new Event('resize'))
        })
        expect(publishedHeight()).toBe('0px')
    })
})

/**
 * The half that answers content which scrolls. The page must become taller
 * than the viewport so a covered control can be scrolled clear.
 *
 * Goes red if `body.style.paddingBottom` is dropped from `syncBodyPadding` —
 * confirmed: 4 failures across this block and the coexistence block below.
 */
describe('it reserves space in the document for content that scrolls', () => {
    it('pads the body by the banner height', () => {
        show()
        expect(document.body.style.paddingBottom).toBe('140px')
    })

    it('leaves the body alone when the app scrolls its own container', () => {
        show({ reserveBodySpace: false })
        expect(document.body.style.paddingBottom).toBe('')
        // Published either way — a fixed bar still needs it.
        expect(publishedHeight()).toBe('140px')
    })

    it('gives the property and the padding back when it is dismissed', () => {
        show()
        expect(publishedHeight()).toBe('140px')

        fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

        expect(publishedHeight()).toBe('')
        expect(document.body.style.paddingBottom).toBe('')
    })

    it('restores padding the app had already set, rather than blanking it', () => {
        document.body.style.paddingBottom = '80px'
        show()
        // The reservation REPLACES the page's padding while it is up and hands
        // the original back afterwards — it does not add to it. Same semantics
        // ConsentBanner shipped with, and the two must not disagree.
        expect(document.body.style.paddingBottom).toBe('140px')

        fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
        expect(document.body.style.paddingBottom).toBe('80px')
    })
})

/**
 * Why the reservation is a shared hook and not a second copy of the
 * ConsentBanner effect. `body.style.paddingBottom` is ONE slot and both
 * banners can be up at once — the consent notice shows on first paint, this
 * one surfaces 12 seconds later, so a first-time mobile visitor who has not
 * answered consent sees both.
 *
 * Goes red if `useReservedBottomSpace` is replaced by a per-component effect
 * that owns `body.style.paddingBottom` outright — confirmed by inlining the
 * pre-AUTM-1018 version back into this component: 2 failures, one for the sum
 * and one for the unmount order, and NOTHING else in the suite noticed.
 */
describe('it shares the reservation with the consent banner', () => {
    function BothBanners({ consent }: { consent: boolean }) {
        return (
            <>
                <ConsentBanner open={consent} onAccept={() => {}} onDecline={() => {}}>
                    We use cookies.
                </ConsentBanner>
                <PWAInstallBanner firstShowDelayMs={0} />
            </>
        )
    }

    it('reserves the sum of both banners, not whichever mounted last', () => {
        render(<BothBanners consent />)
        fireInstallPrompt()

        expect(publishedHeight(CONSENT_BANNER_HEIGHT_VAR)).toBe('298px')
        expect(publishedHeight()).toBe('140px')
        expect(document.body.style.paddingBottom).toBe('438px')
    })

    it('keeps this banner reserved when consent is answered first', () => {
        const { rerender } = render(<BothBanners consent />)
        fireInstallPrompt()
        expect(document.body.style.paddingBottom).toBe('438px')

        // Accept the cookie notice. The install banner is still on screen, so
        // its space must survive — the per-component version handed back the
        // consent banner's captured value here and deleted this one's.
        rerender(<BothBanners consent={false} />)
        expect(publishedHeight(CONSENT_BANNER_HEIGHT_VAR)).toBe('')
        expect(document.body.style.paddingBottom).toBe('140px')

        fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
        expect(document.body.style.paddingBottom).toBe('')
    })
})

/**
 * The layer. It shipped at `z-[55]`, ABOVE the Dialog and Sheet overlays at
 * `z-50`, so a dialog opened while the banner was up got painted over.
 *
 * Goes red if `z-30` becomes `z-[55]` — confirmed: 2 failures. Returning the
 * markup inline instead of through `createPortal` fails the portal test, and
 * only that one. Replacing the `bottom` style with `bottom-0` fails the
 * stacking test, and only that one.
 */
describe('it sits under the modal layer and under the consent banner', () => {
    it('carries z-30 — below Dialog/Sheet at z-50 and ConsentBanner at z-40', () => {
        show()
        const banner = screen.getByTestId('pwa-install-banner')
        expect(banner.className).toContain('z-30')
        expect(banner.className).not.toMatch(/z-\[?5[05]\]?/)
        expect(banner.className).not.toContain('z-40')
    })

    it('stacks above a consent banner instead of overlapping it', () => {
        show()
        // Falls back to 0px, so it sits at the viewport edge with no consent
        // banner up — which is every page load after the visitor has answered.
        expect(screen.getByTestId('pwa-install-banner').style.bottom).toBe(
            'var(--consent-banner-height, 0px)'
        )
    })

    it('portals to document.body so a filtered ancestor cannot capture it', () => {
        render(
            <div style={{ backdropFilter: 'blur(20px)' }}>
                <PWAInstallBanner firstShowDelayMs={0} />
            </div>
        )
        fireInstallPrompt()
        // A `backdrop-filter` ancestor becomes the containing block for a
        // fixed descendant (AUTM-721). Being a direct child of body is what
        // keeps the banner anchored to the viewport.
        expect(screen.getByTestId('pwa-install-banner').parentElement).toBe(
            document.body
        )
    })
})

/**
 * 200% text scale, and the trap that is specific to THIS banner rather than
 * inherited from the consent one: its only dismiss controls sit at the TOP of
 * the panel, so a banner that outgrows the viewport pushes its own close
 * button off the top of the screen and the nag becomes permanent for the
 * session.
 *
 * Goes red if `max-h-[40vh] overflow-y-auto` is dropped from the copy
 * container — confirmed: 1 failure. Removing `tabIndex` fails both tests here,
 * because the scroller is located BY that attribute.
 */
describe('it stays bounded when the text scales', () => {
    function scroller() {
        return screen
            .getByTestId('pwa-install-banner')
            .querySelector('[tabindex]') as HTMLElement
    }

    it('caps the copy and lets it scroll, so the banner cannot outgrow the viewport', () => {
        show()
        expect(scroller()).not.toBeNull()
        expect(scroller().className).toContain('max-h-[40vh]')
        expect(scroller().className).toContain('overflow-y-auto')
    })

    it('the scroller is keyboard operable, and every control sits outside it', () => {
        show()
        expect(scroller().tabIndex).toBe(0)
        for (const name of ['Install', 'Not now', 'Dismiss']) {
            expect(
                scroller().contains(screen.getByRole('button', { name }))
            ).toBe(false)
        }
    })
})

/**
 * The 44px floor. `min-h`/`min-w` rather than fixed heights, so 200% text
 * scale grows the control instead of clipping it — the same shape as the
 * AUTM-622 pass on Tabs.
 *
 * These assert CLASSES. jsdom cannot measure a tap target, and a test named
 * "tap targets" that cannot measure one is exactly the guard that reads as
 * proof and is not.
 *
 * Goes red if the controls go back to `h-9` / `h-8 w-8` — confirmed: 2
 * failures.
 */
describe('every control clears 44px', () => {
    it('install, dismiss and close all carry the floor', () => {
        show()
        expect(screen.getByTestId('pwa-install-banner-install').className).toContain('min-h-11')
        expect(screen.getByTestId('pwa-install-banner-dismiss').className).toContain('min-h-11')

        // AUTM-1756: the library's CloseButton, a 2.75rem disc (rem, so it
        // grows with the text scale), 48px to a finger.
        const close = screen.getByTestId('pwa-install-banner-close')
        expect(close.className).toContain('size-11')
        expect(close.className).toContain('pointer-coarse:size-12')
    })

    it('uses MINIMUMS, so scaled text grows the control instead of clipping', () => {
        show()
        for (const id of ['install', 'dismiss', 'close']) {
            const el = screen.getByTestId(`pwa-install-banner-${id}`)
            expect(el.className).not.toMatch(/(^|\s)h-\d+(\s|$)/)
        }
        expect(
            screen.getByTestId('pwa-install-banner-close').className
        ).not.toMatch(/(^|\s)w-\d+(\s|$)/)
    })
})

/**
 * Source scans, for rules that are about what is NOT in the file.
 *
 * COMMENTS ARE STRIPPED FIRST, and that is load-bearing rather than tidiness.
 * The doc comment explains the weight fix in the words "font-medium, not
 * font-bold", so a scan of the raw file matches its own explanation. Measured
 * both ways rather than assumed, because the interesting direction is not the
 * obvious one:
 *
 *   - Raw scan, CORRECT component: the weights test fails on the comment. A
 *     false RED, which is the direction this file actually produces.
 *   - Raw scan, REVERTED component (eyebrow put back to the fill-grade
 *     purple): still red. No comment in this file happens to spell a class
 *     string, so nothing here is masked today.
 *
 * The false GREEN is the one that cost something in this repo (AUTM-936), and
 * it is one careless sentence away — which is why the stripper's own behaviour
 * is asserted below rather than trusted.
 *
 * Goes red if any `text-[Npx]` is restored — confirmed by putting
 * `text-[15px]` back on the headline: 1 failure. Restoring `font-bold` there
 * fails the weights test, and only that one.
 */
describe('it obeys the type rules the library is judged on', () => {
    it('the comment stripper removes comments and keeps code', () => {
        const raw = readFileSync(SRC, 'utf8')
        const stripped = sourceWithoutComments()
        // Only ever written in a comment.
        expect(raw).toContain('AUTM-1018')
        expect(stripped).not.toContain('AUTM-1018')
        // And it did not eat the file, which would make the scans below
        // vacuously true.
        expect(stripped).toContain('export function PWAInstallBanner')
        expect(stripped).toContain('min-h-11')
    })

    it('pins no text size in px, so everything scales to 200%', () => {
        expect(sourceWithoutComments()).not.toMatch(/text-\[[\d.]+px\]/)
    })

    it('uses Satoshi 400/500/700 only', () => {
        expect(sourceWithoutComments()).not.toMatch(
            /font-(?:thin|extralight|light|semibold|bold|extrabold|black)\b/
        )
    })

    /**
     * `--color-autara-purple` resolves through `--accent-fill`, which is
     * #6d3dd4 in dark and measures ~2.4:1 on `--surface`. Text and border
     * grade purple is `--accent`. The eyebrow was set in the fill grade, at
     * 80% alpha on top of that.
     *
     * Goes red if `text-[var(--accent)]` on the eyebrow reverts to
     * `text-[var(--color-autara-purple)]/80` — confirmed: 1 failure.
     */
    it('never paints text or a border in the fill-grade purple', () => {
        const src = sourceWithoutComments()
        expect(src).not.toMatch(/text-\[var\(--color-autara-purple\)/)
        expect(src).not.toMatch(/border-\[var\(--color-autara-purple\)/)
        // The solid fill on the install button is the correct use of it.
        expect(src).toContain('bg-[var(--color-autara-purple)]')
    })
})

/**
 * AUTM-1483. The eyebrow was 10px capitals tracked to 0.22em, the device the
 * house rules retired (Don, 2026-09-03: "uppercase titles feel like AI
 * slop"). `text-transform` inherits, so the whole ancestor chain is checked,
 * not just the element that holds the words.
 *
 * Goes red if `uppercase` or a positive tracking class returns to the eyebrow
 * or to any wrapper above it, or if the eyebrow leaves the 0.8125rem / 500
 * eyebrow scale.
 */
describe('AUTM-1483: the eyebrow is sentence case', () => {
    it('renders "Add to home screen" as written, on the eyebrow scale', () => {
        show()
        const eyebrow = screen.getByText('Add to home screen')
        expect(eyebrow.className).toContain('text-[0.8125rem]')
        expect(eyebrow.className).toContain('font-medium')
        for (let node: HTMLElement | null = eyebrow; node; node = node.parentElement) {
            const cls = typeof node.className === 'string' ? node.className : ''
            expect(cls).not.toMatch(/\buppercase\b/)
            expect(cls).not.toMatch(/\btracking-(?:wide|wider|widest)\b|\btracking-\[(?!-)[^\]]+\]/)
        }
    })
})
