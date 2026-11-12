'use client'

import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * ChoiceCard / ChoiceGroup — pick one of a few, as cards.
 *
 * A vehicle type, a saved car, a booking mode, a time slot: a small set of
 * mutually exclusive options that each deserve a line or two, not a
 * dropdown. The customer web hand-rolled this shape four times, with four
 * selected states (AUTM-1195); this is the one.
 *
 * Semantics come free: each card is a `<label>` wrapping an sr-only radio,
 * so the group is a real radio group. Arrow keys move between cards, Space
 * selects, a screen reader hears the label and the description, and a
 * spec can `check()` it.
 *
 * AUTM-1594 — canvas v44 "Choice card": band, a 24px radius, 16px in, a
 * 16px Bold title over a 14px description at 72% ink. No outline. The sheet
 * draws a tap-and-move-on choice with no selected state; where the choice
 * stays on screen (a vehicle type, a slot) the chosen card takes the
 * selected colour with its own ink. The cards are 44px at least.
 *
 * `disabledLabel` says why an option cannot be chosen ("Booked", "Not
 * available today") rather than just dimming it.
 */
type GroupContext = {
    name: string
    value: string | null
    onChange: (value: string) => void
}
const Ctx = React.createContext<GroupContext | null>(null)

export interface ChoiceGroupProps {
    name: string
    value: string | null
    onChange: (value: string) => void
    /** Visible group label. */
    legend?: React.ReactNode
    /** Keep the legend for assistive tech only. */
    legendHidden?: boolean
    /** Field-level error, rendered under the cards. */
    error?: string
    /** Grid columns from `sm`; one column below it. Default 2. */
    columns?: 1 | 2 | 3 | 4
    testId?: string
    className?: string
    children: React.ReactNode
}

export function ChoiceGroup({
    name,
    value,
    onChange,
    legend,
    legendHidden,
    error,
    columns = 2,
    testId,
    className,
    children,
}: ChoiceGroupProps) {
    const errorId = React.useId()
    const ctx = React.useMemo(() => ({ name, value, onChange }), [name, value, onChange])
    return (
        <Ctx.Provider value={ctx}>
            <fieldset
                data-testid={testId}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className={cn('min-w-0', className)}
            >
                {legend ? (
                    <legend
                        className={cn(
                            'mb-2 text-[0.9375rem] font-medium text-[var(--text-strong)]',
                            legendHidden && 'sr-only',
                        )}
                    >
                        {legend}
                    </legend>
                ) : null}
                <div
                    className={cn(
                        'grid gap-2',
                        columns === 1 && 'grid-cols-1',
                        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
                        columns === 3 && 'grid-cols-1 sm:grid-cols-3',
                        columns === 4 && 'grid-cols-2 sm:grid-cols-4',
                    )}
                >
                    {children}
                </div>
                {/* AUTM-1538: announced when it appears (WCAG 4.1.3), as FormField's
                    errors are; it was only reachable by walking to the group. */}
                {error ? (
                    <p id={errorId} role="alert" className="mt-2 text-sm text-[var(--danger)]">
                        {error}
                    </p>
                ) : null}
            </fieldset>
        </Ctx.Provider>
    )
}

export interface ChoiceCardProps {
    value: string
    label: React.ReactNode
    description?: React.ReactNode
    /** Leading glyph or thumbnail. */
    icon?: React.ReactNode
    disabled?: boolean
    /** Why it cannot be chosen; shown in place of the description when disabled. */
    disabledLabel?: string
    /** `data-testid` on the card (the label element). */
    testId?: string
    /** `data-field` on the radio, for focus targeting from a validator. */
    dataField?: string
    className?: string
}

export function ChoiceCard({
    value,
    label,
    description,
    icon,
    disabled,
    disabledLabel,
    testId,
    dataField,
    className,
}: ChoiceCardProps) {
    const group = React.useContext(Ctx)
    if (!group) throw new Error('ChoiceCard must be inside a ChoiceGroup')
    const selected = group.value === value
    return (
        <label
            data-testid={testId}
            data-selected={selected || undefined}
            className={cn(
                'flex min-h-11 min-w-0 cursor-pointer items-center gap-3 rounded-[1.5rem] p-4 text-left transition-colors',
                'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--accent)]',
                selected
                    ? 'bg-[var(--selected)] text-[var(--on-selected)]'
                    : 'bg-[var(--band)] text-[var(--text-strong)] hover:bg-[var(--band-press)]',
                disabled && 'cursor-not-allowed opacity-60 hover:bg-[var(--band)]',
                className,
            )}
        >
            <input
                type="radio"
                name={group.name}
                value={value}
                checked={selected}
                disabled={disabled}
                data-field={dataField}
                onChange={() => group.onChange(value)}
                className="sr-only"
            />
            {icon ? (
                <span
                    aria-hidden
                    className={cn(
                        'grid size-10 shrink-0 place-items-center rounded-full',
                        selected
                            ? 'bg-[var(--on-selected)]/15 text-[var(--on-selected)]'
                            : 'bg-[var(--raised)] text-[var(--accent)]',
                    )}
                >
                    {icon}
                </span>
            ) : null}
            <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="block break-words text-base font-bold">{label}</span>
                {disabled && disabledLabel ? (
                    <span className="block text-sm leading-normal">{disabledLabel}</span>
                ) : description ? (
                    <span
                        className={cn(
                            'block break-words text-sm leading-normal',
                            selected ? 'opacity-80' : 'text-[var(--text-muted)]',
                        )}
                    >
                        {description}
                    </span>
                ) : null}
            </span>
        </label>
    )
}
