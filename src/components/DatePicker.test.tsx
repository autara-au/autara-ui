import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { DatePicker } from './DatePicker'

const TODAY = '2026-09-09'

describe('DatePicker', () => {
    it('never reads the clock — the rail is built from the `today` it is given', () => {
        // The property this component exists to guarantee. A merchant in Perth
        // on a tablet still set to Sydney must see THEIR today, so the rail
        // has to start where the caller says and nowhere else.
        render(
            <DatePicker value="" today="2027-03-01" onChange={() => {}} stripDays={3} testId="d" />,
        )
        expect(screen.getByTestId('d-day-2027-03-01')).toBeTruthy()
        expect(screen.getByTestId('d-day-2027-03-03')).toBeTruthy()
        expect(screen.queryByTestId('d-day-2027-03-04')).toBeNull()
    })

    it('contains its own days, so a scrolling parent does not scroll sideways (AUTM-1373)', () => {
        // jsdom has no layout, so this pins the mechanism rather than the
        // measurement: the rail must be the containing block for the day
        // buttons' absolutely positioned sr-only labels. The measurement lives
        // in the InScrollingPanel story.
        render(<DatePicker value="" today={TODAY} onChange={() => {}} testId="d" />)
        const rail = screen.getByRole('radiogroup')
        expect(rail.className.split(/\s+/)).toContain('relative')
        expect(rail.className).toContain('overflow-x-auto')
    })

    it('starts at `min` when it is later than today', () => {
        render(
            <DatePicker
                value=""
                today={TODAY}
                min="2026-09-20"
                onChange={() => {}}
                stripDays={2}
                testId="d"
            />,
        )
        expect(screen.getByTestId('d-day-2026-09-20')).toBeTruthy()
        expect(screen.queryByTestId(`d-day-${TODAY}`)).toBeNull()
    })

    it('refuses a day the merchant cannot actually have', () => {
        const onChange = vi.fn()
        render(
            <DatePicker
                value=""
                today={TODAY}
                onChange={onChange}
                stripDays={5}
                dayState={(d) => (d === '2026-09-11' ? 'unavailable' : 'available')}
                testId="d"
            />,
        )
        const shut = screen.getByTestId('d-day-2026-09-11')
        expect(shut.getAttribute('aria-disabled')).toBe('true')
        fireEvent.click(shut)
        expect(onChange).not.toHaveBeenCalled()
    })

    it('treats a date past `max` as unavailable rather than silently accepting it', () => {
        const onChange = vi.fn()
        render(
            <DatePicker
                value=""
                today={TODAY}
                max="2026-09-10"
                onChange={onChange}
                stripDays={4}
                testId="d"
            />,
        )
        fireEvent.click(screen.getByTestId('d-day-2026-09-12'))
        expect(onChange).not.toHaveBeenCalled()
        fireEvent.click(screen.getByTestId('d-day-2026-09-10'))
        expect(onChange).toHaveBeenCalledWith('2026-09-10')
    })

    it('is one tab stop, not fourteen', () => {
        // A rail of separate tab stops is what makes a keyboard user give up.
        render(
            <DatePicker
                value="2026-09-11"
                today={TODAY}
                onChange={() => {}}
                stripDays={7}
                testId="d"
            />,
        )
        const days = screen.getAllByRole('radio')
        expect(days.filter((d) => d.getAttribute('tabindex') === '0')).toHaveLength(1)
        expect(screen.getByTestId('d-day-2026-09-11').getAttribute('tabindex')).toBe('0')
    })

    it('says availability in words, not only as a coloured dot', () => {
        // WCAG 1.4.1. The dot is aria-hidden, so without this a screen reader
        // is told nothing about why a day cannot be chosen.
        const { container } = render(
            <DatePicker
                value=""
                today={TODAY}
                onChange={() => {}}
                stripDays={3}
                dayState={(d) => (d === '2026-09-10' ? 'limited' : 'available')}
                testId="d"
            />,
        )
        expect(container.textContent).toContain('nearly full')
        expect(container.textContent).toContain('today')
    })

    it('marks the chosen day for assistive tech', () => {
        render(
            <DatePicker
                value="2026-09-10"
                today={TODAY}
                onChange={() => {}}
                stripDays={3}
                testId="d"
            />,
        )
        expect(screen.getByTestId('d-day-2026-09-10').getAttribute('aria-checked')).toBe('true')
        expect(screen.getByTestId('d-day-2026-09-09').getAttribute('aria-checked')).toBe('false')
    })
})

describe('DatePicker with a caller-written <label htmlFor> (AUTM-1267)', () => {
    it('carries the id on the group, is named by the label, and a click on the label focuses the day holding the tab stop without choosing it', () => {
        // Every merchant form writes `<Label htmlFor="invoice-due">` above the
        // picker because every other field on the form works that way. The
        // component used to ignore the id, so the label pointed at nothing.
        const onChange = vi.fn()
        render(
            <>
                <label htmlFor="invoice-due">Due date</label>
                <DatePicker id="invoice-due" value="" today={TODAY} onChange={onChange} stripDays={5} testId="d" />
            </>,
        )
        const group = screen.getByRole('radiogroup', { name: 'Due date' })
        expect(document.getElementById('invoice-due')).toBe(group)

        fireEvent.click(screen.getByText('Due date'))
        const active = screen.getAllByRole('radio').find((r) => r.getAttribute('tabindex') === '0')
        expect(active).toBeTruthy()
        expect(document.activeElement).toBe(active)
        // A label click must never pick a date: that is what focusing a plain
        // input does, and it is all the customer asked for.
        expect(onChange).not.toHaveBeenCalled()
    })

    it('keeps its own name when nothing points at its id', () => {
        render(<DatePicker id="lonely" value="" today={TODAY} onChange={() => {}} stripDays={3} label="Date" />)
        expect(screen.getByRole('radiogroup', { name: 'Date' }).id).toBe('lonely')
    })
})

describe('DatePicker month sheet navigation (AUTM-1266)', () => {
    it('names Back and Next by the words printed on them, so speech input can reach them', () => {
        // WCAG 2.5.3 Label in Name: "Previous month" as the accessible name of
        // a button that reads "Back" meant saying "click Back" did nothing.
        render(<DatePicker value="" today={TODAY} onChange={() => {}} testId="d" />)
        fireEvent.click(screen.getByTestId('d-more'))
        expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy()
        expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy()
        expect(screen.queryByRole('button', { name: /previous month/i })).toBeNull()
        expect(screen.queryByRole('button', { name: /next month/i })).toBeNull()
    })
})
