'use client'

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '../lib/cn'

/**
 * DropdownMenu — Radix dropdown primitive in the Autara cream-canvas
 * grammar. Used for kebab menus on table rows, context menus on
 * cards, and any "more actions" trigger.
 *
 * - **Content / SubContent**: portaled, `--surface` fill, no backdrop
 *   blur, lifted off the page by `.floating-surface` (a `--float-edge`
 *   hairline and the purple-tinted `--float-shadow`, AUTM-1792: a menu
 *   over paper with only a 0.08 hairline melted into the page). Pops open
 *   (`.floating-panel--pop`: 92% and 6px toward the trigger, a small
 *   overshoot, 300ms) and closes faster than it opened.
 * - **Item**: ink text by default; hover/keyboard focus tints to
 *   `--surface-elevated`. Destructive items use
 *   `data-destructive` (caller adds `className="text-[var(--color-autara-error)]"`).
 * - **Label**: sentence-case group title, 0.75rem at weight 500 in
 *   `--text-muted` with no letterspacing (matches SelectLabel and the
 *   ListSection title; AUTM-1483).
 * - **Separator**: hairline `--border-subtle`.
 * - **SubTrigger**: Solar Bold chevron-right, rotates on data state.
 */
const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
const DropdownMenuSub = DropdownMenuPrimitive.Sub

// Shared surface for Content and SubContent.
//
// AUTM-967: the four lines that used to follow the surface classes were
// `animate-in` / `zoom-in-95` / `slide-in-from-*` — `tailwindcss-animate`
// utilities, and that plugin is not a dependency of this package or of any
// consumer, so they emitted nothing and every menu appeared instantly.
// `.floating-panel` is the real CSS, in `utilities/animations.css`.
//
// AUTM-1792: `floating-surface` is the lift (edge colour and shadow, in
// utilities/glass.css), so this list carries the border WIDTH only.
const SURFACE = cn(
    'z-50 min-w-[10rem] overflow-hidden rounded-xl border bg-[var(--surface)] p-1 text-[var(--text-strong)]',
    'floating-surface floating-panel floating-panel--pop'
)

// Shared item grammar for Item and SubTrigger.
//
// AUTM-1594: `min-h-11`. A plain row was `py-2` around a 20px line, 36px to
// the finger, under the 44px floor on the control a menu exists to offer. A
// MINIMUM height, so a row that wraps or meets 200% text grows rather than
// clips, and `py-2` still pads it when it does.
const ITEM = cn(
    'relative flex min-h-11 w-full cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-strong)] outline-none transition-colors',
    'data-[highlighted]:bg-[var(--surface-elevated)]',
    'data-[state=open]:bg-[var(--surface-elevated)]',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
)

export interface DropdownMenuContentProps
    extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> {
    /**
     * Where the panel is portaled. Defaults to `document.body`, which is right
     * for an app that stamps `data-theme` on `<html>`.
     *
     * AUTM-1127 added it for the case where body is the WRONG parent: a
     * side-by-side both-themes story scopes `data-theme` to a nested element,
     * and a panel portaled to body inherits the page theme instead, so the two
     * panes render identically and the story looks correct while proving
     * nothing. Same shape as the AUTM-948 bug, one level up.
     *
     * Additive and defaulted, so every existing call site is unchanged.
     */
    portalContainer?: HTMLElement | null
}

const DropdownMenuContent = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
    DropdownMenuContentProps
>(({ className, sideOffset = 6, portalContainer, ...props }, ref) => (
    <DropdownMenuPrimitive.Portal container={portalContainer ?? undefined}>
        <DropdownMenuPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(SURFACE, className)}
            {...props}
        />
    </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
        /** Add left padding so this row aligns with sibling items that carry an icon. */
        inset?: boolean
    }
>(({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
        ref={ref}
        className={cn(ITEM, inset && 'pl-9', className)}
        {...props}
    />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuLabel = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
        inset?: boolean
    }
>(({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Label
        ref={ref}
        className={cn(
            // AUTM-1483: sentence-case group title, matching SelectLabel and
            // the ListSection title. Rendered as written, in rem so it scales.
            'px-3 pb-1 pt-2 text-[0.75rem] font-medium text-[var(--text-muted)]',
            inset && 'pl-9',
            className
        )}
        {...props}
    />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Separator
        ref={ref}
        className={cn(
            'mx-2 my-1 h-px bg-[var(--border-subtle)]',
            className
        )}
        {...props}
    />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuSubTrigger = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.SubTrigger>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
        inset?: boolean
    }
>(({ className, inset, children, ...props }, ref) => (
    <DropdownMenuPrimitive.SubTrigger
        ref={ref}
        className={cn(ITEM, inset && 'pl-9', className)}
        {...props}
    >
        <span className="min-w-0 flex-1 truncate">{children}</span>
        <svg
            aria-hidden
            viewBox="0 0 24 24"
            width="14"
            height="14"
            className="shrink-0 text-[var(--text-subtle)]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9 6l6 6-6 6" />
        </svg>
    </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.SubContent>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, sideOffset = 4, ...props }, ref) => (
    <DropdownMenuPrimitive.SubContent
        ref={ref}
        sideOffset={sideOffset}
        className={cn(SURFACE, className)}
        {...props}
    />
))
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

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
}
