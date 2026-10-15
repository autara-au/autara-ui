import * as React from 'react'
import { cn } from '../lib/cn'
import { VehicleCard, type VehicleCardProps } from './VehicleCard'

/**
 * VehicleProfile: a car as a pro sees it, for the merchant portal's vehicle
 * sheet (AUTM-1878 follow-up, Don 2026-10-15: "the merchant must be able to
 * see a vehicle profile"). Wise-simple: the car, whose it is, the jobs done
 * on it, and what the customer said about it.
 *
 *   [mark • paint]  Toyota Corolla
 *                   Sedan · 2021 · White      [ABC123]
 *   Customer        Roy Lim
 *   Jobs on this car
 *     Sat 17 Oct    Interior refresh           $80.00   >
 *     Sat 2 Aug     Full detail               $189.00   >
 *   Notes from Roy
 *     "Dog hair in the back"                    Sat 2 Aug
 *
 * The car is VehicleCard (the make's mark, the paint dot, the plate as a
 * plate, and its `photoUrl` slot for the customer's own photo, AUTM-1882).
 * Each job is a row button the consumer opens (`onOpen`). `jobs` null means
 * the car was typed in on the booking, not chosen from the customer's cars,
 * so there is nothing to look back on; `noHistory` says so in the
 * consumer's words. The data is the consumer's: this draws it.
 */
export interface VehicleProfileJob {
    id: string
    /** The day, already formatted ("Sat 17 Oct"). */
    when: string
    /** The service, as the pro wrote it. */
    title: string
    /** Already formatted ("$80.00"), or null. */
    amount?: string | null
    /** A short state after the title ("Upcoming", "Cancelled"), or nothing. */
    note?: string | null
    /** This row's own booking, e.g. the one the sheet was opened from. */
    current?: boolean
    onOpen?: () => void
    testId?: string
}

export interface VehicleProfileNote {
    id: string
    text: string
    /** When it was written, already formatted. */
    when?: string | null
}

export interface VehicleProfileProps {
    vehicle: Pick<VehicleCardProps, 'make' | 'model' | 'body' | 'color' | 'year' | 'registrationPlate' | 'photoUrl'>
    /** Whose car: the customer's name, and an optional line under it. */
    customer?: { name: string; detail?: React.ReactNode } | null
    /** The jobs on this car, newest first; null when there can be none. */
    jobs?: VehicleProfileJob[] | null
    /** "Jobs on this car". */
    jobsTitle?: string
    /** Shown when `jobs` is an empty list. */
    emptyJobs?: React.ReactNode
    /** Shown when `jobs` is null (a car typed in on the booking). */
    noHistory?: React.ReactNode
    /** Shown in place of the jobs while they load. */
    jobsLoading?: React.ReactNode
    notes?: VehicleProfileNote[]
    /** "Notes from Roy". */
    notesTitle?: string
    className?: string
    testId?: string
}

const SECTION_TITLE = 'text-[0.8125rem] font-medium text-[var(--text-muted)]'

export function VehicleProfile({
    vehicle,
    customer,
    jobs,
    jobsTitle = 'Jobs on this car',
    emptyJobs = 'No other jobs on this car yet.',
    noHistory = 'This car was typed in on the booking, so there is no history for it.',
    jobsLoading,
    notes,
    notesTitle = 'Notes',
    className,
    testId,
}: VehicleProfileProps) {
    const jobsId = React.useId()
    const notesId = React.useId()
    return (
        <div data-testid={testId} className={cn('flex min-w-0 flex-col gap-5 [overflow-wrap:break-word]', className)}>
            <VehicleCard {...vehicle} headingLevel={3} testId={testId ? `${testId}-car` : undefined} />

            {customer ? (
                <div className="flex flex-col gap-0.5" data-testid={testId ? `${testId}-customer` : undefined}>
                    <p className={SECTION_TITLE}>Customer</p>
                    <p className="text-base font-medium text-[var(--text-strong)]">{customer.name}</p>
                    {customer.detail ? <div className="text-[0.875rem] text-[var(--text-muted)]">{customer.detail}</div> : null}
                </div>
            ) : null}

            <section aria-labelledby={jobsId} className="flex flex-col gap-2">
                <h4 id={jobsId} className={SECTION_TITLE}>
                    {jobsTitle}
                </h4>
                {jobsLoading ? (
                    jobsLoading
                ) : jobs == null ? (
                    <p className="text-[0.875rem] text-[var(--text-muted)]" data-testid={testId ? `${testId}-no-history` : undefined}>
                        {noHistory}
                    </p>
                ) : jobs.length === 0 ? (
                    <p className="text-[0.875rem] text-[var(--text-muted)]" data-testid={testId ? `${testId}-no-jobs` : undefined}>
                        {emptyJobs}
                    </p>
                ) : (
                    <ul className="flex flex-col overflow-hidden rounded-[1.25rem] bg-[var(--band)]">
                        {jobs.map((job, i) => {
                            const inner = (
                                <>
                                    <span className="w-[5.5rem] shrink-0 text-[0.875rem] tabular-nums text-[var(--text-muted)]">
                                        {job.when}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[0.9375rem] font-medium text-[var(--text-strong)]">
                                            {job.title}
                                        </span>
                                        {job.note || job.current ? (
                                            <span className="block text-[0.8125rem] text-[var(--text-muted)]">
                                                {[job.current ? 'This booking' : null, job.note].filter(Boolean).join(' · ')}
                                            </span>
                                        ) : null}
                                    </span>
                                    {job.amount ? (
                                        <span className="shrink-0 text-[0.9375rem] font-bold tabular-nums text-[var(--text-strong)]">
                                            {job.amount}
                                        </span>
                                    ) : null}
                                </>
                            )
                            const rowCls = cn(
                                'flex min-h-11 w-full items-start gap-3 px-4 py-3 text-left',
                                i > 0 && 'border-t border-[var(--hairline)]',
                            )
                            return (
                                <li key={job.id}>
                                    {job.onOpen ? (
                                        <button
                                            type="button"
                                            onClick={job.onOpen}
                                            data-testid={job.testId}
                                            className={cn(
                                                rowCls,
                                                'motion-press-row hover:bg-[var(--band-press)] focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--accent)]',
                                            )}
                                        >
                                            {inner}
                                        </button>
                                    ) : (
                                        <div data-testid={job.testId} className={rowCls}>
                                            {inner}
                                        </div>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                )}
            </section>

            {notes && notes.length > 0 ? (
                <section aria-labelledby={notesId} className="flex flex-col gap-2">
                    <h4 id={notesId} className={SECTION_TITLE}>
                        {notesTitle}
                    </h4>
                    <ul className="flex flex-col gap-2">
                        {notes.map((n) => (
                            <li
                                key={n.id}
                                data-testid={testId ? `${testId}-note` : undefined}
                                className="flex flex-col gap-0.5 rounded-[1rem] bg-[var(--band)] px-4 py-3"
                            >
                                <span className="text-[0.9375rem] text-[var(--text-strong)]">{n.text}</span>
                                {n.when ? <span className="text-[0.8125rem] text-[var(--text-muted)]">{n.when}</span> : null}
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}
        </div>
    )
}
