import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * Segmented: one choice of two to four, side by side in a capsule track
 * (the List and Map switch in Customer/SearchView.swift, Morning, Afternoon
 * and Evening in TimePicker.swift). The chosen one is the tile, purple with a
 * white label (AppTheme.brand), and slides there. A radio group: the arrow
 * keys move the choice, Tab leaves the group.
 */
export interface SegmentedOption<T extends string> {
    value: T
    label: React.ReactNode
    /** `data-testid` on this option's button. */
    testId?: string
    disabled?: boolean
}

export interface SegmentedProps<T extends string> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
    options: ReadonlyArray<SegmentedOption<T>>
    value: T
    onChange: (value: T) => void
    /** The group's accessible name ("Show", "Part of the day"). */
    label: string
    /** Fill the line, each option an equal share. Default true. */
    full?: boolean
}

export function Segmented<T extends string>({ options, value, onChange, label, full = true, className, ...rest }: SegmentedProps<T>) {
    const refs = React.useRef<Array<HTMLButtonElement | null>>([])
    const index = Math.max(0, options.findIndex((o) => o.value === value))
    const move = (from: number, step: number) => {
        for (let i = 1; i <= options.length; i++) {
            const next = (from + step * i + options.length) % options.length
            if (!options[next].disabled) {
                onChange(options[next].value)
                refs.current[next]?.focus()
                return
            }
        }
    }
    return (
        <div
            role="radiogroup"
            aria-label={label}
            className={cn('au-segmented', className)}
            data-full={full ? '' : undefined}
            style={{ ['--au-seg-count' as string]: options.length, ['--au-seg-index' as string]: index }}
            {...rest}
        >
            <span className="au-segmented__tile" aria-hidden="true" />
            {options.map((o, i) => {
                const on = o.value === value
                return (
                    <button
                        key={o.value}
                        ref={(el) => {
                            refs.current[i] = el
                        }}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        tabIndex={on ? 0 : -1}
                        disabled={o.disabled}
                        data-testid={o.testId}
                        className="au-segmented__option"
                        onClick={() => onChange(o.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                                e.preventDefault()
                                move(i, 1)
                            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                                e.preventDefault()
                                move(i, -1)
                            }
                        }}
                    >
                        {o.label}
                    </button>
                )
            })}
        </div>
    )
}
