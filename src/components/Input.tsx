import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/cn'

/**
 * Input — the canonical Autara text input: the glass pill (AUTM-2140, Don
 * 2026-11-14, shape A of the inputs concept, the Jump to shape).
 *
 * Renders a `.field-shell.glass-edge` around a borderless
 * `.field-shell-control` (`utilities/forms.css`). The shell is the field you
 * see, because an `<input>` cannot draw the lit hairline (no pseudo-elements):
 *   - `className` and `style` go on the SHELL: margins, width and flex land
 *     on the visible field. Type set there (`text-center`, `tabular-nums`) is
 *     inherited by the input. `inputClassName` reaches the input itself.
 *   - `ref`, `id`, `name`, `value`, every `aria-*` and `data-*` (so every
 *     `data-testid`) and every handler go on the `<input>`, as before.
 *
 * Look: 52px, fully round, glass fill with a 1px top lip, no ring at rest.
 * The hairline lights under the cursor (with `<GlassEdgeTracker />` at the
 * app's root) and carries a glint that travels on scroll. Focus is the edge
 * in the accent at 75% and a faint accent tint, no halo. `aria-invalid` is
 * the danger edge. Disabled dims to 60%.
 *
 * `leadingIcon` sits over the start of the field (decorative, the input
 * still takes the press); `trailing` sits after the input (a unit, a hint,
 * a clear control).
 *
 * `size` and `surface` are kept for source compatibility: there is one
 * field height (AUTM-1594) and every field is glass (AUTM-2140). `theme` is
 * a no-op; the field follows `data-theme`.
 */
const inputVariants = cva('field-input', {
    variants: {
        size: {
            md: '',
            lg: 'field-input--lg',
        },
        /** @deprecated every field is glass since AUTM-2140; kept so it compiles. */
        surface: {
            surface: '',
            glass: 'field-input--glass',
        },
    },
    defaultVariants: {
        size: 'md',
        surface: 'surface',
    },
})

export interface InputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
        VariantProps<typeof inputVariants> {
    /** @deprecated currently a no-op — the field follows `data-theme` */
    theme?: 'dark' | 'light'
    /** Classes for the `<input>` itself; `className` styles the field. */
    inputClassName?: string
    /** A glyph over the start of the field, e.g. a magnifier. Decorative. */
    leadingIcon?: React.ReactNode
    /** Content after the input inside the field: a unit, a shortcut hint. */
    trailing?: React.ReactNode
}

function isTrue(v: unknown): boolean {
    return v === true || v === 'true'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
    {
        className,
        style,
        type = 'text',
        size: _size,
        surface: _surface,
        theme: _theme,
        inputClassName,
        leadingIcon,
        trailing,
        ...props
    },
    ref
) {
    // A hidden input draws nothing.
    if (type === 'hidden') return <input ref={ref} type="hidden" {...props} />
    return (
        <span
            data-slot="field"
            data-invalid={isTrue(props['aria-invalid']) ? '' : undefined}
            data-disabled={props.disabled ? '' : undefined}
            className={cn('field-shell glass-edge', className)}
            style={style}
        >
            {leadingIcon ? (
                <span aria-hidden className="field-shell-leading">
                    {leadingIcon}
                </span>
            ) : null}
            <input
                ref={ref}
                type={type}
                data-slot="control"
                className={cn('field-shell-control', inputClassName)}
                {...props}
            />
            {trailing ? <span className="field-shell-trailing">{trailing}</span> : null}
        </span>
    )
})
Input.displayName = 'Input'

export { Input, inputVariants }
