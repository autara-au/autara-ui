import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { AccountMenu } from './AccountMenu'
import { CarouselHeader } from './CarouselHeader'
import { DropdownMenuLabel } from './DropdownMenu'
import { FieldStack, FieldStackField } from './FieldStack'
import { ImageCropDialog } from './ImageCropDialog'
import { KpiCard } from './KpiCard'
import { MetaChip } from './MetaChip'
import { ModeChip } from './ModeChip'
import { SectionHeading } from './SectionHeading'
import { SelectGroup, SelectLabel } from './Select'
import { StepCard } from './StepCard'
import { StepHeader } from './StepHeader'

/**
 * AUTM-1483. Labels are sentence case, weight 500, with no letterspacing.
 *
 * The Autara Glass direction retired letterspaced uppercase labels (Don,
 * 2026-09-03: "uppercase titles feel like AI slop"). Badge, Toast, ListSection
 * and StatTile had dropped them, and twelve more components still set them, so
 * every consumer that rendered one got the caps back however carefully it
 * swept its own code. merchant-mobile found MOBILE / IN-SHOP and ZOOM exactly
 * that way, on AUTM-1480.
 *
 * Three kinds of check, because jsdom has no stylesheet (the caveat
 * tap-targets.test.tsx states at length):
 *
 *   1. Rendered. Each label's own text is sentence case, it sits on the
 *      0.75rem / 0.8125rem scale at weight 500, and nothing ABOVE it sets
 *      `uppercase` or positive tracking. `text-transform` inherits, so a
 *      wrapper would bring the caps back without the label changing at all.
 *   2. Source. No component or story sets `uppercase` or `.editorial-eyebrow`
 *      in code, bar the two AUTM-1093 owns. Stories are in scope on purpose:
 *      they compile into dist/components, ship in the package, and are the
 *      patterns consumers copy.
 *   3. Stylesheet. `.field-stack-label` sets no capitals. FieldStack's caps
 *      lived in forms.css, where no scan of the components could see them.
 */

const DIR = resolve(process.cwd(), 'src/components')
const UPPERCASE = /\buppercase\b/
const POSITIVE_TRACKING = /\btracking-(?:wide|wider|widest)\b|\btracking-\[(?!-)[^\]]+\]/

/** Comments quote the banned classes on purpose, as history. Strip them. */
function code(file: string): string {
    return readFileSync(join(DIR, file), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|\s)\/\/.*$/gm, '$1')
}

function expectSentenceCaseLabel(el: HTMLElement, size: '0.75rem' | '0.8125rem') {
    expect(el.className).toContain(`text-[${size}]`)
    expect(el.className).toContain('font-medium')
    for (let node: HTMLElement | null = el; node; node = node.parentElement) {
        // An SVG's className is an SVGAnimatedString; only HTML wrappers matter.
        const cls = typeof node.className === 'string' ? node.className : ''
        const where = `<${node.tagName.toLowerCase()} class="${cls}">`
        expect(cls, where).not.toMatch(UPPERCASE)
        expect(cls, where).not.toMatch(POSITIVE_TRACKING)
    }
}

beforeAll(() => {
    // Radix positioning needs these and jsdom ships none of them (same
    // polyfills as AccountMenu.test.tsx).
    if (!globalThis.ResizeObserver) {
        globalThis.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        } as unknown as typeof ResizeObserver
    }
    if (!Element.prototype.hasPointerCapture) {
        Element.prototype.hasPointerCapture = () => false
        Element.prototype.setPointerCapture = () => {}
        Element.prototype.releasePointerCapture = () => {}
    }
    if (!Element.prototype.scrollIntoView) {
        Element.prototype.scrollIntoView = () => {}
    }
})

describe('AUTM-1483: each label renders in sentence case, on the scale', () => {
    it('ModeChip reads "Mobile" and "In-shop"', () => {
        render(
            <>
                <ModeChip mode="MOBILE" />
                <ModeChip mode="WORKSHOP" size="sm" />
            </>,
        )
        expectSentenceCaseLabel(screen.getByText('Mobile'), '0.8125rem')
        expectSentenceCaseLabel(screen.getByText('In-shop'), '0.75rem')
    })

    it('ImageCropDialog reads "Zoom"', () => {
        render(
            <ImageCropDialog
                open
                src="data:image/gif;base64,R0lGODlhAQABAAAAACw="
                aspect={1}
                onCropComplete={() => {}}
                onCancel={() => {}}
            />,
        )
        expectSentenceCaseLabel(screen.getByText('Zoom'), '0.75rem')
    })

    it('AccountMenu group titles read as written, in the menu and in the sheet', () => {
        const sections = [
            { key: 'money', title: 'Money', items: [{ key: 'earnings', label: 'Earnings', href: '#' }] },
        ]
        const identity = { name: 'Priya Nair', secondary: 'priya@example.com' }
        const { unmount } = render(<AccountMenu open identity={identity} sections={sections} />)
        expectSentenceCaseLabel(screen.getByText('Money'), '0.75rem')
        unmount()

        render(<AccountMenu open presentation="sheet" identity={identity} sections={sections} />)
        expectSentenceCaseLabel(screen.getByText('Money'), '0.75rem')
    })

    it('DropdownMenuLabel and SelectLabel read as written', () => {
        render(
            <>
                <DropdownMenuLabel>This booking</DropdownMenuLabel>
                <SelectGroup>
                    <SelectLabel>Detail packages</SelectLabel>
                </SelectGroup>
            </>,
        )
        expectSentenceCaseLabel(screen.getByText('This booking'), '0.75rem')
        expectSentenceCaseLabel(screen.getByText('Detail packages'), '0.75rem')
    })

    it('KpiCard and MetaChip read as written', () => {
        render(
            <>
                <KpiCard label="Bookings today" value={12} tone="money-in" />
                <MetaChip dot>Open now</MetaChip>
            </>,
        )
        expectSentenceCaseLabel(screen.getByText('Bookings today'), '0.8125rem')
        // MetaChip is canvas v44's 13px meta chip since 7.0.0 (AUTM-1594).
        expectSentenceCaseLabel(screen.getByText('Open now'), '0.8125rem')
    })

    it('SectionHeading eyebrows read as written, in both variants', () => {
        render(
            <>
                <SectionHeading eyebrow="Services" title="Everything you offer" />
                <SectionHeading editorial eyebrow="How it works" title="Booked in three steps." />
            </>,
        )
        expectSentenceCaseLabel(screen.getByText('Services'), '0.8125rem')
        expectSentenceCaseLabel(screen.getByText('How it works'), '0.8125rem')
    })

    it('StepHeader, StepCard and CarouselHeader read as written', () => {
        render(
            <>
                <StepHeader eyebrow="Business details" title="Tell us about your business" />
                <StepCard step={1} title="Find a professional" description="Search by service." />
                <CarouselHeader eyebrow="Just joined" title="New pros on Autara" />
            </>,
        )
        expectSentenceCaseLabel(screen.getByText('Business details'), '0.8125rem')
        expectSentenceCaseLabel(screen.getByText('Step 1 / 03'), '0.75rem')
        expectSentenceCaseLabel(screen.getByText('Just joined'), '0.8125rem')
    })

    it('FieldStack labels carry only the stylesheet class, which is checked below', () => {
        render(
            <FieldStack>
                <FieldStackField label="First name" name="firstName" />
            </FieldStack>,
        )
        const label = screen.getByText('First name')
        expect(label.className).toBe('field-stack-label')
    })
})

/** AUTM-1093 owns these, with a keep-or-delete decision. May shrink, never grow.
 * NavSearchPill came off under AUTM-2140: its labels are sentence case now. */
const AUTM_1093 = ['CategoryRail.tsx']

/** Components whose labels were swept to sentence case. May grow, never shrink. */
const SWEPT = [
    // AUTM-2140
    'NavSearchPill.tsx',
    // AUTM-1483
    'AccountMenu.tsx',
    'CarouselHeader.tsx',
    'DropdownMenu.tsx',
    'FieldStack.tsx',
    'ImageCropDialog.tsx',
    'KpiCard.tsx',
    'MetaChip.tsx',
    'ModeChip.tsx',
    'PWAInstallBanner.tsx',
    'SectionHeading.tsx',
    'Select.tsx',
    'StepCard.tsx',
    'StepHeader.tsx',
    // Earlier sweeps: AUTM-1138, AUTM-1161, AUTM-1221
    'ListSection.tsx',
    'MessageThread.tsx',
    'StatTile.tsx',
    'Stepper.tsx',
    'Toast.tsx',
]

const SOURCES = readdirSync(DIR).filter((f) => f.endsWith('.tsx') && !f.includes('.test.'))
const STORIES = SOURCES.filter((f) => f.endsWith('.stories.tsx'))

describe('AUTM-1483: no component or story sets letterspaced capitals', () => {
    it('the comment stripper removes comments and keeps code', () => {
        // Only ever written in a comment in ModeChip.
        expect(readFileSync(join(DIR, 'ModeChip.tsx'), 'utf8')).toContain('AUTM-1483')
        expect(code('ModeChip.tsx')).not.toContain('AUTM-1483')
        // And it did not eat the file, which would make every scan vacuous.
        expect(code('ModeChip.tsx')).toContain('export function ModeChip')
        expect(code('ModeChip.tsx')).toContain('whitespace-nowrap')
    })

    it('sets no `uppercase` and no `.editorial-eyebrow` outside the AUTM-1093 pair', () => {
        expect(SOURCES.length).toBeGreaterThan(100)
        const offenders = SOURCES.filter((f) => !AUTM_1093.includes(f)).filter((f) => {
            const src = code(f)
            return UPPERCASE.test(src) || src.includes('editorial-eyebrow')
        })
        expect(offenders).toEqual([])
    })

    it('sets no positive letterspacing on a swept component or in any story', () => {
        const offenders = [...SWEPT, ...STORIES]
            .filter((f) => !AUTM_1093.includes(f))
            .filter((f) => POSITIVE_TRACKING.test(code(f)))
        expect(offenders).toEqual([])
    })

    /**
     * Goes red the day AUTM-1093 sentence-cases one of these. That is the
     * point: take the file off `AUTM_1093` so the scans above cover it too.
     */
    it.each(AUTM_1093)('%s still earns its place on the AUTM-1093 list', (file) => {
        expect(code(file)).toMatch(UPPERCASE)
    })
})

describe('AUTM-1483: FieldStack labels are sentence case in the stylesheet', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/utilities/forms.css'), 'utf8')
    const rule = css.match(/^\.field-stack-label\s*\{([^}]*)\}/m)?.[1] ?? ''

    it('sets no capitals and no letterspacing, in rem at weight 500', () => {
        expect(rule).not.toBe('')
        expect(rule).not.toMatch(/text-transform\s*:\s*uppercase/)
        expect(rule).not.toMatch(/letter-spacing/)
        expect(rule).toMatch(/font-size\s*:\s*0\.75rem\s*;/)
        expect(rule).toMatch(/font-weight\s*:\s*500\s*;/)
    })
})
