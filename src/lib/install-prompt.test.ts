import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    canPromptInstall,
    catchInstallPrompt,
    installPlatform,
    promptInstall,
    resetInstallPromptForTests,
    runningInstalled,
    useInstallOffer,
    useInstallPrompt,
} from './install-prompt'

/* AUTM-1906 — the shared install store. */

const UA = {
    ipadSafari:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
    iphoneSafari:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    iphoneChrome:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1',
    macSafari:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
    macChrome:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    windowsEdge:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
    androidChrome:
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
    firefoxMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.0; rv:131.0) Gecko/20100101 Firefox/131.0',
}

function fireInstallPrompt(outcome: 'accepted' | 'dismissed' = 'accepted') {
    const evt = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
        prompt: () => Promise<void>
        userChoice: Promise<{ outcome: string }>
    }
    const prompt = vi.fn(async () => {})
    evt.prompt = prompt
    evt.userChoice = Promise.resolve({ outcome })
    act(() => {
        window.dispatchEvent(evt)
    })
    return { evt, prompt }
}

function setUserAgent(ua: string, maxTouchPoints = 0) {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(ua)
    Object.defineProperty(window.navigator, 'maxTouchPoints', { configurable: true, get: () => maxTouchPoints })
}

function setStandalone(matches: boolean) {
    window.matchMedia = vi.fn((query: string) => ({
        matches: query === '(display-mode: standalone)' ? matches : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia
}

let release: () => void = () => {}

beforeEach(() => {
    localStorage.clear()
    setStandalone(false)
    setUserAgent(UA.macChrome)
    release = catchInstallPrompt()
})

afterEach(() => {
    release()
    act(() => resetInstallPromptForTests())
    vi.restoreAllMocks()
})

describe('installPlatform', () => {
    it.each([
        ['iPad Safari, which asks for the desktop site', UA.ipadSafari, 5, 'apple-mobile'],
        ['iPhone Safari', UA.iphoneSafari, 5, 'apple-mobile'],
        ['Chrome on an iPhone (installs from Share since iOS 16.4)', UA.iphoneChrome, 5, 'apple-mobile'],
        ['Safari on a Mac', UA.macSafari, 0, 'mac-safari'],
        ['Chrome on a Mac', UA.macChrome, 0, 'desktop'],
        ['Edge on Windows', UA.windowsEdge, 0, 'desktop'],
        ['Chrome on Android', UA.androidChrome, 5, 'android'],
        ['Firefox on a Mac', UA.firefoxMac, 0, 'other'],
    ])('%s', (_name, userAgent, maxTouchPoints, expected) => {
        expect(installPlatform({ userAgent, maxTouchPoints })).toBe(expected)
    })
})

describe('the caught event', () => {
    it('is caught before any screen mounts, and suppresses the mini-infobar', () => {
        const { evt } = fireInstallPrompt()
        expect(evt.defaultPrevented).toBe(true)
        expect(canPromptInstall()).toBe(true)
    })

    it('opens the browser dialog once and reports the answer', async () => {
        const { prompt } = fireInstallPrompt('accepted')
        await expect(promptInstall()).resolves.toBe('accepted')
        expect(prompt).toHaveBeenCalledTimes(1)
        expect(canPromptInstall()).toBe(false)
        await expect(promptInstall()).resolves.toBe('unavailable')
    })

    it('is shared by every caller and released by the last', () => {
        const second = catchInstallPrompt()
        release()
        fireInstallPrompt()
        expect(canPromptInstall()).toBe(true)
        second()
    })

    it('appinstalled marks it installed and drops the event', () => {
        fireInstallPrompt()
        const { result } = renderHook(() => useInstallPrompt())
        expect(result.current.installed).toBe(false)
        act(() => {
            window.dispatchEvent(new Event('appinstalled'))
        })
        expect(result.current.installed).toBe(true)
        expect(result.current.canPrompt).toBe(false)
    })
})

describe('runningInstalled', () => {
    it('is true in display-mode standalone', () => {
        setStandalone(true)
        expect(runningInstalled()).toBe(true)
    })

    it('is true on an iPhone home screen app (navigator.standalone)', () => {
        Object.defineProperty(window.navigator, 'standalone', { configurable: true, value: true })
        expect(runningInstalled()).toBe(true)
        Object.defineProperty(window.navigator, 'standalone', { configurable: true, value: undefined })
    })

    it('is false in a browser tab', () => {
        expect(runningInstalled()).toBe(false)
    })
})

describe('useInstallOffer', () => {
    const KEY = 'test.installOffer'

    it('offers nothing on a desktop browser until the event arrives, then the one-tap path', () => {
        const { result } = renderHook(() => useInstallOffer({ storageKey: KEY }))
        expect(result.current.path).toBeNull()
        fireInstallPrompt()
        expect(result.current.path).toBe('prompt')
    })

    it('explains Share on an iPad, which never fires the event', () => {
        setUserAgent(UA.ipadSafari, 5)
        const { result } = renderHook(() => useInstallOffer({ storageKey: KEY }))
        expect(result.current.path).toBe('apple-mobile')
    })

    it('never offers when running installed', () => {
        setUserAgent(UA.ipadSafari, 5)
        setStandalone(true)
        const { result } = renderHook(() => useInstallOffer({ storageKey: KEY }))
        expect(result.current.path).toBeNull()
    })

    it('waits for the surface (enabled)', () => {
        setUserAgent(UA.ipadSafari, 5)
        const { result, rerender } = renderHook(({ enabled }) => useInstallOffer({ storageKey: KEY, enabled }), {
            initialProps: { enabled: false },
        })
        expect(result.current.path).toBeNull()
        rerender({ enabled: true })
        expect(result.current.path).toBe('apple-mobile')
    })

    it('remembers Not now, so the next visit offers nothing', () => {
        setUserAgent(UA.ipadSafari, 5)
        const first = renderHook(() => useInstallOffer({ storageKey: KEY }))
        act(() => first.result.current.dismiss())
        expect(first.result.current.path).toBeNull()
        expect(localStorage.getItem(KEY)).not.toBeNull()
        first.unmount()
        const next = renderHook(() => useInstallOffer({ storageKey: KEY }))
        expect(next.result.current.path).toBeNull()
    })

    it('remembers the answer to the browser dialog either way', async () => {
        fireInstallPrompt('dismissed')
        const { result } = renderHook(() => useInstallOffer({ storageKey: KEY }))
        let outcome: string | undefined
        await act(async () => {
            outcome = await result.current.install()
        })
        expect(outcome).toBe('dismissed')
        expect(result.current.path).toBeNull()
        expect(localStorage.getItem(KEY)).not.toBeNull()
    })

    it('does not offer without storage to remember the answer in', () => {
        setUserAgent(UA.ipadSafari, 5)
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('blocked')
        })
        const { result } = renderHook(() => useInstallOffer({ storageKey: KEY }))
        expect(result.current.path).toBeNull()
    })
})
