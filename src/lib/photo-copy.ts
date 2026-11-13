import type { PreparePhotoErrorCode } from './prepare-photo'

/**
 * What a photo's states and refusals say (AUTM-1882), word for word from the
 * plan's shared states table (knowledge/project_photos_plan_2026_11_13.md,
 * section 6). The photo components draw these; a consumer that words a photo
 * state itself (a toast, a field error) takes them from here, so the customer
 * app and the pro's app cannot say it two ways. ASCII apostrophes, as QA
 * matches them.
 */
export const PHOTO_COPY = {
    /** Under the aqua ring while the bytes go up. */
    uploading: 'Uploading photo',
    /** While the API checks the photo (confirm). */
    checking: 'Checking photo',
    /** The upload did not land. The tile is the retry. */
    uploadFailed: "Upload didn't finish. Tap to retry.",
    /** The check could not run (PHOTO_CHECK_FAILED). The tile is the retry. */
    checkUnavailable: "We couldn't check this photo. Try again.",
    /** The check refused it. Remove only. */
    refused: "This photo can't be sent. It breaks our photo rules.",
    /** NOT_IMAGE, CANT_OPEN, PHOTO_TYPE_NOT_SUPPORTED. */
    wrongType: "We can't open that photo here. Choose a JPEG or PNG.",
    /** TOO_LARGE, PHOTO_TOO_LARGE. */
    tooLarge: 'That photo is too large. Choose one under 30 MB.',
    /** TOO_SMALL, PHOTO_TOO_SMALL. */
    tooSmall: 'That photo is too small to use.',
    /** A photo that was removed or erased. */
    erased: 'Photo no longer available',
    /** More photos picked than there is room for (PHOTO_LIMIT_REACHED). */
    overLimit: (limit: number) => `You can add up to ${limit} photos.`,
    /**
     * PHOTO_NOT_ALLOWED, as a fallback only (Don, 13 Nov). The API's own
     * sentence says why for this photo (the deposit is not held yet, the
     * chat is closed) and is the one to show when the error carries it.
     */
    notAllowed: "You can't add photos here right now.",
    /**
     * PHOTO_RATE_LIMITED, as a fallback only (Don, 13 Nov). The API's own
     * rate-limit sentence is these same words.
     */
    rateLimited: "That's a lot of photos at once. Try again in a minute.",
}

/** The API's photo codes (merchant-api `appError.ts`, plan section 5). */
export type PhotoApiErrorCode =
    | 'PHOTO_LIMIT_REACHED'
    | 'PHOTO_TYPE_NOT_SUPPORTED'
    | 'PHOTO_TOO_LARGE'
    | 'PHOTO_TOO_SMALL'
    | 'PHOTO_NOT_UPLOADED'
    | 'PHOTO_NOT_ALLOWED'
    | 'PHOTO_CHECK_FAILED'
    | 'PHOTO_RATE_LIMITED'

/**
 * What to say for a preparePhoto refusal or an API photo code, or null for a
 * code it does not know (and PHOTO_LIMIT_REACHED without `limit`).
 *
 * For an API code this is the FALLBACK. When the API's error carries its own
 * sentence (`message` in the payload, or the AppSync error's message), show
 * that sentence and call this only when there is none: the API words some
 * codes more specifically than one string can, PHOTO_NOT_ALLOWED above all,
 * whose sentence says why for that photo. preparePhoto's codes have no server
 * sentence; these words are the only ones.
 */
export function photoErrorMessage(
    code: PreparePhotoErrorCode | PhotoApiErrorCode | (string & {}),
    options: { limit?: number } = {}
): string | null {
    switch (code) {
        case 'NOT_IMAGE':
        case 'CANT_OPEN':
        case 'PHOTO_TYPE_NOT_SUPPORTED':
            return PHOTO_COPY.wrongType
        case 'TOO_LARGE':
        case 'PHOTO_TOO_LARGE':
            return PHOTO_COPY.tooLarge
        case 'TOO_SMALL':
        case 'PHOTO_TOO_SMALL':
            return PHOTO_COPY.tooSmall
        case 'PHOTO_NOT_UPLOADED':
            return PHOTO_COPY.uploadFailed
        case 'PHOTO_CHECK_FAILED':
            return PHOTO_COPY.checkUnavailable
        case 'PHOTO_LIMIT_REACHED':
            return options.limit != null ? PHOTO_COPY.overLimit(options.limit) : null
        case 'PHOTO_NOT_ALLOWED':
            return PHOTO_COPY.notAllowed
        case 'PHOTO_RATE_LIMITED':
            return PHOTO_COPY.rateLimited
        default:
            return null
    }
}
