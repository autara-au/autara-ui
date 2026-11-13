'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '../lib/cn'
import { PHOTO_COPY } from '../lib/photo-copy'
import { useReturnFocus } from '../lib/use-return-focus'
import { ChevronLeftIcon, ChevronRightIcon, PhotoIcon } from '../icons'
import { CloseButton, IconButton } from './IconButton'

/**
 * PhotoViewer: a photo full screen (AUTM-1882), from a chat bubble, a car's
 * slots or a booking's request photos.
 *
 *   - A Radix dialog, so focus is trapped inside while it is open, Escape
 *     closes it, the page behind is hidden from assistive tech and does not
 *     scroll, and focus goes back to the photo that opened it (the library's
 *     useReturnFocus, since a photo button is not a Radix trigger).
 *   - The stage is `--ink` in both themes, as every photo viewer is black
 *     (Partiful, Airbnb, Reddit on Mobbin).
 *   - The top bar: close on the left (the library's 44px disc, "Close
 *     photos"), the count in the middle, "1 of 3", read out politely as it
 *     changes.
 *   - Previous and next: 44px `--photo-disc` discs at the sides (the white
 *     glyph reads at 4.5:1 on any photo, and the disc shows on the bare ink
 *     margin too), "Previous photo" and "Next
 *     photo". Not drawn at the ends, and none for a single photo. Arrow keys
 *     do the same; a swipe does it on touch (and a drag with a mouse): the
 *     photo follows the finger and goes past a fifth of the width, else it
 *     settles back. Past the first or the last it gives, a third as far.
 *   - The photo is sized from `width` and `height` before it loads, so
 *     nothing moves when it lands; a still placeholder pulses until then, and
 *     the photo fades in, opacity only. The next and previous are fetched
 *     ahead. `alt` is its alt text ("Photo 2 of 3" without one).
 *   - A removed or erased photo says "Photo no longer available"; a URL that
 *     has run out calls `onImageError` so the caller can mint a new one.
 *
 * Motion: the stage fades in and out with the dialog (opacity); the swipe is
 * transform only on the one ease-out, and settles at once under reduced
 * motion (the global clamp). `footer` takes a line under the photo, for
 * "From Sam, 13 Nov".
 */
export interface PhotoViewerPhoto {
    id: string
    src?: string | null
    alt?: string
    width?: number
    height?: number
    /** `unavailable`: removed or erased. @default 'ready' */
    state?: 'ready' | 'unavailable'
}

export interface PhotoViewerProps {
    photos: PhotoViewerPhoto[]
    open: boolean
    onOpenChange: (open: boolean) => void
    /** The photo shown, from 0. Controlled; leave unset to use `defaultIndex`. */
    index?: number
    /** The photo shown when it opens, uncontrolled. @default 0 */
    defaultIndex?: number
    onIndexChange?: (index: number) => void
    /** The dialog's name, read out on open. @default 'Photos' */
    title?: string
    /** @default 'Close photos' */
    closeLabel?: string
    /** @default 'Previous photo' */
    previousLabel?: string
    /** @default 'Next photo' */
    nextLabel?: string
    /** A line under the photo. */
    footer?: React.ReactNode
    onImageError?: (id: string) => void
    testId?: string
}

/** A swipe goes to the next photo past this share of the stage's width (at most 80px). */
const SWIPE_SHARE = 0.2
const SWIPE_MAX = 80
/** Movement before a press counts as a drag, either way. */
const SLOP = 8

/* The stage is ink in both themes, so the focus ring is white on an ink gap
   (the accent is about 2:1 on ink in light). */
const RING_ON_INK = 'focus-visible:ring-[var(--on-photo)] focus-visible:ring-offset-[var(--ink)]'
/** On the photo disc: the glyph reads on any photo, and the disc shows on the bare ink too. */
const OVER_PHOTO = cn(
    'bg-[var(--photo-disc)] text-[var(--on-photo)] not-disabled:hover:bg-[var(--photo-disc)]',
    RING_ON_INK
)

function Stage({
    photo,
    index,
    total,
    onImageError,
}: {
    photo: PhotoViewerPhoto
    index: number
    total: number
    onImageError?: (id: string) => void
}) {
    const [loaded, setLoaded] = React.useState(false)
    const [broken, setBroken] = React.useState(false)
    const unavailable = photo.state === 'unavailable' || !photo.src
    const ratio = photo.width && photo.height ? photo.width / photo.height : null
    // Fits the stage both ways from the photo's own shape, before it loads.
    const box: React.CSSProperties = ratio
        ? { aspectRatio: `${photo.width} / ${photo.height}`, width: `min(100cqw, calc(100cqh * ${ratio}))` }
        : { maxWidth: '100%', maxHeight: '100%' }

    if (unavailable || broken) {
        return (
            <div className="flex flex-col items-center gap-2 px-6 text-center text-[var(--on-photo)]">
                <PhotoIcon size="2rem" aria-hidden />
                <p className="text-base font-medium">{unavailable ? PHOTO_COPY.erased : (photo.alt ?? `Photo ${index + 1} of ${total}`)}</p>
            </div>
        )
    }
    return (
        <div className="relative" style={box}>
            {!loaded && ratio ? (
                <span aria-hidden="true" className="motion-skeleton absolute inset-0 rounded-[0.5rem] bg-[var(--icon-disc-ondark)]" />
            ) : null}
            <img
                key={photo.src}
                src={photo.src!}
                alt={photo.alt ?? `Photo ${index + 1} of ${total}`}
                decoding="async"
                draggable={false}
                onLoad={() => setLoaded(true)}
                onError={() => {
                    setBroken(true)
                    onImageError?.(photo.id)
                }}
                className={cn(
                    'relative block select-none',
                    ratio ? 'size-full object-contain' : 'max-h-full max-w-full object-contain',
                    'transition-opacity duration-(--motion-crossfade) ease-(--motion-ease-out)',
                    loaded ? 'opacity-100' : 'opacity-0'
                )}
            />
        </div>
    )
}

export function PhotoViewer({
    photos,
    open,
    onOpenChange,
    index: indexProp,
    defaultIndex = 0,
    onIndexChange,
    title = 'Photos',
    closeLabel = 'Close photos',
    previousLabel = 'Previous photo',
    nextLabel = 'Next photo',
    footer,
    onImageError,
    testId,
}: PhotoViewerProps) {
    const total = photos.length
    const [inner, setInner] = React.useState(defaultIndex)
    React.useEffect(() => {
        if (open && indexProp === undefined) setInner(defaultIndex)
        // Only on open: a later defaultIndex change must not jump the photo.
    }, [open])
    const current = Math.min(Math.max(0, indexProp ?? inner), Math.max(0, total - 1))
    const photo = photos[current]

    const returnFocus = useReturnFocus()
    const prevRef = React.useRef<HTMLButtonElement>(null)
    const nextRef = React.useRef<HTMLButtonElement>(null)
    const stageRef = React.useRef<HTMLDivElement>(null)
    // Which arrow was pressed last: if it disappears at the end, focus goes to the other.
    const pressed = React.useRef<'prev' | 'next' | null>(null)

    const go = React.useCallback(
        (next: number) => {
            if (next < 0 || next >= total || next === current) return
            if (indexProp === undefined) setInner(next)
            onIndexChange?.(next)
        },
        [current, total, indexProp, onIndexChange]
    )

    React.useEffect(() => {
        const was = pressed.current
        pressed.current = null
        if (was === 'prev' && current === 0) nextRef.current?.focus()
        if (was === 'next' && current === total - 1) prevRef.current?.focus()
    }, [current, total])

    // The swipe: the photo follows the finger sideways; a vertical move is left alone.
    const [dx, setDx] = React.useState(0)
    const [dragging, setDragging] = React.useState(false)
    const drag = React.useRef<{ id: number; x: number; y: number; horizontal: boolean | null } | null>(null)

    function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
        if (total < 2 || (e.pointerType === 'mouse' && e.button !== 0)) return
        if ((e.target as HTMLElement).closest('button')) return
        drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, horizontal: null }
    }
    function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
        const d = drag.current
        if (!d || d.id !== e.pointerId) return
        const mx = e.clientX - d.x
        const my = e.clientY - d.y
        if (d.horizontal === null) {
            if (Math.abs(mx) < SLOP && Math.abs(my) < SLOP) return
            d.horizontal = Math.abs(mx) > Math.abs(my)
            if (!d.horizontal) return
            e.currentTarget.setPointerCapture?.(e.pointerId)
            setDragging(true)
        }
        if (!d.horizontal) return
        const pastEnd = (mx > 0 && current === 0) || (mx < 0 && current === total - 1)
        setDx(pastEnd ? mx / 3 : mx)
    }
    function endDrag(e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) {
        const d = drag.current
        if (!d || d.id !== e.pointerId) return
        drag.current = null
        setDragging(false)
        setDx(0)
        if (cancelled || !d.horizontal) return
        const mx = e.clientX - d.x
        const width = stageRef.current?.clientWidth ?? window.innerWidth
        const threshold = Math.min(SWIPE_MAX, width * SWIPE_SHARE)
        if (mx <= -threshold) go(current + 1)
        else if (mx >= threshold) go(current - 1)
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.key === 'ArrowRight') {
            e.preventDefault()
            go(current + 1)
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault()
            go(current - 1)
        }
    }

    const neighbours = [photos[current - 1], photos[current + 1]].filter(
        (p): p is PhotoViewerPhoto => !!p && !!p.src && p.state !== 'unavailable'
    )

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="overlay-scrim fixed inset-0 z-50 bg-[var(--ink)]" />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    data-testid={testId}
                    onKeyDown={onKeyDown}
                    onOpenAutoFocus={returnFocus.onOpenAutoFocus}
                    onCloseAutoFocus={returnFocus.onCloseAutoFocus}
                    // The same fade as the ground behind it: opacity only.
                    className="overlay-scrim fixed inset-0 z-50 flex flex-col text-[var(--on-photo)] outline-none"
                >
                    <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
                    <div className="grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-2 px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-2">
                        <DialogPrimitive.Close asChild>
                            <CloseButton tone="ondark" label={closeLabel} className={RING_ON_INK} />
                        </DialogPrimitive.Close>
                        <p aria-live="polite" aria-atomic="true" className="text-center text-base font-medium tabular-nums">
                            {total > 1 ? `${current + 1} of ${total}` : null}
                        </p>
                        <span aria-hidden="true" className="size-11 pointer-coarse:size-12" />
                    </div>

                    <div
                        ref={stageRef}
                        data-photo-stage=""
                        className="relative min-h-0 flex-1 [touch-action:pan-y_pinch-zoom] select-none"
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={(e) => endDrag(e, false)}
                        onPointerCancel={(e) => endDrag(e, true)}
                    >
                        <div
                            className={cn(
                                'absolute inset-3 grid place-items-center [container-type:size]',
                                !dragging && 'transition-transform duration-(--motion-sheet-in) ease-(--motion-ease-out)'
                            )}
                            style={{ transform: dx ? `translateX(${dx}px)` : undefined }}
                        >
                            {photo ? (
                                <Stage key={photo.id} photo={photo} index={current} total={total} onImageError={onImageError} />
                            ) : null}
                        </div>
                        {total > 1 && current > 0 ? (
                            <IconButton
                                ref={prevRef}
                                icon={<ChevronLeftIcon />}
                                label={previousLabel}
                                onClick={() => {
                                    pressed.current = 'prev'
                                    go(current - 1)
                                }}
                                className={cn('absolute top-1/2 left-3 -translate-y-1/2', OVER_PHOTO)}
                            />
                        ) : null}
                        {total > 1 && current < total - 1 ? (
                            <IconButton
                                ref={nextRef}
                                icon={<ChevronRightIcon />}
                                label={nextLabel}
                                onClick={() => {
                                    pressed.current = 'next'
                                    go(current + 1)
                                }}
                                className={cn('absolute top-1/2 right-3 -translate-y-1/2', OVER_PHOTO)}
                            />
                        ) : null}
                    </div>

                    {footer ? (
                        <div className="shrink-0 px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+1rem)] text-center text-[0.9375rem] text-[var(--on-photo)]">
                            {footer}
                        </div>
                    ) : (
                        <div aria-hidden="true" className="h-[calc(env(safe-area-inset-bottom)+1rem)] shrink-0" />
                    )}

                    {/* The next and previous, fetched ahead so a swipe lands on a loaded photo. */}
                    <div aria-hidden="true" className="hidden">
                        {neighbours.map((p) => (
                            <img key={p.id} src={p.src!} alt="" decoding="async" />
                        ))}
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
