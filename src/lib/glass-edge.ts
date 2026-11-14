/**
 * The one listener behind `.glass-edge` (AUTM-2140, Don 2026-11-14): the
 * hairline of every glass field lights where the cursor is and follows it
 * from field to field, and a soft glint travels round each edge as the page
 * scrolls.
 *
 * Install it once at the app's root (`<GlassEdgeTracker />`, or
 * `useGlassEdge()`, or this function from a non-React shell). Installs are
 * counted, so a second install shares the first's listeners and the last
 * uninstall removes them.
 *
 * Cost, by design:
 *   - Three passive listeners on the window and the document; no listener
 *     per field. Every pointer move and scroll is coalesced to at most one
 *     animation frame.
 *   - In a frame, every rect is READ first and every property WRITTEN after,
 *     so a frame never forces a second layout. Writes are custom properties
 *     and one attribute (style and paint, never layout).
 *   - Only fields within reach of the pointer are written; the rest are left
 *     alone. The scroll glint writes one angle per field.
 *   - Touch is ignored: a finger has no hover, so a phone or an iPad sees the
 *     glint and the focus edge, and nothing is left lit after a tap.
 *   - Reduced motion parks the glint at its resting angle.
 *
 * The properties it sets on each `.glass-edge` element, read by forms.css:
 *   `--edge-x`, `--edge-y`  the pointer, in px from the element's top left;
 *   `data-edge-lit`        present while the pointer is within reach (the
 *                          light fades in and out over `--motion-hover`);
 *   `--edge-sheen`         the glint's angle.
 */

/** How far from a field the pointer still lights it: the light's radius. */
export const GLASS_EDGE_REACH = 90

/** The glint's resting angle and how far it turns per pixel scrolled. */
const SHEEN_REST = 210
const SHEEN_PER_PX = 0.35

const CLASS = 'glass-edge'
const LIT = 'data-edge-lit'

let installs = 0
let stop: (() => void) | null = null

/**
 * Start the tracker (or join one already running). Returns the uninstall.
 * A no-op outside a browser, so it is safe to call during a server render.
 */
export function installGlassEdge(): () => void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return () => {}
    installs += 1
    if (!stop) stop = start()
    let done = false
    return () => {
        if (done) return
        done = true
        installs -= 1
        if (installs === 0 && stop) {
            stop()
            stop = null
        }
    }
}

function start(): () => void {
    const fields = document.getElementsByClassName(CLASS) as HTMLCollectionOf<HTMLElement>
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')

    let px = 0
    let py = 0
    let pointerIn = false
    let raf = 0
    let wantLight = false
    let wantSheen = false
    let travel = 0
    let lit = new Set<HTMLElement>()
    const lastScroll = new WeakMap<object, number>()
    const sheenOf = new WeakMap<HTMLElement, string>()

    const sheen = () => `${(((SHEEN_REST + travel * SHEEN_PER_PX) % 360) + 360) % 360}deg`

    const paintLight = () => {
        // Read every rect first.
        const hits: Array<[HTMLElement, number, number]> = []
        if (pointerIn) {
            for (let i = 0; i < fields.length; i++) {
                const el = fields[i]
                const r = el.getBoundingClientRect()
                if (r.width === 0 && r.height === 0) continue
                if (
                    px < r.left - GLASS_EDGE_REACH ||
                    px > r.right + GLASS_EDGE_REACH ||
                    py < r.top - GLASS_EDGE_REACH ||
                    py > r.bottom + GLASS_EDGE_REACH
                )
                    continue
                hits.push([el, px - r.left, py - r.top])
            }
        }
        // Then write.
        const next = new Set<HTMLElement>()
        for (const [el, x, y] of hits) {
            el.style.setProperty('--edge-x', `${Math.round(x)}px`)
            el.style.setProperty('--edge-y', `${Math.round(y)}px`)
            if (!lit.has(el)) el.setAttribute(LIT, '')
            next.add(el)
        }
        // Unlit fields keep their last position, so the light fades in place.
        for (const el of lit) if (!next.has(el)) el.removeAttribute(LIT)
        lit = next
        // A field mounted since the last scroll takes the current angle.
        if (travel !== 0 && !reduce?.matches) {
            const angle = sheen()
            for (const el of next) {
                if (sheenOf.get(el) !== angle) {
                    el.style.setProperty('--edge-sheen', angle)
                    sheenOf.set(el, angle)
                }
            }
        }
    }

    const paintSheen = () => {
        const angle = sheen()
        for (let i = 0; i < fields.length; i++) {
            const el = fields[i]
            if (sheenOf.get(el) === angle) continue
            el.style.setProperty('--edge-sheen', angle)
            sheenOf.set(el, angle)
        }
    }

    const frame = () => {
        raf = 0
        if (wantLight) {
            wantLight = false
            paintLight()
        }
        if (wantSheen) {
            wantSheen = false
            paintSheen()
        }
    }
    const schedule = () => {
        if (!raf) raf = window.requestAnimationFrame(frame)
    }

    const onMove = (e: PointerEvent) => {
        if (e.pointerType === 'touch') {
            if (pointerIn) onLeave()
            return
        }
        px = e.clientX
        py = e.clientY
        pointerIn = true
        wantLight = true
        schedule()
    }
    const onDown = (e: PointerEvent) => {
        // A finger on a hybrid device (an iPad with a trackpad) puts the
        // light out rather than leaving it where the cursor last was.
        if (e.pointerType === 'touch' && pointerIn) onLeave()
    }
    const onLeave = () => {
        pointerIn = false
        wantLight = true
        schedule()
    }
    const onOut = (e: MouseEvent) => {
        if (!e.relatedTarget) onLeave()
    }
    const onScroll = (e: Event) => {
        const t = e.target
        const el =
            t === document || t === document.documentElement
                ? document.scrollingElement ?? document.documentElement
                : (t as Element | null)
        if (!el || typeof (el as Element).scrollTop !== 'number') return
        const now = (el as Element).scrollTop + (el as Element).scrollLeft
        const before = lastScroll.get(el) ?? now
        lastScroll.set(el, now)
        travel += now - before
        if (!reduce?.matches) wantSheen = true
        // The fields moved under a still cursor.
        if (pointerIn) wantLight = true
        if (wantSheen || wantLight) schedule()
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    document.addEventListener('mouseout', onOut, { passive: true })
    window.addEventListener('blur', onLeave)
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })

    return () => {
        if (raf) window.cancelAnimationFrame(raf)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerdown', onDown)
        document.removeEventListener('mouseout', onOut)
        window.removeEventListener('blur', onLeave)
        document.removeEventListener('scroll', onScroll, { capture: true })
        for (const el of lit) el.removeAttribute(LIT)
        lit = new Set()
    }
}
