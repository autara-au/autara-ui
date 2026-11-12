'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { cn } from '../lib/cn'

/**
 * Accordion — Radix accordion primitive in the Autara cream-canvas
 * grammar. Designed for FAQ blocks, expandable settings rows, and
 * onboarding "more info" affordances.
 *
 * - Items separated by `--border-subtle` hairlines (top + bottom of
 *   the group, between every item).
 * - Trigger: `--text-strong` ink, Satoshi medium. Hover lifts the
 *   muted chevron to ink. Open state keeps the chevron rotated 180°.
 * - Content: `--text-muted` body copy with relaxed leading.
 * - Solar Bold chevron (2.4 stroke, rounded caps).
 *
 * Animation classes (`animate-accordion-up` / `animate-accordion-down`)
 * are defined in `autara-ui/src/utilities/animations.css` and ship
 * with the package automatically.
 */
const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
    React.ComponentRef<typeof AccordionPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
    <AccordionPrimitive.Item
        ref={ref}
        className={cn(
            'border-b border-[var(--border-subtle)] last:border-b-0',
            className
        )}
        {...props}
    />
))
AccordionItem.displayName = 'AccordionItem'

const AccordionTrigger = React.forwardRef<
    React.ComponentRef<typeof AccordionPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
            ref={ref}
            className={cn(
                'group flex flex-1 items-center justify-between gap-4 py-4 text-left text-[0.9375rem] font-medium text-[var(--text-strong)] transition-colors',
                'hover:[&_svg]:text-[var(--text-strong)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]',
                'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
                '[&[data-state=open]>svg]:rotate-180',
                className
            )}
            {...props}
        >
            {children}
            <svg
                aria-hidden
                viewBox="0 0 24 24"
                width="16"
                height="16"
                className="shrink-0 text-[var(--text-subtle)] transition-transform duration-200 ease-out"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M6 9l6 6 6-6" />
            </svg>
        </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
    React.ComponentRef<typeof AccordionPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Content
        ref={ref}
        className="overflow-hidden text-[0.875rem] leading-relaxed text-[var(--text-muted)] data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
        {...props}
    >
        <div className={cn('pb-4 pt-0', className)}>{children}</div>
    </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
