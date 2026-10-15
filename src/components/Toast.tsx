'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/cn'
import { AutaraLoader } from './AutaraLoader'
import { CloseButton } from './IconButton'

/**
 * Toast — one line (two at most) that says what happened, with the obvious
 * next step beside it.
 *
 * AUTM-1871 (Don, 2026-10-14): toasts follow the new UI. The ink capsule with
 * a status dot is gone: a toast is the raised token surface (white in light,
 * the raised violet in dark) with a hairline and the float lift, in Satoshi,
 * with
 *  - a TYPE ICON on a filled disc in the brand's meaning colours: purple to
 *    act, lime for money in (and done), red for a problem, neutral otherwise;
 *  - an inline ACTION as a quiet accent text button ("View", "Answer"), never
 *    a black or filled button;
 *  - the large round Close from AUTM-1756 (44px, 48 to a finger).
 * It stays 6 s and pauses while the pointer is on it, while anything in it
 * has focus, and while the page is hidden. At most three show at once; a
 * fourth pushes the oldest out. Toasts with the same `groupKey` (one booking)
 * collapse into one that updates in place. Swipe it sideways, or towards its
 * edge, to dismiss. Under reduced motion it fades instead of sliding.
 * `position="auto"` (the default) puts the stack at the top on a phone and
 * bottom right from 40rem.
 *
 * AUTM-1813: ONE polite live region (`role="status"`) lives for the
 * provider's whole life, with one assertive region (`role="alert"`) for
 * errors, inside the "Notifications" region, and each toast is rendered INTO
 * its region when it appears: a live region inserted together with its words
 * is not reliably read out, a node added to one that exists is. The capsule
 * carries no live role of its own, so nothing is announced twice, and its
 * words exist once in the page (a hidden copy beside the capsule made every
 * `getByText` on a toast find two elements). QA's helpers keep working:
 * `getByRole('status').filter({ hasText })` and `getByRole('alert')`.
 *
 * AUTM-1883: the words wrap to two lines and a third is clamped, except where
 * the screen is narrower than 20em of text (large text on a phone), where the
 * toast keeps every word.
 *
 * The singleton `toast()` plus `toast.success / .error / .warning / .info /
 * .loading`, `toast.update(id, patch)` (morph in place) and
 * `toast.dismiss(id)` are unchanged.
 */

type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading'

/**
 * The icon disc's colour, by what the toast means (AUTM-1871):
 * `act` purple (the merchant has something to do), `money` lime (money in,
 * or done), `problem` red, `info` neutral.
 */
type ToastTone = 'act' | 'money' | 'problem' | 'info'

/**
 * `auto` (the default since AUTM-1871): top centre on a phone, bottom right
 * from 40rem. The fixed positions are kept for consumers that pass one.
 */
type ToastPosition = 'auto' | 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

/** @deprecated AUTM-1871: one surface now (the raised token surface); kept so existing props still compile. */
type ToastVariant = 'dark' | 'light'

interface Toast {
    id: string
    /** The lead words, at medium weight. Joined to `description` with a full stop. */
    title?: string
    description?: string
    type?: ToastType
    /** Milliseconds before it leaves. `0` keeps it open (use with `loading`). Default 6000. */
    duration?: number
    /** @deprecated AUTM-1871: no-op. */
    variant?: ToastVariant
    /** The one next step, as a text button: "View", "Answer", "Undo". */
    action?: {
        label: string
        onClick: () => void
    }
    /** A type icon for the disc (an svg; drawn at 18px). Replaces the type's own glyph. */
    icon?: React.ReactNode
    /** The disc's colour. Defaults from `type`. */
    tone?: ToastTone
    /**
     * Toasts with the same key collapse into one: while one is on screen, a
     * new one with its key replaces its words in place and restarts its time.
     * Merchant notifications pass the booking, so a burst about one booking
     * is one toast.
     */
    groupKey?: string
    /** `data-testid` on the capsule. */
    testId?: string
}

/** Internal: bumped when a toast's words change in place, to restart its time. */
type ToastState = Toast & { rev: number }

interface ToastContextValue {
    toasts: Toast[]
    addToast: (toast: Omit<Toast, 'id'>) => string
    updateToast: (id: string, patch: Partial<Omit<Toast, 'id'>>) => void
    removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

function useToast() {
    const context = React.useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

// Standalone toast function (works with the singleton provider)
let globalAddToast: ((toast: Omit<Toast, 'id'>) => string) | null = null
let globalUpdateToast: ((id: string, patch: Partial<Omit<Toast, 'id'>>) => void) | null = null
let globalRemoveToast: ((id: string) => void) | null = null

type ToastOptions = Omit<Toast, 'id'>
type TypedOptions = Omit<Toast, 'id' | 'type'> | string

function asOptions(opts: TypedOptions): Omit<Toast, 'id' | 'type'> {
    return typeof opts === 'string' ? { description: opts } : opts
}

const toast = Object.assign(
    (opts: ToastOptions | string) => {
        if (!globalAddToast) {
            console.warn('ToastProvider not mounted')
            return ''
        }
        return globalAddToast(typeof opts === 'string' ? { description: opts } : opts)
    },
    {
        success: (opts: TypedOptions) => toast({ ...asOptions(opts), type: 'success' }),
        error: (opts: TypedOptions) => toast({ ...asOptions(opts), type: 'error' }),
        warning: (opts: TypedOptions) => toast({ ...asOptions(opts), type: 'warning' }),
        info: (opts: TypedOptions) => toast({ ...asOptions(opts), type: 'info' }),
        // Loading toasts persist until `update` or `dismiss` is called.
        loading: (opts: TypedOptions) => toast({ duration: 0, ...asOptions(opts), type: 'loading' }),
        /** Morph an existing toast in place (e.g. loading → success). */
        update: (id: string, patch: Partial<Omit<Toast, 'id'>>) => {
            globalUpdateToast?.(id, patch)
        },
        /** Programmatically dismiss a toast by id. */
        dismiss: (id: string) => {
            globalRemoveToast?.(id)
        },
    }
)

let toastCounter = 0

/** AUTM-1871: Don, 6 s. Pauses on hover, focus and a hidden page. */
const DEFAULT_DURATION = 6000
/** AUTM-1871: at most three on screen. */
const DEFAULT_MAX = 3

/**
 * One message from a title and a description. AUTM-1221: joined with a full
 * stop, not an em dash, and without the closing full stop.
 */
function messageOf(t: Pick<Toast, 'title' | 'description'>): string {
    return [t.title, t.description]
        .filter(Boolean)
        .map((part) => String(part).trim().replace(/[.\s]+$/, ''))
        .join('. ')
}

function ToastProvider({
    children,
    position = 'auto',
    max = DEFAULT_MAX,
    variant: _variant,
    theme: _theme,
}: {
    children: React.ReactNode
    /** Where the stack sits. `auto`: top centre on a phone, bottom right from 40rem. */
    position?: ToastPosition
    /** Most toasts on screen at once; a new one pushes the oldest out. Default 3. */
    max?: number
    /** @deprecated AUTM-1871: one surface now; no-op. */
    variant?: ToastVariant
    /** @deprecated superseded by `variant`, no-op */
    theme?: 'dark' | 'light'
}) {
    const [toasts, setToasts] = React.useState<ToastState[]>([])
    // The list as last committed, read synchronously: `toast()` returns the id
    // it made (or the one a burst collapsed into) before React renders.
    const current = React.useRef<ToastState[]>([])
    const commit = React.useCallback((next: ToastState[]) => {
        current.current = next
        setToasts(next)
    }, [])

    const addToast = React.useCallback(
        (t: Omit<Toast, 'id'>) => {
            const prev = current.current
            // A burst about one subject is one toast: replace its words in place.
            const same = t.groupKey ? prev.find((p) => p.groupKey === t.groupKey) : undefined
            if (same) {
                commit(prev.map((p) => (p.id === same.id ? { ...p, ...t, id: same.id, rev: p.rev + 1 } : p)))
                return same.id
            }
            const id = `toast-${++toastCounter}`
            const next: ToastState[] = [...prev, { id, duration: DEFAULT_DURATION, type: 'default', ...t, rev: 0 }]
            // At most `max`: the oldest goes first, but a loading toast a
            // caller will still update is kept over a finished one.
            while (next.length > Math.max(1, max)) {
                const drop = next.findIndex((p) => p.type !== 'loading')
                next.splice(drop === -1 ? 0 : drop, 1)
            }
            commit(next)
            return id
        },
        [commit, max]
    )

    const updateToast = React.useCallback(
        (id: string, patch: Partial<Omit<Toast, 'id'>>) => {
            commit(current.current.map((t) => (t.id === id ? { ...t, ...patch, rev: t.rev + 1 } : t)))
        },
        [commit]
    )

    const removeToast = React.useCallback(
        (id: string) => {
            commit(current.current.filter((t) => t.id !== id))
        },
        [commit]
    )

    React.useEffect(() => {
        globalAddToast = addToast
        globalUpdateToast = updateToast
        globalRemoveToast = removeToast
        return () => {
            globalAddToast = null
            globalUpdateToast = null
            globalRemoveToast = null
        }
    }, [addToast, updateToast, removeToast])

    return (
        <ToastContext.Provider value={{ toasts, addToast, updateToast, removeToast }}>
            {children}
            <ToastViewport toasts={toasts} removeToast={removeToast} position={position} />
        </ToastContext.Provider>
    )
}

// ─── Icons and tones ──────────────────────────────────────────────

const TONE: Record<ToastTone | 'caution', string> = {
    act: 'bg-[var(--accent-fill)] text-[var(--on-accent)]',
    money: 'bg-[var(--lime)] text-[var(--on-lime)]',
    problem: 'bg-[var(--danger-fill)] text-[var(--on-danger-fill)]',
    info: 'bg-[var(--band)] text-[var(--text-strong)]',
    caution: 'bg-[var(--caution)] text-white',
}

const TYPE_TONE: Record<Exclude<ToastType, 'default'>, ToastTone | 'caution'> = {
    success: 'money',
    error: 'problem',
    warning: 'caution',
    info: 'info',
    loading: 'info',
}

const glyph = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
}

/** Solar-weight glyphs for the four kinds, inlined (autara-ui has no icon dependency). */
const TYPE_GLYPH: Record<'success' | 'error' | 'warning' | 'info', React.ReactNode> = {
    success: (
        <svg viewBox="0 0 24 24" aria-hidden>
            <path {...glyph} d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
    ),
    error: (
        <svg viewBox="0 0 24 24" aria-hidden>
            <path {...glyph} d="M12 7v6M12 16.5v.5" />
        </svg>
    ),
    warning: (
        <svg viewBox="0 0 24 24" aria-hidden>
            <path {...glyph} d="M12 7v6M12 16.5v.5" />
        </svg>
    ),
    info: (
        <svg viewBox="0 0 24 24" aria-hidden>
            <path {...glyph} d="M12 11v6M12 7.5v.5" />
        </svg>
    ),
}

// ─── Viewport ─────────────────────────────────────────────────────

/*
 * Every position spans the full width (pointer events stay off it) so the
 * viewport is the size container the large-text rule measures (AUTM-1883).
 * Top positions use `flex-col-reverse` so the newest toast is at the edge.
 * `auto` is top centre below 40rem and bottom right from it.
 */
const VIEWPORT_POS: Record<ToastPosition, string> = {
    auto: 'top-0 inset-x-0 items-center flex-col-reverse sm:top-auto sm:bottom-0 sm:items-end sm:flex-col',
    'top-left': 'top-0 inset-x-0 items-start flex-col-reverse',
    'top-center': 'top-0 inset-x-0 items-center flex-col-reverse',
    'top-right': 'top-0 inset-x-0 items-end flex-col-reverse',
    'bottom-left': 'bottom-0 inset-x-0 items-start flex-col',
    'bottom-center': 'bottom-0 inset-x-0 items-center flex-col',
    'bottom-right': 'bottom-0 inset-x-0 items-end flex-col',
}

/** How each inner column aligns its toasts, matching the viewport's corner. */
const ALIGN: Record<ToastPosition, string> = {
    auto: 'items-center sm:items-end',
    'top-left': 'items-start',
    'top-center': 'items-center',
    'top-right': 'items-end',
    'bottom-left': 'items-start',
    'bottom-center': 'items-center',
    'bottom-right': 'items-end',
}

function useIsTop(position: ToastPosition): boolean {
    const query = '(min-width: 40rem)'
    const read = () => (typeof window !== 'undefined' && window.matchMedia ? !window.matchMedia(query).matches : true)
    const [narrow, setNarrow] = React.useState(read)
    React.useEffect(() => {
        if (position !== 'auto' || typeof window === 'undefined' || !window.matchMedia) return
        const mql = window.matchMedia(query)
        const on = () => setNarrow(!mql.matches)
        on()
        mql.addEventListener?.('change', on)
        return () => mql.removeEventListener?.('change', on)
    }, [position])
    return position === 'auto' ? narrow : position.startsWith('top')
}

function ToastViewport({
    toasts,
    removeToast,
    position,
}: {
    toasts: ToastState[]
    removeToast: (id: string) => void
    position: ToastPosition
}) {
    // Portal to document.body so transformed or contained ancestors cannot
    // capture the `position: fixed`. SSR-safe via the mounted guard.
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])
    const isTop = useIsTop(position)

    if (!mounted) return null

    const polite = toasts.filter((t) => t.type !== 'error')
    const assertive = toasts.filter((t) => t.type === 'error')

    // AUTM-1813: the region and its two live regions are here before the
    // first toast and stay; the toasts are rendered INSIDE them, so a toast's
    // words are added to a live region that already exists (read out
    // reliably) and exist once in the page (a `getByText` finds one element).
    // Not `aria-atomic`: a new toast is read, not the whole stack again.
    // Errors sit in the assertive region at the stack's edge.
    const column = cn('flex w-full flex-col gap-2', isTop ? 'flex-col-reverse' : 'flex-col', ALIGN[position])
    const viewport = (
        <section
            aria-label="Notifications"
            className={cn(
                'fixed z-[100] flex pointer-events-none @container',
                'px-3 sm:px-4 pt-[calc(env(safe-area-inset-top,0px)+var(--toast-offset-top,0px)+0.75rem)] pb-[calc(env(safe-area-inset-bottom,0px)+var(--toast-offset-bottom,0px)+0.75rem)] sm:pb-[calc(env(safe-area-inset-bottom,0px)+var(--toast-offset-bottom,0px)+1rem)]',
                VIEWPORT_POS[position]
            )}
            data-toast-viewport={isTop ? 'top' : 'bottom'}
        >
            <div role="status" aria-live="polite" aria-atomic="false" className={column} data-toast-live="polite">
                {polite.map((t) => (
                    <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} isTop={isTop} />
                ))}
            </div>
            <div
                role="alert"
                aria-atomic="false"
                className={cn(column, isTop ? 'not-empty:mb-2' : 'not-empty:mt-2')}
                data-toast-live="assertive"
            >
                {assertive.map((t) => (
                    <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} isTop={isTop} />
                ))}
            </div>
        </section>
    )

    return createPortal(viewport, document.body)
}

// ─── One toast ────────────────────────────────────────────────────

function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** How far a swipe must travel, or how fast, to dismiss. */
const SWIPE_DISTANCE = 64
const SWIPE_VELOCITY = 0.6 // px per ms
const LEAVE_MS = 200

/** Pointer capture, which throws for a pointer the browser no longer tracks. */
function capture(el: HTMLElement | null, pointerId: number, on: boolean) {
    try {
        if (on) el?.setPointerCapture?.(pointerId)
        else el?.releasePointerCapture?.(pointerId)
    } catch {
        // The drag still works without capture while the pointer stays on the toast.
    }
}

interface Drag {
    id: number
    x0: number
    y0: number
    t0: number
    axis: 'x' | 'y' | null
    dx: number
    dy: number
}

function ToastItem({
    toast: t,
    onDismiss,
    isTop,
}: {
    toast: ToastState
    onDismiss: () => void
    /** Slide in from above for a top stack, from below for a bottom one. */
    isTop: boolean
}) {
    const ref = React.useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = React.useState(false)
    const [leaving, setLeaving] = React.useState<null | { x: number; y: number }>(null)

    // Pause while hovered, while focus is inside, and while the page is hidden.
    const [hovered, setHovered] = React.useState(false)
    const [focused, setFocused] = React.useState(false)
    const [dragging, setDragging] = React.useState(false)
    const [pageHidden, setPageHidden] = React.useState(
        () => typeof document !== 'undefined' && document.visibilityState === 'hidden'
    )
    React.useEffect(() => {
        const on = () => setPageHidden(document.visibilityState === 'hidden')
        document.addEventListener('visibilitychange', on)
        return () => document.removeEventListener('visibilitychange', on)
    }, [])
    const paused = hovered || focused || dragging || pageHidden

    React.useEffect(() => {
        const frame = requestAnimationFrame(() => setIsVisible(true))
        return () => cancelAnimationFrame(frame)
    }, [])

    const leave = React.useCallback(
        (to: { x: number; y: number } = { x: 0, y: 0 }) => {
            setLeaving(to)
            window.setTimeout(onDismiss, prefersReducedMotion() ? 0 : LEAVE_MS)
        },
        [onDismiss]
    )

    // The time left survives a pause; new words (a collapsed burst, an
    // update) start it again.
    const remaining = React.useRef(t.duration ?? DEFAULT_DURATION)
    React.useEffect(() => {
        remaining.current = t.duration ?? DEFAULT_DURATION
    }, [t.rev, t.duration])
    React.useEffect(() => {
        const total = t.duration ?? DEFAULT_DURATION
        if (!total || total <= 0 || paused || leaving) return
        const started = Date.now()
        const timer = window.setTimeout(() => leave(), remaining.current)
        return () => {
            window.clearTimeout(timer)
            remaining.current = Math.max(0, remaining.current - (Date.now() - started))
        }
    }, [t.duration, t.rev, paused, leaving, leave])

    // ─── Swipe to dismiss ─────────────────────────────────────────
    const drag = React.useRef<Drag | null>(null)
    const swallowClick = React.useRef(false)

    const paint = (dx: number, dy: number, animate: boolean) => {
        const el = ref.current
        if (!el) return
        const dist = Math.max(Math.abs(dx), Math.abs(dy))
        el.style.transition = animate ? `transform ${LEAVE_MS}ms var(--motion-ease-out), opacity ${LEAVE_MS}ms var(--motion-ease-out)` : 'none'
        el.style.transform = dx || dy ? `translate3d(${dx}px, ${dy}px, 0)` : ''
        el.style.opacity = dist ? String(Math.max(0.2, 1 - dist / 240)) : ''
    }

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0 || leaving) return
        drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), axis: null, dx: 0, dy: 0 }
    }
    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const d = drag.current
        if (!d || d.id !== e.pointerId) return
        const dx = e.clientX - d.x0
        const dy = e.clientY - d.y0
        if (!d.axis) {
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
            d.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'
            capture(ref.current, e.pointerId, true)
            setDragging(true)
        }
        d.dx = d.axis === 'x' ? dx : 0
        // Vertically, only towards the stack's own edge.
        d.dy = d.axis === 'y' ? (isTop ? Math.min(0, dy) : Math.max(0, dy)) : 0
        paint(d.dx, d.dy, false)
    }
    const endDrag = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
        const d = drag.current
        drag.current = null
        if (!d || d.id !== e.pointerId || !d.axis) return
        capture(ref.current, e.pointerId, false)
        setDragging(false)
        swallowClick.current = true
        const dist = Math.abs(d.axis === 'x' ? d.dx : d.dy)
        const speed = dist / Math.max(1, performance.now() - d.t0)
        if (!cancelled && (dist > SWIPE_DISTANCE || speed > SWIPE_VELOCITY)) {
            const out = d.axis === 'x' ? { x: Math.sign(d.dx) * 480, y: 0 } : { x: 0, y: Math.sign(d.dy) * 160 }
            if (prefersReducedMotion()) paint(d.dx, d.dy, false)
            else paint(out.x, out.y, true)
            leave(out)
        } else {
            paint(0, 0, !prefersReducedMotion())
        }
    }

    const message = messageOf(t)
    const tone = t.tone ?? (t.type && t.type !== 'default' ? TYPE_TONE[t.type] : undefined)
    const showDisc = t.type === 'loading' || Boolean(t.icon) || (t.type != null && t.type !== 'default')
    const idleOffset = isTop ? '-translate-y-2' : 'translate-y-2'
    const shown = isVisible && !leaving

    return (
        <div
            ref={ref}
            data-toast=""
            data-toast-type={t.type ?? 'default'}
            data-tone={tone}
            data-testid={t.testId}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => endDrag(e, false)}
            onPointerCancel={(e) => endDrag(e, true)}
            onClickCapture={(e) => {
                if (swallowClick.current) {
                    swallowClick.current = false
                    e.preventDefault()
                    e.stopPropagation()
                }
            }}
            className={cn(
                'pointer-events-auto relative flex w-full max-w-[30rem] touch-none select-none items-center gap-3 rounded-2xl',
                'border border-[var(--hairline)] bg-[var(--raised)] py-1.5 pl-2.5 pr-1.5 text-[var(--text-strong)] shadow-float',
                'font-[family-name:var(--font-brand)]',
                /* Transform and opacity only, on the panel tokens (AUTM-1843):
                   in on the house ease-out, out on the quicker panel-out.
                   Reduced motion: a fade, no travel. */
                'transition-[translate,opacity]',
                shown
                    ? 'translate-y-0 opacity-100 duration-[var(--motion-panel-in)] ease-[var(--motion-ease-out)]'
                    : cn(idleOffset, 'opacity-0 duration-[var(--motion-panel-out)] ease-[var(--motion-ease-in)] motion-reduce:translate-y-0')
            )}
        >
            {showDisc ? (
                <span
                    aria-hidden="true"
                    data-toast-icon={t.type === 'loading' ? 'loading' : tone ?? 'info'}
                    className={cn(
                        'grid size-9 shrink-0 place-items-center rounded-full [&_svg]:size-[1.125rem]',
                        TONE[tone ?? 'info']
                    )}
                >
                    {t.type === 'loading' ? (
                        /* AUTM-1708: the mark, turning. Decorative: the words say what is happening. */
                        <AutaraLoader size={16} tone="current" decorative />
                    ) : t.icon ? (
                        t.icon
                    ) : t.type && t.type !== 'default' ? (
                        TYPE_GLYPH[t.type]
                    ) : null}
                </span>
            ) : null}
            {/* AUTM-1883: two lines at most, never one truncated line;
                `text-pretty` keeps a lone word off the second line. With large
                text on a phone (narrower than 20em of text) every word stays
                (WCAG 1.4.4). The title at medium weight, the rest muted, so
                the first words carry the news. */}
            <p
                key={t.rev}
                data-toast-message=""
                className={cn(
                    /* Margin, not padding: a clamp hides overflow at the PADDING
                       edge, so padding showed a sliver of the third line. */
                    'autara-toast-content min-w-0 flex-1 my-1.5 text-[0.9375rem] leading-snug',
                    'line-clamp-2 break-words text-pretty @max-[20em]:line-clamp-none',
                    !showDisc && 'pl-1.5'
                )}
            >
                {t.title ? <span className="font-medium text-[var(--text-strong)]">{t.title.trim().replace(/[.\s]+$/, '')}</span> : null}
                {t.title && t.description ? '. ' : null}
                {t.description ? (
                    <span className={t.title ? 'text-[var(--text-muted)]' : 'text-[var(--text-strong)]'}>
                        {t.description.trim().replace(/[.\s]+$/, '')}
                    </span>
                ) : null}
                {!t.title && !t.description ? message : null}
            </p>
            {t.action ? (
                <button
                    type="button"
                    onClick={() => {
                        t.action?.onClick()
                        leave()
                    }}
                    data-toast-action=""
                    className={cn(
                        /* A quiet accent text button with a 44px target: the
                           next step, never a black button (Don, 2026-10-14). */
                        'motion-press -my-1 inline-flex h-11 shrink-0 items-center rounded-full px-3 text-[0.9375rem] font-medium text-[var(--accent)]',
                        'transition-colors hover:bg-[var(--band)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--raised)]'
                    )}
                >
                    {t.action.label}
                </button>
            ) : null}
            {/* AUTM-1756: the library's one Close, at its large size (44px,
                48 to a finger), the neutral disc on the raised surface. */}
            <CloseButton label="Dismiss notification" onClick={() => leave()} size="md" tone="neutral" className="shrink-0" />
            <style>{`
                .autara-toast-content { animation: autaraToastMorph var(--motion-crossfade, 160ms) var(--motion-ease-out, ease-out); }
                @keyframes autaraToastMorph {
                    0%   { opacity: 0; transform: translateY(2px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @media (prefers-reduced-motion: reduce) { .autara-toast-content { animation: none; } }
            `}</style>
        </div>
    )
}

export {
    ToastProvider,
    useToast,
    toast,
    type Toast,
    type ToastType,
    type ToastTone,
    type ToastPosition,
    type ToastVariant,
}
