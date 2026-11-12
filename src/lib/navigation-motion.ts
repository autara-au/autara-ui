/**
 * The direction of the next screen change, for `.motion-screen`
 * (utilities/animations.css, AUTM-1781).
 *
 * autara-ui never imports a router, so this marks the document instead:
 * call `markNavigation('push')` in the click handler of a link that opens a
 * screen over the current one, `'back'` for the control that returns, and
 * `'tab'` for a tab bar. The router then changes the page, the new screen's
 * `.motion-screen` element mounts under `html[data-nav]` and plays the
 * matching entrance, and the mark is cleared once it has had time to play,
 * so nothing re-animates on a later re-render.
 *
 * `listenForBackNavigation()` marks the browser's own Back and Forward as
 * `back` (a history step is a return, whichever button made it). Install it
 * once, in a client effect, and call the function it returns to remove it.
 *
 * Under `prefers-reduced-motion: reduce` the stylesheet ignores the mark; it
 * is still set, which costs nothing.
 */

export type NavigationDirection = 'push' | 'back' | 'tab'

/**
 * Long enough for the screen's slide (`--motion-tab`, 450ms) plus a route
 * that takes a moment to render; short enough that a screen rendered well
 * after the navigation does not animate.
 */
const MARK_MS = 900

let timer: ReturnType<typeof setTimeout> | undefined

export function markNavigation(direction: NavigationDirection): void {
    if (typeof document === 'undefined') return
    const html = document.documentElement
    html.dataset.nav = direction
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
        if (html.dataset.nav === direction) delete html.dataset.nav
        timer = undefined
    }, MARK_MS)
}

export function listenForBackNavigation(): () => void {
    if (typeof window === 'undefined') return () => {}
    const onPop = () => markNavigation('back')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
}
