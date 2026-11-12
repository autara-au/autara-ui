"use client";

'use client'

import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * MultiSelect — token-style multi-value picker on the Autara cream
 * canvas. Container matches the `.field-input` grammar (hairline
 * border, 4 px brand-purple halo on focus-within, aria-invalid red
 * ring). Chips reuse the brand-tinted MetaChip grammar.
 *
 * Behaviour kept from the v1.0.x implementation:
 *   - Free-text filter typed inline alongside the chips
 *   - `Backspace` on empty input removes the last chip
 *   - `Enter` selects the top filtered result
 *   - `Escape` closes the dropdown and blurs
 *   - Click outside closes the dropdown
 *
 * `theme` prop preserved for source-level compatibility but is
 * currently a **no-op** — only the light treatment ships; dark
 * companion deferred.
 */

interface MultiSelectOption {
    label: string
    value: string
}

interface MultiSelectProps {
    options: MultiSelectOption[]
    value?: string[]
    onChange?: (value: string[]) => void
    placeholder?: string
    /** @deprecated currently a no-op — dark companion deferred */
    theme?: 'dark' | 'light'
    className?: string
    disabled?: boolean
    'aria-invalid'?: boolean | 'true' | 'false'
    id?: string
}

const ChipCloseIcon: React.FC = () => (
    <svg
        aria-hidden
        viewBox="0 0 24 24"
        width="10"
        height="10"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
    >
        <path d="M6 6l12 12M18 6L6 18" />
    </svg>
)

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
    function MultiSelect(
        {
            options,
            value = [],
            onChange,
            placeholder = 'Select…',
            theme: _theme,
            className,
            disabled,
            'aria-invalid': ariaInvalid,
            id,
        },
        ref
    ) {
        const [isOpen, setIsOpen] = React.useState(false)
        const [search, setSearch] = React.useState('')
        const containerRef = React.useRef<HTMLDivElement>(null)
        const inputRef = React.useRef<HTMLInputElement>(null)

        const selected = value
        const setSelected = (next: string[]) => onChange?.(next)

        const filteredOptions = options.filter(
            (opt) =>
                !selected.includes(opt.value) &&
                opt.label.toLowerCase().includes(search.toLowerCase())
        )

        const handleSelect = (optionValue: string) => {
            setSelected([...selected, optionValue])
            setSearch('')
            inputRef.current?.focus()
        }

        const handleRemove = (optionValue: string) => {
            setSelected(selected.filter((v) => v !== optionValue))
        }

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Backspace' && search === '' && selected.length > 0) {
                handleRemove(selected[selected.length - 1])
            }
            if (e.key === 'Escape') {
                setIsOpen(false)
                inputRef.current?.blur()
            }
            if (e.key === 'Enter' && filteredOptions.length > 0) {
                e.preventDefault()
                handleSelect(filteredOptions[0].value)
            }
        }

        // Close on click outside.
        React.useEffect(() => {
            const handler = (e: MouseEvent) => {
                if (
                    containerRef.current &&
                    !containerRef.current.contains(e.target as Node)
                ) {
                    setIsOpen(false)
                }
            }
            document.addEventListener('mousedown', handler)
            return () => document.removeEventListener('mousedown', handler)
        }, [])

        const getLabel = (val: string) =>
            options.find((o) => o.value === val)?.label ?? val

        const invalid = ariaInvalid === true || ariaInvalid === 'true'

        return (
            <div
                ref={containerRef}
                className={cn('relative', className)}
            >
                <div
                    ref={ref}
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-invalid={ariaInvalid}
                    onClick={() => {
                        if (disabled) return
                        inputRef.current?.focus()
                        setIsOpen(true)
                    }}
                    className={cn(
                        'flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-lg border bg-[var(--surface)] px-2.5 py-1.5 text-sm transition-colors',
                        'cursor-text',
                        // Autara focus signature — cream tint + 3px inset
                        // brand-purple bar (matches .field-input / FieldStack).
                        invalid
                            ? 'border-[var(--color-autara-error)] focus-within:bg-[var(--intent-error-soft)]'
                            : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)] focus-within:border-[var(--accent)] focus-within:bg-[var(--surface-warm)]',
                        disabled &&
                            'cursor-not-allowed bg-[var(--surface-warm)] opacity-70'
                    )}
                >
                    {selected.map((val) => (
                        <span
                            key={val}
                            /* Torph ink capsule — the Autara floating-chip
                               grammar: ink fill, inverse text.

                               AUTM-974 dropped the `ring-1 ring-inset` that
                               used to sit on top of it. The fill is opaque
                               and 15:1 from the field it sits in, so the ring
                               was decorating a solid rather than defining an
                               edge, and rule 4 of the Autara Glass direction
                               only exempts a hairline that is the MATERIAL of
                               a translucent surface. Tooltip and Toast keep
                               theirs deliberately: those float over arbitrary
                               page content, this one sits inside a field we
                               control. */
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium',
                                'bg-[var(--surface-inverse)] text-[var(--text-on-inverse)]'
                            )}
                        >
                            {getLabel(val)}
                            {!disabled && (
                                <button
                                    type="button"
                                    aria-label={`Remove ${getLabel(val)}`}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemove(val)
                                    }}
                                    className="grid h-4 w-4 place-items-center rounded-full text-white/55 transition-colors hover:bg-white/15 hover:text-white"
                                >
                                    <ChipCloseIcon />
                                </button>
                            )}
                        </span>
                    ))}
                    <input
                        ref={inputRef}
                        id={id}
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setIsOpen(true)
                        }}
                        onFocus={() => setIsOpen(true)}
                        onKeyDown={handleKeyDown}
                        placeholder={selected.length === 0 ? placeholder : ''}
                        disabled={disabled}
                        className={cn(
                            'min-w-[80px] flex-1 bg-transparent text-sm text-[var(--text-strong)] outline-none',
                            'placeholder:text-[var(--text-subtle)]',
                            'disabled:cursor-not-allowed'
                        )}
                    />
                </div>

                {isOpen && !disabled && filteredOptions.length > 0 && (
                    <div
                        role="listbox"
                        className="floating-surface absolute left-0 right-0 top-full z-50 mt-1.5 max-h-60 overflow-auto rounded-xl border bg-[var(--surface)] p-1"
                    >
                        {filteredOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                role="option"
                                aria-selected="false"
                                onClick={() => handleSelect(opt.value)}
                                className="w-full rounded-md px-3 py-2 text-left text-sm text-[var(--text-strong)] transition-colors hover:bg-[var(--surface-elevated)]"
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}

                {isOpen && !disabled && filteredOptions.length === 0 && search && (
                    <div className="floating-surface absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border bg-[var(--surface)] p-3">
                        <p className="text-sm text-[var(--text-muted)]">
                            No results for &ldquo;{search}&rdquo;
                        </p>
                    </div>
                )}
            </div>
        )
    }
)

export { MultiSelect, type MultiSelectOption, type MultiSelectProps }
