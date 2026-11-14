import { afterEach, describe, expect, it, vi } from 'vitest'
import { GLASS_EDGE_REACH, installGlassEdge } from './glass-edge'

/**
 * AUTM-2140: the one listener behind the glass fields' lit hairline. jsdom
 * has no layout, so each field's rect is stubbed; the frame is flushed by
 * hand through a stubbed requestAnimationFrame.
 */
let frames: FrameRequestCallback[] = []
function flush() {
    const run = frames
    frames = []
    run.forEach((f) => f(performance.now()))
}
function field(rect: { left: number; top: number; width: number; height: number }) {
    const el = document.createElement('div')
    el.className = 'glass-edge'
    el.getBoundingClientRect = () =>
        ({ ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height, x: rect.left, y: rect.top, toJSON() {} }) as DOMRect
    document.body.appendChild(el)
    return el
}
function move(x: number, y: number, pointerType = 'mouse') {
    const e = new Event('pointermove') as PointerEvent
    Object.assign(e, { clientX: x, clientY: y, pointerType })
    window.dispatchEvent(e)
}

describe('installGlassEdge', () => {
    let stop: () => void = () => {}
    afterEach(() => {
        stop()
        document.body.innerHTML = ''
        vi.unstubAllGlobals()
        frames = []
    })
    function install() {
        vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => {
            frames.push(f)
            return frames.length
        })
        vi.stubGlobal('cancelAnimationFrame', () => {})
        vi.stubGlobal('matchMedia', () => ({ matches: false }))
        stop = installGlassEdge()
    }

    it('lights the fields within reach of the pointer and places the light on each', () => {
        install()
        const near = field({ left: 100, top: 100, width: 300, height: 52 })
        const next = field({ left: 100, top: 170, width: 300, height: 52 })
        const far = field({ left: 100, top: 100 + 52 + GLASS_EDGE_REACH + 200, width: 300, height: 52 })
        move(200, 140)
        flush()
        expect(near.hasAttribute('data-edge-lit')).toBe(true)
        expect(near.style.getPropertyValue('--edge-x')).toBe('100px')
        expect(near.style.getPropertyValue('--edge-y')).toBe('40px')
        // The light follows across the gap onto the next field.
        expect(next.hasAttribute('data-edge-lit')).toBe(true)
        expect(next.style.getPropertyValue('--edge-y')).toBe('-30px')
        expect(far.hasAttribute('data-edge-lit')).toBe(false)
        expect(far.style.getPropertyValue('--edge-x')).toBe('')
    })

    it('coalesces many moves into one frame', () => {
        install()
        field({ left: 0, top: 0, width: 100, height: 52 })
        move(10, 10)
        move(20, 10)
        move(30, 10)
        expect(frames.length).toBe(1)
    })

    it('puts the light out when the pointer leaves, and ignores touch', () => {
        install()
        const el = field({ left: 0, top: 0, width: 100, height: 52 })
        move(10, 10)
        flush()
        expect(el.hasAttribute('data-edge-lit')).toBe(true)
        move(10, 10, 'touch')
        flush()
        expect(el.hasAttribute('data-edge-lit')).toBe(false)
        move(10, 10, 'touch')
        flush()
        expect(el.hasAttribute('data-edge-lit')).toBe(false)
    })

    it('turns the glint with scroll, and parks it under reduced motion', () => {
        install()
        const el = field({ left: 0, top: 0, width: 100, height: 52 })
        const scroller = document.createElement('div')
        document.body.appendChild(scroller)
        Object.defineProperty(scroller, 'scrollTop', { value: 0, writable: true })
        scroller.dispatchEvent(new Event('scroll'))
        scroller.scrollTop = 100
        scroller.dispatchEvent(new Event('scroll'))
        flush()
        expect(el.style.getPropertyValue('--edge-sheen')).toBe('245deg')
        stop()
        stop = () => {}
        el.style.removeProperty('--edge-sheen')
        vi.stubGlobal('matchMedia', () => ({ matches: true }))
        stop = installGlassEdge()
        scroller.scrollTop = 300
        scroller.dispatchEvent(new Event('scroll'))
        scroller.scrollTop = 500
        scroller.dispatchEvent(new Event('scroll'))
        flush()
        expect(el.style.getPropertyValue('--edge-sheen')).toBe('')
    })

    it('shares one set of listeners between installs, and the last uninstall removes them', () => {
        install()
        const add = vi.spyOn(window, 'addEventListener')
        const second = installGlassEdge()
        expect(add).not.toHaveBeenCalled()
        const el = field({ left: 0, top: 0, width: 100, height: 52 })
        second()
        move(10, 10)
        flush()
        expect(el.hasAttribute('data-edge-lit')).toBe(true)
        stop()
        stop = () => {}
        expect(el.hasAttribute('data-edge-lit')).toBe(false)
        move(10, 10)
        expect(frames.length).toBe(0)
    })
})
