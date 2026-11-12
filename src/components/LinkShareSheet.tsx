'use client'

import * as React from 'react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { Button } from './Button'
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './Dialog'
import { ErrorCard } from './ErrorCard'
import { Skeleton } from './Skeleton'

/**
 * LinkShareSheet: one link, ready to hand to a person (AUTM-1856).
 *
 * The merchant portal's Share business sheet (AUTM-1637) set the pattern: the
 * link as text, a QR to show or print beside it, and one control for each way
 * the link can leave, with the system share pinned as the primary. The
 * payment link needed the same sheet with an amount and a state on top, and
 * the booking and invoice links are next, so the pattern lives here and the
 * app supplies what is particular to it:
 *
 *   - `summary`  what is being shared and where it stands (an amount and a
 *                badge: Sent, Paid, Expired). Above everything.
 *   - `qr`       the code, drawn by the app (autara-ui has no QR encoder).
 *   - `targets`  Copy link, a text, an email, open the page. A target is a
 *                link (`href`: `sms:`, `mailto:`) or a press (`onSelect`). A
 *                press that answers `true` flips the label to `doneLabel`
 *                ("Copied") for a moment, and says so to a screen reader.
 *   - `primary`  the one pinned action, normally the system share sheet.
 *
 * References (AUTM-1856): Autara's own Share business sheet is the layout;
 * Fresha's profile share sheet (copy link, email, socials: steal copy and
 * email, avoid the socials); a money app's payment request (the amount and
 * its state first, then the link with Copy and Share: steal). The PR carries
 * the reference list and verdicts.
 *
 * A bottom sheet on a phone and a centred card from `sm` (Dialog
 * `layout="responsive"`), so the motion and reduced motion are the Dialog's.
 * The body goes to two columns (code | link and targets) when the sheet has
 * 36rem of room at the CURRENT text size (a rem container query), so 200%
 * text gets one column. Targets are 48px quiet buttons, two to a row, one
 * below 16rem.
 *
 * Three states while the link is made: `loading` (a skeleton where the link
 * and targets go, announced), `error` (the sentence and a retry, nothing to
 * share), then the link. Feedback after a press (`note`, `problem`) stays IN
 * the dialog: a toast outside it is aria-hidden while the dialog is open.
 *
 * `shareHrefs` builds the `sms:` and `mailto:` links, encoded, so every app
 * writes them the same way.
 */
export interface ShareTarget {
    id: string
    label: string
    icon?: ReactNode
    /** A link the target opens: `sms:`, `mailto:`, `https:`. Drawn as an anchor. */
    href?: string
    /** Open `href` in a new tab (an `https:` page). */
    newTab?: boolean
    /**
     * A press. Answer `true` (or a promise of `true`) to show `doneLabel` for a
     * moment; anything else leaves the label alone.
     */
    onSelect?: () => void | boolean | Promise<boolean | void>
    /** Shown in place of `label` after a press that answered `true` ("Copied"). */
    doneLabel?: string
    /** Read to a screen reader after that press ("Link copied"). Defaults to `doneLabel`. */
    doneAnnouncement?: string
    disabled?: boolean
    testId?: string
}

export interface LinkShareSheetPrimary {
    label: string
    icon?: ReactNode
    onClick: () => void
    busy?: boolean
    disabled?: boolean
    testId?: string
}

export interface LinkShareSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: ReactNode
    description?: ReactNode
    /** What is being shared and where it stands: an amount, a badge, a line. */
    summary?: ReactNode
    /** The link. Shown without its scheme, one selectable string that wraps. */
    url?: string | null
    /** Over the link. Default "Link". */
    urlLabel?: string
    /** The QR card or code, beside the link from 36rem of sheet. */
    qr?: ReactNode
    /** The ways the link can leave. */
    targets?: ShareTarget[]
    /** The one pinned action, normally the system share sheet. */
    primary?: LinkShareSheetPrimary
    /** The link is being made. */
    loading?: boolean
    /** Read while loading. Default "Getting the link ready". */
    loadingLabel?: string
    /** The link could not be made. */
    error?: { title?: string; message: string; onRetry?: () => void } | null
    /** A sentence after a press, read politely ("We copied it instead"). */
    note?: ReactNode
    /** Something that went wrong after a press, read at once. */
    problem?: ReactNode
    /** Small print at the end of the body. */
    footnote?: ReactNode
    closeLabel?: string
    testId?: string
    className?: string
}

/** How long a target's `doneLabel` stays before the label comes back. */
const DONE_MS = 2200

/** The link as a person reads it: the scheme dropped, nothing else changed. */
export function displayLink(url: string): string {
    return url.replace(/^https?:\/\//, '')
}

/**
 * `sms:` and `mailto:` links, encoded once. `sms:?&body=` is the form both
 * iOS and Android open with the text filled in.
 */
export function smsHref(body: string, to = ''): string {
    return `sms:${encodeURIComponent(to)}?&body=${encodeURIComponent(body)}`
}

export function emailHref({ subject, body, to = '' }: { subject: string; body: string; to?: string }): string {
    return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export const shareHrefs = { sms: smsHref, email: emailHref }

function TargetButton({ target, onDone }: { target: ShareTarget; onDone: (text: string) => void }) {
    const [done, setDone] = React.useState(false)
    const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    React.useEffect(
        () => () => {
            if (timer.current) clearTimeout(timer.current)
        },
        [],
    )

    async function press() {
        if (!target.onSelect) return
        const answer = await target.onSelect()
        if (answer === true && target.doneLabel) {
            if (timer.current) clearTimeout(timer.current)
            setDone(true)
            onDone(target.doneAnnouncement ?? target.doneLabel)
            timer.current = setTimeout(() => setDone(false), DONE_MS)
        }
    }

    const shown = done && target.doneLabel ? target.doneLabel : target.label
    const common = {
        variant: 'quiet' as const,
        size: 'md' as const,
        className: 'w-full justify-start disabled:opacity-50 aria-disabled:opacity-50',
        'data-testid': target.testId,
        'data-target-id': target.id,
    }
    if (target.href && !target.disabled) {
        // `asChild` hands the button's look to the anchor and drops
        // `leadingIcon`, so the icon goes inside the anchor itself.
        return (
            <Button {...common} asChild>
                <a
                    href={target.href}
                    onClick={target.onSelect ? () => void press() : undefined}
                    {...(target.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                    {target.icon}
                    {shown}
                </a>
            </Button>
        )
    }
    return (
        <Button {...common} leadingIcon={target.icon} disabled={target.disabled} onClick={() => void press()}>
            {shown}
        </Button>
    )
}

export function LinkShareSheet({
    open,
    onOpenChange,
    title,
    description,
    summary,
    url,
    urlLabel = 'Link',
    qr,
    targets = [],
    primary,
    loading = false,
    loadingLabel = 'Getting the link ready',
    error = null,
    note,
    problem,
    footnote,
    closeLabel = 'Close',
    testId = 'link-share-sheet',
    className,
}: LinkShareSheetProps) {
    const linkId = React.useId()
    const primaryRef = React.useRef<HTMLButtonElement>(null)
    // The sentence a target's press leaves for a screen reader ("Link copied").
    const [announce, setAnnounce] = React.useState('')
    React.useEffect(() => {
        if (!open) setAnnounce('')
    }, [open])

    const shown = url ? displayLink(url) : null
    const ready = !loading && !error && !!url

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                layout="responsive"
                size="lg"
                closeLabel={closeLabel}
                data-testid={testId}
                className={className}
                // No description: say so, rather than Radix pointing at none.
                {...(description ? {} : { 'aria-describedby': undefined })}
                // Focus the primary action once there is a link to share, so
                // Enter shares; Tab still reaches everything, Escape closes.
                onOpenAutoFocus={(event) => {
                    if (!ready || !primary || primary.disabled) return
                    event.preventDefault()
                    primaryRef.current?.focus({ preventScroll: true })
                }}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description ? <DialogDescription className="pr-11">{description}</DialogDescription> : null}
                </DialogHeader>

                <DialogBody>
                    {summary ? (
                        <div data-testid={`${testId}-summary`} className="mb-5">
                            {summary}
                        </div>
                    ) : null}

                    {loading ? (
                        <div role="status" aria-live="polite" data-testid={`${testId}-loading`} className="flex flex-col gap-3">
                            <span className="sr-only">{loadingLabel}</span>
                            <Skeleton label={null} className="h-[3.25rem] w-full rounded-2xl" />
                            <div className="grid grid-cols-2 gap-2.5">
                                <Skeleton label={null} className="h-12 rounded-[1.5rem]" />
                                <Skeleton label={null} className="h-12 rounded-[1.5rem]" />
                                <Skeleton label={null} className="h-12 rounded-[1.5rem]" />
                                <Skeleton label={null} className="h-12 rounded-[1.5rem]" />
                            </div>
                        </div>
                    ) : error ? (
                        <div data-testid={`${testId}-error`}>
                            <ErrorCard
                                title={error.title ?? "Couldn't get the link"}
                                message={error.message}
                                onRetry={error.onRetry}
                            />
                        </div>
                    ) : shown ? (
                        <div className="@container">
                            <div className={cn('grid gap-5', qr && '@min-[36rem]:grid-cols-2 @min-[36rem]:gap-6')}>
                                {qr ? <div className="min-w-0">{qr}</div> : null}
                                <div className="@container flex min-w-0 flex-col">
                                    <p id={linkId} className="text-[0.8125rem] font-medium text-[var(--text-muted)]">
                                        {urlLabel}
                                    </p>
                                    {/* One text node, so the whole link is one
                                        selectable string; it wraps rather than
                                        truncating, so the person sees exactly
                                        what is sent. */}
                                    <p
                                        data-testid={`${testId}-url`}
                                        aria-labelledby={linkId}
                                        className="mt-2 rounded-2xl bg-[var(--band)] px-4 py-3 text-[0.9375rem] leading-snug font-medium text-[var(--text-strong)] select-all [overflow-wrap:anywhere]"
                                    >
                                        {shown}
                                    </p>
                                    {targets.length ? (
                                        <div
                                            role="group"
                                            aria-label="Ways to send it"
                                            className="mt-2.5 grid grid-cols-2 gap-2.5 @max-[16rem]:grid-cols-1"
                                        >
                                            {targets.map((t) => (
                                                <TargetButton key={t.id} target={t} onDone={setAnnounce} />
                                            ))}
                                        </div>
                                    ) : null}
                                    <p
                                        role="status"
                                        data-testid={`${testId}-note`}
                                        className={
                                            note
                                                ? 'mt-2.5 text-[0.875rem] leading-snug text-[var(--text-muted)]'
                                                : 'sr-only'
                                        }
                                    >
                                        {note ?? announce}
                                    </p>
                                    <p
                                        role="alert"
                                        data-testid={`${testId}-problem`}
                                        className={
                                            problem
                                                ? 'mt-2.5 text-[0.875rem] leading-snug font-medium text-[var(--danger)]'
                                                : 'sr-only'
                                        }
                                    >
                                        {problem ?? ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {footnote ? (
                        <p className="mt-5 text-[0.8125rem] leading-relaxed text-[var(--text-subtle)]">{footnote}</p>
                    ) : null}
                </DialogBody>

                {primary ? (
                    <DialogFooter>
                        <Button
                            ref={primaryRef}
                            variant="primary"
                            size="lg"
                            onClick={primary.onClick}
                            busy={primary.busy}
                            disabled={primary.disabled || !ready}
                            data-testid={primary.testId}
                            leadingIcon={primary.icon}
                            className="disabled:opacity-50"
                        >
                            {primary.label}
                        </Button>
                    </DialogFooter>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
