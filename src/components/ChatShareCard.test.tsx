import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ChatShareCard } from './ChatShareCard'
import { parseChatShare } from '../lib/chat-share'

const CAR = { kind: 'CAR', title: 'Ferrari 12Cilindri', detail: 'ABG12V · Red' } as const
const HOME = {
    kind: 'HOME',
    title: '52 York Street',
    detail: 'Sydney NSW 2000',
    address: '52 York Street, Sydney NSW 2000',
    lat: -33.86683,
    lng: 151.20441,
} as const
const SHOP = {
    kind: 'SHOP',
    title: 'Ground Floor',
    detail: '52 York Street, Sydney NSW 2000',
    address: 'Ground Floor, 52 York Street, Sydney NSW 2000',
    lat: -33.86683,
    lng: 151.20441,
} as const
const BOOKING = { kind: 'BOOKING', title: 'Tyre shine and dressing', detail: 'Tue 17 Nov, 10:30 am · Mobile' } as const

/** AUTM-2199: one card for a shared car, address, shop or booking, drawn from the attachment as given. */
describe('ChatShareCard', () => {
    it('names itself by its kind and title, and draws the detail as given', () => {
        render(<ChatShareCard attachment={CAR} />)
        expect(screen.getByRole('article', { name: 'Car: Ferrari 12Cilindri' })).toBeTruthy()
        expect(screen.getByTestId('chat-share-card-title').textContent).toBe('Car: Ferrari 12Cilindri')
        expect(screen.getByTestId('chat-share-card-detail').textContent).toBe('ABG12V · Red')
    })

    it.each([
        [HOME, 'Address: 52 York Street'],
        [SHOP, 'Address: Ground Floor'],
        [BOOKING, 'Booking: Tyre shine and dressing'],
    ])('says the kind before the title (%#)', (attachment, name) => {
        render(<ChatShareCard attachment={attachment} />)
        expect(screen.getByRole('article', { name })).toBeTruthy()
    })

    it('mine is the brand bubble at the end; theirs the incoming one at the start', () => {
        const { rerender } = render(<ChatShareCard attachment={CAR} mine />)
        const card = screen.getByTestId('chat-share-card')
        expect(card.hasAttribute('data-mine')).toBe(true)
        expect(card.className).toContain('bg-[var(--message-own)]')
        expect(card.className).toContain('self-end')
        rerender(<ChatShareCard attachment={CAR} />)
        expect(card.hasAttribute('data-mine')).toBe(false)
        expect(card.className).toContain('bg-[var(--message-incoming)]')
        expect(card.className).toContain('self-start')
    })

    it('draws a sending card at 55%', () => {
        render(<ChatShareCard attachment={CAR} mine sending />)
        const card = screen.getByTestId('chat-share-card')
        expect(card.hasAttribute('data-sending')).toBe(true)
        expect(card.className).toContain('opacity-55')
    })

    describe('CAR', () => {
        it("draws the car's photo with its alt text", () => {
            render(<ChatShareCard attachment={{ ...CAR, imageUrl: 'https://cdn.example/car.jpg' }} />)
            const img = screen.getByTestId('chat-share-card-image')
            expect(img.getAttribute('src')).toBe('https://cdn.example/car.jpg')
            expect(img.getAttribute('alt')).toBe('Photo of Ferrari 12Cilindri')
            expect(screen.getByTestId('chat-share-card-picture').getAttribute('data-picture')).toBe('photo')
        })

        it('without a photo, draws the 3D car with the plate read from the detail', () => {
            render(<ChatShareCard attachment={CAR} />)
            expect(screen.getByTestId('chat-share-card-picture').getAttribute('data-picture')).toBe('art')
            const art = screen.getByTestId('chat-share-card-art')
            expect(art.getAttribute('alt')).toBe('')
            expect(art.getAttribute('src')).toMatch(/^data:image\/webp;base64,/)
            // On the plate, hidden from a screen reader: the detail line says it.
            const plate = screen.getByTestId('chat-share-card-plate')
            expect(plate.textContent).toBe('ABG12V')
            expect(plate.getAttribute('aria-hidden')).toBe('true')
        })

        it('draws no plate when the detail has none', () => {
            render(<ChatShareCard attachment={{ ...CAR, detail: '2021 · Red' }} />)
            expect(screen.queryByTestId('chat-share-card-plate')).toBeNull()
        })

        it('falls back to the 3D car and asks for a fresh URL when the photo fails', () => {
            const onImageError = vi.fn()
            render(
                <ChatShareCard attachment={{ ...CAR, imageUrl: 'https://cdn.example/expired.jpg' }} onImageError={onImageError} />,
            )
            fireEvent.error(screen.getByTestId('chat-share-card-image'))
            expect(onImageError).toHaveBeenCalledTimes(1)
            expect(screen.queryByTestId('chat-share-card-image')).toBeNull()
            expect(screen.getByTestId('chat-share-card-art')).toBeTruthy()
        })
    })

    describe('HOME and SHOP', () => {
        it('draws our own town with the purple house pin, and nothing that leaves the page', () => {
            const { container } = render(<ChatShareCard attachment={HOME} mine />)
            const picture = screen.getByTestId('chat-share-card-picture')
            expect(picture.getAttribute('data-picture')).toBe('town')
            expect(picture.querySelector('svg[data-map="town"]')?.getAttribute('aria-hidden')).toBe('true')
            expect(screen.getByTestId('chat-share-card-pin').querySelector('[data-icon="home"]')).toBeTruthy()
            // No image, no URL and no point anywhere in the card: a customer's
            // home is never sent to a map provider, nor written into the page.
            expect(container.querySelectorAll('img')).toHaveLength(0)
            expect(container.innerHTML).not.toMatch(/https?:/)
            expect(container.innerHTML).not.toContain('-33.86')
            expect(container.innerHTML).not.toContain('151.20')
        })

        it("pins the shop with the pro's logo, named for a screen reader", () => {
            render(<ChatShareCard attachment={SHOP} logoUrl="https://cdn.example/logo.png" proName="Kerbside Car Care" />)
            const logo = screen.getByTestId('chat-share-card-pin').querySelector('img')
            expect(logo?.getAttribute('src')).toBe('https://cdn.example/logo.png')
            expect(logo?.getAttribute('alt')).toBe('Kerbside Car Care logo')
        })

        it("pins the shop with the pro's initials when there is no logo", () => {
            render(<ChatShareCard attachment={SHOP} proName="Kerbside Car Care" />)
            expect(screen.getByTestId('chat-share-card-logo').textContent).toBe('KC')
        })

        it('draws the map image the consumer gives, with the pin over it', () => {
            render(<ChatShareCard attachment={SHOP} mapImageUrl="/maps/shop.png" />)
            expect(screen.getByTestId('chat-share-card-picture').getAttribute('data-picture')).toBe('map')
            expect(screen.getByTestId('chat-share-card-map').getAttribute('src')).toBe('/maps/shop.png')
            expect(screen.getByTestId('chat-share-card-pin')).toBeTruthy()
        })

        it('offers Directions in a new tab, said in full, with a 44px hit area', () => {
            render(<ChatShareCard attachment={SHOP} directionsHref="https://maps.example/?daddr=x" />)
            const link = screen.getByRole('link', {
                name: 'Directions to Ground Floor, 52 York Street, Sydney NSW 2000 (opens in a new tab)',
            })
            expect(link.getAttribute('href')).toBe('https://maps.example/?daddr=x')
            expect(link.getAttribute('target')).toBe('_blank')
            expect(link.getAttribute('rel')).toBe('noopener noreferrer')
            expect(link.getAttribute('data-testid')).toBe('chat-share-card-directions')
            // Drawn 36px (min-h-9); the pseudo-element reaches 4px past each edge: 44.
            expect(link.className).toContain('min-h-9')
            expect(link.className).toContain('before:-inset-y-1')
            expect(link.className).toContain("before:content-['']")
        })

        it('draws no Directions without a link, and none on a car or a booking', () => {
            const { rerender } = render(<ChatShareCard attachment={SHOP} />)
            expect(screen.queryByRole('link')).toBeNull()
            rerender(<ChatShareCard attachment={CAR} directionsHref="https://maps.example" />)
            expect(screen.queryByRole('link')).toBeNull()
            rerender(<ChatShareCard attachment={BOOKING} directionsHref="https://maps.example" />)
            expect(screen.queryByRole('link')).toBeNull()
        })
    })

    describe('BOOKING', () => {
        it("draws the service's photo with the pro's logo as a badge", () => {
            render(
                <ChatShareCard
                    attachment={{ ...BOOKING, imageUrl: 'https://cdn.example/service.jpg' }}
                    logoUrl="https://cdn.example/logo.png"
                    proName="Kerbside Car Care"
                />,
            )
            expect(screen.getByTestId('chat-share-card-image').getAttribute('src')).toBe('https://cdn.example/service.jpg')
            expect(screen.getByTestId('chat-share-card-image').getAttribute('alt')).toBe('')
            expect(screen.getByTestId('chat-share-card-logo').querySelector('img')?.getAttribute('alt')).toBe(
                'Kerbside Car Care logo',
            )
        })

        it("draws the pro's cover when the service has no photo", () => {
            render(<ChatShareCard attachment={BOOKING} coverUrl="https://cdn.example/cover.jpg" />)
            expect(screen.getByTestId('chat-share-card-image').getAttribute('src')).toBe('https://cdn.example/cover.jpg')
        })

        it('draws a quiet glyph and no badge when there is neither photo nor logo', () => {
            render(<ChatShareCard attachment={BOOKING} />)
            expect(screen.getByTestId('chat-share-card-picture').getAttribute('data-picture')).toBe('art')
            expect(screen.queryByTestId('chat-share-card-logo')).toBeNull()
        })
    })

    it('draws a kind it does not know as words only', () => {
        render(<ChatShareCard attachment={{ kind: 'INVOICE', title: 'Invoice 1042', detail: '$180.00' }} />)
        expect(screen.queryByTestId('chat-share-card-picture')).toBeNull()
        expect(screen.getByRole('article', { name: 'Invoice 1042' })).toBeTruthy()
    })

    it('draws an older message from its line, through parseChatShare', () => {
        const attachment = parseChatShare('Our address: Unit 4, 12 Bourke Rd, Alexandria NSW 2015')!
        render(<ChatShareCard attachment={attachment} directionsHref="https://maps.example" />)
        expect(screen.getByRole('article', { name: 'Address: Unit 4' })).toBeTruthy()
        expect(screen.getByTestId('chat-share-card-detail').textContent).toBe('12 Bourke Rd, Alexandria NSW 2015')
        expect(screen.getByRole('link').textContent).toContain('to Unit 4, 12 Bourke Rd, Alexandria NSW 2015')
    })

    it("prefixes its parts' test ids with its own", () => {
        render(<ChatShareCard attachment={SHOP} testId="chat-share-card-m42" directionsHref="https://maps.example" />)
        expect(screen.getByTestId('chat-share-card-m42')).toBeTruthy()
        expect(screen.getByTestId('chat-share-card-m42-title')).toBeTruthy()
        expect(screen.getByTestId('chat-share-card-m42-picture')).toBeTruthy()
        expect(screen.getByTestId('chat-share-card-m42-directions')).toBeTruthy()
    })
})
