import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '../lib/cn'
import { DialogOverlay, DialogPortal } from './Dialog'

/**
 * CommandMenu: a "jump to" palette, opened with ⌘K (Don, 2026-11-07: the
 * modern shell; Mercury, Linear and Plane all carry one in the top bar).
 *
 * It finds and runs what the consumer lists: screens to go to, actions to
 * start. It does not search records; a consumer that wants that passes the
 * results in as another group. The consumer owns `open` and the shortcut.
 *
 * Keyboard first, as a combobox over a listbox (WAI-ARIA 1.2): focus stays
 * in the field, ↑ and ↓ move the active option (`aria-activedescendant`),
 * Home and End jump, Enter runs it, Escape closes (Radix). The pointer sets
 * the active option on hover, so keys and mouse never disagree about which
 * row Enter will run. Matching is every word of the query appearing in the
 * label, the hint or a keyword, in any order ("new inv" finds New invoice).
 *
 * Top-aligned, as every palette is, so the field does not jump as the list
 * shortens. Paper on the library scrim, the dialog's pop, no close disc
 * (Escape and the scrim close it, and the field keeps the focus).
 */

export interface CommandMenuItem {
    id: string
    label: string
    /** Quiet text on the right: where it goes, or its shortcut. */
    hint?: string
    /** A 20px glyph, decorative. */
    icon?: React.ReactNode
    /** Extra words that should find this item ("calendar" for Bookings). */
    keywords?: string[]
    onSelect: () => void
}

export interface CommandMenuGroup {
    label: string
    items: CommandMenuItem[]
}

export interface CommandMenuProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    groups: CommandMenuGroup[]
    /** The dialog's accessible name. */
    label?: string
    placeholder?: string
    /** `data-testid` on the panel; the field is `${testId}-input`, rows `${testId}-item`. */
    testId?: string
}

/** True when every word of `query` is in the item's label, hint or keywords. */
export function matchesCommand(item: CommandMenuItem, query: string): boolean {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    if (words.length === 0) return true
    const hay = [item.label, item.hint ?? '', ...(item.keywords ?? [])].join(' ').toLowerCase()
    return words.every((w) => hay.includes(w))
}

function SearchGlyph() {
    return (
        <svg aria-hidden viewBox="0 0 24 24" className="size-5 flex-none" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    )
}

export function CommandMenu({
    open,
    onOpenChange,
    groups,
    label = 'Jump to',
    placeholder = 'Jump to a screen or action',
    testId,
}: CommandMenuProps) {
    const [query, setQuery] = React.useState('')
    const [active, setActive] = React.useState(0)
    const baseId = React.useId()
    const listId = `${baseId}-list`
    const listRef = React.useRef<HTMLDivElement | null>(null)

    // A fresh palette each time it opens.
    React.useEffect(() => {
        if (open) {
            setQuery('')
            setActive(0)
        }
    }, [open])

    const shown = React.useMemo(
        () =>
            groups
                .map((g) => ({ ...g, items: g.items.filter((i) => matchesCommand(i, query)) }))
                .filter((g) => g.items.length > 0),
        [groups, query]
    )
    const flat = React.useMemo(() => shown.flatMap((g) => g.items), [shown])
    const current = flat[Math.min(active, flat.length - 1)]
    const optionId = (id: string) => `${baseId}-opt-${id}`

    React.useEffect(() => {
        if (!current) return
        const el = listRef.current?.querySelector<HTMLElement>(`[id="${optionId(current.id)}"]`)
        el?.scrollIntoView?.({ block: 'nearest' })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current?.id])

    const run = (item: CommandMenuItem) => {
        onOpenChange(false)
        item.onSelect()
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (flat.length === 0) return
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((i) => (i + 1) % flat.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((i) => (i - 1 + flat.length) % flat.length)
        } else if (e.key === 'Home') {
            e.preventDefault()
            setActive(0)
        } else if (e.key === 'End') {
            e.preventDefault()
            setActive(flat.length - 1)
        } else if (e.key === 'Enter' && current) {
            e.preventDefault()
            run(current)
        }
    }

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPortal>
                <DialogOverlay />
                <DialogPrimitive.Content
                    data-testid={testId}
                    aria-describedby={undefined}
                    className={cn(
                        'modal-panel fixed left-1/2 top-[12vh] z-50 flex max-h-[min(32rem,76vh)] w-[calc(100%-2rem)] max-w-[36rem] -translate-x-1/2 flex-col overflow-hidden',
                        'rounded-[1.25rem] bg-[var(--paper)] text-[var(--text-strong)]'
                    )}
                >
                    <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
                    <div className="flex items-center gap-3 border-b border-[var(--hairline)] px-4 text-[var(--text-muted)]">
                        <SearchGlyph />
                        <input
                            data-testid={testId ? `${testId}-input` : undefined}
                            role="combobox"
                            aria-expanded
                            aria-controls={listId}
                            aria-autocomplete="list"
                            aria-activedescendant={current ? optionId(current.id) : undefined}
                            aria-label={label}
                            autoComplete="off"
                            spellCheck={false}
                            value={query}
                            placeholder={placeholder}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                setActive(0)
                            }}
                            onKeyDown={onKeyDown}
                            className="h-14 min-w-0 flex-1 bg-transparent text-base text-[var(--text-strong)] outline-none placeholder:text-[var(--text-subtle)]"
                        />
                        <kbd className="hidden rounded-md bg-[var(--band)] px-1.5 py-0.5 font-sans text-xs text-[var(--text-muted)] sm:inline">
                            esc
                        </kbd>
                    </div>

                    <div ref={listRef} id={listId} role="listbox" aria-label={label} className="min-h-0 flex-1 overflow-y-auto p-2">
                        {shown.length === 0 ? (
                            <p role="status" className="px-3 py-8 text-center text-[0.9375rem] text-[var(--text-muted)]">
                                Nothing matches "{query}"
                            </p>
                        ) : (
                            shown.map((g, gi) => (
                                <div key={g.label} role="group" aria-labelledby={`${baseId}-g${gi}`} className="pb-1">
                                    <p id={`${baseId}-g${gi}`} className="px-3 pb-1 pt-2 text-xs font-medium text-[var(--text-subtle)]">
                                        {g.label}
                                    </p>
                                    {g.items.map((item) => {
                                        const isActive = current?.id === item.id
                                        return (
                                            <div
                                                key={item.id}
                                                id={optionId(item.id)}
                                                role="option"
                                                aria-selected={isActive}
                                                data-testid={testId ? `${testId}-item` : undefined}
                                                onMouseMove={() => {
                                                    const idx = flat.indexOf(item)
                                                    if (idx !== active) setActive(idx)
                                                }}
                                                onClick={() => run(item)}
                                                className={cn(
                                                    'flex min-h-11 cursor-pointer items-center gap-3 rounded-[0.875rem] px-3 text-[0.9375rem] transition-colors',
                                                    isActive ? 'bg-[var(--band)] text-[var(--text-strong)]' : 'text-[var(--text-strong)]'
                                                )}
                                            >
                                                {item.icon ? (
                                                    <span aria-hidden className={cn('flex size-5 flex-none items-center justify-center', isActive ? 'text-[var(--accent)]' : 'text-[var(--text-subtle)]')}>
                                                        {item.icon}
                                                    </span>
                                                ) : null}
                                                <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                                                {item.hint ? (
                                                    <span className="flex-none text-[0.8125rem] text-[var(--text-subtle)]">{item.hint}</span>
                                                ) : null}
                                            </div>
                                        )
                                    })}
                                </div>
                            ))
                        )}
                    </div>

                    <div aria-hidden className="hidden items-center gap-4 border-t border-[var(--hairline)] px-4 py-2.5 text-xs text-[var(--text-subtle)] sm:flex">
                        <span>↑ ↓ to move</span>
                        <span>↵ to open</span>
                        <span>esc to close</span>
                    </div>
                </DialogPrimitive.Content>
            </DialogPortal>
        </DialogPrimitive.Root>
    )
}
