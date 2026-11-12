import type { Meta, StoryObj } from '@storybook/react-vite'
import { DateTile, WhenBlock } from './DateTile'

/**
 * AUTM-1797 / AUTM-1799: a date as a calendar leaf, read in the booking's
 * zone (the pro's clock), and WhenBlock, the tile with the time as a figure
 * as the booking pass draws it.
 */
const meta = {
    title: 'App shell/DateTile',
    component: DateTile,
    parameters: { layout: 'padded' },
} satisfies Meta<typeof DateTile>
export default meta
type Story = StoryObj<typeof meta>

/** Saturday 17 October 2026, 9:00 am in Melbourne (Friday 22:00 UTC). */
const AT = '2026-10-16T22:00:00.000Z'

export const Default: Story = { args: { iso: AT, timeZone: 'Australia/Melbourne' } }

/** The list-row size (a review card's When row, a new time's two tiles). */
export const Small: Story = { args: { iso: AT, timeZone: 'Australia/Melbourne', size: 'sm' } }

/** 2 am Saturday in Melbourne is 11 pm Friday in Perth: the tile follows the pro's zone, never the reader's. */
export const OtherZone: Story = { args: { iso: '2026-10-16T15:00:00.000Z', timeZone: 'Australia/Perth' } }

/** No time yet: nothing is drawn rather than a wrong day. */
export const Missing: Story = { args: { iso: null } }

/** WhenBlock on the pass's deep ground: the tile, the time, the job's length. */
export const When: Story = {
    args: { iso: AT },
    render: () => (
        <div className="@container max-w-[390px] rounded-[1.75rem] bg-[var(--brand-deep)] p-5 text-[var(--on-deep)]">
            <WhenBlock iso={AT} timeZone="Australia/Melbourne" dayLabel="Sat 17 Oct" time="9:00 am" sub="3 hr" />
        </div>
    ),
}
