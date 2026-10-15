'use client'

import * as React from 'react'
import { cn } from '../lib/cn'
import { vehicleBodyLabel, vehiclePaint } from '../lib/vehicle-catalog'
import { Badge } from './Badge'
import { VehicleSilhouette } from './VehicleSilhouette'

/**
 * VehicleCard and VehicleAddCard: a saved car as the customer recognises it
 * (AUTM-1870, Don 2026-10-14: "the garage shows each car as its silhouette in
 * its colour, with the plate badge and Default; Add a car is a tile").
 *
 * The card is band (a card on paper, canvas v44) with the car on a paper
 * stage, the make and model as its title, Default as the lime badge (lime is
 * "this one", Badge's own rule), the plate drawn as a plate (paper with ink,
 * because that is what a plate is), then the type, year and colour in words,
 * so nothing rests on the drawing alone. `actions` is the consumer's row
 * (Make default, Edit, Remove), under the facts.
 *
 * Two ways to draw one:
 *   - On its own (the garage): an `<article>`, the title a heading.
 *   - As a choice (checkout's saved cars): pass `selectable`, and it is a
 *     `<label>` round an sr-only radio, so the cards of one `name` are a real
 *     radio group (arrow keys, Space, a spec can `check()` it). The chosen
 *     card takes the selected fill with its own ink, and a tick.
 *
 * VehicleAddCard is the next car, as a tile of the same size: a button
 * (`onClick`), or a radio among the cars (`selectable`, checkout's "Add a
 * different car").
 */

export interface VehicleCardSelectable {
    /** The radio group's shared name. */
    name: string
    value: string
    checked: boolean
    onChange: (value: string) => void
    disabled?: boolean
    /** `data-field` on the radio, for a validator's focus. */
    dataField?: string
}

export interface VehicleCardProps {
    make: string
    model: string
    /** The `VehicleType` enum value. */
    body?: string | null
    color?: string | null
    year?: number | string | null
    registrationPlate?: string | null
    isDefault?: boolean
    /** The card's own actions, under the facts (the garage's row). */
    actions?: React.ReactNode
    /** Draw it as one radio among the cars of `selectable.name`. */
    selectable?: VehicleCardSelectable
    /** The title's heading level when the card stands alone. Default 2. */
    headingLevel?: 2 | 3 | 4
    testId?: string
    className?: string
}

const SHELL =
    'relative flex min-w-0 flex-col gap-3 rounded-[var(--radius-autara-lg)] p-3 text-left transition-colors sm:p-4'
const IDLE = 'bg-[var(--band)] text-[var(--text-strong)]'
const ON = 'bg-[var(--selected)] text-[var(--on-selected)]'
const CHOICE =
    'cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--accent)] has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-[var(--background)] has-[:disabled]:cursor-not-allowed'

const Tick = () => (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" focusable="false">
        <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export function vehicleCardFacts({
    body,
    year,
    color,
}: Pick<VehicleCardProps, 'body' | 'year' | 'color'>): string {
    const paint = vehiclePaint(color)
    return [vehicleBodyLabel(body), year ? String(year) : '', paint?.label ?? (color || '')]
        .filter(Boolean)
        .join(' · ')
}

export function VehicleCard({
    make,
    model,
    body,
    color,
    year,
    registrationPlate,
    isDefault = false,
    actions,
    selectable,
    headingLevel = 2,
    testId,
    className,
}: VehicleCardProps) {
    const name = `${make} ${model}`.trim()
    const facts = vehicleCardFacts({ body, year, color })
    const on = selectable?.checked ?? false
    const Title = (selectable ? 'span' : `h${headingLevel}`) as 'span' | 'h2' | 'h3' | 'h4'

    const inner = (
        <>
            <div className="rounded-[var(--radius-autara-md)] bg-[var(--paper)] px-4 py-3 text-[var(--text-strong)]">
                <VehicleSilhouette body={body} color={color} className="mx-auto max-w-[15rem]" />
            </div>
            <div className="flex min-w-0 items-start justify-between gap-2">
                <Title className="m-0 min-w-0">
                    <span className="block text-[1.0625rem] font-bold leading-snug [overflow-wrap:anywhere]">{name}</span>
                </Title>
                {isDefault ? (
                    <Badge variant="lime" className="shrink-0">
                        Default
                    </Badge>
                ) : selectable && on ? (
                    <span className="shrink-0">
                        <Tick />
                    </span>
                ) : null}
            </div>
            {registrationPlate || facts ? (
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    {registrationPlate ? (
                        <span
                            className="inline-flex min-h-7 items-center rounded-[var(--radius-autara-sm)] bg-[var(--paper)] px-2 text-[0.8125rem] font-bold text-[var(--text-strong)]"
                            data-slot="plate"
                        >
                            <span className="sr-only">Rego </span>
                            {registrationPlate}
                        </span>
                    ) : null}
                    {facts ? (
                        <span className={cn('text-[0.875rem]', on ? 'text-[var(--on-selected)]' : 'text-[var(--text-muted)]')}>
                            {facts}
                        </span>
                    ) : null}
                </div>
            ) : null}
        </>
    )

    if (selectable) {
        return (
            <label
                data-testid={testId}
                data-selected={on || undefined}
                className={cn(SHELL, CHOICE, on ? ON : IDLE, 'motion-press-row', className)}
            >
                <input
                    type="radio"
                    name={selectable.name}
                    value={selectable.value}
                    checked={on}
                    disabled={selectable.disabled}
                    data-field={selectable.dataField}
                    onChange={() => selectable.onChange(selectable.value)}
                    className="sr-only"
                />
                {inner}
            </label>
        )
    }

    return (
        <article data-testid={testId} className={cn(SHELL, IDLE, className)}>
            {inner}
            {/* The consumer lays its own row out; this only pins it to the foot. */}
            {actions ? <div className="mt-auto">{actions}</div> : null}
        </article>
    )
}

export interface VehicleAddCardProps {
    /** Default "Add a car". */
    label?: string
    /** One line under it. */
    description?: React.ReactNode
    /** As a button. */
    onClick?: () => void
    /** As a radio among the cars (checkout's "Add a different car"). */
    selectable?: VehicleCardSelectable
    disabled?: boolean
    testId?: string
    className?: string
}

const Plus = () => (
    <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true" focusable="false">
        <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
)

export function VehicleAddCard({
    label = 'Add a car',
    description,
    onClick,
    selectable,
    disabled,
    testId,
    className,
}: VehicleAddCardProps) {
    const on = selectable?.checked ?? false
    const inner = (
        <>
            {/* The lime disc is the tile's mark, not a second primary: the
                tile is the action, and lime says "add" as the dock says "here". */}
            <span
                aria-hidden="true"
                className="grid size-12 place-items-center rounded-full bg-[var(--lime)] text-[var(--on-lime)]"
            >
                <Plus />
            </span>
            <span className="block text-[1.0625rem] font-bold leading-snug">{label}</span>
            {description ? (
                <span className={cn('block text-[0.875rem]', on ? 'text-[var(--on-selected)]' : 'text-[var(--text-muted)]')}>
                    {description}
                </span>
            ) : null}
        </>
    )
    const shell = cn(SHELL, 'min-h-40 items-center justify-center text-center', on ? ON : IDLE, className)
    if (selectable) {
        return (
            <label data-testid={testId} data-selected={on || undefined} className={cn(shell, CHOICE, 'motion-press-row')}>
                <input
                    type="radio"
                    name={selectable.name}
                    value={selectable.value}
                    checked={on}
                    disabled={selectable.disabled ?? disabled}
                    data-field={selectable.dataField}
                    onChange={() => selectable.onChange(selectable.value)}
                    className="sr-only"
                />
                {inner}
            </label>
        )
    }
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            data-testid={testId}
            className={cn(
                shell,
                'hover:bg-[var(--band-press)] motion-press-row disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]'
            )}
        >
            {inner}
        </button>
    )
}
