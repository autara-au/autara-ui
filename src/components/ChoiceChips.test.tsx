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
        // The chosen chip carries a mark that is not colour (WCAG 1.4.1).
        expect(screen.getByTestId('chip-b').querySelector('[data-selected-mark]')).not.toBeNull()
        expect(screen.getByTestId('chip-a').querySelector('[data-selected-mark]')).toBeNull()
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

    it('row layout keeps one line that scrolls (a ChipRow, AUTM-1756); wrap wraps', () => {
        const { rerender } = render(<ChoiceChips label="T" options={options} value="" onChange={() => {}} layout="row" />)
        expect(screen.getByRole('radiogroup').className).toContain('chip-row__scroller')
        rerender(<ChoiceChips label="T" options={options} value="" onChange={() => {}} layout="wrap" />)
        expect(screen.getByRole('radiogroup').className).toContain('flex-wrap')
    })

    describe('layout="tiles" (AUTM-2140 R8, Don\'s pick C2)', () => {
        const Rest = () => <svg data-icon="rest" />
        const Bold = () => <svg data-icon="bold" />
        const tileOptions = [
            { value: 'ext', label: 'Exterior Car Care & Detailing', icon: <Rest />, selectedIcon: <Bold />, testId: 'tile-ext' },
            { value: 'int', label: 'Interior Detailing & Protection', icon: <Rest />, selectedIcon: <Bold />, testId: 'tile-int' },
            { value: 'pro', label: 'Protection & Restoration', icon: <Rest />, disabled: true, reason: 'not offered by this business', testId: 'tile-pro' },
            { value: 'fleet', label: 'Fleet & Business Services', testId: 'tile-fleet' },
        ]

        it('is the same named radio group, laid out as two columns that drop to one under 32rem of container', () => {
            const { container } = render(
                <ChoiceChips label="Category" options={tileOptions} value="int" onChange={() => {}} layout="tiles" testId="cat" />,
            )
            const group = screen.getByRole('radiogroup', { name: 'Category' })
            expect(group.getAttribute('data-testid')).toBe('cat')
            expect(group.getAttribute('data-layout')).toBe('tiles')
            expect(group.className).toContain('grid-cols-1')
            expect(group.className).toContain('@min-[32rem]:grid-cols-2')
            // The query reads the container, not the screen (and is in rem, so 200% text is one column).
            expect((container.firstElementChild as HTMLElement).className).toContain('@container')
            expect(screen.getAllByRole('radio')).toHaveLength(4)
        })

        it('each tile is at least 64px, its icon in a disc hidden from a screen reader, its label the name', () => {
            render(<ChoiceChips label="Category" options={tileOptions} value="" onChange={() => {}} layout="tiles" />)
            const tile = screen.getByTestId('tile-ext')
            expect(tile.className).toContain('min-h-16')
            expect(tile.hasAttribute('data-tile')).toBe(true)
            const disc = tile.querySelector('[data-slot="tile-icon"]')!
            expect(disc.getAttribute('aria-hidden')).toBe('true')
            expect(disc.className).toContain('size-11')
            expect(disc.className).toContain('[&>svg]:size-6')
            expect(disc.querySelector('[data-icon="rest"]')).not.toBeNull()
            expect(screen.getByRole('radio', { name: 'Exterior Car Care & Detailing' })).toBe(tile)
            // No icon given: no disc, and the label starts at the tile's own padding.
            const plain = screen.getByTestId('tile-fleet')
            expect(plain.querySelector('[data-slot="tile-icon"]')).toBeNull()
            expect(plain.className).toContain('pl-4')
        })

        it('the chosen tile is the hero fill with the Bold twin in lime and a lime check; the rest stay on band', () => {
            render(<ChoiceChips label="Category" options={tileOptions} value="int" onChange={() => {}} layout="tiles" />)
            const on = screen.getByTestId('tile-int')
            expect(on.getAttribute('aria-checked')).toBe('true')
            expect(on.tabIndex).toBe(0)
            expect(on.className).toContain('bg-[var(--hero)]')
            expect(on.className).toContain('text-[var(--on-deep)]')
            const disc = on.querySelector('[data-slot="tile-icon"]')!
            expect(disc.className).toContain('text-[var(--lime)]')
            expect(disc.querySelector('[data-icon="bold"]')).not.toBeNull()
            expect(disc.querySelector('[data-icon="rest"]')).toBeNull()
            const mark = on.querySelector('[data-selected-mark]')!
            expect(mark.getAttribute('class')).toContain('text-[var(--lime)]')
            expect(mark.getAttribute('width')).toBe('22')
            const off = screen.getByTestId('tile-ext')
            expect(off.className).toContain('bg-[var(--band)]')
            expect(off.querySelector('[data-selected-mark]')).toBeNull()
        })

        it('falls back to the rest icon when no selectedIcon is given', () => {
            const options = [{ value: 'a', label: 'A', icon: <Rest /> }]
            render(<ChoiceChips label="Category" options={options} value="a" onChange={() => {}} layout="tiles" />)
            expect(screen.getByRole('radio').querySelector('[data-icon="rest"]')).not.toBeNull()
        })

        it('keeps the chips\' keyboard model, taps, disabled reason and per-option test ids', () => {
            const onChange = vi.fn()
            render(<ChoiceChips label="Category" options={tileOptions} value="int" onChange={onChange} layout="tiles" />)
            const group = screen.getByRole('radiogroup')
            fireEvent.keyDown(group, { key: 'ArrowDown' })
            expect(onChange).toHaveBeenLastCalledWith('fleet')
            fireEvent.keyDown(group, { key: 'Home' })
            expect(onChange).toHaveBeenLastCalledWith('ext')
            fireEvent.click(screen.getByTestId('tile-pro'))
            expect(onChange).toHaveBeenCalledTimes(2)
            expect(screen.getByTestId('tile-pro').getAttribute('aria-disabled')).toBe('true')
            expect(screen.getByTestId('tile-pro').textContent).toContain('not offered by this business')
            fireEvent.click(screen.getByTestId('tile-ext'))
            expect(onChange).toHaveBeenLastCalledWith('ext')
        })

        it('says invalid and disabled on the group, as the chips do', () => {
            const onChange = vi.fn()
            render(<ChoiceChips label="Category" options={tileOptions} value="" onChange={onChange} layout="tiles" invalid disabled />)
            const group = screen.getByRole('radiogroup')
            expect(group.getAttribute('aria-invalid')).toBe('true')
            expect(group.getAttribute('aria-disabled')).toBe('true')
            fireEvent.click(screen.getByTestId('tile-ext'))
            fireEvent.keyDown(group, { key: 'ArrowRight' })
            expect(onChange).not.toHaveBeenCalled()
        })

        it('wrap and row ignore icon and selectedIcon', () => {
            const { rerender } = render(<ChoiceChips label="C" options={tileOptions} value="int" onChange={() => {}} layout="wrap" />)
            expect(document.querySelector('[data-icon]')).toBeNull()
            expect(document.querySelector('[data-tile]')).toBeNull()
            rerender(<ChoiceChips label="C" options={tileOptions} value="int" onChange={() => {}} layout="row" />)
            expect(document.querySelector('[data-icon]')).toBeNull()
        })
    })
})
