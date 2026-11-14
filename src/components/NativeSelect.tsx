import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * NativeSelect — a real `<select>`, dressed as a field.
 *
 * The Radix `Select` is a listbox in a popover; it is the right control
 * for a rich list. It is NOT a `<select>`: Playwright's `selectOption`
 * cannot drive it, iOS does not give it the native picker wheel, and a
 * form that posts it needs a hidden input. A vehicle make, a cancel
 * reason, a state code: those want the native control (AUTM-1185).
 *
 * Same skin as `Input` (AUTM-2140): the span is the glass pill
 * (`.field-shell.glass-edge`, the lit hairline, the accent edge on focus and
 * the danger edge when the select carries `aria-invalid`), the select its
 * borderless control, a Solar chevron on the right. `className` styles the
 * field; `size` is kept for compatibility (one field height); the native
 * `size` attribute (visible rows) is deliberately not exposed.
 *
 * `placeholder` renders a disabled, empty first option so an unset select
 * reads as a prompt rather than as the first real choice.
 */
export interface NativeSelectProps
    extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    size?: 'md' | 'lg'
    placeholder?: string
    /** `data-testid` on the select element itself. */
    testId?: string
}

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
    (
        { className, size: _size = 'md', placeholder, testId, children, value, defaultValue, ...props },
        ref,
    ) => {
        const controlled = value !== undefined
        return (
            <span
                data-slot="field"
                data-disabled={props.disabled ? '' : undefined}
                className={cn('field-shell glass-edge', className)}
            >
                <select
                    ref={ref}
                    data-testid={testId}
                    data-slot="control"
                    className="field-shell-control cursor-pointer"
                    // Room for the chevron. Inline: the control's rule is
                    // unlayered and would outrank a utility.
                    style={{ paddingInlineEnd: '2.75rem' }}
                    value={controlled ? value : undefined}
                    defaultValue={
                        !controlled
                            ? defaultValue ?? (placeholder !== undefined ? '' : undefined)
                            : undefined
                    }
                    {...props}
                >
                    {placeholder !== undefined ? (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    ) : null}
                    {children}
                </select>
                {/* Solar Linear alt-arrow-down, on the muted ink. */}
                <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute right-[var(--field-pad)] top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </span>
        )
    },
)
NativeSelect.displayName = 'NativeSelect'

export { NativeSelect }
