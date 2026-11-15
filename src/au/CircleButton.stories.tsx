import type { Meta, StoryObj } from '@storybook/react-vite'
import { CircleButton } from './CircleButton'
import { ChevronLeftIcon, NotificationsIcon, RefreshIcon } from '../icons'
import { Room } from './_story'

/** AU/CircleButton: a white circle holding one icon; always labelled, always 44pt. */
const meta: Meta<typeof CircleButton> = { title: 'AU/CircleButton', component: CircleButton }
export default meta
type Story = StoryObj<typeof CircleButton>

export const Default: Story = {
    render: () => (
        <Room>
            <div style={{ display: 'flex', gap: 12 }}>
                <CircleButton icon={<ChevronLeftIcon />} label="Back" />
                <CircleButton icon={<NotificationsIcon />} label="Notifications, 2 unread" dot />
                <CircleButton icon={<RefreshIcon size={20} />} label="Book again" fill="well" />
                <CircleButton asChild icon={<ChevronLeftIcon />} label="Back to Bookings"><a href="#back" /></CircleButton>
            </div>
        </Room>
    ),
}
