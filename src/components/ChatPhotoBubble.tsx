'use client'

import * as React from 'react'
import { cn } from '../lib/cn'
import { PHOTO_COPY } from '../lib/photo-copy'
import { PhotoIcon } from '../icons'

/**
 * ChatPhotoBubble: photos sent in the booking thread (AUTM-1882), one to
 * four in one bubble, as Messages draws a photo message. It goes in
 * `MessageItem.body` (MessageThread aligns it to its side and stamps its
 * time), with the words sent alongside as `caption`, inside the same bubble.
 *
 *   - The bubble is the speaker's: a 4px frame in the message colour (your
 *     own brand purple, theirs band) with the same tail corner as
 *     MessageBubble, so a photo reads as said by someone.
 *   - Sized before anything loads, from each photo's `width` and `height`:
 *     one photo keeps its own shape, held between 3:4 tall and 16:9 wide (the
 *     rest is cropped to fill); two sit side by side; three are one tall and
 *     two stacked; four a 2 x 2 grid. 16rem wide, at most 80% of the thread.
 *     Nothing moves when the photos arrive: each fades in on its own load,
 *     opacity only, over a still placeholder that pulses until then.
 *   - With `onOpen` each photo is a button, "Open photo 2 of 3" (its alt
 *     text is its description), that opens PhotoViewer at that photo.
 *   - A removed or erased photo (`state="unavailable"`, or no `src`) keeps
 *     its place and says "Photo no longer available".
 *   - A photo whose signed URL has run out (15 minutes) fails to load: the
 *     bubble shows the placeholder and calls `onImageError` so the caller can
 *     fetch a fresh URL; a new `src` is tried again.
 *
 * No shadow, no border: the frame's fill is the edge.
 */
export interface ChatPhoto {
    id: string
    /** The signed URL. Without one the photo is drawn unavailable. */
    src?: string | null
    /** The photo's size in px, from the API (Photo.width and height). */
    width: number
    height: number
    /** What it shows, when known. */
    alt?: string
    /** `unavailable`: removed or erased. @default 'ready' */
    state?: 'ready' | 'unavailable'
}

export interface ChatPhotoBubbleProps {
    side: 'own' | 'incoming'
    /** One to four. Any past four are not drawn. */
    photos: ChatPhoto[]
    /** The words sent with the photos. */
    caption?: string
    /** A photo was tapped: open PhotoViewer at `index`. */
    onOpen?: (index: number) => void
    /** A photo's URL failed to load: fetch a fresh one. */
    onImageError?: (id: string) => void
    /** The group's name. @default 'Photo' or '3 photos' */
    label?: string
    className?: string
    testId?: string
}

const MIN_RATIO = 3 / 4
const MAX_RATIO = 16 / 9

/** The bubble's shape for `photos`: its aspect ratio and each cell's grid area. */
export function chatPhotoLayout(photos: Pick<ChatPhoto, 'width' | 'height'>[]): {
    ratio: number
    template: string
    areas: string[]
} {
    const n = Math.min(photos.length, 4)
    if (n <= 1) {
        const p = photos[0]
        const raw = p && p.width > 0 && p.height > 0 ? p.width / p.height : 1
        return { ratio: Math.min(MAX_RATIO, Math.max(MIN_RATIO, raw)), template: '"a"', areas: ['a'] }
    }
    if (n === 2) return { ratio: 2, template: '"a b"', areas: ['a', 'b'] }
    if (n === 3) return { ratio: 1, template: '"a b" "a c"', areas: ['a', 'b', 'c'] }
    return { ratio: 1, template: '"a b" "c d"', areas: ['a', 'b', 'c', 'd'] }
}

function Cell({
    photo,
    index,
    total,
    area,
    side,
    onOpen,
    onImageError,
}: {
    photo: ChatPhoto
    index: number
    total: number
    area: string
    side: 'own' | 'incoming'
    onOpen?: (index: number) => void
    onImageError?: (id: string) => void
}) {
    // Keyed by the URL, not reset in an effect: a cached photo can fire its
    // load before a mount effect runs, and a reset then would hide it for good.
    const [loadedSrc, setLoadedSrc] = React.useState<string | null>(null)
    const [brokenSrc, setBrokenSrc] = React.useState<string | null>(null)
    const loaded = !!photo.src && loadedSrc === photo.src
    const broken = !!photo.src && brokenSrc === photo.src
    const descId = React.useId()
    const unavailable = photo.state === 'unavailable' || !photo.src
    const name = total > 1 ? `photo ${index + 1} of ${total}` : 'photo'
    // The cell's ground: a step off the frame, never the frame's own colour.
    const ground = side === 'own' ? 'bg-[var(--band)]' : 'bg-[var(--paper)]'

    return (
        <div
            data-photo-cell={unavailable ? 'unavailable' : loaded ? 'loaded' : 'loading'}
            className={cn('relative min-h-0 min-w-0 overflow-hidden', ground)}
            style={{ gridArea: area }}
        >
            {unavailable ? (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-3 text-center text-[0.8125rem] leading-snug text-[var(--text-muted)]">
                    <PhotoIcon size="1.5rem" aria-hidden />
                    <span>{PHOTO_COPY.erased}</span>
                </span>
            ) : (
                <>
                    {!loaded ? <span aria-hidden="true" className="motion-skeleton absolute inset-0 bg-[var(--band-press)]" /> : null}
                    {!broken ? (
                        <img
                            src={photo.src!}
                            alt={onOpen ? '' : photo.alt ?? ''}
                            decoding="async"
                            loading="lazy"
                            draggable={false}
                            onLoad={() => setLoadedSrc(photo.src ?? null)}
                            onError={() => {
                                setBrokenSrc(photo.src ?? null)
                                onImageError?.(photo.id)
                            }}
                            className={cn(
                                'absolute inset-0 size-full object-cover transition-opacity duration-(--motion-crossfade) ease-(--motion-ease-out)',
                                loaded ? 'opacity-100' : 'opacity-0'
                            )}
                        />
                    ) : null}
                    {onOpen ? (
                        <button
                            type="button"
                            aria-label={`Open ${name}`}
                            aria-describedby={photo.alt ? descId : undefined}
                            aria-haspopup="dialog"
                            onClick={() => onOpen(index)}
                            className="absolute inset-0 cursor-pointer outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--on-photo),inset_0_0_0_4px_var(--accent)]"
                        >
                            {photo.alt ? (
                                <span id={descId} className="sr-only">
                                    {photo.alt}
                                </span>
                            ) : null}
                        </button>
                    ) : null}
                </>
            )}
        </div>
    )
}

export function ChatPhotoBubble({
    side,
    photos,
    caption,
    onOpen,
    onImageError,
    label,
    className,
    testId,
}: ChatPhotoBubbleProps) {
    const shown = photos.slice(0, 4)
    if (shown.length === 0) return null
    const layout = chatPhotoLayout(shown)
    const own = side === 'own'

    return (
        <div
            role="group"
            aria-label={label ?? (shown.length === 1 ? 'Photo' : `${shown.length} photos`)}
            data-side={side}
            data-testid={testId}
            className={cn(
                'flex w-64 max-w-[80%] flex-col rounded-[1.25rem] p-1',
                own
                    ? 'self-end rounded-br-md bg-[var(--message-own)] text-[var(--on-message-own)]'
                    : 'self-start rounded-bl-md bg-[var(--message-incoming)] text-[var(--on-message-incoming)]',
                className
            )}
        >
            <div
                className={cn('grid w-full gap-0.5 overflow-hidden rounded-[1rem]', own ? 'rounded-br-[0.125rem]' : 'rounded-bl-[0.125rem]')}
                style={{
                    aspectRatio: String(layout.ratio),
                    gridTemplateAreas: layout.template,
                    gridTemplateColumns: shown.length === 1 ? '1fr' : '1fr 1fr',
                    gridTemplateRows: shown.length >= 3 ? '1fr 1fr' : '1fr',
                }}
            >
                {shown.map((photo, i) => (
                    <Cell
                        key={photo.id}
                        photo={photo}
                        index={i}
                        total={shown.length}
                        area={layout.areas[i]}
                        side={side}
                        onOpen={onOpen}
                        onImageError={onImageError}
                    />
                ))}
            </div>
            {caption ? (
                <p className="px-3 pt-2 pb-1.5 text-base leading-[1.45] break-words whitespace-pre-wrap">{caption}</p>
            ) : null}
        </div>
    )
}
