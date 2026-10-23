'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '../lib/cn'

/**
 * Tooltip — Radix tooltip primitive in the Autara Torph ink aesthetic.
 *
 * - `#0E0A1A` ink background, white text, hairline `white/10` ring.
 *   Matches the Toast capsule grammar so floating UI reads as one
 *   family.
 * - **No drop shadow** — the dark/light contrast against the cream
 *   canvas does the depth work (Autara house rule).
 * - AUTM-967: it did NOT keep "the existing Radix slide-in / zoom-in
 *   animations", which is what this line used to claim. Those were
 *   `tailwindcss-animate` utilities and the plugin is not a dependency of
 *   this package or of any consumer, so a tooltip snapped into existence.
 *   That is the most repeated micro-interaction in the product and the one
 *   where an instant appearance reads most like a glitch. It is now
 *   `.floating-panel` — real CSS in `utilities/animations.css`, side-aware
 *   off `data-side`, origin off Radix's own transform-origin variable,
 *   reduced motion respected.
 *
 * The `theme` prop is preserved for source-level compatibility but is
 * currently a **no-op** — only the ink variant ships. A light /
 * cream-canvas variant for inline help text on form fields is a
 * deferred follow-up.
 */
const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
    React.ComponentRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
        /** @deprecated currently a no-op — light companion deferred */
        theme?: 'dark' | 'light'
    }
>(({ className, sideOffset = 6, theme: _theme, ...props }, ref) => (
    <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
            // Capsule grammar — matches the Toast ink pill so floating
            // UI reads as one family.
            'z-50 max-w-xs rounded-md bg-[var(--surface-inverse)] px-3 py-1.5 text-[0.75rem] font-medium text-[var(--text-on-inverse)] ring-1 ring-inset ring-[var(--border-on-inverse)]',
            // AUTM-1792: the lift without an edge change; composes with the
            // inset ring through Tailwind's shadow variables.
            'shadow-float',
            // Enter/exit — side-aware, and the rule matches Tooltip's
            // `delayed-open` / `instant-open` states, not just `open`.
            'floating-panel',
            className
        )}
        {...props}
    />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
