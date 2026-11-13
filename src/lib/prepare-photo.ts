/**
 * preparePhoto (AUTM-1882, AUTM-1810): turns the file a customer or a pro
 * picked into the one kind of photo Autara uploads, in the browser, before a
 * byte leaves the device.
 *
 * What comes out, always:
 *
 *   - a JPEG, whatever went in (JPEG, PNG, WebP, or HEIC where the browser
 *     can decode it: Safari can, Chromium cannot);
 *   - at most 1600 px on its long edge, at quality 0.82 (about 200 to 400 KB
 *     for a phone photo, well under the API's 8 MB presign);
 *   - the right way up: the EXIF orientation is applied to the pixels, so no
 *     reader has to;
 *   - with no metadata at all. The canvas re-encode starts from pixels, so
 *     the camera's EXIF (GPS, the phone's model, the time) never reaches the
 *     new file, and the result is then walked once more and every APP1 to
 *     APP15 and COM segment is dropped, keeping only JFIF and an ICC profile.
 *     The second pass is belt and braces: no encoder we know of writes GPS
 *     into a canvas export, but "no location leaves the phone" should not
 *     rest on that. The server strips again on confirm (plan section 3).
 *
 * What it refuses, as a `PreparePhotoError` with a `code`:
 *
 *   NOT_IMAGE   the bytes are not a JPEG, PNG, WebP or HEIC. Decided by the
 *               file's first bytes, never by its name or its MIME type, which
 *               the browser guesses from the extension.
 *   TOO_LARGE   over 30 MB, checked before any decoding.
 *   CANT_OPEN   it is one of the four, but this browser cannot decode it
 *               (HEIC in Chrome) or the encode failed.
 *   TOO_SMALL   under 200 px on its short edge; or so long and thin that
 *               fitting the long edge into 1600 px would take the short edge
 *               under 200 (a panorama over 8:1), which the server would
 *               refuse anyway.
 *
 * `PHOTO_COPY` and `photoErrorMessage` (photo-copy.ts) hold what each code
 * says to the person, so two apps cannot word it differently.
 *
 * Browser only: it needs `createImageBitmap` or an `<img>`, and a canvas. In
 * a server render it is never called (it runs on a file the person picked).
 */

export type PreparePhotoErrorCode = 'NOT_IMAGE' | 'CANT_OPEN' | 'TOO_SMALL' | 'TOO_LARGE'

/** The four families preparePhoto takes, as the first bytes say. */
export type PhotoSourceType = 'jpeg' | 'png' | 'webp' | 'heic'

export interface PreparePhotoOptions {
    /** The result's longest edge, px. @default 1600 */
    maxEdge?: number
    /** The shortest edge accepted, px, before and after fitting. @default 200 */
    minEdge?: number
    /** JPEG quality, 0 to 1. @default 0.82 */
    quality?: number
    /** The largest file accepted, bytes. @default 30 MB */
    maxBytes?: number
}

export interface PreparedPhoto {
    /** The JPEG to upload (`image/jpeg`), metadata-free. */
    blob: Blob
    /** Its size in px, after orientation and fitting. Send these with it. */
    width: number
    height: number
}

/** The plan's numbers (decision 11). The server checks its own copy. */
export const PHOTO_LIMITS = {
    maxEdge: 1600,
    minEdge: 200,
    quality: 0.82,
    maxBytes: 30 * 1024 * 1024,
} as const

/**
 * For `<input type="file" accept>`. The extensions are there because some
 * desktop browsers do not map `.heic` to a MIME type and would hide the file.
 */
export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif'

export class PreparePhotoError extends Error {
    readonly code: PreparePhotoErrorCode

    constructor(code: PreparePhotoErrorCode, message?: string) {
        super(message ?? code)
        this.name = 'PreparePhotoError'
        this.code = code
    }
}

export function isPreparePhotoError(error: unknown): error is PreparePhotoError {
    return (
        error instanceof PreparePhotoError ||
        (typeof error === 'object' &&
            error !== null &&
            (error as { name?: unknown }).name === 'PreparePhotoError' &&
            typeof (error as { code?: unknown }).code === 'string')
    )
}

/* HEIF brands that carry HEVC stills. `mif1` and `msf1` are the generic
   HEIF brands; on their own they could be AVIF, so they count only when a
   compatible brand says HEVC. */
const HEIC_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs']
const HEIF_GENERIC = ['mif1', 'msf1']

function ascii(bytes: Uint8Array, from: number, length: number): string {
    let out = ''
    for (let i = from; i < from + length && i < bytes.length; i++) out += String.fromCharCode(bytes[i])
    return out
}

/**
 * The family a file's first bytes say it is, or null. Pass at least the first
 * 32 bytes (64 lets a HEIC's compatible brands be read).
 */
export function sniffPhotoType(head: Uint8Array): PhotoSourceType | null {
    if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'jpeg'
    if (
        head.length >= 8 &&
        head[0] === 0x89 &&
        ascii(head, 1, 3) === 'PNG' &&
        head[4] === 0x0d &&
        head[5] === 0x0a &&
        head[6] === 0x1a &&
        head[7] === 0x0a
    )
        return 'png'
    if (head.length >= 12 && ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 4) === 'WEBP') return 'webp'
    if (head.length >= 12 && ascii(head, 4, 4) === 'ftyp') {
        const major = ascii(head, 8, 4)
        if (HEIC_BRANDS.includes(major)) return 'heic'
        if (HEIF_GENERIC.includes(major)) {
            const boxSize = ((head[0] << 24) | (head[1] << 16) | (head[2] << 8) | head[3]) >>> 0
            const end = Math.min(boxSize, head.length)
            for (let i = 16; i + 4 <= end; i += 4) {
                if (HEIC_BRANDS.includes(ascii(head, i, 4))) return 'heic'
            }
        }
    }
    return null
}

/**
 * The size a photo of `width` x `height` is encoded at: the long edge brought
 * down to `maxEdge` (never up). Null when the short edge is under `minEdge`
 * before or after fitting.
 */
export function fitPhotoSize(
    width: number,
    height: number,
    maxEdge: number = PHOTO_LIMITS.maxEdge,
    minEdge: number = PHOTO_LIMITS.minEdge
): { width: number; height: number } | null {
    if (!(width > 0 && height > 0)) return null
    if (Math.min(width, height) < minEdge) return null
    const scale = Math.min(1, maxEdge / Math.max(width, height))
    const w = Math.max(1, Math.round(width * scale))
    const h = Math.max(1, Math.round(height * scale))
    if (Math.min(w, h) < minEdge) return null
    return { width: w, height: h }
}

function startsWith(bytes: Uint8Array, from: number, to: number, text: string): boolean {
    if (to - from < text.length) return false
    for (let i = 0; i < text.length; i++) if (bytes[from + i] !== text.charCodeAt(i)) return false
    return true
}

/** True for a segment that is metadata: COM, and APP1 to APP15 except an ICC profile; APP0 except JFIF. */
function isMetadataSegment(marker: number, bytes: Uint8Array, from: number, to: number): boolean {
    if (marker === 0xfe) return true
    if (marker < 0xe0 || marker > 0xef) return false
    if (marker === 0xe0) return !startsWith(bytes, from, to, 'JFIF\0')
    if (marker === 0xe2) return !startsWith(bytes, from, to, 'ICC_PROFILE\0')
    return true
}

/**
 * A JPEG with its metadata segments removed: every APP1 to APP15 (EXIF and
 * its GPS block, XMP, maker notes, Photoshop IRB) except an APP2 ICC profile,
 * any APP0 that is not JFIF (a JFXX thumbnail), and every COM. The image data
 * is copied untouched. Throws on bytes that are not a well-formed JPEG.
 *
 * It reads up to the first SOS and copies the rest verbatim, so a segment
 * placed after the scan begins would survive. Encoders put metadata before
 * the scan; preparePhoto only ever passes a canvas export through this.
 */
export function stripJpegMetadata(bytes: Uint8Array): Uint8Array {
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('not a JPEG')
    const keep: Array<[number, number]> = [[0, 2]]
    let i = 2
    let ended = false
    while (i < bytes.length && !ended) {
        if (bytes[i] !== 0xff) throw new Error(`JPEG marker expected at ${i}`)
        let m = i + 1
        while (m < bytes.length && bytes[m] === 0xff) m++ // fill bytes
        if (m >= bytes.length) throw new Error('JPEG ends inside a marker')
        const marker = bytes[m]
        const afterMarker = m + 1
        if (marker === 0xd9) {
            keep.push([i, afterMarker])
            ended = true
            break
        }
        if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
            keep.push([i, afterMarker])
            i = afterMarker
            continue
        }
        if (afterMarker + 2 > bytes.length) throw new Error('JPEG ends inside a segment length')
        const length = (bytes[afterMarker] << 8) | bytes[afterMarker + 1]
        if (length < 2) throw new Error('JPEG segment length under 2')
        const end = afterMarker + length
        if (end > bytes.length) throw new Error('JPEG segment runs past the end')
        if (marker === 0xda) {
            // Start of scan: the entropy-coded data and everything after it.
            keep.push([i, bytes.length])
            ended = true
            break
        }
        if (!isMetadataSegment(marker, bytes, afterMarker + 2, end)) keep.push([i, end])
        i = end
    }
    let size = 0
    for (const [from, to] of keep) size += to - from
    const out = new Uint8Array(new ArrayBuffer(size))
    let at = 0
    for (const [from, to] of keep) {
        out.set(bytes.subarray(from, to), at)
        at += to - from
    }
    return out
}

async function readBytes(blob: Blob): Promise<Uint8Array> {
    if (typeof blob.arrayBuffer === 'function') return new Uint8Array(await blob.arrayBuffer())
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer))
        reader.onerror = () => reject(reader.error)
        reader.readAsArrayBuffer(blob)
    })
}

interface Decoded {
    image: CanvasImageSource
    width: number
    height: number
    release: () => void
}

/**
 * Decoded and the right way up. createImageBitmap first (it decodes off the
 * main thread where it can); an `<img>` when that is missing or throws
 * (Safari before 17, a browser that rejects `imageOrientation`). Both apply
 * EXIF orientation: the bitmap by the option, the element by CSS
 * `image-orientation: from-image`, every browser's default since 2020.
 */
async function decode(file: Blob): Promise<Decoded> {
    if (typeof createImageBitmap === 'function') {
        try {
            const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
            return { image: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() }
        } catch {
            // Fall through to the element.
        }
    }
    if (typeof Image === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
        throw new PreparePhotoError('CANT_OPEN', 'this browser cannot decode images')
    }
    const url = URL.createObjectURL(file)
    try {
        const img = new Image()
        img.decoding = 'async'
        const loaded = new Promise<void>((resolve, reject) => {
            img.onload = () => resolve()
            img.onerror = () => reject(new Error('image failed to load'))
        })
        img.src = url
        await loaded
        if (!img.naturalWidth || !img.naturalHeight) throw new Error('image has no size')
        return { image: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) }
    } catch {
        URL.revokeObjectURL(url)
        throw new PreparePhotoError('CANT_OPEN', 'the browser could not decode this photo')
    }
}

type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

function canvasFor(width: number, height: number): { ctx: Context2D; toJpeg: (quality: number) => Promise<Blob | null> } | null {
    if (typeof OffscreenCanvas === 'function') {
        const canvas = new OffscreenCanvas(width, height)
        const ctx = canvas.getContext('2d', { alpha: false })
        if (ctx) return { ctx, toJpeg: (quality) => canvas.convertToBlob({ type: 'image/jpeg', quality }) }
    }
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return null
    return {
        ctx,
        toJpeg: (quality) => new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)),
    }
}

async function encodeJpeg(image: CanvasImageSource, width: number, height: number, quality: number): Promise<Blob> {
    const canvas = canvasFor(width, height)
    if (!canvas) throw new PreparePhotoError('CANT_OPEN', 'no 2D canvas')
    const { ctx } = canvas
    // A transparent PNG lands on white, not on the black a JPEG would give it.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image, 0, 0, width, height)
    let blob: Blob | null = null
    try {
        blob = await canvas.toJpeg(quality)
    } catch {
        blob = null
    }
    if (!blob || blob.type !== 'image/jpeg') throw new PreparePhotoError('CANT_OPEN', 'the JPEG encode failed')
    return blob
}

/**
 * Re-encodes `file` as Autara's upload JPEG. See the module header for what
 * comes out and what is refused. Rejects only with a `PreparePhotoError`.
 */
export async function preparePhoto(file: Blob, options: PreparePhotoOptions = {}): Promise<PreparedPhoto> {
    const maxEdge = options.maxEdge ?? PHOTO_LIMITS.maxEdge
    const minEdge = options.minEdge ?? PHOTO_LIMITS.minEdge
    const quality = options.quality ?? PHOTO_LIMITS.quality
    const maxBytes = options.maxBytes ?? PHOTO_LIMITS.maxBytes

    if (!file || typeof file.slice !== 'function' || typeof file.size !== 'number' || file.size === 0) {
        throw new PreparePhotoError('NOT_IMAGE', 'no file, or an empty one')
    }
    let head: Uint8Array
    try {
        head = await readBytes(file.slice(0, 64))
    } catch {
        throw new PreparePhotoError('CANT_OPEN', 'the file could not be read')
    }
    if (!sniffPhotoType(head)) throw new PreparePhotoError('NOT_IMAGE', 'not a JPEG, PNG, WebP or HEIC')
    if (file.size > maxBytes) throw new PreparePhotoError('TOO_LARGE', `over ${maxBytes} bytes`)

    const source = await decode(file)
    try {
        const size = fitPhotoSize(source.width, source.height, maxEdge, minEdge)
        if (!size) throw new PreparePhotoError('TOO_SMALL', `${source.width} x ${source.height}`)
        const encoded = await encodeJpeg(source.image, size.width, size.height, quality)
        let clean: Uint8Array
        try {
            clean = stripJpegMetadata(await readBytes(encoded))
        } catch {
            throw new PreparePhotoError('CANT_OPEN', 'the encoder did not return a JPEG')
        }
        return {
            blob: new Blob([clean as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' }),
            width: size.width,
            height: size.height,
        }
    } finally {
        source.release()
    }
}
