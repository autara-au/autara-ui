import * as React from 'react'
import type { ReactElement, ReactNode } from 'react'
import { cn } from '../lib/cn'

/**
 * ActionBar: what a person can do next on a detail screen, under the thumb
 * (AUTM-1781).
 *
 * The contract (the customer research, decision of 2026-10-09, and the
 * customer app's AppBookingDetail and AppBookingLive boards):
 *
 *   - ONE `primary`: the thing that matters now, a lime pill, 56px tall.
 *   - Beside it, EITHER up to two `icons` (Message and Call on the day: band
 *     discs, 56px, the label as their accessible name) OR one `secondary`
 *     (a band pill: "Keep Saturday" beside "Accept Sunday").
 *   - Nothing else. Cancel, Change time and Help are never in it: they live
 *     in the page (a row, the top bar), because a bar that holds everything
 *     makes the one right action hard to find.
 *
 *     ┌──────────────────────────────────────────────┐
 *     │  (✉) (✆)  ╭──────────── Directions ───────╮  │
 *     │           ╰───────────────────────────────╯  │
 *     └──────────────────────────────────────────────┘
 *
 * PHONE AND TABLET, below lg: fixed to the bottom edge, paper with a hairline
 * above, clear of the home indicator, rising into place when it mounts. DESKTOP,
 * from lg: in the flow, for a side panel: every control full width, the
 * icon actions as band pills with their names shown, because there is room
 * to, and the primary last.
 *
 * Under the fixed bar the page needs room: below lg give it a bottom padding
 * of `calc(6rem + env(safe-area-inset-bottom))`. At very large text on a
 * narrow phone a fixed bar covers too much of the screen; the caller can put
 * it back in the flow with `position: static` in a container query and render
 * it where it reads in order.
 *
 * Links: autara-ui never imports a router. `element` takes an EMPTY framework
 * link and the control's content is cloned into it; `href` renders a plain
 * anchor (`external` opens a new tab and says so).
 *
 * `actions` is the 8.4 list contract, kept so nothing that adopted it breaks;
 * it is deprecated and renders as it did.
 */

/** One control in the bar. */
export interface ActionBarControl {
    /** Stable key. Also seeds the default `data-testid`. */
    key: string
    /** The visible name; an icon action's accessible name. */
    label: string
    /** About 22px. Required on an icon action; optional on the pills. */
    icon?: ReactNode
    onSelect?: () => void
    href?: string
    /** With `href`: a new tab, said to a screen reader. */
    external?: boolean
    /** An EMPTY framework link; the control's content is cloned into it. */
    element?: ReactElement
    disabled?: boolean
    /** Overrides the derived `data-testid`. A shipped one is public API. */
    testId?: string
}

export interface ActionBarAction {
    /** Stable key. Also seeds the default `data-testid`. */
    key: string
    label: string
    /** About 20px. Decorative: the label names the action. */
    icon: ReactNode
    /** The one action that leads. At most one per bar. */
    primary?: boolean
    /** Danger text and glyph, for Cancel. Never a fill. */
    tone?: 'default' | 'danger'
    /** A second line in the desktop list's rows (never on the primary pill). */
    description?: string
    onSelect?: () => void
    href?: string
    /** With `href`: a new tab, said to a screen reader. */
    external?: boolean
    /** An EMPTY framework link; the action's content is cloned into it. */
    element?: ReactElement
    /** Overrides the derived `data-testid`. A shipped one is public API. */
    testId?: string
}

export interface ActionBarProps {
    /** The one thing that matters now. */
    primary?: ActionBarControl
    /** A quieter alternative beside the primary. Not with `icons`. */
    secondary?: ActionBarControl
    /** Up to two icon actions beside the primary (Message, Call). Not with `secondary`. */
    icons?: ActionBarControl[]
    /**
     * @deprecated since 8.5 (AUTM-1781): use `primary`, `secondary` and
     * `icons`. The 8.4 list, rendered as it was.
     */
    actions?: ActionBarAction[]
    /** The group's accessible name, e.g. "Booking actions". */
    label: string
    className?: string
    /** Seeds each action's `data-testid` (`${testIdPrefix}-${key}`). @default 'action-bar' */
    testIdPrefix?: string
    testId?: string
}

const FOCUS =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]'

/* Every class below is written out in full, the `lg:` ones included: Tailwind
   generates a class only when it finds it literally in the source. */

const CONTAINER =
    'fixed inset-x-0 bottom-0 z-40 border-t border-[var(--hairline)] bg-[var(--surface)] px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] ' +
    'lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0'

const LIST_TILES = 'm-0 mx-auto flex w-full max-w-2xl list-none gap-1 p-0 lg:max-w-none lg:flex-col lg:gap-1'
const LIST_PILLS = 'm-0 mx-auto flex w-full max-w-2xl list-none gap-2 p-0 lg:max-w-none lg:flex-col lg:gap-1'

const ITEM = 'flex min-w-0 flex-1 lg:flex-none'

/** A tile in the dock, a row in the panel. */
const TILE =
    'min-h-14 w-full flex-col justify-center gap-1 rounded-2xl px-1 py-1.5 text-center text-[0.75rem] leading-tight font-medium not-disabled:hover:bg-[var(--band)] ' +
    'lg:flex-row lg:justify-start lg:gap-3 lg:px-2 lg:text-left lg:text-base lg:leading-snug'

/** The primary tile: a tile in the dock, the full-width brand pill in the panel. */
const TILE_PRIMARY =
    'min-h-14 w-full flex-col justify-center gap-1 rounded-2xl px-1 py-1.5 text-center text-[0.75rem] leading-tight font-medium text-[var(--text-strong)] not-disabled:hover:bg-[var(--band)] ' +
    'lg:mb-2 lg:min-h-12 lg:flex-row lg:gap-2 lg:rounded-full lg:bg-[var(--accent-fill)] lg:px-5 lg:text-base lg:leading-snug lg:text-[var(--on-accent)] lg:not-disabled:hover:bg-[var(--accent-fill-hover)]'

/** One or two actions: pills in the dock; the primary stays a pill in the panel, the rest become rows. */
const PILL =
    'min-h-12 w-full flex-row justify-center gap-2 rounded-full bg-[var(--band)] px-4 py-2 text-base leading-snug font-medium not-disabled:hover:bg-[var(--band-press)] ' +
    'lg:min-h-14 lg:justify-start lg:gap-3 lg:rounded-2xl lg:bg-transparent lg:px-2 lg:text-left lg:not-disabled:hover:bg-[var(--band)]'

const PILL_PRIMARY =
    'min-h-12 w-full flex-row justify-center gap-2 rounded-full bg-[var(--accent-fill)] px-4 py-2 text-base leading-snug font-medium text-[var(--on-accent)] not-disabled:hover:bg-[var(--accent-fill-hover)] ' +
    'lg:mb-2 lg:px-5'

/** The glyph's disc on a tile or row. Brand-filled on the primary tile in the dock; gone on the panel's pill. */
const DISC = 'grid size-10 shrink-0 place-items-center rounded-full bg-[var(--band)] [&>svg]:size-5'
const DISC_PRIMARY =
    'grid size-10 shrink-0 place-items-center rounded-full bg-[var(--accent-fill)] text-[var(--on-accent)] [&>svg]:size-5 ' +
    'lg:size-auto lg:bg-transparent'
/** A pill's glyph sits inline in the dock; a non-primary pill's gains the disc as a panel row. */
const BARE = 'grid shrink-0 place-items-center [&>svg]:size-5'
const BARE_TO_DISC = 'grid shrink-0 place-items-center [&>svg]:size-5 lg:size-10 lg:rounded-full lg:bg-[var(--band)]'

const CHEVRON = 'ml-auto hidden shrink-0 text-[var(--text-subtle)] lg:block'

function Chevron({ show }: { show: boolean }) {
    if (!show) return null
    return (
        // Solar AltArrowRight Linear, inlined (autara-ui does not depend on @solar-icons/react).
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className={CHEVRON}>
            <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function LegacyActionBar({
    actions,
    label,
    className,
    testIdPrefix = 'action-bar',
    testId,
}: Omit<ActionBarProps, 'actions'> & { actions: ActionBarAction[] }) {
    if (actions.length === 0) return null
    const pills = actions.length <= 2

    return (
        <div
            role="group"
            aria-label={label}
            data-testid={testId}
            data-count={actions.length}
            className={cn(CONTAINER, className)}
        >
            <ul className={pills ? LIST_PILLS : LIST_TILES}>
                {actions.map((a) => {
                    const danger = a.tone === 'danger'
                    const shape = pills ? (a.primary ? PILL_PRIMARY : PILL) : a.primary ? TILE_PRIMARY : TILE
                    const disc = pills
                        ? a.primary
                            ? BARE
                            : BARE_TO_DISC
                        : a.primary
                          ? DISC_PRIMARY
                          : DISC
                    const controlClass = cn(
                        'group flex min-w-0 items-center transition-colors motion-press',
                        FOCUS,
                        shape,
                        !a.primary && (danger ? 'text-[var(--danger)]' : 'text-[var(--text-strong)]'),
                    )
                    const content = (
                        <>
                            <span aria-hidden className={disc}>
                                {a.icon}
                            </span>
                            {/* break-word, never anywhere: a label breaks between
                                words, and inside one only if it cannot fit at all. */}
                            <span className="flex min-w-0 flex-col [overflow-wrap:break-word]">
                                <span>{a.label}</span>
                                {/* The second line is for the panel's rows; the primary
                                    pill says one thing. */}
                                {a.description && !a.primary ? (
                                    <span className="hidden text-sm font-normal text-[var(--text-muted)] lg:block">
                                        {a.description}
                                    </span>
                                ) : null}
                            </span>
                            {a.href && a.external ? <span className="sr-only">(opens in a new tab)</span> : null}
                            <Chevron show={!a.primary} />
                        </>
                    )
                    const shared = {
                        className: controlClass,
                        'data-testid': a.testId ?? `${testIdPrefix}-${a.key}`,
                        'data-primary': a.primary ? '' : undefined,
                    }
                    let control: ReactNode
                    if (a.element) {
                        control = React.cloneElement(
                            a.element as ReactElement<Record<string, unknown>>,
                            {
                                ...shared,
                                className: cn((a.element.props as { className?: string }).className, controlClass),
                                onClick: a.onSelect,
                            },
                            content,
                        )
                    } else if (a.href) {
                        control = (
                            <a
                                href={a.href}
                                {...shared}
                                onClick={a.onSelect}
                                {...(a.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            >
                                {content}
                            </a>
                        )
                    } else {
                        control = (
                            <button type="button" {...shared} onClick={a.onSelect}>
                                {content}
                            </button>
                        )
                    }
                    return (
                        <li key={a.key} className={ITEM}>
                            {control}
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

/* ─── The 8.5 contract: one primary, then two icons or one secondary ─── */

const BAR =
    'motion-bar-in fixed inset-x-0 bottom-0 z-40 border-t border-[var(--hairline)] bg-[var(--paper)] px-5 pt-3.5 pb-[max(1.75rem,calc(0.875rem+env(safe-area-inset-bottom)))] ' +
    'lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0'

const ROW = 'mx-auto flex w-full max-w-2xl items-center gap-2.5 lg:max-w-none lg:flex-col lg:items-stretch lg:gap-2'

/*
 * AUTM-1905: `flex-wrap` so a label too long for one line beside its icon puts the
 * icon on its own line above it, centred, instead of overflowing the padding (at
 * 200% text "Message Fitzroy Paint Co" pushed the icon onto the pill's edge,
 * because centred content that overflows spills out of both sides).
 */
const PILL_BASE =
    'motion-press inline-flex min-h-14 min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full px-5 py-2 text-center text-[1.0625rem] leading-tight font-medium [overflow-wrap:break-word] ' +
    'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50'

/** Lime on paper: the one action that leads. */
const NEXT_PRIMARY = `${PILL_BASE} flex-1 bg-[var(--lime)] text-[var(--on-lime)] not-disabled:hover:bg-[var(--lime-press)] lg:w-full lg:flex-none`

/** Band: the quieter choice beside it. */
const NEXT_SECONDARY = `${PILL_BASE} flex-1 bg-[var(--band)] text-[var(--text-strong)] not-disabled:hover:bg-[var(--band-press)] lg:w-full lg:flex-none`

/** A 56px band disc below lg; a band pill with its name from lg. */
const NEXT_ICON =
    'motion-press inline-flex size-14 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--band)] text-[var(--text-strong)] not-disabled:hover:bg-[var(--band-press)] ' +
    'lg:h-auto lg:min-h-12 lg:w-full lg:flex-wrap lg:gap-x-2 lg:gap-y-1 lg:px-5 lg:py-2 lg:text-center lg:text-base lg:font-medium lg:[overflow-wrap:break-word]'

function Control({
    control,
    className,
    iconOnly,
    testId,
    primary,
}: {
    control: ActionBarControl
    className: string
    iconOnly: boolean
    testId: string
    primary?: boolean
}) {
    const cls = cn(className, FOCUS)
    const content = (
        <>
            {control.icon ? (
                // 22px at 16px text, in em so it grows with the label (AUTM-1905).
                <span aria-hidden className="grid shrink-0 place-items-center [&>svg]:size-[1.375em]">
                    {control.icon}
                </span>
            ) : null}
            {/* An icon action's name is its accessible name below lg and its
                visible name from lg. */}
            <span className={iconOnly ? 'sr-only lg:not-sr-only' : 'min-w-0'}>{control.label}</span>
            {control.href && control.external ? <span className="sr-only">(opens in a new tab)</span> : null}
        </>
    )
    const shared = {
        className: cls,
        'data-testid': testId,
        'data-primary': primary ? '' : undefined,
    }
    if (control.element) {
        return React.cloneElement(
            control.element as ReactElement<Record<string, unknown>>,
            {
                ...shared,
                className: cn((control.element.props as { className?: string }).className, cls),
                onClick: control.onSelect,
                'aria-disabled': control.disabled || undefined,
            },
            content,
        )
    }
    if (control.href && !control.disabled) {
        return (
            <a
                href={control.href}
                {...shared}
                onClick={control.onSelect}
                {...(control.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
                {content}
            </a>
        )
    }
    return (
        <button type="button" {...shared} onClick={control.onSelect} disabled={control.disabled}>
            {content}
        </button>
    )
}

export function ActionBar(props: ActionBarProps) {
    const { primary, secondary, icons, actions, label, className, testIdPrefix = 'action-bar', testId } = props
    if (actions && !primary && !secondary && !icons) {
        return <LegacyActionBar {...props} actions={actions} />
    }
    /* The contract, kept by the component: two icons at most, and never icons
       and a secondary together (the secondary wins, it carries words). */
    const iconActions = secondary ? [] : (icons ?? []).slice(0, 2)
    if (!primary && !secondary && iconActions.length === 0) return null
    const id = (c: ActionBarControl) => c.testId ?? `${testIdPrefix}-${c.key}`

    return (
        <div
            role="group"
            aria-label={label}
            data-testid={testId}
            data-shape={secondary ? 'secondary' : iconActions.length ? 'icons' : 'primary'}
            className={cn(BAR, className)}
        >
            <div className={ROW}>
                {/* One order everywhere, so the focus order is the reading
                    order: the quieter controls first, the primary last, on the
                    right under a phone's thumb and at the foot of a panel. */}
                {iconActions.map((c) => (
                    <Control key={c.key} control={c} className={NEXT_ICON} iconOnly testId={id(c)} />
                ))}
                {secondary ? (
                    <Control control={secondary} className={NEXT_SECONDARY} iconOnly={false} testId={id(secondary)} />
                ) : null}
                {primary ? (
                    <Control control={primary} className={NEXT_PRIMARY} iconOnly={false} testId={id(primary)} primary />
                ) : null}
            </div>
        </div>
    )
}
