export { GradientBar } from './GradientBar'
export { Button, buttonVariants, type ButtonProps } from './Button'
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
    DialogFooter,
    DialogTitle,
    DialogDescription,
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

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './Accordion'
export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs'

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

export { ToastProvider, useToast, toast, type Toast, type ToastType, type ToastPosition, type ToastVariant } from './Toast'

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
export { RatingStars, type RatingStarsProps } from './RatingStars'
export { EmptyState, type EmptyStateProps } from './EmptyState'
export { LockedFeature, type LockedFeatureProps } from './LockedFeature'
export { MerchantCard, type MerchantCardProps, type MerchantBadge, type MerchantMode } from './MerchantCard'
export { SectionHeading, type SectionHeadingProps } from './SectionHeading'
export { CarouselHeader, type CarouselHeaderProps } from './CarouselHeader'
export { ServiceCard, type ServiceCardProps } from './ServiceCard'
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
export { MessageThread, type MessageThreadProps, type MessageItem } from './MessageThread'

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
export { Logo, type LogoProps } from './Logo'
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
export { TimePicker, type TimePickerProps, type SlotState } from './TimePicker'

// ─── AUTM-1185 — the customer-web hardening sweep's four primitives ──────
// InlineAlert: one inline "something happened"; ConfirmDialog: the pause
// before anything irreversible (graduated from merchant-mobile's
// ConfirmActionDialog); NativeSelect: a real <select> dressed as a field;
// MoneyBreakdown: lines of money, then the one that matters.
export { InlineAlert, type InlineAlertProps, type InlineAlertTone } from './InlineAlert'
export { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog'
export { NativeSelect, type NativeSelectProps } from './NativeSelect'
export { MoneyBreakdown, type MoneyBreakdownProps, type MoneyRow } from './MoneyBreakdown'
// ─── AUTM-1195 — pick one of a few, as cards: a real radio group ────────
export { ChoiceCard, ChoiceGroup, type ChoiceCardProps, type ChoiceGroupProps } from './ChoiceCard'
// ─── AUTM-1221 — graduated from customer-web (plan item U5) ──────────────
// Countdown: a deadline the server enforces, counted down and announced
// once a minute; PolicyTimeline: the tiers of a policy with the live one lit.
export { Countdown, remainingLabel, type CountdownProps } from './Countdown'
export {
    PolicyTimeline,
    type PolicyTimelineProps,
    type PolicyTimelineStep,
} from './PolicyTimeline'
export { DeviceFrame, type DeviceFrameProps, type DeviceKind } from './DeviceFrame'
