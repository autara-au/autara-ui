import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * FieldStack — the unified field-group grammar (AUT-683).
 *
 * One hairline container holds every field, separated by internal
 * hairline dividers — the stack IS the card. Never nest it inside
 * another bordered panel. Built for marketing / conversion forms
 * (waitlist, lead capture); app-internal forms keep `Input` /
 * `.field-input`.
 *
 * Visual rules — see `utilities/forms.css` § Field stack:
 *   - Cell = sentence-case micro-label (0.75rem, weight 500, no
 *     letterspacing; AUTM-1483) + borderless input. The label is styled
 *     by `.field-stack-label` in forms.css, not by a class here.
 *   - Focus: cell tints warm-cream + 3px inset brand-purple bar
 *     (this grammar's stand-in for the 4px halo, which would clip
 *     against the container's `overflow: hidden`).
 *   - Invalid: bar + tint go error red, label follows.
 *
 * Composition:
 *
 *   <FieldStack>
 *     <FieldStackRow>
 *       <FieldStackField label="First name" name="firstName" required />
 *       <FieldStackField label="Last name" name="lastName" required />
 *     </FieldStackRow>
 *     <FieldStackField label="Email address" type="email" name="email" />
 *   </FieldStack>
 */

const FieldStack = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(function FieldStack({ className, ...props }, ref) {
    return (
        <div
            ref={ref}
            role="group"
            className={cn('field-stack glass-edge', className)}
            {...props}
        />
    )
})
FieldStack.displayName = 'FieldStack'

/** Two-up row inside a FieldStack — children split 50/50 with a hairline divider. */
const FieldStackRow = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(function FieldStackRow({ className, ...props }, ref) {
    return (
        <div
            ref={ref}
            className={cn('field-stack-row', className)}
            {...props}
        />
    )
})
FieldStackRow.displayName = 'FieldStackRow'

export interface FieldStackFieldProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'children'> {
    /**
     * Eyebrow micro-label rendered above the input. Required — this
     * grammar has no placeholder-only mode. Mark optional fields in the
     * label text itself (e.g. "Phone · optional").
     */
    label: string
    /** Inline error message; also sets `aria-invalid` on the input. */
    error?: string
    /**
     * Replaces the default `<input>` with a custom control (e.g. a
     * native `<select className="field-stack-input">`). Input props are
     * ignored when children are provided — wire the control yourself.
     */
    children?: React.ReactNode
    /** Class for the outer cell. `className` styles the input itself. */
    cellClassName?: string
}

const FieldStackField = React.forwardRef<
    HTMLInputElement,
    FieldStackFieldProps
>(function FieldStackField(
    {
        label,
        error,
        children,
        cellClassName,
        className,
        id,
        'aria-invalid': ariaInvalid,
        'aria-describedby': ariaDescribedBy,
        ...props
    },
    ref
) {
    const autoId = React.useId()
    const inputId = id ?? autoId
    const errorId = `${inputId}-error`
    return (
        <label
            className={cn('field-stack-cell', cellClassName)}
            htmlFor={children ? undefined : inputId}
        >
            <span className="field-stack-label">{label}</span>
            {children ?? (
                <input
                    ref={ref}
                    id={inputId}
                    className={cn('field-stack-input', className)}
                    aria-invalid={error ? true : ariaInvalid}
                    aria-describedby={error ? errorId : ariaDescribedBy}
                    {...props}
                />
            )}
            {error && (
                <span id={errorId} role="alert" className="field-stack-error">
                    {error}
                </span>
            )}
        </label>
    )
})
FieldStackField.displayName = 'FieldStackField'

export { FieldStack, FieldStackRow, FieldStackField }
