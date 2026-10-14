import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { forwardRef, type AnchorHTMLAttributes } from 'react'
import { ServiceCard, ServiceCardSkeleton } from './ServiceCard'

/**
 * AUTM-1694: the card both the merchant page and the booking picker adopt.
 *
 * jsdom has no layout engine, so these assert behaviour, roles and the
 * classes that produce geometry; the geometry itself (the 4:3 photo, the
 * stacking at 19rem, 200% text) is checked in Storybook in a real browser.
 */

describe('ServiceCard photo slot', () => {
    it('renders the consumer media element in the slot, over coverImageUrl', () => {
        const { container } = render(
            <ServiceCard
                name="Wash"
                priceLabel="$80"
                coverImageUrl="https://cdn.example/should-not-render.jpg"
                media={<img data-testid="own-image" src="/optimised.jpg" alt="" />}
            />,
        )
        const slot = container.querySelector('[data-slot="media"]')
        expect(slot?.querySelector('[data-testid="own-image"]')).not.toBeNull()
        expect(container.querySelectorAll('img')).toHaveLength(1)
    })

    it('renders a plain img for coverImageUrl, at a fixed 4:3 with a cover crop', () => {
        const { container } = render(
            <ServiceCard name="Wash" priceLabel="$80" coverImageUrl="https://cdn.example/cover.jpg" />,
        )
        const slot = container.querySelector('[data-slot="media"]')
        expect(slot?.className).toContain('aspect-[4/3]')
        const img = slot?.querySelector('img')
        expect(img?.getAttribute('src')).toBe('https://cdn.example/cover.jpg')
        expect(img?.className).toContain('object-cover')
        // Decorative: the name beside it already says what it is.
        expect(img?.getAttribute('alt')).toBe('')
    })

    it('with no photo, shows the designed panel with the service\'s own figure, not a glyph tile', () => {
        const { container } = render(<ServiceCard name="Wash" priceLabel="$80" durationLabel="45 min" />)
        const panel = container.querySelector('[data-slot="media-fallback"]')
        expect(panel).not.toBeNull()
        expect(panel?.getAttribute('aria-hidden')).toBe('true')
        expect(panel?.textContent).toBe('45 min')
        expect(container.querySelector('img')).toBeNull()
        // The retired AUTM-1211 car glyph stays retired.
        expect(container.querySelector('svg path[d^="M4 13"]')).toBeNull()
    })

    it('prefers working days over a duration on a multi-day job', () => {
        const { container } = render(
            <ServiceCard name="Ceramic coating" priceLabel="$900" workingDaysLabel="3 working days" />,
        )
        expect(container.querySelector('[data-slot="media-fallback"]')?.textContent).toBe('3 working days')
    })

    it('falls back to the panel when the photo fails to load', () => {
        const { container } = render(
            <ServiceCard name="Wash" priceLabel="$80" durationLabel="45 min" coverImageUrl="https://cdn.example/404.jpg" />,
        )
        fireEvent.error(container.querySelector('img') as HTMLImageElement)
        expect(container.querySelector('img')).toBeNull()
        expect(container.querySelector('[data-slot="media-fallback"]')).not.toBeNull()
    })

    it('gives a new photo its own chance after one failed', () => {
        const { container, rerender } = render(
            <ServiceCard name="Wash" priceLabel="$80" coverImageUrl="https://cdn.example/404.jpg" />,
        )
        fireEvent.error(container.querySelector('img') as HTMLImageElement)
        expect(container.querySelector('img')).toBeNull()
        rerender(<ServiceCard name="Wash" priceLabel="$80" coverImageUrl="https://cdn.example/new.jpg" />)
        expect(container.querySelector('img')?.getAttribute('src')).toBe('https://cdn.example/new.jpg')
    })

    it('takes a consumer fallback in place of the panel', () => {
        const { container } = render(
            <ServiceCard name="Wash" priceLabel="$80" fallback={<span data-testid="own-fallback" />} />,
        )
        expect(container.querySelector('[data-testid="own-fallback"]')).not.toBeNull()
        expect(container.querySelector('[data-slot="media-fallback"]')).toBeNull()
    })
})

describe('ServiceCard link mode (merchant page)', () => {
    it('is one link, named by the service, described by its meta and price', () => {
        render(
            <ServiceCard
                name="Exterior wash"
                priceLabel="$80"
                durationLabel="45 min"
                href="/m/abc/book/checkout?serviceId=s1"
                actionLabel="Book"
                testIds={{ action: 'merchant-profile-service-book', price: 'merchant-profile-service-price' }}
            />,
        )
        const links = screen.getAllByRole('link')
        expect(links).toHaveLength(1)
        const link = links[0]
        expect(link).toHaveAccessibleName('Exterior wash')
        expect(link).toHaveAccessibleDescription(/45 min/)
        expect(link).toHaveAccessibleDescription(/\$80/)
        expect(link.getAttribute('href')).toBe('/m/abc/book/checkout?serviceId=s1')
        expect(link.getAttribute('data-testid')).toBe('merchant-profile-service-book')
        expect(screen.getByTestId('merchant-profile-service-price').textContent).toBe('$80')
        // The Book pill is a picture of the action; the card is the link.
        expect(screen.getByText('Book').getAttribute('aria-hidden')).toBe('true')
        // The hit area stretches over the card.
        expect(link.className).toContain('after:absolute')
        expect(link.className).toContain('after:inset-0')
    })

    it('renders through the consumer link component', () => {
        const FakeLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
            function FakeLink(props, ref) {
                return <a ref={ref} data-fake-link="" {...props} />
            },
        )
        const { container } = render(<ServiceCard name="Wash" priceLabel="$80" as={FakeLink} href="/x" />)
        expect(container.querySelector('a[data-fake-link]')).not.toBeNull()
    })

    it('still honours the deprecated trailingLabel', () => {
        render(<ServiceCard name="Wash" priceLabel="$80" href="/x" trailingLabel="Book this" />)
        expect(screen.getByText('Book this')).toBeTruthy()
    })

    it('is neither a link nor a radio with no href and no onSelect', () => {
        render(<ServiceCard name="Wash" priceLabel="$80" actionLabel="Book" />)
        expect(screen.queryByRole('link')).toBeNull()
        expect(screen.queryByRole('radio')).toBeNull()
        // No pill promising an action that is not there.
        expect(screen.queryByText('Book')).toBeNull()
    })
})

describe('ServiceCard hit area (AUTM-1786)', () => {
    /* The hit test itself needs a real browser: ServiceCard.browser.test.tsx.
       These pin the classes that make it, and the backstop's decisions. */
    const LinkCard = ({ onOpen }: { onOpen: (trusted: boolean) => void }) => {
        const Recording = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
            function Recording(props, ref) {
                return (
                    <a
                        ref={ref}
                        {...props}
                        onClick={(event) => {
                            event.preventDefault()
                            onOpen(event.nativeEvent.isTrusted)
                        }}
                    />
                )
            },
        )
        return (
            <ServiceCard
                name="Interior steam clean"
                description="Hot-water extraction on carpets and cloth seats."
                priceLabel="$188.82"
                coverImageUrl="https://cdn.example/interior.jpg"
                href="/x"
                as={Recording}
                testIds={{ price: 'price' }}
            />
        )
    }

    it('pins the link so a consumer press cannot shrink its hit area to the name', () => {
        render(<ServiceCard name="Wash" priceLabel="$80" href="/x" />)
        const link = screen.getByRole('link')
        for (const pin of ['static!', 'transform-none!', 'scale-none!', 'translate-none!', 'rotate-none!']) {
            expect(link.className.split(' ')).toContain(pin)
        }
    })

    it('reaches out by what the card press takes in, only while pressed', () => {
        render(<ServiceCard name="Wash" priceLabel="$80" href="/x" />)
        const classes = screen.getByRole('link').className.split(' ')
        expect(classes).toContain('after:inset-0')
        expect(classes).toContain('motion-safe:active:after:inset-[calc((1_-_1/0.985)*50%)]')
        // The press it compensates: change the two together.
        const card = screen.getByRole('link').closest('[data-slot="service-card"]') as HTMLElement
        expect(card.className).toContain('motion-safe:has-[[data-hit]:active]:scale-[0.985]')
    })

    it('forwards a click on the photo, the description or the price to the link, once each', () => {
        const onOpen = vi.fn()
        const { container } = render(<LinkCard onOpen={onOpen} />)
        fireEvent.click(container.querySelector('[data-slot="media"] img') as Element)
        fireEvent.click(screen.getByText('Hot-water extraction on carpets and cloth seats.'))
        fireEvent.click(screen.getByTestId('price'))
        expect(onOpen).toHaveBeenCalledTimes(3)
    })

    it('carries the modifier keys, so Cmd-click still opens a new tab', () => {
        const seen: boolean[] = []
        const Recording = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
            function Recording(props, ref) {
                return (
                    <a
                        ref={ref}
                        {...props}
                        onClick={(event) => {
                            event.preventDefault()
                            seen.push(event.metaKey)
                        }}
                    />
                )
            },
        )
        const { container } = render(<ServiceCard name="Wash" priceLabel="$80" href="/x" as={Recording} />)
        fireEvent.click(container.querySelector('[data-slot="media"]') as Element, { metaKey: true })
        expect(seen).toEqual([true])
    })

    it('never doubles a click the link took itself', () => {
        const onOpen = vi.fn()
        render(<LinkCard onOpen={onOpen} />)
        fireEvent.click(screen.getByRole('link'))
        expect(onOpen).toHaveBeenCalledTimes(1)
    })

    it('leaves a click on More to More', () => {
        const onOpen = vi.fn()
        render(
            <ServiceCard
                name="Wash"
                priceLabel="$80"
                href="/x"
                description="Long enough to clamp."
                as={forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(function R(props, ref) {
                    return <a ref={ref} {...props} onClick={(e) => (e.preventDefault(), onOpen())} />
                })}
            />,
        )
        // jsdom measures nothing, so More only shows once it is forced open
        // in a real browser; any button in the card stands in for it here.
        const card = screen.getByRole('link').closest('[data-slot="service-card"]') as HTMLElement
        const button = document.createElement('button')
        card.querySelector('[data-slot="media"]')?.append(button)
        fireEvent.click(button)
        expect(onOpen).not.toHaveBeenCalled()
    })

    it('leaves a click alone after a text selection in the card', () => {
        const onOpen = vi.fn()
        render(<LinkCard onOpen={onOpen} />)
        const text = screen.getByText('Hot-water extraction on carpets and cloth seats.')
        const range = document.createRange()
        range.selectNodeContents(text)
        window.getSelection()?.removeAllRanges()
        window.getSelection()?.addRange(range)
        fireEvent.click(text)
        window.getSelection()?.removeAllRanges()
        expect(onOpen).not.toHaveBeenCalled()
    })

    it('selects through the label when the click lands elsewhere on a picker card', () => {
        const onSelect = vi.fn()
        const { container } = render(
            <ServiceCard name="Wash" priceLabel="$80" groupName="g" value="s1" onSelect={onSelect} />,
        )
        fireEvent.click(container.querySelector('[data-slot="media"]') as Element)
        // Once, through the label and its radio; `selected` is the consumer's.
        expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('forwards nothing on a static card', () => {
        const { container } = render(<ServiceCard name="Wash" priceLabel="$80" />)
        const card = container.querySelector('[data-slot="service-card"]') as HTMLElement
        expect(() => fireEvent.click(card)).not.toThrow()
        expect(card.querySelector('[data-hit]')).toBeNull()
    })
})

describe('ServiceCard select mode (booking picker)', () => {
    function Picker({ onSelect, selected }: { onSelect: (id: string) => void; selected: string | null }) {
        return (
            <div role="radiogroup" aria-label="Services">
                {['s1', 's2'].map((id) => (
                    <ServiceCard
                        key={id}
                        name={id === 's1' ? 'Exterior wash' : 'Interior steam clean'}
                        priceLabel="$80"
                        durationLabel="45 min"
                        groupName="service"
                        value={id}
                        selected={selected === id}
                        onSelect={() => onSelect(id)}
                        testIds={{ action: `service-${id}` }}
                    />
                ))}
            </div>
        )
    }

    it('is a real radio group, named by the service', () => {
        render(<Picker onSelect={() => {}} selected="s2" />)
        const radios = screen.getAllByRole('radio')
        expect(radios).toHaveLength(2)
        expect(radios[0]).toHaveAccessibleName('Exterior wash')
        expect(radios[0]).not.toBeChecked()
        expect(radios[1]).toBeChecked()
        expect(radios[0].getAttribute('name')).toBe('service')
        expect(radios[1].getAttribute('name')).toBe('service')
        expect(radios[1].getAttribute('value')).toBe('s2')
        expect(radios[0]).toHaveAccessibleDescription(/45 min/)
    })

    it('selects when the card is clicked, and paints the chosen card', async () => {
        const onSelect = vi.fn()
        const user = userEvent.setup()
        const { container, rerender } = render(<Picker onSelect={onSelect} selected={null} />)
        await user.click(screen.getByText('Interior steam clean'))
        expect(onSelect).toHaveBeenCalledWith('s2')
        rerender(<Picker onSelect={onSelect} selected="s2" />)
        const cards = container.querySelectorAll('[data-slot="service-card"]')
        expect(cards[1].getAttribute('data-selected')).toBe('true')
        expect(cards[1].className).toContain('bg-[var(--selected)]')
        expect(cards[0].hasAttribute('data-selected')).toBe(false)
    })

    it('selects from the keyboard', async () => {
        const onSelect = vi.fn()
        const user = userEvent.setup()
        render(<Picker onSelect={onSelect} selected={null} />)
        screen.getByTestId('service-s1').focus()
        await user.keyboard(' ')
        expect(onSelect).toHaveBeenCalledWith('s1')
    })
})

describe('ServiceCard description', () => {
    const LONG =
        'Two-bucket hand wash, wheel faces and barrels, iron fallout removal, clay bar on the paint, a sealant that lasts three months, glass inside and out, tyre dressing.'

    let restore: () => void
    beforeEach(() => {
        // Pretend the clamped paragraph overflows; jsdom has no layout.
        const sh = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight')
        const ch = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')
        Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
            configurable: true,
            get() {
                return (this as HTMLElement).classList.contains('line-clamp-2') ? 80 : 40
            },
        })
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 40 })
        // Both live on Element.prototype, so the override is an own property
        // of HTMLElement.prototype that restoring simply deletes.
        restore = () => {
            if (sh) Object.defineProperty(HTMLElement.prototype, 'scrollHeight', sh)
            else delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollHeight
            if (ch) Object.defineProperty(HTMLElement.prototype, 'clientHeight', ch)
            else delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientHeight
        }
    })
    afterEach(() => restore())

    it('clamps at two lines and offers More only when the text is cut', async () => {
        const user = userEvent.setup()
        render(<ServiceCard name="Full wash" priceLabel="$120" description={LONG} />)
        const toggle = screen.getByRole('button', { name: 'More about Full wash' })
        expect(toggle).toHaveAttribute('aria-expanded', 'false')
        const text = screen.getByText(LONG)
        expect(text.className).toContain('line-clamp-2')
        // AUTM-1848: collapsed, More is laid over the second line's end and
        // takes no room, so it can appear after hydration without moving the
        // card. The line fades under it.
        expect(toggle.className.split(' ')).toContain('absolute')
        expect(text).toHaveAttribute('data-clamped', 'true')
        expect(text.style.maskImage || text.style.getPropertyValue('-webkit-mask-image')).toContain('linear-gradient')
        await user.click(toggle)
        expect(screen.getByRole('button', { name: 'Less about Full wash' })).toHaveAttribute('aria-expanded', 'true')
        expect(text.className).not.toContain('line-clamp-2')
        // Open, Less sits in the flow under the whole text, unmasked.
        expect(toggle.className.split(' ')).not.toContain('absolute')
        expect(text).not.toHaveAttribute('data-clamped')
        expect(text.style.maskImage).toBe('')
        // The same button, so focus stays on it.
        expect(screen.getByRole('button', { name: 'Less about Full wash' })).toBe(toggle)
    })

    it('reading more never selects the card', async () => {
        const onSelect = vi.fn()
        const user = userEvent.setup()
        render(<ServiceCard name="Full wash" priceLabel="$120" description={LONG} onSelect={onSelect} groupName="g" />)
        const toggle = screen.getByRole('button', { name: /More/ })
        // It sits above the stretched hit area.
        expect(toggle.className).toContain('z-[2]')
        await user.click(toggle)
        expect(onSelect).not.toHaveBeenCalled()
        expect(screen.getByRole('radio')).not.toBeChecked()
    })

    it('reading more never follows the link', async () => {
        const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault())
        const user = userEvent.setup()
        const Spy = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(function Spy(props, ref) {
            return <a ref={ref} {...props} onClick={onClick} />
        })
        render(<ServiceCard name="Full wash" priceLabel="$120" description={LONG} as={Spy} href="/x" />)
        await user.click(screen.getByRole('button', { name: /More/ }))
        expect(onClick).not.toHaveBeenCalled()
    })

    it('shows no toggle for a description that fits', () => {
        restore()
        render(<ServiceCard name="Wash" priceLabel="$80" description="Hand wash and dry." />)
        expect(screen.queryByRole('button')).toBeNull()
    })
})

describe('ServiceCard price, chips and copy', () => {
    it('shows a single price and words no fee of its own', () => {
        const { container } = render(<ServiceCard name="Wash" priceLabel="$80" />)
        expect(container.textContent).toContain('$80')
        expect(container.textContent?.toLowerCase()).not.toContain('fee')
        expect(container.querySelector('dl')).toBeNull()
    })

    it('shows the consumer\'s price lines under the total, in the consumer\'s words', () => {
        render(
            <ServiceCard
                name="Wash"
                priceLabel="$83.92"
                priceLines={[
                    { label: 'Service', value: '$80' },
                    { label: '+ booking fee', value: '$3.92' },
                ]}
                testIds={{ price: 'booking-service-price', priceLines: 'booking-service-price-parts' }}
            />,
        )
        // Exactly the text customer-web's listing-price spec reads today.
        expect(screen.getByTestId('booking-service-price').textContent).toBe('$83.92')
        expect(screen.getByTestId('booking-service-price-parts').textContent).toBe('Service $80 + booking fee $3.92')
    })

    it('sets the total larger and heavier than its parts', () => {
        render(
            <ServiceCard
                name="Wash"
                priceLabel="$83.92"
                priceLines={[{ label: 'Service', value: '$80' }]}
                testIds={{ price: 'p', priceLines: 'parts' }}
            />,
        )
        expect(screen.getByTestId('p').parentElement?.className).toMatch(/text-lg font-bold/)
        expect(screen.getByTestId('parts').className).toContain('text-[0.8125rem]')
        expect(screen.getByTestId('parts').className).not.toMatch(/font-(bold|medium)/)
    })

    it('renders duration, working days and consumer chips, each locatable', () => {
        render(
            <ServiceCard
                name="Ceramic coating"
                priceLabel="$900"
                workingDaysLabel="3 working days"
                chips={[{ label: 'Drop off at the workshop', testId: 'booking-service-dropoff-tag' }]}
                testIds={{ workingDays: 'booking-service-working-days' }}
            />,
        )
        // Each chip's text is exactly its label, as the multi-day spec reads it.
        expect(screen.getByTestId('booking-service-working-days').textContent).toBe('3 working days')
        expect(screen.getByTestId('booking-service-dropoff-tag').textContent).toBe('Drop off at the workshop')
    })

    it('reads the chips as one line, the way the product writes it', () => {
        const { container } = render(
            <ServiceCard
                name="Ceramic coating"
                priceLabel="$900"
                workingDaysLabel="3 working days"
                chips={[{ label: 'Drop off at the workshop' }]}
            />,
        )
        expect(container.textContent).toContain('3 working days · Drop off at the workshop')
    })

    it('keeps labels in sentence case and carries no em or en dash', () => {
        const { container } = render(
            <ServiceCard
                name="Wash"
                priceLabel="$120"
                pricePrefix="From"
                durationLabel="45 min"
                addonsHint="+2 add-ons available"
                href="/x"
                actionLabel="Book"
            />,
        )
        // No letterspaced uppercase. `tracking-normal` on the name is the
        // opposite: it undoes a consumer heading rule's negative tracking.
        expect(container.innerHTML).not.toMatch(/uppercase|tracking-(wide|wider|widest|\[)/)
        expect(container.innerHTML).not.toMatch(/[–—]/)
        expect(container.textContent).toContain('From')
    })

    it('uses rem type, never a pixel font size', () => {
        const { container } = render(
            <ServiceCard name="Wash" priceLabel="$80" durationLabel="45 min" priceLines={[{ label: 'Service', value: '$80' }]} />,
        )
        expect(container.innerHTML).not.toMatch(/text-\[\d+px\]/)
    })
})

describe('ServiceCard motion', () => {
    it('staggers its entrance by its index', () => {
        const { container } = render(<ServiceCard name="Wash" priceLabel="$80" revealIndex={3} />)
        const card = container.querySelector('[data-slot="service-card"]') as HTMLElement
        expect(card.className).toContain('service-card-reveal')
        expect(card.style.getPropertyValue('--service-card-index')).toBe('3')
    })

    it('does not animate unless asked', () => {
        const { container } = render(<ServiceCard name="Wash" priceLabel="$80" />)
        expect(container.querySelector('.service-card-reveal')).toBeNull()
    })

    it('presses and zooms only under motion-safe, and only when it is a control', () => {
        const { container, rerender } = render(<ServiceCard name="Wash" priceLabel="$80" href="/x" />)
        expect(container.innerHTML).toContain('motion-safe:has-[[data-hit]:active]:scale-[0.985]')
        expect(container.innerHTML).toContain('motion-safe:group-hover/service:scale-[1.04]')
        rerender(<ServiceCard name="Wash" priceLabel="$80" />)
        expect(container.innerHTML).not.toContain('scale-[')
    })
})

describe('ServiceCardSkeleton', () => {
    it('is silent by default, because a list renders several', () => {
        const { container } = render(<ServiceCardSkeleton />)
        const el = container.firstElementChild as HTMLElement
        expect(el.getAttribute('aria-hidden')).toBe('true')
        expect(screen.queryByRole('status')).toBeNull()
    })

    it('announces when given a label', () => {
        render(<ServiceCardSkeleton layout="vertical" label="Loading services" />)
        expect(screen.getByRole('status')).toHaveTextContent('Loading services')
    })
})

describe('ServiceCard name survives a consumer heading rule', () => {
    /**
     * merchant-mobile and customer-web both set colour, line-height and
     * letter-spacing on h1 to h6 with an unlayered rule, which beats any
     * Tailwind utility on the heading itself. The name's ink therefore has to
     * live on the element inside the heading, or a selected card paints its
     * name ink on deep purple.
     */
    it.each([
        ['link', { href: '/x' }],
        ['select', { onSelect: () => {}, groupName: 'g' }],
        ['static', {}],
    ] as const)('%s mode puts the ink inside the heading, not on it', (_mode, props) => {
        render(<ServiceCard name="Wash" priceLabel="$80" selected {...props} />)
        const heading = screen.getByRole('heading', { name: 'Wash' })
        expect(heading.className).not.toMatch(/text-\[var/)
        const inner = heading.firstElementChild as HTMLElement
        expect(inner.className).toContain('text-[var(--on-selected)]')
        expect(inner.className).toContain('tracking-normal')
        expect(inner.className).toContain('leading-snug')
    })
})


describe('ServiceCard menu layout (AUTM-1866)', () => {
    /* Don, 2026-10-14: text left, photo right; one meta line; two lines of
       description and no More; the all-in total with the fee on one small
       line; a quiet Book that is its own control. Geometry (the photo's
       column, the 16rem reflow, 200% text) is in ServiceCard.browser.test.tsx. */
    const Recording = (record: (what: string) => void, tag: string) =>
        forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(function Recording(props, ref) {
            return (
                <a
                    ref={ref}
                    {...props}
                    onClick={(event) => {
                        event.preventDefault()
                        record(`${tag} ${props.href}`)
                    }}
                />
            )
        })

    const menuProps = {
        layout: 'menu' as const,
        name: 'Tyre shine',
        description: 'Tyres cleaned and dressed with a water-based shine that dries to a satin finish.',
        durationLabel: '15 min',
        locationLabel: 'At the workshop',
        priceLabel: '$10.99',
        priceNote: 'incl. $0.99 booking fee',
    }

    it('puts the photo in the right-hand column, square, inset like the card', () => {
        const { container } = render(<ServiceCard {...menuProps} coverImageUrl="https://cdn.example/tyre.jpg" />)
        const media = container.querySelector('[data-slot="media"]') as HTMLElement
        const classes = media.className.split(' ')
        for (const c of ['@min-[16rem]:col-start-2', '@min-[16rem]:aspect-square', '@min-[16rem]:w-[min(30cqi,8.5rem)]']) {
            expect(classes).toContain(c)
        }
        expect(classes).not.toContain('aspect-[4/3]')
        expect(media.querySelector('img')?.getAttribute('alt')).toBe('')
    })

    it('with no photo draws no placeholder, and the text takes the full width', () => {
        const { container } = render(
            <ServiceCard {...menuProps} fallback={<span data-testid="own-fallback" />} noPhotoLabel="No photo yet" />,
        )
        expect(container.querySelector('[data-slot="media"]')).toBeNull()
        expect(container.querySelector('[data-slot="media-fallback"]')).toBeNull()
        expect(container.querySelector('[data-testid="own-fallback"]')).toBeNull()
        expect(container.textContent).not.toContain('No photo yet')
        const content = screen.getByRole('heading').parentElement as HTMLElement
        expect(content.className).toContain('@min-[16rem]:col-span-2')
    })

    it('drops the photo box when the photo fails to load', () => {
        const { container } = render(<ServiceCard {...menuProps} coverImageUrl="https://cdn.example/404.jpg" />)
        fireEvent.error(container.querySelector('img') as HTMLImageElement)
        expect(container.querySelector('[data-slot="media"]')).toBeNull()
    })

    it('sets the name in Satoshi 500, inside the heading', () => {
        render(<ServiceCard {...menuProps} href="/x" />)
        const inner = screen.getByRole('heading', { name: 'Tyre shine' }).firstElementChild as HTMLElement
        expect(inner.className).toContain('font-medium')
        expect(inner.className).not.toContain('font-bold')
    })

    it('writes duration and where as ONE meta line, each part locatable, no chips, no icons', () => {
        const { container } = render(
            <ServiceCard
                {...menuProps}
                testIds={{ duration: 'booking-service-duration', location: 'booking-service-location' }}
            />,
        )
        const meta = container.querySelector('[data-slot="meta"]') as HTMLElement
        expect(meta.tagName).toBe('P')
        expect(meta.textContent).toBe('15 min · At the workshop')
        expect(screen.getByTestId('booking-service-duration').textContent).toBe('15 min')
        expect(screen.getByTestId('booking-service-location').textContent).toBe('At the workshop')
        expect(meta.querySelector('svg')).toBeNull()
        expect(meta.innerHTML).not.toContain('rounded-full')
    })

    it('keeps the multi-day words and the drop-off tag on the same line', () => {
        render(
            <ServiceCard
                {...menuProps}
                durationLabel={null}
                locationLabel={null}
                workingDaysLabel="3 working days"
                chips={[{ label: 'Drop off at the workshop', testId: 'merchant-profile-service-dropoff-tag', icon: <svg /> }]}
                testIds={{ workingDays: 'merchant-profile-service-working-days' }}
            />,
        )
        expect(screen.getByTestId('merchant-profile-service-working-days').textContent).toBe('3 working days')
        expect(screen.getByTestId('merchant-profile-service-dropoff-tag').textContent).toBe('Drop off at the workshop')
        expect(screen.getByTestId('merchant-profile-service-dropoff-tag').parentElement?.textContent).toBe(
            '3 working days · Drop off at the workshop',
        )
    })

    it('clamps the description at two lines with no More, the full text still in the DOM', () => {
        const long = 'Hot-water extraction on carpets and cloth seats. '.repeat(8).trim()
        const { container } = render(
            <ServiceCard {...menuProps} description={long} testIds={{ descriptionToggle: 'more' }} />,
        )
        const desc = container.querySelector('[data-slot="description"]') as HTMLElement
        expect(desc.className).toContain('line-clamp-2')
        expect(desc.textContent).toBe(long)
        expect(screen.queryByTestId('more')).toBeNull()
        expect(screen.queryByRole('button')).toBeNull()
    })

    it('leads with the all-in total and says the fee on one small line under it', () => {
        render(
            <ServiceCard
                {...menuProps}
                priceLines={[{ label: 'Service', value: '$10' }, { label: '+ booking fee', value: '$0.99' }]}
                testIds={{ price: 'merchant-profile-service-price', priceLines: 'merchant-profile-service-price-parts' }}
            />,
        )
        const total = screen.getByTestId('merchant-profile-service-price')
        expect(total.textContent).toBe('$10.99')
        expect(total.parentElement?.className).toContain('font-bold')
        // The note takes the price-lines id, so QA's locator still resolves.
        const note = screen.getByTestId('merchant-profile-service-price-parts')
        expect(note.textContent).toBe('incl. $0.99 booking fee')
        expect(note.className).toContain('text-[0.8125rem]')
        expect(note.className).not.toMatch(/font-(bold|medium)/)
        // One line, not the two-line breakdown.
        expect(screen.queryByText('Service $10')).toBeNull()
    })

    it('gives the note its own test id when one is passed', () => {
        render(<ServiceCard {...menuProps} testIds={{ priceLines: 'parts', priceNote: 'note' }} />)
        expect(screen.getByTestId('note').textContent).toBe('incl. $0.99 booking fee')
        expect(screen.queryByTestId('parts')).toBeNull()
    })

    it('shows the price alone when no fee is charged', () => {
        const { container } = render(<ServiceCard {...menuProps} priceLabel="$10" priceNote={null} />)
        expect(container.querySelector('[data-slot="price-note"]')).toBeNull()
        expect(container.textContent?.toLowerCase()).not.toContain('fee')
    })

    it('makes Book its own link: a second focus stop, named for the service, described by the price', async () => {
        const user = userEvent.setup()
        render(
            <ServiceCard
                {...menuProps}
                href="/m/abc/services/tyre"
                bookHref="/m/abc/book/checkout?serviceId=tyre"
                testIds={{ action: 'merchant-profile-service-open', book: 'merchant-profile-service-book' }}
            />,
        )
        const links = screen.getAllByRole('link')
        expect(links).toHaveLength(2)
        const [card, book] = links
        expect(card).toHaveAccessibleName('Tyre shine')
        expect(book).toHaveAccessibleName('Book Tyre shine')
        expect(book).toHaveAccessibleDescription(/\$10\.99.*incl\. \$0\.99 booking fee/)
        expect(book.getAttribute('href')).toBe('/m/abc/book/checkout?serviceId=tyre')
        expect(book.getAttribute('data-testid')).toBe('merchant-profile-service-book')
        await user.tab()
        expect(document.activeElement).toBe(card)
        await user.tab()
        expect(document.activeElement).toBe(book)
    })

    it('never lets the card swallow a click on Book, and still opens the card everywhere else', () => {
        const seen: string[] = []
        const Link = Recording((what) => seen.push(what), 'link')
        const { container } = render(
            <ServiceCard
                {...menuProps}
                coverImageUrl="https://cdn.example/tyre.jpg"
                href="/open"
                bookHref="/book"
                as={Link}
                testIds={{ book: 'book' }}
            />,
        )
        fireEvent.click(screen.getByTestId('book'))
        expect(seen).toEqual(['link /book'])
        fireEvent.click(container.querySelector('[data-slot="media"] img') as Element)
        fireEvent.click(container.querySelector('[data-slot="description"]') as Element)
        expect(seen).toEqual(['link /book', 'link /open', 'link /open'])
    })

    it('takes onBook and onOpen as buttons, each to its own handler', () => {
        const onOpen = vi.fn()
        const onBook = vi.fn()
        const { container } = render(<ServiceCard {...menuProps} onOpen={onOpen} onBook={onBook} />)
        const open = screen.getByRole('button', { name: 'Tyre shine' })
        expect(open).toHaveAccessibleDescription(/15 min · At the workshop/)
        fireEvent.click(screen.getByRole('button', { name: 'Book Tyre shine' }))
        expect(onBook).toHaveBeenCalledTimes(1)
        expect(onOpen).not.toHaveBeenCalled()
        fireEvent.click(container.querySelector('[data-slot="description"]') as Element)
        expect(onOpen).toHaveBeenCalledTimes(1)
        expect(onBook).toHaveBeenCalledTimes(1)
        // The open button is pinned like the link, so a consumer press cannot shrink its hit area.
        expect(open.className.split(' ')).toContain('scale-none!')
    })

    it('draws Book as a quiet pill, 44px, never ink, lime or white', () => {
        render(<ServiceCard {...menuProps} href="/x" bookHref="/b" testIds={{ book: 'book' }} />)
        const book = screen.getByTestId('book')
        const classes = book.className
        expect(classes).toContain('min-h-11')
        expect(classes).toContain('bg-[var(--band-press)]')
        expect(classes).toContain('font-medium')
        expect(classes).not.toMatch(/var\(--(strong|lime|raised|cta-fill|paper)\)/)
        expect(classes).not.toMatch(/#[0-9a-f]{3,8}/i)
        // A pointer on Book does not light the card up as the card's own press.
        const card = book.closest('[data-slot="service-card"]') as HTMLElement
        expect(card.className).toContain('[&:hover:not(:has([data-slot=book]:hover))]:bg-[var(--band-press)]')
    })

    it('draws the action pill as a picture when the card itself is the target', () => {
        render(<ServiceCard {...menuProps} href="/x" actionLabel="Book" />)
        expect(screen.getAllByRole('link')).toHaveLength(1)
        const pill = screen.getByText('Book')
        expect(pill.getAttribute('aria-hidden')).toBe('true')
        expect(pill.className).toContain('min-h-11')
    })

    it('stays a radio in the picker, with its state light and no Book', () => {
        const onSelect = vi.fn()
        const { container } = render(
            <ServiceCard {...menuProps} groupName="g" value="tyre" onSelect={onSelect} testIds={{ action: 'radio' }} />,
        )
        expect(screen.getByRole('radio', { name: 'Tyre shine' })).toHaveAccessibleDescription(
            /15 min · At the workshop.*\$10\.99/,
        )
        expect(screen.queryByText('Book')).toBeNull()
        fireEvent.click(container.querySelector('[data-slot="description"]') as Element)
        expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('puts a status on the text when there is no photo corner to hold it', () => {
        render(<ServiceCard {...menuProps} status={{ label: 'Draft', tone: 'draft' }} testIds={{ status: 's' }} />)
        const status = screen.getByTestId('s')
        expect(status.closest('[data-slot="media"]')).toBeNull()
        expect(status.textContent).toBe('Draft.')
    })

    it('uses rem type and tokens only, and no em or en dash', () => {
        const { container } = render(
            <ServiceCard {...menuProps} coverImageUrl="https://cdn.example/t.jpg" href="/x" bookHref="/b" />,
        )
        expect(container.innerHTML).not.toMatch(/text-\[\d+px\]/)
        expect(container.innerHTML).not.toMatch(/(bg|text|border)-\[#/)
        expect(container.innerHTML).not.toMatch(/[–—]/)
        expect(container.innerHTML).not.toContain('font-semibold')
    })

    it('has a skeleton of its own shape', () => {
        const { container } = render(<ServiceCardSkeleton layout="menu" />)
        expect(container.innerHTML).toContain('@min-[16rem]:aspect-square')
        expect(container.innerHTML).toContain('h-11')
    })
})
