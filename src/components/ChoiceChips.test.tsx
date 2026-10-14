import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ChoiceChips } from './ChoiceChips'

/** AUTM-1867. */
describe('ChoiceChips', () => {
    const options = [
        { value: 'a', label: 'Express wash', testId: 'chip-a' },
        { value: 'b', label: 'Interior clean', testId: 'chip-b' },
        { value: 'c', label: 'Paint correction', disabled: true, reason: 'not offered today', testId: 'chip-c' },
        { value: 'd', label: 'Full clean', testId: 'chip-d' },
    ]

    it('is a named radio group of 44px chips; the chosen one is checked and the tab stop', () => {
        render(<ChoiceChips label="Service" options={options} value="b" onChange={() => {}} testId="g" />)
        const group = screen.getByRole('radiogroup', { name: 'Service' })
        expect(group.getAttribute('data-testid')).toBe('g')
        const radios = screen.getAllByRole('radio')
        expect(radios).toHaveLength(4)
        for (const r of radios) expect(r.className).toContain('min-h-11')
        expect(screen.getByTestId('chip-b').getAttribute('aria-checked')).toBe('true')
        expect(screen.getByTestId('chip-b').tabIndex).toBe(0)
        expect(screen.getByTestId('chip-a').tabIndex).toBe(-1)
        expect(screen.getByTestId('chip-b').className).toContain('bg-[var(--selected)]')
    })

    it('chooses on tap, and a disabled chip says why and chooses nothing', () => {
        const onChange = vi.fn()
        render(<ChoiceChips label="Service" options={options} value="" onChange={onChange} />)
        fireEvent.click(screen.getByTestId('chip-a'))
        expect(onChange).toHaveBeenLastCalledWith('a')
        fireEvent.click(screen.getByTestId('chip-c'))
        expect(onChange).toHaveBeenCalledTimes(1)
        expect(screen.getByTestId('chip-c').textContent).toContain('not offered today')
        expect(screen.getByTestId('chip-c').getAttribute('aria-disabled')).toBe('true')
    })

    it('with nothing chosen the first enabled chip is the tab stop', () => {
        render(<ChoiceChips label="Service" options={options} value="" onChange={() => {}} />)
        expect(screen.getByTestId('chip-a').tabIndex).toBe(0)
    })

    it('arrows move and choose, skipping a disabled chip; Home and End jump', () => {
        const onChange = vi.fn()
        render(<ChoiceChips label="Service" options={options} value="b" onChange={onChange} />)
        const group = screen.getByRole('radiogroup')
        fireEvent.keyDown(group, { key: 'ArrowRight' })
        expect(onChange).toHaveBeenLastCalledWith('d')
        fireEvent.keyDown(group, { key: 'Home' })
        expect(onChange).toHaveBeenLastCalledWith('a')
        fireEvent.keyDown(group, { key: 'End' })
        expect(onChange).toHaveBeenLastCalledWith('d')
    })

    it('the action is a button outside the group, not one of the options', () => {
        const onClick = vi.fn()
        render(
            <ChoiceChips
                label="Service"
                options={options}
                value=""
                onChange={() => {}}
                action={{ label: 'More', onClick, opensDialog: true, testId: 'more' }}
            />,
        )
        const more = screen.getByTestId('more')
        expect(more.getAttribute('role')).toBeNull()
        expect(more.getAttribute('aria-haspopup')).toBe('dialog')
        expect(screen.getByRole('radiogroup').contains(more)).toBe(false)
        fireEvent.click(more)
        expect(onClick).toHaveBeenCalled()
    })

    it('points at a description when given one', () => {
        render(
            <>
                <p id="why">Working-days jobs are done at your workshop.</p>
                <ChoiceChips label="Where" options={options} value="" onChange={() => {}} describedBy="why" />
            </>,
        )
        expect(screen.getByRole('radiogroup').getAttribute('aria-describedby')).toBe('why')
    })

    it('row layout keeps one line that scrolls; wrap wraps', () => {
        const { rerender } = render(<ChoiceChips label="T" options={options} value="" onChange={() => {}} layout="row" />)
        expect(screen.getByRole('radiogroup').className).toContain('flex-nowrap')
        rerender(<ChoiceChips label="T" options={options} value="" onChange={() => {}} layout="wrap" />)
        expect(screen.getByRole('radiogroup').className).toContain('flex-wrap')
    })
})
