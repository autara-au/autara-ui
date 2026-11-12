import * as React from 'react'
import { cn } from '../lib/cn'
import { VEHICLE_MAKE_LOGO_PATHS } from '../lib/vehicle-make-logos'
import { AU_VEHICLE_CATALOG, normalise, vehicleSlug } from '../lib/vehicle-catalog'

/**
 * VehicleMakeMark: a car make's mark, monochrome (AUTM-1870; Don approved
 * real make logos, 2026-10-14). Simple Icons' path where it carries the make
 * (src/lib/vehicle-make-logos.ts, bundled, never hotlinked), otherwise a
 * monogram in the same weight: the make's initials in a rounded square drawn
 * with the same stroke, so a row of tiles reads as one set.
 *
 * Drawn in currentColor, so the consumer's text token tints it and it holds
 * in both themes. Decorative (aria-hidden): the make's name is always beside
 * it in words. Sized in em by default, so it grows with the reader's text.
 *
 * AUTM-2147: the make is looked up the way a booking stores it, typed by a
 * person: any case, and by the catalog's aliases ("VW" is Volkswagen's mark,
 * "Chevy" Chevrolet's). A caller that must not show a monogram (the merchant's
 * job ticket keeps its car icon) asks hasVehicleMakeLogo() first.
 *
 * No hooks and no 'use client', so a server component can draw it.
 */
export interface VehicleMakeMarkProps {
    make: string
    className?: string
    testId?: string
}

/** The letters a make without a mark is drawn with: "GWM", "LR", "H". */
export function vehicleMakeMonogram(make: string): string {
    const name = make.trim()
    if (!name) return '?'
    /* A short all-capitals name is already its own mark (GWM, BYD, MG). */
    if (/^[A-Z0-9]{2,3}$/.test(name)) return name
    const words = name.split(/[\s-]+/).filter(Boolean)
    if (words.length > 1) return words.slice(0, 2).map((w) => w[0]!.toUpperCase()).join('')
    return name[0]!.toUpperCase()
}

/**
 * The Simple Icons path for a make as a person typed it ("toyota", "VW",
 * "Rolls Royce"), or null when Simple Icons has no mark for it or the make
 * is not one we list.
 */
export function vehicleMakeLogoPath(make: string | null | undefined): string | null {
    if (!make) return null
    const direct = VEHICLE_MAKE_LOGO_PATHS[vehicleSlug(make)]
    if (direct) return direct
    const key = normalise(make)
    if (!key) return null
    const entry = AU_VEHICLE_CATALOG.find(
        (m) => normalise(m.name) === key || (m.aliases ?? []).some((alias) => normalise(alias) === key)
    )
    return entry ? (VEHICLE_MAKE_LOGO_PATHS[vehicleSlug(entry.name)] ?? null) : null
}

export function hasVehicleMakeLogo(make: string | null | undefined): boolean {
    return vehicleMakeLogoPath(make) !== null
}

export function VehicleMakeMark({ make, className, testId }: VehicleMakeMarkProps) {
    const path = vehicleMakeLogoPath(make)
    const letters = path ? '' : vehicleMakeMonogram(make)
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            data-testid={testId}
            data-mark={path ? 'logo' : 'monogram'}
            className={cn('inline-block size-[1.5em] shrink-0', className)}
        >
            {path ? (
                <path d={path} fill="currentColor" />
            ) : (
                <>
                    <rect x="1.25" y="1.25" width="21.5" height="21.5" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    <text
                        x="12"
                        y="12"
                        dy="0.36em"
                        textAnchor="middle"
                        fill="currentColor"
                        fontWeight={700}
                        fontSize={letters.length >= 3 ? 7.5 : letters.length === 2 ? 9.5 : 12}
                        style={{ fontFamily: 'inherit' }}
                    >
                        {letters}
                    </text>
                </>
            )}
        </svg>
    )
}
