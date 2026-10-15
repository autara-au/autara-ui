'use client'

import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * SwatchRadioGroup — pick one colour from a fixed palette (AUTM-1591, canvas
 * v50 "Calendar colour" on MpServiceForm / MpServiceFormPhone).
 *
 * The merchant's service colour: each swatch is a 44px circle in its colour;
 * the chosen one is ringed (2px paper, then 2px ink) and ticked in the
 * swatch's own text colour. Ten in a row on a wide screen, five on a phone.
 *
 * A real radio group: each swatch is a `<label>` wrapping an sr-only radio,
 * so arrow keys move between colours, Space picks one, the group is named by
 * its legend and each colour by its name ("Violet"), never by its hex.
 * Colour is never the only signal: the name is announced, shown on hover as
 * the title, and the consumer's `description` can repeat it ("Violet. Jobs
 * for this service show in this colour on your calendar.").
 *
 * The palette is the consumer's (`options`): this component owns the shape,
 * not the colours. Each option carries `ink`, the colour its text and tick
 * take on that swatch, so the consumer states the contrast pairing that its
 * own palette was tested for.
 *
 * Sizes are px, not rem, on purpose: a swatch is a target, not text, and ten
 * 88px circles at 200% text would scroll a phone sideways.
 */
export interface SwatchOption {
    /** Stable value reported on change, e.g. a palette key. */
    value: string
    /** The colour's name; the accessible name of its radio. */
    label: string
    /** The swatch fill, any CSS colour. */
    color: string
    /** The tick's colour on this swatch (the palette's text colour for it). */
    ink: string
    /**
     * Draw a hairline round the swatch: for a colour with no edge of its own
     * against the page (a white or silver car on white paper, AUTM-1870).
     */
    edge?: boolean
}

export interface SwatchRadioGroupProps {
    /** The radios' shared `name`. */
    name: string
    options: SwatchOption[]
    value: string | null
    onChange: (value: string) => void
    /** The group's visible legend, e.g. "Calendar colour". */
    label: React.ReactNode
    /** Hide the legend visually (it still names the group). */
    labelHidden?: boolean
    /** One line under the swatches. */
    description?: React.ReactNode
    disabled?: boolean
    /** Swatches per row from `sm` (default: all of them, up to 10). */
    columns?: number
    /** Swatches per row below `sm` (default: half, when there are more than 6). */
    compactColumns?: number
    /** `data-testid` on the fieldset; each swatch gets `${testId}-${value}`. */
    testId?: string
    /**
     * `md` (default) is the 44px swatch; `lg` is 56px, for a screen where the
     * colour is the main thing to choose (AUTM-1870, the car's paint).
     */
    size?: 'md' | 'lg'
    className?: string
}

const Tick = ({ color, size }: { color: string; size: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
)

export function SwatchRadioGroup({
    name,
    options,
    value,
    onChange,
    label,
    labelHidden = false,
    description,
    disabled = false,
    columns,
    compactColumns,
    testId,
    className,
    size = 'md',
}: SwatchRadioGroupProps) {
    const px = size === 'lg' ? 56 : 44
    const descriptionId = React.useId()
    const wide = columns ?? Math.min(options.length, 10)
    const narrow = compactColumns ?? (options.length > 6 ? Math.ceil(options.length / 2) : options.length)
    return (
        <fieldset
            data-testid={testId}
            disabled={disabled}
            aria-describedby={description ? descriptionId : undefined}
            className={cn('m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0', className)}
        >
            <legend
                className={cn(
                    'pb-2 text-[0.9375rem] font-medium text-[var(--text-strong)]',
                    labelHidden && 'sr-only'
                )}
            >
                {label}
            </legend>
            <div
                className="grid grid-cols-[repeat(var(--sw-narrow),var(--sw-size))] gap-3 sm:grid-cols-[repeat(var(--sw-wide),var(--sw-size))]"
                style={{ '--sw-narrow': narrow, '--sw-wide': wide, '--sw-size': `${px}px` } as React.CSSProperties}
            >
                {options.map((option) => {
                    const selected = option.value === value
                    return (
                        <label
                            key={option.value}
                            title={option.label}
                            data-testid={testId ? `${testId}-${option.value}` : undefined}
                            data-selected={selected || undefined}
                            className={cn(
                                'relative grid size-[var(--sw-size)] cursor-pointer place-items-center rounded-full transition-shadow',
                                // Keyboard focus sits outside the selection ring, so the two
                                // never read as one.
                                'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[6px] has-[:focus-visible]:outline-[var(--accent)]',
                                'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50'
                            )}
                            style={{
                                background: option.color,
                                boxShadow:
                                    [
                                        selected ? '0 0 0 2px var(--paper), 0 0 0 4px var(--text-strong)' : '',
                                        option.edge ? 'inset 0 0 0 1px var(--border-strong)' : '',
                                    ]
                                        .filter(Boolean)
                                        .join(', ') || undefined,
                            }}
                        >
                            <input
                                type="radio"
                                name={name}
                                value={option.value}
                                checked={selected}
                                onChange={() => onChange(option.value)}
                                className="sr-only"
                            />
                            <span className="sr-only">{option.label}</span>
                            {selected ? <Tick color={option.ink} size={size === 'lg' ? 22 : 16} /> : null}
                        </label>
                    )
                })}
            </div>
            {description ? (
                <p id={descriptionId} className="m-0 text-sm text-[var(--text-muted)]">
                    {description}
                </p>
            ) : null}
        </fieldset>
    )
}
