import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MerchantProfileCover, MerchantProfileHeader } from './MerchantProfileHeader'
import { ProfileBio, ProfileSection, ProfileSections } from './ProfileSection'

/** AUTM-1800: what the profile page and the portal preview both rely on. */
describe('MerchantProfileCover', () => {
    it('draws the art with the first letter when there is no photo', () => {
        const { container } = render(<MerchantProfileCover name="wish car care" testId="cover" />)
        const cover = screen.getByTestId('cover')
        expect(cover.getAttribute('data-layout')).toBe('adaptive')
        expect(container.querySelector('.merchant-profile-monogram')?.textContent).toBe('W')
        expect(container.querySelector('.merchant-profile-cover-art')?.getAttribute('aria-hidden')).toBe('true')
        expect(container.querySelector('svg linearGradient')?.id).toBe('profile-hero-exterior-ground')
    })

    it('draws the photo instead, and namespaces the art ids per instance', () => {
        const { container, rerender } = render(
            <MerchantProfileCover name="Wish" media={<img alt="" src="cover.jpg" />} layout="compact" testId="c" />,
        )
        expect(container.querySelector('img')).not.toBeNull()
        expect(container.querySelector('.merchant-profile-monogram')).toBeNull()
        expect(screen.getByTestId('c').getAttribute('data-layout')).toBe('compact')
        rerender(<MerchantProfileCover name="Wish" artIdPrefix="preview-1" />)
        expect(container.querySelector('svg linearGradient')?.id).toBe('preview-1-exterior-ground')
    })
})

describe('MerchantProfileHeader', () => {
    it('names the pro in a heading under the kicker, at the level asked for', () => {
        render(<MerchantProfileHeader name="Wish Car Care" kicker="Mobile car-care pro" headingAs="h2" headingId="n" />)
        const heading = screen.getByRole('heading', { level: 2, name: 'Wish Car Care' })
        expect(heading.id).toBe('n')
        expect(screen.getByText('Mobile car-care pro')).toBeTruthy()
    })

    it('shows a rating only with a review behind it', () => {
        const { rerender } = render(
            <MerchantProfileHeader name="W" kicker="k" rating={4.8} reviewCount={0} locationLine="Fitzroy, VIC" />,
        )
        expect(screen.queryByText(/from 0/)).toBeNull()
        expect(screen.getByText('Fitzroy, VIC')).toBeTruthy()
        rerender(<MerchantProfileHeader name="W" kicker="k" rating={5} reviewCount={1} />)
        expect(screen.getByText('5.0').parentElement?.textContent).toBe('5.0 from 1 review')
        rerender(<MerchantProfileHeader name="W" kicker="k" rating={4.75} reviewCount={12} />)
        expect(screen.getByText('4.8').parentElement?.textContent).toBe('4.8 from 12 reviews')
    })

    it('states the door in words beside an aria-hidden dot', () => {
        render(
            <MerchantProfileHeader
                name="W"
                kicker="k"
                status={{ state: 'OPEN', label: 'Open now · closes 17:00' }}
                testIds={{ status: 'status' }}
            />,
        )
        const chip = screen.getByTestId('status')
        expect(chip.textContent).toBe('Open now · closes 17:00')
        const dot = chip.querySelector('.merchant-profile-dot')
        expect(dot?.getAttribute('data-state')).toBe('OPEN')
        expect(dot?.getAttribute('aria-hidden')).toBe('true')
    })

    it('leaves out the vouch line and the facts row when there is nothing to say', () => {
        const { container } = render(<MerchantProfileHeader name="W" kicker="k" />)
        expect(container.querySelector('.merchant-profile-vouch')).toBeNull()
        expect(container.querySelector('.merchant-profile-chips')).toBeNull()
    })

    it('keeps the vouch sentence in the text column even without a glyph', () => {
        render(<MerchantProfileHeader name="W" kicker="k" vouch="Autara checked this." testIds={{ vouch: 'v' }} />)
        const vouch = screen.getByTestId('v')
        expect(vouch.children).toHaveLength(2)
        expect(vouch.children[1].textContent).toBe('Autara checked this.')
    })
})

describe('ProfileSection', () => {
    it('is a section labelled by its title, with the trailing fact', () => {
        render(
            <ProfileSections layout="compact">
                <ProfileSection id="about" headingId="about-heading" title="About" trailing="3 services">
                    <ProfileBio testId="bio">{'Line one\nLine two'}</ProfileBio>
                </ProfileSection>
            </ProfileSections>,
        )
        const region = screen.getByRole('region', { name: 'About' })
        expect(region.id).toBe('about')
        expect(screen.getByText('3 services')).toBeTruthy()
        expect(screen.getByTestId('bio').textContent).toBe('Line one\nLine two')
        expect(region.parentElement?.getAttribute('data-layout')).toBe('compact')
    })
})
