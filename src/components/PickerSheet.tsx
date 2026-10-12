"use client";

'use client'

import * as React from 'react'

import { cn } from '../lib/cn'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from './Sheet'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from './Dialog'
import { SearchInput } from './SearchInput'
import { AsyncSkeleton } from './AsyncSkeleton'
import { ErrorCard } from './ErrorCard'
import { EmptyState } from './EmptyState'
import { Button } from './Button'

/**
 * A selectable option. Presence of `children` / `loadChildren` turns the row
 * into a drill-down into a nested list (hierarchical mode).
 */
export interface PickerOption<T = unknown> {
    /** Stable key + the value reported on selection. */
    value: string
    /** The item handed to `renderRow` + the selection callbacks. */
    data: T
    /** Pre-loaded child options — tapping the row drills into them. */
    children?: PickerOption<T>[]
    /** Lazy child loader — called on drill-in (shows a loading state). */
    loadChildren?: () => Promise<PickerOption<T>[]>
    /** Text the built-in search filters against (current level only). */
    searchText?: string
    disabled?: boolean
}

export type PickerRowRender<T> = (
    data: T,
    meta: { selected: boolean; hasChildren: boolean },
) => React.ReactNode

export interface PickerSheetProps<T = unknown> {
    /** Controlled open state. */
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Header text. */
    title: string
    /** Optional subtitle under the title. */
    description?: string
    /** Root-level options. */
    options: PickerOption<T>[]
    /**
     * Render the row body (leading media + text). The row chrome — 44px min
     * height, focus ring, hover, the trailing check/chevron — is provided by
     * PickerSheet, so this returns just the content.
     */
    renderRow: PickerRowRender<T>
    /** @default 'single' */
    mode?: 'single' | 'multi'
    /** Controlled selection — a single value, or an array in multi mode. */
    selected?: string | string[]
    /** single: fires with the chosen value, then closes. */
    onSelect?: (value: string, data: T) => void
    /** multi: fires with the full selection on each toggle. */
    onSelectionChange?: (values: string[]) => void
    /** Render the built-in search filter (filters `option.searchText`). */
    searchable?: boolean
    searchPlaceholder?: string
    /** Async: show the loading skeleton instead of the list. */
    loading?: boolean
    /** Async: show an error + retry instead of the list. */
    error?: string | null
    onRetry?: () => void
    /** Empty-state copy (no options, not loading/erroring). */
    emptyTitle?: string
    emptyDescription?: string
    /** multi: footer confirm-button label. @default 'Done' */
    confirmLabel?: string
}

// Solar-linear inline glyphs (autara-ui inlines its icons — no icon dep).
function ChevronRightGlyph() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}
function CheckGlyph({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}
function BackGlyph() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

/**
 * Sheet on small screens (<768px), centered Dialog on larger ones. Runtime
 * (not CSS) because the two are different Radix trees. SSR-safe: starts false,
 * corrects on mount.
 */
function useIsMobile(query = '(max-width: 767px)'): boolean {
    const [isMobile, setIsMobile] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return
        const mq = window.matchMedia(query)
        setIsMobile(mq.matches)
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [query])
    return isMobile
}

interface Level<T> {
    /** null at the root; otherwise the option we drilled through. */
    parent: PickerOption<T> | null
    options: PickerOption<T>[]
}

/**
 * PickerSheet — responsive modal-select for rich, hierarchical lists.
 *
 * Bottom sheet on phones, centered dialog on tablet/web. Single + multi
 * select, optional search, drill-down with a back affordance, and the four
 * async folds (loading / error+retry / empty / results). The consumer supplies
 * a `renderRow` for the row body; the row chrome is provided here so every
 * picker stays 44px-min, keyboard-navigable, and on-brand.
 *
 * ─── AUTM-974: selection is a solid marker, not a coloured border ────────
 *
 * A selected row used to be `border-autara-purple/40` — ONE ALPHA STEP from
 * its own hover, `border-autara-purple/35`. So the difference between "the
 * pointer is over this" and "this is your saved choice" was 5% of an alpha
 * channel, and rule 4 of the Autara Glass direction
 * (`knowledge/project_ui_direction_2026_09_01.md`) bans carrying emphasis on
 * a border at all: "no outline buttons or sections … everything should be
 * solid."
 *
 * The rows were also boxes for no reason. Every row was `--surface` on a
 * sheet that is itself `--surface`, so the hairline WAS the row — the same
 * 1.0:1-fill-plus-outline defect AUTM-969 found on ModeChip, at row scale.
 * They are now plain rows: no fill, no edge.
 *
 * AUTM-1594 (canvas v44 "Picker sheet"): 52px rows under a hairline, hover
 * paints band, and the chosen single-select row is Bold with an ink check on
 * the right; multi-select keeps a checkbox filled in the selected colour.
 *
 * The row is deliberately NOT painted solid when selected. `renderRow` is
 * consumer content and this component does not own its ink — repainting the
 * container is how the merchant-mobile booking-detail pass nearly shipped a
 * status sentence at 3.40:1. Bold weight and the check are safe on any ink.
 */
export function PickerSheet<T = unknown>(props: PickerSheetProps<T>) {
    const {
        open,
        onOpenChange,
        title,
        description,
        options,
        renderRow,
        mode = 'single',
        selected,
        onSelect,
        onSelectionChange,
        searchable = false,
        searchPlaceholder = 'Search…',
        loading = false,
        error = null,
        onRetry,
        emptyTitle = 'Nothing to show',
        emptyDescription,
        confirmLabel = 'Done',
    } = props

    const isMobile = useIsMobile()
    const [query, setQuery] = React.useState('')
    const [stack, setStack] = React.useState<Level<T>[]>([{ parent: null, options }])
    const [levelLoading, setLevelLoading] = React.useState(false)
    const [levelError, setLevelError] = React.useState<string | null>(null)

    // Reset drill-down + search when the picker closes.
    React.useEffect(() => {
        if (!open) {
            setQuery('')
            setStack([{ parent: null, options }])
            setLevelLoading(false)
            setLevelError(null)
        }
        // Only reset on the open→closed edge; options is refreshed below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    // Keep the root level in sync if the options prop changes while at root.
    React.useEffect(() => {
        setStack((s) => (s.length === 1 ? [{ parent: null, options }] : s))
    }, [options])

    const selectedSet = React.useMemo(() => {
        if (mode === 'multi') return new Set(Array.isArray(selected) ? selected : [])
        return new Set(typeof selected === 'string' && selected ? [selected] : [])
    }, [selected, mode])

    const current = stack[stack.length - 1]
    const atRoot = stack.length === 1

    const visible = React.useMemo(() => {
        if (!searchable || !query.trim()) return current.options
        const q = query.trim().toLowerCase()
        return current.options.filter((o) => (o.searchText ?? '').toLowerCase().includes(q))
    }, [current.options, searchable, query])

    async function drillInto(option: PickerOption<T>) {
        setLevelError(null)
        setQuery('')
        if (option.children) {
            setStack((s) => [...s, { parent: option, options: option.children! }])
            return
        }
        if (option.loadChildren) {
            setLevelLoading(true)
            try {
                const children = await option.loadChildren()
                setStack((s) => [...s, { parent: option, options: children }])
            } catch (err) {
                setLevelError(err instanceof Error ? err.message : 'Failed to load')
            } finally {
                setLevelLoading(false)
            }
        }
    }

    function goBack() {
        setQuery('')
        setLevelError(null)
        setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
    }

    function handleRow(option: PickerOption<T>) {
        if (option.disabled) return
        if (option.children || option.loadChildren) {
            void drillInto(option)
            return
        }
        if (mode === 'single') {
            onSelect?.(option.value, option.data)
            onOpenChange(false)
            return
        }
        const next = new Set(selectedSet)
        if (next.has(option.value)) next.delete(option.value)
        else next.add(option.value)
        onSelectionChange?.(Array.from(next))
    }

    const shownError = error ?? levelError
    const isLoading = loading || levelLoading

    const body = (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
            {searchable && !isLoading && !shownError ? (
                <SearchInput
                    placeholder={searchPlaceholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            ) : null}

            {isLoading ? (
                <AsyncSkeleton variant="list" count={4} rowHeight="h-14" />
            ) : shownError ? (
                <ErrorCard
                    message={shownError}
                    onRetry={levelError ? goBack : onRetry}
                    retryLabel={levelError ? 'Back' : 'Retry'}
                />
            ) : visible.length === 0 ? (
                <EmptyState
                    title={query.trim() ? 'No matches' : emptyTitle}
                    description={query.trim() ? undefined : emptyDescription}
                />
            ) : (
                <ul
                    role="listbox"
                    aria-label={title}
                    aria-multiselectable={mode === 'multi'}
                    className="-mx-1 flex max-h-[min(60vh,420px)] flex-col gap-1.5 overflow-y-auto px-1 py-0.5"
                >
                    {visible.map((option) => {
                        const hasChildren = !!(option.children || option.loadChildren)
                        const isSelected = selectedSet.has(option.value)
                        return (
                            /* `role="presentation"` — the <li> would
                               otherwise sit between role="listbox" and
                               role="option" and break the required ARIA
                               parent chain, so a screen reader announced the
                               options as plain list items and not as a
                               selectable set. axe: aria-required-parent +
                               aria-required-children, both critical. Caught
                               by the AUTM-974 sweep; pre-existing. */
                            <li key={option.value} role="presentation">
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    disabled={option.disabled}
                                    onClick={() => handleRow(option)}
                                    /* AUTM-1594 — canvas v44 "Picker sheet":
                                       52px rows under a hairline, 16px
                                       Medium; the chosen row is Bold with a
                                       check. No box, no outline, no fill
                                       marker (AUTM-974's solid marker is
                                       retired by the sheet). */
                                    className={cn(
                                        'flex min-h-13 w-full items-center gap-3 border-t border-[var(--hairline)] px-1 py-2 text-left text-base transition-colors',
                                        'bg-transparent text-[var(--text-strong)]',
                                        isSelected ? 'font-bold' : 'font-medium',
                                        'hover:bg-[var(--band)]',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]',
                                        'disabled:cursor-not-allowed disabled:opacity-50',
                                    )}
                                >
                                    <span className="min-w-0 flex-1">
                                        {renderRow(option.data, { selected: isSelected, hasChildren })}
                                    </span>

                                    {hasChildren ? (
                                        <span className="shrink-0 text-[var(--text-muted)]" aria-hidden="true">
                                            <ChevronRightGlyph />
                                        </span>
                                    ) : mode === 'multi' ? (
                                        /* The checkbox affordance: an empty
                                           box has nothing to fill, so its
                                           hairline is the control itself and
                                           not an emphasis outline. Matches
                                           `Checkbox`. */
                                        <span
                                            aria-hidden="true"
                                            className={cn(
                                                'flex size-6 shrink-0 items-center justify-center rounded-autara-sm',
                                                isSelected
                                                    ? 'bg-[var(--selected)] text-[var(--on-selected)]'
                                                    : 'border-2 border-[var(--field-edge)] bg-[var(--paper)]',
                                            )}
                                        >
                                            {isSelected ? <CheckGlyph size={14} /> : null}
                                        </span>
                                    ) : isSelected ? (
                                        /* Single select: the Bold label and
                                           an ink check, as the sheet draws
                                           it. aria-selected carries it too. */
                                        <span aria-hidden="true" className="shrink-0 text-[var(--text-strong)]">
                                            <CheckGlyph size={16} />
                                        </span>
                                    ) : null}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            )}

            {mode === 'multi' ? (
                <div className="flex items-center justify-between border-t border-[var(--hairline)] pt-3">
                    <span className="text-sm text-[var(--text-muted)]">
                        {selectedSet.size} selected
                    </span>
                    <Button variant="primary" onClick={() => onOpenChange(false)}>
                        {confirmLabel}
                    </Button>
                </div>
            ) : null}
        </div>
    )

    const backButton = !atRoot ? (
        <button
            type="button"
            onClick={goBack}
            /* AUTM-974 — `text-autara-purple` resolves through
               `--accent-fill`, which is FILL grade: #6d3dd4 on the dark
               surface measures 2.72:1, so "Back" — the only way out of a
               drill-down — was under the AA floor in dark mode. Text-grade
               purple is `--accent` (5.1:1 dark, 8.9:1 light); the package
               README says so and this line predates it.

               `min-h-11` gives the 44px target the house rule asks for; the
               ring gains an offset band so it is not drawn straight onto the
               sheet. */
            className="mb-1 inline-flex min-h-11 items-center gap-1 self-start rounded-autara-sm text-sm font-medium text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
        >
            <BackGlyph /> Back
        </button>
    ) : null

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="bottom" className="flex max-h-[85vh] flex-col gap-3">
                    <SheetHeader>
                        {backButton}
                        <SheetTitle>{title}</SheetTitle>
                        {description ? <SheetDescription>{description}</SheetDescription> : null}
                    </SheetHeader>
                    {/* AUTM-1594: the sheet's 20px inset. The dialog pads its
                        own content; a bottom sheet leaves it to the body. */}
                    <div className="flex min-h-0 flex-1 flex-col px-5 pb-6">{body}</div>
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-3">
                <DialogHeader>
                    {backButton}
                    <DialogTitle>{title}</DialogTitle>
                    {description ? <DialogDescription>{description}</DialogDescription> : null}
                </DialogHeader>
                {body}
            </DialogContent>
        </Dialog>
    )
}
