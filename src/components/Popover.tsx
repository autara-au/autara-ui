'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '../lib/cn'

/**
 * Popover — an anchored floating panel for CONTENT.
 *
 * AUTM-965. Built because the merchant portal header needs a notifications
 * panel and this package had no primitive for "a panel anchored to a button".
 * It knows nothing about notifications: the consumer composes the rows, the
 * data fetching and the empty/loading/error states on top of it.
 *
 * ─── Why not DropdownMenu ───────────────────────────────────────────────
 *
 * This is the important decision in the file, so it is written down rather
 * than left to be re-litigated.
 *
 * Radix's DropdownMenu gives every child `role="menuitem"` inside a
 * `role="menu"`. A screen reader then announces a list of notifications as
 * "menu, 5 items, menu item — Booking confirmed", and menu semantics change
 * the keyboard model: arrow keys move a roving focus, Tab leaves the menu
 * entirely, and typing jumps by first letter. That is correct for "more
 * actions" and wrong for a panel the user READS, especially one whose rows
 * contain links, timestamps and their own buttons.
 *
 * Popover renders `role="dialog"` with ordinary Tab order and no roving
 * focus, which is what a content panel wants. Reach for `DropdownMenu` when
 * every child is a command; reach for this when the children are content.
 *
 * ─── The trap this component exists to avoid ────────────────────────────
 *
 * `backdrop-filter` CREATES A CONTAINING BLOCK for `position: fixed`
 * descendants. Radix positions the panel with `position: fixed`, so a
 * panel rendered *inside* a glass header resolves against the header
 * instead of the viewport and collapses. AUTM-721 is exactly this bug in
 * merchant-web, and the merchant portal header is glass, so this is the
 * live case rather than a hypothetical one.
 *
 * `PopoverContent` therefore wraps itself in `PopoverPrimitive.Portal`
 * unconditionally — you cannot accidentally render it in place. If you need
 * a different portal container, use the exported `PopoverPortal` with
 * `PopoverPrimitive.Content` directly and accept that you now own the
 * containing-block problem. `Popover.stories.tsx` has a story
 * (`InsideAGlassHeader`) that renders the real arrangement, and
 * `Popover.test.tsx` asserts the panel's parent chain reaches
 * `document.body`, because this failure is silent — the panel renders, it
 * is just in the wrong place, and only the consumer sees it.
 *
 * ─── Material ───────────────────────────────────────────────────────────
 *
 * A floating surface, so it is glass (Autara Glass rule 2): translucent
 * fill + `backdrop-filter: blur() saturate()` with the `-webkit-` prefix
 * for the Capacitor WKWebView + the 1px inset top highlight + a hairline
 * edge. It composes the `.glass-surface` class from
 * `utilities/glass.css` — the same material `GlassSurface` and
 * `Card variant="glass"` render — rather than hand-rolling a
 * `backdrop-filter`, so retuning the material stays a one-line change.
 *
 * The classes are applied directly instead of nesting a `GlassSurface`
 * under `asChild`: Radix's Content owns positioning and injects `style`,
 * `data-side` and `data-align` onto that element, and putting a Slot
 * between them adds a className-merge hazard for no gain. The material is
 * still single-sourced — this file names the classes, `glass.css` defines
 * them.
 *
 * Depth is blur, not a drop shadow. `--shadow-*` all evaluate to `none`
 * and nothing here casts one; the inset highlight is not a drop shadow.
 *
 * Radius is the shared surface rung (`--radius-autara-lg`, via
 * `.glass-surface`) — rule 3, two shapes only. No pill, no skew.
 *
 * ─── Contrast ───────────────────────────────────────────────────────────
 *
 * The panel floats over whatever the page has, including a gradient bloom.
 * It uses `--glass-fill`, so `tokens/glass-contrast.test.ts` already covers
 * it: worst cell in the matrix is `--text-subtle` at 4.60:1 (light, purple
 * bloom) and 5.02:1 (dark, aqua bloom). Use `tone="strong"` when the panel
 * carries dense body text rather than scannable rows.
 *
 * ─── Accessibility ──────────────────────────────────────────────────────
 *
 * Radix supplies: `aria-expanded` + `aria-haspopup="dialog"` +
 * `aria-controls` on the trigger, open on click, Escape to close, focus
 * into the panel on open and back to the trigger on close, and close on
 * outside pointer-down.
 *
 * This wrapper adds the accessible NAME, which Radix does not wire for
 * Popover the way it does for Dialog. `PopoverTitle` registers itself and
 * `PopoverContent` points `aria-labelledby` at it. Render a `PopoverTitle`,
 * or pass your own `aria-label` — a `role="dialog"` with no name is
 * announced as an unlabelled dialog.
 *
 * Focus is NOT trapped by default (`modal` defaults to Radix's `false`).
 * That is deliberate for an anchored panel: Tab moves from the last element
 * in the panel to the element after the trigger, which is the WAI-ARIA
 * pattern for a non-modal dialog and keeps the page usable behind it. Pass
 * `modal` on `Popover` when you want a trap plus an inert background —
 * Radix then also marks the rest of the page `aria-hidden`.
 *
 * The TRIGGER's 44x44 minimum belongs to the caller, because the trigger is
 * usually `asChild` around a `Button` or a link and forcing a size here
 * would break every text trigger. `Popover.stories.tsx` shows the icon-
 * button pattern with the size on it.
 *
 * `data-testid` passes through on every part — supply it at the call site.
 */

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverAnchor = PopoverPrimitive.Anchor
const PopoverClose = PopoverPrimitive.Close
const PopoverPortal = PopoverPrimitive.Portal

/**
 * Carries the generated title id down to `PopoverTitle`, and lets the title
 * tell the content it exists.
 *
 * Registration rather than an unconditional `aria-labelledby`: pointing at
 * an id that never renders leaves the dialog with no accessible name at
 * all, which is worse than leaving the attribute off and letting a caller's
 * `aria-label` stand.
 */
interface PopoverContentContextValue {
    titleId: string
    registerTitle: () => void
}

const PopoverContentContext =
    React.createContext<PopoverContentContextValue | null>(null)

export interface PopoverContentProps
    extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
    /**
     * `strong` raises the fill for a panel carrying dense body text rather
     * than scannable rows. Mirrors `GlassSurface`'s prop of the same name.
     */
    tone?: 'default' | 'strong'
    /**
     * Set `false` to drop the `backdrop-filter` and its per-frame GPU cost.
     * The fill, edge and highlight stay, so it still reads as the same
     * material. Worth doing when the panel holds a long or virtualised list
     * — a booking list on the iPad Pro 11" is where blur drops frames first.
     */
    blur?: boolean
    /**
     * Portal target. Defaults to `document.body`, which is the answer
     * almost every time.
     *
     * Two cases genuinely need it. A portaled panel does NOT inherit a
     * NESTED `data-theme` island — the app stamps `<html>` so this never
     * bites in production, but a side-by-side light/dark demo has to portal
     * into the themed subtree or it renders two light panels and says
     * nothing. And a panel opened from inside a `:fullscreen` element has
     * to portal inside it or the top layer hides it.
     *
     * **Whatever you pass must not carry `backdrop-filter`, `filter`,
     * `transform`, `contain` or `will-change`** — each of those creates a
     * containing block for the `position: fixed` panel and re-opens exactly
     * the bug the default portal avoids. `position: relative` is harmless.
     */
    container?: React.ComponentPropsWithoutRef<
        typeof PopoverPrimitive.Portal
    >['container']
}

const PopoverContent = React.forwardRef<
    React.ComponentRef<typeof PopoverPrimitive.Content>,
    PopoverContentProps
>(function PopoverContent(
    {
        className,
        tone = 'default',
        blur = true,
        container,
        align = 'center',
        sideOffset = 8,
        collisionPadding = 12,
        children,
        ...props
    },
    ref
) {
    const titleId = React.useId()
    const [hasTitle, setHasTitle] = React.useState(false)
    const registerTitle = React.useCallback(() => setHasTitle(true), [])
    const ctx = React.useMemo(
        () => ({ titleId, registerTitle }),
        [titleId, registerTitle]
    )

    return (
        <PopoverPrimitive.Portal container={container}>
            <PopoverPrimitive.Content
                ref={ref}
                align={align}
                sideOffset={sideOffset}
                collisionPadding={collisionPadding}
                /* Only when a PopoverTitle actually rendered — see the
                 * context comment. A caller's own aria-label / -labelledby
                 * comes through `...props` below and wins. */
                aria-labelledby={hasTitle ? titleId : undefined}
                /* Lets a device test count blurring surfaces on a page:
                 * `document.querySelectorAll('[data-glass="blur"]').length`.
                 * Same marker GlassSurface sets. */
                data-glass={blur ? 'blur' : 'flat'}
                className={cn(
                    // The shared glass material — fill, -webkit-prefixed
                    // backdrop-filter, 1px inset top highlight, hairline
                    // edge, shared surface radius. Defined once in
                    // utilities/glass.css.
                    'glass-surface',
                    tone === 'strong' && 'glass-surface--strong',
                    !blur && 'glass-surface--flat',
                    // AUTM-1792: lifted off the page. Declared after the
                    // glass rules, so its edge and shadow win here.
                    'floating-surface',
                    // Enter/exit. Real CSS — see utilities/animations.css.
                    //
                    // AUTM-967 folded this into the shared `.floating-panel`
                    // used by Tooltip, DropdownMenu, Select and PhoneInput,
                    // so there is one implementation rather than two that
                    // drift. `.popover-panel` is still defined there as an
                    // alias: it shipped in v5.1.0 inside a stylesheet
                    // consumers import wholesale, so the name has to keep
                    // working. This component gains the small side-aware
                    // nudge the shared class carries.
                    'floating-panel',
                    // AUTM-1792: pops open with a small overshoot, as menus do.
                    'floating-panel--pop',
                    'z-50 flex flex-col overflow-hidden outline-none',
                    // Never wider than the viewport, and never taller than
                    // the space Radix measured. Both matter most at 200%
                    // text scale, where an unbounded panel runs off screen
                    // and takes its scroll container with it.
                    'min-w-[12rem] max-w-[min(24rem,calc(100vw-1.5rem))]',
                    'max-h-[var(--radix-popover-content-available-height)]',
                    className
                )}
                {...props}
            >
                <PopoverContentContext.Provider value={ctx}>
                    {children}
                </PopoverContentContext.Provider>
            </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
    )
})

/**
 * Header band — title, optional description, optional trailing action.
 * Sits above the scroll area, so it stays put while the body scrolls.
 */
const PopoverHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(function PopoverHeader({ className, ...props }, ref) {
    return (
        <div
            ref={ref}
            className={cn(
                'flex shrink-0 items-start justify-between gap-3 border-b border-[var(--glass-edge)] px-4 py-3',
                className
            )}
            {...props}
        />
    )
})

/**
 * The panel's accessible name. Registers itself with `PopoverContent`,
 * which then points `aria-labelledby` here.
 *
 * Not a heading element by default: a popover title is rarely a real
 * document-outline heading, and injecting an `<h3>` into an arbitrary page
 * breaks the hierarchy rule. Pass `asChild` with your own heading when it
 * genuinely is one.
 */
const PopoverTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(function PopoverTitle({ className, id, ...props }, ref) {
    const ctx = React.useContext(PopoverContentContext)
    const register = ctx?.registerTitle
    React.useEffect(() => {
        register?.()
    }, [register])

    return (
        <p
            ref={ref}
            // A caller-supplied id wins; otherwise the one Content is
            // already pointing at.
            id={id ?? ctx?.titleId}
            className={cn(
                // Satoshi 500 — never 600.
                'text-sm font-medium leading-tight text-[var(--text-strong)]',
                className
            )}
            {...props}
        />
    )
})

const PopoverDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(function PopoverDescription({ className, ...props }, ref) {
    return (
        <p
            ref={ref}
            className={cn(
                'text-xs leading-relaxed text-[var(--text-muted)]',
                className
            )}
            {...props}
        />
    )
})

export interface PopoverBodyProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Scroll the body rather than growing the panel. On by default — a
     * panel that grows without bound is the thing `max-h` on the content
     * exists to prevent.
     *
     * If the body holds non-focusable prose, also pass `tabIndex={0}` and
     * an `aria-label`: a scroll container with nothing focusable inside it
     * cannot be reached by keyboard otherwise. Rows that are links or
     * buttons need neither.
     */
    scrollable?: boolean
}

const PopoverBody = React.forwardRef<HTMLDivElement, PopoverBodyProps>(
    function PopoverBody({ className, scrollable = true, ...props }, ref) {
        return (
            <div
                ref={ref}
                className={cn(
                    'min-h-0 flex-1',
                    // `overscroll-contain` stops the page scrolling once the
                    // panel hits its end — the panel is over the page, so
                    // chaining reads as the page moving underneath it.
                    scrollable && 'overflow-y-auto overscroll-contain',
                    className
                )}
                {...props}
            />
        )
    }
)

/**
 * Footer band — the "see everything" route out of the panel, usually.
 * Outside the scroll area on purpose: the way out should not require
 * scrolling to the bottom of a list to find.
 */
const PopoverFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(function PopoverFooter({ className, ...props }, ref) {
    return (
        <div
            ref={ref}
            className={cn(
                'flex shrink-0 items-center justify-between gap-2 border-t border-[var(--glass-edge)] px-4 py-2.5',
                className
            )}
            {...props}
        />
    )
})

/** Hairline rule between rows inside a `PopoverBody`. */
const PopoverSeparator = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(function PopoverSeparator({ className, ...props }, ref) {
    return (
        <div
            ref={ref}
            role="separator"
            className={cn('h-px bg-[var(--glass-edge)]', className)}
            {...props}
        />
    )
})

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
}
