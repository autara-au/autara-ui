import { useLayoutEffect, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MerchantProfileCover, MerchantProfileHeader, type MerchantProfileHeaderProps } from './MerchantProfileHeader'
import { ProfileBio, ProfileSection, ProfileSections } from './ProfileSection'
import { ServiceCard } from './ServiceCard'
import { DeviceFrame } from './DeviceFrame'
import { bookingModeLabel, describeOpenState, profileKicker } from '../lib/merchant-profile'

/**
 * AUTM-1800: the top of a pro's public profile, as /m/{merchantId} draws it
 * and as the merchant portal previews it while the pro edits. The stories use
 * `layout="compact"` (the phone profile at any width) inside a phone-wide box,
 * because Storybook's canvas is a desktop window; `Adaptive` shows the page's
 * own steps by the viewport.
 */

/* Solar glyphs, inlined for the stories only (autara-ui does not depend on
 * @solar-icons/react; consumers pass their own). */
const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const Star = () => (
    <svg viewBox="0 0 24 24" aria-hidden>
        <path
            fill="currentColor"
            d="M9.15 5.4C10.42 3.13 11.05 2 12 2s1.58 1.13 2.85 3.4l.33.59c.36.64.54.97.82 1.18.28.21.63.29 1.33.45l.64.14c2.46.56 3.69.84 3.98 1.78.3.94-.54 1.92-2.22 3.88l-.43.51c-.48.56-.72.84-.83 1.18-.1.35-.07.72 0 1.47l.07.68c.25 2.62.38 3.93-.39 4.51-.77.58-1.92.05-4.23-1.01l-.6-.27c-.65-.3-.98-.45-1.33-.45-.35 0-.68.15-1.33.45l-.6.27c-2.3 1.06-3.46 1.59-4.23 1.01-.77-.58-.64-1.89-.39-4.51l.07-.68c.07-.75.11-1.12 0-1.47-.1-.34-.35-.62-.83-1.18l-.43-.5c-1.68-1.97-2.52-2.95-2.22-3.89.29-.94 1.52-1.22 3.98-1.78l.64-.14c.7-.16 1.05-.24 1.33-.45.28-.21.46-.54.82-1.18l.33-.59Z"
        />
    </svg>
)
const MapPin = () => (
    <svg viewBox="0 0 24 24" aria-hidden>
        <path {...line} d="M4 10.14C4 5.64 7.58 2 12 2s8 3.64 8 8.14c0 4.46-2.55 9.67-6.54 11.53a3.45 3.45 0 0 1-2.92 0C6.55 19.81 4 14.6 4 10.14Z" />
        <circle {...line} cx="12" cy="10" r="3" />
    </svg>
)
const Case = () => (
    <svg viewBox="0 0 24 24" aria-hidden>
        <path {...line} d="M2 14c0-3.77 0-5.66 1.17-6.83C4.34 6 6.23 6 10 6h4c3.77 0 5.66 0 6.83 1.17C22 8.34 22 10.23 22 14s0 5.66-1.17 6.83C19.66 22 17.77 22 14 22h-4c-3.77 0-5.66 0-6.83-1.17C2 19.66 2 17.77 2 14ZM16 6c0-1.89 0-2.83-.59-3.41C14.83 2 13.89 2 12 2s-2.83 0-3.41.59C8 3.17 8 4.11 8 6" />
    </svg>
)
const Shield = () => (
    <svg viewBox="0 0 24 24" aria-hidden>
        <path {...line} d="M3 10.42c0-3.2 0-4.8.38-5.34.38-.54 1.88-1.05 4.89-2.08l.57-.2C10.41 2.27 11.2 2 12 2c.8 0 1.59.27 3.16.8l.57.2c3.01 1.03 4.51 1.54 4.89 2.08.38.54.38 2.14.38 5.34v1.57c0 5.64-4.24 8.37-6.9 9.53-.72.31-1.08.47-2.1.47-1.02 0-1.38-.16-2.1-.47C7.24 20.36 3 17.63 3 11.99v-1.57Z" />
        <path {...line} d="m9.5 12.4 1.43 1.6 3.57-4" />
    </svg>
)
const ICONS = { rating: <Star />, location: <MapPin />, mode: <Case /> }

const COVER =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2e1070"/><stop offset="1" stop-color="#4ceaff"/></linearGradient></defs><rect width="16" height="9" fill="url(#g)"/></svg>',
    )
const VOUCH =
    'Autara checked this business’s ABN, photo ID and insurance before their first booking. Your deposit is only charged once they accept.'

type Profile = {
    name: string
    cover?: string
    bio?: string
    modes: Array<'MOBILE' | 'WORKSHOP'>
    locationLine?: string
    rating?: number
    reviewCount: number
}
const WISH: Profile = {
    name: 'Wish Car Care',
    cover: COVER,
    bio: 'Mobile car care across the inner north. Paint correction, ceramic coatings and the weekly wash.\n\nBased in Fitzroy, we come to you.',
    modes: ['MOBILE'],
    locationLine: 'Fitzroy, VIC',
    rating: 4.8,
    reviewCount: 12,
}

function Profile({
    profile,
    layout = 'compact',
    action,
    idPrefix = 'story',
}: {
    profile: Profile
    layout?: 'compact' | 'adaptive'
    action?: ReactNode
    idPrefix?: string
}) {
    const header: MerchantProfileHeaderProps = {
        name: profile.name,
        kicker: profileKicker({ availableBookingModes: profile.modes, locationLine: profile.locationLine }),
        headingId: `${idPrefix}-name`,
        action,
        vouch: VOUCH,
        vouchIcon: <Shield />,
        rating: profile.rating,
        reviewCount: profile.reviewCount,
        locationLine: profile.locationLine,
        modeLabel: bookingModeLabel(profile.modes),
        status: { state: 'OPEN', label: describeOpenState({ status: 'OPEN', open: '08:30', close: '17:00' }) },
        icons: ICONS,
        layout,
    }
    return (
        <div style={{ background: 'var(--paper)', color: 'var(--strong)', paddingBottom: '2rem' }}>
            <MerchantProfileCover
                name={profile.name}
                layout={layout}
                artIdPrefix={`${idPrefix}-cover`}
                media={
                    profile.cover ? (
                        <img
                            src={profile.cover}
                            alt={profile.name}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : undefined
                }
            />
            <div style={{ paddingInline: '1.25rem' }}>
                <MerchantProfileHeader {...header} />
                <ProfileSections layout={layout}>
                    <ProfileSection headingId={`${idPrefix}-services`} title="Services" trailing="1 service">
                        <ul className="service-card-grid" role="list">
                            <li>
                                <ServiceCard
                                    layout="horizontal"
                                    name="Paint correction"
                                    description="A two-stage machine polish that lifts swirls and light scratches."
                                    durationLabel="4 hr"
                                    priceLabel="$424.70"
                                    priceLines={[
                                        { label: 'Service', value: '$400.00' },
                                        { label: '+ booking fee', value: '$19.60' },
                                    ]}
                                />
                            </li>
                        </ul>
                    </ProfileSection>
                    {profile.bio ? (
                        <ProfileSection headingId={`${idPrefix}-about`} title="About">
                            <ProfileBio>{profile.bio}</ProfileBio>
                        </ProfileSection>
                    ) : null}
                </ProfileSections>
            </div>
        </div>
    )
}

const meta: Meta<typeof MerchantProfileHeader> = {
    title: 'Marketplace/MerchantProfileHeader',
    component: MerchantProfileHeader,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <div style={{ maxWidth: 390 }}>{Story()}</div>],
}
export default meta
type Story = StoryObj<typeof MerchantProfileHeader>

/** A pro with a cover photo, a rating and a description, as a customer meets them. */
export const Default: Story = {
    render: () => <Profile profile={WISH} />,
}

/** No photo yet: the light art with their first letter, never an empty box. No reviews: no rating chip. */
export const NoPhoto: Story = {
    render: () => (
        <Profile
            profile={{ name: 'Fitzroy Paint Co', modes: ['WORKSHOP'], locationLine: 'Fitzroy, VIC', reviewCount: 0 }}
        />
    ),
}

/** Edge: a long name with no spaces to break at wraps inside the column, never overflows it. */
export const LongName: Story = {
    render: () => (
        <Profile
            profile={{
                ...WISH,
                cover: undefined,
                name: 'Northside Premium Mobile Car Care and Ceramic Coating Specialists',
                modes: ['MOBILE', 'WORKSHOP'],
            }}
        />
    ),
}

/** Dark theme: the tokens follow; the art is artwork and reads the same in both. */
export const Dark: Story = {
    globals: { theme: 'dark' },
    render: () => <Profile profile={WISH} />,
}

/** A light island inside a dark app: what the portal's preview does, since the profile page is light only. */
export const LightIslandInDark: Story = {
    globals: { theme: 'dark' },
    render: () => (
        <div data-theme="light">
            <Profile profile={{ ...WISH, cover: undefined }} />
        </div>
    ),
}

/** Edge: 200% text. Everything is in rem, so the profile grows with the reader's text and reflows. */
export const LargeText: Story = {
    name: 'Edge: 200% text',
    render: function LargeTextStory() {
        useLayoutEffect(() => {
            const html = document.documentElement
            const before = html.style.fontSize
            html.style.fontSize = '200%'
            return () => {
                html.style.fontSize = before
            }
        }, [])
        return <Profile profile={WISH} />
    },
}

/** In context: the portal's preview, the phone profile inside a DeviceFrame, with no label so its content stays readable. */
export const InDeviceFrame: Story = {
    decorators: [(Story) => <div style={{ maxWidth: 340 }}>{Story()}</div>],
    render: () => (
        <section aria-label="Customer preview">
            <DeviceFrame kind="phone">
                <div data-theme="light" style={{ height: '100%', overflowY: 'auto' }}>
                    <Profile profile={WISH} idPrefix="frame" />
                </div>
            </DeviceFrame>
        </section>
    ),
}

/** The page's own steps: from 40rem the cover is a rounded card, and from 64rem the name and titles step up. Resize the canvas. */
export const Adaptive: Story = {
    decorators: [(Story) => <div>{Story()}</div>],
    parameters: { layout: 'fullscreen' },
    render: () => <Profile profile={WISH} layout="adaptive" />,
}
