import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CommandMenu, matchesCommand, type CommandMenuGroup } from './CommandMenu'

function groups(onSelect = vi.fn()): CommandMenuGroup[] {
    return [
        {
            label: 'Go to',
            items: [
                { id: 'today', label: 'Today', onSelect },
                { id: 'bookings', label: 'Bookings', keywords: ['calendar'], onSelect },
            ],
        },
        { label: 'Actions', items: [{ id: 'new-invoice', label: 'New invoice', onSelect }] },
    ]
}

describe('matchesCommand', () => {
    it('matches every word in any order, across label, hint and keywords', () => {
        const item = { id: 'x', label: 'New invoice', hint: 'Money', keywords: ['bill'], onSelect: vi.fn() }
        expect(matchesCommand(item, '')).toBe(true)
        expect(matchesCommand(item, 'inv new')).toBe(true)
        expect(matchesCommand(item, 'BILL')).toBe(true)
        expect(matchesCommand(item, 'money new')).toBe(true)
        expect(matchesCommand(item, 'booking')).toBe(false)
    })
})

describe('CommandMenu', () => {
    it('is a combobox over a listbox, with the first option active', () => {
        render(<CommandMenu open onOpenChange={vi.fn()} groups={groups()} testId="jump" />)
        const input = screen.getByRole('combobox', { name: 'Jump to' })
        const options = screen.getAllByRole('option')
        expect(options).toHaveLength(3)
        expect(options[0]).toHaveAttribute('aria-selected', 'true')
        expect(input).toHaveAttribute('aria-activedescendant', options[0].id)
        expect(screen.getAllByRole('group')).toHaveLength(2)
    })

    it('filters as you type, by keyword too, and says when nothing matches', () => {
        render(<CommandMenu open onOpenChange={vi.fn()} groups={groups()} />)
        const input = screen.getByRole('combobox')
        fireEvent.change(input, { target: { value: 'calendar' } })
        expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Bookings'])
        fireEvent.change(input, { target: { value: 'zzz' } })
        expect(screen.queryAllByRole('option')).toHaveLength(0)
        expect(screen.getByRole('status')).toHaveTextContent('Nothing matches "zzz"')
    })

    it('moves with the arrows, wraps, and runs the active option on Enter, closing first', () => {
        const onSelect = vi.fn()
        const onOpenChange = vi.fn()
        render(<CommandMenu open onOpenChange={onOpenChange} groups={groups(onSelect)} />)
        const input = screen.getByRole('combobox')
        fireEvent.keyDown(input, { key: 'ArrowUp' })
        expect(screen.getAllByRole('option')[2]).toHaveAttribute('aria-selected', 'true')
        fireEvent.keyDown(input, { key: 'ArrowDown' })
        fireEvent.keyDown(input, { key: 'ArrowDown' })
        expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true')
        fireEvent.keyDown(input, { key: 'Enter' })
        expect(onOpenChange).toHaveBeenCalledWith(false)
        expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('runs an option on click', () => {
        const onSelect = vi.fn()
        render(<CommandMenu open onOpenChange={vi.fn()} groups={groups(onSelect)} />)
        fireEvent.click(screen.getByRole('option', { name: 'New invoice' }))
        expect(onSelect).toHaveBeenCalledTimes(1)
    })
})
