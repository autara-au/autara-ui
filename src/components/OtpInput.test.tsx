import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { OtpInput, type OtpInputProps } from './OtpInput'

/**
 * AUTM-2140 R2 (Don's pick A1, 2026-11-14): one glass pill, six slots. The
 * markup moved; the contract did not: a named group, six real inputs named
 * "Digit N of 6" with `maxlength="1"` (QA asserts it), the OS autofill hook
 * on the first, paste and autofill spreading, arrows, Backspace, onComplete.
 */
function Host({ seed = '', onComplete, ...rest }: Partial<OtpInputProps> & { seed?: string }) {
    const [code, setCode] = useState(seed)
    return <OtpInput value={code} onChange={setCode} onComplete={onComplete} autoFocus={false} {...rest} />
}

const digit = (n: number) => screen.getByRole('textbox', { name: `Digit ${n} of 6` }) as HTMLInputElement
const values = () => screen.getAllByRole('textbox').map((el) => (el as HTMLInputElement).value).join('')

describe('OtpInput, one field with six slots (AUTM-2140 R2)', () => {
    it('is a named group of six inputs, each one digit, numeric, the first carrying one-time-code', () => {
        render(<Host />)
        const group = screen.getByRole('group', { name: 'Verification code' })
        const boxes = screen.getAllByRole('textbox')
        expect(boxes).toHaveLength(6)
        boxes.forEach((box, i) => {
            expect(group.contains(box)).toBe(true)
            expect(box.getAttribute('aria-label')).toBe(`Digit ${i + 1} of 6`)
            expect(box.getAttribute('maxlength')).toBe('1')
            expect(box.getAttribute('inputmode')).toBe('numeric')
            expect(box.getAttribute('autocomplete')).toBe(i === 0 ? 'one-time-code' : 'off')
        })
    })

    it('draws ONE glass pill around all six (the Input shell), split 3 and 3 by a dash', () => {
        const { container } = render(<Host />)
        const shells = container.querySelectorAll('.field-shell.glass-edge')
        expect(shells).toHaveLength(1)
        const pill = shells[0]
        expect(pill.classList.contains('otp-field')).toBe(true)
        for (const box of screen.getAllByRole('textbox')) expect(pill.contains(box)).toBe(true)
        const groups = pill.querySelectorAll('.otp-group')
        expect(groups).toHaveLength(2)
        expect(groups[0].querySelectorAll('input')).toHaveLength(3)
        expect(groups[1].querySelectorAll('input')).toHaveLength(3)
        const sep = pill.querySelector('.otp-sep')!
        expect(sep.getAttribute('aria-hidden')).toBe('true')
        expect(sep.previousElementSibling).toBe(groups[0])
        // The group is a plain wrapper around the pill, so a consumer's old
        // flex rule on [role=group] (justify, wrap, gap) lays out nothing.
        const group = screen.getByRole('group')
        expect(group.classList.contains('otp')).toBe(true)
        expect(group.firstElementChild).toBe(pill)
    })

    it('splits four slots 2 and 2, and a three-digit code is one run', () => {
        const { container, unmount } = render(<OtpInput value="" onChange={() => {}} length={4} autoFocus={false} />)
        expect([...container.querySelectorAll('.otp-group')].map((g) => g.querySelectorAll('input').length)).toEqual([2, 2])
        unmount()
        const three = render(<OtpInput value="" onChange={() => {}} length={3} autoFocus={false} />)
        expect(three.container.querySelectorAll('.otp-group')).toHaveLength(1)
        expect(three.container.querySelector('.otp-sep')).toBeNull()
    })

    it('sets the digit in rem, inline, so a consumer input rule cannot shrink it and 200% text grows it', () => {
        render(<Host />)
        for (const box of screen.getAllByRole('textbox')) expect((box as HTMLInputElement).style.fontSize).toBe('1.75rem')
    })

    it('marks a filled slot (no dot) and an empty one (the dot)', () => {
        render(<Host seed="48" />)
        const slots = screen.getAllByRole('textbox').map((b) => b.closest('.otp-slot')!)
        expect(slots.map((s) => s.hasAttribute('data-filled'))).toEqual([true, true, false, false, false, false])
        for (const s of slots) expect(s.querySelector('.otp-caret')?.getAttribute('aria-hidden')).toBe('true')
    })

    it('the error edge and the disabled look ride on the pill; each input keeps aria-invalid', () => {
        const { container, rerender } = render(<OtpInput value="" onChange={() => {}} invalid autoFocus={false} />)
        const pill = container.querySelector('.otp-field')!
        expect(pill.hasAttribute('data-invalid')).toBe(true)
        for (const box of screen.getAllByRole('textbox')) expect(box.getAttribute('aria-invalid')).toBe('true')
        rerender(<OtpInput value="" onChange={() => {}} disabled autoFocus={false} />)
        expect(pill.hasAttribute('data-invalid')).toBe(false)
        expect(pill.hasAttribute('data-disabled')).toBe(true)
        for (const box of screen.getAllByRole('textbox')) expect((box as HTMLInputElement).disabled).toBe(true)
    })

    it('focuses the first slot on mount by default', () => {
        render(<OtpInput value="" onChange={() => {}} />)
        expect(document.activeElement).toBe(digit(1))
    })

    it('typing advances slot by slot and fires onComplete once, with the code', async () => {
        const onComplete = vi.fn()
        render(<Host onComplete={onComplete} autoFocus />)
        await userEvent.keyboard('482915')
        expect(values()).toBe('482915')
        expect(onComplete).toHaveBeenCalledTimes(1)
        expect(onComplete).toHaveBeenCalledWith('482915')
        expect(document.activeElement).toBe(digit(6))
    })

    it('a paste spreads across the slots, digits only', () => {
        const onComplete = vi.fn()
        render(<Host onComplete={onComplete} />)
        fireEvent.paste(digit(1), { clipboardData: { getData: () => '482 915' } })
        expect(values()).toBe('482915')
        expect(onComplete).toHaveBeenCalledWith('482915')
    })

    it('an autofill of the whole code into the first slot spreads too', () => {
        const onComplete = vi.fn()
        render(<Host onComplete={onComplete} />)
        fireEvent.change(digit(1), { target: { value: '482915' } })
        expect(values()).toBe('482915')
        expect(onComplete).toHaveBeenCalledWith('482915')
    })

    it('Backspace clears the slot, then on an empty slot steps back and clears that one', async () => {
        render(<Host seed="482" />)
        digit(3).focus()
        await userEvent.keyboard('{Backspace}')
        expect(values()).toBe('48')
        expect(document.activeElement).toBe(digit(3))
        await userEvent.keyboard('{Backspace}')
        expect(values()).toBe('4')
        expect(document.activeElement).toBe(digit(2))
    })

    it('arrows move between filled slots and stop at the first empty one', async () => {
        render(<Host seed="482" />)
        digit(2).focus()
        await userEvent.keyboard('{ArrowLeft}')
        expect(document.activeElement).toBe(digit(1))
        await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
        expect(document.activeElement).toBe(digit(4))
        await userEvent.keyboard('{ArrowRight}')
        expect(document.activeElement).toBe(digit(4))
    })

    it('a slot past the first empty one sends focus back there, so the code has no hole', async () => {
        render(<Host seed="48" />)
        await userEvent.click(digit(5))
        expect(document.activeElement).toBe(digit(3))
        await userEvent.keyboard('2')
        expect(values()).toBe('482')
    })

    it('a press on the pill between slots lands in the slot the next digit goes to', () => {
        const { container } = render(<Host seed="48" />)
        fireEvent.mouseDown(container.querySelector('.otp-slots')!)
        expect(document.activeElement).toBe(digit(3))
    })

    it('a press on a disabled pill focuses nothing', () => {
        const { container } = render(<OtpInput value="" onChange={() => {}} disabled autoFocus={false} />)
        fireEvent.mouseDown(container.querySelector('.otp-slots')!)
        expect(document.activeElement).toBe(document.body)
    })

    it('a new key remounts it empty and back on the first slot (the reset after a wrong code)', () => {
        function Reset() {
            const [attempt, setAttempt] = useState(0)
            const [code, setCode] = useState('482915')
            return (
                <>
                    <OtpInput key={attempt} value={code} onChange={setCode} />
                    <button
                        type="button"
                        onClick={() => {
                            setCode('')
                            setAttempt((n) => n + 1)
                        }}
                    >
                        Reject
                    </button>
                </>
            )
        }
        render(<Reset />)
        fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
        expect(values()).toBe('')
        expect(document.activeElement).toBe(digit(1))
    })
})
