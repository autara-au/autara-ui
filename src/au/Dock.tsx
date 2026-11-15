import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * Dock: the floating glass dock (Components.swift). Equal icon slots with no
 * labels, the current tab a tile that slides between them, and search as its
 * own disc beside it (Don, 15 Nov: the labelled pill was cluttered and the
 * others jumped as it grew).
 *
 * Each tab is the consumer's element (a Next Link), so the library never
 * imports a router. Every tab is named (`label`) and the current one says so
 * (`aria-current="page"`). The icon gets `active` so an Autara icon draws its
 * Bold twin. Place it yourself (fixed to the bottom, above the safe area).
 */
export interface DockTab {
    id: string
    /** The accessible name: "Home", "Bookings", "Inbox", "You". */
    label: string
    /** An Autara icon element; receives `active` when this tab is current. */
    icon: React.ReactElement<{ active?: boolean; size?: number | string }>
    /** The link: `<Link href="/account" />`. Its children are replaced. */
    element: React.ReactElement<Record<string, unknown>>
    /** A count to show on the tab (unread, waiting); 0 shows nothing. */
    count?: number
    /** Read with the count: "3 unread". */
    countLabel?: string
    testId?: string
}

export interface DockProps extends React.HTMLAttributes<HTMLElement> {
    tabs: DockTab[]
    /** The current tab's id, or null when none is (a page under a tab). */
    current: string | null
    /** The search disc: the consumer's link or button. Omit for none. */
    search?: React.ReactElement<Record<string, unknown>>
    searchLabel?: string
    /** The nav's accessible name. */
    label?: string
}

export function Dock({ tabs, current, search, searchLabel = 'Search', label = 'Main', className, style, ...rest }: DockProps) {
    const index = tabs.findIndex((tab) => tab.id === current)
    return (
        <nav
            aria-label={label}
            className={cn('au-dock', className)}
            style={{ ...style, ['--au-dock-count' as string]: tabs.length, ['--au-dock-index' as string]: Math.max(index, 0) }}
            {...rest}
        >
            <div className="au-dock__tabs au-dock__glass">
                <span className="au-dock__tile" hidden={index < 0} aria-hidden="true" />
                {tabs.map((tab) => {
                    const on = tab.id === current
                    const count = tab.count ?? 0
                    return React.cloneElement(
                        tab.element,
                        {
                            key: tab.id,
                            className: cn('au-dock__tab', tab.element.props.className as string | undefined),
                            'aria-label': count > 0 && tab.countLabel ? `${tab.label}, ${tab.countLabel}` : tab.label,
                            'aria-current': on ? 'page' : undefined,
                            'data-testid': tab.testId ?? tab.element.props['data-testid'],
                        },
                        <>
                            {React.cloneElement(tab.icon, { active: on, size: 24 })}
                            {count > 0 ? (
                                <span className="au-dock__count" aria-hidden="true">
                                    {count > 9 ? '9+' : count}
                                </span>
                            ) : null}
                        </>,
                    )
                })}
            </div>
            {search
                ? React.cloneElement(search, {
                      className: cn('au-dock__search au-dock__glass', search.props.className as string | undefined),
                      'aria-label': (search.props['aria-label'] as string | undefined) ?? searchLabel,
                  })
                : null}
        </nav>
    )
}
