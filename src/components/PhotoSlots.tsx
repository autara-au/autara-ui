'use client'

import * as React from 'react'
import { cn } from '../lib/cn'
import { PHOTO_COPY } from '../lib/photo-copy'
import { PHOTO_ACCEPT } from '../lib/prepare-photo'
import { PhotoAddIcon } from '../icons'
import { PhotoNotes, PhotoTile, useFocusAfterRemove, type PhotoItem } from './PhotoTile'

/**
 * PhotoSlots: a fixed number of places for photos (AUTM-1882), as Bumble
 * numbers a profile's photo slots: the car's 3 in the garage (the first is
 * the cover), a booking request's 5.
 *
 *   - Photos fill the slots in order, each a PhotoTile with every state and
 *     its named 44px remove.
 *   - The first empty slot is the one control: "Add a photo", a 44px-plus
 *     button with the add glyph. The slots after it are drawn, numbered and
 *     inert, so the limit is visible before anyone reaches it.
 *   - With `onFiles` the slot opens the system picker itself (`accept` is
 *     JPEG, PNG, WebP and HEIC, several at once). It hands over only as many
 *     files as there are free slots; if more were picked it says "You can
 *     add up to {slots} photos." under the slots. With `onAdd` instead, the
 *     slot is a plain button and the caller opens its own chooser (a sheet
 *     with Take a photo and Choose photos).
 *   - The long words (a failure, a refusal) go once under the slots, as in
 *     PhotoAttachTray; `message` is one line of your own, announced politely.
 *   - After a remove, focus goes to the remove control now in that place,
 *     else the one before it, else the add slot.
 *
 * The slots are a grid of `columns` (default: `slots`, at most 3 a row), so
 * they share the width and grow with it. No borders or shadows: band slots
 * on the page, the add slot marked by its glyph and words.
 */
export interface PhotoSlotsProps {
    /** How many places. */
    slots: number
    /** The photos, in order. Any past `slots` are not drawn. */
    items: PhotoItem[]
    /** The group's name ("Car photos"). */
    label: string
    /** The add slot opens the picker and hands over the files, capped to the free slots. */
    onFiles?: (files: File[]) => void
    /** The add slot is a button; the caller opens its own chooser. Ignored when `onFiles` is given. */
    onAdd?: () => void
    /** The picker's types. @default PHOTO_ACCEPT */
    accept?: string
    /** @default 'Add a photo' */
    addLabel?: string
    onRemove?: (id: string) => void
    onRetry?: (id: string) => void
    onOpen?: (id: string, index: number) => void
    onImageError?: (id: string) => void
    /** One line under the slots, announced politely. Wins over the built-in over-limit line. */
    message?: string | null
    /** Slots per row. @default min(slots, 3) */
    columns?: number
    /** The add slot cannot be used (the car is still saving). */
    disabled?: boolean
    /** `data-testid` on the add slot. */
    addTestId?: string
    className?: string
    testId?: string
}

export function PhotoSlots({
    slots,
    items,
    label,
    onFiles,
    onAdd,
    accept = PHOTO_ACCEPT,
    addLabel = 'Add a photo',
    onRemove,
    onRetry,
    onOpen,
    onImageError,
    message,
    columns,
    disabled = false,
    addTestId,
    className,
    testId,
}: PhotoSlotsProps) {
    const list = React.useRef<HTMLUListElement>(null)
    const input = React.useRef<HTMLInputElement>(null)
    const addButton = React.useRef<HTMLButtonElement>(null)
    const [overLimit, setOverLimit] = React.useState(false)
    const shown = items.slice(0, slots)
    const room = Math.max(0, slots - shown.length)
    const focusAdd = React.useCallback(() => addButton.current, [])
    const markRemove = useFocusAfterRemove(list, shown.length, focusAdd)
    const cols = Math.max(1, columns ?? Math.min(slots, 3))
    const canAdd = room > 0 && !!(onFiles || onAdd)

    function pick() {
        if (disabled) return
        if (onFiles) input.current?.click()
        else onAdd?.()
    }

    function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(event.target.files ?? [])
        // Cleared, so choosing the same file again still fires a change.
        event.target.value = ''
        if (files.length === 0 || !onFiles) return
        setOverLimit(files.length > room)
        onFiles(files.slice(0, room))
    }

    const empties = Math.max(0, room - (canAdd ? 1 : 0))
    const line = message ?? (overLimit ? PHOTO_COPY.overLimit(slots) : null)

    return (
        <div className={cn('flex flex-col gap-2', className)} data-testid={testId}>
            <ul
                ref={list}
                aria-label={label}
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
                {shown.map((item, i) => (
                    <li key={item.id} className="min-w-0">
                        <PhotoTile
                            state={item.state}
                            src={item.src}
                            alt={item.alt}
                            progress={item.progress}
                            failure={item.failure}
                            reason={item.reason}
                            index={i + 1}
                            total={shown.length}
                            captions="short"
                            testId={item.testId}
                            onRemove={
                                onRemove
                                    ? () => {
                                          markRemove(i)
                                          setOverLimit(false)
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
                {canAdd ? (
                    <li className="min-w-0">
                        <button
                            ref={addButton}
                            type="button"
                            onClick={pick}
                            disabled={disabled}
                            aria-disabled={disabled || undefined}
                            data-testid={addTestId}
                            className={cn(
                                'motion-press flex aspect-square w-full min-h-11 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[0.875rem] p-2 text-center',
                                'bg-[var(--band)] text-[var(--text-strong)] not-disabled:hover:bg-[var(--band-press)]',
                                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
                                'disabled:cursor-not-allowed'
                            )}
                        >
                            <PhotoAddIcon size="1.5rem" className="shrink-0 text-[var(--accent)]" />
                            <span className="text-[0.8125rem] leading-snug font-medium">{addLabel}</span>
                        </button>
                        {onFiles ? (
                            <input
                                ref={input}
                                type="file"
                                accept={accept}
                                multiple={room > 1}
                                tabIndex={-1}
                                aria-hidden="true"
                                className="sr-only"
                                onChange={handleFiles}
                            />
                        ) : null}
                    </li>
                ) : null}
                {Array.from({ length: empties }, (_, i) => {
                    const n = shown.length + (canAdd ? 1 : 0) + i + 1
                    return (
                        <li
                            key={`empty-${n}`}
                            aria-hidden="true"
                            data-photo-slot="empty"
                            className="grid aspect-square min-w-0 place-items-center rounded-[0.875rem] bg-[var(--band)]"
                        >
                            <span className="text-[0.8125rem] font-medium text-[var(--text-subtle)] tabular-nums">{n}</span>
                        </li>
                    )
                })}
            </ul>
            <PhotoNotes items={shown} message={line} />
        </div>
    )
}
