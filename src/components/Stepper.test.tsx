import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Stepper } from './Stepper'

/**
 * AUTM-744 — the wizard trapped a merchant who stepped back.
 *
 * Clickability used to be `status === 'complete'`, and `complete` meant
 * "index < currentStep". So the moment someone navigated backwards, every
 * step ahead of them became `upcoming` and stopped being clickable. A
 * merchant on Availability who clicked back to Business Info to fix a typo
 * had two clickable destinations, both backwards, and no way forward — the
 * only escape was typing the URL.
 *
 * `furthestStep` separates "where you are" from "how far you have been".
 */

const STEPS = [
    { id: 'business-info', label: 'Business Info' },
    { id: 'verification', label: 'Verification' },
    { id: 'availability', label: 'Availability' },
    { id: 'payment', label: 'Payment' },
    { id: 'review', label: 'Review' },
]

/** The label row is `sm:` and up, but jsdom renders it regardless. */
function tab(label: string) {
    return screen.getByText(label).closest('button')
}

describe('Stepper — furthestStep', () => {
    it('without furthestStep, behaves exactly as before', () => {
        render(<Stepper steps={STEPS} currentStep={2} onStepClick={() => {}} />)
        expect(tab('Business Info')).not.toBeNull()
        expect(tab('Verification')).not.toBeNull()
        expect(tab('Availability')).toBeNull() // current
        expect(tab('Payment')).toBeNull() // never visited
    })

    it('THE BUG: stepping back leaves a way forward again', () => {
        // The merchant reached Availability (2), then clicked back to
        // Business Info (0). Availability must still be clickable.
        render(
            <Stepper steps={STEPS} currentStep={0} furthestStep={2} onStepClick={() => {}} />,
        )
        expect(tab('Availability')).not.toBeNull()
        expect(tab('Verification')).not.toBeNull()
        expect(tab('Business Info')).toBeNull() // current
    })

    it('does not make steps the user never reached clickable', () => {
        render(
            <Stepper steps={STEPS} currentStep={0} furthestStep={2} onStepClick={() => {}} />,
        )
        expect(tab('Payment')).toBeNull()
        expect(tab('Review')).toBeNull()
    })

    it('clicking a step ahead reports its index', async () => {
        const onStepClick = vi.fn()
        render(
            <Stepper steps={STEPS} currentStep={0} furthestStep={2} onStepClick={onStepClick} />,
        )
        await userEvent.click(tab('Availability')!)
        expect(onStepClick).toHaveBeenCalledWith(2)
    })

    it('locked still wins over everything', () => {
        render(
            <Stepper
                steps={STEPS}
                currentStep={0}
                furthestStep={4}
                locked
                onStepClick={() => {}}
            />,
        )
        for (const s of STEPS) expect(tab(s.label)).toBeNull()
    })

    /**
     * A caller that passes a stale or smaller furthestStep must not be able to
     * strand the user — the floor is the current step, so behaviour degrades to
     * the old rule rather than to something worse.
     */
    it('a furthestStep behind the current step cannot strand anyone', () => {
        render(
            <Stepper steps={STEPS} currentStep={3} furthestStep={1} onStepClick={() => {}} />,
        )
        expect(tab('Business Info')).not.toBeNull()
        expect(tab('Availability')).not.toBeNull()
        expect(tab('Payment')).toBeNull() // current
    })
})

describe('AUTM-1867: a detail line under a step', () => {
    it('draws it under the label, outside the step button, so the label stays its name', () => {
        render(
            <Stepper
                currentStep={1}
                onStepClick={() => {}}
                steps={[
                    { id: 'what', label: 'What and when', detail: 'Express wash, Wed 14 Oct' },
                    { id: 'who', label: 'Who' },
                ]}
            />,
        )
        const button = screen.getByRole('button', { name: 'What and when' })
        expect(button.textContent).not.toContain('Express wash')
        const detail = screen.getByText('Express wash, Wed 14 Oct')
        expect(detail.closest('[data-step-detail]')?.getAttribute('data-step-detail')).toBe('what')
        expect(button.contains(detail)).toBe(false)
    })
})
