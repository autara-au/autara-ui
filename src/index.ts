// Components
export {
    GradientBar,
    Button, buttonVariants, type ButtonProps,
    IconButton, type IconButtonProps,
    // AUTM-1756: the icon disc's tones and sizes, the one close control, and
    // a region that scrolls on its own.
    CloseButton, CloseGlyph, iconDiscClasses, resolveIconButtonTone,
    type IconButtonTone, type IconButtonSize, type CloseButtonProps,
    ScrollArea, useScrollEdges, useScrollbarReveal, type ScrollAreaProps, type ScrollAreaOrientation, type ScrollEdges,
    // AUTM-1756 follow-up: one sideways row of chips, chevrons and a drag, no bar.
    ChipRow, chipRowPageTarget, CHIP_ROW_DRAG_THRESHOLD, type ChipRowProps, type ChipRowRole, type ChipRowArrows,
    // AUTM-1787: a list row's everyday actions.
    RowActions, type RowAction, type RowActionsProps,
    // AUTM-1755: a list beside its record, with a splitter.
    SplitPane, type SplitPaneProps,
    Input, inputVariants, type InputProps,
    PhoneInput, DEFAULT_COUNTRIES, findCountryByIso, type PhoneInputProps, type PhoneCountry,
    Textarea, textareaVariants, type TextareaProps,
    Label, labelVariants, type LabelProps,
    FormField, type FormFieldProps,
    FieldStack, FieldStackRow, FieldStackField, type FieldStackFieldProps,
    // AUTM-948 — Autara Glass foundation
    GlassSurface, GradientGround, type GlassSurfaceProps, type GradientGroundProps,
    // AUTM-1475 — web revamp foundations
    BloomField, type BloomFieldProps,
    LitGroup, type LitGroupProps,
    Reveal, type RevealProps,
    // AUTM-1679 — a pinned scroll story with its indicator, and a disclosure
    // that opens and closes smoothly.
    ScrollStory, SCROLL_STORY_STILL_QUERY, type ScrollStoryProps, type ScrollStoryStep, type ScrollStoryStepState, type ScrollStoryPhase,
    Disclosure, type DisclosureProps,
    // AUTM-1739 — the page's content track: 1440px of content, a fluid gutter.
    PageContainer, type PageContainerProps,
    Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants, type CardProps,
    BackButton, type BackButtonProps,
    Badge, badgeVariants, type BadgeProps,
    Separator,
    Skeleton, type SkeletonProps,
    Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogDescription, type DialogContentProps, type DialogLayout, type DialogSize,
    Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription,
    PickerSheet, type PickerOption, type PickerRowRender, type PickerSheetProps,
    PickerTrigger, type PickerTriggerProps,
    Accordion, AccordionItem, AccordionTrigger, AccordionContent,
    Tabs, TabsList, TabsTrigger, TabsContent, type TabsListProps,
    // AUTM-1792
    CountUp, type CountUpProps,
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, type DropdownMenuContentProps,
    // AUTM-965 — anchored floating panel for CONTENT (DropdownMenu gives its
    // children `menuitem` semantics, which a list of content must not have).
    Popover, PopoverTrigger, PopoverAnchor, PopoverClose, PopoverPortal, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription, PopoverBody, PopoverFooter, PopoverSeparator, type PopoverContentProps, type PopoverBodyProps,
    navigationMenuTriggerStyle, NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuContent, NavigationMenuTrigger, NavigationMenuLink, NavigationMenuIndicator, NavigationMenuViewport,
    ScrollReveal, type ScrollRevealProps,
    FadeIn, FadeInView, ScaleIn, StaggerContainer, StaggerItem,
    // New components
    ToastProvider, useToast, toast, type Toast, type ToastType, type ToastTone, type ToastPosition, type ToastVariant,
    Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator,
    Switch,
    Checkbox,
    RadioGroup, RadioGroupItem,
    Avatar, AvatarImage, AvatarFallback, avatarVariants,
    Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
    Progress,
    ProgressSteps, type ProgressStepsProps,
    // AUTM-1046 — indeterminate busy indicator for work in progress.
    Spinner, type SpinnerProps, type SpinnerSize, type SpinnerTone,
    // AUTM-1706
    AutaraLoader, type AutaraLoaderProps, type AutaraLoaderSize, type AutaraLoaderTone,
    MultiSelect, type MultiSelectOption, type MultiSelectProps,
    Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption,
    // v1.1.0 — promoted from autara-customer-web
    BrandButton, brandButtonVariants, type BrandButtonProps,
    MetaChip, type MetaChipProps,
    StatusDot, type StatusDotProps, type StatusDotTone,
    OtpInput, type OtpInputProps,
    RatingStars, type RatingStarsProps,
    EmptyState, type EmptyStateProps,
    LockedFeature, type LockedFeatureProps,
    MerchantCard, type MerchantCardProps, type MerchantBadge, type MerchantMode,
    SectionHeading, type SectionHeadingProps,
    CarouselHeader, type CarouselHeaderProps,
    ServiceCard, ServiceCardSkeleton, type ServiceCardProps, type ServiceCardSkeletonProps,
    type ServiceCardLayout, type ServiceCardChip, type ServiceCardPriceLine, type ServiceCardTestIds,
    type ServiceCardStatus, type ServiceCardStatusTone,
    ServiceDetailSheet, type ServiceDetailSheetProps, type ServiceDetailSheetTestIds,
    PackageCard, type PackageCardProps,
    CardGrid, type CardGridProps, type CardGridColumns,
    TrustItem, type TrustItemProps,
    SectionBand, type SectionBandProps,
    StepCard, type StepCardProps,
    // v1.2.0 — async-surface primitives
    KpiCard, type KpiCardProps,
    AsyncSkeleton, type AsyncSkeletonProps,
    ErrorCard, type ErrorCardProps,
    // v1.3.0 markers — TrendingPill was folded into Badge via
    // shape="parallelogram" by AUTAA-UI-006.
    // v1.4.0 — merchant-mobile harvest (StatsStrip, InfoRow, ListSection, ModeChip, Logo, SearchInput, FilterChipRow)
    StatsStrip, type StatsStripProps, type StatItem,
    // v2.x — AUTM-726: StatsStrip is now a grid of these.
    StatTile, type StatTileProps, type StatTone, type StatTrend,
    DeviceFrame, type DeviceFrameProps, type DeviceKind,
    InfoRow, type InfoRowProps,
    ListSection, ListSectionRow, type ListSectionProps, type ListSectionRowProps,
    // AUTM-1781 — the signed-in app shell.
    AppBar, type AppBarProps,
    AppTabBar, type AppTabBarProps, type AppTabBarItem,
    ActionBar, type ActionBarProps, type ActionBarAction, type ActionBarControl,
    // CountUp is exported once, beside Tabs above (AUTM-1792; AUTM-1781 added its server-safe props).
    MediaFrame, initialsOf, type MediaFrameProps,
    DateTile, WhenBlock, dateTileParts, type DateTileProps, type DateTileParts, type WhenBlockProps,
    BookingPass, type BookingPassProps,
    FactRows, type FactRowsProps, type FactRow,
    ModeChip, type ModeChipProps, type BookingMode,
    Logo, type LogoProps, type LogoTone,
    SearchInput, type SearchInputProps,
    FilterChipRow, type FilterChipRowProps, type FilterChipOption,
    // v2.1.0 — customer-web marketing harvest (AUTAA-UI-007)
    CategoryRail, type CategoryRailProps, type CategoryRailItem,
    // AUTM-1018 — reserves its own space, same mechanism as the consent notice.
    PWAInstallBanner, PWA_INSTALL_BANNER_HEIGHT_VAR, PWA_INSTALL_BANNER_OFFSET,
    type PWAInstallBannerProps,
    // AUTM-852 — the consent notice, and the space it reserves for itself.
    ConsentBanner, CONSENT_BANNER_HEIGHT_VAR, CONSENT_BANNER_OFFSET,
    type ConsentBannerProps,
    NavSearchPill, type NavSearchPillProps, type NavSearchPillField,
    CompactSearchPill, type CompactSearchPillProps,
    // chat / conversation primitives (AUTM-159)
    MessageBubble, type MessageBubbleProps, type MessageSide,
    MessageComposer, type MessageComposerProps,
    MessageThread, type MessageThreadProps, type MessageItem, type MessageSendStatus,
    // AUTM-1806 — cards, quick replies and the attach menu for the booking thread
    MessageCard, type MessageCardProps, type MessageCardAction, type MessageCardState,
    QuickReplies, type QuickRepliesProps, type QuickReply,
    // AUTM-1867 — pick one of a few in one tap.
    ChoiceChips, type ChoiceChipsProps, type ChoiceChipOption, type ChoiceChipsAction,
    ComposerAttachMenu, attachMenuGlyphs, type ComposerAttachMenuProps, type AttachMenuItem,
    // Media — pick-then-crop dialog (AUTM-163)
    ImageCropDialog, type ImageCropDialogProps,
    // Wizard step indicator (AUTM-322)
    Stepper, type StepperProps, type StepperStep,
    // Wizard step header (AUTM-839)
    StepHeader, type StepHeaderProps,
    // Address search + map confirm (AUTM-586)
    AddressPickerSheet,
    type AddressPickerSheetProps,
    type AddressSuggestion,
    type ResolvedAddress,
    type AddressMapRenderProps,
    // AUTM-1127 — the one shared account menu, replacing four hand-rolled ones
    AccountMenu,
    type AccountMenuProps,
    type AccountMenuIdentity,
    type AccountMenuItemSpec,
    type AccountMenuSection,
    type AccountMenuPrimaryAction,
    type AccountMenuAccent,
    type AccountMenuTone,
    // AUTM-1185 — the customer-web hardening sweep's four primitives
    InlineAlert, type InlineAlertProps, type InlineAlertTone,
    Banner, type BannerProps,
    ConfirmDialog, type ConfirmDialogProps,
    NativeSelect, type NativeSelectProps,
    MoneyBreakdown, type MoneyBreakdownProps, type MoneyRow, type MoneyTone,
    // AUTM-1856 — one link, ready to hand over: summary, QR, link, the ways it leaves.
    LinkShareSheet, shareHrefs, type LinkShareSheetProps, type LinkShareSheetPrimary, type ShareTarget,
    // AUTM-1737 — one invoice status colour system.
    InvoiceStatusBadge, invoiceStatusTone, invoiceStatusLabel, type InvoiceStatusBadgeProps, type InvoicePaymentState, type InvoiceStatusTone,
    // AUTM-1221 — graduated from customer-web (plan item U5)
    Countdown, remainingLabel, type CountdownProps,
    // AUTM-1819 — the time left as a solid pill (Today's requests, the booking record).
    CountdownPill, countdownPillVariant, type CountdownPillProps, type CountdownPillTone,
    PolicyTimeline, type PolicyTimelineProps, type PolicyTimelineStep,
    // AUTM-1195 — pick one of a few, as cards
    ChoiceCard, ChoiceGroup, type ChoiceCardProps, type ChoiceGroupProps,
    SwatchRadioGroup, type SwatchRadioGroupProps, type SwatchOption,
    // AUTM-1870: a car in a few taps, drawn as itself.
    VehiclePicker, validateVehiclePicker, vehiclePickerStepFor, EMPTY_VEHICLE_PICKER_VALUE, VEHICLE_PICKER_MESSAGES,
    type VehiclePickerProps, type VehiclePickerValue, type VehiclePickerStep, type VehiclePickerField, type VehiclePickerErrors,
    VehicleMakeMark, vehicleMakeMonogram, hasVehicleMakeLogo, type VehicleMakeMarkProps,
    VehicleCard, VehicleAddCard, VehiclePaintDot, vehicleCardFacts, type VehicleCardProps, type VehicleAddCardProps, type VehicleCardSelectable,
    VehicleProfile, type VehicleProfileProps, type VehicleProfileJob, type VehicleProfileNote,
    // AUTM-1800: a pro's public profile, as /m draws it and the portal previews it.
    CategoryArt, categoryArtKind, type CategoryArtKind,
    MerchantProfileCover, MerchantProfileCoverArt, MerchantProfileHeader,
    type MerchantProfileCoverProps, type MerchantProfileCoverArtProps, type MerchantProfileHeaderProps,
    type MerchantProfileLayout, type MerchantProfileStatus,
    ProfileSections, ProfileSection, ProfileBio,
    type ProfileSectionsProps, type ProfileSectionProps, type ProfileBioProps,
} from './components'
export { SocialButton, type SocialButtonProps, type SocialButtonProvider } from './components/SocialButton'

// Utilities
export { cn } from './lib/cn'
/* AUTM-1018 — the offset a `position: fixed` element uses to clear EVERY
 * bottom-anchored banner in the library at once. Clearing only one of them
 * still leaves the element buried when the other is up. */
export { BOTTOM_CHROME_OFFSET } from './lib/reserved-bottom-space'
/* AUTM-1594 — the `--motion-*` tokens as typed values for framer-motion and
 * other JS-driven motion, held equal to utilities/animations.css by
 * motion-tokens.test.ts. */
export {
    motionTokens,
    motionDurations,
    motionEasings,
    motionTransition,
    // AUTM-1678: page content motion
    motionStaggerDelay,
    MOTION_STAGGER_CAP,
    // AUTM-1781: the same tokens as a Web Animations timing
    motionTiming,
    type MotionBezier,
    type MotionDurationName,
    type MotionTransitionName,
} from './lib/motion-tokens'

/* AUTM-1870: the Australian make, model and body catalog behind VehiclePicker
 * (customer-api's vehicleData.ts names, plus a body per model), the paints,
 * and the search the picker runs. */
export {
    AU_VEHICLE_CATALOG,
    VEHICLE_BODIES,
    VEHICLE_PAINTS,
    vehicleBodyLabel,
    isVehicleBody,
    vehiclePaint,
    findVehicleMake,
    findVehicleModel,
    inferVehicleBody,
    searchVehicleCatalog,
    popularVehicleMakes,
    otherVehicleMakes,
    vehicleSlug,
    type VehicleBody,
    type VehiclePaint,
    type VehicleCatalog,
    type VehicleCatalogMake,
    type VehicleCatalogModel,
    type VehicleSearchResult,
} from './lib/vehicle-catalog'

/* AUTM-1781: the direction of the next screen change, for `.motion-screen`. */
export {
    markNavigation,
    listenForBackNavigation,
    type NavigationDirection,
} from './lib/navigation-motion'

/* AUTM-1679 — a fixed header that steps out of the way on the way down and
 * comes back on the way up (utilities/autohide.css). */
export { useAutoHideHeader, type AutoHideHeaderOptions } from './lib/use-auto-hide-header'

export { DatePicker, type DatePickerProps, type DayState } from './components/DatePicker'
// AUTM-1633 — the month, on its own: any date by tap or keyboard.
export { MonthCalendar, type MonthCalendarProps } from './components/MonthCalendar'
export { TimePicker, type TimePickerProps, type SlotState } from './components/TimePicker'
// AUTM-1507 — duration as a typable field plus a picker, because every
// duration a merchant thinks in had to be converted to minutes in their head
// first, and `type="number"`'s spinner reads as a foreign control on dark.
export {
    DurationPicker,
    durationLabel,
    durationSpoken,
    parseDuration,
    DEFAULT_MAX_DURATION_MINUTES,
    DEFAULT_MIN_WORKING_DAYS,
    DEFAULT_MAX_WORKING_DAYS,
    type DurationPickerProps,
    type DurationWorkingDays,
} from './components/DurationPicker'
export {
    addDays,
    addMonths,
    dateLabelFrom,
    daysBetween,
    timeSlots,
    timeLabel,
    longDateLabel,
    isISODate,
    isISOTime,
} from './lib/calendar'

/* AUTM-1800: what a pro's public profile says about them (the door state, the
 * kicker, where they work), shared by customer-web's /m and the portal's
 * preview so the two cannot word a pro differently. */
export {
    PROFILE_DEFAULT_LOCALE,
    PROFILE_DEFAULT_TIMEZONE,
    merchantLocalClock,
    getMerchantOpenState,
    openStateCopy,
    describeOpenState,
    formatPauseUntil,
    deriveLocationLabel,
    profileKicker,
    bookingModeLabel,
    profileMonogram,
    type ProfileBookingMode,
    type ProfilePlaceInput,
    type MerchantHours,
    type MerchantOpenState,
    type MerchantOpenStatus,
    type LocationLabel,
} from './lib/merchant-profile'

/* AUTM-1800: how a service is listed to a customer (the price from the
 * server's quote, its length, the multi-day words), shared by customer-web and
 * the portal's preview so a card cannot be worded two ways. */
export {
    formatPriceCents,
    hasBookingFee,
    listingPrice,
    fromPrice,
    serviceDurationLabel,
    isMultiDay,
    workingDaysLabel,
    DROP_OFF_TAG,
    serviceLocationLabel,
    type ListingBookingMode,
    type ListingPriceBreakdown,
    type ListingPrice,
    type ListingPriceParts,
    type ListingPriceLine,
    type ListingPriceInput,
    type ListingPriceOptions,
} from './lib/service-listing'
export {
    packageSaving,
    includedServicesLabel,
    type PackageSaving,
    type PackageSavingInput,
} from './lib/package-listing'
