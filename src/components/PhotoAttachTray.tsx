'use client'

import * as React from 'react'
import { cn } from '../lib/cn'
import { PhotoNotes, PhotoTile, useFocusAfterRemove, type PhotoItem } from './PhotoTile'

/**
 * PhotoAttachTray: the photos waiting to go with a message (AUTM-1882), a row
 * of PhotoTiles above the composer's text. Each photo is prepared, uploaded
 * and checked here, in the tray, before Send (plan section 3: chat photos are
 * checked "in the tray before Send"), so Send only ever sends ready photos.
 *
 *   - Tiles are 4.5rem squares (they grow with the reader's text size) in a
 *     row that wraps, never a sideways scroller. Chat takes 4, a booking
 *     request 5.
 *   - Every tile has its named 44px remove ("Remove photo 2 of 3"). After a
 *     remove, focus moves to the remove control now in that place, else the
 *     one before it, else `focusAfterLast` (the message field).
 *   - The long words (a failure, a refusal) do not fit a 4.5rem tile, so they
 *     are printed once under the row with their glyph; `message` adds one
 *     line of your own, announced politely: "You can add up to 4 photos." or
 *     a preparePhoto refusal (`photoErrorMessage`).
 *   - Nothing at all when there are no photos and no message.
 *
 * Inside `MessageComposer layout="inset"` pass it as `attachments`: it sits
 * inside the field, above the text, as Substack and Cursor put a picked photo
 * in their composers. Gate Send with the composer's `canSend` until every
 * photo is `ready` (`photosReadyToSend`).
 */
export interface PhotoAttachTrayProps {
    items: PhotoItem[]
    onRemove?: (id: string) => void
    onRetry?: (id: string) => void
    /** A ready tile opens the photo: open PhotoViewer at `index`. */
    onOpen?: (id: string, index: number) => void
    /** Called when a tile's image fails to load (an expired signed URL). */
    onImageError?: (id: string) => void
    /** One line under the row, announced politely. */
    message?: string | null
    /** The row's name. @default 'Photos to send' */
    label?: string
    /** Where focus goes after the last photo is removed (the message field). */
    focusAfterLast?: () => HTMLElement | null | undefined
    className?: string
    testId?: string
}

/** True when there is at least one photo and every photo is ready: Send may go. */
export function photosReadyToSend(items: Pick<PhotoItem, 'state'>[]): boolean {
    return items.length > 0 && items.every((item) => item.state === 'ready')
}

/** True while any photo is still on its way (preparing, uploading, checking). */
export function photosInFlight(items: Pick<PhotoItem, 'state'>[]): boolean {
    return items.some((item) => item.state === 'preparing' || item.state === 'uploading' || item.state === 'checking')
}

export function PhotoAttachTray({
    items,
    onRemove,
    onRetry,
    onOpen,
    onImageError,
    message,
    label = 'Photos to send',
    focusAfterLast,
    className,
    testId,
}: PhotoAttachTrayProps) {
    const list = React.useRef<HTMLUListElement>(null)
    const markRemove = useFocusAfterRemove(list, items.length, focusAfterLast)

    if (items.length === 0 && !message) return null

    return (
        <div className={cn('flex flex-col gap-2', className)} data-testid={testId}>
            {items.length > 0 ? (
                <ul ref={list} aria-label={label} className="flex flex-wrap gap-2">
                    {items.map((item, i) => (
                        <li key={item.id} className="size-[4.5rem] shrink-0">
                            <PhotoTile
                                state={item.state}
                                src={item.src}
                                alt={item.alt}
                                progress={item.progress}
                                failure={item.failure}
                                reason={item.reason}
                                index={i + 1}
                                total={items.length}
                                captions="short"
                                testId={item.testId}
                                onRemove={
                                    onRemove
                                        ? () => {
                                              markRemove(i)
                                              onRemove(item.id)
                                          }
                                        : undefined
                                }
                                onRetry={onRetry ? () => onRetry(item.id) : undefined}
                                onOpen={onOpen ? () => onOpen(item.id, i) : undefined}
                                onImageError={onImageError ? () => onImageError(item.id) : undefined}
                            />
                        </li>
                    ))}
                </ul>
            ) : null}
            <PhotoNotes items={items} message={message} />
        </div>
    )
}
