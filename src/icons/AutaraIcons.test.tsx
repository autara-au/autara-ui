import { render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import * as Icons from './index'
import * as ObjectGlyphs from './object-glyphs'
import * as UtilityGlyphs from './utility-glyphs'
import { SOLAR_TO_AUTARA } from './solar-map'
import type { AutaraIconComponent } from './AutaraIcon'
import * as Root from '../index'

type Entry = [string, AutaraIconComponent]

const all = Object.entries(Icons).filter(
    (e): e is Entry => e[0].endsWith('Icon') && typeof e[1] === 'function',
)
const objects = Object.entries(ObjectGlyphs) as Entry[]
const utility = Object.entries(UtilityGlyphs) as Entry[]

/**
 * The utility glyphs with a Bold twin: the closed ones (Don, 2026-11-09,
 * "Draw ours in Solar style"). Every object icon has one too. The open
 * utility glyphs (chevrons, arrows, the bare close, check, add, remove...)
 * keep their line art when `active`.
 */
const UTILITY_BOLD = [
    'CloseCircleIcon', 'CheckCircleIcon', 'AddCircleIcon', 'RemoveCircleIcon', 'ErrorIcon', 'WarningIcon',
    'BlockedIcon', 'PlayIcon', 'PauseIcon', 'LockIcon', 'MoreIcon',
]
const withBold = [...objects, ...utility.filter(([name]) => UTILITY_BOLD.includes(name))]
const lineOnly = utility.filter(([name]) => !UTILITY_BOLD.includes(name))

/** The 19 merchant-mobile's rail and menus draw (approved 2026-11-08, AUTM-2042); the 2026-11-09 redraw kept the names. */
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

/** The ring the ringed utility glyphs share. */
const RING = 'd="M2.5 12a9.5 9.5 0 1 0 19 0a9.5 9.5 0 1 0 -19 0Z"'

const svgOf = (el: ReactElement) => render(el).container.querySelector('svg')!

describe('Autara icons (AUTM-2114)', () => {
    it('exports the whole set, including every approved glyph', () => {
        expect(all.length).toBe(objects.length + utility.length)
        expect(all.length).toBeGreaterThanOrEqual(78)
        for (const name of APPROVED) expect(Icons).toHaveProperty(name)
    })

    it('is exported from the package root too', () => {
        for (const [name, Icon] of all) expect((Root as Record<string, unknown>)[name]).toBe(Icon)
        expect(Root.SOLAR_TO_AUTARA).toBe(SOLAR_TO_AUTARA)
    })

    it.each(all)('%s at rest is Linear: a 24 grid, 1.5 strokes, decorative, 22px by default', (_name, Icon) => {
        const svg = svgOf(<Icon />)
        expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
        expect(svg.getAttribute('aria-hidden')).toBe('true')
        expect(svg.getAttribute('focusable')).toBe('false')
        expect(svg.getAttribute('width')).toBe('22')
        expect(svg.getAttribute('height')).toBe('22')
        expect(svg.getAttribute('fill')).toBe('none')
        expect(svg.getAttribute('stroke')).toBe('currentColor')
        expect(svg.getAttribute('stroke-width')).toBe('1.5')
        expect(svg.getAttribute('stroke-linecap')).toBe('round')
        expect(svg.getAttribute('stroke-linejoin')).toBe('round')
        expect(svg.getAttribute('data-weight')).toBe('linear')
        expect(svg.getAttribute('data-icon')).toMatch(/^[a-z]+(-[a-z]+)*$/)
        expect(svg.hasAttribute('data-active')).toBe(false)
        expect(svg.childElementCount).toBeGreaterThan(0)
    })

    it.each(withBold)('%s active draws its Bold twin: one evenodd path, filled currentColor, no stroke', (_name, Icon) => {
        const svg = svgOf(<Icon active />)
        expect(svg.getAttribute('data-weight')).toBe('bold')
        expect(svg.getAttribute('data-active')).toBe('true')
        expect(svg.getAttribute('fill')).toBe('currentColor')
        expect(svg.getAttribute('stroke')).toBe('none')
        expect(svg.childElementCount).toBe(1)
        const path = svg.firstElementChild!
        expect(path.tagName.toLowerCase()).toBe('path')
        expect(path.getAttribute('fill-rule')).toBe('evenodd')
        expect(path.getAttribute('d')).toBeTruthy()
        expect(path.hasAttribute('stroke')).toBe(false)
        expect(path.hasAttribute('fill')).toBe(false)
    })

    it.each(lineOnly)('%s active keeps its line art: an open glyph has no Bold twin', (_name, Icon) => {
        const rest = svgOf(<Icon />)
        const svg = svgOf(<Icon active />)
        expect(svg.getAttribute('data-weight')).toBe('linear')
        expect(svg.getAttribute('data-active')).toBe('true')
        expect(svg.getAttribute('fill')).toBe('none')
        expect(svg.getAttribute('stroke')).toBe('currentColor')
        expect(svg.innerHTML).toBe(rest.innerHTML)
    })

    it('gives every object icon a Bold twin, and of the utility glyphs only the closed ones', () => {
        const bold = ([, Icon]: Entry) => svgOf(<Icon active />).getAttribute('data-weight') === 'bold'
        expect(objects.filter((e) => !bold(e)).map(([name]) => name)).toEqual([])
        expect(utility.filter(bold).map(([name]) => name).sort()).toEqual([...UTILITY_BOLD].sort())
    })

    it.each(all)('%s never picks a colour of its own: only currentColor, at full strength', (_name, Icon) => {
        for (const html of [renderToStaticMarkup(<Icon />), renderToStaticMarkup(<Icon active />)]) {
            expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
            expect(html).not.toMatch(/rgb|hsl|var\(--/)
            expect(html).not.toMatch(/opacity|style=/)
            const paints = [...html.matchAll(/\b(?:fill|stroke)="([^"]*)"/g)].map((m) => m[1])
            for (const paint of paints) expect(['none', 'currentColor']).toContain(paint)
        }
    })

    it('gives every glyph its own data-icon name', () => {
        const names = all.map(([, Icon]) => svgOf(<Icon />).getAttribute('data-icon'))
        expect(new Set(names).size).toBe(names.length)
    })

    it('takes a CSS length and passes the caller\'s props, className and style through, Linear and Bold', () => {
        const { BookingsIcon, ChevronRightIcon } = Icons
        const svg = svgOf(
            <BookingsIcon
                size="1.25em"
                className="text-danger"
                data-testid="bookings-glyph"
                aria-hidden={false}
                aria-label="Bookings"
                role="img"
                active
                style={{ color: 'red' }}
            />,
        )
        expect(svg.getAttribute('width')).toBe('1.25em')
        expect(svg.getAttribute('height')).toBe('1.25em')
        expect(svg.getAttribute('class')).toBe('text-danger')
        expect(svg.getAttribute('data-testid')).toBe('bookings-glyph')
        expect(svg.getAttribute('aria-hidden')).toBe('false')
        expect(svg.getAttribute('aria-label')).toBe('Bookings')
        expect(svg.getAttribute('role')).toBe('img')
        expect(svg.getAttribute('data-weight')).toBe('bold')
        expect(svg.style.color).toBe('red')

        const line = svgOf(<ChevronRightIcon className="ml-auto" style={{ color: 'blue' }} size={16} />)
        expect(line.getAttribute('class')).toBe('ml-auto')
        expect(line.style.color).toBe('blue')
        expect(line.getAttribute('width')).toBe('16')
    })

    it('draws a rated star with `active`, the filled twin', () => {
        expect(svgOf(<Icons.StarIcon active />).getAttribute('data-weight')).toBe('bold')
        expect(svgOf(<Icons.StarIcon />).getAttribute('data-weight')).toBe('linear')
    })

    it('draws Close, Check, Add and Remove bare, and again in a ring for a state', () => {
        for (const name of ['CloseIcon', 'CheckIcon', 'AddIcon', 'RemoveIcon'] as const) {
            const Bare = Icons[name]
            const Ringed = Icons[name.replace(/Icon$/, 'CircleIcon') as 'CloseCircleIcon']
            expect(renderToStaticMarkup(<Bare />)).not.toContain(RING)
            expect(renderToStaticMarkup(<Ringed />)).toContain(RING)
            // The bare mark sits in text and buttons and stays line; the ringed state fills when active.
            expect(svgOf(<Bare active />).getAttribute('data-weight')).toBe('linear')
            expect(svgOf(<Ringed active />).getAttribute('data-weight')).toBe('bold')
        }
    })

    it('has one no-show glyph, not two', () => {
        expect(Icons).toHaveProperty('NoShowIcon')
        expect(Icons).not.toHaveProperty('UserBlockIcon')
        expect(Icons).not.toHaveProperty('UserRemoveIcon')
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

    it('keeps the by-meaning mappings', () => {
        expect(SOLAR_TO_AUTARA.InboxIn).toBe('CalendarAddIcon')
        expect(SOLAR_TO_AUTARA.Export).toBe('ShareIcon')
        // One event, two Solar glyphs in the app (Don, 2026-11-08).
        expect(SOLAR_TO_AUTARA.UserBlock).toBe('NoShowIcon')
        expect(SOLAR_TO_AUTARA.UserCross).toBe('NoShowIcon')
    })

    it('maps the ringed Solar glyphs to the ringed Autara ones', () => {
        expect(SOLAR_TO_AUTARA.CloseCircle).toBe('CloseCircleIcon')
        expect(SOLAR_TO_AUTARA.CheckCircle).toBe('CheckCircleIcon')
        expect(SOLAR_TO_AUTARA.AddCircle).toBe('AddCircleIcon')
        expect(SOLAR_TO_AUTARA.MinusCircle).toBe('RemoveCircleIcon')
    })
})
