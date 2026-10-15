export { GradientBar } from './GradientBar'
export { Button, buttonVariants, type ButtonProps } from './Button'
export {
    IconButton,
    CloseButton,
    CloseGlyph,
    iconDiscClasses,
    resolveIconButtonTone,
    type IconButtonProps,
    type IconButtonTone,
    type IconButtonSize,
    type CloseButtonProps,
} from './IconButton'
// AUTM-1756: a region that scrolls on its own, and its edge reader.
export {
    ScrollArea,
    useScrollEdges,
    useScrollbarReveal,
    type ScrollAreaProps,
    type ScrollAreaOrientation,
    type ScrollEdges,
} from './ScrollArea'
export { Input, inputVariants, type InputProps } from './Input'
export { OtpInput, type OtpInputProps } from './OtpInput'
export {
    PhoneInput,
    DEFAULT_COUNTRIES,
    findCountryByIso,
    type PhoneInputProps,
    type PhoneCountry,
} from './PhoneInput'
export { Textarea, textareaVariants, type TextareaProps } from './Textarea'
export { Label, labelVariants, type LabelProps } from './Label'
export { FormField, type FormFieldProps } from './FormField'
export {
    FieldStack,
    FieldStackRow,
    FieldStackField,
    type FieldStackFieldProps,
} from './FieldStack'
// AUTM-948 — the one glass material every other surface composes.
export {
    GlassSurface,
    GradientGround,
    type GlassSurfaceProps,
    type GradientGroundProps,
} from './GlassSurface'
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants, type CardProps } from './Card'
export { BackButton, type BackButtonProps } from './BackButton'
export { Badge, badgeVariants, type BadgeProps } from './Badge'
export { Separator } from './Separator'
export { Skeleton, type SkeletonProps } from './Skeleton'

export {
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogClose,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogTitle,
    DialogDescription,
    type DialogContentProps,
    type DialogLayout,
    type DialogSize,
} from './Dialog'

export {
    Sheet,
    SheetPortal,
    SheetOverlay,
    SheetTrigger,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription,
} from './Sheet'

export {
    PickerSheet,
    type PickerOption,
    type PickerRowRender,
    type PickerSheetProps,
} from './PickerSheet'
export { PickerTrigger, type PickerTriggerProps } from './PickerTrigger'

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './Accordion'
export { Tabs, TabsList, TabsTrigger, TabsContent, type TabsListProps } from './Tabs'
// AUTM-1792: a figure that counts up to its value once, as it arrives.
// AUTM-1781 added `text`, `formatOptions`, `locale` and `testId`, for a server component.
export { CountUp, type CountUpProps } from './CountUp'

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuGroup,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    type DropdownMenuContentProps,
} from './DropdownMenu'

// AUTM-965 — anchored floating panel for CONTENT. Reach for DropdownMenu
// when every child is a command; reach for this when they are not, because
// DropdownMenu gives its children `menuitem` semantics.
export {
    Popover,
    PopoverTrigger,
    PopoverAnchor,
    PopoverClose,
    PopoverPortal,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverDescription,
    PopoverBody,
    PopoverFooter,
    PopoverSeparator,
    type PopoverContentProps,
    type PopoverBodyProps,
} from './Popover'

export {
    navigationMenuTriggerStyle,
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuContent,
    NavigationMenuTrigger,
    NavigationMenuLink,
    NavigationMenuIndicator,
    NavigationMenuViewport,
} from './NavigationMenu'

export { ScrollReveal, type ScrollRevealProps } from './ScrollReveal'
export { FadeIn, FadeInView, ScaleIn, StaggerContainer, StaggerItem } from './MotionDiv'

export { ToastProvider, useToast, toast, type Toast, type ToastType, type ToastTone, type ToastPosition, type ToastVariant } from './Toast'

export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
} from './Select'

export { Switch } from './Switch'
export { Checkbox } from './Checkbox'
export { RadioGroup, RadioGroupItem } from './Radio'
export { Avatar, AvatarImage, AvatarFallback, avatarVariants } from './Avatar'
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './Tooltip'
export { Progress } from './Progress'
export { ProgressSteps, type ProgressStepsProps } from './ProgressSteps'
// AUTM-1046 — indeterminate busy indicator for work in progress (uploads, saves).
export { Spinner, type SpinnerProps, type SpinnerSize, type SpinnerTone } from './Spinner'
// AUTM-1706: the Autara mark as a loader; Button's busy state uses it.
export { AutaraLoader, type AutaraLoaderProps, type AutaraLoaderSize, type AutaraLoaderTone } from './AutaraLoader'
export { MultiSelect, type MultiSelectOption, type MultiSelectProps } from './MultiSelect'

export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
} from './Table'

// ─── v1.1.0 promotions from autara-customer-web ──────────────────────────
export { BrandButton, brandButtonVariants, type BrandButtonProps } from './BrandButton'
export { MetaChip, type MetaChipProps } from './MetaChip'
export { StatusDot, type StatusDotProps, type StatusDotTone } from './StatusDot'
export { RatingStars, type RatingStarsProps } from './RatingStars'
export { EmptyState, type EmptyStateProps } from './EmptyState'
export { LockedFeature, type LockedFeatureProps } from './LockedFeature'
export { MerchantCard, type MerchantCardProps, type MerchantBadge, type MerchantMode } from './MerchantCard'
export { SectionHeading, type SectionHeadingProps } from './SectionHeading'
export { CarouselHeader, type CarouselHeaderProps } from './CarouselHeader'
export {
    ServiceCard,
    ServiceCardSkeleton,
    type ServiceCardProps,
    type ServiceCardSkeletonProps,
    type ServiceCardLayout,
    type ServiceCardChip,
    type ServiceCardPriceLine,
    type ServiceCardTestIds,
    type ServiceCardStatus,
    type ServiceCardStatusTone,
} from './ServiceCard'
export {
    ServiceDetailSheet,
    type ServiceDetailSheetProps,
    type ServiceDetailSheetTestIds,
} from './ServiceDetailSheet'
export { PackageCard, type PackageCardProps } from './PackageCard'
export { CardGrid, type CardGridProps, type CardGridColumns } from './CardGrid'
export { TrustItem, type TrustItemProps } from './TrustItem'
export { SectionBand, type SectionBandProps } from './SectionBand'
export { StepCard, type StepCardProps } from './StepCard'

// ─── v1.2.0 — async-surface primitives ───────────────────────────────────
export { KpiCard, type KpiCardProps } from './KpiCard'
export { AsyncSkeleton, type AsyncSkeletonProps } from './AsyncSkeleton'
export { ErrorCard, type ErrorCardProps } from './ErrorCard'

// ─── Chat / conversation primitives (AUTM-159) ───────────────────────────
export { MessageBubble, type MessageBubbleProps, type MessageSide } from './MessageBubble'
export { MessageComposer, type MessageComposerProps } from './MessageComposer'
export { MessageThread, type MessageThreadProps, type MessageItem, type MessageSendStatus } from './MessageThread'
// AUTM-1806 — cards, quick replies and the attach menu for the booking thread
export { MessageCard, type MessageCardProps, type MessageCardAction, type MessageCardState } from './MessageCard'
export { QuickReplies, type QuickRepliesProps, type QuickReply } from './QuickReplies'
// AUTM-1867 — pick one of a few in one tap (services, times), with one trailing action.
export { ChoiceChips, type ChoiceChipsProps, type ChoiceChipOption, type ChoiceChipsAction } from './ChoiceChips'
export { ComposerAttachMenu, attachMenuGlyphs, type ComposerAttachMenuProps, type AttachMenuItem } from './ComposerAttachMenu'

// v1.3.0 introduced a standalone TrendingPill component for marker
// pills. AUTAA-UI-006 (v1.2.0+ — or whatever semantic-release picks)
// folded it into Badge via shape="parallelogram". The TrendingPill
// surface is gone — use the marker tones on Badge:
// `<Badge variant="purple" shape="parallelogram">Featured</Badge>`
// `<Badge variant="aqua"   shape="parallelogram">New</Badge>`
// `<Badge variant="lime"   shape="parallelogram">Trending</Badge>`
// Marker, status, and legacy tones all live on Badge.

// ─── v1.4.0 — merchant-mobile harvest ────────────────────────────────────
// Promoted from inline merchant-mobile components after the Phase 3
// scaffold pass surfaced 3-4 duplications of the same pattern.
export {
    StatTile,
    type StatTileProps,
    type StatTone,
    type StatTrend,
} from './StatTile'
export { StatsStrip, type StatsStripProps, type StatItem } from './StatsStrip'
export { InfoRow, type InfoRowProps } from './InfoRow'
export {
    ListSection,
    ListSectionRow,
    type ListSectionProps,
    type ListSectionRowProps,
} from './ListSection'
export { ModeChip, type ModeChipProps, type BookingMode } from './ModeChip'
export { Logo, type LogoProps, type LogoTone } from './Logo'
export { SearchInput, type SearchInputProps } from './SearchInput'
export {
    FilterChipRow,
    type FilterChipRowProps,
    type FilterChipOption,
} from './FilterChipRow'

// ─── v2.1.0 — customer-web marketing harvest (AUTAA-UI-007) ────────────
// Promoted from autara-customer-web after the homepage refactor surfaced
// the same patterns about to show up on merchant-web and admin too.
export {
    CategoryRail,
    type CategoryRailProps,
    type CategoryRailItem,
} from './CategoryRail'
// AUTM-1018 — reserves its own space, same mechanism as the consent notice.
export {
    PWAInstallBanner,
    PWA_INSTALL_BANNER_HEIGHT_VAR,
    PWA_INSTALL_BANNER_OFFSET,
    type PWAInstallBannerProps,
} from './PWAInstallBanner'
// AUTM-852 — the consent notice, and the space it reserves for itself.
export {
    ConsentBanner,
    CONSENT_BANNER_HEIGHT_VAR,
    CONSENT_BANNER_OFFSET,
    type ConsentBannerProps,
} from './ConsentBanner'
export {
    NavSearchPill,
    type NavSearchPillProps,
    type NavSearchPillField,
} from './NavSearchPill'
export {
    CompactSearchPill,
    type CompactSearchPillProps,
} from './CompactSearchPill'

// ─── Media — pick-then-crop dialog (AUTM-163) ──────────────────────────
export { ImageCropDialog, type ImageCropDialogProps } from './ImageCropDialog'

// ─── Wizard step indicator (AUTM-322) ──────────────────────────────────
export { Stepper, type StepperProps, type StepperStep } from './Stepper'

// ─── Wizard step header (AUTM-839) ─────────────────────────────────────
export { StepHeader, type StepHeaderProps } from './StepHeader'

// ─── Address search + map confirm (AUTM-586) ───────────────────────────
// Provider-agnostic by design — autara-ui ships no maps dependency; the
// consumer supplies the Places/geocoding glue and the map render prop.
export {
    AddressPickerSheet,
    type AddressPickerSheetProps,
    type AddressSuggestion,
    type ResolvedAddress,
    type AddressMapRenderProps,
} from './AddressPickerSheet'

// ─── The one shared account menu (AUTM-1127) ───────────────────────────
// Replaces four hand-rolled menus: customer-web's ProfileMenu,
// merchant-web's AuthenticatedHeader dropdown, merchant-mobile's
// MoreMenuSheet, and admin's NavUser.
export {
    AccountMenu,
    type AccountMenuProps,
    type AccountMenuIdentity,
    type AccountMenuItemSpec,
    type AccountMenuSection,
    type AccountMenuPrimaryAction,
    type AccountMenuAccent,
    type AccountMenuTone,
} from './AccountMenu'

export { DatePicker, type DatePickerProps, type DayState } from './DatePicker'
// AUTM-1633 — the month, on its own: any date by tap or keyboard.
export { MonthCalendar, type MonthCalendarProps } from './MonthCalendar'
export { TimePicker, type TimePickerProps, type SlotState } from './TimePicker'
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
} from './DurationPicker'

// ─── AUTM-1185 — the customer-web hardening sweep's four primitives ──────
// InlineAlert: one inline "something happened"; ConfirmDialog: the pause
// before anything irreversible (graduated from merchant-mobile's
// ConfirmActionDialog); NativeSelect: a real <select> dressed as a field;
// MoneyBreakdown: lines of money, then the one that matters.
export { InlineAlert, type InlineAlertProps, type InlineAlertTone } from './InlineAlert'
export { Banner, type BannerProps } from './Banner'
export { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog'
export { NativeSelect, type NativeSelectProps } from './NativeSelect'
export { MoneyBreakdown, type MoneyBreakdownProps, type MoneyRow, type MoneyTone } from './MoneyBreakdown'
// AUTM-1856 — one link, ready to hand over (payment link, business link):
// a summary, a QR, the link, and the ways it leaves.
export {
    LinkShareSheet,
    shareHrefs,
    type LinkShareSheetProps,
    type LinkShareSheetPrimary,
    type ShareTarget,
} from './LinkShareSheet'
// AUTM-1737 — one invoice status colour system: due and overdue red, partially
// paid amber, paid lime, draft and void neutral.
export {
    InvoiceStatusBadge,
    invoiceStatusTone,
    invoiceStatusLabel,
    type InvoiceStatusBadgeProps,
    type InvoicePaymentState,
    type InvoiceStatusTone,
} from './InvoiceStatusBadge'
// ─── AUTM-1195 — pick one of a few, as cards: a real radio group ────────
export { ChoiceCard, ChoiceGroup, type ChoiceCardProps, type ChoiceGroupProps } from './ChoiceCard'
export { SwatchRadioGroup, type SwatchRadioGroupProps, type SwatchOption } from './SwatchRadioGroup'
// AUTM-1870: a car in a few taps: the picker, the make mark, the garage card (no car illustrations, Don 2026-10-15).
export {
    VehiclePicker,
    validateVehiclePicker,
    vehiclePickerStepFor,
    EMPTY_VEHICLE_PICKER_VALUE,
    VEHICLE_PICKER_MESSAGES,
    type VehiclePickerProps,
    type VehiclePickerValue,
    type VehiclePickerStep,
    type VehiclePickerField,
    type VehiclePickerErrors,
} from './VehiclePicker'
export { VehicleMakeMark, vehicleMakeMonogram, hasVehicleMakeLogo, type VehicleMakeMarkProps } from './VehicleMakeMark'
export {
    VehicleCard,
    VehicleAddCard,
    VehiclePaintDot,
    vehicleCardFacts,
    type VehicleCardProps,
    type VehicleAddCardProps,
    type VehicleCardSelectable,
} from './VehicleCard'
// ─── AUTM-1221 — graduated from customer-web (plan item U5) ──────────────
// Countdown: a deadline the server enforces, counted down and announced
// once a minute; PolicyTimeline: the tiers of a policy with the live one lit.
export { Countdown, remainingLabel, type CountdownProps } from './Countdown'
// AUTM-1819 — the time left as a solid pill: purple, amber, red; pops in once,
// breathes slowly in the last stretch. Today's requests and the booking record.
export {
    CountdownPill,
    countdownPillVariant,
    type CountdownPillProps,
    type CountdownPillTone,
} from './CountdownPill'
export {
    PolicyTimeline,
    type PolicyTimelineProps,
    type PolicyTimelineStep,
} from './PolicyTimeline'
export { DeviceFrame, type DeviceFrameProps, type DeviceKind } from './DeviceFrame'
// AUTM-1475 — web revamp foundations: the ground alive, glass that answers
// the pointer, and a reveal that needs no script.
export { BloomField, type BloomFieldProps } from './BloomField'
export { LitGroup, type LitGroupProps } from './LitGroup'
export { Reveal, type RevealProps } from './Reveal'
// AUTM-1679 — the marketing pages' motion: a pinned scroll story with its
// indicator, and a disclosure that opens and closes smoothly.
export {
    ScrollStory,
    SCROLL_STORY_STILL_QUERY,
    type ScrollStoryProps,
    type ScrollStoryStep,
    type ScrollStoryStepState,
    type ScrollStoryPhase,
} from './ScrollStory'
export { Disclosure, type DisclosureProps } from './Disclosure'
// AUTM-1739 — the page's content track: 1440px of content, a fluid gutter.
export { PageContainer, type PageContainerProps } from './PageContainer'

// SocialButton: the one social sign-in button, Google, Apple and mobile (AUTM-1513).
export { SocialButton, type SocialButtonProps, type SocialButtonProvider } from './SocialButton'

// AUTM-1781: the signed-in app shell: the top bar, the tab bar (bottom on a
// phone, inline in the top bar from md) and a detail screen's action bar.
export { AppBar, type AppBarProps } from './AppBar'
export { AppTabBar, type AppTabBarProps, type AppTabBarItem } from './AppTabBar'
export { ActionBar, type ActionBarProps, type ActionBarAction, type ActionBarControl } from './ActionBar'
// AUTM-1781: the slot where a screen shows its subject: a photo, a map, or initials on deep purple.
export { MediaFrame, type MediaFrameProps } from './MediaFrame'
// AUTM-1799 (AUTM-1797, visual first): a booking drawn, not told. A date as a
// calendar leaf and the time as a figure, the booking as a pass, place and car
// as icon rows.
export { DateTile, WhenBlock, dateTileParts, type DateTileProps, type DateTileParts, type WhenBlockProps } from './DateTile'
export { BookingPass, type BookingPassProps } from './BookingPass'
export { FactRows, type FactRowsProps, type FactRow } from './FactRows'
export { initialsOf } from '../lib/initials'
// AUTM-1787: a list row's everyday actions, a menu on a phone, discs and labels with room.
export { RowActions, type RowAction, type RowActionsProps } from './RowActions'
// AUTM-1755: a list beside its record, with a splitter that drags, keys and remembers.
export { SplitPane, type SplitPaneProps } from './SplitPane'
// AUTM-1800: a pro's public profile, as /m draws it and the portal previews it.
export { CategoryArt, categoryArtKind, type CategoryArtKind } from './CategoryArt'
export {
    MerchantProfileCover,
    MerchantProfileCoverArt,
    MerchantProfileHeader,
    type MerchantProfileCoverProps,
    type MerchantProfileCoverArtProps,
    type MerchantProfileHeaderProps,
    type MerchantProfileLayout,
    type MerchantProfileStatus,
} from './MerchantProfileHeader'
export {
    ProfileSections,
    ProfileSection,
    ProfileBio,
    type ProfileSectionsProps,
    type ProfileSectionProps,
    type ProfileBioProps,
} from './ProfileSection'
