"use client";

'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/cn'
import { AutaraLoader } from './AutaraLoader'

/**
 * Toast — Autara notification primitive, modelled on the Torph
 * "Processing Transaction" pill (https://torph.lochie.me): an ink
 * capsule with a leading status dot and white text. No backdrop blur.
 *
 * AUTM-1883 (Don, 2026-10-15): the words wrap to at most two lines. They
 * were one truncated line, so on a phone "Reminder sent to Priya by text
 * and email. Next one possible at 15:35" lost everything after "email",
 * and the half that said when to try again was the half that went. Two
 * lines hold a sentence and its follow-up at 375; a third is clamped, so
 * write toasts that fit in two. Where the screen is narrower than 20em of
 * text (320 at 100%, any phone at large text) nothing is clamped: the toast
 * grows and keeps every word.
 *
 * The provider exposes a singleton `toast()` plus `toast.success /
 * .error / .warning / .info / .loading` shortcuts. A new
 * `toast.update(id, opts)` lets a single capsule morph in place
 * (e.g. "Submitting booking…" → "Booking confirmed"), the canonical
 * Torph status-pill pattern.
 *
 * The `theme` prop on `<ToastProvider>` is preserved for source-
 * level compat with existing consumers (autara-merchant-web) but is
 * currently a **no-op** — there is only one ink treatment. A
 * light-fill companion is deferred to a future PR.
 */

type ToastType =
    | 'default'
    | 'success'
    | 'error'
    | 'warning'
    | 'info'
    | 'loading'

/**
 * Six anchor positions, matching Sonner / react-hot-toast conventions.
 * Default is `bottom-center` (the historical Autara position).
 */
type ToastPosition =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'

/**
 * Capsule variant. `dark` is the canonical Torph ink aesthetic;
 * `light` is the cream-canvas companion (white surface, ink text,
 * hairline border). Set once on the Provider, override per toast if
 * needed.
 */
type ToastVariant = 'dark' | 'light'

interface Toast {
    id: string
    /** Legacy field — combined with `description` into one message (two lines at most). */
    title?: string
    description?: string
    type?: ToastType
    /** Milliseconds before auto-dismiss. `0` keeps the toast open (use with `loading`). */
    duration?: number
    /** Override the provider's variant for this single capsule. */
    variant?: ToastVariant
    action?: {
        label: string
        onClick: () => void
    }
}

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
let globalUpdateToast:
    | ((id: string, patch: Partial<Omit<Toast, 'id'>>) => void)
    | null = null
let globalRemoveToast: ((id: string) => void) | null = null

const toast = Object.assign(
    (opts: Omit<Toast, 'id'> | string) => {
        if (!globalAddToast) {
            console.warn('ToastProvider not mounted')
            return ''
        }
        if (typeof opts === 'string') {
            return globalAddToast({ description: opts })
        }
        return globalAddToast(opts)
    },
    {
        success: (opts: Omit<Toast, 'id' | 'type'> | string) => {
            const o = typeof opts === 'string' ? { description: opts } : opts
            return toast({ ...o, type: 'success' })
        },
        error: (opts: Omit<Toast, 'id' | 'type'> | string) => {
            const o = typeof opts === 'string' ? { description: opts } : opts
            return toast({ ...o, type: 'error' })
        },
        warning: (opts: Omit<Toast, 'id' | 'type'> | string) => {
            const o = typeof opts === 'string' ? { description: opts } : opts
            return toast({ ...o, type: 'warning' })
        },
        info: (opts: Omit<Toast, 'id' | 'type'> | string) => {
            const o = typeof opts === 'string' ? { description: opts } : opts
            return toast({ ...o, type: 'info' })
        },
        loading: (opts: Omit<Toast, 'id' | 'type'> | string) => {
            const o = typeof opts === 'string' ? { description: opts } : opts
            // Loading toasts persist until `update` or `dismiss` is called.
            return toast({ duration: 0, ...o, type: 'loading' })
        },
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

function ToastProvider({
    children,
    position = 'bottom-center',
    variant = 'dark',
    theme: _theme,
}: {
    children: React.ReactNode
    /** Anchor edge / corner for the toast stack. Defaults to `bottom-center`. */
    position?: ToastPosition
    /** Default capsule variant. `dark` is the canonical Torph ink; `light`
     *  uses a white surface + ink text for the cream canvas. Per-toast
     *  `variant` overrides this default. Defaults to `'dark'`. */
    variant?: ToastVariant
    /** @deprecated superseded by `variant` — currently a no-op */
    theme?: 'dark' | 'light'
}) {
    const [toasts, setToasts] = React.useState<Toast[]>([])

    const addToast = React.useCallback((t: Omit<Toast, 'id'>) => {
        const id = `toast-${++toastCounter}`
        setToasts((prev) => [
            ...prev,
            { id, duration: 4000, type: 'default', ...t },
        ])
        return id
    }, [])

    const updateToast = React.useCallback(
        (id: string, patch: Partial<Omit<Toast, 'id'>>) => {
            setToasts((prev) =>
                prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
            )
        },
        []
    )

    const removeToast = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

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
        <ToastContext.Provider
            value={{ toasts, addToast, updateToast, removeToast }}
        >
            {children}
            <ToastViewport
                toasts={toasts}
                removeToast={removeToast}
                position={position}
                providerVariant={variant}
            />
        </ToastContext.Provider>
    )
}

// ─── Status dots ──────────────────────────────────────────────────
// AUTM-1594 (canvas v44 "Toasts") replaced the type icons with a status dot.
// The words carry the meaning; the dot only marks the kind.
const TOAST_DOT: Record<Exclude<ToastType, 'default' | 'loading'>, string> = {
    success: 'bg-[var(--lime)]',
    info: 'bg-[var(--aqua)]',
    warning: 'bg-[var(--caution)]',
    error: 'bg-[var(--danger-fill)]',
}

// ─── Viewport + Item ──────────────────────────────────────────────

// Maps the 6 anchor positions to viewport-layout classes. Every position
// spans the full width (pointer-events stay off it) and aligns its capsules
// to its corner, edge or centre. AUTM-1883: full width so the viewport can be
// the size container the large-text rule below measures; a corner viewport
// sized to its content cannot be one. `top-*` positions
// use `flex-col-reverse` so the newest toast renders at the corner /
// edge and older ones recede further into the page — matching Sonner.
const VIEWPORT_POS: Record<ToastPosition, string> = {
    'top-left': 'top-0 inset-x-0 items-start flex-col-reverse',
    'top-center': 'top-0 inset-x-0 items-center flex-col-reverse',
    'top-right': 'top-0 inset-x-0 items-end flex-col-reverse',
    'bottom-left': 'bottom-0 inset-x-0 items-start flex-col',
    'bottom-center': 'bottom-0 inset-x-0 items-center flex-col',
    'bottom-right': 'bottom-0 inset-x-0 items-end flex-col',
}

function ToastViewport({
    toasts,
    removeToast,
    position,
    providerVariant,
}: {
    toasts: Toast[]
    removeToast: (id: string) => void
    position: ToastPosition
    providerVariant: ToastVariant
}) {
    // Portal to document.body so transformed / contained ancestors
    // (Storybook Docs sections, modal containers with `transform`,
    // CSS `contain`, etc.) don't capture the `position: fixed`
    // anchor. SSR-safe via the mounted guard.
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])

    if (!mounted || toasts.length === 0) return null

    const isTop = position.startsWith('top')

    const viewport = (
        <div
            className={cn(
                'fixed z-[100] flex gap-2 p-4 pointer-events-none @container',
                VIEWPORT_POS[position]
            )}
            role="region"
            aria-label="Notifications"
        >
            {toasts.map((t) => (
                <ToastItem
                    key={t.id}
                    toast={t}
                    onDismiss={() => removeToast(t.id)}
                    isTop={isTop}
                    variant={t.variant ?? providerVariant}
                />
            ))}
        </div>
    )

    return createPortal(viewport, document.body)
}

function ToastItem({
    toast: t,
    onDismiss,
    isTop,
    variant,
}: {
    toast: Toast
    onDismiss: () => void
    /** Mirror enter/exit slide direction so top toasts come down from above. */
    isTop: boolean
    /** Resolved variant — provider default, optionally overridden per toast. */
    variant: ToastVariant
}) {
    const [isVisible, setIsVisible] = React.useState(false)
    const [isLeaving, setIsLeaving] = React.useState(false)
    const [contentKey, setContentKey] = React.useState(0)
    const prevContent = React.useRef<{
        title?: string
        description?: string
        type?: ToastType
    }>({ title: t.title, description: t.description, type: t.type })

    // Bump contentKey whenever the user-visible content changes — drives
    // the Torph-style cross-fade morph on `toast.update(...)`.
    React.useEffect(() => {
        const prev = prevContent.current
        if (
            prev.title !== t.title ||
            prev.description !== t.description ||
            prev.type !== t.type
        ) {
            setContentKey((k) => k + 1)
            prevContent.current = {
                title: t.title,
                description: t.description,
                type: t.type,
            }
        }
    }, [t.title, t.description, t.type])

    React.useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true))
    }, [])

    React.useEffect(() => {
        if (t.duration && t.duration > 0) {
            const timer = setTimeout(() => {
                setIsLeaving(true)
                setTimeout(onDismiss, 180)
            }, t.duration)
            return () => clearTimeout(timer)
        }
    }, [t.duration, onDismiss])

    const handleDismiss = () => {
        setIsLeaving(true)
        setTimeout(onDismiss, 180)
    }

    /* One message — combine legacy title + description.
       AUTM-1221: joined with a full stop, not an em dash. The em dash is a
       machine-written tell and it is out across Autara's copy; it also read
       as a range ("Saved — 3 items") rather than two sentences. */
    const message = [t.title, t.description]
        .filter(Boolean)
        .map((part) => String(part).trim().replace(/[.\s]+$/, ''))
        .join('. ')

    // Slide IN from above for top-anchored stacks, from below for
    // bottom-anchored ones. Same idle / leaving offsets — the direction
    // is the only thing that flips.
    const idleOffset = isTop ? '-translate-y-2' : 'translate-y-2'

    // AUTM-1594 — canvas v44 "Toasts": ink (white in dark) with a status
    // dot, 16px radius, 15px. `light` is the band companion, no outline.
    const isDark = variant === 'dark'
    const variantCls = isDark
        ? 'bg-[var(--surface-inverse)] text-[var(--text-on-inverse)]'
        : 'bg-[var(--band)] text-[var(--text-strong)]'

    return (
        <div
            className={cn(
                /* AUTM-1221: 12px, on the 8/12/16/24 ladder. Round is
                   reserved for avatars and status dots (glass rule 3); the
                   capsule was the last pill in the feedback set. */
                'pointer-events-auto inline-flex max-w-[min(560px,calc(100vw-32px))] items-center gap-2.5 rounded-2xl px-4 py-3 text-[0.9375rem] leading-snug transition-all duration-[180ms] ease-out',
                /* AUTM-1792: a toast floats over the page, so it takes the
                   lift. Without it the band toast sat on band and vanished. */
                'shadow-float',
                variantCls,
                isVisible && !isLeaving
                    ? 'translate-y-0 opacity-100'
                    : `${idleOffset} opacity-0`
            )}
            role={t.type === 'error' ? 'alert' : 'status'}
        >
            {t.type === 'loading' ? (
                /* AUTM-1708: a loading toast turns the Autara mark where the
                   dot was. A still dot on "Saving your changes" read the same
                   as a stuck one. Decorative: the toast is already a status
                   and its words say what is happening. */
                <AutaraLoader size={16} tone="current" decorative data-toast-dot="loading" />
            ) : t.type && t.type !== 'default' ? (
                /* The sheet's status dot. The words say what happened; the
                   dot only marks the kind, so it is hidden from AT. */
                <span
                    aria-hidden="true"
                    data-toast-dot={t.type}
                    className={cn('size-2 shrink-0 rounded-full', TOAST_DOT[t.type])}
                />
            ) : null}
            {/* AUTM-1883: two lines at most, never one truncated line. The
                capsule stays centred on its dot and actions; `text-pretty`
                keeps a lone word off the second line. With large text on a
                phone (the screen narrower than 20em of text) two lines hold
                about 30 characters, so there the toast keeps every word
                (WCAG 1.4.4) and grows instead. An `em` container query,
                because a media query cannot see the text size. */}
            <span
                key={contentKey}
                data-toast-message=""
                className="autara-toast-content min-w-0 line-clamp-2 break-words text-pretty @max-[20em]:line-clamp-none"
            >
                {message}
            </span>
            {t.action && (
                <button
                    onClick={t.action.onClick}
                    className={cn(
                        /* AUTM-1221: sentence case on the type scale. A
                           letterspaced uppercase action label is the
                           treatment the house rules retired. */
                        'ml-1 shrink-0 rounded-full px-3 py-1 text-[0.8125rem] font-medium transition-colors',
                        isDark
                            ? 'bg-[var(--text-on-inverse)]/10 text-[var(--text-on-inverse)] hover:bg-[var(--text-on-inverse)]/20'
                            : 'bg-[var(--raised)] text-[var(--text-strong)] hover:bg-[var(--paper)]'
                    )}
                >
                    {t.action.label}
                </button>
            )}
            <button
                onClick={handleDismiss}
                className={cn(
                    /* AUTM-1221: on the ladder. Dismiss is an action, and
                       round is reserved for people, state lights and status
                       markers (see shape-language.test.ts). */
                    'ml-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full transition-colors',
                    isDark
                        ? 'text-[var(--text-on-inverse)]/45 hover:bg-[var(--text-on-inverse)]/10 hover:text-[var(--text-on-inverse)]'
                        : 'text-[var(--text-subtle)] hover:bg-[var(--raised)] hover:text-[var(--text-strong)]'
                )}
                aria-label="Dismiss notification"
            >
                <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                >
                    <path d="M6 6l12 12M18 6L6 18" />
                </svg>
            </button>
            <style>{`
                .autara-toast-content { animation: autaraToastMorph 220ms ease-out; }
                @keyframes autaraToastMorph {
                    0%   { opacity: 0; transform: translateY(2px); filter: blur(2px); }
                    100% { opacity: 1; transform: translateY(0);  filter: blur(0);  }
                }
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
    type ToastPosition,
    type ToastVariant,
}
