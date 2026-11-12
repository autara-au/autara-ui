import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { PackageCard } from './PackageCard'
import { ServiceCard } from './ServiceCard'
import { formatPriceCents } from '../lib/service-listing'
import { packageSaving } from '../lib/package-listing'

/**
 * The link's accessible description, with jsdom's padding taken out: with no
 * CSS display to go on, it puts a space at every element boundary, so "Draft."
 * comes back "Draft ." where a browser reads "Draft.".
 */
function description(el: HTMLElement): string {
    const ids = (el.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean)
    const text = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ')
    return text.replace(/\s+/g, ' ').replace(/\s+([.,])/g, '$1').trim()
}

/**
 * AUTM-1812: the catalogue cards. jsdom has no layout, so these hold the
 * behaviour and the words; the look is checked in Storybook and in the
 * portal at four widths.
 */

describe('PackageCard deal', () => {
    // A package at $470 holding $280 and $242 of services.
    const saving = packageSaving({ packagePriceCents: 47_000, includedPriceCents: [28_000, 24_200] })

    it('draws the price, the services total struck through and a Save pill from packageSaving', () => {
        expect(saving).not.toBeNull()
        render(
            <PackageCard
                name="Value Pack"
                href="/packages/1/edit"
                priceLabel={formatPriceCents(47_000)}
                servicesTotalLabel={formatPriceCents(saving!.servicesTotalCents)}
                savingLabel={`Save ${formatPriceCents(saving!.savingCents)}`}
                includedServices={['Exterior wash', 'Interior vacuum']}
                testIds={{ price: 'p', compareAtPrice: 'c', saving: 's' }}
            />,
        )
        expect(screen.getByTestId('p')).toHaveTextContent('$470')
        const struck = screen.getByTestId('c')
        expect(struck.tagName).toBe('S')
        expect(struck).toHaveTextContent('$522')
        expect(screen.getByTestId('s')).toHaveTextContent('Save $52')
        // Solid brand, never a tint.
        expect(screen.getByTestId('s').className).toContain('bg-[var(--brand)]')
        expect(screen.getByTestId('s').className).not.toMatch(/\/\d{1,2}\b|opacity-/)
    })

    it('reads the deal in order to a screen reader, saying what the struck figure is', () => {
        render(
            <PackageCard
                name="Value Pack"
                href="/packages/1/edit"
                priceLabel="$470"
                servicesTotalLabel="$522"
                savingLabel="Save $52"
                includedServices={['Exterior wash', 'Interior vacuum']}
            />,
        )
        const link = screen.getByRole('link', { name: 'Value Pack' })
        expect(link).toHaveAccessibleDescription(/Booked separately \$522/)
        expect(description(link)).toBe('Includes Exterior wash, Interior vacuum $470, Booked separately $522, Save $52')
    })

    it('draws neither the struck total nor the pill when either label is missing', () => {
        const { rerender, container } = render(
            <PackageCard name="Value Pack" priceLabel="$522" servicesTotalLabel="$522" savingLabel={null} />,
        )
        expect(container.querySelector('s')).toBeNull()
        expect(container.querySelector('[data-slot="saving"]')).toBeNull()

        rerender(<PackageCard name="Value Pack" priceLabel="$522" servicesTotalLabel={null} savingLabel="Save $52" />)
        expect(container.querySelector('s')).toBeNull()
        expect(container.querySelector('[data-slot="saving"]')).toBeNull()
        expect(screen.queryByText('Save $52')).toBeNull()
    })

    it('a package priced at its services total gets no saving at all (packageSaving is null)', () => {
        expect(packageSaving({ packagePriceCents: 52_200, includedPriceCents: [28_000, 24_200] })).toBeNull()
    })
})

describe('PackageCard includes', () => {
    it('lists three names then "+ N more", keeping every name it lists in the DOM', () => {
        render(
            <PackageCard
                name="Full Works"
                priceLabel="$900"
                includedServices={['Wash', 'Clay bar', 'Polish', 'Ceramic coat', 'Interior steam']}
                testIds={{ includes: 'inc' }}
            />,
        )
        const list = within(screen.getByTestId('inc')).getByRole('list')
        const items = within(list).getAllByRole('listitem')
        expect(items.map((li) => li.textContent?.replace(/,\s*$/, '').trim())).toEqual([
            'Wash',
            'Clay bar',
            'Polish',
            '+ 2 more',
        ])
    })

    it('lists every name when there are three or fewer, with no "more" line', () => {
        render(<PackageCard name="Duo" priceLabel="$100" includedServices={['Wash', 'Vacuum']} testIds={{ includes: 'inc' }} />)
        expect(screen.getByTestId('inc')).not.toHaveTextContent('more')
    })

    it('draws no list while the names are unknown (null), rather than an empty one', () => {
        const { container } = render(<PackageCard name="Duo" priceLabel="$100" includedServices={null} />)
        expect(container.querySelector('ul')).toBeNull()
    })

    it('cuts a long name to one line visually, never in the DOM', () => {
        const long = 'Ceramic Coating, Stage 2 with Paint Correction and Wheel Faces'
        render(<PackageCard name="Long" priceLabel="$100" includedServices={[long]} />)
        const name = screen.getByText(long)
        expect(name.className).toContain('truncate')
    })
})

describe('ServiceCard catalogue status (AUTM-1812)', () => {
    it.each([
        ['live', 'Active', 'bg-[var(--lime)]'],
        ['draft', 'Draft', 'bg-[var(--amber)]'],
        ['off', 'Inactive', 'bg-[var(--band)]'],
    ] as const)('a %s status is a solid pill on the photo, read with the card', (tone, label, fill) => {
        render(
            <ServiceCard
                name="Exterior wash"
                href="/services/1/edit"
                priceLabel="$80"
                durationLabel="45m"
                status={{ label, tone }}
                testIds={{ status: 'st' }}
            />,
        )
        const pill = screen.getByTestId('st')
        expect(pill).toHaveTextContent(label)
        expect(pill.className).toContain(fill)
        expect(pill.closest('[data-slot="media"]')).not.toBeNull()
        const link = screen.getByRole('link', { name: 'Exterior wash' })
        expect(link).toHaveAccessibleDescription(new RegExp(`^${label}`))
        expect(description(link)).toBe(`${label}. 45m $80`)
    })

    it('keeps a consumer badge beside the status', () => {
        render(
            <ServiceCard
                name="Wash"
                priceLabel="$80"
                status={{ label: 'Active', tone: 'live' }}
                badge={<span data-testid="extra">Cover pending</span>}
            />,
        )
        expect(screen.getByTestId('extra').closest('[data-slot="media"]')).not.toBeNull()
    })

    it('words the no-photo panel and reads it with the card, only when there is no photo', () => {
        const { rerender, container } = render(
            <ServiceCard name="Wash" href="/s/1" priceLabel="$80" durationLabel="45m" noPhotoLabel="No photo yet" />,
        )
        expect(container.querySelector('[data-slot="media-fallback"]')).toHaveTextContent('No photo yet')
        // Read even though the panel is aria-hidden: aria-describedby names it directly.
        expect(screen.getByRole('link', { name: 'Wash' })).toHaveAccessibleDescription(/^No photo yet/)
        expect(description(screen.getByRole('link', { name: 'Wash' }))).toBe('No photo yet. 45m $80')

        rerender(
            <ServiceCard
                name="Wash"
                href="/s/1"
                priceLabel="$80"
                durationLabel="45m"
                noPhotoLabel="No photo yet"
                coverImageUrl="https://cdn.example/cover.jpg"
            />,
        )
        expect(screen.queryByText('No photo yet')).toBeNull()
        expect(description(screen.getByRole('link', { name: 'Wash' }))).toBe('45m $80')
    })

    it('changes nothing for a card that passes none of the new props', () => {
        const { container } = render(
            <ServiceCard name="Wash" priceLabel="$80" badge={<span>New</span>} durationLabel="45 min" />,
        )
        expect(container.querySelector('[data-slot="status"]')).toBeNull()
        expect(container.querySelector('s')).toBeNull()
        expect(container.querySelector('ul')).toBeNull()
        // The badge keeps its own corner wrapper, as before.
        expect(screen.getByText('New').parentElement?.className).toBe('absolute left-2 top-2 flex')
    })
})

describe('ServiceCard no-photo words under a corner pill (AUTM-1812)', () => {
    it('puts the words under the figure when a status holds the corner, so the pill never covers them', () => {
        const { container } = render(
            <ServiceCard
                name="Interior"
                priceLabel="$200"
                durationLabel="2h 30m"
                noPhotoLabel="No photo yet"
                status={{ label: 'Draft', tone: 'draft' }}
            />,
        )
        const panel = container.querySelector('[data-slot="media-fallback"]') as HTMLElement
        // The first row is empty (the pill's corner); figure and words share the foot.
        expect(panel.firstElementChild?.textContent).toBe('')
        expect(panel.lastElementChild).toHaveTextContent('2h 30m')
        expect(panel.lastElementChild).toHaveTextContent('No photo yet')
    })

    it('keeps the glyph and words at the top with no pill', () => {
        const { container } = render(
            <ServiceCard name="Interior" priceLabel="$200" durationLabel="2h 30m" noPhotoLabel="No photo yet" />,
        )
        const panel = container.querySelector('[data-slot="media-fallback"]') as HTMLElement
        expect(panel.firstElementChild).toHaveTextContent('No photo yet')
        expect(panel.firstElementChild?.querySelector('svg')).not.toBeNull()
    })
})
