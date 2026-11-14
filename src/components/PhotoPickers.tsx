'use client'

import * as React from 'react'
import { PHOTO_ACCEPT } from '../lib/prepare-photo'

/**
 * PhotoPickers: the two system pickers behind "Take a photo" and "Choose
 * photos" (AUTM-2165, AUTM-2166), for a chooser that is not PhotoSlots' own add
 * slot: ComposerAttachMenu's rows in the booking chat, on the customer site
 * and in the pro's app. Two hidden inputs, opened through the handle; the
 * files go to `onFiles` and the input is cleared, so the same photo picked
 * again still fires.
 *
 *   - "Take a photo" asks for the rear camera (`capture="environment"`). The
 *     iPad build's WebView and a phone's browser open the camera from it.
 *   - A desktop browser ignores `capture` and opens the file picker, which is
 *     "Choose photos" a second time. Offer the row only where
 *     `useCanTakePhoto()` says so (a coarse pointer), so a menu never offers
 *     something that is not what it says.
 *   - "Choose photos" takes JPEG, PNG, WebP and HEIC (PHOTO_ACCEPT), several
 *     at once unless `multiple` is false. Cap them with PHOTO_COPY.overLimit.
 *
 * Open them from the row's own handler. ComposerAttachMenu runs a row once its
 * sheet or menu has let go of focus, a beat after the tap; a browser keeps the
 * tap's user activation for that long (Chromium about 5 s), and iOS Safari is
 * to be checked on a device.
 */
export interface PhotoPickersHandle {
    openCamera: () => void
    openLibrary: () => void
}

export interface PhotoPickersProps {
    onFiles: (files: File[]) => void
    /** "Choose photos" takes several at once. @default true */
    multiple?: boolean
    /** `data-testid` prefix: `{prefix}-camera`, `{prefix}-library`. @default 'photo-picker' */
    testIdPrefix?: string
}

export const PhotoPickers = React.forwardRef<PhotoPickersHandle, PhotoPickersProps>(function PhotoPickers(
    { onFiles, multiple = true, testIdPrefix = 'photo-picker' },
    ref
) {
    const camera = React.useRef<HTMLInputElement>(null)
    const library = React.useRef<HTMLInputElement>(null)
    React.useImperativeHandle(ref, () => ({
        openCamera: () => camera.current?.click(),
        openLibrary: () => library.current?.click(),
    }))
    const take = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? [])
        event.target.value = ''
        if (files.length > 0) onFiles(files)
    }
    return (
        <>
            <input
                ref={camera}
                type="file"
                accept="image/*"
                capture="environment"
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
                data-testid={`${testIdPrefix}-camera`}
                onChange={take}
            />
            <input
                ref={library}
                type="file"
                accept={PHOTO_ACCEPT}
                multiple={multiple}
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
                data-testid={`${testIdPrefix}-library`}
                onChange={take}
            />
        </>
    )
})

PhotoPickers.displayName = 'PhotoPickers'

const COARSE = '(pointer: coarse)'

function subscribe(onChange: () => void): () => void {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {}
    const query = window.matchMedia(COARSE)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
}

/** True on a touch screen, where "Take a photo" opens the camera. False on the server and before hydration. */
export function useCanTakePhoto(): boolean {
    return React.useSyncExternalStore(
        subscribe,
        () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(COARSE).matches,
        () => false
    )
}
