import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MoneyBreakdown } from './MoneyBreakdown'

/** AUTM-1856 (Don, 2026-10-13): no coloured money tiles; the state is a small solid badge. */
describe('MoneyBreakdown chips', () => {
    it('draws every chip on the neutral band card, whatever its tone', () => {
        render(
            <MoneyBreakdown
                variant="chips"
                label="Payment"
                rows={[
                    { label: 'Deposit', value: '$54', tone: 'money', state: 'Captured', testId: 'dep' },
                    { label: 'Deposit', value: '$54', tone: 'flight', state: 'On hold', testId: 'hold' },
                    { label: 'Balance', value: '$126', state: 'Balance due', testId: 'bal' },
                ]}
            />,
        )
        for (const id of ['dep', 'hold', 'bal']) {
            const chip = screen.getByTestId(id)
            expect(chip.className).toContain('bg-[var(--band)]')
            expect(chip.className).not.toMatch(/bg-\[var\(--(lime|aqua|brand)\)\]/)
        }
    })

    it('puts the state in a solid badge coloured by the tone, inside the dt', () => {
        render(
            <MoneyBreakdown
                variant="chips"
                rows={[
                    { label: 'Deposit', value: '$54', tone: 'money', state: 'Captured', testId: 'dep' },
                    { label: 'Deposit', value: '$54', tone: 'flight', state: 'On hold', testId: 'hold' },
                    { label: 'Balance', value: '$126', state: 'Balance due', testId: 'bal' },
                ]}
            />,
        )
        const captured = screen.getByText('Captured')
        expect(captured.className).toContain('bg-[var(--lime)]')
        expect(captured.closest('dt')).toBe(screen.getByTestId('dep').querySelector('dt'))
        expect(screen.getByText('On hold').className).toContain('bg-[var(--aqua)]')
        expect(screen.getByText('Balance due').className).toContain('bg-[var(--band-press)]')
        expect(screen.getByTestId('dep').querySelector('dt')?.textContent).toBe('DepositCaptured')
        expect(screen.getByTestId('dep').querySelector('dd')?.textContent).toBe('$54')
    })

    it('draws no badge for a row with no state', () => {
        render(<MoneyBreakdown variant="chips" rows={[{ label: 'Kept by the pro', value: '$27', tone: 'money', testId: 'k' }]} />)
        expect(screen.getByTestId('k').querySelector('[data-money-state]')).toBeNull()
    })
})

/** AUTM-1878: a chip's own action, in its own <dd> so the list stays valid. */
describe('MoneyBreakdown chip action', () => {
    it('draws the action inside its chip, after the amount, as a dd', () => {
        render(
            <MoneyBreakdown
                variant="chips"
                label="Deposit and balance"
                rows={[
                    {
                        label: 'After the job',
                        value: '$132.30',
                        state: 'Balance due',
                        testId: 'balance',
                        action: <button type="button">Send payment link</button>,
                    },
                ]}
            />,
        )
        const chip = screen.getByTestId('balance')
        const button = screen.getByRole('button', { name: 'Send payment link' })
        expect(chip.contains(button)).toBe(true)
        expect(button.parentElement?.tagName).toBe('DD')
        expect(chip.querySelectorAll('dd')).toHaveLength(2)
    })
})
