import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { profileMonogram, type MerchantOpenStatus } from '../lib/merchant-profile'
import { CategoryArt } from './CategoryArt'

/**
 * MerchantProfileCover and MerchantProfileHeader: the top of a pro's public
 * profile, the way a customer meets it on /m/{merchantId}.
 *
 * AUTM-1800. customer-web composed these itself (page.tsx and profile-aw.css,
 * AUTM-1513). The merchant portal now previews the profile while the pro
 * edits it, and a preview that redrew the page would drift from it the first
 * time either changed, so the page's pieces moved here and both apps render
 * them. Styles: utilities/merchant-profile.css.
 *
 *   Cover   the pro's cover photo, else the light art with the first letter
 *           of their name on a paper tile (AUTM-546: no car photography, and
 *           never an empty box). A photo that fails to load should fall back
 *           to the same art: pass `MerchantProfileCoverArt` as the image's
 *           fallback (AUTM-1602).
 *   Header  the kicker ("Mobile car-care pro in Fitzroy, VIC"), the name, an
 *           optional action beside it (the customer's save control), the vouch
 *           line, and the facts as chips: rating, suburb, mode and the door
 *           state.
 *
 * The words come from the consumer, derived with the helpers in
 * lib/merchant-profile (`profileKicker`, `bookingModeLabel`,
 * `describeOpenState`), so the preview and the page say the same thing. Icons
 * are slots: autara-ui does not depend on @solar-icons/react; both consumers
 * pass the same Solar glyphs (Star Bold, MapPoint, CaseMinimalistic,
 * ShieldCheck, Linear).
 *
 * `layout`:
 *   compact   the phone profile at any width (the portal's preview, which
 *             draws a phone inside a desktop window);
 *   adaptive  the phone profile, then the page's own steps from 40rem and
 *             64rem by the viewport (the profile page). The default.
 *
 * No hooks and no 'use client': the profile page renders these on the server.
 */

export type MerchantProfileLayout = 'compact' | 'adaptive'

export interface MerchantProfileCoverArtProps {
    /** The business name; its first letter is the tile's. */
    name: string
    /**
     * Prefix for the art's gradient and filter ids. Two covers on one page
     * (a preview in a column and again in a sheet) need distinct prefixes.
     */
    idPrefix?: string
}

/** The cover a pro with no photo gets, and the one a failed photo falls back to. */
export function MerchantProfileCoverArt({ name, idPrefix = 'profile-hero' }: MerchantProfileCoverArtProps) {
    return (
        <div aria-hidden="true" className="merchant-profile-cover-art">
            <CategoryArt kind="exterior" idPrefix={idPrefix} className="merchant-profile-cover-art-svg" />
            <span className="merchant-profile-monogram">{profileMonogram(name)}</span>
        </div>
    )
}

export interface MerchantProfileCoverProps {
    /** The business name, for the no-photo art's letter. */
    name: string
    /**
     * The cover photo, filling the box: `position: absolute; inset: 0`,
     * `object-fit: cover` (next/image `fill` does both). The box is the crop
     * a customer sees: full width and 13.75rem tall on a phone. Omit it and
     * the art is drawn.
     */
    media?: ReactNode
    /** Passed to the art when there is no `media`. */
    artIdPrefix?: string
    layout?: MerchantProfileLayout
    className?: string
    testId?: string
}

export function MerchantProfileCover({
    name,
    media,
    artIdPrefix,
    layout = 'adaptive',
    className,
    testId,
}: MerchantProfileCoverProps) {
    return (
        <div className={cn('merchant-profile-cover', className)} data-layout={layout} data-testid={testId}>
            {media ?? <MerchantProfileCoverArt name={name} idPrefix={artIdPrefix} />}
        </div>
    )
}

export interface MerchantProfileStatus {
    /** Sets the dot's colour; the label carries the meaning (AUTM-874). */
    state: MerchantOpenStatus
    /** `describeOpenState(state)`: "Open now · closes 17:00". */
    label: string
}

export interface MerchantProfileHeaderProps {
    /** The business name as customers see it. */
    name: string
    /** The line over the name: `profileKicker(profile)`. */
    kicker: string
    /** The name heading's id, for a section's `aria-labelledby`. Unique per page. */
    headingId?: string
    /**
     * The name's element. `h1` on the profile page; a preview inside another
     * screen passes a lower level so the screen keeps one h1. Looks the same.
     */
    headingAs?: 'h1' | 'h2' | 'h3'
    /** Beside the name, at the end of its row: the customer's save control. */
    action?: ReactNode
    /** The vouch sentence under the name (AUTM-1690). Omit to leave it out. */
    vouch?: ReactNode
    /** The vouch line's glyph, in the accent. */
    vouchIcon?: ReactNode
    /** The average rating. The chip shows only with at least one review. */
    rating?: number | null
    reviewCount?: number | null
    /** "Fitzroy, VIC". */
    locationLine?: string | null
    /** `bookingModeLabel(modes)`: "Comes to you". */
    modeLabel?: string | null
    /** The door state. */
    status?: MerchantProfileStatus | null
    /** The facts' glyphs. */
    icons?: { rating?: ReactNode; location?: ReactNode; mode?: ReactNode }
    layout?: MerchantProfileLayout
    className?: string
    testIds?: { vouch?: string; status?: string }
}

function Chip({ icon, children, testId }: { icon?: ReactNode; children: ReactNode; testId?: string }) {
    return (
        <span className="merchant-profile-chip" data-testid={testId}>
            {icon ? (
                <span className="merchant-profile-chip-icon" aria-hidden="true">
                    {icon}
                </span>
            ) : null}
            {children}
        </span>
    )
}

export function MerchantProfileHeader({
    name,
    kicker,
    headingId = 'merchant-name',
    headingAs: Heading = 'h1',
    action,
    vouch,
    vouchIcon,
    rating,
    reviewCount,
    locationLine,
    modeLabel,
    status,
    icons,
    layout = 'adaptive',
    className,
    testIds,
}: MerchantProfileHeaderProps) {
    /* AUTM-546: separators were only meaningful between items; as chips, a
       fact that is missing simply is not drawn. A rating needs a review
       behind it, or "0.0" reads as a bad score. */
    const reviews = reviewCount ?? 0
    const showRating = reviews > 0 && rating != null
    const place = locationLine?.trim() || null
    const hasFacts = showRating || !!place || !!modeLabel || !!status

    return (
        <div className={cn('merchant-profile-head', className)} data-layout={layout}>
            <div className="merchant-profile-name-row">
                <div className="merchant-profile-name">
                    <p className="merchant-profile-kicker">{kicker}</p>
                    <Heading id={headingId} className="merchant-profile-h1">
                        {name}
                    </Heading>
                </div>
                {action}
            </div>

            {vouch ? (
                <p className="merchant-profile-vouch" data-testid={testIds?.vouch}>
                    <span className="merchant-profile-vouch-icon" aria-hidden="true">
                        {vouchIcon}
                    </span>
                    <span>{vouch}</span>
                </p>
            ) : null}

            {hasFacts ? (
                <div className="merchant-profile-chips">
                    {showRating ? (
                        <Chip icon={icons?.rating}>
                            <span>
                                <span className="merchant-profile-strong">{rating!.toFixed(1)}</span> from {reviews}{' '}
                                {reviews === 1 ? 'review' : 'reviews'}
                            </span>
                        </Chip>
                    ) : null}
                    {place ? <Chip icon={icons?.location}>{place}</Chip> : null}
                    {modeLabel ? <Chip icon={icons?.mode}>{modeLabel}</Chip> : null}
                    {status ? (
                        <Chip testId={testIds?.status}>
                            <span aria-hidden="true" className="merchant-profile-dot" data-state={status.state} />
                            {status.label}
                        </Chip>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}
