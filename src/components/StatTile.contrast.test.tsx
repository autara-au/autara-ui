import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { StatTile } from './StatTile'

/**
 * AUTM-1194 — on a hero tile the label and caption were 75% on-accent, which
 * measured 4.36:1 on the dark accent fill (about 3.6:1 on hover), under the
 * 4.5:1 floor. jsdom has no layout or colour maths, so this pins the
 * mechanism: no hero text is drawn at reduced on-accent opacity. The
 * measurement lives in merchant-mobile's dashboard-a11y spec.
 */
describe('StatTile hero text contrast', () => {
    it('draws the hero label and caption at full on-accent', () => {
        render(<StatTile hero label="Pending payouts" value="$202" caption="3 bookings this week" />)
        for (const text of ['Pending payouts', '3 bookings this week']) {
            const cls = screen.getByText(text).className
            expect(cls).toContain('text-[var(--on-accent)]')
            expect(cls).not.toMatch(/on-accent\)\]\/\d+/)
        }
    })
})
