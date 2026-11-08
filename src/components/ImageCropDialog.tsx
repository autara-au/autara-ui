"use client";

import * as React from 'react'
import Cropper, { type Area } from 'react-easy-crop'

import { cn } from '../lib/cn'
import { Button } from './Button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './Dialog'

/**
 * ImageCropDialog — pick-then-crop for any uploaded image (AUTM-163).
 *
 * Wraps `react-easy-crop` in the Autara dialog grammar. The merchant pans
 * + pinch/zooms a source image inside a fixed-aspect window; on confirm we
 * render the visible crop to a canvas and hand back a JPEG `File` ready for
 * the existing presigned-S3 upload pipeline — so the STORED asset matches
 * what customers see, instead of letting each surface `object-cover` it
 * differently.
 *
 * Reusable by every image slot in the product: profile pic (`aspect={1}`,
 * `cropShape="round"`), cover banner (`aspect={16/9}`), service photos,
 * bundle covers. Keep ratios at the call site — this component is shape-
 * agnostic.
 *
 * Controlled: drive `open` + `src` from the consumer (typically a freshly
 * picked File → `URL.createObjectURL`). Revoke that object URL in the
 * consumer's `onCropComplete` / `onCancel`.
 */
export interface ImageCropDialogProps {
    open: boolean
    /** Object URL / data URL of the image to crop. `null` renders nothing. */
    src: string | null
    /** Target ratio (width / height). 1 = square, 16/9 = wide cover. */
    aspect: number
    /** `round` masks the crop as a circle (avatars); `rect` is the default. */
    cropShape?: 'rect' | 'round'
    title?: string
    description?: string
    confirmLabel?: string
    /** Longest edge of the exported image, px. Larger uploads are downscaled. */
    outputMaxWidth?: number
    /** JPEG quality 0–1. */
    outputQuality?: number
    /** Fires with the cropped image as a `image/jpeg` File. */
    onCropComplete: (file: File) => void
    onCancel: () => void
}

export function ImageCropDialog({
    open,
    src,
    aspect,
    cropShape = 'rect',
    title = 'Crop your photo',
    description = 'Drag to reposition, pinch or use the slider to zoom.',
    confirmLabel = 'Use photo',
    outputMaxWidth = 1600,
    outputQuality = 0.92,
    onCropComplete,
    onCancel,
}: ImageCropDialogProps) {
    const [crop, setCrop] = React.useState({ x: 0, y: 0 })
    const [zoom, setZoom] = React.useState(1)
    const [areaPixels, setAreaPixels] = React.useState<Area | null>(null)
    const [busy, setBusy] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    // Reset transform whenever a new image opens.
    React.useEffect(() => {
        if (open) {
            setCrop({ x: 0, y: 0 })
            setZoom(1)
            setAreaPixels(null)
            setError(null)
        }
    }, [open, src])

    async function handleConfirm() {
        if (!src || !areaPixels) return
        setBusy(true)
        setError(null)
        try {
            const file = await cropToFile(
                src,
                areaPixels,
                outputMaxWidth,
                outputQuality,
            )
            onCropComplete(file)
        } catch (err) {
            console.warn('[image-crop] export failed', err)
            setError("Couldn't crop that image. Try another photo.")
        } finally {
            setBusy(false)
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v && !busy) onCancel()
            }}
        >
            <DialogContent className="w-[calc(100%-2rem)] max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                {/* AUTM-776 (client, AUT-29) — the stage follows the ASPECT,
                    it is no longer a fixed-height box.

                    It used to be h-[clamp(220px,42vh,360px)] for every ratio.
                    react-easy-crop fits the crop window inside that box, so a
                    wide ratio was limited by width and left large dead bands
                    above and below: on a phone a 16/9 cover got roughly a
                    200px-tall window inside a 360px-tall container, while a
                    4/3 service photo filled it. That is exactly what the
                    client reported — that cropping a profile or cover photo
                    felt cramped while the services picker felt fine. Same
                    dialog, same code; only the ratio differed.

                    Driving height from aspect-ratio gives every ratio the full
                    width and its natural height, so no ratio is penalised. The
                    clamp survives as a max-height so a TALL ratio (1/1 avatar,
                    or anything portrait) cannot push the actions off a short
                    screen — that was the fixed height's real job. */}
                <div
                    style={{ aspectRatio: String(aspect) }}
                    className="relative mt-2 max-h-[clamp(220px,52vh,420px)] w-full overflow-hidden rounded-xl bg-[var(--ink,#0c0a14)]">
                    {src ? (
                        <Cropper
                            image={src}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspect}
                            cropShape={cropShape}
                            showGrid={cropShape === 'rect'}
                            restrictPosition
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={(_area, pixels) => setAreaPixels(pixels)}
                        />
                    ) : null}
                </div>

                <div className="mt-4 flex items-center gap-3">
                    {/* AUTM-1483: sentence case at 0.75rem, weight 500, no
                        letterspacing. It was 11px letterspaced capitals,
                        pinned in px against OS text scaling. */}
                    <span className="text-[0.75rem] font-medium text-[var(--text-subtle)]">
                        Zoom
                    </span>
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.01}
                        value={zoom}
                        aria-label="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className={cn(
                            'h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--surface-warm)]',
                            'accent-[var(--color-autara-purple)]',
                        )}
                    />
                </div>

                {error ? (
                    <p
                        role="alert"
                        className="mt-3 rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-2 text-sm text-rose-800"
                    >
                        {error}
                    </p>
                ) : null}

                <DialogFooter className="mt-5 flex-row justify-end gap-2">
                    <Button
                        variant="outline"
                        size="md"
                        type="button"
                        disabled={busy}
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    {/* AUTM-1708: the library busy state (the Autara mark over
                        the label), not a "Cropping…" relabel that changed the
                        width and the accessible name mid-crop. */}
                    <Button
                        variant="primary"
                        size="md"
                        type="button"
                        busy={busy}
                        disabled={!areaPixels}
                        onClick={handleConfirm}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/** Load an image element from a (same-origin object/data) URL. */
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.addEventListener('load', () => resolve(img))
        img.addEventListener('error', () =>
            reject(new Error('image failed to load')),
        )
        img.src = src
    })
}

/** Render the chosen crop rectangle to a downscaled JPEG File. */
async function cropToFile(
    src: string,
    pixelCrop: Area,
    maxWidth: number,
    quality: number,
): Promise<File> {
    const image = await loadImage(src)
    const canvas = document.createElement('canvas')
    const scale = pixelCrop.width > maxWidth ? maxWidth / pixelCrop.width : 1
    canvas.width = Math.max(1, Math.round(pixelCrop.width * scale))
    canvas.height = Math.max(1, Math.round(pixelCrop.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas unsupported')
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        canvas.width,
        canvas.height,
    )
    const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
    )
    if (!blob) throw new Error('toBlob returned null')
    return new File([blob], `crop-${image.naturalWidth}x${image.naturalHeight}.jpg`, {
        type: 'image/jpeg',
    })
}
