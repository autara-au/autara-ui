import * as React from 'react'
import { cn } from '../lib/cn'
import { HeroFill } from './HeroFill'

/**
 * Steps: requested, accepted, in progress, done (Customer/Ticket.swift).
 * Lime for what is finished, aqua for now (it breathes), the rest faint.
 */
export interface StepsProps extends React.HTMLAttributes<HTMLElement> {
    /** How many are finished; the next one is live. */
    done: number
    total?: number
    /**
     * Each step's name. With them the steps are a list a screen reader walks
     * (the current one `aria-current="step"`); without, one image labelled
     * "Step 3 of 4".
     */
    labels?: string[]
}

export function Steps({ done, total, labels, className, ...rest }: StepsProps) {
    const count = labels?.length ?? total ?? 4
    const state = (index: number) => (index < done ? 'done' : index === done ? 'live' : undefined)
    if (labels) {
        return (
            <ol className={cn('au-steps', className)} {...(rest as React.HTMLAttributes<HTMLOListElement>)}>
                {labels.map((label, index) => (
                    <li key={label} className="au-steps__bar" data-state={state(index)} aria-current={index === done ? 'step' : undefined}>
                        <span className="sr-only">
                            {label}
                            {index < done ? ', done' : ''}
                        </span>
                    </li>
                ))}
            </ol>
        )
    }
    return (
        <div role="img" aria-label={`Step ${Math.min(done + 1, count)} of ${count}`} className={cn('au-steps', className)} {...rest}>
            {Array.from({ length: count }, (_, index) => (
                <span key={index} className="au-steps__bar" data-state={state(index)} />
            ))}
        </div>
    )
}

/**
 * Ticket: the booking as a ticket, one big lime time, what it is, and at
 * most one row of actions (Customer/Ticket.swift). The same shape on Home,
 * Bookings and the booking itself.
 */
export interface TicketProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    badge?: React.ReactNode
    /** Beside the badge: the day ("Sat 21 Nov"), or "Ready about". */
    caption?: React.ReactNode
    /** The figure: "9:00". Omit for a ticket with no time yet. */
    time?: React.ReactNode
    /** "am", "pm", or a zone. */
    meridiem?: React.ReactNode
    title?: React.ReactNode
    /** Draws Steps under the time when given. */
    stepsDone?: number
    /** `large` is the booked screen's 96pt. */
    size?: 'hero' | 'large'
    /** The heading level of the title; h2 by default. */
    titleAs?: 'h1' | 'h2' | 'h3' | 'p'
    /** A test id for the time, which tests read. */
    timeTestId?: string
    /** Props for the title (its id for `aria-labelledby`, a test id). */
    titleProps?: React.HTMLAttributes<HTMLElement> & Record<`data-${string}`, string>
    /** Step names for Steps (see Steps). */
    stepLabels?: string[]
    /** A test id for Steps. */
    stepsTestId?: string
    /** The steps' accessible name ("Where your booking is"). */
    stepsLabel?: string
    /** Drawn in place of the title (a block that brings its own heading). */
    headline?: React.ReactNode
    children?: React.ReactNode
}

export function Ticket({
    badge,
    caption,
    time,
    meridiem,
    title,
    stepsDone,
    size = 'hero',
    titleAs: Title = 'h2',
    timeTestId,
    titleProps,
    stepLabels,
    stepsTestId,
    stepsLabel,
    headline,
    className,
    children,
    ...rest
}: TicketProps) {
    return (
        <HeroFill className={cn('au-ticket', className)} {...rest}>
            {badge || caption ? (
                <div className="au-ticket__head">
                    {badge}
                    {caption ? <span className="au-ticket__caption">{caption}</span> : null}
                </div>
            ) : null}
            {time ? (
                <div className="au-ticket__when" data-testid={timeTestId}>
                    <span className="au-ticket__time" data-size={size === 'large' ? 'large' : undefined}>
                        {time}
                    </span>
                    {meridiem ? ' ' : null}
                    {meridiem ? <span className="au-ticket__meridiem">{meridiem}</span> : null}
                </div>
            ) : null}
            {stepsDone !== undefined ? <Steps done={stepsDone} labels={stepLabels} data-testid={stepsTestId} aria-label={stepsLabel} /> : null}
            {headline ?? (
                <Title {...titleProps} className={cn('au-ticket__title', titleProps?.className)}>
                    {title}
                </Title>
            )}
            {children}
        </HeroFill>
    )
}
