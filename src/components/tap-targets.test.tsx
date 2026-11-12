import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Switch } from './Switch'
import { Tabs, TabsList, TabsTrigger } from './Tabs'
import { Checkbox } from './Checkbox'
import { RadioGroup, RadioGroupItem } from './Radio'
import { FilterChipRow } from './FilterChipRow'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './Sheet'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from './DropdownMenu'

/**
 * AUTM-622 — the 44px floor, on the two components that were under it.
 *
 * Measured on merchant-mobile before the fix, and it was NOT "mostly a phone
 * problem" as reported: the Day/Today/Week/Month switcher rendered 32px tall
 * on phone, tablet AND desktop, and every availability toggle was 44x24.
 *
 * These assert the CLASSES that produce the geometry, because jsdom has no
 * layout engine — `getBoundingClientRect` returns zeroes here, so a
 * measurement test in this environment would pass against anything. The real
 * geometry is measured in merchant-mobile's Playwright suite, which has a
 * browser. Stating that explicitly because a test named "tap targets" that
 * cannot measure a tap target is exactly the kind of guard that reads as
 * proof and is not.
 */
describe('AUTM-622 — 44px tap targets', () => {
    it('Switch keeps its drawn 52 x 32 look but carries a 44px-tall hit area', () => {
        render(<Switch aria-label="Toggle Monday" />)
        const el = screen.getByRole('switch')
        // The painted control is the sheet's (AUTM-1594) — that shape is the
        // affordance, so the hit area is added rather than the track grown.
        expect(el.className).toContain('h-8')
        expect(el.className).toContain('w-13')
        // The hit area is the pseudo-element: 44 tall, as wide as the track.
        expect(el.className).toContain('before:h-11')
        expect(el.className).toContain('before:w-13')
        // Without content the pseudo-element generates no box at all and the
        // whole thing silently does nothing.
        expect(el.className).toContain("before:content-['']")
        expect(el.className).toContain('relative')
    })

    it('TabsTrigger clears 44px, and the list makes room for it', () => {
        render(
            <Tabs defaultValue="day">
                <TabsList>
                    <TabsTrigger value="day">Day</TabsTrigger>
                    <TabsTrigger value="week">Week</TabsTrigger>
                </TabsList>
            </Tabs>,
        )
        // AUTM-1594: drawn at the sheet's 40px in a 48px track; the 44px floor
        // is the unpainted pseudo-element, which the track's 4px padding holds.
        const tab = screen.getByRole('tab', { name: 'Day' }).className
        expect(tab).toContain('min-h-10')
        expect(tab).toContain('before:h-11')
        expect(tab).toContain("before:content-['']")
        expect(tab).toContain('relative')
        expect(screen.getByRole('tablist').className).toContain('min-h-12')
        expect(screen.getByRole('tablist').className).toContain('p-1')
    })

    it('FilterChipRow clears 44px too — the component the first pass MISSED', () => {
        // AUTM-622 names FilterChipRow as well as Tabs. The first pass fixed
        // Switch and Tabs, shipped as 5.3.1, and left this at `px-3 py-1.5`
        // with no minimum — 32px. A board audit caught it before anyone closed
        // the ticket on that release. This test exists so the ticket and the
        // code cannot disagree again.
        render(
            <FilterChipRow
                options={[
                    { value: 'all', label: 'All' },
                    { value: 'pending', label: 'Pending' },
                ]}
                value="all"
                onChange={() => {}}
            />,
        )
        // AUTM-1594: drawn at the sheet's 36px; the 44px floor is the
        // pseudo-element, and the row's 4px vertical padding keeps the
        // scroller from clipping it.
        for (const chip of screen.getAllByRole('tab')) {
            expect(chip.className).toContain('min-h-9')
            expect(chip.className).toContain('before:h-11')
            expect(chip.className).toContain('before:min-w-11')
            expect(chip.className).toContain("before:content-['']")
        }
        expect(screen.getByRole('tablist').className).toContain('py-1')
    })

    it('both use MINIMUM heights, so 200% text scale grows them instead of clipping', () => {
        render(
            <Tabs defaultValue="day">
                <TabsList>
                    <TabsTrigger value="day">Day</TabsTrigger>
                </TabsList>
            </Tabs>,
        )
        const trigger = screen.getByRole('tab', { name: 'Day' })
        expect(trigger.className).not.toMatch(/(^|\s)h-10(\s|$)/)
        expect(screen.getByRole('tablist').className).not.toMatch(/(^|\s)h-12(\s|$)/)
    })
})

describe('AUTM-1594 — the sheet\'s 24px choice controls keep a 44px hit area', () => {
    it.each([
        ['Checkbox', () => render(<Checkbox aria-label="I agree" />), 'checkbox'],
        ['Radio', () => render(<RadioGroup aria-label="Mode"><RadioGroupItem value="a" aria-label="Comes to you" /></RadioGroup>), 'radio'],
    ] as const)('%s is 24px drawn, 44px to touch', (_name, mount, role) => {
        mount()
        const el = screen.getByRole(role)
        expect(el.className).toContain('size-6')
        expect(el.className).toContain('before:size-11')
        expect(el.className).toContain("before:content-['']")
        expect(el.className).toContain('relative')
    })
})

describe('AUTM-1756 — Sheet\'s close control is the 44px filled disc', () => {
    it.each(['right', 'left', 'top', 'bottom'] as const)('side="%s": 44px disc, 48px to a finger', (side) => {
        render(
            <Sheet defaultOpen>
                <SheetContent side={side}>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>Narrow the list.</SheetDescription>
                </SheetContent>
            </Sheet>,
        )
        const close = screen.getByRole('button', { name: 'Close drawer' })
        // AUTM-1756 (Don: "this close button is very small in every dialog"):
        // the drawn disc IS the target now. It was a 28px disc with an
        // unpainted 44px pseudo-element around it.
        expect(close.className).toContain('size-11')
        expect(close.className).toContain('pointer-coarse:size-12')
        expect(close.className).toContain('bg-[var(--icon-disc)]')
        expect(close.className).not.toContain('h-7')
        // Positioned against the panel's corner.
        expect(close.className).toContain('absolute')
    })
})

describe('AUTM-1594 — every DropdownMenu row is 44px', () => {
    it('plain items and sub-triggers carry a 44px MINIMUM height', () => {
        render(
            <DropdownMenu defaultOpen modal={false}>
                <DropdownMenuTrigger>Booking actions</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>View detail</DropdownMenuItem>
                    <DropdownMenuItem inset>Copy invoice link</DropdownMenuItem>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>,
        )
        const rows = screen.getAllByRole('menuitem')
        expect(rows).toHaveLength(3)
        for (const row of rows) {
            expect(row.className).toContain('min-h-11')
            // A minimum, never a fixed height: 200% text grows the row.
            expect(row.className).not.toMatch(/(^|\s)h-(9|10|11)(\s|$)/)
        }
    })
})
