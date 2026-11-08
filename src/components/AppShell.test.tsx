import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { forwardRef, type AnchorHTMLAttributes } from 'react'
import { AppBar } from './AppBar'
import { AppTabBar } from './AppTabBar'
import { ActionBar } from './ActionBar'
import { ListSection, ListSectionRow } from './ListSection'

/**
 * AUTM-1781: the signed-in app shell. These pin behaviour and the classes
 * that make the geometry (jsdom has no layout engine; the real measurements
 * are customer-web's Playwright suite at 390, 834, 1194 and 1440).
 */

/** A stand-in for a framework link: the components never import a router. */
const FakeLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }>(
    function FakeLink({ to, ...rest }, ref) {
        return <a ref={ref} href={to} data-router="" {...rest} />
    },
)

const Glyph = () => <svg aria-hidden="true" />

describe('AppTabBar (AUTM-1781)', () => {
    const items = [
        { key: 'bookings', label: 'Bookings', icon: <Glyph />, element: <FakeLink to="/account/bookings" />, badge: 1, badgeLabel: '1 payment due' },
        { key: 'messages', label: 'Messages', icon: <Glyph />, href: '/account/inbox', badge: 3, badgeLabel: '3 unread', active: true },
        { key: 'account', label: 'Account', icon: <Glyph />, href: '/account', badge: 0 },
    ]

    it('is a named navigation landmark, one link per destination', () => {
        render(<AppTabBar items={items} label="Account" />)
        const nav = screen.getByRole('navigation', { name: 'Account' })
        expect(within(nav).getAllByRole('link')).toHaveLength(3)
    })

    it('says the count with the label, and marks the current tab', () => {
        render(<AppTabBar items={items} />)
        expect(screen.getByRole('link', { name: 'Messages, 3 unread' })).toHaveAttribute('aria-current', 'page')
        expect(screen.getByRole('link', { name: 'Bookings, 1 payment due' })).not.toHaveAttribute('aria-current')
        // A zero count draws nothing and says nothing.
        expect(screen.getByRole('link', { name: 'Account' })).toBeInTheDocument()
    })

    it('clones the content into a framework link and keeps its own props', () => {
        render(<AppTabBar items={items} />)
        const link = screen.getByTestId('app-tab-bookings')
        expect(link).toHaveAttribute('data-router')
        expect(link).toHaveAttribute('href', '/account/bookings')
    })

    it('caps a big count at 99+', () => {
        render(<AppTabBar items={[{ ...items[1], badge: 140 }]} />)
        expect(screen.getByText('99+')).toBeInTheDocument()
    })

    it('the dock floats above the bottom edge, clear of the home indicator, on ink', () => {
        render(<AppTabBar items={items} />)
        const nav = screen.getByRole('navigation')
        expect(nav.className).toContain('fixed')
        expect(nav.className).toContain('bottom-0')
        expect(nav.className).toContain('pb-[calc(1rem+env(safe-area-inset-bottom))]')
        expect(nav.className).toContain('md:hidden')
        expect(nav.querySelector('[data-tab-track]')?.className).toContain('bg-[var(--surface-inverse)]')
    })

    it('an inactive tab is a 56 by 52 icon whose name stays in the tree; the current one opens into the lime pill', () => {
        render(<AppTabBar items={items} />)
        const account = screen.getByTestId('app-tab-account')
        expect(account.className).toContain('h-[52px]')
        // 56px in px (AUTM-1816): large text grows the words, not the tabs.
        expect(account.className).toContain('w-[56px]')
        // Its name is visually hidden, never removed: it is still the link's name.
        expect(within(account).getByText('Account').className).toContain('sr-only')
        const messages = screen.getByTestId('app-tab-messages')
        expect(messages.querySelector('[data-tab-pill]')?.className).toContain('bg-[var(--lime)]')
        expect(within(messages).getByText('Messages').className).not.toContain('sr-only')
        // Only the current tab carries the pill.
        expect(account.querySelector('[data-tab-pill]')).toBeNull()
    })

    it('the count is a brand disc ringed in the colour behind it', () => {
        render(<AppTabBar items={items} />)
        const onInk = within(screen.getByTestId('app-tab-bookings')).getByText('1')
        expect(onInk).toHaveAttribute('data-tab-count', 'count')
        expect(onInk.className).toContain('bg-[var(--brand)]')
        expect(onInk.className).toContain('border-[var(--surface-inverse)]')
        // Inline (the top bar), the current tab's disc is still brand, ringed lime.
        const { unmount } = render(<AppTabBar items={items} variant="inline" testIdPrefix="nav" />)
        const inlineCurrent = within(screen.getByTestId('nav-messages')).getByText('3')
        expect(inlineCurrent.className).toContain('bg-[var(--brand)]')
        expect(inlineCurrent.className).toContain('border-[var(--lime)]')
        unmount()
    })

    it("in the dock the current tab's count sits in the pill after the name: ink disc, lime figure, no ring (AUTM-1802)", () => {
        render(<AppTabBar items={items} />)
        const tab = screen.getByTestId('app-tab-messages')
        const count = within(tab).getByText('3')
        expect(count).toHaveAttribute('data-tab-count', 'selected')
        expect(count.className).toContain('bg-[var(--on-lime)]')
        expect(count.className).toContain('text-[var(--lime)]')
        expect(count.className).not.toMatch(/\babsolute\b|border-/)
        // In the flow, right after the name.
        const name = within(tab).getByText('Messages')
        expect(name.nextElementSibling).toBe(count)
        // Drawn, not read: the tab says it once.
        expect(count).toHaveAttribute('aria-hidden')
        expect(screen.getByRole('link', { name: 'Messages, 3 unread' })).toBeInTheDocument()
    })

    it("the dock's current name never wraps (AUTM-1816)", () => {
        render(<AppTabBar items={items} />)
        const name = within(screen.getByTestId('app-tab-messages')).getByText('Messages')
        expect(name.className).toContain('whitespace-nowrap')
        expect(name.className).not.toContain('overflow-wrap')
        expect(name).not.toHaveAttribute('data-name-hidden')
    })

    it('slides the pill when the current tab changes, from where the last bar left it', () => {
        const animate = vi.fn(() => ({ cancel: () => {} }) as unknown as Animation)
        const original = Element.prototype.animate
        Element.prototype.animate = animate as unknown as typeof Element.prototype.animate
        try {
            const at = (key: string) => items.map((i) => ({ ...i, active: i.key === key }))
            const { rerender } = render(<AppTabBar items={at('bookings')} label="Slide" />)
            expect(animate).not.toHaveBeenCalled()
            rerender(<AppTabBar items={at('messages')} label="Slide" />)
            // jsdom lays nothing out, so every box is zero: nothing travels,
            // but the new name still fades in.
            expect(animate).toHaveBeenCalledWith([{ opacity: 0 }, { opacity: 1 }], expect.objectContaining({ fill: 'backwards' }))
        } finally {
            Element.prototype.animate = original
        }
    })

    it('does not move under reduced motion', () => {
        const animate = vi.fn()
        const original = Element.prototype.animate
        const mm = window.matchMedia
        Element.prototype.animate = animate as unknown as typeof Element.prototype.animate
        window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
        try {
            const at = (key: string) => items.map((i) => ({ ...i, active: i.key === key }))
            const { rerender } = render(<AppTabBar items={at('bookings')} label="Still" />)
            rerender(<AppTabBar items={at('account')} label="Still" />)
            expect(animate).not.toHaveBeenCalled()
        } finally {
            Element.prototype.animate = original
            window.matchMedia = mm
        }
    })

    it('inline sits in the flow, every name shown, at least 44px tall', () => {
        render(<AppTabBar items={items} variant="inline" testIdPrefix="nav" />)
        const nav = screen.getByRole('navigation')
        expect(nav.className).not.toContain('fixed')
        expect(screen.getByTestId('nav-account').className).toContain('min-h-11')
        expect(within(screen.getByTestId('nav-account')).getByText('Account').className).not.toContain('sr-only')
    })
})

describe('AppBar (AUTM-1781)', () => {
    it('is the banner, with leading, title, inline nav and trailing in order', () => {
        render(
            <AppBar leading={<button>Back</button>} title="Booking" trailing={<a href="/account">Account</a>}>
                <span>nav</span>
            </AppBar>,
        )
        const bar = screen.getByRole('banner')
        expect(bar.textContent).toBe('BackBookingnavAccount')
        // The title is the bar's name for the screen, never a second h1.
        expect(within(bar).queryByRole('heading')).toBeNull()
        expect(bar.className).toContain('sticky')
        expect(bar.className).toContain('pt-[env(safe-area-inset-top)]')
    })
})

describe('ActionBar (AUTM-1781)', () => {
    it('is a named group of labelled controls, one per action', async () => {
        const message = vi.fn()
        render(
            <ActionBar
                label="Booking actions"
                actions={[
                    { key: 'message', label: 'Message', icon: <Glyph />, primary: true, onSelect: message },
                    { key: 'directions', label: 'Get directions', icon: <Glyph />, href: 'https://maps.example', external: true },
                    { key: 'change', label: 'Change time', icon: <Glyph />, element: <FakeLink to="/x" /> },
                    { key: 'cancel', label: 'Cancel', icon: <Glyph />, tone: 'danger', onSelect: () => {} },
                ]}
                testIdPrefix="booking-detail-action"
            />,
        )
        const group = screen.getByRole('group', { name: 'Booking actions' })
        expect(within(group).getAllByRole('listitem')).toHaveLength(4)
        await userEvent.click(screen.getByRole('button', { name: 'Message' }))
        expect(message).toHaveBeenCalledTimes(1)
        const directions = screen.getByRole('link', { name: /get directions/i })
        expect(directions).toHaveAttribute('target', '_blank')
        expect(directions).toHaveAccessibleName('Get directions (opens in a new tab)')
        expect(screen.getByTestId('booking-detail-action-change')).toHaveAttribute('data-router')
    })

    it('marks the primary, and danger is text, never a fill', () => {
        render(
            <ActionBar
                label="Booking actions"
                actions={[
                    { key: 'message', label: 'Message', icon: <Glyph />, primary: true },
                    { key: 'change', label: 'Change time', icon: <Glyph /> },
                    { key: 'cancel', label: 'Cancel', icon: <Glyph />, tone: 'danger' },
                ]}
            />,
        )
        expect(screen.getByTestId('action-bar-message')).toHaveAttribute('data-primary')
        const cancel = screen.getByTestId('action-bar-cancel')
        expect(cancel.className).toContain('text-[var(--danger)]')
        expect(cancel.className).not.toMatch(/\bbg-\[var\(--danger/)
    })

    it('is a fixed dock below lg and an in-flow list from lg, so each action exists once', () => {
        render(
            <ActionBar
                label="Booking actions"
                actions={[
                    { key: 'a', label: 'A', icon: <Glyph /> },
                    { key: 'b', label: 'B', icon: <Glyph /> },
                    { key: 'c', label: 'C', icon: <Glyph /> },
                ]}
            />,
        )
        const group = screen.getByRole('group')
        for (const c of ['fixed', 'bottom-0', 'lg:static', 'pb-[calc(0.5rem+env(safe-area-inset-bottom))]']) {
            expect(group.className).toContain(c)
        }
        // A tile is at least 56px in the dock.
        expect(screen.getByTestId('action-bar-a').className).toContain('min-h-14')
    })

    it('one or two actions are pills; three or more are tiles', () => {
        const { rerender } = render(
            <ActionBar label="x" actions={[{ key: 'pay', label: 'Pay', icon: <Glyph />, primary: true }]} />,
        )
        expect(screen.getByTestId('action-bar-pay').className).toContain('rounded-full')
        rerender(
            <ActionBar
                label="x"
                actions={[
                    { key: 'pay', label: 'Pay', icon: <Glyph />, primary: true },
                    { key: 'b', label: 'B', icon: <Glyph /> },
                    { key: 'c', label: 'C', icon: <Glyph /> },
                ]}
            />,
        )
        expect(screen.getByTestId('action-bar-pay').className).toContain('flex-col')
    })

    it('renders nothing with no actions', () => {
        const { container } = render(<ActionBar label="x" actions={[]} />)
        expect(container.firstChild).toBeNull()
    })
})

describe('ActionBar 8.5 contract: one primary, two icons or one secondary (AUTM-1781)', () => {
    const icon = <Glyph />

    it('draws the primary lime and last, the icons as named band discs before it', () => {
        render(
            <ActionBar
                label="Booking actions"
                primary={{ key: 'directions', label: 'Directions', icon, href: 'https://maps.example', external: true }}
                icons={[
                    { key: 'message', label: 'Message Fitzroy Paint Co', icon, onSelect: () => {} },
                    { key: 'call', label: 'Call', icon, href: 'tel:+61400000000' },
                ]}
                testIdPrefix="bk"
            />,
        )
        const group = screen.getByRole('group', { name: 'Booking actions' })
        expect(group.dataset.shape).toBe('icons')
        const controls = Array.from(group.querySelectorAll('a, button'))
        expect(controls.map((c) => c.getAttribute('data-testid'))).toEqual(['bk-message', 'bk-call', 'bk-directions'])
        const primary = screen.getByTestId('bk-directions')
        expect(primary.className).toContain('bg-[var(--lime)]')
        expect(primary.className).toContain('min-h-14')
        expect(primary).toHaveAttribute('data-primary')
        expect(primary).toHaveAttribute('target', '_blank')
        // An icon action is named by its label, shown from lg.
        const message = screen.getByRole('button', { name: 'Message Fitzroy Paint Co' })
        expect(message.className).toContain('size-14')
        expect(within(message).getByText('Message Fitzroy Paint Co').className).toContain('sr-only lg:not-sr-only')
    })

    it('a secondary is a band pill beside the primary, and it pushes icons out', () => {
        render(
            <ActionBar
                label="Answer"
                primary={{ key: 'accept', label: 'Accept Sunday' }}
                secondary={{ key: 'keep', label: 'Keep Saturday' }}
                icons={[{ key: 'message', label: 'Message', icon }]}
            />,
        )
        expect(screen.getByRole('group').dataset.shape).toBe('secondary')
        expect(screen.getByRole('button', { name: 'Keep Saturday' }).className).toContain('bg-[var(--band)]')
        expect(screen.queryByRole('button', { name: 'Message' })).toBeNull()
    })

    it('holds two icons at most', () => {
        render(
            <ActionBar
                label="x"
                primary={{ key: 'p', label: 'Primary' }}
                icons={['a', 'b', 'c'].map((k) => ({ key: k, label: k, icon }))}
            />,
        )
        expect(screen.getAllByRole('button')).toHaveLength(3)
    })

    it('is a fixed bar rising in below lg, in the flow from lg', () => {
        render(<ActionBar label="x" primary={{ key: 'p', label: 'Pay $454' }} />)
        const group = screen.getByRole('group')
        for (const c of ['motion-bar-in', 'fixed', 'bottom-0', 'border-t', 'lg:static', 'lg:bg-transparent']) {
            expect(group.className, c).toContain(c)
        }
    })

    it('clones a framework link, and calls its handler', async () => {
        const onSelect = vi.fn()
        render(
            <ActionBar
                label="x"
                primary={{ key: 'again', label: 'Book again', element: <FakeLink to="/m/1" />, onSelect }}
            />,
        )
        const link = screen.getByRole('link', { name: 'Book again' })
        expect(link).toHaveAttribute('data-router')
        await userEvent.click(link)
        expect(onSelect).toHaveBeenCalled()
    })

    it('a disabled primary is a disabled button, never a live link', () => {
        render(<ActionBar label="x" primary={{ key: 'p', label: 'Pay', href: '/pay', disabled: true }} />)
        expect(screen.getByRole('button', { name: 'Pay' })).toBeDisabled()
    })

    it('renders nothing with nothing to do', () => {
        const { container } = render(<ActionBar label="x" />)
        expect(container).toBeEmptyDOMElement()
    })
})

describe('ListSection plain variant and link rows (AUTM-1781)', () => {
    // AUTM-2042 (Don, 2026-11-08: no hairlines): the rows part by space.
    it('plain: a 17px Bold title, rows apart by space, no rule and no band box', () => {
        render(
            <ListSection variant="plain" title="When and where" titleId="when-where">
                <ListSectionRow label="Thu 9 Oct" description="10:00 am AEDT" />
                <ListSectionRow label="Fitzroy" />
            </ListSection>,
        )
        const heading = screen.getByRole('heading', { name: 'When and where' })
        expect(heading.className).toContain('font-bold')
        expect(screen.getByRole('region', { name: 'When and where' })).toBeInTheDocument()
        const box = heading.parentElement!.querySelector('div')!
        expect(box.className).toContain('gap-1')
        expect(box.className).not.toContain('divide-')
        expect(box.className).not.toContain('bg-[var(--band)]')
    })

    it('card stays the band box with raised rows', () => {
        render(
            <ListSection title="Business">
                <ListSectionRow label="Profile" testId="row" />
            </ListSection>,
        )
        expect(screen.getByTestId('row').className).toContain('bg-[var(--raised)]')
    })

    it('a row can be a framework link, an external anchor, or wrap', () => {
        render(
            <ListSection variant="plain">
                <ListSectionRow label="Fitzroy Paint Co" element={<FakeLink to="/m/fitzroy" />} testId="pro" />
                <ListSectionRow label="Get directions" href="https://maps.example" external testId="maps" />
                <ListSectionRow label="41 Smith Street, Fitzroy VIC 3065" wrap testId="addr" />
            </ListSection>,
        )
        expect(screen.getByTestId('pro')).toHaveAttribute('data-router')
        expect(screen.getByTestId('maps')).toHaveAttribute('target', '_blank')
        expect(screen.getByTestId('maps')).toHaveAccessibleName(/opens in a new tab/)
        expect(screen.getByTestId('addr').querySelector('p')!.className).not.toContain('truncate')
    })

    it('a wrapping row lets its value shrink; a plain one keeps it whole', () => {
        render(
            <ListSection variant="plain">
                <ListSectionRow label="Refund" trailing="$54.00 · Sent to your card" wrap testId="w" />
                <ListSectionRow label="Status" trailing="Active" testId="n" />
            </ListSection>,
        )
        expect(screen.getByText('$54.00 · Sent to your card').className).toContain('min-w-0')
        expect(screen.getByText('Active').className).toContain('shrink-0')
    })
})
