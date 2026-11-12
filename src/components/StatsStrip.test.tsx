import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatsStrip } from './StatsStrip'

/** AUTM-1792: an odd strip on a phone never leaves a tile alone on a row. */
describe('StatsStrip on a phone (AUTM-1792)', () => {
    it('lets the hero lead the full width when the count is odd', () => {
        render(
            <StatsStrip
                stats={[
                    { label: 'Total', value: '8' },
                    { label: 'Customer spend', value: '$13,880', hero: true },
                    { label: 'Avg per customer', value: '$1,735' },
                ]}
            />
        )
        const cell = screen.getByText('$13,880').closest('.stats-strip > div') as HTMLElement
        expect(cell.className).toContain('col-span-2')
        expect(cell.className).toContain('order-first')
    })

    it('with no hero, the last tile takes the row', () => {
        render(<StatsStrip stats={[{ label: 'A', value: '1' }, { label: 'B', value: '2' }, { label: 'C', value: '3' }]} />)
        expect((screen.getByText('3').closest('.stats-strip > div') as HTMLElement).className).toContain('col-span-2')
        expect((screen.getByText('1').closest('.stats-strip > div') as HTMLElement).className).not.toContain('col-span-2')
    })

    it('an even strip spans nothing', () => {
        const { container } = render(<StatsStrip stats={[{ label: 'A', value: '1' }, { label: 'B', value: '2' }]} />)
        expect(container.querySelectorAll('.col-span-2')).toHaveLength(0)
    })
})
