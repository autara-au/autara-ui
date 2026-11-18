import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as AU from './index'
import * as Root from '../index'

describe('AU (AUTM-2184): the native pieces on the web', () => {
    it('is the AU namespace from the package root too', () => {
        expect(Root.AU.Ticket).toBe(AU.Ticket)
        expect(Root.AU.Dock).toBe(AU.Dock)
    })

    it('carries the Swift names of autara-ios/Design', () => {
        for (const name of ['HeroFill', 'Plate', 'Ticket', 'Steps', 'Badge', 'Avatar', 'Chip', 'RegoPlate', 'DiscRow',
            'SectionTitle', 'PageTitle', 'CircleButton', 'MakeMark', 'RemotePhoto', 'Dock', 'Card', 'Button', 'ServiceCard']) {
            expect(AU).toHaveProperty(name)
        }
    })

    it('works out initials as Swift does', () => {
        expect(AU.initials('McRaven Auto')).toBe('MA')
        expect(AU.initials('Kerbside Car Care')).toBe('KC')
        expect(AU.initials('')).toBe('')
    })

    it('the ticket shows the time, the meridiem and a heading', () => {
        render(<AU.Ticket badge={<AU.Badge>Confirmed</AU.Badge>} caption="Sat 21 Nov" time="9:00" meridiem="am" title="Exterior car care" timeTestId="t" />)
        expect(screen.getByTestId('t').textContent).toBe('9:00 am')
        expect(screen.getByRole('heading', { name: 'Exterior car care' })).toBeTruthy()
        expect(screen.getByText('Confirmed')).toBeTruthy()
    })

    it('steps say where the booking is', () => {
        render(<AU.Steps done={2} />)
        expect(screen.getByRole('img', { name: 'Step 3 of 4' })).toBeTruthy()
    })

    it('named steps are a list with the current one marked', () => {
        const { container } = render(<AU.Steps done={1} labels={['Requested', 'Accepted', 'In progress', 'Done']} aria-label="Where your booking is" />)
        expect(container.querySelector('ol')?.getAttribute('aria-label')).toBe('Where your booking is')
        expect(container.querySelectorAll('li')).toHaveLength(4)
        expect(container.querySelector('[aria-current="step"]')?.textContent).toBe('Accepted')
    })

    it('the dock names every tab, marks the current one and slides its tile there', () => {
        const icon = <svg />
        const { container } = render(
            <AU.Dock
                current="inbox"
                tabs={[
                    { id: 'home', label: 'Home', icon, element: <a href="/a" /> },
                    { id: 'inbox', label: 'Inbox', icon, element: <a href="/b" />, count: 2, countLabel: '2 unread' },
                ]}
                search={<a href="/s" />}
            />,
        )
        expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBeNull()
        expect(screen.getByRole('link', { name: 'Inbox, 2 unread' }).getAttribute('aria-current')).toBe('page')
        expect(screen.getByRole('link', { name: 'Search' })).toBeTruthy()
        const nav = container.querySelector('nav')!
        expect(nav.style.getPropertyValue('--au-dock-index')).toBe('1')
    })

    it('the composer sends trimmed text on Enter, never an empty one', () => {
        const onSend = vi.fn()
        const { rerender } = render(<AU.Composer value="  " onChange={() => {}} onSend={onSend} sendIcon={<svg />} />)
        fireEvent.click(screen.getByRole('button', { name: 'Send' }))
        expect(onSend).not.toHaveBeenCalled()
        expect(screen.getByRole('button', { name: 'Send' }).getAttribute('aria-disabled')).toBe('true')
        rerender(<AU.Composer value=" hi " onChange={() => {}} onSend={onSend} sendIcon={<svg />} />)
        fireEvent.keyDown(screen.getByRole('textbox', { name: 'Message' }), { key: 'Enter' })
        expect(onSend).toHaveBeenCalledWith('hi')
    })

    it('a disc row as a link keeps its href and draws the disc inside it', () => {
        render(<AU.DiscRow asChild icon={<svg data-testid="i" />} title="Addresses"><a href="/account/addresses" /></AU.DiscRow>)
        const link = screen.getByRole('link', { name: 'Addresses' })
        expect(link.getAttribute('href')).toBe('/account/addresses')
        expect(link.className).toContain('au-disc-row')
        expect(link.querySelector('[data-testid="i"]')).toBeTruthy()
    })

    it('a photo with no picture shows initials, never an empty box', () => {
        const { container } = render(<AU.RemotePhoto name="McRaven Auto" />)
        expect(container.textContent).toBe('MA')
    })

    it('holds the native token values (Tokens.swift AU and AppTheme.brand)', () => {
        const css = readFileSync(join(__dirname, '../tokens/au.css'), 'utf8')
        for (const [name, value] of [
            ['--au-room', '#f4f2ee'], ['--au-card', '#ffffff'], ['--au-press', '#e9e6df'], ['--au-ink', '#0e0a1a'],
            ['--au-muted', '#4d4a45'], ['--au-subtle', '#66625b'], ['--au-hero', '#14101f'], ['--au-lime', '#d4ff4f'],
            ['--au-aqua', '#4ceaff'], ['--au-rego', '#ffd84a'], ['--au-card-radius', '26px'], ['--au-plate-radius', '32px'],
            // AUTM-2202: selected and yours is the brand purple with white (AppTheme.brand).
            ['--au-tile', '#4e1bbd'], ['--au-tile-figure', '#ffffff'], ['--au-tile-label', '#ffffff'],
        ]) {
            expect(css).toContain(`${name}: ${value};`)
        }
    })

    it('a service with no photo shows its name on ink, and the fee line under the price', () => {
        const { container } = render(<AU.ServiceCard name="Headlight restore" price="$52.45" note="incl. $2.45 booking fee" />)
        const ink = container.querySelector('.au-service-card__ink')
        expect(ink?.getAttribute('aria-hidden')).toBe('true')
        expect(ink?.textContent).toBe('Headlight restore')
        expect(container.querySelector('.au-service-card__note')?.textContent).toBe('incl. $2.45 booking fee')
    })

    it('Segmented is a radio group whose arrow keys move the choice past a disabled one', () => {
        const picks: string[] = []
        const { getAllByRole } = render(
            <AU.Segmented
                label="Part of the day"
                value="morning"
                onChange={(v) => picks.push(v)}
                options={[
                    { value: 'morning', label: 'Morning' },
                    { value: 'afternoon', label: 'Afternoon', disabled: true },
                    { value: 'evening', label: 'Evening' },
                ]}
            />,
        )
        const radios = getAllByRole('radio')
        expect(radios[0].getAttribute('aria-checked')).toBe('true')
        expect(radios[0].tabIndex).toBe(0)
        expect(radios[2].tabIndex).toBe(-1)
        radios[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
        expect(picks).toEqual(['evening'])
    })

    it('DayStrip names a closed day as having nothing to book', () => {
        const { getAllByRole } = render(
            <AU.DayStrip
                value="2026-11-21"
                onChange={() => {}}
                days={[
                    { key: '2026-11-21', weekday: 'Sat', date: '21', label: 'Saturday 21 November' },
                    { key: '2026-11-23', weekday: 'Mon', date: '23', label: 'Monday 23 November', closed: true },
                ]}
            />,
        )
        const [sat, mon] = getAllByRole('radio')
        expect(sat.getAttribute('aria-checked')).toBe('true')
        expect(mon.getAttribute('aria-label')).toBe('Monday 23 November, nothing to book')
    })

    it('moves only inside prefers-reduced-motion: no-preference', () => {
        const css = readFileSync(join(__dirname, '../utilities/au.css'), 'utf8')
        const [before] = css.split('@media (prefers-reduced-motion: no-preference)')
        expect(before).not.toMatch(/\banimation:|\btransition:/)
    })
})
