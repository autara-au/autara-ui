import { useCallback, useState, useSyncExternalStore } from 'react'

/**
 * AUTM-1906: installing a web app, for every Autara surface that offers it.
 *
 * Promoted from autara-customer-web's `src/lib/installPrompt.ts` (AUTM-1781
 * decision 4) when the merchant portal needed the same thing, so there is one
 * copy rather than two drifting ones.
 *
 * WHY A MODULE-LEVEL STORE. Chrome and Edge fire `beforeinstallprompt` once per
 * page load, often before the screen that offers the install has mounted (the
 * portal's Today waits on a Cognito read first). A listener added by that
 * screen misses it, which is what `PWAInstallBanner` does. So the app root
 * calls `catchInstallPrompt()` once, and any screen reads the caught event
 * through `useInstallPrompt()` / `useInstallOffer()`.
 *
 * WHY NOT EVERY BROWSER HAS A BUTTON. Only Chromium fires the event. Safari on
 * an iPhone or iPad installs from Share, then Add to Home Screen, and nothing
 * can open that for the person, so the offer explains it instead. iPadOS
 * Safari reports a Mac user agent by default; `installPlatform` tells it
 * apart by touch points, which `PWAInstallBanner`'s check does not.
 *
 * No service worker is involved: Chrome dropped the fetch handler from its
 * install criteria (Android 108, desktop 112), and an offer must never be a
 * reason to cache a bundle.
 */

type InstallEvent = Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** What came of asking the browser to install. */
export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable'

/**
 * Where the person would install from, which decides the words that explain
 * it (`InstallSteps`).
 *
 *   - `apple-mobile` an iPhone or iPad, any browser (all of them install from
 *                    Share since iOS 16.4)
 *   - `mac-safari`   Safari on a Mac: File, then Add to Dock (Safari 17+)
 *   - `android`      a browser on Android
 *   - `desktop`      Chrome, Edge or another Chromium browser on a computer
 *   - `other`        anything else (Firefox on a computer, mostly)
 */
export type InstallPlatform = 'apple-mobile' | 'mac-safari' | 'android' | 'desktop' | 'other'

let stashed: InstallEvent | null = null
let installedNow = false
let attached = 0
let version = 0
const listeners = new Set<() => void>()

function notify() {
    version += 1
    listeners.forEach((l) => l())
}

function onPrompt(e: Event) {
    /* Keeps Chrome on Android from showing its own mini-infobar on arrival;
     * the surface decides when to offer. The browser menu's Install stays. */
    e.preventDefault()
    stashed = e as InstallEvent
    notify()
}

function onInstalled() {
    stashed = null
    installedNow = true
    notify()
}

/**
 * Starts listening for the browser's install event. Call once, at the app's
 * root, as early as possible. Safe to call more than once: the listeners are
 * shared and counted. Returns the cleanup for an effect.
 */
export function catchInstallPrompt(): () => void {
    if (typeof window === 'undefined') return () => {}
    if (attached === 0) {
        window.addEventListener('beforeinstallprompt', onPrompt)
        window.addEventListener('appinstalled', onInstalled)
    }
    attached += 1
    let released = false
    return () => {
        if (released) return
        released = true
        attached -= 1
        if (attached === 0) {
            window.removeEventListener('beforeinstallprompt', onPrompt)
            window.removeEventListener('appinstalled', onInstalled)
        }
    }
}

export function subscribeInstallPrompt(cb: () => void): () => void {
    listeners.add(cb)
    return () => {
        listeners.delete(cb)
    }
}

/** The browser has an install dialog ready to open (Chromium only). */
export function canPromptInstall(): boolean {
    return stashed !== null
}

/**
 * Opens the browser's own install dialog. The event can be used once, so the
 * button that called this should go away whatever the answer.
 */
export async function promptInstall(): Promise<InstallOutcome> {
    const e = stashed
    if (!e) return 'unavailable'
    stashed = null
    notify()
    try {
        await e.prompt()
    } catch {
        return 'unavailable'
    }
    const choice = await e.userChoice.catch(() => ({ outcome: 'dismissed' as const }))
    return choice.outcome === 'accepted' ? 'accepted' : 'dismissed'
}

/**
 * Already opened as the installed app: from the home screen, the Dock or its
 * own window. `display-mode: standalone` covers Chromium and Safari 17+;
 * `navigator.standalone` covers older iOS. Fullscreen is not counted, because
 * a browser tab in fullscreen matches it too.
 */
export function runningInstalled(): boolean {
    if (typeof window === 'undefined') return false
    const nav = window.navigator as Navigator & { standalone?: boolean }
    if (nav.standalone === true) return true
    if (typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(display-mode: standalone)').matches
}

/** Installed in this page's lifetime (`appinstalled`), from the offer or the browser's own menu. */
export function installedThisSession(): boolean {
    return installedNow
}

/**
 * Which way this browser installs. Reads the user agent, so it is a best
 * guess; a wrong guess only means the less specific instructions.
 */
export function installPlatform(nav?: Pick<Navigator, 'userAgent' | 'maxTouchPoints'>): InstallPlatform {
    const n = nav ?? (typeof navigator === 'undefined' ? undefined : navigator)
    if (!n) return 'other'
    const ua = n.userAgent
    /* iPadOS 13+ Safari asks for the desktop site by default and says
     * "Macintosh"; a Mac has no touch points, an iPad has five. */
    if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && (n.maxTouchPoints ?? 0) > 1)) {
        return 'apple-mobile'
    }
    if (/Android/.test(ua)) return 'android'
    if (/Firefox\//.test(ua)) return 'other'
    if (/Chrome\/|Chromium\/|Edg\//.test(ua)) return 'desktop'
    if (/Macintosh/.test(ua) && /Safari\//.test(ua)) return 'mac-safari'
    return 'other'
}

export interface InstallPromptState {
    /** The browser's install dialog is ready (`promptInstall` will open it). */
    canPrompt: boolean
    /** Running as the installed app, or installed during this page's lifetime. */
    installed: boolean
    platform: InstallPlatform
    prompt: () => Promise<InstallOutcome>
}

function versionSnapshot() {
    return version
}

function serverSnapshot() {
    return 0
}

/** The install state, re-rendering when the browser's event arrives or is used. */
export function useInstallPrompt(): InstallPromptState {
    useSyncExternalStore(subscribeInstallPrompt, versionSnapshot, serverSnapshot)
    return {
        canPrompt: stashed !== null,
        installed: installedNow || runningInstalled(),
        platform: installPlatform(),
        prompt: promptInstall,
    }
}

export interface InstallOfferOptions {
    /**
     * Where the answer is remembered (`localStorage`). Once the person has
     * pressed Install or Not now, this browser never offers again.
     */
    storageKey: string
    /** The surface's own conditions (signed in, the right screen). Default true. */
    enabled?: boolean
}

export interface InstallOfferState {
    /**
     * Which offer to draw, or null for none: `prompt` when the browser can
     * install in one tap, `apple-mobile` to explain Share, then Add to Home
     * Screen. Null when installed, already answered, not enabled, or this
     * browser has nothing to offer yet.
     */
    path: 'prompt' | 'apple-mobile' | null
    /** Opens the browser's install dialog and remembers the answer. */
    install: () => Promise<InstallOutcome>
    /** Not now. Remembered. */
    dismiss: () => void
}

function readAnswered(key: string): boolean {
    try {
        return window.localStorage.getItem(key) !== null
    } catch {
        /* No storage (private mode, blocked): never offer, rather than offer
         * on every visit with no way to remember the answer. */
        return true
    }
}

/**
 * The one-time offer's behaviour: shown while there is something to offer and
 * the person has not answered, gone for good once they have. The surface
 * decides WHERE (its `enabled`); this decides WHETHER.
 */
export function useInstallOffer({ storageKey, enabled = true }: InstallOfferOptions): InstallOfferState {
    const { canPrompt, installed, platform } = useInstallPrompt()
    const [answered, setAnswered] = useState(() => (typeof window === 'undefined' ? true : readAnswered(storageKey)))

    const remember = useCallback(() => {
        setAnswered(true)
        try {
            window.localStorage.setItem(storageKey, String(Date.now()))
        } catch {
            /* Closed for this visit either way. */
        }
    }, [storageKey])

    const install = useCallback(async () => {
        const outcome = await promptInstall()
        if (outcome !== 'unavailable') remember()
        return outcome
    }, [remember])

    const path =
        !enabled || installed || answered
            ? null
            : canPrompt
              ? 'prompt'
              : platform === 'apple-mobile'
                ? 'apple-mobile'
                : null

    return { path, install, dismiss: remember }
}

/** Test seam: forget the caught event and the installed flag. Not exported from the package. */
export function resetInstallPromptForTests() {
    stashed = null
    installedNow = false
    notify()
}
