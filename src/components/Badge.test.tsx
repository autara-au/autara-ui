import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Badge } from './Badge'

/**
 * AUTM-948 — rule 1 of the Autara Glass direction: skew is for pills and
 * status ONLY, they are rounded parallelograms, and **the label is
 * counter-skewed**.
 *
 * The geometry was right and the render was not. `badgeVariants` declared
 * `defaultVariants.shape = 'parallelogram'`, so cva applied
 * `skewX(-12deg)` whenever `shape` was omitted — but the render branch tested
 * the RAW prop (`shape === 'parallelogram'`), which is `undefined` in exactly
 * that case, so the counter-skew `<span>` was never emitted. Every
 * `<Badge>` written the documented way rendered a slanted label.
 *
 * It survived because `Badge.stories.tsx` pinned `shape: 'pill'` in its meta
 * args, so the default silhouette was not on screen in Storybook either —
 * the same shape of miss as AUTM-934, where the meta args pinned
 * `variant: 'light-default'` and hid an invisible default.
 *
 * These assert the DOM rather than the visual, which is the part jsdom can
 * actually answer: the skew is a class on the wrapper and the counter-skew is
 * a real element that either exists or does not.
 */

const SKEW = '[transform:skewX(-12deg)]'
const COUNTER_SKEW = '[transform:skewX(12deg)]'

/*
 * AUTM-1594 — canvas v44 makes the PILL the default ("Solid, rounded pills").
 * The parallelogram stays available on request, and its counter-skew fix
 * (above) still holds for it, so the geometry cases now ask for it by name.
 */
describe('Badge geometry', () => {
    it('is a pill by default, with no skew and no counter-skew wrapper', () => {
        const { container } = render(<Badge>Verified</Badge>)
        expect(container.firstElementChild!.className).toContain('rounded-full')
        expect(container.firstElementChild!.className).not.toContain(SKEW)
        expect(container.querySelector(`span.${CSS.escape(COUNTER_SKEW)}`)).toBeNull()
    })

    it('renders identically whether the pill default is implicit or explicit', () => {
        const implicit = render(<Badge>Verified</Badge>).container.innerHTML
        const explicit = render(<Badge shape="pill">Verified</Badge>).container.innerHTML
        expect(implicit).toBe(explicit)
    })

    it('counter-skews the label on a parallelogram', () => {
        const { container } = render(<Badge shape="parallelogram">Verified</Badge>)
        expect(container.firstElementChild!.className).toContain(SKEW)
        expect(container.querySelector(`span.${CSS.escape(COUNTER_SKEW)}`)).not.toBeNull()
    })

    it('keeps a border radius on the parallelogram', () => {
        const { container } = render(<Badge shape="parallelogram">Verified</Badge>)
        expect(container.firstElementChild!.className).toContain('rounded-md')
    })

    it('is 28px at least and grows with text (min-h, rem)', () => {
        const cls = render(<Badge>State</Badge>).container.firstElementChild!.className
        expect(cls).toContain('min-h-7')
        expect(cls).toContain('text-[0.8125rem]')
    })
})

/**
 * The sheet's tones: purple acts or is live, aqua is in flight, lime is done;
 * amber awaits the customer; ink waits on someone else; danger is the one red
 * fill, on the merchant's Cancelled. Solid, never a tint. Asserted at class
 * level; the ratios are measured in tokens/palette-contrast.test.ts.
 */
describe('Badge tones (canvas v44)', () => {
    it.each([
        ['brand', '--brand', '--on-brand'],
        ['aqua', '--aqua', '--on-aqua'],
        ['lime', '--lime', '--on-lime'],
        ['amber', '--amber', '--on-amber'],
        ['danger', '--danger-fill', '--on-danger-fill'],
        ['band', '--band', '--text-strong'],
        ['waiting', '--strong', '--on-strong'],
        ['off', '--band', '--danger'],
        ['count', '--brand', '--on-brand'],
        ['count-alert', '--alert', '--on-alert'],
        ['count-selected', '--lime', '--on-lime'],
    ] as const)('%s is a solid fill with its ink', (variant, fill, on) => {
        const cls = render(<Badge variant={variant}>State</Badge>).container.firstElementChild!.className
        expect(cls).toContain(`bg-[var(${fill})]`)
        expect(cls).toContain(`text-[var(${on})]`)
        expect(cls).not.toMatch(/bg-\[rgba\(/)
        expect(cls).not.toMatch(/\/\d{1,2}\]/)
    })

    it.each([
        ['act', 'brand'],
        ['purple', 'brand'],
        ['flight', 'aqua'],
        ['money', 'lime'],
        ['success', 'lime'],
        ['warning', 'amber'],
        ['destructive', 'danger'],
        ['neutral', 'band'],
        ['default', 'band'],
        ['light-destructive', 'danger'],
    ] as const)('legacy %s renders as %s', (legacy, tone) => {
        const a = render(<Badge variant={legacy}>X</Badge>).container.innerHTML
        const b = render(<Badge variant={tone}>X</Badge>).container.innerHTML
        expect(a).toBe(b)
    })

    it('defaults to band', () => {
        const a = render(<Badge>X</Badge>).container.innerHTML
        const b = render(<Badge variant="band">X</Badge>).container.innerHTML
        expect(a).toBe(b)
    })

    it('a count is a 22px disc that widens with the number, 12px Bold', () => {
        const cls = render(<Badge variant="count">12</Badge>).container.firstElementChild!.className
        expect(cls).toContain('min-h-[1.375rem]')
        expect(cls).toContain('min-w-[1.375rem]')
        expect(cls).toContain('font-bold')
    })
})
