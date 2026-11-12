'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { cn } from '../lib/cn'

/**
 * Select — Radix select primitive in the Autara cream-canvas grammar.
 *
 * - **Trigger**: 44 high, hairline `--border-subtle`, `--surface` fill,
 *   ink text, Solar Bold chevron. 4 px brand-purple halo on focus —
 *   same focus grammar as `Input` so triggers and inputs read as one
 *   field family.
 * - **Content**: portaled, hairline edge, no drop shadow, no backdrop
 *   blur (Autara house rule).
 * - **Item**: muted text → ink on hover/focus; checked item carries a
 *   brand-purple tint + Solar Bold check on the right.
 * - **Label / Separator**: sentence-case group title (0.75rem, weight
 *   500, `--text-muted`, no letterspacing; AUTM-1483) / `--border-subtle`
 *   hairline.
 *
 * The `theme` prop on Trigger and Content is preserved for source-
 * level compatibility with merchant-web's local Select wrapper, but
 * is currently a **no-op** — only the light treatment ships. A dark-
 * surface companion is deferred.
 */
const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const ChevronIcon: React.FC = () => (
    <svg
        aria-hidden
        viewBox="0 0 24 24"
        width="14"
        height="14"
        className="text-[var(--text-subtle)]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M6 9l6 6 6-6" />
    </svg>
)

const CheckIcon: React.FC = () => (
    <svg
        aria-hidden
        viewBox="0 0 24 24"
        width="14"
        height="14"
        className="text-[var(--color-autara-purple)]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
)

const SelectTrigger = React.forwardRef<
    React.ComponentRef<typeof SelectPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
        /** @deprecated currently a no-op — dark companion deferred */
        theme?: 'dark' | 'light'
    }
>(({ className, children, theme: _theme, ...props }, ref) => (
    <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
            // AUTM-1594: the sheet's field (and PickerTrigger's look) — 52px,
            // 14px, the field edge on paper; focus or open is a 2px accent
            // ring with no halo; an error is the danger edge.
            'flex min-h-13 w-full items-center justify-between gap-2 rounded-autara-md border border-[var(--field-edge)] bg-[var(--paper)] px-4 text-[1.0625rem] text-[var(--text-strong)] outline-none transition-colors',
            'placeholder:text-[var(--text-subtle)]',
            'hover:border-[var(--text-muted)]',
            'data-[placeholder]:text-[var(--text-subtle)]',
            'focus-visible:border-[var(--accent)] focus-visible:shadow-[inset_0_0_0_1px_var(--accent)]',
            'data-[state=open]:border-[var(--accent)] data-[state=open]:shadow-[inset_0_0_0_1px_var(--accent)]',
            'aria-invalid:border-[var(--danger)] aria-invalid:shadow-[inset_0_0_0_1px_var(--danger)]',
            'disabled:cursor-not-allowed disabled:border-[var(--hairline)] disabled:text-[var(--text-subtle)] disabled:opacity-60',
            /*
              AUTM-418 — single-line truncation via `truncate`, NOT `line-clamp-1`.

              `line-clamp-1` compiles to `display:-webkit-box; -webkit-box-orient:
              vertical; -webkit-line-clamp:1`. Radix mirrors the selected item's
              children into this span, so any consumer whose option is an icon +
              label row (e.g. a phone country picker: flag + "+61") ends up with a
              flex child inside a -webkit-box. That context mis-measures the child
              and ellipsises content that easily fits — the country picker rendered
              as "+..." instead of "+61".

              `truncate` (overflow-hidden + text-ellipsis + whitespace-nowrap) gives
              the same one-line behaviour for long text labels, but leaves `display`
              alone so icon+label rows measure normally.

              This bit twice: AUTM-317 patched the SelectItem side and AUTM-418 the
              trigger, both downstream in merchant-web. Fixed here so consumers
              don't keep re-patching it.
            */
            '[&>span]:truncate',
            className
        )}
        {...props}
    >
        {children}
        <SelectPrimitive.Icon asChild>
            <ChevronIcon />
        </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<
    React.ComponentRef<typeof SelectPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
        /** @deprecated currently a no-op — dark companion deferred */
        theme?: 'dark' | 'light'
    }
>(({ className, children, position = 'popper', theme: _theme, ...props }, ref) => (
    <SelectPrimitive.Portal>
        <SelectPrimitive.Content
            ref={ref}
            className={cn(
                // AUTM-1792: lifted off the page like every floating list.
                'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-xl border bg-[var(--surface)] text-[var(--text-strong)]',
                'floating-surface floating-panel--pop',
                // AUTM-967 — the four dead `animate-in` / `slide-in-from-*`
                // lines that used to sit here emitted nothing. Real CSS now.
                'floating-panel',
                // The popper nudge stays: Tailwind v4 compiles `translate-*`
                // to the standalone `translate:` property, so it composes
                // with the keyframes' `transform:` instead of fighting it.
                position === 'popper' &&
                    'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
                className
            )}
            position={position}
            sideOffset={6}
            {...props}
        >
            <SelectPrimitive.Viewport
                className={cn(
                    'p-1',
                    position === 'popper' &&
                        'w-full min-w-[var(--radix-select-trigger-width)]'
                )}
            >
                {children}
            </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
    React.ComponentRef<typeof SelectPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.Label
        ref={ref}
        className={cn(
            // AUTM-1483: sentence-case group title, matching DropdownMenuLabel
            // and the ListSection title. Rendered as written, in rem.
            'px-3 pb-1 pt-2 text-[0.75rem] font-medium text-[var(--text-muted)]',
            className
        )}
        {...props}
    />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
    React.ComponentRef<typeof SelectPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
        ref={ref}
        className={cn(
            'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-strong)] outline-none transition-colors',
            'data-[highlighted]:bg-[var(--surface-elevated)]',
            'data-[state=checked]:bg-[rgba(78,27,189,0.06)]',
            'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            className
        )}
        {...props}
    >
        <SelectPrimitive.ItemText asChild>
            <span className="min-w-0 flex-1 truncate">{children}</span>
        </SelectPrimitive.ItemText>
        <SelectPrimitive.ItemIndicator className="shrink-0">
            <CheckIcon />
        </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
    React.ComponentRef<typeof SelectPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.Separator
        ref={ref}
        className={cn(
            'mx-2 my-1 h-px bg-[var(--border-subtle)]',
            className
        )}
        {...props}
    />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
}
