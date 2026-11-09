import { AutaraIcon, type AutaraIconProps } from './AutaraIcon'

/**
 * AUTM-2114: the utility glyphs. Line only, no body: they sit inside buttons
 * and runs of text, where a body would read as a second control. Same 1.7
 * stroke, round caps and 3 radii as the object icons.
 *
 * Close, Check, Add and Remove come twice (Don, 2026-11-08): bare, for a
 * dismiss button, an inline tick and a stepper inside its own disc; and in a
 * ring (`CloseCircleIcon`, `CheckCircleIcon`, `AddCircleIcon`,
 * `RemoveCircleIcon`) for a state that stands on its own: cancelled, done,
 * inactive. Pause and Error are ringed only. A sheet's close button is
 * `CloseButton`, which has its own glyph.
 */

/** The ring the state glyphs sit in (a component, so nothing is built at import). */
function Ring() {
    return <circle cx="12" cy="12" r="8.6" />
}

/* ─── Direction ─────────────────────────────────────────────────────────── */

export function ChevronRightIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="chevron-right" {...props}>
            <path d="m9.4 6 6 6-6 6" />
        </AutaraIcon>
    )
}

export function ChevronLeftIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="chevron-left" {...props}>
            <path d="m14.6 6-6 6 6 6" />
        </AutaraIcon>
    )
}

export function ChevronUpIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="chevron-up" {...props}>
            <path d="m6 14.6 6-6 6 6" />
        </AutaraIcon>
    )
}

export function ChevronDownIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="chevron-down" {...props}>
            <path d="m6 9.4 6 6 6-6" />
        </AutaraIcon>
    )
}

/** Go on: view all, next. */
export function ArrowRightIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="arrow-right" {...props}>
            <path d="M4.4 12h15M14.4 6.8l5.2 5.2-5.2 5.2" />
        </AutaraIcon>
    )
}

/** Opens somewhere else (a new tab, the public page). */
export function ExternalLinkIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="external-link" {...props}>
            <path d="M10.8 4.4H7.4a3 3 0 0 0-3 3v9.2a3 3 0 0 0 3 3h9.2a3 3 0 0 0 3-3v-3.4" />
            <path d="m12.6 11.4 7-7M14.4 4.4h5.2v5.2" />
        </AutaraIcon>
    )
}

/** Save a file to the device. */
export function DownloadIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="download" {...props}>
            <path d="M4.4 14.6v2a3 3 0 0 0 3 3h9.2a3 3 0 0 0 3-3v-2" />
            <path d="M12 4.2v10.6M8.6 11.4l3.4 3.4 3.4-3.4" />
        </AutaraIcon>
    )
}

/** Fetch again, repeat, a reschedule asked for. */
export function RefreshIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="refresh" {...props}>
            <path d="M4 12a8 8 0 0 1 14.2-5M20 12a8 8 0 0 1-14.2 5" />
            <path d="M18.6 3.4v3.8h-3.8M5.4 20.6v-3.8h3.8" />
        </AutaraIcon>
    )
}

/* ─── Bare marks: a dismiss, an inline tick, a stepper ─────────────────── */

/** Dismiss, clear. */
export function CloseIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="close" {...props}>
            <path d="m6.4 6.4 11.2 11.2M17.6 6.4 6.4 17.6" />
        </AutaraIcon>
    )
}

/** A tick inline: copied, chosen, included. */
export function CheckIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="check" {...props}>
            <path d="m4.8 12.6 4.6 4.6 9.8-9.8" />
        </AutaraIcon>
    )
}

/** Add, one more. */
export function AddIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="add" {...props}>
            <path d="M12 5.4v13.2M5.4 12h13.2" />
        </AutaraIcon>
    )
}

/** One fewer. */
export function RemoveIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="remove" {...props}>
            <path d="M5.4 12h13.2" />
        </AutaraIcon>
    )
}

/* ─── States (in a ring) ────────────────────────────────────────────────── */

/** Cancelled, declined. */
export function CloseCircleIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="close-circle" {...props}>
            <Ring />
            <path d="m9.4 9.4 5.2 5.2M14.6 9.4l-5.2 5.2" />
        </AutaraIcon>
    )
}

/** Done, confirmed, a step complete. */
export function CheckCircleIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="check-circle" {...props}>
            <Ring />
            <path d="m8.4 12.2 2.5 2.5 4.7-4.8" />
        </AutaraIcon>
    )
}

/** Add, standing on its own. */
export function AddCircleIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="add-circle" {...props}>
            <Ring />
            <path d="M12 8.4v7.2M8.4 12h7.2" />
        </AutaraIcon>
    )
}

/** Inactive; one fewer, standing on its own. */
export function RemoveCircleIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="remove-circle" {...props}>
            <Ring />
            <path d="M8.4 12h7.2" />
        </AutaraIcon>
    )
}

/** On hold, paused. */
export function PauseIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="pause" {...props}>
            <Ring />
            <path d="M10 9.2v5.6M14 9.2v5.6" />
        </AutaraIcon>
    )
}

/** Something failed: an error, a payment that did not go through. */
export function ErrorIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="error" {...props}>
            <Ring />
            <path d="M12 7.8v4.8" />
            <circle cx="12" cy="15.9" r=".95" fill="currentColor" stroke="none" />
        </AutaraIcon>
    )
}

/** Not allowed: void, blocked. */
export function BlockedIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="blocked" {...props}>
            <Ring />
            <path d="m5.9 5.9 12.2 12.2" />
        </AutaraIcon>
    )
}

/** Needs attention: changes required. */
export function WarningIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="warning" {...props}>
            <path d="M10.3 4.9a2 2 0 0 1 3.4 0l6.7 11.6a2 2 0 0 1-1.7 3H5.3a2 2 0 0 1-1.7-3z" />
            <path d="M12 9.6v3.8" />
            <circle cx="12" cy="16.3" r=".95" fill="currentColor" stroke="none" />
        </AutaraIcon>
    )
}

/** Marked as read: two ticks. */
export function ReadReceiptIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="read-receipt" {...props}>
            <path d="m3.4 12.6 3.6 3.6 7.4-7.4M12.4 15.6l.6.6 7.4-7.4" />
        </AutaraIcon>
    )
}

/* ─── Actions ───────────────────────────────────────────────────────────── */

export function CopyIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="copy" {...props}>
            <path d="M15.6 8.4V6.6a3 3 0 0 0-3-3H6.6a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h1.8" />
            <rect x="8.4" y="8.4" width="12" height="12" rx="3" />
        </AutaraIcon>
    )
}

export function SearchIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="search" {...props}>
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m15.8 15.8 4.4 4.4" />
        </AutaraIcon>
    )
}

/** Sliders: filters, view settings. */
export function FiltersIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="filters" {...props}>
            <path d="M3.6 7.4h8.6M17 7.4h3.4M3.6 16.6h3.4M11.8 16.6h8.6" />
            <circle cx="14.6" cy="7.4" r="2.4" />
            <circle cx="9.4" cy="16.6" r="2.4" />
        </AutaraIcon>
    )
}

export function EditIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="edit" {...props}>
            <path d="M15.2 4.8a2 2 0 0 1 2.8 0l1.2 1.2a2 2 0 0 1 0 2.8L8.6 19.4l-4.6 1 1-4.6z" />
            <path d="m13.4 6.6 4 4" />
        </AutaraIcon>
    )
}

export function DeleteIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="delete" {...props}>
            <path d="M3.8 6.6h16.4M9.4 6.6V5a1.4 1.4 0 0 1 1.4-1.4h2.4A1.4 1.4 0 0 1 14.6 5v1.6" />
            <path d="m5.8 6.6.9 11.6a2.6 2.6 0 0 0 2.6 2.4h5.4a2.6 2.6 0 0 0 2.6-2.4l.9-11.6M10.2 10.6v5.6M13.8 10.6v5.6" />
        </AutaraIcon>
    )
}

/** An eye: preview, show. */
export function ShowIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="show" {...props}>
            <path d="M3.4 12c1.9-3.9 5-6.2 8.6-6.2s6.7 2.3 8.6 6.2c-1.9 3.9-5 6.2-8.6 6.2S5.3 15.9 3.4 12z" />
            <circle cx="12" cy="12" r="2.8" />
        </AutaraIcon>
    )
}

/** Play (a sound preview). */
export function PlayIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="play" {...props}>
            <path d="M7.4 6.1a1.2 1.2 0 0 1 1.8-1l9.6 5.9a1.2 1.2 0 0 1 0 2l-9.6 5.9a1.2 1.2 0 0 1-1.8-1z" />
        </AutaraIcon>
    )
}

/** A padlock: locked, private (a note only the merchant sees). */
export function LockIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="lock" {...props}>
            <rect x="4.8" y="10.2" width="14.4" height="10.4" rx="3" />
            <path d="M8 10.2V7.6a4 4 0 0 1 8 0v2.6M12 14.4v2.2" />
        </AutaraIcon>
    )
}

/** Three dots: more actions. Approved in merchant-mobile, ported unchanged. */
export function MoreIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="more" {...props}>
            <g fill="currentColor" stroke="none">
                <circle cx="5.6" cy="12" r="1.7" />
                <circle cx="12" cy="12" r="1.7" />
                <circle cx="18.4" cy="12" r="1.7" />
            </g>
        </AutaraIcon>
    )
}
