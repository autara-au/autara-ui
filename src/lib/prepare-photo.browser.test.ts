/// <reference types="@vitest/browser/providers/playwright" />
/**
 * AUTM-1882: preparePhoto in a real Chromium, on real fixtures: the browser's
 * own decoder, EXIF orientation, canvas and JPEG encoder. jsdom has none of
 * them, so prepare-photo.test.ts can only check the order of the steps; this
 * checks what comes out.
 *
 * gps-oriented.jpg is stored 480 x 320, left half red, right half blue, with
 * EXIF orientation 6 (turn 90 degrees clockwise to view) and a GPS block. The
 * right result is 320 x 480, red on top, blue below, and no metadata.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PHOTO_LIMITS, isPreparePhotoError, preparePhoto, type PreparePhotoError } from './prepare-photo'
import gpsUrl from './__fixtures__/photos/gps-oriented.jpg?url'
import pngUrl from './__fixtures__/photos/transparent.png?url'
import webpUrl from './__fixtures__/photos/photo.webp?url'
import tinyUrl from './__fixtures__/photos/tiny.jpg?url'
import heicUrl from './__fixtures__/photos/photo.heic?url'

afterEach(() => {
    vi.unstubAllGlobals()
})

async function fixture(url: string, name: string, type: string): Promise<File> {
    const blob = await (await fetch(url)).blob()
    return new File([blob], name, { type })
}

async function bytes(blob: Blob): Promise<Uint8Array> {
    return new Uint8Array(await blob.arrayBuffer())
}

function has(data: Uint8Array, text: string): boolean {
    const needle = Array.from(text, (c) => c.charCodeAt(0))
    outer: for (let i = 0; i <= data.length - needle.length; i++) {
        for (let j = 0; j < needle.length; j++) if (data[i + j] !== needle[j]) continue outer
        return true
    }
    return false
}

/**
 * The metadata markers before the scan: APP1 to APP15 and COM. An APP2 that
 * is an ICC profile is colour, not metadata, and is kept on purpose (as the
 * server keeps it): Chromium's encoder writes an sRGB profile into every
 * canvas export. Anything else in an APP2 counts.
 */
function metadataMarkers(data: Uint8Array): number[] {
    const out: number[] = []
    let i = 2
    while (i < data.length) {
        const marker = data[i + 1]
        if (marker === 0xda || marker === 0xd9) break
        const length = (data[i + 2] << 8) | data[i + 3]
        const icc = marker === 0xe2 && String.fromCharCode(...data.subarray(i + 4, i + 16)) === 'ICC_PROFILE\0'
        if (((marker >= 0xe1 && marker <= 0xef) || marker === 0xfe) && !icc) out.push(marker)
        i += 2 + length
    }
    return out
}

/** The colour at a point of a decoded image, as [r, g, b]. */
async function pixel(blob: Blob, x: number, y: number): Promise<[number, number, number]> {
    const bitmap = await createImageBitmap(blob)
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0)
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data
    return [r, g, b]
}

async function codeOf(promise: Promise<unknown>): Promise<string> {
    try {
        await promise
        return 'resolved'
    } catch (error) {
        expect(isPreparePhotoError(error), String(error)).toBe(true)
        return (error as PreparePhotoError).code
    }
}

/** What the API's confirm checks (plan section 3), so the client never sends what it would refuse. */
async function passesServerChecks(blob: Blob, width: number, height: number) {
    const data = await bytes(blob)
    expect([data[0], data[1], data[2]]).toEqual([0xff, 0xd8, 0xff])
    expect(data.length).toBeGreaterThan(1024)
    expect(data.length).toBeLessThan(8 * 1024 * 1024)
    expect(Math.min(width, height)).toBeGreaterThanOrEqual(200)
    expect(Math.max(width, height)).toBeLessThanOrEqual(PHOTO_LIMITS.maxEdge)
}

describe('preparePhoto in Chromium', () => {
    it('drops the GPS block and all metadata, and turns the photo the right way up', async () => {
        const input = await fixture(gpsUrl, 'IMG_0001.jpg', 'image/jpeg')
        const inBytes = await bytes(input)
        expect(has(inBytes, 'Exif\0\0'), 'the fixture must carry EXIF').toBe(true)
        expect(has(inBytes, 'FixtureCam')).toBe(true)

        const result = await preparePhoto(input)
        expect(result.blob.type).toBe('image/jpeg')
        expect([result.width, result.height]).toEqual([320, 480])

        const out = await bytes(result.blob)
        expect(metadataMarkers(out)).toEqual([])
        expect(has(out, 'Exif')).toBe(false)
        expect(has(out, 'FixtureCam')).toBe(false)
        expect(has(out, 'fixture comment')).toBe(false)

        // Decoded with no orientation hint left, it is already upright.
        const bitmap = await createImageBitmap(result.blob)
        expect([bitmap.width, bitmap.height]).toEqual([320, 480])
        const [r1, , b1] = await pixel(result.blob, 160, 60)
        const [r2, , b2] = await pixel(result.blob, 160, 420)
        expect(r1, 'top is red').toBeGreaterThan(150)
        expect(b1).toBeLessThan(100)
        expect(b2, 'bottom is blue').toBeGreaterThan(150)
        expect(r2).toBeLessThan(100)
        await passesServerChecks(result.blob, result.width, result.height)
    })

    it('does the same through the <img> path when createImageBitmap is missing', async () => {
        vi.stubGlobal('createImageBitmap', undefined)
        const result = await preparePhoto(await fixture(gpsUrl, 'IMG_0001.jpg', 'image/jpeg'))
        vi.unstubAllGlobals()
        expect([result.width, result.height]).toEqual([320, 480])
        expect(metadataMarkers(await bytes(result.blob))).toEqual([])
        const [r] = await pixel(result.blob, 160, 60)
        expect(r).toBeGreaterThan(150)
    })

    it('puts a transparent PNG on white, not black', async () => {
        const result = await preparePhoto(await fixture(pngUrl, 'logo.png', 'image/png'))
        expect([result.width, result.height]).toEqual([400, 300])
        const [r, g, b] = await pixel(result.blob, 60, 150)
        expect(Math.min(r, g, b), 'the transparent half is white').toBeGreaterThan(240)
        const [r2, g2] = await pixel(result.blob, 340, 150)
        expect(g2).toBeGreaterThan(120)
        expect(r2).toBeLessThan(80)
    })

    it('takes a WebP', async () => {
        const result = await preparePhoto(await fixture(webpUrl, 'photo.webp', 'image/webp'))
        expect([result.width, result.height]).toEqual([600, 400])
        expect(result.blob.type).toBe('image/jpeg')
    })

    it('brings a 12 MP photo down to 1600 on the long edge', async () => {
        const canvas = new OffscreenCanvas(4000, 3000)
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#336699'
        ctx.fillRect(0, 0, 4000, 3000)
        ctx.fillStyle = '#ffcc00'
        ctx.fillRect(0, 0, 2000, 1500)
        const big = new File([await canvas.convertToBlob({ type: 'image/png' })], 'big.png', { type: 'image/png' })
        const result = await preparePhoto(big)
        expect([result.width, result.height]).toEqual([1600, 1200])
        await passesServerChecks(result.blob, result.width, result.height)
    })

    it('refuses a photo under 200 px', async () => {
        expect(await codeOf(preparePhoto(await fixture(tinyUrl, 'tiny.jpg', 'image/jpeg')))).toBe('TOO_SMALL')
    })

    it('says CANT_OPEN for a HEIC this browser cannot decode, and converts it where it can', async () => {
        const heic = await fixture(heicUrl, 'IMG_0002.HEIC', '')
        const code = await codeOf(preparePhoto(heic))
        // Chromium has no HEIC decoder; Safari does. Either answer is right
        // for its browser, and nothing else is.
        expect(['CANT_OPEN', 'resolved']).toContain(code)
        if (code === 'resolved') {
            const result = await preparePhoto(heic)
            expect([result.width, result.height]).toEqual([640, 480])
        }
    })

    it('says NOT_IMAGE for a text file named like a photo', async () => {
        const text = new File(['hello'], 'car.jpg', { type: 'image/jpeg' })
        expect(await codeOf(preparePhoto(text))).toBe('NOT_IMAGE')
    })
})
