'use client'

import * as React from 'react'
import { cn } from '../lib/cn'
import { PHOTO_COPY } from '../lib/photo-copy'
import { BlockedIcon, CloseIcon, ErrorIcon, PhotoIcon, RefreshIcon } from '../icons'
import { Spinner } from './Spinner'

/**
 * PhotoTile: one photo on its way in (AUTM-1882, AUTM-1810). The tile in the
 * chat's attach tray, the car's photo slots and the booking request's photos,
 * from the moment a file is picked to the moment the API has checked it.
 *
 * States, with the plan's words (knowledge/project_photos_plan_2026_11_13.md,
 * section 6; the strings live in `PHOTO_COPY`):
 *
 *   preparing    a still skeleton at the tile's final size, pulsing, while
 *                preparePhoto re-encodes. Nothing moves when the photo lands.
 *   uploading    the photo under the scrim with an aqua ring: `progress` 0
 *                to 1 fills it (a `progressbar` with the value); without it
 *                the full ring breathes in opacity. "Uploading photo".
 *   checking     the photo under the scrim with the Autara mark turning
 *                (Spinner, work on something already on screen). "Checking
 *                photo".
 *   ready        the photo. With `onOpen` the tile is a button that opens it.
 *   failed       the photo under the scrim; the whole tile is the retry.
 *                `failure="upload"` (default): "Upload didn't finish. Tap to
 *                retry."; `failure="check"` (PHOTO_CHECK_FAILED): "We couldn't
 *                check this photo. Try again."
 *   refused      the check said no. The photo is NOT drawn again; band, the
 *                blocked glyph in danger, "This photo can't be sent. It breaks
 *                our photo rules." (`reason` replaces it, for a review's
 *                "posted"). Remove only, never retry.
 *   unavailable  removed or erased: band, "Photo no longer available".
 *
 * The remove control (`onRemove`) is a 44px button in the top-right corner,
 * drawn as a `--photo-disc` disc with a white cross (24px tucked into the
 * corner of a tray tile, 28px from 6.5rem), named "Remove
 * photo 2 of 3" from `index` and `total`. Present in every state, so a stuck
 * or refused photo can always be taken back out.
 *
 * Words on a small tile. A tile is a size container: the short captions
 * (Uploading photo, Checking photo, Photo no longer available) show from
 * 6.5rem wide, the long ones (the failure and the refusal) from 10rem. Below
 * that the glyph shows and the words are still read out: each tile has one
 * polite status line that changes with the state, so a screen reader hears
 * "Uploading photo", then "Checking photo", then the failure if there is one.
 * PhotoAttachTray and PhotoSlots pass `captions="short"` and print the long
 * words once under the row instead, where there is room for them.
 *
 * Contrast: the words and the ring sit on `--photo-scrim` and the remove on
 * `--photo-disc`, both held at 4.5:1 for white over a pure white photo, and
 * the disc still shows on a tile with no photo (photo-contrast.test.ts). No
 * shadow. Motion: the photo fades in on its own load, opacity only; the
 * skeleton and the breathing ring stop under reduced motion.
 *
 * The tile takes its width from its parent (`w-full`) and its height from
 * `ratio` (square by default). It is a size container, so give it a width:
 * in a flex row with none it collapses.
 */

export type PhotoTileState = 'preparing' | 'uploading' | 'checking' | 'ready' | 'failed' | 'refused' | 'unavailable'
export type PhotoFailure = 'upload' | 'check'

/** One photo as PhotoAttachTray and PhotoSlots take it: a PhotoTile's data, keyed. */
export interface PhotoItem {
    id: string
    state: PhotoTileState
    /** A preview (the prepared blob's object URL) or the signed URL. */
    src?: string | null
    /** What the photo shows, when the person has said. */
    alt?: string
    /** 0 to 1 while uploading. */
    progress?: number | null
    /** Which failure, while `failed`. @default 'upload' */
    failure?: PhotoFailure
    /** Replaces the refusal's words while `refused`. */
    reason?: string
    /** `data-testid` on the tile. */
    testId?: string
}

export interface PhotoTileProps {
    state: PhotoTileState
    src?: string | null
    alt?: string
    progress?: number | null
    failure?: PhotoFailure
    reason?: string
    /** This photo's place, from 1, and how many there are: "Remove photo 2 of 3". */
    index?: number
    total?: number
    onRemove?: () => void
    /** Required for `failed` to be tappable. */
    onRetry?: () => void
    /** Makes a `ready` tile a button that opens the photo (PhotoViewer). */
    onOpen?: () => void
    /** Called once when `src` fails to load (an expired signed URL): fetch a fresh one. */
    onImageError?: () => void
    /** `short`: the failure and refusal words stay off the tile at any size (the caller prints them). @default 'all' */
    captions?: 'all' | 'short'
    /** CSS aspect ratio. @default '1 / 1' */
    ratio?: string
    /** Overrides "Remove photo 2 of 3". */
    removeLabel?: string
    /** `data-testid` on the remove button. */
    removeTestId?: string
    className?: string
    testId?: string
}

/** "photo 2 of 3", "photo 2", or "photo". */
export function photoOrdinal(index?: number, total?: number): string {
    if (index == null) return 'photo'
    return total != null ? `photo ${index} of ${total}` : `photo ${index}`
}

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** The words a state says, or null (ready). */
export function photoStateCopy(state: PhotoTileState, failure: PhotoFailure = 'upload', reason?: string): string | null {
    switch (state) {
        case 'uploading':
            return PHOTO_COPY.uploading
        case 'checking':
            return PHOTO_COPY.checking
        case 'failed':
            return failure === 'check' ? PHOTO_COPY.checkUnavailable : PHOTO_COPY.uploadFailed
        case 'refused':
            return reason ?? PHOTO_COPY.refused
        case 'unavailable':
            return PHOTO_COPY.erased
        default:
            return null
    }
}

/** A state whose words are long and go under a row of small tiles. */
export function isLongPhotoState(state: PhotoTileState): boolean {
    return state === 'failed' || state === 'refused'
}

/**
 * The upload ring: aqua on a faint white track, on the scrim. Drawn, not a
 * spinner: it fills with real progress and never turns. The arc is set, not
 * animated (only opacity and transform move here).
 */
function UploadRing({ progress, label }: { progress?: number | null; label: string }) {
    const r = 17
    const c = 2 * Math.PI * r
    const p = progress == null || Number.isNaN(progress) ? null : Math.min(1, Math.max(0, progress))
    return (
        <span
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={p == null ? undefined : Math.round(p * 100)}
            data-progress={p == null ? 'indeterminate' : Math.round(p * 100)}
            // 28px on a tray tile, so it clears the remove disc; 40px from 6.5rem.
            className={cn('block size-7 shrink-0 @min-[6.5rem]:size-10', p == null && 'motion-skeleton')}
        >
            <svg viewBox="0 0 44 44" className="size-full -rotate-90" aria-hidden="true" focusable="false">
                <circle cx="22" cy="22" r={r} fill="none" stroke="var(--on-photo)" strokeOpacity={0.3} strokeWidth={4} />
                <circle
                    cx="22"
                    cy="22"
                    r={r}
                    fill="none"
                    stroke="var(--aqua)"
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={p == null ? 0 : c * (1 - p)}
                />
            </svg>
        </span>
    )
}

export const PhotoTile = React.forwardRef<HTMLDivElement, PhotoTileProps>(function PhotoTile(
    {
        state,
        src,
        alt,
        progress,
        failure = 'upload',
        reason,
        index,
        total,
        onRemove,
        onRetry,
        onOpen,
        onImageError,
        captions = 'all',
        ratio = '1 / 1',
        removeLabel,
        removeTestId,
        className,
        testId,
    },
    ref
) {
    // Keyed by the URL: a fresh `src` after an expired one is tried again.
    const [brokenSrc, setBrokenSrc] = React.useState<string | null>(null)
    const broken = !!src && brokenSrc === src

    const altId = React.useId()
    const ordinal = photoOrdinal(index, total)
    const copy = photoStateCopy(state, failure, reason)
    const photoShown = !!src && !broken && (state === 'uploading' || state === 'checking' || state === 'ready' || state === 'failed')
    const onPhoto = state === 'uploading' || state === 'checking' || state === 'failed'
    const long = isLongPhotoState(state)
    const statusText = state === 'preparing' ? 'Preparing photo' : copy ?? ''

    // The tile's own action: retry a failure, or open a ready photo.
    const action =
        state === 'failed' && onRetry
            ? { label: copy ?? '', run: onRetry, opens: false }
            : state === 'ready' && onOpen && photoShown
              ? { label: `Open ${ordinal}`, run: onOpen, opens: true }
              : null

    const glyph =
        state === 'uploading' ? (
            <UploadRing progress={progress} label={`${PHOTO_COPY.uploading}, ${ordinal}`} />
        ) : state === 'checking' ? (
            <Spinner tone="on-photo" size="md" decorative />
        ) : state === 'failed' ? (
            failure === 'check' ? (
                <ErrorIcon size="1.5rem" aria-hidden />
            ) : (
                <RefreshIcon size="1.5rem" aria-hidden />
            )
        ) : state === 'refused' ? (
            <BlockedIcon size="1.5rem" active aria-hidden className="text-[var(--danger)]" />
        ) : state === 'unavailable' || (state === 'ready' && !photoShown) ? (
            <PhotoIcon size="1.5rem" aria-hidden className="text-[var(--text-muted)]" />
        ) : null

    // Short words from 6.5rem, long ones from 10rem, or never on the tile.
    const captionClass =
        copy == null
            ? null
            : long
              ? captions === 'short'
                  ? 'hidden'
                  : 'hidden @min-[10rem]:block'
              : 'hidden @min-[6.5rem]:block'

    return (
        <div
            ref={ref}
            role="group"
            aria-label={capitalise(ordinal)}
            // The person's description of the photo: on the open button when
            // there is one, else on the tile.
            aria-describedby={alt && !action?.opens ? altId : undefined}
            data-testid={testId}
            data-photo-state={state}
            className={cn(
                '@container relative isolate w-full rounded-[0.875rem]',
                // The tile's action is drawn focused on the tile itself, outside
                // its edge, so the ring is on the page and never on the photo.
                'has-[[data-tile-action]:focus-visible]:outline-2 has-[[data-tile-action]:focus-visible]:outline-offset-2 has-[[data-tile-action]:focus-visible]:outline-[var(--accent)]',
                className
            )}
            style={{ aspectRatio: ratio }}
        >
            <div
                aria-hidden="true"
                className={cn(
                    'absolute inset-0 overflow-hidden rounded-[inherit]',
                    state === 'preparing' ? 'bg-[var(--band-press)]' : 'bg-[var(--band)]'
                )}
            >
                {state === 'preparing' ? <span className="motion-skeleton absolute inset-0 bg-[var(--band)]" /> : null}
                {photoShown ? (
                    <img
                        src={src!}
                        alt=""
                        decoding="async"
                        draggable={false}
                        onError={() => {
                            setBrokenSrc(src ?? null)
                            onImageError?.()
                        }}
                        className="motion-crossfade absolute inset-0 size-full object-cover"
                    />
                ) : null}
                {onPhoto ? <span className="absolute inset-0 bg-[var(--photo-scrim)]" /> : null}
            </div>

            {glyph || captionClass ? (
                <div
                    className={cn(
                        'pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-2 text-center',
                        onPhoto ? 'text-[var(--on-photo)]' : 'text-[var(--text-strong)]'
                    )}
                >
                    {glyph}
                    {captionClass ? (
                        <span
                            aria-hidden="true"
                            className={cn(
                                'max-w-full text-[0.8125rem] leading-snug font-medium text-balance',
                                state === 'unavailable' && 'text-[var(--text-muted)]',
                                captionClass
                            )}
                        >
                            {copy}
                        </span>
                    ) : null}
                </div>
            ) : null}

            {/* One polite line per tile that changes with the state. The
                caption above is drawn only; this is what is heard. */}
            <span role="status" className="sr-only">
                {statusText}
            </span>
            {alt ? (
                <span id={altId} className="sr-only">
                    {alt}
                </span>
            ) : null}

            {action ? (
                <button
                    type="button"
                    data-tile-action={action.opens ? 'open' : 'retry'}
                    aria-label={action.label}
                    aria-haspopup={action.opens ? 'dialog' : undefined}
                    aria-describedby={action.opens && alt ? altId : undefined}
                    title={action.opens ? undefined : action.label}
                    onClick={action.run}
                    className="absolute inset-0 z-10 cursor-pointer rounded-[inherit] outline-none"
                />
            ) : null}

            {onRemove ? (
                <button
                    type="button"
                    data-photo-remove=""
                    data-testid={removeTestId}
                    aria-label={removeLabel ?? `Remove ${ordinal}`}
                    onClick={onRemove}
                    // The target is 44px in the corner. The disc in it is 24px
                    // tucked 4px from the corner on a tray tile (so it clears the
                    // ring and the glyph), and 28px in the middle of the target
                    // from 6.5rem.
                    className="group/remove motion-press absolute top-0 right-0 z-20 grid size-11 cursor-pointer place-items-start justify-items-end rounded-full p-1 outline-none @min-[6.5rem]:place-items-center @min-[6.5rem]:p-0"
                >
                    <span
                        aria-hidden="true"
                        className={cn(
                            'grid size-6 place-items-center rounded-full bg-[var(--photo-disc)] text-[var(--on-photo)] @min-[6.5rem]:size-7',
                            // Focus: a white ring on the disc and the accent
                            // outside it, so one of the two shows on any photo.
                            'group-focus-visible/remove:ring-2 group-focus-visible/remove:ring-[var(--on-photo)]',
                            'group-focus-visible/remove:outline-2 group-focus-visible/remove:outline-offset-2 group-focus-visible/remove:outline-[var(--accent)]'
                        )}
                    >
                        <CloseIcon size="0.875rem" strokeWidth={2} aria-hidden className="@min-[6.5rem]:size-4" />
                    </span>
                </button>
            ) : null}
        </div>
    )
})

PhotoTile.displayName = 'PhotoTile'

/**
 * The words a row of small tiles cannot hold, printed once under the row:
 * each distinct failure or refusal, with its glyph. Drawn only (each tile
 * already says its own state); `message` (over the limit, a file that cannot
 * be used) is the one line that is announced, politely.
 */
export function PhotoNotes({ items, message, className }: { items: PhotoItem[]; message?: string | null; className?: string }) {
    const notes: Array<{ text: string; kind: 'failed' | 'refused' }> = []
    for (const item of items) {
        if (!isLongPhotoState(item.state)) continue
        const text = photoStateCopy(item.state, item.failure, item.reason)
        if (text && !notes.some((n) => n.text === text)) notes.push({ text, kind: item.state === 'refused' ? 'refused' : 'failed' })
    }
    return (
        <div className={cn('flex flex-col gap-1', className)}>
            {notes.map((note) => (
                <p
                    key={note.text}
                    aria-hidden="true"
                    className="flex items-start gap-1.5 text-[0.8125rem] leading-snug text-[var(--text-strong)]"
                >
                    {note.kind === 'refused' ? (
                        <BlockedIcon size="1.125rem" active className="mt-px shrink-0 text-[var(--danger)]" />
                    ) : (
                        <ErrorIcon size="1.125rem" active className="mt-px shrink-0 text-[var(--danger)]" />
                    )}
                    <span>{note.text}</span>
                </p>
            ))}
            <p role="status" className={cn('text-[0.8125rem] leading-snug font-medium text-[var(--danger)]', !message && 'sr-only')}>
                {message ?? ''}
            </p>
        </div>
    )
}

/**
 * Where focus goes after a remove: the remove control now at the same place,
 * else the one before it, else `fallback`. A removed tile's button leaves the
 * page, and focus on <body> sends a keyboard user back to the top.
 */
export function useFocusAfterRemove(
    list: React.RefObject<HTMLElement | null>,
    count: number,
    fallback?: () => HTMLElement | null | undefined
): (index: number) => void {
    const pending = React.useRef<{ at: number; when: number } | null>(null)
    React.useEffect(() => {
        const mark = pending.current
        if (mark == null) return
        pending.current = null
        // A remove the caller did not carry out (its API call failed) must not
        // pull focus on some later change to the row.
        if (Date.now() - mark.when > 5000) return
        const at = mark.at
        const buttons = Array.from(list.current?.querySelectorAll<HTMLElement>('[data-photo-remove]') ?? [])
        const target = buttons[Math.min(at, buttons.length - 1)] ?? fallback?.() ?? null
        target?.focus()
    }, [count, list, fallback])
    return React.useCallback((index: number) => {
        pending.current = { at: index, when: Date.now() }
    }, [])
}
