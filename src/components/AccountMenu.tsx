'use client'

import * as React from 'react'
import { cn } from '../lib/cn'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuGroup,
    DropdownMenuLabel,
} from './DropdownMenu'
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from './Sheet'
import { Avatar, AvatarImage, AvatarFallback } from './Avatar'
import { Skeleton } from './Skeleton'

/**
 * AccountMenu, the one signed-in account control for every Autara surface.
 *
 * AUTM-1127. Four surfaces each hand-rolled this and they had drifted:
 *
 *   customer-web      Navbar.tsx -> ProfileMenu. A hand-rolled motion panel
 *                     with its own outside-click and Escape listeners.
 *                     Identity header, item rows, sign-out demoted in muted
 *                     ink, lime accent CTA at the bottom. THIS is the grammar
 *                     Don picked, so it is the one encoded here.
 *   merchant-web      AuthenticatedHeader.tsx. Already on autara-ui's
 *                     DropdownMenu with an identity header, but no promoted
 *                     action and no demotion, so every row weighs the same.
 *   merchant-mobile   MoreMenuSheet.tsx. A bottom sheet with titled sections
 *                     and no identity header at all (identity lives on /me).
 *   admin             NavBar.tsx -> NavUser. shadcn sidebar block, Lucide
 *                     icons, no autara-ui dependency.
 *
 * What they have in common is the whole component: an identity header, rows
 * that either navigate or act, one action that matters more than the others,
 * and one that must not be reached by accident. What they legitimately differ
 * on is parameterised: `presentation` (anchored dropdown vs bottom sheet),
 * `triggerVariant` (avatar only, avatar plus name, or a full sidebar block),
 * grouping (flat `items` or titled `sections`), and the accent of the
 * promoted row.
 *
 * ─── The accent row is NOT lime by default ──────────────────────────────
 *
 * Don, 2026-09-07: "okay then don't include lime, just use the same universal
 * menu through all the surfaces." Lime works on customer-web because that site
 * is purple ink on cream and lime appears nowhere else above the fold. On the
 * merchant surfaces it collides twice over: they are dark with purple as the
 * accent, and lime already means DONE and MONEY IN in the outcome palette, so
 * a lime "My bookings" row would read as a completed state. `accent` therefore
 * defaults to `act` (brand purple, the colour that ACTS) and lime is reachable
 * only by asking for it with `accent="money"`.
 *
 * ─── Icon weight: Linear, with Bold reserved for the promoted row ───────
 *
 * The written rule said "Solar Bold icons"; the shipped code says otherwise.
 * Counted across the repos on 2026-09-07:
 *
 *   merchant-web       3 Bold   13 Linear   6 LineDuotone
 *   merchant-mobile   16 Bold   66 Linear
 *   customer-web       1 Bold   39 Linear
 *
 * Roughly 90% Linear, and AUTM-1030 independently counted the same split in
 * merchant-mobile's bundle (66 Linear / 16 Bold, nothing else). So Linear is
 * the standard, not the exception, and the rule is being corrected to match
 * the product rather than the product to the rule.
 *
 * Bold is then free to mean something, and what it means is emphasis. There is
 * exactly one emphasised row in this menu, the accent CTA, and its icon sits on
 * a solid fill where a Linear stroke reads thin. Everything else is Linear.
 *
 * The destructive row deliberately does NOT get Bold, which is the part worth
 * arguing with: Don's grammar demotes sign-out into muted ink so it does not
 * compete, and a heavier glyph would pull straight against that. Weight is an
 * emphasis signal, and demoting something while emphasising it is incoherent.
 * LineDuotone is not used at all; it is a third weight in a two-weight system
 * and it exists on exactly one surface, in six places.
 *
 * Enforcement is not documentation. `withWeight` clones the icon element with
 * the weight this component decided, so a consumer passing
 * `<Logout weight="Bold" />` still renders Linear. That is precisely the mix
 * merchant-web's own account menu ships today (Logout and User Bold, Document
 * and ShieldUser Linear) and it is the drift Don noticed first.
 *
 * ─── Material ───────────────────────────────────────────────────────────
 *
 * The panel is the OPAQUE twin of the house glass surface: `--surface` fill,
 * a hairline, and the 1px inset top highlight. Not glass, on purpose. Every
 * glass contrast number in the system is measured over the gradient ground,
 * and a menu portals over whatever the consumer happens to have on the page,
 * which is not measurable. Same edge, same highlight, no blur and no gamble.
 *
 * AUTM-1792: as a dropdown it is LIFTED (`.floating-surface`: the firmer
 * `--float-edge` and the purple-tinted `--float-shadow`). Don, 2026-10-09, on
 * the merchant portal: "there's no shadow or something here when open the
 * menu, fix it". On a paper page the surface step under a paper panel is
 * zero, so the hairline alone left the menu melting into the page. As a
 * bottom sheet it keeps the flat glass edge: a sheet is anchored to the
 * screen's edge and has a scrim behind it, so it has nothing to float over.
 *
 * autara-ui inlines its own glyphs and takes no icon dependency, so the chevron
 * and the fallback person here are drawn in the Solar Linear style: 24x24
 * viewBox, ~1.8 stroke, round caps and joins.
 */

/* ─── Public types ───────────────────────────────────────────────────── */

/**
 * Fill for the promoted row, named by MEANING rather than by colour so a
 * consumer cannot pick lime by accident. `act` is brand purple and is the
 * default; `money` is lime and is opt-in.
 */
export type AccountMenuAccent = 'act' | 'money' | 'flight' | 'neutral'

/**
 * `demoted` is muted ink: present, reachable, not competing. It is the
 * treatment for sign-out and it is Don's decision, not a default.
 * `danger` is intent-error ink and is for genuinely destructive actions
 * (delete account), which sign-out is not.
 */
export type AccountMenuTone = 'default' | 'demoted' | 'danger'

export interface AccountMenuIdentity {
    /** Display name. Falls back to `secondary`'s local part, then "Account". */
    name?: string | null
    /** Email, business name, or role. Rendered muted under the name. */
    secondary?: string | null
    /** Photo. Falls back to initials, then to a person glyph. */
    avatarUrl?: string | null
    /** Override the derived initials (max two characters are rendered). */
    initials?: string | null
    /** Trailing slot on the identity header, e.g. a merchant-status Badge. */
    badge?: React.ReactNode
}

export interface AccountMenuItemSpec {
    /** Stable key. Also seeds the default `data-testid`. */
    key: string
    label: string
    /** Optional second line. Keep it short; it truncates. */
    description?: string
    /**
     * Leading glyph. The weight is set BY THIS COMPONENT, so whatever a
     * consumer passes renders at the house weight (see the header note).
     */
    icon?: React.ReactNode
    /** Renders an `<a>`. Ignored when `element` is supplied. */
    href?: string
    /** Opens in a new tab and appends the "opens in a new tab" affordance. */
    external?: boolean
    /** Fires on activation (click, Enter, Space). Closes the menu. */
    onSelect?: () => void
    /**
     * A framework link, e.g. `<Link href="/account" />` or
     * `<Link to="/settings" />`. autara-ui must never import next/link or
     * react-router, so the consumer hands its own element in and this
     * component clones the row content into it.
     */
    element?: React.ReactElement
    /** Right-hand slot: an unread count, a value, a chip. */
    trailing?: React.ReactNode
    disabled?: boolean
    tone?: AccountMenuTone
    /** Overrides the derived `data-testid`. Treat a shipped one as public API. */
    testId?: string
}

export interface AccountMenuSection {
    key: string
    /** Optional group eyebrow. Omit for an untitled group of rows. */
    title?: string
    items: AccountMenuItemSpec[]
}

export interface AccountMenuPrimaryAction extends AccountMenuItemSpec {
    /** @default 'act' (brand purple). `money` is lime and is opt-in. */
    accent?: AccountMenuAccent
}

export interface AccountMenuProps {
    identity: AccountMenuIdentity
    /** Flat convenience. Rendered as one untitled group. */
    items?: AccountMenuItemSpec[]
    /** Titled groups. Rendered after `items` when both are supplied. */
    sections?: AccountMenuSection[]
    /** The one promoted row, in a solid accent fill at the bottom. */
    primaryAction?: AccountMenuPrimaryAction
    /** Trailing action in its own groove. Defaults to `tone="demoted"`. */
    signOut?: AccountMenuItemSpec
    /**
     * `dropdown` anchors to the trigger. `sheet` opens a bottom sheet.
     * `auto` picks sheet under 768px and dropdown above it.
     * @default 'dropdown'
     */
    presentation?: 'dropdown' | 'sheet' | 'auto'
    /**
     * `inline` avatar + name + chevron (customer-web).
     * `avatar` avatar + chevron only (merchant-web).
     * `block` full-width avatar + name + secondary (admin sidebar).
     * @default 'inline'
     */
    triggerVariant?: 'inline' | 'avatar' | 'block'
    /** Replace the trigger entirely. Rendered as the Radix trigger child. */
    trigger?: React.ReactNode
    /** Accessible name for the menu and its trigger. @default 'Account menu' */
    label?: string
    /** Dropdown only; a sheet is edge-anchored. @default 'end' */
    align?: 'start' | 'center' | 'end'
    /** Dropdown only. @default 'bottom'. Admin's sidebar wants 'right'. */
    side?: 'top' | 'right' | 'bottom' | 'left'
    /** Identity and rows render as placeholders. */
    loading?: boolean
    /** Controlled open state. Leave unset for uncontrolled. */
    open?: boolean
    onOpenChange?: (open: boolean) => void
    /** Class on the trigger. */
    className?: string
    /** Class on the panel. Width and sheet clearance live here. */
    contentClassName?: string
    /**
     * Where the dropdown panel is portaled. Defaults to `document.body`, which
     * is correct for an app that stamps `data-theme` on `<html>`. Pass a
     * container when the theme is scoped to a nested element, e.g. a
     * side-by-side both-themes story. The SHEET presentation always portals to
     * body: its scrim covers the viewport, and a nested parent would clip it.
     */
    portalContainer?: HTMLElement | null
    /** Seeds every `data-testid` in the menu. @default 'account-menu' */
    testId?: string
}

/* ─── Icon weight ────────────────────────────────────────────────────── */

const HOUSE_WEIGHT = 'Linear'
const EMPHASIS_WEIGHT = 'Bold'

/**
 * Force the icon's weight, so the decision above survives contact with a
 * consumer that passes its own.
 *
 * Host elements are left alone: a raw `<svg>` has no `weight` prop and setting
 * one would land a stray attribute on the DOM. A consumer inlining its own SVG
 * owns its stroke, which is the same deal autara-ui's own glyphs take.
 */
function withWeight(icon: React.ReactNode, weight: string): React.ReactNode {
    if (!React.isValidElement(icon)) return icon
    if (typeof icon.type === 'string') return icon
    return React.cloneElement(icon as React.ReactElement<{ weight?: string }>, {
        weight,
    })
}

/* ─── Inlined Solar Linear glyphs ────────────────────────────────────── */

function ChevronDownGlyph({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    )
}

function ArrowRightGlyph({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5" />
        </svg>
    )
}

function ExternalGlyph() {
    return (
        <svg
            aria-hidden
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-[var(--text-subtle)]"
        >
            <path d="M14 5h5v5M19 5l-7 7M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4" />
        </svg>
    )
}

/** Last-resort avatar when there is neither a photo nor a usable name. */
function PersonGlyph() {
    return (
        <svg
            aria-hidden
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0" />
        </svg>
    )
}

/* ─── Shared class grammar ───────────────────────────────────────────── */

/**
 * WCAG 2.4.11. Full-strength `--accent`, never the fill grade (`#4E1BBD`
 * measures about 1:1 on a dark surface), never at partial alpha, and the
 * offset band is named because Tailwind's `--tw-ring-offset-color` falls back
 * to white, which paints a cream halo inside a dark panel.
 *
 * Rows are inset from the panel edge by at least 8px, so the 2px band plus the
 * 2px ring survives the panel's `overflow-hidden` instead of being clipped.
 */
const FOCUS_ON_SURFACE =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]'

/** The trigger sits on the page, not in the panel, so its band is the canvas. */
const FOCUS_ON_BACKGROUND =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]'

/**
 * `min-h-11` rather than a fixed height, so a wrapped label at 200% text scale
 * grows the row instead of clipping it. 44px is the floor, not the size.
 */
const ROW_BASE = cn(
    'group/row relative flex min-h-11 w-full cursor-pointer select-none items-center gap-3',
    'rounded-autara-sm px-3 py-2.5 text-left text-sm font-medium transition-colors',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    'disabled:pointer-events-none disabled:opacity-50',
    FOCUS_ON_SURFACE
)

const ROW_TONE: Record<AccountMenuTone, string> = {
    default: cn(
        'text-[var(--text-strong)]',
        'hover:bg-[var(--surface-elevated)] data-[highlighted]:bg-[var(--surface-elevated)]'
    ),
    // Muted ink at 8:1 on --surface. Demoted is a HIERARCHY signal, not a
    // contrast one, so it darkens to full ink on hover rather than staying
    // faint once the user has clearly reached for it.
    demoted: cn(
        'text-[var(--text-muted)]',
        'hover:bg-[var(--surface-elevated)] hover:text-[var(--text-strong)]',
        'data-[highlighted]:bg-[var(--surface-elevated)] data-[highlighted]:text-[var(--text-strong)]'
    ),
    danger: cn(
        'text-[var(--intent-error-text)]',
        'hover:bg-[var(--surface-elevated)] data-[highlighted]:bg-[var(--surface-elevated)]'
    ),
}

/** Solid fill, no tint and no outline. Rule 4: emphasis is a fill. */
const ACCENT_FILL: Record<AccountMenuAccent, string> = {
    act: 'bg-[var(--act-fill)] text-[var(--on-act)] hover:bg-[var(--act-fill-hover)] data-[highlighted]:bg-[var(--act-fill-hover)]',
    money: 'bg-[var(--money-fill)] text-[var(--on-money)] hover:bg-[var(--money-fill-hover)] data-[highlighted]:bg-[var(--money-fill-hover)]',
    flight: 'bg-[var(--flight-fill)] text-[var(--on-flight)] hover:bg-[var(--flight-fill-hover)] data-[highlighted]:bg-[var(--flight-fill-hover)]',
    neutral:
        'bg-[var(--neutral-fill)] text-[var(--on-neutral)] hover:bg-[var(--neutral-fill-hover)] data-[highlighted]:bg-[var(--neutral-fill-hover)]',
}

const GROOVE = 'h-px bg-[var(--border-subtle)]'

/* ─── Identity helpers ───────────────────────────────────────────────── */

/** Name, else the secondary line's local part, else "Account". */
function displayNameFor(identity: AccountMenuIdentity): string {
    const name = identity.name?.trim()
    if (name) return name
    const local = identity.secondary?.split('@')[0]?.trim()
    return local || 'Account'
}

/** Up to two initials. Returns null when there is nothing to derive from. */
function initialsFor(identity: AccountMenuIdentity): string | null {
    const explicit = identity.initials?.trim()
    if (explicit) return explicit.slice(0, 2).toUpperCase()
    if (!identity.name?.trim() && !identity.secondary?.trim()) return null
    const parts = displayNameFor(identity).split(/\s+/).filter(Boolean)
    if (parts.length === 0) return null
    const letters = (parts[0][0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')
    return letters.toUpperCase() || null
}

/* ─── Pieces ─────────────────────────────────────────────────────────── */

function IdentityAvatar({
    identity,
    size,
}: {
    identity: AccountMenuIdentity
    size: 'sm' | 'md'
}) {
    const initials = initialsFor(identity)
    return (
        <Avatar size={size} className="shrink-0">
            {identity.avatarUrl ? (
                <AvatarImage src={identity.avatarUrl} alt="" />
            ) : null}
            {/* `theme="light"` is the branch built from tokens, so it tracks
                data-theme in both directions. It is not "light mode". */}
            <AvatarFallback theme="light" className={size === 'sm' ? 'text-xs' : 'text-sm'}>
                {initials ?? <PersonGlyph />}
            </AvatarFallback>
        </Avatar>
    )
}

/**
 * Identity header. A plain block, never a menu item: it is not actionable, so
 * it must not be in the roving-focus order, and it must not take
 * DropdownMenuLabel's small muted group-title treatment either. That grammar
 * is right for a section heading and wrong for a person's name.
 */
function IdentityHeader({
    identity,
    loading,
}: {
    identity: AccountMenuIdentity
    loading?: boolean
}) {
    if (loading) {
        return (
            <div className="flex items-center gap-3 px-4 pb-3 pt-4">
                <Avatar size="md" className="shrink-0">
                    <Skeleton className="h-full w-full" label={null} />
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" label="Loading your account" />
                    <Skeleton className="h-3 w-40" label={null} />
                </div>
            </div>
        )
    }
    return (
        <div className="flex items-center gap-3 px-4 pb-3 pt-4">
            <IdentityAvatar identity={identity} size="md" />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text-strong)]">
                    {displayNameFor(identity)}
                </p>
                {identity.secondary ? (
                    <p className="truncate text-xs font-normal text-[var(--text-muted)]">
                        {identity.secondary}
                    </p>
                ) : null}
            </div>
            {identity.badge ? <div className="shrink-0">{identity.badge}</div> : null}
        </div>
    )
}

/** Icon plus labels plus trailing. Identical in both presentations. */
function RowBody({
    item,
    weight,
    iconClassName,
    trailingClassName,
}: {
    item: AccountMenuItemSpec
    weight: string
    iconClassName: string
    trailingClassName: string
}) {
    return (
        <>
            {item.icon ? (
                <span
                    aria-hidden
                    className={cn(
                        'grid h-5 w-5 shrink-0 place-items-center [&>svg]:h-5 [&>svg]:w-5',
                        iconClassName
                    )}
                >
                    {withWeight(item.icon, weight)}
                </span>
            ) : null}
            <span className="min-w-0 flex-1">
                <span className="block truncate">{item.label}</span>
                {item.description ? (
                    <span className="mt-0.5 block truncate text-xs font-normal text-[var(--text-muted)]">
                        {item.description}
                    </span>
                ) : null}
            </span>
            {item.trailing ? (
                <span className={cn('shrink-0 text-xs font-normal', trailingClassName)}>
                    {item.trailing}
                </span>
            ) : null}
            {item.external ? <ExternalGlyph /> : null}
        </>
    )
}

/** Anchor props for an item that navigates. */
function linkProps(item: AccountMenuItemSpec) {
    return item.external
        ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
        : { href: item.href }
}

/**
 * A row, in whichever host element the item asked for.
 *
 * `menu` wraps in Radix's `DropdownMenuItem`, which supplies `role="menuitem"`,
 * roving focus, typeahead and close-on-select. `plain` is a real `<button>` or
 * `<a>` inside the sheet's dialog, where Radix traps focus and Tab is the
 * expected movement.
 */
function AccountRow({
    item,
    host,
    className,
    iconClassName,
    trailingClassName = 'text-[var(--text-muted)]',
    weight,
    testId,
    onDone,
}: {
    item: AccountMenuItemSpec
    host: 'menu' | 'plain'
    className: string
    iconClassName: string
    trailingClassName?: string
    weight: string
    testId: string
    onDone: () => void
}) {
    const body = (
        <RowBody
            item={item}
            weight={weight}
            iconClassName={iconClassName}
            trailingClassName={trailingClassName}
        />
    )
    const activate = () => {
        if (item.disabled) return
        item.onSelect?.()
        onDone()
    }

    if (host === 'menu') {
        const shared = {
            className,
            disabled: item.disabled,
            'data-testid': testId,
        }
        if (item.element) {
            return (
                <DropdownMenuItem {...shared} asChild onSelect={() => item.onSelect?.()}>
                    {React.cloneElement(item.element, undefined, body)}
                </DropdownMenuItem>
            )
        }
        if (item.href) {
            return (
                <DropdownMenuItem {...shared} asChild onSelect={() => item.onSelect?.()}>
                    <a {...linkProps(item)}>{body}</a>
                </DropdownMenuItem>
            )
        }
        return (
            <DropdownMenuItem {...shared} onSelect={() => item.onSelect?.()}>
                {body}
            </DropdownMenuItem>
        )
    }

    const shared = {
        className,
        'data-testid': testId,
        onClick: activate,
        'aria-disabled': item.disabled || undefined,
    }
    if (item.element) {
        return React.cloneElement(
            item.element as React.ReactElement<Record<string, unknown>>,
            shared,
            body
        )
    }
    if (item.href) {
        return (
            <a {...shared} {...linkProps(item)}>
                {body}
            </a>
        )
    }
    return (
        <button type="button" disabled={item.disabled} {...shared}>
            {body}
        </button>
    )
}

/** Three placeholder rows while identity and destinations resolve. */
function LoadingRows() {
    return (
        <div className="space-y-1 px-2 py-2" aria-hidden>
            {[28, 36, 24].map((w, i) => (
                <div key={i} className="flex min-h-11 items-center gap-3 px-3">
                    <Skeleton className="h-5 w-5" label={null} />
                    <Skeleton className="h-3.5" style={{ width: `${w}%` }} label={null} />
                </div>
            ))}
        </div>
    )
}

/* ─── Trigger ────────────────────────────────────────────────────────── */

const TRIGGER_BASE = cn(
    'group inline-flex min-h-11 items-center rounded-autara-md text-sm font-medium',
    'text-[var(--text-strong)] transition-colors',
    'hover:bg-[var(--surface-elevated)] data-[state=open]:bg-[var(--surface-elevated)]',
    FOCUS_ON_BACKGROUND
)

const TRIGGER_SHAPE = {
    avatar: 'gap-1.5 px-1.5',
    inline: 'gap-2 py-1 pl-1.5 pr-2.5',
    block: 'w-full gap-3 px-2 py-2 text-left',
} as const

function AccountTrigger({
    identity,
    variant,
    loading,
    className,
    label,
    testId,
    ...rest
}: {
    identity: AccountMenuIdentity
    variant: 'inline' | 'avatar' | 'block'
    loading?: boolean
    className?: string
    label: string
    testId: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    const name = displayNameFor(identity)
    /**
     * WCAG 2.5.3 (label in name): when the trigger shows the name, the
     * accessible name has to contain it, so a voice-control user saying what
     * they can see actually hits the control. "Account menu" alone would not.
     */
    const accessibleName = identity.name?.trim() ? `${name}, ${label.toLowerCase()}` : label

    return (
        <button
            type="button"
            aria-label={accessibleName}
            data-testid={testId}
            className={cn(TRIGGER_BASE, TRIGGER_SHAPE[variant], className)}
            {...rest}
        >
            {loading ? (
                <Avatar size="sm" className="shrink-0">
                    <Skeleton className="h-full w-full" label={null} />
                </Avatar>
            ) : (
                <IdentityAvatar identity={identity} size="sm" />
            )}

            {variant === 'inline' ? (
                <span className="max-w-[10rem] truncate">{name}</span>
            ) : null}

            {variant === 'block' ? (
                <span className="min-w-0 flex-1">
                    <span className="block truncate">{name}</span>
                    {identity.secondary ? (
                        <span className="block truncate text-xs font-normal text-[var(--text-muted)]">
                            {identity.secondary}
                        </span>
                    ) : null}
                </span>
            ) : null}

            <ChevronDownGlyph className="shrink-0 text-[var(--text-subtle)] transition-transform group-data-[state=open]:rotate-180" />
        </button>
    )
}

/* ─── Responsive pick for presentation="auto" ────────────────────────── */

/**
 * SSR-safe: starts false so the server renders the dropdown, then corrects on
 * mount. Runtime rather than CSS because the two presentations are different
 * component trees, not two skins. Same approach as `PickerSheet`.
 */
function useIsNarrow(query = '(max-width: 767px)'): boolean {
    const [narrow, setNarrow] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return
        const mq = window.matchMedia(query)
        setNarrow(mq.matches)
        const onChange = (e: MediaQueryListEvent) => setNarrow(e.matches)
        mq.addEventListener('change', onChange)
        return () => mq.removeEventListener('change', onChange)
    }, [query])
    return narrow
}

/* ─── The component ──────────────────────────────────────────────────── */

export function AccountMenu({
    identity,
    items,
    sections,
    primaryAction,
    signOut,
    presentation = 'dropdown',
    triggerVariant = 'inline',
    trigger,
    label = 'Account menu',
    align = 'end',
    side = 'bottom',
    loading = false,
    open,
    onOpenChange,
    className,
    contentClassName,
    portalContainer,
    testId = 'account-menu',
}: AccountMenuProps) {
    const [uncontrolled, setUncontrolled] = React.useState(false)
    const isOpen = open ?? uncontrolled
    const setOpen = React.useCallback(
        (next: boolean) => {
            if (open === undefined) setUncontrolled(next)
            onOpenChange?.(next)
        },
        [open, onOpenChange]
    )
    const close = React.useCallback(() => setOpen(false), [setOpen])

    const narrow = useIsNarrow()
    const asSheet = presentation === 'sheet' || (presentation === 'auto' && narrow)

    const groupId = React.useId()

    /** `items` first, then `sections`, so the flat convenience composes. */
    const groups: AccountMenuSection[] = React.useMemo(() => {
        const flat: AccountMenuSection[] = items?.length
            ? [{ key: '__flat', items }]
            : []
        return [...flat, ...(sections ?? [])]
    }, [items, sections])

    const host = asSheet ? 'plain' : 'menu'

    function renderGroups() {
        return groups.map((group, index) => {
            const labelId = `${groupId}-${group.key}`
            const rows = group.items.map((item) => (
                <AccountRow
                    key={item.key}
                    item={item}
                    host={host}
                    weight={HOUSE_WEIGHT}
                    className={cn(ROW_BASE, ROW_TONE[item.tone ?? 'default'])}
                    iconClassName="text-[var(--text-muted)]"
                    testId={item.testId ?? `${testId}-item-${item.key}`}
                    onDone={close}
                />
            ))

            const body = group.title ? (
                <>
                    {/* Sentence-case group title (AUTM-1483): 0.75rem,
                        weight 500, no letterspacing, the ListSection title
                        treatment. In rem so it scales with the OS text size.
                        The menu host takes weight and colour from
                        DropdownMenuLabel and the sheet host sets them itself,
                        so both read alike. Linked to the group so a screen
                        reader announces "Money, group" rather than reading a
                        stray line of text before the rows. */}
                    {host === 'menu' ? (
                        <DropdownMenuLabel
                            id={labelId}
                            className="px-3 pb-1 pt-2 text-[0.75rem]"
                        >
                            {group.title}
                        </DropdownMenuLabel>
                    ) : (
                        <p
                            id={labelId}
                            className="px-3 pb-1 pt-2 text-[0.75rem] font-medium text-[var(--text-muted)]"
                        >
                            {group.title}
                        </p>
                    )}
                    {rows}
                </>
            ) : (
                rows
            )

            const groupProps = group.title
                ? { role: 'group' as const, 'aria-labelledby': labelId }
                : {}

            return (
                <React.Fragment key={group.key}>
                    {index > 0 ? <div aria-hidden className={GROOVE} /> : null}
                    {host === 'menu' ? (
                        <DropdownMenuGroup {...groupProps} className="px-2 py-2">
                            {body}
                        </DropdownMenuGroup>
                    ) : (
                        <div {...groupProps} className="px-2 py-2">
                            {body}
                        </div>
                    )}
                </React.Fragment>
            )
        })
    }

    const panel = (
        <>
            <IdentityHeader identity={identity} loading={loading} />
            <div aria-hidden className={GROOVE} />

            {loading ? <LoadingRows /> : renderGroups()}

            {signOut && !loading ? (
                <>
                    <div aria-hidden className={GROOVE} />
                    {/* Its own groove so it reads as a trailing action rather
                        than one more destination, and inset from the panel
                        edge so the focus band is not clipped. */}
                    <div className="px-2 py-2">
                        <AccountRow
                            item={{ ...signOut, tone: signOut.tone ?? 'demoted' }}
                            host={host}
                            weight={HOUSE_WEIGHT}
                            className={cn(ROW_BASE, ROW_TONE[signOut.tone ?? 'demoted'])}
                            iconClassName=""
                            testId={signOut.testId ?? `${testId}-sign-out`}
                            onDone={close}
                        />
                    </div>
                </>
            ) : null}

            {primaryAction && !loading ? (
                <>
                    <div aria-hidden className={GROOVE} />
                    <div className="p-2">
                        <AccountRow
                            item={{
                                ...primaryAction,
                                trailing: primaryAction.trailing ?? (
                                    <ArrowRightGlyph className="transition-transform group-hover/row:translate-x-0.5" />
                                ),
                            }}
                            host={host}
                            /* The one row that carries emphasis, and the only
                               place Bold is spent. */
                            weight={EMPHASIS_WEIGHT}
                            className={cn(
                                ROW_BASE,
                                'rounded-autara-md px-4 py-3',
                                ACCENT_FILL[primaryAction.accent ?? 'act']
                            )}
                            iconClassName=""
                            trailingClassName="text-current"
                            testId={primaryAction.testId ?? `${testId}-primary`}
                            onDone={close}
                        />
                    </div>
                </>
            ) : null}
        </>
    )

    /**
     * The opaque twin of the house glass material: same hairline edge, same
     * 1px inset top highlight, no blur. See the header note on why a menu does
     * not take glass.
     */
    const PANEL_MATERIAL = cn(
        'overflow-hidden bg-[var(--surface)] text-[var(--text-strong)]',
        'border border-[var(--glass-edge)] shadow-[inset_0_1px_0_var(--glass-hi)]'
    )
    /** The dropdown: the same material, lifted off the page (AUTM-1792). The
     *  edge colour and the shadow come from `.floating-surface`, which also
     *  carries the inset highlight, so neither is set here. */
    const DROPDOWN_MATERIAL = cn(
        'overflow-hidden bg-[var(--surface)] text-[var(--text-strong)]',
        'border floating-surface'
    )

    const triggerNode = trigger ?? (
        <AccountTrigger
            identity={identity}
            variant={triggerVariant}
            loading={loading}
            label={label}
            className={className}
            testId={`${testId}-trigger`}
        />
    )

    if (asSheet) {
        return (
            <>
                <Sheet open={isOpen} onOpenChange={setOpen}>
                    {/* Radix's own Trigger rather than an `onClick` cloned onto
                        the trigger node. It supplies aria-haspopup="dialog",
                        aria-expanded, data-state and focus-return, and it
                        sequences the open against the dismissable layer instead
                        of leaving that to luck. It also keeps both
                        presentations on one shape: DropdownMenuTrigger below,
                        SheetTrigger here. */}
                    <SheetTrigger asChild>{triggerNode}</SheetTrigger>
                    <SheetContent
                        side="bottom"
                        aria-describedby={undefined}
                        data-testid={`${testId}-panel`}
                        className={cn(
                            PANEL_MATERIAL,
                            'max-h-[85dvh] overflow-y-auto rounded-t-autara-xl',
                            'pb-[env(safe-area-inset-bottom)] sm:mx-auto sm:max-w-md',
                            contentClassName
                        )}
                    >
                        {/* The identity header is the visual heading, so the
                            dialog's required title is for assistive tech only.
                            Radix warns without one, and an unnamed dialog is a
                            genuine defect, not a lint nag. */}
                        <SheetTitle className="sr-only">{label}</SheetTitle>
                        {panel}
                    </SheetContent>
                </Sheet>
            </>
        )
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>{triggerNode}</DropdownMenuTrigger>
            <DropdownMenuContent
                align={align}
                side={side}
                portalContainer={portalContainer}
                data-testid={`${testId}-panel`}
                /* No `aria-label` here on purpose. Radix points the panel's
                   `aria-labelledby` at the trigger, which already resolves to
                   "<name>, account menu", and `aria-labelledby` beats
                   `aria-label`. An attribute that loses is an attribute that
                   reads as done and is not.

                   The radius is the primitive's, deliberately: this panel
                   should match every other dropdown in the library rather
                   than step up to the card rung on its own. */
                className={cn(
                    DROPDOWN_MATERIAL,
                    'w-[min(20rem,calc(100vw-1.5rem))] p-0',
                    contentClassName
                )}
            >
                {panel}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

AccountMenu.displayName = 'AccountMenu'
