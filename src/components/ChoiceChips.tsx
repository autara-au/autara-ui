'use client'

import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * ChoiceChips: pick one of a few, in one tap (AUTM-1867).
 *
 * The merchant's "Book a customer in" opens on the services they book most
 * and the next free times as chips (Don, 2026-10-14). A chip is a radio: the
 * group is a `radiogroup`, the chosen chip is `aria-checked` and carries the
 * Selected fill with its own ink (the same pairing ChoiceCard and the booking
 * form's tiles use), and a tick so the choice is not carried by colour alone.
 * Arrow keys move between chips, Home and End jump, and the chosen chip (or
 * the first) is the group's single tab stop.
 *
 * Chips are 44px pills that grow with the text (rem, half-height radius, the
 * Button `sm` geometry). `layout="wrap"` (default) wraps onto more lines;
 * `layout="row"` keeps one row that scrolls sideways, for a phone where the
 * fields the chips fill must stay in view (the chat's quick replies, Don
 * 2026-10-10). A `row` wraps again at large text so no chip is cut off: pass
 * `layout={largeText ? 'wrap' : 'row'}`.
 *
 * `action` is one trailing control that is NOT a choice ("More", "Pick
 * another day"): a link-grade button after the group, outside the
 * radiogroup, so a screen reader does not count it among the options.
 *
 * An option can be `disabled` with a `reason` (read to a screen reader, struck
 * through on screen), the TimePicker's rule: opacity alone is not a signal.
 *
 * References: Fresha's time slots and Airbnb's times under each item (steal:
 * the choice is the chip, one tap); Wise's amount presets (adapt: chips that
 * fill, editable after).
 */
export interface ChoiceChipOption<V extends string = string> {
    value: V
    label: React.ReactNode
    /** Read instead of `label` when the label is not plain text. */
    ariaLabel?: string
    disabled?: boolean
    /** Why a disabled option is out, for a screen reader. */
    reason?: string
    testId?: string
}

export interface ChoiceChipsAction {
    label: React.ReactNode
    onClick: () => void
    /** Present when the action opens a dialog or sheet. */
    opensDialog?: boolean
    ariaLabel?: string
    testId?: string
}

export interface ChoiceChipsProps<V extends string = string> {
    options: ChoiceChipOption<V>[]
    /** The chosen value, or '' / null for none. */
    value: V | '' | null
    onChange: (value: V) => void
    /** Names the group for a screen reader. */
    label: string
    /** Or point at a visible heading instead of `label`. */
    labelledBy?: string
    /** An id whose text says more about the choice (a rule, a reason). */
    describedBy?: string
    layout?: 'wrap' | 'row'
    /** One trailing chip that is an action, not a choice. */
    action?: ChoiceChipsAction
    invalid?: boolean
    disabled?: boolean
    /** `data-testid` on the group. */
    testId?: string
    className?: string
}

const CHIP =
    'inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-[1.375rem] px-[min(1.125rem,5vw)] py-2 text-[0.9375rem] leading-tight font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]'

function Tick() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
            className="-ml-0.5 shrink-0"
            // The non-colour mark of the chosen option (WCAG 1.4.1), the same
            // hook the merchant app's tiles carry, so one check reads both.
            data-selected-mark=""
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10Zm-5.97-3.03a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06l1.47 1.47 4.47-4.47a.75.75 0 0 1 1.06 0Z"
            />
        </svg>
    )
}

export function ChoiceChips<V extends string = string>({
    options,
    value,
    onChange,
    label,
    labelledBy,
    describedBy,
    layout = 'wrap',
    action,
    invalid = false,
    disabled = false,
    testId,
    className,
}: ChoiceChipsProps<V>) {
    const groupRef = React.useRef<HTMLDivElement>(null)
    const selectedIndex = options.findIndex((o) => o.value === value)
    const firstEnabled = options.findIndex((o) => !o.disabled)
    const [focusIndex, setFocusIndex] = React.useState(-1)
    const tabIndexAt = selectedIndex >= 0 ? selectedIndex : focusIndex >= 0 ? focusIndex : firstEnabled

    function chips(): HTMLButtonElement[] {
        return Array.from(groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? [])
    }

    function move(from: number, step: 1 | -1 | 'first' | 'last') {
        const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0)
        if (enabled.length === 0) return
        let next: number
        if (step === 'first') next = enabled[0]
        else if (step === 'last') next = enabled[enabled.length - 1]
        else {
            const at = enabled.indexOf(from)
            const pos = at === -1 ? 0 : (at + step + enabled.length) % enabled.length
            next = enabled[pos]
        }
        setFocusIndex(next)
        const el = chips()[next]
        el?.focus()
        el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
        // Arrowing onto a radio chooses it, as a native radio group does.
        onChange(options[next].value)
    }

    function onKeyDown(event: React.KeyboardEvent) {
        if (disabled) return
        const current = Math.max(0, tabIndexAt)
        const keys: Record<string, 1 | -1 | 'first' | 'last'> = {
            ArrowRight: 1,
            ArrowDown: 1,
            ArrowLeft: -1,
            ArrowUp: -1,
            Home: 'first',
            End: 'last',
        }
        const step = keys[event.key]
        if (step === undefined) return
        event.preventDefault()
        move(current, step)
    }

    const row = layout === 'row'

    return (
        <div
            className={cn(
                'flex gap-2',
                row ? 'flex-nowrap items-center overflow-x-auto pb-1' : 'flex-wrap items-center',
                className,
            )}
        >
            <div
                ref={groupRef}
                role="radiogroup"
                aria-label={labelledBy ? undefined : label}
                aria-labelledby={labelledBy}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                aria-disabled={disabled || undefined}
                onKeyDown={onKeyDown}
                data-testid={testId}
                data-layout={layout}
                className={cn('flex gap-2', row ? 'flex-nowrap' : 'flex-wrap')}
            >
                {options.map((o, i) => {
                    const checked = o.value === value
                    const off = disabled || !!o.disabled
                    return (
                        <button
                            key={o.value}
                            type="button"
                            role="radio"
                            aria-checked={checked}
                            aria-disabled={off || undefined}
                            aria-label={o.ariaLabel}
                            tabIndex={i === tabIndexAt ? 0 : -1}
                            data-testid={o.testId}
                            data-value={o.value}
                            onClick={() => {
                                if (off) return
                                setFocusIndex(i)
                                onChange(o.value)
                            }}
                            className={cn(
                                CHIP,
                                'motion-press',
                                checked
                                    ? 'bg-[var(--selected)] text-[var(--on-selected)]'
                                    : 'bg-[var(--band)] text-[var(--text-strong)] not-aria-disabled:hover:bg-[var(--band-press)]',
                                off && 'cursor-not-allowed text-[var(--text-muted)] line-through opacity-50',
                            )}
                        >
                            {checked ? <Tick /> : null}
                            {o.label}
                            {off && o.reason ? <span className="sr-only">, {o.reason}</span> : null}
                        </button>
                    )
                })}
            </div>
            {action ? (
                <button
                    type="button"
                    onClick={action.onClick}
                    aria-haspopup={action.opensDialog ? 'dialog' : undefined}
                    aria-label={action.ariaLabel}
                    data-testid={action.testId}
                    disabled={disabled}
                    className={cn(
                        CHIP,
                        // A link-grade action, not another option: the accent
                        // text, underlined, no fill (AUTM-1567's card links).
                        'motion-press px-2 text-[var(--accent)] underline decoration-1 underline-offset-4 hover:decoration-2 disabled:opacity-50',
                    )}
                >
                    {action.label}
                </button>
            ) : null}
        </div>
    )
}
