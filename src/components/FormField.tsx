import * as React from 'react'
import { Label } from './Label'
import { cn } from '../lib/cn'

/**
 * FormField — label + control + description + error, wired together.
 *
 * AUTM-935: it used to render those four as unconnected siblings, which
 * meant the wrapper every Autara form goes through did none of the four
 * things a form wrapper exists to do. A screen-reader user submitted the
 * form, the error appeared on screen, and nothing was announced; focusing
 * the field read the label alone, so they heard what the field was but
 * never what was wrong with it.
 *
 * It now:
 *   - generates a stable id (`useId`) when `htmlFor` is not supplied, so
 *     the label always points at something,
 *   - marks the control `aria-invalid` while `error` is set, which is
 *     also what fires the red `.field-input` treatment,
 *   - links description and error through `aria-describedby`,
 *   - announces the error via `role="alert"`,
 *   - gives `required` an accessible name instead of a bare red asterisk.
 *
 * Precedence is **caller wins**, deliberately. `id` and `aria-invalid`
 * are only filled in when absent, and `aria-describedby` is MERGED rather
 * than replaced — merchant-mobile's MeScreen points describedby at a
 * CharCount, and clobbering that would trade one announcement for another.
 *
 * Only the first element child is wired (that is the control; anything
 * after it is adornment like a CharCount). Pass `wireControl={false}` to
 * opt out entirely and get the pre-AUTM-935 behaviour.
 */
export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
    label?: string
    /** Explicit control id. Omit it and one is generated. */
    htmlFor?: string
    error?: string
    description?: string
    required?: boolean
    theme?: 'dark' | 'light'
    /**
     * Wire the first element child with id / aria-invalid /
     * aria-describedby / aria-required. Default `true`. Set `false` when
     * the child is a composite that manages its own ARIA (a radio group,
     * a third-party editor) and the cloned props would be misleading.
     */
    wireControl?: boolean
}

/** Merge describedby ids, dropping blanks and duplicates, order preserved. */
function mergeIds(...ids: (string | undefined | false)[]): string | undefined {
    const seen = new Set<string>()
    for (const group of ids) {
        if (!group) continue
        for (const id of String(group).split(/\s+/)) if (id) seen.add(id)
    }
    return seen.size ? [...seen].join(' ') : undefined
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
    (
        {
            className,
            label,
            htmlFor,
            error,
            description,
            required,
            theme = 'light',
            wireControl = true,
            children,
            ...props
        },
        ref
    ) => {
        const reactId = React.useId()
        const controlId = htmlFor ?? `field-${reactId}`
        const errorId = `${controlId}-error`
        const descriptionId = `${controlId}-description`
        const showDescription = Boolean(description) && !error

        /*
         * Wire the FIRST element child only. MeScreen renders
         * `<Input/><CharCount/>` inside one FormField — the Input is the
         * control, the CharCount is adornment that already owns its own id.
         */
        let wired = false
        const content = wireControl
            ? React.Children.map(children, (child) => {
                  if (wired || !React.isValidElement(child)) return child
                  wired = true
                  const own = child.props as Record<string, unknown>
                  return React.cloneElement(
                      child as React.ReactElement<Record<string, unknown>>,
                      {
                          id: (own.id as string | undefined) ?? controlId,
                          'aria-invalid':
                              own['aria-invalid'] ?? (error ? true : undefined),
                          'aria-required':
                              own['aria-required'] ?? (required || undefined),
                          'aria-describedby': mergeIds(
                              own['aria-describedby'] as string | undefined,
                              showDescription && descriptionId,
                              error && errorId
                          ),
                      }
                  )
              })
            : children

        return (
            <div ref={ref} className={cn('space-y-2', className)} {...props}>
                {label && (
                    <Label htmlFor={controlId} theme={theme}>
                        {label}
                        {required && (
                            <>
                                {/* The asterisk is decoration — it is the
                                    word that has to reach a screen reader. */}
                                <span aria-hidden="true" className="text-autara-error ml-0.5">
                                    *
                                </span>
                                <span className="sr-only"> (required)</span>
                            </>
                        )}
                    </Label>
                )}
                {content}
                {showDescription && (
                    <p
                        id={descriptionId}
                        className={cn(
                            // AUTM-2140: the inputs concept's help line, 13px
                            // at 72% ink, 8px under the field.
                            'text-[0.8125rem] leading-snug',
                            theme === 'dark'
                                ? 'text-white/60'
                                : 'text-[var(--text-muted)]'
                        )}
                    >
                        {description}
                    </p>
                )}
                {error && (
                    <p
                        id={errorId}
                        role="alert"
                        className="text-[0.8125rem] leading-snug text-[var(--danger)]"
                    >
                        {error}
                    </p>
                )}
            </div>
        )
    }
)
FormField.displayName = 'FormField'

export { FormField }
