'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/cn'
import { CloseButton } from './IconButton'
import { useReturnFocus } from '../lib/use-return-focus'

/**
 * Sheet — Radix dialog primitive as an edge-anchored drawer.
 *
 * Same grammar as `Dialog`: `--surface` fill, `--text-strong` ink,
 * `--border-subtle` hairline edge — no drop shadow, no backdrop blur.
 * `side` picks the anchor, and the entrance slides from that edge.
 *
 * ─── AUTM-967: the four entrance animations were not real ───────────────
 *
 * "The four entrance animations match the anchor direction" is what this
 * comment used to say, and it was describing `slide-in-from-left` and its
 * siblings — `tailwindcss-animate` utilities, and that plugin is not a
 * dependency here or in any consumer. Every sheet in the product appeared
 * fully-formed at its edge with no travel at all.
 *
 * A sheet is the case where that costs the most: the slide IS the
 * affordance. It says which edge the panel came from and therefore where
 * dismissing it will send it, and a drawer that materialises reads as a
 * different, heavier kind of surface than one that slides.
 *
 * `.sheet-panel` plus a `--side` modifier, real CSS in
 * `utilities/animations.css`, reduced motion respected there.
 *
 * Dark companion (for sheets over photo / ink contexts) deferred to a
 * future PR.
 *
 * AUTM-1768: closing a sheet returns keyboard focus to the control that
 * opened it, with or without a `SheetTrigger` (see `Dialog` and
 * `lib/use-return-focus.ts`).
 */
const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close
const SheetPortal = DialogPrimitive.Portal

const SheetOverlay = React.forwardRef<
    React.ComponentRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            'fixed inset-0 z-50 bg-[var(--scrim)]',
            'overlay-scrim',
            className
        )}
        {...props}
    />
))
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName

const sheetVariants = cva(
    cn(
        // AUTM-1594 — canvas v44 "Bottom sheet": paper; the bottom sheet takes
        // a 24px top radius and a grabber, and no edges anywhere.
        'fixed z-50 flex flex-col bg-[var(--paper)] text-[var(--text-strong)]',
        // `transition ease-in-out` and the two `duration-*` classes went with
        // the dead animation. `duration-*` sets `transition-duration`, never
        // `animation-duration`, and `transition: all` on a full-height panel
        // is a per-property cost for a transition nothing was triggering.
        // Timing now lives with the keyframes.
        'sheet-panel'
    ),
    {
        variants: {
            side: {
                // Top-edge-anchored sides (top is full-width; left/right are
                // full-height) butt against the device status bar, so their
                // in-flow content (SheetHeader) clears the safe-area inset.
                // `env(safe-area-inset-top)` is 0 on the web — harmless there.
                // A bottom sheet's top is mid-screen, so it needs no inset.
                top:
                    'inset-x-0 top-0 rounded-b-[1.5rem] pt-[env(safe-area-inset-top)] ' +
                    'sheet-panel--top',
                bottom:
                    'inset-x-0 bottom-0 rounded-t-[1.5rem] pt-2.5 ' +
                    'sheet-panel--bottom',
                left:
                    'inset-y-0 left-0 h-full w-3/4 sm:max-w-sm pt-[env(safe-area-inset-top)] ' +
                    'sheet-panel--left',
                right:
                    'inset-y-0 right-0 h-full w-3/4 sm:max-w-sm pt-[env(safe-area-inset-top)] ' +
                    'sheet-panel--right',
            },
        },
        defaultVariants: {
            side: 'right',
        },
    }
)

interface SheetContentProps
    extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
        VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
    React.ComponentRef<typeof DialogPrimitive.Content>,
    SheetContentProps
>(({ side = 'right', className, children, onOpenAutoFocus, onCloseAutoFocus, ...props }, ref) => {
    // AUTM-1768: focus goes back to the control that opened the sheet,
    // trigger or not. See use-return-focus.ts.
    const returnFocus = useReturnFocus(onOpenAutoFocus, onCloseAutoFocus)
    // The close button is absolutely positioned, so the container's
    // `pt-[env(safe-area-inset-top)]` doesn't move it — it carries its own
    // inset. A bottom sheet sits mid-screen and keeps the plain top-4.
    const closeTop =
        side === 'bottom'
            ? 'top-3'
            : 'top-[calc(env(safe-area-inset-top)+12px)]'
    return (
        <SheetPortal>
            <SheetOverlay />
            <DialogPrimitive.Content
                ref={ref}
                className={cn(sheetVariants({ side }), className)}
                {...props}
                onOpenAutoFocus={returnFocus.onOpenAutoFocus}
                onCloseAutoFocus={returnFocus.onCloseAutoFocus}
            >
                {side === 'bottom' ? (
                    // The sheet's grabber: 40 x 5, a hairline pill. Decoration;
                    // the close button and Escape are how it is dismissed.
                    <span
                        aria-hidden="true"
                        className="mx-auto block h-[5px] w-10 shrink-0 rounded-full bg-[var(--hairline)]"
                    />
                ) : null}
                {/* AUTM-1756 (Don: "this close button is very small in every
                    dialog"; "Icon buttons are less accessible"): the library's
                    one close control, a filled 44px disc (48px to a finger)
                    with a 20px cross. It was a 28px disc drawn only on hover
                    around a 14px cross, with an unpainted 44px hit area. */}
                <DialogPrimitive.Close asChild>
                    <CloseButton label="Close drawer" className={cn('absolute right-3 z-10', closeTop)} />
                </DialogPrimitive.Close>
                {children}
            </DialogPrimitive.Content>
        </SheetPortal>
    )
})
SheetContent.displayName = DialogPrimitive.Content.displayName

const SheetHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            // AUTM-1756: the title keeps clear of the drawn close disc.
            'flex flex-col gap-3 px-5 pb-3 pt-3 text-left [&>:first-child]:pr-12',
            className
        )}
        {...props}
    />
)
SheetHeader.displayName = 'SheetHeader'

const SheetFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            'mt-auto flex flex-col-reverse gap-2.5 px-5 pb-6 pt-3 sm:flex-row sm:justify-end',
            className
        )}
        {...props}
    />
)
SheetFooter.displayName = 'SheetFooter'

const SheetTitle = React.forwardRef<
    React.ComponentRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn(
            'text-[1.25rem] font-black leading-tight text-[var(--text-strong)]',
            className
        )}
        {...props}
    />
))
SheetTitle.displayName = DialogPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
    React.ComponentRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn(
            'text-[0.9375rem] leading-normal text-[var(--text-muted)]',
            className
        )}
        {...props}
    />
))
SheetDescription.displayName = DialogPrimitive.Description.displayName

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
}
