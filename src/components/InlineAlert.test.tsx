import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InlineAlert } from './InlineAlert'
import { NativeSelect } from './NativeSelect'
import { MoneyBreakdown } from './MoneyBreakdown'

/** AUTM-1185 — semantics the sweep relies on. */
describe('InlineAlert', () => {
    it('is assertive only when it is an error', () => {
        render(
            <>
                <InlineAlert tone="error" testId="e">
                    That code didn't match.
                </InlineAlert>
                <InlineAlert tone="success" testId="s">
                    Saved.
                </InlineAlert>
            </>,
        )
        expect(screen.getByTestId('e').getAttribute('role')).toBe('alert')
        expect(screen.getByTestId('s').getAttribute('role')).toBe('status')
    })
})

/**
 * AUTM-1472 — exactly one live region, whatever the consumer asks for. A
 * nested `role="status"` inside a `role="alert"` wrapper is announced twice
 * by some screen readers; the root is the only region, and `role` picks it.
 */
describe('InlineAlert live region', () => {
    const LIVE = '[role="alert"], [role="status"], [role="log"], [aria-live]'

    it.each([
        ['default error', { tone: 'error' as const }, 'alert'],
        ['default warning', { tone: 'warning' as const }, 'status'],
        ['warning that must interrupt', { tone: 'warning' as const, role: 'alert' as const }, 'alert'],
        ['error kept polite', { tone: 'error' as const, role: 'status' as const }, 'status'],
    ])('%s renders one region, role=%s', (_name, props, expected) => {
        const { container } = render(
            <InlineAlert {...props} title="This business may already be on Autara" action={<button type="button">Continue</button>}>
                An account at 14 Pitt Street already exists.
            </InlineAlert>,
        )
        const regions = container.querySelectorAll(LIVE)
        expect(regions).toHaveLength(1)
        expect(regions[0]).toBe(container.firstElementChild)
        expect(regions[0].getAttribute('role')).toBe(expected)
    })

    it('role="none" renders no region, so a consumer-owned one is the only one', () => {
        const { container } = render(
            <div role="alert" data-testid="wrapper">
                <InlineAlert tone="warning" role="none" testId="inner">
                    An account at 14 Pitt Street already exists.
                </InlineAlert>
            </div>,
        )
        expect(container.querySelectorAll('[role="alert"], [role="status"]')).toHaveLength(1)
        expect(screen.getByTestId('inner').hasAttribute('role')).toBe(false)
    })

    it('holds two actions side by side', () => {
        render(
            <InlineAlert
                tone="warning"
                role="alert"
                testId="dup"
                action={
                    <>
                        <button type="button">Continue</button>
                        <button type="button">Sign in instead</button>
                    </>
                }
            >
                An account at 14 Pitt Street already exists.
            </InlineAlert>,
        )
        const slot = screen.getByRole('button', { name: 'Continue' }).parentElement as HTMLElement
        expect(slot).toBe(screen.getByRole('button', { name: 'Sign in instead' }).parentElement)
        expect(slot.className).toContain('flex')
        expect(slot.className).toContain('flex-wrap')
        expect(slot.className).toContain('gap-2.5')
    })
})

describe('NativeSelect', () => {
    it('is a real select with the placeholder as a disabled empty option', () => {
        render(
            <NativeSelect placeholder="Choose a make" testId="make" aria-invalid="true">
                <option value="Toyota">Toyota</option>
            </NativeSelect>,
        )
        const el = screen.getByTestId('make') as HTMLSelectElement
        expect(el.tagName).toBe('SELECT')
        expect(el.value).toBe('')
        expect(el.options[0].disabled).toBe(true)
        expect(el.getAttribute('aria-invalid')).toBe('true')
        // AUTM-2140: the select is the glass shell's control; the shell (its
        // parent) is the field you see, and draws the danger edge.
        expect(el.className).toContain('field-shell-control')
        expect(el.parentElement?.className).toContain('field-shell glass-edge')
    })
})

describe('MoneyBreakdown', () => {
    it('reads as a definition list with the total last', () => {
        render(
            <MoneyBreakdown
                label="If you cancel now"
                rows={[{ label: 'Deposit paid', value: 'A$54.00', testId: 'row-deposit' }]}
                total={{ label: 'You get back', value: 'A$27.00', testId: 'row-total' }}
            />,
        )
        const values = screen.getAllByRole('definition')
        expect(values).toHaveLength(2)
        expect(values[0].tagName).toBe('DD')
        expect(screen.getByTestId('row-deposit').textContent).toContain('A$54.00')
        expect(screen.getByTestId('row-total').textContent).toContain('You get back')
    })
})
