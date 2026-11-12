import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { FilterChipRow } from './FilterChipRow'

/** AUTM-1792: only a CHOSEN chip pops; the one on at first paint stays still. */
function Harness() {
    const [value, setValue] = useState('all')
    return (
        <FilterChipRow
            options={[
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
            ]}
            value={value}
            onChange={setValue}
        />
    )
}

describe('FilterChipRow pop (AUTM-1792)', () => {
    it('does not pop the chip selected on first render', () => {
        render(<Harness />)
        expect(screen.getByRole('tab', { name: 'All' }).className).not.toContain('motion-pop')
    })

    it('pops the chip the user chooses, and only that one', () => {
        render(<Harness />)
        fireEvent.click(screen.getByRole('tab', { name: 'Pending' }))
        expect(screen.getByRole('tab', { name: 'Pending' }).className).toContain('motion-pop')
        expect(screen.getByRole('tab', { name: 'All' }).className).not.toContain('motion-pop')
    })
})
