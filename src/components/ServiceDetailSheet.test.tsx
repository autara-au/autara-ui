import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { forwardRef, type AnchorHTMLAttributes } from 'react'
import { ServiceDetailSheet } from './ServiceDetailSheet'

/**
 * AUTM-1866: the sheet a menu card opens. jsdom has no layout, so these hold
 * the content, the roles and names, the two Book forms and the classes that
 * make the pill; the geometry and contrast are in the browser test.
 */

const base = {
    open: true,
    onOpenChange: () => {},
    name: 'Tyre shine',
    description: 'Tyres cleaned and dressed.\nA water-based shine that dries to a satin finish.',
    durationLabel: '15 min',
    locationLabel: 'At the workshop',
    priceLabel: '$10.99',
    priceNote: 'incl. $0.99 booking fee',
}

describe('ServiceDetailSheet', () => {
    it('is a dialog named by the service and described by its meta line', () => {
        render(<ServiceDetailSheet {...base} testId="sheet" testIds={{ title: 'title', meta: 'meta' }} />)
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAccessibleName('Tyre shine')
        expect(dialog).toHaveAccessibleDescription('15 min · At the workshop')
        expect(dialog.getAttribute('data-testid')).toBe('sheet')
        // A sheet title: Satoshi 900.
        expect(screen.getByTestId('title').className).toContain('font-black')
        expect(screen.getByTestId('meta').textContent).toBe('15 min · At the workshop')
    })

    it('shows the full description with its line breaks, never clamped', () => {
        render(<ServiceDetailSheet {...base} testIds={{ description: 'desc' }} />)
        const desc = screen.getByTestId('desc')
        expect(desc.textContent).toBe(base.description)
        expect(desc.className).toContain('whitespace-pre-line')
        expect(desc.className).not.toContain('line-clamp')
    })

    it('leads with the all-in total and says the fee on one small line', () => {
        render(<ServiceDetailSheet {...base} testIds={{ price: 'price', priceNote: 'note' }} />)
        expect(screen.getByTestId('price').textContent).toBe('$10.99')
        expect(screen.getByTestId('price').parentElement?.className).toContain('font-bold')
        expect(screen.getByTestId('note').textContent).toBe('incl. $0.99 booking fee')
        expect(screen.getByTestId('note').className).toContain('text-[0.8125rem]')
    })

    it('shows the price alone with no fee', () => {
        render(<ServiceDetailSheet {...base} priceLabel="$10" priceNote={null} />)
        expect(screen.getByRole('dialog').textContent?.toLowerCase()).not.toContain('fee')
    })

    it('books through the consumer link, named for the service and described by the price', () => {
        const Link = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(function Link(props, ref) {
            return <a ref={ref} data-own-link="" {...props} />
        })
        render(
            <ServiceDetailSheet {...base} bookHref="/m/abc/book/checkout?serviceId=tyre" as={Link} testIds={{ book: 'book' }} />,
        )
        const book = screen.getByTestId('book')
        expect(book.tagName).toBe('A')
        expect(book.hasAttribute('data-own-link')).toBe(true)
        expect(book.getAttribute('href')).toBe('/m/abc/book/checkout?serviceId=tyre')
        expect(book).toHaveAccessibleName('Book Tyre shine')
        expect(book).toHaveAccessibleDescription(/\$10\.99.*incl\. \$0\.99 booking fee/)
    })

    it('books through a button with onBook', () => {
        const onBook = vi.fn()
        render(<ServiceDetailSheet {...base} onBook={onBook} />)
        fireEvent.click(screen.getByRole('button', { name: 'Book Tyre shine' }))
        expect(onBook).toHaveBeenCalledTimes(1)
    })

    it('draws Book as the solid brand purple pill with an arrow, never lime', () => {
        render(<ServiceDetailSheet {...base} onBook={() => {}} testIds={{ book: 'book' }} />)
        const book = screen.getByTestId('book')
        expect(book.className).toContain('bg-[var(--accent-fill)]')
        expect(book.className).toContain('text-[var(--on-accent)]')
        expect(book.className).toContain('min-h-13')
        expect(book.className).not.toMatch(/var\(--lime\)|#[0-9a-f]{3,8}/i)
        expect(book.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
    })

    it('puts focus on Book when it opens', () => {
        render(<ServiceDetailSheet {...base} onBook={() => {}} />)
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Book Tyre shine' }))
    })

    it('has no Book when the service is not bookable', () => {
        render(<ServiceDetailSheet {...base} priceLabel="Price on request" priceNote={null} />)
        expect(screen.queryByRole('button', { name: /^Book/ })).toBeNull()
        expect(screen.queryByRole('link')).toBeNull()
    })

    it('shows the photo when there is one, and no box when there is none or it fails', () => {
        const { rerender } = render(<ServiceDetailSheet {...base} coverImageUrl="https://cdn.example/t.jpg" />)
        const dialog = screen.getByRole('dialog')
        const img = dialog.querySelector('[data-slot="media"] img') as HTMLImageElement
        expect(img.getAttribute('alt')).toBe('')
        fireEvent.error(img)
        expect(dialog.querySelector('[data-slot="media"]')).toBeNull()
        rerender(<ServiceDetailSheet {...base} coverImageUrl={null} />)
        expect(screen.getByRole('dialog').querySelector('[data-slot="media"]')).toBeNull()
    })

    it('takes the consumer media element over the URL', () => {
        render(
            <ServiceDetailSheet
                {...base}
                coverImageUrl="https://cdn.example/no.jpg"
                media={<img data-testid="own" src="/optimised.jpg" alt="" />}
            />,
        )
        expect(screen.getByTestId('own')).toBeTruthy()
        expect(screen.getByRole('dialog').querySelectorAll('img')).toHaveLength(1)
    })

    it('keeps the multi-day words and the drop-off tag on the meta line, each locatable', () => {
        render(
            <ServiceDetailSheet
                {...base}
                durationLabel={null}
                locationLabel={null}
                workingDaysLabel="3 working days"
                chips={[{ label: 'Drop off at the workshop', testId: 'dropoff' }]}
            />,
        )
        expect(screen.getByRole('dialog')).toHaveAccessibleDescription('3 working days · Drop off at the workshop')
        expect(screen.getByTestId('dropoff').textContent).toBe('Drop off at the workshop')
    })

    it('closes from its close button and from Escape', async () => {
        const user = userEvent.setup()
        const onOpenChange = vi.fn()
        render(<ServiceDetailSheet {...base} onOpenChange={onOpenChange} />)
        await user.click(screen.getByRole('button', { name: 'Close' }))
        expect(onOpenChange).toHaveBeenCalledWith(false)
        await user.keyboard('{Escape}')
        expect(onOpenChange).toHaveBeenCalledTimes(2)
    })

    it('renders nothing while closed', () => {
        render(<ServiceDetailSheet {...base} open={false} />)
        expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('uses rem type and tokens only, and no em or en dash', () => {
        render(<ServiceDetailSheet {...base} coverImageUrl="https://cdn.example/t.jpg" onBook={() => {}} />)
        const html = screen.getByRole('dialog').outerHTML
        expect(html).not.toMatch(/text-\[\d+px\]/)
        expect(html).not.toMatch(/(bg|text|border)-\[#/)
        expect(html).not.toMatch(/[–—]/)
        expect(html).not.toContain('font-semibold')
    })
})
