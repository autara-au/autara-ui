import * as React from 'react'
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

/**
 * AUTM-1373 — the rail's mouse affordance.
 *
 * QA's measurement was 806px of days in a 400px box with the scrollbar
 * suppressed and no arrows, so 7 of 14 days could not be reached with a mouse
 * and nothing said they were there. jsdom has no layout, so the geometry is
 * STATED here rather than measured: that is enough to pin the behaviour, which
 * is that the arrows appear only when there is somewhere to go, disable
 * themselves at each end, and never take a tab stop from the radiogroup. The
 * measurement itself belongs to the InScrollingPanel story.
 */
describe('DatePicker rail arrows (AUTM-1373)', () => {
    /** jsdom reports every box as 0x0; say what the browser would report. */
    function stateGeometry(
        rail: HTMLElement,
        geometry: { scrollWidth: number; clientWidth: number; scrollLeft: number },
    ) {
        for (const [key, value] of Object.entries(geometry)) {
            Object.defineProperty(rail, key, { value, configurable: true })
        }
        fireEvent.scroll(rail)
    }

    it('offers no arrows at all while the whole rail fits', () => {
        // The default in jsdom is a rail that measures 0 in a box of 0, which
        // is the "nothing to scroll" case.
        render(<DatePicker value="" today={TODAY} onChange={() => {}} stripDays={3} testId="d" />)
        expect(screen.queryByTestId('d-earlier')).toBeNull()
        expect(screen.queryByTestId('d-later')).toBeNull()
    })

    it('shows both arrows once the days overflow, with the one that can do nothing disabled', () => {
        render(<DatePicker value="" today={TODAY} onChange={() => {}} testId="d" />)
        stateGeometry(screen.getByRole('radiogroup'), {
            scrollWidth: 806,
            clientWidth: 400,
            scrollLeft: 0,
        })
        // At the near end: forward is live, back has nowhere to go and says so
        // rather than looking pressable.
        expect(screen.getByTestId('d-later')).not.toBeDisabled()
        expect(screen.getByTestId('d-earlier')).toBeDisabled()
    })

    it('disables the forward arrow at the far end', () => {
        render(<DatePicker value="" today={TODAY} onChange={() => {}} testId="d" />)
        stateGeometry(screen.getByRole('radiogroup'), {
            scrollWidth: 806,
            clientWidth: 400,
            scrollLeft: 406,
        })
        expect(screen.getByTestId('d-later')).toBeDisabled()
        expect(screen.getByTestId('d-earlier')).not.toBeDisabled()
    })

    it('scrolls the rail forward and back by whole days', () => {
        render(<DatePicker value="" today={TODAY} onChange={() => {}} testId="d" />)
        const rail = screen.getByRole('radiogroup')
        const scrollBy = vi.fn()
        rail.scrollBy = scrollBy
        stateGeometry(rail, { scrollWidth: 806, clientWidth: 400, scrollLeft: 200 })

        fireEvent.click(screen.getByTestId('d-later'))
        // A day pill measures 0 in jsdom, so this is the floor: a third of the
        // box, three of them.
        expect(scrollBy).toHaveBeenCalledWith({ left: 399, behavior: 'smooth' })
        fireEvent.click(screen.getByTestId('d-earlier'))
        expect(scrollBy).toHaveBeenLastCalledWith({ left: -399, behavior: 'smooth' })
    })

    it('keeps the radiogroup at one tab stop and stays out of the keyboard path', () => {
        // The reason the arrows are aria-hidden and tabIndex -1: the rail
        // already answers to arrow keys, and two more tab stops in a form is a
        // worse trade than a mouse-only affordance that duplicates nothing.
        render(<DatePicker value="" today={TODAY} onChange={() => {}} testId="d" />)
        const rail = screen.getByRole('radiogroup')
        stateGeometry(rail, { scrollWidth: 806, clientWidth: 400, scrollLeft: 0 })
        for (const id of ['d-earlier', 'd-later']) {
            expect(screen.getByTestId(id).getAttribute('tabindex')).toBe('-1')
            expect(screen.getByTestId(id).getAttribute('aria-hidden')).toBe('true')
        }
        expect(rail.querySelectorAll('[role="radio"][tabindex="0"]')).toHaveLength(1)
    })

    it('never offers an arrow on a disabled picker', () => {
        render(
            <DatePicker value="" today={TODAY} onChange={() => {}} disabled testId="d" />,
        )
        stateGeometry(screen.getByRole('radiogroup'), {
            scrollWidth: 806,
            clientWidth: 400,
            scrollLeft: 200,
        })
        expect(screen.getByTestId('d-earlier')).toBeDisabled()
        expect(screen.getByTestId('d-later')).toBeDisabled()
    })
})

/**
 * AUTM-1633 — any date, and the rail follows it.
 *
 * Don: "dates are very limited but I like the UI". The rail stays the primary
 * control; the month opens from a real button, and a day chosen there that the
 * rail does not hold moves the rail to hold it, selected.
 */
describe('DatePicker any date (AUTM-1633)', () => {
    function Controlled(props: { initial?: string; dayState?: (d: string) => 'available' | 'closed' | 'full' }) {
        const [value, setValue] = React.useState(props.initial ?? '')
        return (
            <DatePicker
                value={value}
                today={TODAY}
                onChange={setValue}
                dayState={props.dayState}
                calendarNote="Muted days are outside your hours."
                testId="d"
            />
        )
    }

    it('offers the month as a named button that opens a "Pick a date" dialog', () => {
        render(<Controlled />)
        const open = screen.getByRole('button', { name: 'Pick a date' })
        expect(open).toBe(screen.getByTestId('d-more'))
        expect(open.getAttribute('aria-haspopup')).toBe('dialog')
        fireEvent.click(open)
        const dialog = screen.getByRole('dialog', { name: 'Pick a date' })
        expect(dialog.textContent).toContain('Muted days are outside your hours.')
        expect(screen.getByTestId('d-calendar')).toBe(dialog)
    })

    it('moves the rail to a day chosen beyond it, selected, three days in', () => {
        render(<Controlled />)
        expect(screen.queryByTestId('d-day-2026-11-20')).toBeNull()
        fireEvent.click(screen.getByTestId('d-more'))
        fireEvent.click(screen.getByRole('button', { name: 'Next' }))
        fireEvent.click(screen.getByTestId('d-cell-2026-10-20'))
        // The calendar closes on a pick: its disappearance is the proof.
        expect(screen.queryByRole('dialog')).toBeNull()
        expect(screen.getByTestId('d-day-2026-10-20').getAttribute('aria-checked')).toBe('true')
        // Today's fortnight is 9 to 22 September, so 20 October is beyond it
        // and the rail starts three days before the chosen day.
        const days = screen.getAllByRole('radio').map((r) => r.getAttribute('data-day'))
        expect(days[0]).toBe('2026-10-17')
        expect(days).toHaveLength(14)
        expect(screen.getByTestId('d-day-2026-10-20').getAttribute('tabindex')).toBe('0')
    })

    it('keeps a moved rail where it is when another day on it is tapped', () => {
        render(<Controlled initial="2026-12-10" />)
        expect(screen.getAllByRole('radio')[0].getAttribute('data-day')).toBe('2026-12-07')
        fireEvent.click(screen.getByTestId('d-day-2026-12-15'))
        expect(screen.getAllByRole('radio')[0].getAttribute('data-day')).toBe('2026-12-07')
        expect(screen.getByTestId('d-day-2026-12-15').getAttribute('aria-checked')).toBe('true')
    })

    it('returns the rail to today’s fortnight when a near day is chosen from the month', () => {
        render(<Controlled initial="2026-12-10" />)
        fireEvent.click(screen.getByTestId('d-more'))
        fireEvent.click(screen.getByRole('button', { name: 'Back' }))
        fireEvent.click(screen.getByRole('button', { name: 'Back' }))
        fireEvent.click(screen.getByRole('button', { name: 'Back' }))
        expect(screen.getByText('September 2026')).toBeTruthy()
        fireEvent.click(screen.getByTestId('d-cell-2026-09-12'))
        expect(screen.getAllByRole('radio')[0].getAttribute('data-day')).toBe(TODAY)
        expect(screen.getByTestId('d-day-2026-09-12').getAttribute('aria-checked')).toBe('true')
    })

    it('lets a closed day be taken from the rail, and says it is closed', () => {
        render(<Controlled dayState={(d) => (d === '2026-09-13' ? 'closed' : 'available')} />)
        const sunday = screen.getByTestId('d-day-2026-09-13')
        expect(sunday.getAttribute('aria-disabled')).toBeNull()
        expect(sunday.textContent).toContain('closed')
        fireEvent.click(sunday)
        expect(sunday.getAttribute('aria-checked')).toBe('true')
    })

    it('dims a day with no free times, names it, and still lets it be taken (AUTM-1867)', () => {
        render(<Controlled dayState={(d) => (d === '2026-09-10' ? 'full' : d === '2026-09-13' ? 'closed' : 'available')} />)
        const full = screen.getByTestId('d-day-2026-09-10')
        expect(full.getAttribute('aria-disabled')).toBeNull()
        expect(full.textContent).toContain('no free times')
        // Dimmed ink, and no hatch: the hatch is the closed day's sign alone.
        expect(full.className).toContain('text-[var(--text-muted)]')
        expect(full.getAttribute('style')).toBeNull()
        expect(screen.getByTestId('d-day-2026-09-13').getAttribute('style')).toContain('repeating-linear-gradient')
        // Arrow keys still land on it: it is one of the rail's radios.
        expect(screen.getAllByRole('radio').map((r) => r.getAttribute('data-day'))).toContain('2026-09-10')
        fireEvent.click(full)
        expect(full.getAttribute('aria-checked')).toBe('true')
        expect(full.className).not.toContain('text-[var(--text-muted)]')
    })

    it('says the year beside a chosen day only when it is not this year', () => {
        // Read off the row beside the button: the rail's own sr-only labels
        // carry the same words for every day.
        const label = () => screen.getByTestId('d-more').parentElement?.textContent
        const { unmount } = render(<Controlled initial="2026-09-20" />)
        expect(label()).toBe('Pick a dateSunday 20 September')
        unmount()
        render(<Controlled initial="2027-01-08" />)
        expect(label()).toBe('Pick a dateFriday 8 January 2027')
    })

    it('scrolls a chosen day that sits off the visible rail into view', () => {
        // jsdom has no layout, so the geometry is stated: a 400px rail whose
        // tenth pill starts at 560px. Choosing it must bring it into the box.
        const offsets = new Map<string, number>()
        const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetLeft')
        const originalWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
        Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
            configurable: true,
            get() {
                return offsets.get(this.getAttribute?.('data-day') ?? '') ?? 0
            },
        })
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
            configurable: true,
            get() {
                return this.getAttribute?.('data-day') ? 52 : 0
            },
        })
        try {
            for (let i = 0; i < 14; i++) offsets.set(addDaysLocal(TODAY, i), i * 58)
            const { rerender } = render(
                <DatePicker value="" today={TODAY} onChange={() => {}} testId="d" />,
            )
            const rail = screen.getByRole('radiogroup')
            Object.defineProperty(rail, 'clientWidth', { value: 400, configurable: true })
            rail.scrollLeft = 0
            rerender(<DatePicker value="2026-09-18" today={TODAY} onChange={() => {}} testId="d" />)
            // Day 9 sits at 522..574; the box must end at or past 574.
            expect(rail.scrollLeft).toBe(574 - 400)
        } finally {
            if (original) Object.defineProperty(HTMLElement.prototype, 'offsetLeft', original)
            if (originalWidth) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalWidth)
        }
    })
})

function addDaysLocal(date: string, days: number): string {
    const d = new Date(`${date}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + days)
    return d.toISOString().slice(0, 10)
}
