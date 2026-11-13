import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
    PHOTO_ACCEPT,
    PHOTO_LIMITS,
    PreparePhotoError,
    fitPhotoSize,
    isPreparePhotoError,
    preparePhoto,
    sniffPhotoType,
    stripJpegMetadata,
    type PreparePhotoErrorCode,
} from './prepare-photo'
import { PHOTO_COPY, photoErrorMessage } from './photo-copy'

/**
 * AUTM-1882: preparePhoto's decisions that do not need a real decoder: what
 * the first bytes say, the size it encodes at, the metadata pass, each
 * refusal and its order, and that the canvas export goes through the strip.
 * The real decode, orientation and re-encode run in Chromium in
 * prepare-photo.browser.test.ts, on the same fixtures.
 */

const FIXTURES = resolve(process.cwd(), 'src/lib/__fixtures__/photos')
const bytesOf = (name: string) => new Uint8Array(readFileSync(resolve(FIXTURES, name)))
const blobOf = (name: string, type = '') => new Blob([bytesOf(name)], { type })
/** jsdom's Blob has no arrayBuffer(); FileReader it is. */
const read = (blob: Blob) =>
    new Promise<Uint8Array>((done, fail) => {
        const reader = new FileReader()
        reader.onload = () => done(new Uint8Array(reader.result as ArrayBuffer))
        reader.onerror = () => fail(reader.error)
        reader.readAsArrayBuffer(blob)
    })

function has(bytes: Uint8Array, text: string): boolean {
    const needle = Array.from(text, (c) => c.charCodeAt(0))
    outer: for (let i = 0; i <= bytes.length - needle.length; i++) {
        for (let j = 0; j < needle.length; j++) if (bytes[i + j] !== needle[j]) continue outer
        return true
    }
    return false
}

/** The markers before the scan, in order: 'E0', 'E1', 'DB', 'C0' ... */
function markers(bytes: Uint8Array): string[] {
    const out: string[] = []
    let i = 2
    while (i < bytes.length) {
        const marker = bytes[i + 1]
        out.push(marker.toString(16).toUpperCase())
        if (marker === 0xda || marker === 0xd9) break
        i += 2 + ((bytes[i + 2] << 8) | bytes[i + 3])
    }
    return out
}

async function codeOf(promise: Promise<unknown>): Promise<PreparePhotoErrorCode | 'resolved'> {
    try {
        await promise
        return 'resolved'
    } catch (error) {
        expect(isPreparePhotoError(error), String(error)).toBe(true)
        return (error as PreparePhotoError).code
    }
}

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('sniffPhotoType', () => {
    it('reads the family from the first bytes of each fixture', () => {
        expect(sniffPhotoType(bytesOf('gps-oriented.jpg'))).toBe('jpeg')
        expect(sniffPhotoType(bytesOf('transparent.png'))).toBe('png')
        expect(sniffPhotoType(bytesOf('photo.webp'))).toBe('webp')
        expect(sniffPhotoType(bytesOf('photo.heic'))).toBe('heic')
    })

    it('refuses what is not one of the four, whatever it is called', () => {
        const enc = (s: string) => new TextEncoder().encode(s)
        expect(sniffPhotoType(enc('hello, this is not a photo'))).toBeNull()
        expect(sniffPhotoType(enc('GIF89a\x01\x00\x01\x00'))).toBeNull()
        expect(sniffPhotoType(enc('%PDF-1.7\n'))).toBeNull()
        expect(sniffPhotoType(new Uint8Array([0xff, 0xd8]))).toBeNull()
        // A generic HEIF box whose brands say AVIF, not HEVC.
        const avif = new Uint8Array(32)
        avif.set([0, 0, 0, 0x1c], 0)
        avif.set(enc('ftypmif1'), 4)
        avif.set(enc('\0\0\0\0mif1avifmiaf'), 12)
        expect(sniffPhotoType(avif)).toBeNull()
        // The same box with a HEVC brand among the compatible ones.
        avif.set(enc('heic'), 20)
        expect(sniffPhotoType(avif)).toBe('heic')
    })
})

describe('fitPhotoSize', () => {
    it('brings the long edge down to 1600 and never up', () => {
        expect(fitPhotoSize(4032, 3024)).toEqual({ width: 1600, height: 1200 })
        expect(fitPhotoSize(3024, 4032)).toEqual({ width: 1200, height: 1600 })
        expect(fitPhotoSize(1200, 900)).toEqual({ width: 1200, height: 900 })
        expect(fitPhotoSize(1600, 200)).toEqual({ width: 1600, height: 200 })
    })

    it('says no under 200 px on the short edge, before or after fitting', () => {
        expect(fitPhotoSize(150, 150)).toBeNull()
        expect(fitPhotoSize(199, 1000)).toBeNull()
        // A 10:1 panorama: 1600 x 160 after fitting, which the server refuses.
        expect(fitPhotoSize(9000, 900)).toBeNull()
        expect(fitPhotoSize(0, 400)).toBeNull()
    })
})

describe('stripJpegMetadata', () => {
    it('drops the EXIF block with its GPS, and the comment, and keeps the image data byte for byte', () => {
        const input = bytesOf('gps-oriented.jpg')
        // The fixture really carries what this test says it removes.
        expect(markers(input)).toContain('E1')
        expect(has(input, 'Exif\0\0')).toBe(true)
        expect(has(input, 'FixtureCam')).toBe(true)
        expect(has(input, 'fixture comment')).toBe(true)

        const output = stripJpegMetadata(input)
        expect(markers(output)).not.toContain('E1')
        expect(markers(output)).not.toContain('FE')
        expect(has(output, 'Exif')).toBe(false)
        expect(has(output, 'FixtureCam')).toBe(false)
        expect(has(output, 'fixture comment')).toBe(false)
        expect([output[0], output[1]]).toEqual([0xff, 0xd8])
        expect([output[output.length - 2], output[output.length - 1]]).toEqual([0xff, 0xd9])
        // Everything from the start of scan on is untouched.
        const scan = (b: Uint8Array) => {
            for (let i = 2; i < b.length - 1; i++) if (b[i] === 0xff && b[i + 1] === 0xda) return b.slice(i)
            return new Uint8Array()
        }
        expect(scan(output)).toEqual(scan(input))
        expect(output.length).toBeLessThan(input.length)
    })

    it('keeps JFIF and an ICC profile, drops XMP and a JFXX thumbnail', () => {
        const seg = (marker: number, body: string) => {
            const data = new TextEncoder().encode(body)
            return [0xff, marker, (data.length + 2) >> 8, (data.length + 2) & 0xff, ...data]
        }
        const jpeg = new Uint8Array([
            0xff, 0xd8,
            ...seg(0xe0, 'JFIF\0\x01\x01'),
            ...seg(0xe0, 'JFXX\0thumb'),
            ...seg(0xe1, 'http://ns.adobe.com/xap/1.0/\0<x:xmpmeta/>'),
            ...seg(0xe2, 'ICC_PROFILE\0\x01\x01profile'),
            ...seg(0xed, 'Photoshop 3.0\0'),
            ...seg(0xdb, 'q'),
            0xff, 0xda, 0x00, 0x02, 0x12, 0x34,
            0xff, 0xd9,
        ])
        const out = stripJpegMetadata(jpeg)
        expect(markers(out)).toEqual(['E0', 'E2', 'DB', 'DA'])
        expect(has(out, 'JFXX')).toBe(false)
        expect(has(out, 'xmpmeta')).toBe(false)
        expect(has(out, 'ICC_PROFILE')).toBe(true)
    })

    it('throws on bytes that are not a well-formed JPEG', () => {
        expect(() => stripJpegMetadata(bytesOf('transparent.png'))).toThrow()
        expect(() => stripJpegMetadata(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff]))).toThrow()
    })
})

/* A stand-in for the browser's decoder and canvas, so the pipeline's order
   can be read in jsdom. The "encoder" returns `exported`, which by default is
   the GPS fixture: what comes out must have been through the strip. */
function fakeBrowser({
    width,
    height,
    exported = new Blob([bytesOf('gps-oriented.jpg')], { type: 'image/jpeg' }),
    decodeFails = false,
}: {
    width: number
    height: number
    exported?: Blob | null
    decodeFails?: boolean
}) {
    const close = vi.fn()
    const bitmap = { width, height, close }
    const createImageBitmap = vi.fn(async (_file: Blob, _options?: ImageBitmapOptions) => {
        if (decodeFails) throw new DOMException('The source image could not be decoded.', 'InvalidStateError')
        return bitmap
    })
    const ctx = {
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: vi.fn(),
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low',
    }
    const canvases: Array<{ width: number; height: number }> = []
    class FakeOffscreenCanvas {
        constructor(
            public width: number,
            public height: number
        ) {
            canvases.push({ width, height })
        }
        getContext() {
            return ctx
        }
        async convertToBlob(options: { type: string; quality: number }) {
            expect(options).toEqual({ type: 'image/jpeg', quality: PHOTO_LIMITS.quality })
            return exported
        }
    }
    class BrokenImage {
        decoding = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        set src(_value: string) {
            queueMicrotask(() => this.onerror?.())
        }
    }
    vi.stubGlobal('createImageBitmap', createImageBitmap)
    vi.stubGlobal('OffscreenCanvas', FakeOffscreenCanvas)
    vi.stubGlobal('Image', BrokenImage)
    if (typeof URL.createObjectURL !== 'function') {
        vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:fake', revokeObjectURL: () => {} }))
    }
    return { createImageBitmap, ctx, canvases, close }
}

describe('preparePhoto', () => {
    it('re-encodes at the fitted size, applies orientation, puts transparency on white, and strips the export', async () => {
        const fake = fakeBrowser({ width: 4032, height: 3024 })
        const result = await preparePhoto(blobOf('gps-oriented.jpg', 'image/jpeg'))

        expect(fake.createImageBitmap).toHaveBeenCalledWith(expect.anything(), { imageOrientation: 'from-image' })
        expect(fake.canvases).toEqual([{ width: 1600, height: 1200 }])
        expect(fake.ctx.fillStyle).toBe('#ffffff')
        expect(fake.ctx.fillRect).toHaveBeenCalledWith(0, 0, 1600, 1200)
        expect(fake.ctx.drawImage).toHaveBeenCalledWith(expect.objectContaining({ width: 4032 }), 0, 0, 1600, 1200)
        expect(fake.ctx.imageSmoothingQuality).toBe('high')
        expect(fake.close).toHaveBeenCalledOnce()

        expect(result.width).toBe(1600)
        expect(result.height).toBe(1200)
        expect(result.blob.type).toBe('image/jpeg')
        const out = await read(result.blob)
        expect(has(out, 'Exif')).toBe(false)
        expect(has(out, 'FixtureCam')).toBe(false)
        expect(markers(out)).not.toContain('E1')
    })

    it('decides by the bytes, not the name or the MIME type', async () => {
        fakeBrowser({ width: 600, height: 400 })
        // A HEIC the browser labelled with nothing (Chrome on Windows does).
        expect(await codeOf(preparePhoto(blobOf('photo.heic')))).toBe('resolved')
        // A text file named and typed as a JPEG.
        const fake = new File(['not a photo at all'], 'car.jpg', { type: 'image/jpeg' })
        expect(await codeOf(preparePhoto(fake))).toBe('NOT_IMAGE')
    })

    it('refuses NOT_IMAGE for an empty file, a GIF and a PDF', async () => {
        fakeBrowser({ width: 600, height: 400 })
        expect(await codeOf(preparePhoto(new Blob([])))).toBe('NOT_IMAGE')
        expect(await codeOf(preparePhoto(new Blob(['GIF89a\x01\x00\x01\x00'], { type: 'image/gif' })))).toBe('NOT_IMAGE')
        expect(await codeOf(preparePhoto(new Blob(['%PDF-1.7\n'], { type: 'application/pdf' })))).toBe('NOT_IMAGE')
    })

    it('refuses TOO_LARGE over 30 MB before decoding anything, and says NOT_IMAGE first for a big non-image', async () => {
        const fake = fakeBrowser({ width: 4000, height: 3000 })
        const header = bytesOf('gps-oriented.jpg').slice(0, 64)
        const big = new Blob([header, new Uint8Array(PHOTO_LIMITS.maxBytes)], { type: 'image/jpeg' })
        expect(big.size).toBeGreaterThan(PHOTO_LIMITS.maxBytes)
        expect(await codeOf(preparePhoto(big))).toBe('TOO_LARGE')
        expect(fake.createImageBitmap).not.toHaveBeenCalled()
        const bigText = new Blob([new Uint8Array(PHOTO_LIMITS.maxBytes + 1).fill(0x41)])
        expect(await codeOf(preparePhoto(bigText))).toBe('NOT_IMAGE')
    })

    it('takes exactly 30 MB', async () => {
        fakeBrowser({ width: 4000, height: 3000 })
        const header = bytesOf('gps-oriented.jpg').slice(0, 64)
        const edge = new Blob([header, new Uint8Array(PHOTO_LIMITS.maxBytes - header.length)], { type: 'image/jpeg' })
        expect(edge.size).toBe(PHOTO_LIMITS.maxBytes)
        expect(await codeOf(preparePhoto(edge))).toBe('resolved')
    })

    it('refuses TOO_SMALL under 200 px, and for a panorama the fit would take under 200, and releases the bitmap', async () => {
        const fake = fakeBrowser({ width: 150, height: 150 })
        expect(await codeOf(preparePhoto(blobOf('tiny.jpg')))).toBe('TOO_SMALL')
        expect(fake.close).toHaveBeenCalledOnce()
        fakeBrowser({ width: 9000, height: 900 })
        expect(await codeOf(preparePhoto(blobOf('gps-oriented.jpg')))).toBe('TOO_SMALL')
    })

    it('refuses CANT_OPEN when neither the bitmap nor the element can decode it (HEIC in Chrome)', async () => {
        const fake = fakeBrowser({ width: 600, height: 400, decodeFails: true })
        expect(await codeOf(preparePhoto(blobOf('photo.heic')))).toBe('CANT_OPEN')
        expect(fake.createImageBitmap).toHaveBeenCalledOnce()
    })

    it('refuses CANT_OPEN when the encoder returns nothing, or not a JPEG', async () => {
        fakeBrowser({ width: 600, height: 400, exported: null })
        expect(await codeOf(preparePhoto(blobOf('photo.webp')))).toBe('CANT_OPEN')
        fakeBrowser({ width: 600, height: 400, exported: new Blob([bytesOf('transparent.png')], { type: 'image/png' }) })
        expect(await codeOf(preparePhoto(blobOf('photo.webp')))).toBe('CANT_OPEN')
        fakeBrowser({ width: 600, height: 400, exported: new Blob(['garbage'], { type: 'image/jpeg' }) })
        expect(await codeOf(preparePhoto(blobOf('photo.webp')))).toBe('CANT_OPEN')
    })

    it('honours its options', async () => {
        const fake = fakeBrowser({ width: 3000, height: 2000 })
        const result = await preparePhoto(blobOf('photo.webp'), { maxEdge: 1200 })
        expect([result.width, result.height]).toEqual([1200, 800])
        expect(fake.canvases).toEqual([{ width: 1200, height: 800 }])
        fakeBrowser({ width: 300, height: 300 })
        expect(await codeOf(preparePhoto(blobOf('photo.webp'), { minEdge: 400 }))).toBe('TOO_SMALL')
        expect(await codeOf(preparePhoto(blobOf('photo.webp'), { maxBytes: 100 }))).toBe('TOO_LARGE')
    })

    it('accepts HEIC by MIME type and by extension in the picker', () => {
        expect(PHOTO_ACCEPT.split(',')).toEqual(
            expect.arrayContaining(['image/jpeg', 'image/png', 'image/webp', 'image/heic', '.heic'])
        )
    })
})

describe('photo copy', () => {
    it("is the plan's states table, word for word", () => {
        expect(PHOTO_COPY.uploading).toBe('Uploading photo')
        expect(PHOTO_COPY.checking).toBe('Checking photo')
        expect(PHOTO_COPY.uploadFailed).toBe("Upload didn't finish. Tap to retry.")
        expect(PHOTO_COPY.checkUnavailable).toBe("We couldn't check this photo. Try again.")
        expect(PHOTO_COPY.refused).toBe("This photo can't be sent. It breaks our photo rules.")
        expect(PHOTO_COPY.wrongType).toBe("We can't open that photo here. Choose a JPEG or PNG.")
        expect(PHOTO_COPY.tooLarge).toBe('That photo is too large. Choose one under 30 MB.')
        expect(PHOTO_COPY.tooSmall).toBe('That photo is too small to use.')
        expect(PHOTO_COPY.overLimit(4)).toBe('You can add up to 4 photos.')
        expect(PHOTO_COPY.erased).toBe('Photo no longer available')
    })

    it('has no em or en dashes, no curly apostrophes and no emoji', () => {
        const all = Object.values(PHOTO_COPY).map((v) => (typeof v === 'function' ? v(3) : v))
        for (const line of all) {
            expect(line).not.toMatch(/[–—‘’]/)
            expect(line).not.toMatch(/\p{Extended_Pictographic}/u)
        }
    })

    it('maps every preparePhoto code and the worded API codes', () => {
        expect(photoErrorMessage('NOT_IMAGE')).toBe(PHOTO_COPY.wrongType)
        expect(photoErrorMessage('CANT_OPEN')).toBe(PHOTO_COPY.wrongType)
        expect(photoErrorMessage('TOO_LARGE')).toBe(PHOTO_COPY.tooLarge)
        expect(photoErrorMessage('TOO_SMALL')).toBe(PHOTO_COPY.tooSmall)
        expect(photoErrorMessage('PHOTO_TYPE_NOT_SUPPORTED')).toBe(PHOTO_COPY.wrongType)
        expect(photoErrorMessage('PHOTO_CHECK_FAILED')).toBe(PHOTO_COPY.checkUnavailable)
        expect(photoErrorMessage('PHOTO_NOT_UPLOADED')).toBe(PHOTO_COPY.uploadFailed)
        expect(photoErrorMessage('PHOTO_LIMIT_REACHED', { limit: 3 })).toBe('You can add up to 3 photos.')
        expect(photoErrorMessage('PHOTO_LIMIT_REACHED')).toBeNull()
        expect(photoErrorMessage('PHOTO_NOT_ALLOWED')).toBeNull()
        expect(photoErrorMessage('PHOTO_RATE_LIMITED')).toBeNull()
    })
})
