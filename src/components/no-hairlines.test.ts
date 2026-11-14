import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * AUTM-2042 (Don, 2026-11-08): "no hairlines throughout the app as we
 * decided". Surfaces and rows separate by fill and space (band tiles with
 * gaps, padding, type weight), never by 1px lines, dividers or card outlines.
 *
 * A source scan, as `floating-surface.test.ts` is, because jsdom draws
 * nothing. Kept on purpose, and so not scanned for: form input borders
 * (`--field-edge`, the glass fields' `.glass-edge` hairline), focus rings,
 * and a calendar's hour rules.
 */

const read = (file: string) =>
    readFileSync(resolve(process.cwd(), 'src/components', file), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

const LINE = new RegExp(
    [
        // a rule or outline in the line colours: `border`, `border-t`, `border-b` ...
        String.raw`\bborder(?:-[tblrxy])?\s+border-\[var\(--(?:hairline|border-subtle)\)\]`,
        // the same with other classes between the side and the colour
        String.raw`\bborder-[tblrxy]\b[^'"\u0060]*border-\[var\(--(?:hairline|border-subtle)\)\]`,
        String.raw`divide-[xy]\b`,
        String.raw`divide-\[var\(--(?:hairline|border-subtle)\)\]`,
        String.raw`first:border-t`,
        String.raw`inset_0_0_0_1px_var\(--hairline\)`,
        String.raw`after:h-px after:bg-\[var\(--hairline\)\]`,
    ].join('|')
)

describe('no hairlines (AUTM-2042)', () => {
    it.each([
        'InfoRow.tsx',
        'ListSection.tsx',
        'MoneyBreakdown.tsx',
        'PickerSheet.tsx',
        'Dialog.tsx',
        'Toast.tsx',
        'CommandMenu.tsx',
        'VehicleProfile.tsx',
        'Badge.tsx',
        'AddressPickerSheet.tsx',
        'ImageCropDialog.tsx',
        'MessageComposer.tsx',
    ])('%s draws no rule, divider or outline', (file) => {
        expect(read(file)).not.toMatch(LINE)
    })

    it("PhoneInput is the field's glass, with no rule inside it", () => {
        // AUTM-2140: the glass pill; the edge is `.glass-edge`'s hairline,
        // transparent at rest, and the country segment has no divider.
        const src = read('PhoneInput.tsx')
        expect(src).toContain("'field-shell glass-edge'")
        expect(src).not.toContain('border-r border-[var(--border-subtle)]')
    })

    it('the quiet count is a solid fill, not paper in a ring', () => {
        const line = read('Badge.tsx').match(/'count-quiet':\s*`([^`]*)`/)?.[1] ?? ''
        expect(line).toContain('bg-[var(--icon-disc)]')
        expect(line).not.toContain('shadow-[inset')
    })
})
