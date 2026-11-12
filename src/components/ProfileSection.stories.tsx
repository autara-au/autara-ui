import { useLayoutEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProfileBio, ProfileSection, ProfileSections } from './ProfileSection'

/**
 * AUTM-1800: the body of a pro's public profile, a column of titled sections.
 * Shown at a phone's width with `layout="compact"`.
 */
const meta: Meta<typeof ProfileSection> = {
    title: 'Marketplace/ProfileSection',
    component: ProfileSection,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <div style={{ maxWidth: 390, background: 'var(--paper)', color: 'var(--strong)' }}>{Story()}</div>],
}
export default meta
type Story = StoryObj<typeof ProfileSection>

const BIO =
    'Mobile car care across the inner north. Paint correction, ceramic coatings and the weekly wash.\n\nBased in Fitzroy, we come to you.'

function Body() {
    return (
        <ProfileSections layout="compact">
            <ProfileSection headingId="s-about" title="About">
                <ProfileBio>{BIO}</ProfileBio>
            </ProfileSection>
            <ProfileSection headingId="s-hours" title="Hours" trailing="Open 6 days a week">
                <p style={{ margin: 0 }}>Monday to Saturday, 08:30 to 17:00</p>
            </ProfileSection>
        </ProfileSections>
    )
}

/** Titles in Satoshi Black, a muted fact on the right, the description with its line breaks. */
export const Default: Story = { render: () => <Body /> }

/** Edge: a long description with an unbroken word wraps inside the measure. */
export const LongText: Story = {
    render: () => (
        <ProfileSections layout="compact">
            <ProfileSection headingId="l-about" title="About">
                <ProfileBio>{`${BIO} Ceramiccoatingpaintprotectionfilmandinteriorsteamcleaning, all done at your place.`}</ProfileBio>
            </ProfileSection>
        </ProfileSections>
    ),
}

export const Dark: Story = { globals: { theme: 'dark' }, render: () => <Body /> }

/** Edge: 200% text. */
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
        return <Body />
    },
}
