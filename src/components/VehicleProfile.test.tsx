import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { VehicleProfile } from './VehicleProfile'

/** AUTM-1878 follow-up: a car as a pro sees it. */
const vehicle = { make: 'Toyota', model: 'Corolla', body: 'SEDAN', color: 'White', year: 2021, registrationPlate: 'ABC123' }

describe('VehicleProfile', () => {
    it('draws the car, the customer, the jobs as rows that open, and the notes', () => {
        const open = vi.fn()
        render(
            <VehicleProfile
                vehicle={vehicle}
                customer={{ name: 'Roy Lim' }}
                jobs={[
                    { id: 'bk-1', when: 'Sat 17 Oct', title: 'Interior refresh', amount: '$80.00', current: true, onOpen: open, testId: 'job' },
                ]}
                notesTitle="Notes from Roy"
                notes={[{ id: 'n', text: 'Dog hair in the back', when: 'Sat 2 Aug' }]}
                testId="vehicle-profile"
            />,
        )
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Toyota Corolla')
        expect(screen.getByText('ABC123')).toBeInTheDocument()
        expect(screen.getByTestId('vehicle-profile-customer')).toHaveTextContent('Roy Lim')
        const row = screen.getByTestId('job')
        expect(row).toHaveTextContent('Sat 17 Oct')
        expect(row).toHaveTextContent('Interior refresh')
        expect(row).toHaveTextContent('This booking')
        expect(row).toHaveTextContent('$80.00')
        fireEvent.click(row)
        expect(open).toHaveBeenCalledTimes(1)
        expect(screen.getByRole('region', { name: 'Notes from Roy' })).toHaveTextContent('Dog hair in the back')
    })

    it('says there is no history for a car typed in on the booking, and nothing yet for an empty list', () => {
        const { rerender } = render(<VehicleProfile vehicle={vehicle} jobs={null} testId="vp" />)
        expect(screen.getByTestId('vp-no-history')).toBeInTheDocument()
        rerender(<VehicleProfile vehicle={vehicle} jobs={[]} testId="vp" />)
        expect(screen.getByTestId('vp-no-jobs')).toHaveTextContent('No other jobs on this car yet.')
    })

    it('a row without onOpen is not a button', () => {
        render(<VehicleProfile vehicle={vehicle} jobs={[{ id: 'a', when: 'Sat', title: 'Wash', testId: 'job' }]} />)
        expect(screen.getByTestId('job').tagName).toBe('DIV')
        expect(screen.queryByRole('button')).toBeNull()
    })
})
