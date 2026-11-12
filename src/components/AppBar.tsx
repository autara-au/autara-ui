import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

/**
 * AppBar: the top bar of a signed-in app screen (AUTM-1781).
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ [←]  Booking                          [nav …]   [trailing] │
 *   └──────────────────────────────────────────────────────────┘
 *
 * Slots, not opinions, so every surface composes its own:
 *
 *   - `leading`: a BackButton on a pushed screen, the logo on a top-level one.
 *   - `title`: the SCREEN's name at 17px Bold, never a page-size
 *     heading. It is not the page's h1: the content below owns that, so a
 *     screen reader hears one h1 and the bar does not repeat it as a second.
 *     Two lines at most, then an ellipsis: at 200% text a one-line title
 *     shrank to its first letter. The content repeats the full name.
 *   - `children`: inline navigation for wide screens (AppTabBar
 *     `variant="inline"`). The caller decides where it shows.
 *   - `trailing`: the account entry, help, an action.
 *
 * Paper with a hairline under it, sticky by default, clear of the notch
 * (`env(safe-area-inset-top)`), at least 56px tall. A `header` element, so it
 * is the page's banner landmark when it is the first one on the page.
 */

export interface AppBarProps {
    leading?: ReactNode
    title?: ReactNode
    trailing?: ReactNode
    /** Inline navigation, between the title and `trailing`. */
    children?: ReactNode
    /** Pin the bar to the top of the viewport. @default true */
    sticky?: boolean
    /** The width of the bar's content track. @default 'page' (the page track, 1440px) */
    width?: 'page' | 'full'
    className?: string
    /** Class on the title element. */
    titleClassName?: string
    testId?: string
}

export function AppBar({
    leading,
    title,
    trailing,
    children,
    sticky = true,
    width = 'page',
    className,
    titleClassName,
    testId,
}: AppBarProps) {
    return (
        <header
            data-testid={testId}
            className={cn(
                'z-40 w-full border-b border-[var(--hairline)] bg-[var(--surface)] pt-[env(safe-area-inset-top)] text-[var(--text-strong)]',
                sticky && 'sticky top-0',
                className,
            )}
        >
            <div
                className={cn(
                    'mx-auto flex min-h-14 w-full items-center gap-2 px-3 py-1.5 sm:gap-3 sm:px-5',
                    width === 'page' && 'max-w-[var(--page-max,90rem)]',
                )}
            >
                {leading ? <div className="flex shrink-0 items-center">{leading}</div> : null}
                {title ? (
                    <div
                        className={cn(
                            'line-clamp-2 min-w-0 flex-1 text-[1.0625rem] leading-snug font-bold [overflow-wrap:break-word]',
                            titleClassName,
                        )}
                    >
                        {title}
                    </div>
                ) : (
                    <div className="min-w-0 flex-1" />
                )}
                {children ? <div className="flex shrink-0 items-center">{children}</div> : null}
                {trailing ? <div className="flex shrink-0 items-center gap-1">{trailing}</div> : null}
            </div>
        </header>
    )
}
