import { render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { CSSProperties } from 'react'
import * as Icons from './index'
import * as ObjectGlyphs from './object-glyphs'
import * as UtilityGlyphs from './utility-glyphs'
import { SOLAR_TO_AUTARA } from './solar-map'
import type { AutaraIconComponent } from './AutaraIcon'
import * as Root from '../index'

const all = Object.entries(Icons).filter(
    (e): e is [string, AutaraIconComponent] => e[0].endsWith('Icon') && typeof e[1] === 'function',
)
const utility = Object.entries(UtilityGlyphs) as [string, AutaraIconComponent][]

/** The 19 Don approved in merchant-mobile on 2026-11-08 (AUTM-2042), ported unchanged. */
const APPROVED = [
    'TodayIcon', 'BookingsIcon', 'InboxIcon', 'CustomersIcon', 'ServicesIcon', 'PackagesIcon',
    'EarningsIcon', 'InvoicesIcon', 'SettingsIcon', 'AccountIcon', 'HelpIcon', 'SignOutIcon',
    'AppearanceIcon', 'NotificationsIcon', 'ShareIcon', 'MoreIcon', 'LightIcon', 'DarkIcon', 'SystemIcon',
]

/** Every Solar glyph merchant-mobile imported (88: main's 84 plus four from AUTM-2042's branch). */
const SOLAR_USED = [
    'AddCircle', 'AltArrowDown', 'AltArrowLeft', 'AltArrowRight', 'AltArrowUp', 'ArrowRight', 'ArrowRightUp',
    'Bell', 'BellBing', 'Bill', 'Box', 'Calendar', 'CalendarAdd', 'CalendarMark', 'Camera', 'CameraAdd', 'Card',
    'CardRecive', 'CardTransfer', 'CaseMinimalistic', 'ChatRound', 'ChatRoundDots', 'ChatRoundLine', 'CheckCircle',
    'CheckRead', 'ClipboardList', 'ClockCircle', 'CloseCircle', 'Copy', 'DangerCircle', 'DangerTriangle', 'Document',
    'DocumentAdd', 'DownloadMinimalistic', 'Export', 'Eye', 'Forbidden', 'Gallery', 'GalleryAdd', 'GalleryCheck',
    'GalleryRemove', 'Garage', 'HomeAngle2', 'Hourglass', 'Inbox', 'InboxIn', 'Layers', 'LayersMinimalistic', 'Letter',
    'LockKeyhole', 'LockKeyholeMinimalistic', 'Logout3', 'MagicStick3', 'Magnifer', 'MapPoint', 'MenuDots',
    'MinusCircle', 'MonitorSmartphone', 'MoonStars', 'Notes', 'PauseCircle', 'Pen', 'Phone', 'Plain2', 'Play',
    'QuestionCircle', 'Refresh', 'RestartCircle', 'Routing2', 'Settings', 'ShareCircle', 'ShieldCheck', 'ShieldUser',
    'Shop', 'ShopMinimalistic', 'SquareArrowRightUp', 'Star', 'TrashBinMinimalistic', 'Tuning', 'UserBlock',
    'UserCircle', 'UserCross', 'UserRounded', 'UsersGroupRounded', 'VerifiedCheck', 'Wallet', 'WalletMoney', 'Wheel',
]

describe('Autara icons (AUTM-2114)', () => {
    it('exports the whole set, including every approved glyph', () => {
        expect(all.length).toBe(Object.keys(ObjectGlyphs).length + Object.keys(UtilityGlyphs).length)
        expect(all.length).toBeGreaterThanOrEqual(75)
        for (const name of APPROVED) expect(Icons).toHaveProperty(name)
    })

    it('is exported from the package root too', () => {
        for (const [name, Icon] of all) expect((Root as Record<string, unknown>)[name]).toBe(Icon)
        expect(Root.SOLAR_TO_AUTARA).toBe(SOLAR_TO_AUTARA)
    })

    it.each(all)('%s renders a 24 grid svg, decorative, 22px by default', (_name, Icon) => {
        const { container } = render(<Icon />)
        const svg = container.querySelector('svg')!
        expect(svg).not.toBeNull()
        expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
        expect(svg.getAttribute('aria-hidden')).toBe('true')
        expect(svg.getAttribute('focusable')).toBe('false')
        expect(svg.getAttribute('width')).toBe('22')
        expect(svg.getAttribute('height')).toBe('22')
        expect(svg.getAttribute('stroke-width')).toBe('1.7')
        expect(svg.getAttribute('data-icon')).toMatch(/^[a-z]+(-[a-z]+)*$/)
        expect(svg.hasAttribute('data-active')).toBe(false)
        expect(svg.childElementCount).toBeGreaterThan(0)
    })

    it.each(all)('%s: active deepens the body through --icon-body', (_name, Icon) => {
        const { container } = render(<Icon active />)
        const svg = container.querySelector('svg')!
        expect(svg.style.getPropertyValue('--icon-body')).toBe('0.3')
        expect(svg.getAttribute('data-active')).toBe('true')
    })

    it.each(all)('%s never picks a colour of its own: only currentColor', (_name, Icon) => {
        const html = renderToStaticMarkup(<Icon active />)
        expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
        expect(html).not.toMatch(/var\(--(accent|lime|icon-disc|icon-fill|icon-accent)/)
        expect(html).not.toMatch(/rgb|hsl/)
    })

    it('gives every glyph its own data-icon name', () => {
        const names = all.map(([, Icon]) => render(<Icon />).container.querySelector('svg')!.getAttribute('data-icon'))
        expect(new Set(names).size).toBe(names.length)
    })

    it.each(utility)('%s is line only: no body', (_name, Icon) => {
        expect(renderToStaticMarkup(<Icon />)).not.toContain('fill-opacity')
    })

    it('takes a CSS length, passes svg props through, and lets the caller override the defaults', () => {
        const { BookingsIcon } = Icons
        const { container } = render(
            <BookingsIcon
                size="1.25em"
                className="text-danger"
                data-testid="bookings-glyph"
                aria-hidden={false}
                aria-label="Bookings"
                role="img"
                active
                style={{ color: 'red', '--icon-body': 1 } as CSSProperties}
            />,
        )
        const svg = container.querySelector('svg')!
        expect(svg.getAttribute('width')).toBe('1.25em')
        expect(svg.getAttribute('class')).toBe('text-danger')
        expect(svg.getAttribute('data-testid')).toBe('bookings-glyph')
        expect(svg.getAttribute('aria-hidden')).toBe('false')
        expect(svg.getAttribute('aria-label')).toBe('Bookings')
        // The caller's own --icon-body wins over the active default (a rated star is solid).
        expect(svg.style.getPropertyValue('--icon-body')).toBe('1')
        expect(svg.style.color).toBe('red')
    })

    it('draws the duotone body in currentColor at --icon-body, 16% by default', () => {
        expect(renderToStaticMarkup(<Icons.BookingsIcon />)).toContain(
            'fill:currentColor;fill-opacity:var(--icon-body, 0.16)',
        )
    })
})

describe('SOLAR_TO_AUTARA', () => {
    it('maps exactly the 88 Solar glyphs merchant-mobile used', () => {
        expect(Object.keys(SOLAR_TO_AUTARA).sort()).toEqual([...SOLAR_USED].sort())
        expect(SOLAR_USED).toHaveLength(88)
    })

    it('points every Solar name at an exported Autara icon', () => {
        for (const autara of Object.values(SOLAR_TO_AUTARA)) {
            expect(typeof (Icons as Record<string, unknown>)[autara]).toBe('function')
        }
    })

    it('keeps the two by-meaning mappings', () => {
        expect(SOLAR_TO_AUTARA.InboxIn).toBe('CalendarAddIcon')
        expect(SOLAR_TO_AUTARA.Export).toBe('ShareIcon')
    })
})
