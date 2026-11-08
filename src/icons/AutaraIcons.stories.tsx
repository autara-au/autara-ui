import type { Meta, StoryObj } from '@storybook/react-vite'
import { useMemo, useState, type CSSProperties } from 'react'
import { AppTabBar } from '../components/AppTabBar'
import { Button } from '../components/Button'
import { FactRows } from '../components/FactRows'
import { IconButton } from '../components/IconButton'
import { ListSection, ListSectionRow } from '../components/ListSection'
import { SearchInput } from '../components/SearchInput'
import type { AutaraIconComponent } from './AutaraIcon'
import * as ObjectGlyphs from './object-glyphs'
import * as UtilityGlyphs from './utility-glyphs'
import {
    AccountIcon,
    AppearanceIcon,
    BookingsIcon,
    BusinessIcon,
    CardIcon,
    ChatIcon,
    CustomersIcon,
    HelpIcon,
    InboxIcon,
    LocationIcon,
    MagicIcon,
    NotificationsIcon,
    PhoneIcon,
    SecurityIcon,
    SendIcon,
    SignOutIcon,
    StarIcon,
    TodayIcon,
    VehicleIcon,
    WorkshopIcon,
} from './object-glyphs'
import {
    AddIcon,
    CheckCircleIcon,
    CheckIcon,
    ChevronRightIcon,
    CloseCircleIcon,
    CloseIcon,
    CopyIcon,
    DownloadIcon,
    ErrorIcon,
    MoreIcon,
    RemoveIcon,
} from './utility-glyphs'
import { SOLAR_TO_AUTARA } from './solar-map'

/**
 * AUTM-2114: Autara's own icon set. Object icons are duotone (a body in the
 * icon's own colour at 16%, 30% when `active`); utility glyphs are line only.
 * The icon never picks a brand colour: the caller colours it, and the current
 * item takes the accent.
 */
const meta: Meta = {
    title: 'Foundations/Icons',
    parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj

type Entry = { name: string; Icon: AutaraIconComponent; kind: 'object' | 'utility'; solar: string[] }

const solarFor = (name: string) =>
    Object.entries(SOLAR_TO_AUTARA)
        .filter(([, autara]) => autara === name)
        .map(([solar]) => solar)

const ENTRIES: Entry[] = [
    ...Object.entries(ObjectGlyphs).map(([name, Icon]) => ({ name, Icon, kind: 'object' as const, solar: solarFor(name) })),
    ...Object.entries(UtilityGlyphs).map(([name, Icon]) => ({ name, Icon, kind: 'utility' as const, solar: solarFor(name) })),
]

const SIZES = [16, 20, 22, 32] as const
const SURFACES = [
    { theme: 'light', ground: 'paper', label: 'Light, paper' },
    { theme: 'light', ground: 'band', label: 'Light, band' },
    { theme: 'dark', ground: 'paper', label: 'Dark, paper' },
    { theme: 'dark', ground: 'band', label: 'Dark, band' },
] as const

const surfaceStyle = (ground: string): CSSProperties => ({
    background: `var(--${ground})`,
    color: 'var(--text-strong)',
})

/** One glyph at the four sizes, in the line colour at rest and the accent active. */
function SizeRun({ Icon }: { Icon: AutaraIconComponent }) {
    return (
        <div className="flex items-center gap-5">
            <span className="flex items-center gap-2.5">
                {SIZES.map((s) => (
                    <Icon key={s} size={s} />
                ))}
            </span>
            <span className="flex items-center gap-2.5" style={{ color: 'var(--accent)' }}>
                {SIZES.map((s) => (
                    <Icon key={s} size={s} active />
                ))}
            </span>
        </div>
    )
}

function matches(entry: Entry, query: string) {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return [entry.name, ...entry.solar].some((n) => n.toLowerCase().includes(q))
}

function IconSheet({ initialQuery = '' }: { initialQuery?: string }) {
    const [query, setQuery] = useState(initialQuery)
    const shown = useMemo(() => ENTRIES.filter((e) => matches(e, query)), [query])
    const groups = [
        { kind: 'object', title: 'Objects, duotone' },
        { kind: 'utility', title: 'Utility, line only' },
    ] as const

    return (
        <div className="p-6" style={{ background: 'var(--paper)', color: 'var(--text-strong)' }} data-testid="icon-sheet">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Autara icons</h1>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {ENTRIES.length} glyphs. Each row: 16, 20, 22 and 32 at rest, then active in the accent.
                    </p>
                </div>
                <div className="w-full max-w-xs">
                    <SearchInput
                        placeholder="Search by name or Solar name"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search icons"
                    />
                </div>
            </div>

            {shown.length === 0 ? (
                <p className="py-10 text-center text-sm text-[var(--text-muted)]">
                    No icon matches "{query}". Try a Solar name, like Letter or Wheel.
                </p>
            ) : (
                <div className="grid" style={{ gridTemplateColumns: '10rem repeat(4, max-content)' }}>
                    <div />
                    {SURFACES.map((s) => (
                        <div
                            key={s.label}
                            data-theme={s.theme}
                            className="px-4 pb-2 pt-3 text-xs font-bold"
                            style={surfaceStyle(s.ground)}
                        >
                            {s.label}
                        </div>
                    ))}
                    {groups.map((g) => {
                        const rows = shown.filter((e) => e.kind === g.kind)
                        if (rows.length === 0) return null
                        return (
                            <div key={g.kind} className="contents">
                                <div className="pb-1 pt-4 text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">
                                    {g.title}
                                </div>
                                {SURFACES.map((s) => (
                                    <div key={s.label} data-theme={s.theme} style={surfaceStyle(s.ground)} />
                                ))}
                                {rows.map(({ name, Icon, solar }) => (
                                    <div key={name} className="contents" data-testid={`icon-row-${name}`}>
                                        <div className="flex min-h-12 flex-col justify-center pr-3">
                                            <span className="text-sm font-medium">{name.replace(/Icon$/, '')}</span>
                                            {solar.length > 0 && (
                                                <span className="truncate text-xs text-[var(--text-muted)]">
                                                    {solar.join(', ')}
                                                </span>
                                            )}
                                        </div>
                                        {SURFACES.map((s) => (
                                            <div
                                                key={s.label}
                                                data-theme={s.theme}
                                                className="flex items-center px-4 py-1.5"
                                                style={surfaceStyle(s.ground)}
                                            >
                                                <SizeRun Icon={Icon} />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

/** Every glyph, at rest and active, at 16 to 32px, on paper and band, light and dark. Search by Autara or Solar name. */
export const AllIcons: Story = {
    render: () => <IconSheet />,
}

/** The search with no match: the sheet says so and suggests what to type. */
export const SearchNoMatch: Story = {
    render: () => <IconSheet initialQuery="zzz" />,
}

/** The family side by side at the size the rail draws (22), so an off-family glyph stands out. */
export const Family: Story = {
    render: () => (
        <div className="grid gap-6 p-6 md:grid-cols-2">
            {(['light', 'dark'] as const).map((theme) => (
                <div key={theme} data-theme={theme} className="rounded-2xl p-5" style={surfaceStyle('paper')}>
                    {(['object', 'utility'] as const).map((kind) => (
                        <div key={kind} className="mb-4 grid grid-cols-10 gap-x-2 gap-y-4">
                            {ENTRIES.filter((e) => e.kind === kind).map(({ name, Icon }) => (
                                <span key={name} title={name} className="grid place-items-center">
                                    <Icon size={22} />
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    ),
}

/** Every glyph at 48px with its name, the size to inspect a drawing's radii and spacing. */
export const Detail: Story = {
    render: () => (
        <div className="grid grid-cols-8 gap-x-4 gap-y-6 p-6" style={{ color: 'var(--text-strong)' }}>
            {ENTRIES.map(({ name, Icon }) => (
                <figure key={name} className="flex flex-col items-center gap-2">
                    <Icon size={48} />
                    <figcaption className="text-xs text-[var(--text-muted)]">{name.replace(/Icon$/, '')}</figcaption>
                </figure>
            ))}
        </div>
    ),
}

/**
 * Edge cases: an icon at `1.25em` grows with its label (and with 200% text);
 * `--icon-body: 1` fills a rated star; a status colour comes from the caller;
 * the bare marks (a dismiss, an inline tick, a stepper) against the ringed
 * ones (a state); a standalone icon is named by its button, never by the svg.
 */
export const EdgeCases: Story = {
    render: () => (
        <div className="space-y-6 p-6" style={{ color: 'var(--text-strong)' }}>
            <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm">
                    <LocationIcon size="1.25em" /> Mobile, comes to you
                </p>
                <p className="flex items-center gap-2 text-2xl">
                    <LocationIcon size="1.25em" /> Mobile, comes to you
                </p>
            </div>
            <div className="flex items-center gap-1.5" role="img" aria-label="Rated 4 out of 5 stars">
                {[1, 2, 3, 4, 5].map((i) => (
                    <StarIcon
                        key={i}
                        size={20}
                        style={
                            i <= 4
                                ? ({ color: 'var(--accent)', '--icon-body': 1 } as CSSProperties)
                                : { color: 'var(--text-subtle)' }
                        }
                    />
                ))}
                <span className="ml-1 text-sm font-bold">4/5</span>
            </div>
            <p className="flex items-center gap-2 text-sm" style={{ color: 'var(--danger)' }}>
                <ErrorIcon size="1.25em" /> The payout did not go through.
            </p>
            <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                    <CheckIcon size="1.25em" style={{ color: 'var(--intent-success-text)' }} /> Copied
                </p>
                <p className="flex items-center gap-2">
                    <CheckCircleIcon size="1.25em" /> Booking confirmed
                </p>
                <p className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <CloseCircleIcon size="1.25em" /> Cancelled by the customer
                </p>
            </div>
            <div className="flex items-center gap-3">
                <IconButton icon={<CloseIcon size={20} />} label="Dismiss" />
                <IconButton icon={<RemoveIcon size={20} />} label="One fewer concurrent job" />
                <span className="text-sm font-bold">2</span>
                <IconButton icon={<AddIcon size={20} />} label="One more concurrent job" />
                <IconButton icon={<MoreIcon size={20} />} label="More actions" />
            </div>
        </div>
    ),
}

/** In context: the dock, a booking's facts, a settings group and the share actions, as merchant-mobile draws them. */
export const InContext: Story = {
    render: () => {
        const tabs = [
            { key: 'today', label: 'Today', Icon: TodayIcon },
            { key: 'bookings', label: 'Bookings', Icon: BookingsIcon, active: true },
            { key: 'inbox', label: 'Inbox', Icon: InboxIcon, badge: 3, badgeLabel: '3 unread' },
            { key: 'customers', label: 'Customers', Icon: CustomersIcon },
        ]
        return (
            <div className="mx-auto max-w-xl space-y-6 p-6">
                <AppTabBar
                    label="Icons in context"
                    variant="inline"
                    testIdPrefix="icons-tab"
                    items={tabs.map(({ Icon, ...t }) => ({
                        ...t,
                        href: '#',
                        icon: <Icon size={22} />,
                        activeIcon: <Icon size={22} active />,
                    }))}
                />
                <FactRows
                    rows={[
                        { key: 'customer', icon: <AccountIcon />, label: 'Customer', value: 'Priya Nair' },
                        { key: 'service', icon: <MagicIcon />, label: 'Service', value: 'Full detail, inside and out' },
                        { key: 'when', icon: <BookingsIcon />, label: 'When', value: 'Sat 14 Nov, 9:30 am' },
                        { key: 'where', icon: <WorkshopIcon />, label: 'Where', value: 'At the workshop, Brunswick' },
                        { key: 'car', icon: <VehicleIcon />, label: 'Vehicle', value: 'Toyota HiLux, white' },
                        { key: 'note', icon: <ChatIcon />, label: 'Note', value: 'Dog hair in the back seats' },
                    ]}
                />
                <ListSection title="Settings" variant="quiet">
                    <ListSectionRow icon={<BusinessIcon size={18} />} label="Business profile" onTap={() => {}} />
                    <ListSectionRow icon={<SecurityIcon size={18} />} label="Verification" description="ABN and documents approved" />
                    <ListSectionRow icon={<CardIcon size={18} />} label="Plan" onTap={() => {}} />
                    <ListSectionRow icon={<NotificationsIcon size={18} />} label="Notifications" onTap={() => {}} />
                    <ListSectionRow icon={<AppearanceIcon size={18} />} label="Appearance" onTap={() => {}} />
                    <ListSectionRow icon={<HelpIcon size={18} />} label="Help and support" onTap={() => {}} />
                    <ListSectionRow icon={<SignOutIcon size={18} />} label="Sign out" destructive onTap={() => {}} />
                </ListSection>
                <div className="flex flex-wrap gap-2">
                    <Button variant="primary" leadingIcon={<SendIcon size="1.25em" />}>
                        Send link
                    </Button>
                    <Button variant="quiet" leadingIcon={<CopyIcon size="1.15em" />}>
                        Copy link
                    </Button>
                    <Button variant="quiet" leadingIcon={<DownloadIcon size="1.25em" />}>
                        Download
                    </Button>
                    <Button variant="quiet" leadingIcon={<PhoneIcon size="1.25em" />}>
                        Call
                    </Button>
                    <Button variant="quiet" trailingIcon={<ChevronRightIcon size={16} />}>
                        Open the booking
                    </Button>
                </div>
            </div>
        )
    },
}

/** The migration map: every Solar glyph merchant-mobile imported, and the Autara icon that replaces it. */
export const SolarMap: Story = {
    render: () => {
        const all = { ...ObjectGlyphs, ...UtilityGlyphs } as Record<string, AutaraIconComponent>
        return (
            <div className="p-6" style={{ color: 'var(--text-strong)' }}>
                <p className="mb-4 text-sm text-[var(--text-muted)]">
                    {Object.keys(SOLAR_TO_AUTARA).length} Solar names to{' '}
                    {new Set(Object.values(SOLAR_TO_AUTARA)).size} Autara icons.
                </p>
                <table className="text-sm">
                    <thead>
                        <tr className="text-left text-xs text-[var(--text-muted)]">
                            <th className="py-1 pr-6 font-medium">Solar</th>
                            <th className="py-1 font-medium">Autara</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(SOLAR_TO_AUTARA).map(([solar, autara]) => {
                            const Icon = all[autara]
                            return (
                                <tr key={solar}>
                                    <td className="py-1 pr-6 text-[var(--text-muted)]">{solar}</td>
                                    <td className="py-1">
                                        <span className="flex items-center gap-2">
                                            <Icon size={20} /> {autara}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        )
    },
}
