import type { Meta, StoryObj } from '@storybook/react-vite'
import { DiscRow } from './DiscRow'
import { Rows } from './Card'
import { CardIcon, ChevronRightIcon, HelpIcon, LocationIcon, NotificationsIcon, SignOutIcon } from '../icons'
import { Room } from './_story'

/** AU/DiscRow: Wise's row grammar, a disc, a label, a value. */
const meta: Meta<typeof DiscRow> = { title: 'AU/DiscRow', component: DiscRow }
export default meta
type Story = StoryObj<typeof DiscRow>

const chevron = <ChevronRightIcon size={16} />

export const AccountRows: Story = {
    name: 'You: four rows and sign out',
    render: () => (
        <Room>
            <div className="au-card">
                <Rows inset>
                    <DiscRow asChild icon={<LocationIcon />} title="Addresses" trailing={<>2{chevron}</>}><a href="#addresses" /></DiscRow>
                    <DiscRow asChild icon={<CardIcon />} title="Payment" trailing={<>Visa 4242{chevron}</>}><a href="#payment" /></DiscRow>
                    <DiscRow asChild icon={<NotificationsIcon />} title="Notifications" trailing={chevron}><a href="#notifications" /></DiscRow>
                    <DiscRow asChild icon={<HelpIcon />} title="Help" trailing={chevron}><a href="#help" /></DiscRow>
                </Rows>
            </div>
            <div className="au-card">
                <DiscRow asChild icon={<SignOutIcon />} title="Sign out"><button type="button" /></DiscRow>
            </div>
        </Room>
    ),
}

export const WithDetail: Story = {
    render: () => (
        <Room>
            <div className="au-card">
                <DiscRow icon={<LocationIcon />} title="Kerbside Car Care" detail="At 14 Foveaux St" trailing={chevron} />
            </div>
        </Room>
    ),
}
