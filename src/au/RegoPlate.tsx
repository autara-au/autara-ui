import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * RegoPlate: a car's rego drawn as a small number plate, wherever a vehicle
 * appears (Components.swift; the merchant app's rego chip, AUTM-2130).
 */
export function RegoPlate({ text, className, ...rest }: React.HTMLAttributes<HTMLSpanElement> & { text: string }) {
    return (
        <span className={cn('au-rego', className)} {...rest}>
            <span className="sr-only">Registration </span>
            {text}
        </span>
    )
}
