'use client'

import * as React from 'react'
import { installGlassEdge } from '../lib/glass-edge'
import { cn } from '../lib/cn'

/**
 * AUTM-2140 — the glass fields' lit edge, installed once at the app's root.
 *
 * Every field in the library (Input, Textarea, the selects and pickers, the
 * code boxes, the Google button) is drawn in `.glass-edge`: glass with a 1px
 * hairline that lights where the cursor is and carries a soft glint that
 * travels as the page scrolls. The stylesheet draws it; this sets where the
 * light is. Without it the fields are still glass, the glint parked, no
 * light.
 *
 *     <GlassEdgeTracker />   // once, beside the app's providers
 *
 * One listener for the whole app, not one per field; touch is ignored and
 * reduced motion parks the glint. See `lib/glass-edge.ts` for the cost.
 */
export function useGlassEdge(): void {
    React.useEffect(() => installGlassEdge(), [])
}

export function GlassEdgeTracker(): null {
    useGlassEdge()
    return null
}

export interface GlassFieldProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Paints the danger edge. A control inside with `aria-invalid` does too. */
    invalid?: boolean
    /** Dims the field and puts out its light. A disabled control inside does too. */
    disabled?: boolean
    /** A textarea or a wrapping group: the multi-line corner instead of the pill. */
    multiline?: boolean
}

/**
 * GlassField — the shell on its own, for a control the library does not
 * wrap (a third-party combobox, an autocomplete). Give the control inside
 * the `field-shell-control` class; the shell takes the margins and width.
 * Input and Textarea render one already.
 */
export const GlassField = React.forwardRef<HTMLSpanElement, GlassFieldProps>(function GlassField(
    { invalid, disabled, multiline, className, ...rest },
    ref,
) {
    return (
        <span
            ref={ref}
            data-slot="field"
            data-invalid={invalid ? '' : undefined}
            data-disabled={disabled ? '' : undefined}
            className={cn('field-shell glass-edge', multiline && 'field-shell--multi', className)}
            {...rest}
        />
    )
})
GlassField.displayName = 'GlassField'
