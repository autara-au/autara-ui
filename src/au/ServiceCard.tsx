import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '../lib/cn'
import { RemotePhoto } from './Photo'
import { withInner } from './slot'

/**
 * ServiceCard: a service as a photo card, its picture, its name, how long,
 * how much (ServiceCard in Customer/ProView.swift). Two to a row on a
 * phone. `asChild` makes it the consumer's link or button. Every figure is
 * the server's, formatted by the caller.
 */
export interface ServiceCardProps extends React.HTMLAttributes<HTMLDivElement> {
    name: string
    photo?: string | null
    /** "30 min", "1 hr 30 min". */
    length?: React.ReactNode
    /** "$80.00", formatted by the caller. */
    price?: React.ReactNode
    asChild?: boolean
}

export const ServiceCard = React.forwardRef<HTMLDivElement, ServiceCardProps>(function ServiceCard(
    { name, photo, length, price, asChild, className, children, ...rest },
    ref,
) {
    const inner = (
        <>
            <RemotePhoto className="au-service-card__photo" src={photo} name={photo ? null : ''} />
            <span className="au-service-card__text">
                <span className="au-service-card__name">{name}</span>
                {length ? <span className="au-service-card__length">{length}</span> : null}
                {price ? <span className="au-service-card__price">{price}</span> : null}
            </span>
        </>
    )
    if (asChild) {
        return (
            <Slot ref={ref} className={cn('au-service-card', className)} {...rest}>
                {withInner(children, inner)}
            </Slot>
        )
    }
    return (
        <div ref={ref} className={cn('au-service-card', className)} {...rest}>
            {inner}
        </div>
    )
})

/**
 * ProCard: a pro as a photo card, for a rail (Home's "Near you" in
 * Customer/HomeView.swift): the cover, the name, one line under it.
 */
export interface ProCardProps extends React.HTMLAttributes<HTMLDivElement> {
    name: string
    photo?: string | null
    /** "Sydney · 1.8 km", "Brunswick · 5.0". */
    line?: React.ReactNode
    asChild?: boolean
}

export const ProCard = React.forwardRef<HTMLDivElement, ProCardProps>(function ProCard(
    { name, photo, line, asChild, className, children, ...rest },
    ref,
) {
    const inner = (
        <>
            <RemotePhoto className="au-pro-card__photo" src={photo} name={name} />
            <span className="au-pro-card__text">
                <span className="au-pro-card__name">{name}</span>
                {line ? <span className="au-pro-card__line">{line}</span> : null}
            </span>
        </>
    )
    if (asChild) {
        return (
            <Slot ref={ref} className={cn('au-pro-card', className)} {...rest}>
                {withInner(children, inner)}
            </Slot>
        )
    }
    return (
        <div ref={ref} className={cn('au-pro-card', className)} {...rest}>
            {inner}
        </div>
    )
})
