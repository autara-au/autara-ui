// Components
export {
    GradientBar,
    Button, buttonVariants, type ButtonProps,
    Input, inputVariants, type InputProps,
    PhoneInput, DEFAULT_COUNTRIES, findCountryByIso, type PhoneInputProps, type PhoneCountry,
    Textarea, textareaVariants, type TextareaProps,
    Label, labelVariants, type LabelProps,
    FormField, type FormFieldProps,
    FieldStack, FieldStackRow, FieldStackField, type FieldStackFieldProps,
    // AUTM-948 — Autara Glass foundation
    GlassSurface, GradientGround, type GlassSurfaceProps, type GradientGroundProps,
    Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants, type CardProps,
    BackButton, type BackButtonProps,
    Badge, badgeVariants, type BadgeProps,
    Separator,
    Skeleton, type SkeletonProps,
    Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
    Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription,
    PickerSheet, type PickerOption, type PickerRowRender, type PickerSheetProps,
    Accordion, AccordionItem, AccordionTrigger, AccordionContent,
    Tabs, TabsList, TabsTrigger, TabsContent,
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, type DropdownMenuContentProps,
    // AUTM-965 — anchored floating panel for CONTENT (DropdownMenu gives its
    // children `menuitem` semantics, which a list of content must not have).
    Popover, PopoverTrigger, PopoverAnchor, PopoverClose, PopoverPortal, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription, PopoverBody, PopoverFooter, PopoverSeparator, type PopoverContentProps, type PopoverBodyProps,
    navigationMenuTriggerStyle, NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuContent, NavigationMenuTrigger, NavigationMenuLink, NavigationMenuIndicator, NavigationMenuViewport,
    ScrollReveal, type ScrollRevealProps,
    FadeIn, FadeInView, ScaleIn, StaggerContainer, StaggerItem,
    // New components
    ToastProvider, useToast, toast, type Toast, type ToastType, type ToastPosition, type ToastVariant,
    Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator,
    Switch,
    Checkbox,
    RadioGroup, RadioGroupItem,
    Avatar, AvatarImage, AvatarFallback, avatarVariants,
    Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
    Progress,
    // AUTM-1046 — indeterminate busy indicator for work in progress.
    Spinner, type SpinnerProps, type SpinnerSize, type SpinnerTone,
    MultiSelect, type MultiSelectOption, type MultiSelectProps,
    Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption,
    // v1.1.0 — promoted from autara-customer-web
    BrandButton, brandButtonVariants, type BrandButtonProps,
    MetaChip, type MetaChipProps,
    OtpInput, type OtpInputProps,
    RatingStars, type RatingStarsProps,
    EmptyState, type EmptyStateProps,
    LockedFeature, type LockedFeatureProps,
    MerchantCard, type MerchantCardProps, type MerchantBadge, type MerchantMode,
    SectionHeading, type SectionHeadingProps,
    CarouselHeader, type CarouselHeaderProps,
    ServiceCard, type ServiceCardProps,
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
    ModeChip, type ModeChipProps, type BookingMode,
    Logo, type LogoProps,
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
    MessageThread, type MessageThreadProps, type MessageItem,
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
    ConfirmDialog, type ConfirmDialogProps,
    NativeSelect, type NativeSelectProps,
    MoneyBreakdown, type MoneyBreakdownProps, type MoneyRow,
    // AUTM-1221 — graduated from customer-web (plan item U5)
    Countdown, remainingLabel, type CountdownProps,
    PolicyTimeline, type PolicyTimelineProps, type PolicyTimelineStep,
    // AUTM-1195 — pick one of a few, as cards
    ChoiceCard, ChoiceGroup, type ChoiceCardProps, type ChoiceGroupProps,
} from './components'

// Utilities
export { cn } from './lib/cn'
/* AUTM-1018 — the offset a `position: fixed` element uses to clear EVERY
 * bottom-anchored banner in the library at once. Clearing only one of them
 * still leaves the element buried when the other is up. */
export { BOTTOM_CHROME_OFFSET } from './lib/reserved-bottom-space'

export { DatePicker, type DatePickerProps, type DayState } from './components/DatePicker'
export { TimePicker, type TimePickerProps, type SlotState } from './components/TimePicker'
export {
    addDays,
    daysBetween,
    timeSlots,
    timeLabel,
    longDateLabel,
    isISODate,
    isISOTime,
} from './lib/calendar'
