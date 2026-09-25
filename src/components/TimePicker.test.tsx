import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { TimePicker } from './TimePicker'

describe('TimePicker', () => {
    it('keeps an off-grid value selected instead of dropping it', () => {
        // A booking taken at 10:20 under a 15-minute interval, reopened after
        // the merchant moved to 30. Dropping it would render as though the
        // form had lost the time.
        render(
            <TimePicker
                value="10:20"
                startTime="09:00"
                endTime="12:00"
                intervalMinutes={30}
                onChange={() => {}}
                testId="t"
            />,
        )
        const slot = screen.getByTestId('t-slot-10:20')
        expect(slot.getAttribute('aria-checked')).toBe('true')
    })

    it('will not hand back a slot that is already taken', () => {
        const onChange = vi.fn()
        render(
            <TimePicker
                value=""
                startTime="09:00"
                endTime="11:00"
                onChange={onChange}
                slotState={(t) => (t === '10:00' ? 'unavailable' : 'available')}
                reasonFor={() => 'already booked'}
                testId="t"
            />,
        )
        fireEvent.click(screen.getByTestId('t-slot-10:00'))
        expect(onChange).not.toHaveBeenCalled()
        fireEvent.click(screen.getByTestId('t-slot-09:30'))
        expect(onChange).toHaveBeenCalledWith('09:30')
    })

    it('gives the reason, so "unavailable" is not the whole story', () => {
        const { container } = render(
            <TimePicker
                value=""
                startTime="09:00"
                endTime="10:00"
                onChange={() => {}}
                slotState={(t) => (t === '09:30' ? 'unavailable' : 'available')}
                reasonFor={() => 'already booked'}
                testId="t"
            />,
        )
        expect(container.textContent).toContain('already booked')
    })

    it('does not rely on colour alone to say a slot is gone', () => {
        render(
            <TimePicker
                value=""
                startTime="09:00"
                endTime="10:00"
                onChange={() => {}}
                slotState={(t) => (t === '09:30' ? 'unavailable' : 'available')}
                testId="t"
            />,
        )
        // Struck through as well as dimmed, so it survives greyscale.
        expect(screen.getByTestId('t-slot-09:30').className).toContain('line-through')
    })

    it('labels slots the way a merchant says them', () => {
        render(
            <TimePicker
                value=""
                startTime="13:00"
                endTime="14:00"
                onChange={() => {}}
                testId="t"
            />,
        )
        expect(screen.getByTestId('t-slot-13:00').textContent).toContain('1:00 pm')
    })

    it('is one tab stop', () => {
        render(
            <TimePicker
                value="10:00"
                startTime="09:00"
                endTime="12:00"
                onChange={() => {}}
                testId="t"
            />,
        )
        const slots = screen.getAllByRole('radio')
        expect(slots.filter((s) => s.getAttribute('tabindex') === '0')).toHaveLength(1)
    })

    it('disables every slot when the whole control is disabled', () => {
        const onChange = vi.fn()
        render(
            <TimePicker
                value=""
                startTime="09:00"
                endTime="10:00"
                disabled
                onChange={onChange}
                testId="t"
            />,
        )
        fireEvent.click(screen.getByTestId('t-slot-09:00'))
        expect(onChange).not.toHaveBeenCalled()
    })
    it('keeps a time on one line, so the grid rows stay level', () => {
        // Measured on the merchant app: at a 5.25rem column the content box
        // was 68px and "10:00 am" wrapped, giving rows of 44px and 47px in
        // the same grid. jsdom computes no layout, so the guard is the rule
        // that prevents it rather than the height it produced.
        render(
            <TimePicker
                value=""
                startTime="10:00"
                endTime="12:30"
                onChange={() => {}}
                testId="t"
            />,
        )
        expect(screen.getByTestId('t-slot-10:00').className).toContain('whitespace-nowrap')
    })
})

describe('TimePicker with a caller-written <label htmlFor> (AUTM-1267)', () => {
    it('carries the id on the group, is named by the label, and a click on the label focuses the slot holding the tab stop without choosing it', () => {
        const onChange = vi.fn()
        render(
            <>
                <label htmlFor="booking-time">Start time</label>
                <TimePicker id="booking-time" value="" onChange={onChange} startTime="09:00" endTime="10:00" testId="t" />
            </>,
        )
        const group = screen.getByRole('radiogroup', { name: 'Start time' })
        expect(document.getElementById('booking-time')).toBe(group)

        fireEvent.click(screen.getByText('Start time'))
        const active = screen.getAllByRole('radio').find((r) => r.getAttribute('tabindex') === '0')
        expect(active).toBeTruthy()
        expect(document.activeElement).toBe(active)
        expect(onChange).not.toHaveBeenCalled()
    })
})
