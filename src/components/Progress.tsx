'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '../lib/cn'

/**
 * Progress — a determinate bar: a track plus a filled indicator.
 *
 * AUTM-975 — `theme` defaulted to `'dark'`, and the dark branch paints the
 * track `bg-white/[0.1]`. On the cream canvas that is 10% white over
 * near-white: the track disappeared entirely and the bar read as a floating
 * purple stub with no "out of what". The default is now `'light'`, which is
 * the branch built from semantic tokens and therefore the one that tracks the
 * theme in both directions; `'dark'` remains the static ink opt-in for a
 * photo or marketing surface.
 *
 * The prop's value names are published API and are kept as they are — see the
 * same note on `Table` and `Avatar`, which had the identical parameter-default
 * shape and are guarded together by `default-variant.test.ts`.
 *
 * Known and NOT fixed here: `--surface-elevated` is only ~1.06:1 from
 * `--surface` in light, so the track is faint on a white card even after the
 * flip. That is a token-ladder question, not a default-selection one.
 */
const Progress = React.forwardRef<
    React.ComponentRef<typeof ProgressPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
        theme?: 'dark' | 'light'
        indicatorClassName?: string
    }
>(({ className, value, theme = 'light', indicatorClassName, ...props }, ref) => {
    const isDark = theme === 'dark'
    return (
        <ProgressPrimitive.Root
            ref={ref}
            className={cn(
                // AUTM-1594 — canvas v44 "Checklist": a 6px band track.
                'relative h-1.5 w-full overflow-hidden rounded-full',
                // `dark` here means "on an ink/marketing surface", not the
                // app theme — the light branch tracks the themed ladder.
                isDark ? 'bg-white/[0.1]' : 'bg-[var(--band)]',
                className
            )}
            {...props}
        >
            <ProgressPrimitive.Indicator
                className={cn(
                    'h-full w-full flex-1 rounded-full bg-[var(--brand)] transition-transform duration-500 ease-out',
                    indicatorClassName
                )}
                style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
            />
        </ProgressPrimitive.Root>
    )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
