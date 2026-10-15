'use client'

import * as React from 'react'
import { cn } from '../lib/cn'

export interface StepperStep {
    id: string
    label: string
    /**
     * AUTM-1867: a line under the label in the vertical list (Wise's desktop
     * steps: what was chosen under a done step, what is asked under the
     * current one). Outside the step's button, so the label alone stays its
     * accessible name. Not drawn in the compact bars.
     */
    detail?: React.ReactNode
}

export interface StepperProps {
    steps: StepperStep[]
    /** 0-indexed. */
    currentStep: number
    onStepClick?: (index: number) => void
    /**
     * 0-indexed furthest step the user has actually REACHED, which can be
     * ahead of `currentStep` when they have stepped back.
     *
     * AUTM-744 — without this, "complete" was derived purely from position
     * relative to `currentStep`, so the moment someone navigated backwards
     * every step ahead of them turned into `upcoming` and stopped being
     * clickable. A merchant on Availability who clicked back to Business Info
     * to fix a typo had no tab to return by: the wizard offered two clickable
     * destinations, both backwards, and no way forward. The only escape was
     * typing the URL.
     *
     * Defaults to `currentStep`, so callers that do not track progress keep
     * exactly the old behaviour.
     */
    furthestStep?: number
    /** Disables navigation back to completed steps — e.g. a Review step that shouldn't allow backtracking. */
    locked?: boolean
    /**
     * Accessible name for the nav landmark. Defaults to "Onboarding progress"
     * (the original consumer); the customer booking wizard passes
     * "Booking progress".
     */
    ariaLabel?: string
    /**
     * Hide the numbered list and render the bars + "Step N of M" line at every
     * width — for wizards whose steps are validation-gated and never
     * clickable. Same as `compact`, kept for pinned consumers.
     */
    hideLabels?: boolean
    /** The sheet's "Stepper compact" at every width (AUTM-1594). */
    compact?: boolean
    className?: string
}

/*
 * AUTM-1594 — canvas v44 "Steps and progress". Numbered steps on desktop, a
 * bar with "Step N of M" on a phone:
 *
 *   below 64rem  one 4px bar per step, 6px apart, brand up to and including
 *                the current step and band after it; "Step N of M · Label"
 *                under it at 14px, 72% ink.
 *   from 64rem   an ordered list: a 28px disc beside each label (16px).
 *                Done is lime with a check, current is brand with its number
 *                and a Bold label, upcoming is band with a muted number and
 *                label. Reached steps are buttons when `onStepClick` is set.
 *
 * The 64rem switch is the one autara-customer-web's booking steps already
 * use. `compact` (or `hideLabels`) keeps the bars at every width.
 */
const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(function Stepper(
    {
        steps,
        currentStep,
        furthestStep,
        onStepClick,
        locked = false,
        ariaLabel = 'Onboarding progress',
        hideLabels = false,
        compact = false,
        className,
    },
    ref
) {
    const total = steps.length
    const clampedStep = Math.min(Math.max(currentStep, 0), Math.max(total - 1, 0))
    /* AUTM-744: the furthest reached step is never less than the current
       step, so a caller passing a stale or smaller value cannot make the
       current step unreachable. */
    const clampedFurthest = Math.min(
        Math.max(furthestStep ?? clampedStep, clampedStep),
        Math.max(total - 1, 0)
    )
    const current = steps[clampedStep]
    const barsOnly = compact || hideLabels

    return (
        <nav ref={ref} aria-label={ariaLabel} className={cn('w-full', className)}>
            {/* From 64rem the numbered list is what is SEEN, but the bars stay
                in the accessibility tree (sr-only, not hidden): the named
                progressbar and "Step N of M" are what assistive tech and
                merchant-web's a11y spec rely on at every width. Found by the
                merchant-web dry run under AUTM-1594. */}
            <div className={cn('flex flex-col gap-2', !barsOnly && 'lg:sr-only')}>
                <div
                    className="flex gap-1.5"
                    role="progressbar"
                    /* AUTM-1213: the bar carries the nav's name, so it never
                       announces "1 of 4" of nothing. */
                    aria-label={ariaLabel}
                    aria-valuenow={clampedStep + 1}
                    aria-valuemin={1}
                    aria-valuemax={total}
                    aria-valuetext={`Step ${clampedStep + 1} of ${total}: ${current?.label ?? ''}`}
                >
                    {steps.map((step, index) => (
                        <span
                            key={step.id}
                            aria-hidden="true"
                            data-filled={index <= clampedStep || undefined}
                            className={cn(
                                'h-1 flex-1 rounded-full transition-colors duration-300',
                                index <= clampedStep ? 'bg-[var(--brand)]' : 'bg-[var(--band)]'
                            )}
                        />
                    ))}
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                    Step {clampedStep + 1} of {total}
                    {current ? <> · {current.label}</> : null}
                </p>
            </div>
            {barsOnly ? null : (
                <ol className="hidden list-none flex-col p-0 lg:flex">
                    {steps.map((step, index) => {
                        const status =
                            index < clampedStep ? 'complete' : index === clampedStep ? 'current' : 'upcoming'
                        /* AUTM-744: a step ahead of the current one is navigable
                           when it has been reached, so the way forward exists
                           after stepping back. It still LOOKS upcoming. */
                        const clickable =
                            !locked && index !== clampedStep && index <= clampedFurthest && Boolean(onStepClick)
                        const row = (
                            <>
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold',
                                        status === 'complete' && 'bg-[var(--lime)] text-[var(--on-lime)]',
                                        status === 'current' && 'bg-[var(--brand)] text-[var(--on-brand)]',
                                        status === 'upcoming' && 'bg-[var(--band)] text-[var(--text-muted)]'
                                    )}
                                >
                                    {status === 'complete' ? <CheckIcon /> : index + 1}
                                </span>
                                <span
                                    className={cn(
                                        'text-base',
                                        status === 'current' ? 'font-bold text-[var(--text-strong)]' : 'font-medium',
                                        status === 'complete' && 'text-[var(--text-strong)]',
                                        status === 'upcoming' && 'text-[var(--text-muted)]'
                                    )}
                                >
                                    {/* The label alone is the accessible name: consumers
                                        and autara-web-automation find steps by it, so a
                                        suffix here would be a breaking change. */}
                                    {step.label}
                                </span>
                            </>
                        )
                        return (
                            <li key={step.id}>
                                {clickable ? (
                                    <button
                                        type="button"
                                        onClick={() => onStepClick?.(index)}
                                        className={cn(
                                            'flex min-h-10 w-full items-center gap-3 rounded-full py-1.5 pr-3 text-left transition-colors hover:bg-[var(--band)]',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]'
                                        )}
                                    >
                                        {row}
                                    </button>
                                ) : (
                                    <span
                                        aria-current={status === 'current' ? 'step' : undefined}
                                        className="flex min-h-10 items-center gap-3 py-1.5"
                                    >
                                        {row}
                                    </span>
                                )}
                                {step.detail ? (
                                    <div
                                        data-step-detail={step.id}
                                        className="pb-2 pl-10 text-[0.875rem] leading-snug text-[var(--text-muted)]"
                                    >
                                        {step.detail}
                                    </div>
                                ) : null}
                            </li>
                        )
                    })}
                </ol>
            )}
        </nav>
    )
})

Stepper.displayName = 'Stepper'

export { Stepper }
