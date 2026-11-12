import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BookingPass } from './BookingPass'
import { DateTile, WhenBlock, dateTileParts } from './DateTile'
import { FactRows } from './FactRows'
import { MoneyBreakdown } from './MoneyBreakdown'
import { ProgressSteps } from './ProgressSteps'

/** Saturday 17 October 2026, 9:00 am in Melbourne (6:00 am in Perth). */
const AT = '2026-10-16T22:00:00.000Z'

describe('DateTile and WhenBlock (AUTM-1799)', () => {
    it("reads the day in the booking's zone, not the reader's", () => {
        expect(dateTileParts(AT, 'Australia/Melbourne')).toEqual({ weekday: 'Sat', day: '17', month: 'Oct' })
        expect(dateTileParts(AT, 'Australia/Perth')).toEqual({ weekday: 'Sat', day: '17', month: 'Oct' })
        // 2 am Saturday in Melbourne is 11 pm Friday in Perth.
        expect(dateTileParts('2026-10-16T15:00:00.000Z', 'Australia/Melbourne')?.weekday).toBe('Sat')
        expect(dateTileParts('2026-10-16T15:00:00.000Z', 'Australia/Perth')?.weekday).toBe('Fri')
    })

    it('draws nothing for a missing or unreadable time', () => {
        expect(dateTileParts(null)).toBeNull()
        expect(dateTileParts('not a date')).toBeNull()
        const { container } = render(<DateTile iso={null} />)
        expect(container).toBeEmptyDOMElement()
    })

    it('is decoration; the when is said in words', () => {
        render(<WhenBlock iso={AT} timeZone="Australia/Melbourne" dayLabel="Sat 17 Oct" time="9:00 am" sub="3 hr" testId="when" />)
        expect(document.querySelector('[data-slot="date-tile"]')).toHaveAttribute('aria-hidden')
        expect(screen.getByTestId('when')).toHaveTextContent('Sat 17 Oct, 9:00 am3 hr')
    })
})

describe('BookingPass (AUTM-1799)', () => {
    it('names the pro as a link, the service by its id, and holds when under the tear', () => {
        render(
            <BookingPass
                name="Fitzroy Paint Co"
                href="/m/fitzroy"
                sub="Paint correction"
                testId="pass"
                subTestId="service"
                when={<span>when</span>}
            />,
        )
        expect(screen.getByRole('region', { name: 'Your booking' })).toHaveAttribute('data-testid', 'pass')
        expect(screen.getByRole('link', { name: 'Fitzroy Paint Co' })).toHaveAttribute('href', '/m/fitzroy')
        expect(screen.getByTestId('service')).toHaveTextContent('Paint correction')
        expect(screen.getByText('when')).toBeInTheDocument()
    })

    it('without a time, there is no tear line', () => {
        const { container } = render(<BookingPass name="Fitzroy Paint Co" />)
        expect(container.querySelector('.border-dashed')).toBeNull()
    })
})

describe('FactRows (AUTM-1799)', () => {
    it('keeps every label as a dt beside its value', () => {
        const { container } = render(
            <FactRows rows={[{ key: 'w', icon: <svg />, label: 'Where', value: '41 Smith Street', testId: 'where' }]} />,
        )
        const row = container.querySelector('dl > div')!
        expect([...row.children].map((c) => c.tagName)).toEqual(['DT', 'DD'])
        expect(row.querySelector('dt')).toHaveTextContent('Where')
        expect(screen.getByTestId('where')).toHaveTextContent('41 Smith Street')
    })
})

describe('ProgressSteps with icons (AUTM-1799)', () => {
    it('draws only the current word and reads every step', () => {
        render(
            <ProgressSteps
                steps={['Sent', 'Accepted', 'The job', 'Paid']}
                current={1}
                label="Where your booking is"
                icons={[<i key="1" />, <i key="2" />, <i key="3" />, <i key="4" />]}
            />,
        )
        const items = screen.getAllByRole('listitem')
        expect(items.map((li) => li.getAttribute('data-state'))).toEqual(['done', 'current', 'todo', 'todo'])
        expect(items[1]).toHaveAttribute('aria-current', 'step')
        expect(items[1]).toHaveTextContent('Accepted')
        expect(items[0].querySelector('.sr-only')).toHaveTextContent('Sent')
        expect(items[1].querySelector('.sr-only')).toBeNull()
    })

    it('sets its columns by a variable, so very large text can fold it to two', () => {
        render(
            <ProgressSteps
                steps={['Sent', 'Accepted', 'The job']}
                current={0}
                icons={[<i key="1" />, <i key="2" />, <i key="3" />]}
            />,
        )
        const track = screen.getByRole('list')
        // An inline grid-template-columns would beat the @max-[20rem] class.
        expect(track.style.gridTemplateColumns).toBe('')
        expect(track.style.getPropertyValue('--steps')).toBe('3')
    })
})

describe('MoneyBreakdown chips (AUTM-1799)', () => {
    it('keeps the dt and dd pairs and says each tone', () => {
        const { container } = render(
            <MoneyBreakdown
                variant="chips"
                label="When you pay"
                rows={[
                    { label: 'On hold', value: '$54', tone: 'flight', testId: 'today' },
                    { label: 'After the job', value: '$126', testId: 'after' },
                ]}
            />,
        )
        expect(screen.getByTestId('today')).toHaveAttribute('data-tone', 'flight')
        expect(screen.getByTestId('after')).toHaveAttribute('data-tone', 'neutral')
        for (const row of container.querySelectorAll('dl > div')) {
            expect([...row.children].map((c) => c.tagName)).toEqual(['DT', 'DD'])
        }
    })

    it('keeps an amount whole', () => {
        const rows = [
            { label: 'On hold today', value: '$25.18', tone: 'flight' as const },
            { label: 'After the job', value: '$58.74' },
        ]
        const { container } = render(<MoneyBreakdown variant="chips" label="When you pay" rows={rows} />)
        const dd = container.querySelector('dd')!
        expect(dd.className).toContain('whitespace-nowrap')
        expect(dd.className).not.toContain('overflow-wrap:anywhere')
    })
})
