import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * SectionTitle: a section's heading with an optional link on its baseline
 * (Components.swift). `link` is the consumer's own element (a Next Link, a
 * button), drawn in the act purple.
 */
export interface SectionTitleProps extends React.HTMLAttributes<HTMLDivElement> {
    text: React.ReactNode
    link?: React.ReactElement<{ className?: string }>
    /** The heading level; h2 by default. */
    as?: 'h2' | 'h3'
}

export function SectionTitle({ text, link, as: Heading = 'h2', className, ...rest }: SectionTitleProps) {
    return (
        <div className={cn('au-section-title', className)} {...rest}>
            <Heading className="au-section-title__text">{text}</Heading>
            {link
                ? React.cloneElement(link, { className: cn('au-section-title__link', link.props.className) })
                : null}
        </div>
    )
}

/** PageTitle: a screen's own title, in the page rather than the bar (BookingsView.swift). */
export function PageTitle({ className, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h1 className={cn('au-page-title', className)} {...rest} />
}
