'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '../lib/cn'
import { CloseButton } from './IconButton'
import { useReturnFocus } from '../lib/use-return-focus'

/**
 * Dialog — Radix dialog primitive styled for the Autara cream canvas.
 *
 * Single light treatment (a dark companion for photo/ink surfaces is
 * deferred to a future PR). Honors the Autara house rules:
 *   - `--surface` (white) fill, `--text-strong` ink text
 *   - Hairline `--border-subtle` ring instead of any drop shadow
 *   - Ink overlay at 50% opacity (no backdrop blur — flat
 *     editorial scrim)
 *   - CloseButton (AUTM-1756) at the top-right: a filled disc, not a bare cross
 *
 * The `theme` prop on `DialogContent` is preserved for source-level
 * compatibility but is currently a **no-op**.
 *
 * ─── AUTM-967: the dialog now actually animates ─────────────────────────
 *
 * It carried `data-[state=open]:animate-in data-[state=open]:zoom-in-95` and
 * friends. Those are `tailwindcss-animate` utilities and that plugin is not a
 * dependency of this package or of any of the three consumers, so the classes
 * emitted NOTHING: every dialog on merchant-mobile, merchant-web and
 * customer-web appeared and vanished on the same frame it was asked for.
 *
 * The enter and exit are `.overlay-scrim` and `.modal-panel`, defined as real
 * CSS in `utilities/animations.css` — no plugin, no consumer configuration,
 * and `prefers-reduced-motion: reduce` respected there.
 *
 * ─── AUTM-1594: `layout="responsive"` ───────────────────────────────────
 *
 * A bottom sheet below `sm` (640px) and a centred card from `sm`, with the
 * header and the action row pinned and only `DialogBody` scrolling between
 * them. merchant-web drew this five times locally (its Business address
 * dialog is the reference) because the default layout is a centred card at
 * every width, and a form taller than a phone put its title and both buttons
 * off screen with nothing scrolling.
 *
 * It is the same Radix tree at every width, so the switch is CSS, not a
 * `matchMedia` hook: no first-frame flash, nothing to hydrate, and focus trap,
 * focus return and Escape are Radix's at both sizes. Motion is
 * `.dialog-panel--responsive`: it rises on `--motion-sheet-*` below `sm` and
 * scales from 96% on `--motion-modal-*` above, transform and opacity only.
 *
 *     <Dialog open={open} onOpenChange={setOpen}>
 *         <DialogContent layout="responsive" size="lg">
 *             <DialogHeader>
 *                 <DialogTitle>Business address</DialogTitle>
 *                 <DialogDescription>Where customers find you.</DialogDescription>
 *             </DialogHeader>
 *             <DialogBody>…the form…</DialogBody>
 *             <DialogFooter>
 *                 <Button variant="quiet">Cancel</Button>
 *                 <Button>Confirm address</Button>
 *             </DialogFooter>
 *         </DialogContent>
 *     </Dialog>
 *
 * The default (`layout="centered"`) renders exactly as it did before, so
 * every existing dialog is unchanged.
 *
 * ─── AUTM-1768: focus goes back where it came from ──────────────────────
 *
 * Radix returns focus on close to `DialogTrigger` only, so a dialog opened
 * from state (a button that sets `open`) dropped keyboard focus on `<body>`
 * and the next Tab restarted at the top of the page. `DialogContent` now
 * remembers the focused element when it opens and puts focus back there when
 * Radix leaves it nowhere. A trigger, or a consumer's own `onCloseAutoFocus`
 * that calls `preventDefault()`, still wins. `SheetContent` does the same.
 */
const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close
const DialogPortal = DialogPrimitive.Portal

const DialogOverlay = React.forwardRef<
    React.ComponentRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            // AUTM-1594: the sheet's scrim, 42% ink (60% black in dark).
            'fixed inset-0 z-50 bg-[var(--scrim)]',
            // Real CSS, from utilities/animations.css. This used to be
            // `animate-in fade-in-0`, which resolved to nothing — see the
            // AUTM-967 note in the component header.
            'overlay-scrim',
            className
        )}
        {...props}
    />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

export type DialogLayout = 'centered' | 'responsive'
export type DialogSize = 'md' | 'lg'

/**
 * What the parts inside a `DialogContent` need to know about it: which layout
 * they are in, whether the body has scrolled (the header draws its hairline
 * only then, so a dialog that fits has no line under its title), and whether
 * the panel is cramped (see `CRAMPED_SHARE`).
 */
interface DialogLayoutState {
    layout: DialogLayout
    scrolled: boolean
    setScrolled: (scrolled: boolean) => void
    cramped: boolean
}

const DialogLayoutContext = React.createContext<DialogLayoutState>({
    layout: 'centered',
    scrolled: false,
    setScrolled: () => {},
    cramped: false,
})

/*
 * A pinned header and a pinned action row are right until they ARE the
 * dialog. At 200% text on a phone, or on a phone held sideways, the title,
 * its description and two stacked buttons can take most of the screen and
 * leave the body a one-line slot to scroll through. So when the two pinned
 * parts together pass this share of the viewport's height, the panel is
 * "cramped": the header lets go and scrolls away with the body, and the
 * actions stay pinned at the foot, because they are what the person came to
 * press. Measured, because CSS cannot see text scale: a media query's `rem`
 * is the browser default, never the root size the OS setting moves.
 */
const CRAMPED_SHARE = 0.5

const useIsomorphicLayoutEffect =
    typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

function useCramped(el: HTMLDivElement | null, enabled: boolean): boolean {
    const [cramped, setCramped] = React.useState(false)
    useIsomorphicLayoutEffect(() => {
        if (!enabled || !el) return
        const measure = () => {
            const head = el.querySelector<HTMLElement>('[data-dialog-header]')
            const foot = el.querySelector<HTMLElement>('[data-dialog-footer]')
            const chrome = (head?.offsetHeight ?? 0) + (foot?.offsetHeight ?? 0)
            setCramped(chrome > window.innerHeight * CRAMPED_SHARE)
        }
        measure()
        window.addEventListener('resize', measure)
        // Text scale and wrapping change the parts' heights without a window
        // resize. jsdom has no ResizeObserver; the resize listener still runs.
        let observer: ResizeObserver | undefined
        if (typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(measure)
            observer.observe(el)
            el.querySelectorAll('[data-dialog-header], [data-dialog-footer]').forEach((part) =>
                observer?.observe(part)
            )
        }
        return () => {
            window.removeEventListener('resize', measure)
            observer?.disconnect()
        }
    }, [el, enabled])
    return enabled && cramped
}

export interface DialogContentProps
    extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
    /**
     * `centered` (default): a card in the middle of the screen at every
     * width, as it has always been.
     *
     * `responsive` (AUTM-1594): a bottom sheet below `sm`, a centred card from
     * `sm`. `DialogHeader` and `DialogFooter` are pinned and `DialogBody`
     * scrolls between them. Use it for anything that can be taller than a
     * phone: a form, a map, a list.
     */
    layout?: DialogLayout
    /**
     * Card width from `sm`. `md` (default) is 32rem; `lg` is 44rem, for a
     * form beside a map. Below `sm` a responsive dialog is full width.
     */
    size?: DialogSize
    /** Accessible name of the close control. */
    closeLabel?: string
    /** @deprecated currently a no-op — dark companion deferred */
    theme?: 'dark' | 'light'
}

const CENTERED = cn(
    'fixed left-1/2 top-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-3',
    // The sheet rung, not Tailwind's 2xl — a dialog is the largest
    // surface the user sees and carries the softest corner.
    // AUTM-1594 — canvas v44 "Dialog (web)": paper, 24px radius,
    // 24px in, no outline. The scrim is the edge.
    'rounded-[1.5rem] bg-[var(--paper)] p-6 text-[var(--text-strong)]',
    // `duration-200` went with it: `duration-*` sets
    // `transition-duration`, never `animation-duration`, so it
    // was tuning a transition that did not exist either.
    'modal-panel'
)

/*
 * AUTM-1594 — the responsive layout. Below `sm` it is the library's bottom
 * sheet (Sheet side="bottom"): full width, a 24px top radius, paper, held
 * 1.5rem under the top of the dynamic viewport so the page shows above it,
 * and the home-indicator inset kept clear. From `sm` it is the card above,
 * capped 1rem off each edge of the viewport. A flex column throughout, with
 * `overflow-hidden` so the body is the only thing that scrolls.
 */
const RESPONSIVE = cn(
    'fixed inset-x-0 bottom-0 z-50 flex w-full flex-col overflow-hidden',
    'max-h-[calc(100dvh-1.5rem)] rounded-t-[1.5rem]',
    // The home-indicator inset: on the panel when nothing else holds it, and
    // on the action row when there is one (it is pinned to the foot).
    'pb-[env(safe-area-inset-bottom)] has-[[data-dialog-footer]]:pb-0',
    // Cramped (see `CRAMPED_SHARE`): the panel itself scrolls.
    'data-[cramped]:overflow-y-auto data-[cramped]:overscroll-contain',
    'bg-[var(--paper)] text-[var(--text-strong)]',
    'sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2',
    'sm:max-h-[calc(100dvh-2rem)] sm:rounded-[1.5rem]',
    'dialog-panel--responsive'
)

const SIZE: Record<DialogLayout, Record<DialogSize, string>> = {
    centered: { md: 'max-w-lg', lg: 'max-w-[44rem]' },
    responsive: { md: 'sm:max-w-lg', lg: 'sm:max-w-[44rem]' },
}

const DialogContent = React.forwardRef<
    React.ComponentRef<typeof DialogPrimitive.Content>,
    DialogContentProps
>(
    (
        {
            className,
            children,
            layout = 'centered',
            size = 'md',
            closeLabel = 'Close dialog',
            theme: _theme,
            onOpenAutoFocus,
            onCloseAutoFocus,
            ...props
        },
        ref
    ) => {
        // AUTM-1768: focus goes back to the control that opened the dialog,
        // trigger or not. See use-return-focus.ts.
        const returnFocus = useReturnFocus(onOpenAutoFocus, onCloseAutoFocus)
        const [scrolled, setScrolled] = React.useState(false)
        // State, not a ref: the panel mounts inside Radix's Portal a render
        // after this component, and an effect keyed on a ref would never see
        // it arrive.
        const [panel, setPanel] = React.useState<HTMLDivElement | null>(null)
        const setRefs = React.useCallback(
            (node: HTMLDivElement | null) => {
                setPanel(node)
                if (typeof ref === 'function') ref(node)
                else if (ref) ref.current = node
            },
            [ref]
        )
        const cramped = useCramped(panel, layout === 'responsive')
        const state = React.useMemo(
            () => ({ layout, scrolled, setScrolled, cramped }),
            [layout, scrolled, cramped]
        )
        return (
            <DialogPortal>
                <DialogOverlay />
                <DialogPrimitive.Content
                    ref={setRefs}
                    data-layout={layout}
                    data-cramped={cramped ? '' : undefined}
                    className={cn(
                        layout === 'responsive' ? RESPONSIVE : CENTERED,
                        SIZE[layout][size],
                        className
                    )}
                    {...props}
                    onOpenAutoFocus={returnFocus.onOpenAutoFocus}
                    onCloseAutoFocus={returnFocus.onCloseAutoFocus}
                >
                    <DialogLayoutContext.Provider value={state}>
                        {children}
                    </DialogLayoutContext.Provider>
                    {/* AUTM-1756: the library's one close control, a filled
                        44px disc (48px to a finger) with a 20px cross. It was a
                        14px cross on a bare 44px target that drew a band
                        circle only on hover: Don, of the Share your booking
                        link dialog, "Icon buttons are less accessible". */}
                    <DialogPrimitive.Close asChild>
                        <CloseButton
                            label={closeLabel}
                            className="absolute right-3 top-3 z-10"
                        />
                    </DialogPrimitive.Close>
                </DialogPrimitive.Content>
            </DialogPortal>
        )
    }
)
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
    const { layout, scrolled } = React.useContext(DialogLayoutContext)
    if (layout === 'responsive') {
        return (
            <div
                data-dialog-header=""
                data-scrolled={scrolled ? '' : undefined}
                className={cn(
                    // Pinned: it never shrinks, and the body scrolls under it.
                    // The FIRST child (the title) keeps clear of the 44px
                    // close disc; the description under it takes the full
                    // width, as Fresha's sheets set it.
                    'relative flex shrink-0 flex-col gap-1.5 px-5 pb-3 pt-6 text-left sm:px-6 [&>:first-child]:pr-11',
                    // The hairline appears once the body has scrolled, so the
                    // edge is only drawn when something is passing under it.
                    // Opacity on the panel token: transform and opacity only.
                    "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[var(--hairline)] after:opacity-0 after:content-['']",
                    'after:transition-opacity after:duration-[var(--motion-panel-in)] after:ease-[var(--motion-ease-out)]',
                    'data-[scrolled]:after:opacity-100',
                    className
                )}
                {...props}
            />
        )
    }
    return (
        <div
            className={cn(
                // AUTM-1756: the title and the line under it keep clear of the
                // drawn close disc (12px from the corner, 44px wide; the
                // panel's own 24px padding plus this 32px clears it).
                'flex flex-col space-y-1.5 pr-8 text-left',
                className
            )}
            {...props}
        />
    )
}
DialogHeader.displayName = 'DialogHeader'

/**
 * DialogBody — the part of a dialog that scrolls (AUTM-1594).
 *
 * In `layout="responsive"` it takes the space between the pinned header and
 * the pinned actions and is the only thing that scrolls, with
 * `overscroll-contain` so reaching its end does not scroll the page behind
 * the scrim. In the centred layout it is a plain block.
 *
 * If the body holds nothing focusable (long read-only text), pass
 * `tabIndex={0}` so a keyboard user can scroll it.
 */
const DialogBody = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, onScroll, ...props }, ref) => {
    const { layout, setScrolled, cramped } = React.useContext(DialogLayoutContext)
    if (layout !== 'responsive') {
        return <div ref={ref} className={cn('min-w-0', className)} onScroll={onScroll} {...props} />
    }
    return (
        <div
            ref={ref}
            data-dialog-body=""
            onScroll={(event) => {
                setScrolled(event.currentTarget.scrollTop > 0)
                onScroll?.(event)
            }}
            className={cn(
                'px-5 pb-6 pt-1 sm:px-6',
                // Cramped: the panel scrolls, so the body takes its full height.
                cramped ? 'flex-none' : 'min-h-0 flex-1 overflow-y-auto overscroll-contain',
                className
            )}
            {...props}
        />
    )
})
DialogBody.displayName = 'DialogBody'

const DialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
    const { layout, cramped } = React.useContext(DialogLayoutContext)
    if (layout === 'responsive') {
        return (
            <div
                data-dialog-footer=""
                className={cn(
                    // Pinned on a hairline, as Fresha, Airbnb and merchant-web's
                    // address dialog draw it. It holds the home-indicator inset
                    // (0 on a desktop browser).
                    'flex shrink-0 flex-row flex-wrap-reverse gap-2.5 border-t border-[var(--hairline)] bg-[var(--paper)] px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:justify-end sm:px-6',
                    // Cramped: the panel scrolls, and the actions stick to its foot.
                    cramped && 'sticky bottom-0 z-10',
                    // Side by side and sharing the width on a phone while both
                    // labels fit on one line each. When they do not (a long
                    // label, or 200% text) they wrap, and `wrap-reverse` puts
                    // the LAST action, the primary, on top. From `sm` they keep
                    // their own width at the right.
                    '[&>*]:min-w-fit [&>*]:flex-[1_1_0%] sm:[&>*]:flex-none',
                    className
                )}
                {...props}
            />
        )
    }
    return (
        <div
            className={cn(
                'flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end',
                className
            )}
            {...props}
        />
    )
}
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
    React.ComponentRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn(
            // Satoshi: 500 only, no semibold/bold.
            'text-[1.25rem] font-black leading-tight text-[var(--text-strong)]',
            className
        )}
        {...props}
    />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
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
DialogDescription.displayName = DialogPrimitive.Description.displayName

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
}
