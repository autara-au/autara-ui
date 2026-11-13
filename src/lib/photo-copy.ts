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
 * What to say for a preparePhoto refusal or an API photo code. Null for a
 * code the plan gives no words to (PHOTO_NOT_ALLOWED, PHOTO_RATE_LIMITED):
 * the screen that called decides, since only it knows why (the deposit is not
 * held yet, for one).
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
        default:
            return null
    }
}
