import type * as ObjectGlyphs from './object-glyphs'
import type * as UtilityGlyphs from './utility-glyphs'

/** The name of every Autara icon component this package exports. */
export type AutaraIconName = keyof typeof ObjectGlyphs | keyof typeof UtilityGlyphs

/**
 * AUTM-2114: every Solar glyph merchant-mobile imported, mapped to the Autara
 * icon that means the same thing there, so the app can be migrated by a
 * script (rewrite the import, rename the element, drop `weight`).
 *
 * Several Solar names share one Autara glyph (Calendar and CalendarMark are
 * both Bookings). Two are mapped by meaning rather than by name, after reading
 * how merchant-mobile uses them:
 * - `InboxIn` marks the "requested" step of a booking's timeline, the moment
 *   the BOOKING_REQUESTED notification draws with CalendarAdd, so it is
 *   CalendarAddIcon (InboxIcon is a conversation).
 * - `Export` is only ever the Share action, so it is ShareIcon (the same tray
 *   and arrow; a second, near-identical glyph would drift).
 *
 * `UserBlock` (the No-show action) and `UserCross` (the no-show recorded)
 * are one event, so both are NoShowIcon. The ringed Solar glyphs map to the
 * ringed Autara ones (CloseCircle to CloseCircleIcon...); where a site is a
 * dismiss, an inline tick or a stepper in its own disc, the migration picks
 * the bare CloseIcon, CheckIcon, AddIcon or RemoveIcon instead.
 *
 * `weight="Bold"` has no direct equivalent. Where Bold marked a state (a
 * rated star, "copied", the chosen option) pass `active`, or set
 * `style={{ '--icon-body': 1 }}` for a solid body.
 */
export const SOLAR_TO_AUTARA = {
    AddCircle: 'AddCircleIcon',
    AltArrowDown: 'ChevronDownIcon',
    AltArrowLeft: 'ChevronLeftIcon',
    AltArrowRight: 'ChevronRightIcon',
    AltArrowUp: 'ChevronUpIcon',
    ArrowRight: 'ArrowRightIcon',
    ArrowRightUp: 'ExternalLinkIcon',
    Bell: 'NotificationsIcon',
    BellBing: 'NotificationsIcon',
    Bill: 'InvoicesIcon',
    Box: 'ServicesIcon',
    Calendar: 'BookingsIcon',
    CalendarAdd: 'CalendarAddIcon',
    CalendarMark: 'BookingsIcon',
    Camera: 'CameraIcon',
    CameraAdd: 'CameraAddIcon',
    Card: 'CardIcon',
    CardRecive: 'PayoutIcon',
    CardTransfer: 'PayoutIcon',
    CaseMinimalistic: 'ServicesIcon',
    ChatRound: 'ChatIcon',
    ChatRoundDots: 'ChatIcon',
    ChatRoundLine: 'ChatIcon',
    CheckCircle: 'CheckCircleIcon',
    CheckRead: 'ReadReceiptIcon',
    ClipboardList: 'ChecklistIcon',
    ClockCircle: 'ClockIcon',
    CloseCircle: 'CloseCircleIcon',
    Copy: 'CopyIcon',
    DangerCircle: 'ErrorIcon',
    DangerTriangle: 'WarningIcon',
    Document: 'DocumentIcon',
    DocumentAdd: 'DocumentAddIcon',
    DownloadMinimalistic: 'DownloadIcon',
    Export: 'ShareIcon',
    Eye: 'ShowIcon',
    Forbidden: 'BlockedIcon',
    Gallery: 'PhotoIcon',
    GalleryAdd: 'PhotoAddIcon',
    GalleryCheck: 'PhotoCheckIcon',
    GalleryRemove: 'PhotoRemoveIcon',
    Garage: 'WorkshopIcon',
    HomeAngle2: 'TodayIcon',
    Hourglass: 'PendingIcon',
    Inbox: 'InboxIcon',
    InboxIn: 'CalendarAddIcon',
    Layers: 'PackagesIcon',
    LayersMinimalistic: 'PackagesIcon',
    Letter: 'EmailIcon',
    LockKeyhole: 'LockIcon',
    LockKeyholeMinimalistic: 'LockIcon',
    Logout3: 'SignOutIcon',
    MagicStick3: 'MagicIcon',
    Magnifer: 'SearchIcon',
    MapPoint: 'LocationIcon',
    MenuDots: 'MoreIcon',
    MinusCircle: 'RemoveCircleIcon',
    MonitorSmartphone: 'DevicesIcon',
    MoonStars: 'AppearanceIcon',
    Notes: 'NotesIcon',
    PauseCircle: 'PauseIcon',
    Pen: 'EditIcon',
    Phone: 'PhoneIcon',
    Plain2: 'SendIcon',
    Play: 'PlayIcon',
    QuestionCircle: 'HelpIcon',
    Refresh: 'RefreshIcon',
    RestartCircle: 'RefreshIcon',
    Routing2: 'DirectionsIcon',
    Settings: 'SettingsIcon',
    ShareCircle: 'ShareIcon',
    ShieldCheck: 'VerifiedIcon',
    ShieldUser: 'SecurityIcon',
    Shop: 'BusinessIcon',
    ShopMinimalistic: 'BusinessIcon',
    SquareArrowRightUp: 'ExternalLinkIcon',
    Star: 'StarIcon',
    TrashBinMinimalistic: 'DeleteIcon',
    Tuning: 'FiltersIcon',
    UserBlock: 'NoShowIcon',
    UserCircle: 'AccountIcon',
    UserCross: 'NoShowIcon',
    UserRounded: 'AccountIcon',
    UsersGroupRounded: 'CustomersIcon',
    VerifiedCheck: 'VerifiedIcon',
    Wallet: 'EarningsIcon',
    WalletMoney: 'EarningsIcon',
    Wheel: 'VehicleIcon',
} as const satisfies Record<string, AutaraIconName>

/** A Solar glyph name merchant-mobile used. */
export type SolarGlyphName = keyof typeof SOLAR_TO_AUTARA
