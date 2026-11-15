import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'
import { Dock, type DockTab } from './Dock'
import { AccountIcon, BookingsIcon, ChatIcon, HomeIcon } from '../icons'
import { Room } from './_story'

/**
 * AU/Dock: four icon slots with no labels and a search disc. The current
 * tab is a tile that slides; every tab is named for a screen reader.
 */
const meta: Meta<typeof Dock> = { title: 'AU/Dock', component: Dock }
export default meta
type Story = StoryObj<typeof Dock>

function Live() {
    const [current, setCurrent] = React.useState('home')
    const tab = (id: string, label: string, icon: DockTab["icon"], count?: number) => ({
        id,
        label,
        icon,
        count,
        countLabel: count ? `${count} unread` : undefined,
        element: <a href={`#${id}`} onClick={(e: React.MouseEvent) => { e.preventDefault(); setCurrent(id) }} />,
    })
    return (
        <Room>
            <div style={{ height: 200 }} />
            <Dock
                current={current}
                tabs={[
                    tab('home', 'Home', <HomeIcon />),
                    tab('bookings', 'Bookings', <BookingsIcon />),
                    tab('inbox', 'Inbox', <ChatIcon />, 2),
                    tab('you', 'You', <AccountIcon />),
                ]}
                search={<a href="#search"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg></a>}
            />
        </Room>
    )
}

export const Default: Story = { render: () => <Live /> }

export const NoneCurrent: Story = {
    name: 'A page under a tab (none current)',
    render: () => (
        <Room>
            <Dock
                current={null}
                tabs={[
                    { id: 'home', label: 'Home', icon: <HomeIcon />, element: <a href="#home" /> },
                    { id: 'bookings', label: 'Bookings', icon: <BookingsIcon />, element: <a href="#bookings" /> },
                    { id: 'inbox', label: 'Inbox', icon: <ChatIcon />, element: <a href="#inbox" /> },
                    { id: 'you', label: 'You', icon: <AccountIcon />, element: <a href="#you" /> },
                ]}
            />
        </Room>
    ),
}
