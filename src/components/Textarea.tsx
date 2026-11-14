import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/cn'

/**
 * Textarea — the canonical multi-line field, on Input's glass (AUTM-2140).
 *
 * Renders a `.field-shell.field-shell--multi.glass-edge` around a borderless
 * `.field-shell-control--multi` textarea: the same glass, lit hairline,
 * focus and error edges as Input, with a 26px corner (half the field's
 * height) instead of the pill. As with Input, `className` and `style` go on
 * the field you see and everything else (ref, id, value, aria, data-testid,
 * rows, handlers) on the `<textarea>`; `textareaClassName` reaches the
 * textarea itself (a fixed height, `resize-none`).
 *
 * At least 96px tall, vertical resize.
 *
 * `theme` prop kept as a no-op for source compatibility.
 */
const textareaVariants = cva('field-textarea', {
    variants: {
        // Reserved for future size axis — keep the API parallel to Input.
        size: { md: '' },
    },
    defaultVariants: { size: 'md' },
})

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
        VariantProps<typeof textareaVariants> {
    /** @deprecated currently a no-op — the field follows `data-theme` */
    theme?: 'dark' | 'light'
    /** Classes for the `<textarea>` itself; `className` styles the field. */
    textareaClassName?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
    { className, style, size: _size, theme: _theme, textareaClassName, ...props },
    ref
) {
    const invalid = props['aria-invalid'] === true || props['aria-invalid'] === 'true'
    return (
        <span
            data-slot="field"
            data-invalid={invalid ? '' : undefined}
            data-disabled={props.disabled ? '' : undefined}
            className={cn('field-shell field-shell--multi glass-edge', className)}
            style={style}
        >
            <textarea
                ref={ref}
                data-slot="control"
                className={cn('field-shell-control field-shell-control--multi', textareaClassName)}
                {...props}
            />
        </span>
    )
})
Textarea.displayName = 'Textarea'

export { Textarea, textareaVariants }
