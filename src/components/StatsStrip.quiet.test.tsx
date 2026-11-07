import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { StatsStrip } from './StatsStrip'

describe('StatsStrip variant="quiet" (2026-11-07)', () => {
    it('is one band of cells, bold not Black, with a test id and a click per stat', () => {
        const open = vi.fn()
        const { container } = render(
            <StatsStrip
                variant="quiet"
                stats={[
                    { label: 'Still to collect', value: '$0.00', muted: true, onClick: open, testId: 'stat-owed' },
                    { label: 'This month', value: '$733.00', testId: 'stat-month' },
                ]}
            />,
        )
        const strip = container.querySelector('.stats-strip')!
        expect(strip.getAttribute('data-variant')).toBe('quiet')
        // One band: the strip is filled, its cells are not.
        expect(strip.className).toContain('bg-[var(--band)]')
        const owed = screen.getByTestId('stat-owed')
        expect(owed.tagName).toBe('BUTTON')
        expect(owed.className).not.toContain('bg-[var(--band)]')
        // Named by its words, figure included.
        expect(screen.getByRole('button', { name: /Still to collect\s*\$0\.00/ })).toBe(owed)
        fireEvent.click(owed)
        expect(open).toHaveBeenCalledTimes(1)
        // The figure: bold, never Black; a zero whispers.
        const figure = owed.querySelector('.stat-tile-figure')!
        expect(figure.className).toContain('font-bold')
        expect(figure.className).not.toContain('font-black')
        expect(figure.className).toContain('text-[var(--text-muted)]')
        expect(screen.getByTestId('stat-month').tagName).toBe('DIV')
    })

    it('holds each cell with a skeleton while loading', () => {
        const { container } = render(<StatsStrip variant="quiet" loading stats={[{ label: 'Reviews' }, { label: 'Average' }]} />)
        expect(container.querySelectorAll('.motion-skeleton')).toHaveLength(2)
        expect(container.querySelector('.stat-tile-figure')).toBeNull()
    })

    it('leaves the default tiles as they were', () => {
        const { container } = render(<StatsStrip stats={[{ label: 'Total', value: '8' }, { label: 'Spend', value: '$9' }]} />)
        expect(container.querySelector('.stats-strip')!.getAttribute('data-variant')).toBeNull()
        expect(container.querySelector('.stat-tile-figure')!.className).toContain('font-black')
    })
})
