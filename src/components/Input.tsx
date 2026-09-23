import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/cn'

/**
 * Input — the canonical Autara text input. Renders the
 * `.field-input` utility class from `autara-ui/utilities/forms.css`,
 * which encodes the hairline border, the signature focus treatment, and
 * the `aria-invalid` red-ring state. Consumers who already import
 * `@autara-au/autara-ui/utilities` (every web app does) get the look
 * automatically.
 *
 * Visual rules — see [`autara-ui/CLAUDE.md` § Aesthetic invariants](../../CLAUDE.md):
 *   - 44 × full-width pill on cream surface (`size="md"`, default).
 *   - 48 × full-width on hero / onboarding panels (`size="lg"`).
 *   - Focus (v2.4): warm-cream tint + SOLID brand-purple border. No outer
 *     halo, no one-sided bar, never a doubled outline. AUT-686 retired the
 *     4px halo; this docblock still described it, which is the third copy of
 *     the stale claim PR #56 found in CLAUDE.md and forms.css.
 *   - Red border when `aria-invalid="true"`.
 *   - Disabled fills with `--surface-warm` and dims text.
 *
 * `surface="glass"` (AUTM-948) is for a field sitting DIRECTLY on the
 * gradient ground. A field inside a glass card stays opaque — see the
 * variant's own comment for why.
 *
 * `theme` prop preserved for source-level compatibility (was the
 * legacy axis switching between light cream and dark photo surfaces).
 * It is now a **no-op** — only the light treatment ships. A dark-
 * surface companion can land later without breaking consumers.
 */
const inputVariants = cva('field-input', {
    variants: {
        size: {
            md: '',
            lg: 'field-input--lg',
        },
        /**
         * AUTM-948 — `surface` (default) is the opaque field. `glass` is for
         * a field sitting DIRECTLY on the gradient ground: a nav search box,
         * a hero capture form, a filter bar over a bloom.
         *
         * A field INSIDE a glass card should stay `surface`. Two stacked
         * translucencies read as mud, and the card underneath already
         * supplies the blur. This is opt-in for exactly that reason.
         */
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
    extends Omit<
            React.InputHTMLAttributes<HTMLInputElement>,
            'size'
        >,
        VariantProps<typeof inputVariants> {
    /** @deprecated currently a no-op — dark companion deferred */
    theme?: 'dark' | 'light'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    function Input(
        { className, type = 'text', size, surface, theme: _theme, ...props },
        ref
    ) {
        return (
            <input
                ref={ref}
                type={type}
                className={cn(inputVariants({ size, surface }), className)}
                {...props}
            />
        )
    }
)
Input.displayName = 'Input'

export { Input, inputVariants }
