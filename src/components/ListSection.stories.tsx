import type { Meta, StoryObj } from '@storybook/react-vite'
import { ListSection, ListSectionRow } from './ListSection'

const meta: Meta<typeof ListSection> = {
    title: 'Merchant portal/ListSection',
    component: ListSection,
    parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof ListSection>

const ShopIcon = () => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
            d="M4 9.5V20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9.5M3 9.5l1.5-5A1 1 0 0 1 5.5 4h13a1 1 0 0 1 1 .5L21 9.5M3 9.5h18M8 14h8M8 18h5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const BellIcon = () => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
            d="M6 19V13a6 6 0 0 1 12 0v6M3 19h18M9 22h6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const LogoutIcon = () => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
            d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2M9 12h12m0 0-3-3m3 3-3 3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

export const Default: Story = {
    render: () => (
        <div className="w-[480px]">
            <ListSection title="Business">
                <ListSectionRow
                    icon={<ShopIcon />}
                    label="Business profile"
                    description="Name, description, social links"
                    onTap={() => {}}
                />
                <ListSectionRow
                    icon={<BellIcon />}
                    label="Notifications"
                    description="Push, email, SMS preferences"
                    onTap={() => {}}
                />
            </ListSection>
        </div>
    ),
}

export const WithTrailingValue: Story = {
    render: () => (
        <div className="w-[480px]">
            <ListSection title="Operations">
                <ListSectionRow
                    icon={<ShopIcon />}
                    label="Payouts"
                    description="Connected to Stripe"
                    trailing="Active"
                    onTap={() => {}}
                />
                <ListSectionRow
                    icon={<BellIcon />}
                    label="Quiet hours"
                    description="9pm – 7am · weekdays"
                    trailing="Mon–Fri"
                    onTap={() => {}}
                />
            </ListSection>
        </div>
    ),
}

export const Destructive: Story = {
    name: 'Destructive row — sign out',
    render: () => (
        <div className="w-[480px]">
            <ListSection>
                <ListSectionRow
                    icon={<LogoutIcon />}
                    label="Sign out"
                    onTap={() => {}}
                    destructive
                />
            </ListSection>
        </div>
    ),
}

export const NoTitle: Story = {
    name: 'No section title',
    render: () => (
        <div className="w-[480px]">
            <ListSection>
                <ListSectionRow icon={<ShopIcon />} label="App settings" onTap={() => {}} />
                <ListSectionRow icon={<BellIcon />} label="Notifications" onTap={() => {}} />
            </ListSection>
        </div>
    ),
}

export const FullSettings: Story = {
    name: 'In context — Settings screen',
    render: () => (
        <div className="w-[480px]">
            <ListSection title="Business">
                <ListSectionRow
                    icon={<ShopIcon />}
                    label="Business profile"
                    description="Name, description, social links"
                    onTap={() => {}}
                />
                <ListSectionRow
                    icon={<BellIcon />}
                    label="Verification"
                    description="ABN, ID, business docs"
                    onTap={() => {}}
                />
            </ListSection>
            <ListSection title="Operations">
                <ListSectionRow
                    icon={<ShopIcon />}
                    label="Availability"
                    description="Hours, capacity, mobile vs in-shop"
                    onTap={() => {}}
                />
                <ListSectionRow
                    icon={<ShopIcon />}
                    label="Payouts"
                    description="Connected to Stripe"
                    trailing="Active"
                    onTap={() => {}}
                />
            </ListSection>
            <ListSection>
                <ListSectionRow
                    icon={<LogoutIcon />}
                    label="Sign out"
                    onTap={() => {}}
                    destructive
                />
            </ListSection>
        </div>
    ),
}

/**
 * AUTM-1708: a tappable row presses to 98.5% (`motion-press-row`) without a
 * class; a static row does not. `className` reaches the row, and
 * `press={false}` opts out.
 */
export const Press: Story = {
    name: 'Press, tappable rows',
    render: () => (
        <div className="max-w-md">
            <ListSection title="Account">
                <ListSectionRow label="Payouts" description="Next payout Friday" onTap={() => {}} />
                <ListSectionRow label="Plan" trailing="Founding" />
                <ListSectionRow label="Sign out" destructive onTap={() => {}} press={false} />
            </ListSection>
        </div>
    ),
}

/**
 * AUTM-1781: `variant="plain"`, the grouped list on the page's white ground,
 * hairlines between rows instead of a cream box. A row can be a link (here an
 * external one, with its arrow), carry an avatar as `leading`, and wrap.
 */
export const Plain: Story = {
    render: () => (
        <div className="w-[480px] bg-[var(--surface)] p-4">
            <ListSection variant="plain" title="When and where" titleId="when-where">
                <ListSectionRow icon={<ShopIcon />} label="Thu 16 Oct, 11:00 am AEDT" description="About 3 hours" />
                <ListSectionRow
                    icon={<ShopIcon />}
                    label="41 Smith Street, Fitzroy VIC 3065"
                    description="Drop the car at the workshop"
                    wrap
                    href="https://maps.google.com"
                    external
                />
            </ListSection>
            <ListSection
                variant="plain"
                title="Change or cancel"
                lead="Free to cancel until 24 hours before. After that, 50% of the deposit is kept."
            >
                <ListSectionRow icon={<BellIcon />} label="Change time" onTap={() => {}} />
                <ListSectionRow icon={<LogoutIcon />} label="Cancel booking" destructive onTap={() => {}} />
            </ListSection>
        </div>
    ),
}

/** In context: the pro once, as a link to their page, with a monogram. */
export const PlainWithLeading: Story = {
    render: () => (
        <div className="w-[480px] bg-[var(--surface)] p-4">
            <ListSection variant="plain">
                <ListSectionRow
                    leading={
                        <span className="grid size-12 place-items-center rounded-full bg-[var(--band)] font-bold text-[var(--accent)]">
                            FP
                        </span>
                    }
                    label="Fitzroy Paint Co"
                    description="Rated 4.9 from 31 reviews · Fitzroy, VIC"
                    href="#"
                />
            </ListSection>
        </div>
    ),
}

/**
 * `variant="quiet"` (Don, 2026-11-07, the merchant app's quiet pass): one band
 * surface per group with the rows on it, no white card per row, so a settings
 * screen of several groups is not a box inside a box on every line. The icon
 * discs are paper so they still read on the band. Hover a row.
 */
export const Quiet: Story = {
    name: 'Quiet (2026-11-07)',
    render: () => (
        <div className="w-[480px] bg-[var(--surface)] p-4">
            <ListSection variant="quiet" title="Business">
                <ListSectionRow icon={<ShopIcon />} label="Business profile" description="Name, photo, description and address" onTap={() => {}} />
                <ListSectionRow icon={<BellIcon />} label="Reviews" description="3.2 from 60 reviews" onTap={() => {}} />
                <ListSectionRow icon={<BellIcon />} label="Verification" description="ABN and documents approved" trailing="Verified" />
            </ListSection>
            <ListSection variant="quiet" title="Account">
                <ListSectionRow icon={<LogoutIcon />} label="Sign out" destructive onTap={() => {}} />
            </ListSection>
        </div>
    ),
}

export const QuietDark: Story = {
    name: 'Quiet, dark',
    globals: { theme: 'dark' },
    render: Quiet.render,
}
