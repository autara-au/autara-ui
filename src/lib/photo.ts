/* AUTM-1882: the photo utility and its words, without React. Published as the
 * `@autara-au/autara-ui/photo` subpath (and from the package root), so an
 * upload hook can import it without the component barrel. */
export {
    preparePhoto,
    PreparePhotoError,
    isPreparePhotoError,
    sniffPhotoType,
    fitPhotoSize,
    stripJpegMetadata,
    PHOTO_LIMITS,
    PHOTO_ACCEPT,
    type PreparePhotoErrorCode,
    type PreparePhotoOptions,
    type PreparedPhoto,
    type PhotoSourceType,
} from './prepare-photo'
export { PHOTO_COPY, photoErrorMessage, type PhotoApiErrorCode } from './photo-copy'
