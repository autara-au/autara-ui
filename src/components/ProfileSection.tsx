import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import type { MerchantProfileLayout } from './MerchantProfileHeader'

/**
 * ProfileSections, ProfileSection and ProfileBio: the body of a pro's public
 * profile (AUTM-1800), moved from customer-web's /m page (its `SectionHead`
 * and profile-aw.css) so the merchant portal's preview draws the same
 * sections. Styles: utilities/merchant-profile.css.
 *
 *   ProfileSections  the column the sections stand in, 2.25rem apart.
 *   ProfileSection   a titled section: the title in Satoshi Black, an
 *                    optional fact on the right of it ("3 services"),
 *                    sentence case and no eyebrow (rule 3).
 *   ProfileBio       the pro's own words, keeping their line breaks.
 *
 * `layout` as on MerchantProfileHeader: `compact` is the phone profile at any
 * width, `adaptive` (the default) steps up with the page from 64rem.
 */

export interface ProfileSectionsProps {
    children: ReactNode
    layout?: MerchantProfileLayout
    className?: string
}

export function ProfileSections({ children, layout = 'adaptive', className }: ProfileSectionsProps) {
    return (
        <div className={cn('merchant-profile-sections', className)} data-layout={layout}>
            {children}
        </div>
    )
}

export interface ProfileSectionProps {
    /** The section's anchor, for the page's section nav. */
    id?: string
    /** The title's id; the section is labelled by it. Unique per page. */
    headingId: string
    title: ReactNode
    /** A fact at the end of the title row, muted: "3 services", "Open every day". */
    trailing?: ReactNode
    /** The title's element. `h2` on the profile page; lower inside a preview. */
    headingAs?: 'h2' | 'h3' | 'h4'
    className?: string
    testId?: string
    children?: ReactNode
}

export function ProfileSection({
    id,
    headingId,
    title,
    trailing,
    headingAs: Heading = 'h2',
    className,
    testId,
    children,
}: ProfileSectionProps) {
    return (
        <section
            id={id}
            aria-labelledby={headingId}
            className={cn('merchant-profile-section', className)}
            data-testid={testId}
        >
            <div className="merchant-profile-section-head">
                <Heading id={headingId} className="merchant-profile-h2">
                    {title}
                </Heading>
                {trailing ? <span className="merchant-profile-section-trailing">{trailing}</span> : null}
            </div>
            {children}
        </section>
    )
}

export interface ProfileBioProps {
    children: ReactNode
    className?: string
    testId?: string
}

/** The pro's description, as they typed it: line breaks kept, 40rem measure. */
export function ProfileBio({ children, className, testId }: ProfileBioProps) {
    return (
        <p className={cn('merchant-profile-bio', className)} data-testid={testId}>
            {children}
        </p>
    )
}
