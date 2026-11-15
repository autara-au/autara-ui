import type { Meta, StoryObj } from '@storybook/react-vite'
import { RemotePhoto } from './Photo'
import { Room } from './_story'

/** AU/RemotePhoto: a pro's photo, or their initials on a quiet tile. Never an empty box. */
const meta: Meta<typeof RemotePhoto> = { title: 'AU/RemotePhoto', component: RemotePhoto }
export default meta
type Story = StoryObj<typeof RemotePhoto>

export const Default: Story = {
    render: () => (
        <Room>
            <div style={{ display: 'flex', gap: 12 }}>
                <RemotePhoto name="McRaven Auto" radius={20} style={{ width: 64, height: 64 }} />
                <RemotePhoto src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=320" name="Kerbside" radius={20} style={{ width: 120, height: 64 }} />
                <RemotePhoto src="https://example.invalid/broken.jpg" name="Broken Link" radius={20} style={{ width: 64, height: 64 }} />
            </div>
        </Room>
    ),
}
