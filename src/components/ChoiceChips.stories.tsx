import { useEffect, useState, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChoiceChips, type ChoiceChipOption } from './ChoiceChips'
import { FormField } from './FormField'
import { Input } from './Input'
import type { AutaraIconComponent } from '../icons/AutaraIcon'
import {
    CategoryComfortIcon,
    CategoryElectronicsIcon,
    CategoryExteriorIcon,
    CategoryFleetIcon,
    CategoryGraphicsIcon,
    CategoryInteriorIcon,
    CategoryLuxuryIcon,
    CategoryPerformanceIcon,
    CategoryProtectionIcon,
    CategoryStylingIcon,
} from '../icons/category-glyphs'

/**
 * AUTM-1867: pick one of a few in one tap. The merchant's "Book a customer
 * in" opens on its most-booked services and the next free times as chips.
 */
const meta = {
    title: 'Molecules/ChoiceChips',
    component: ChoiceChips,
    parameters: { layout: 'padded' },
    args: { options: [], value: '', onChange: () => {}, label: 'Service' },
} satisfies Meta<typeof ChoiceChips>

export default meta
type Story = StoryObj<typeof meta>

const SERVICES: ChoiceChipOption[] = [
    { value: 'full', label: 'Full interior and exterior clean' },
    { value: 'express', label: 'Express wash' },
    { value: 'interior', label: 'Interior clean' },
    { value: 'paint', label: 'Paint correction' },
]

const TIMES: ChoiceChipOption[] = [
    { value: '09:00', label: '9:00 am' },
    { value: '09:30', label: '9:30 am' },
    { value: '11:00', label: '11:00 am' },
    { value: '13:30', label: '1:30 pm' },
    { value: '14:00', label: '2:00 pm', disabled: true, reason: 'another booking runs through this time' },
    { value: '15:30', label: '3:30 pm' },
]

function Live({ options, start = '', ...rest }: Omit<Parameters<typeof ChoiceChips>[0], 'value' | 'onChange'> & { start?: string }) {
    const [value, setValue] = useState(start)
    return (
        <div className="max-w-[44rem] space-y-3">
            <ChoiceChips {...rest} options={options} value={value} onChange={setValue} />
            <p className="text-[0.8125rem] text-[var(--text-muted)]">Chosen: {value || 'nothing yet'}</p>
        </div>
    )
}

/** Services, most booked first, with More opening the full list. */
export const Services: Story = {
    render: () => (
        <Live
            label="Service"
            options={SERVICES}
            start="full"
            action={{ label: 'More', onClick: () => {}, opensDialog: true }}
        />
    ),
}

/** Times for a day, one taken (struck through, its reason read out), and Pick another day. */
export const Times: Story = {
    render: () => (
        <div className="space-y-2">
            <p className="text-[0.8125rem] font-medium text-[var(--text-muted)]">Today, Tue 14 Oct</p>
            <Live
                label="Times today"
                options={TIMES}
                action={{ label: 'Pick another day', onClick: () => {}, opensDialog: true }}
            />
        </div>
    ),
}

/** One row that scrolls sideways, for a phone. */
export const Row: Story = {
    render: () => (
        <div className="max-w-[390px]">
            <Live label="Times today" layout="row" options={TIMES} action={{ label: 'Pick another day', onClick: () => {} }} />
        </div>
    ),
}

/** Nothing chosen and the form refused: the group says it is invalid. */
export const Invalid: Story = {
    render: () => <Live label="Service" options={SERVICES} invalid />,
}

function LargeText({ children }: { children: ReactNode }) {
    useEffect(() => {
        const root = document.documentElement
        const was = root.style.fontSize
        root.style.fontSize = '200%'
        return () => {
            root.style.fontSize = was
        }
    }, [])
    return <>{children}</>
}

/** 200% text: the chips grow and wrap, none cut off. */
export const LargeTextWraps: Story = {
    render: () => (
        <LargeText>
            <div className="max-w-[390px]">
                <Live label="Service" options={SERVICES} start="express" action={{ label: 'More', onClick: () => {} }} />
            </div>
        </LargeText>
    ),
}

/**
 * AUTM-2140 R8, Don's pick C2: the ten service categories as icon tiles.
 * Names are QA's ten active categories; categories are admin-managed rows,
 * so the merchant app maps each one to its icon (here by a slug) and keeps
 * its `service-form-category-chip` test ids on the options.
 */
const CATEGORIES: [string, string, AutaraIconComponent][] = [
    ['exterior', 'Exterior Car Care & Detailing', CategoryExteriorIcon],
    ['interior', 'Interior Detailing & Protection', CategoryInteriorIcon],
    ['protection', 'Protection & Restoration', CategoryProtectionIcon],
    ['styling', 'Exterior Styling & Body Modifications', CategoryStylingIcon],
    ['graphics', 'Graphics, Decals & Light-Up Aesthetic Mods', CategoryGraphicsIcon],
    ['comfort', 'Interior Customisation & Comfort Upgrades', CategoryComfortIcon],
    ['electronics', 'Infotainment, Electronics & Cluster Upgrades', CategoryElectronicsIcon],
    ['performance', 'Performance & Sound Appearance Mods', CategoryPerformanceIcon],
    ['luxury', 'Luxury & Lifestyle Add-ons', CategoryLuxuryIcon],
    ['fleet', 'Fleet & Business Services', CategoryFleetIcon],
]

const CATEGORY_TILES: ChoiceChipOption[] = CATEGORIES.map(([value, label, Icon]) => ({
    value,
    label,
    icon: <Icon />,
    selectedIcon: <Icon active />,
    testId: `service-form-category-chip-${value}`,
}))

/** The ten categories, two even columns, Protection & Restoration chosen. */
export const CategoryTiles: Story = {
    render: () => (
        <div className="max-w-[48rem]">
            <Live label="Category" layout="tiles" options={CATEGORY_TILES} start="protection" />
        </div>
    ),
}

/**
 * In context: the merchant's New service form, the tiles on the white card
 * in the Stone room, as C2 draws it, Protection & Restoration chosen. The
 * card re-points `--field-glass` to the band, as a consumer does for a field
 * on a white card.
 */
export const CategoryTilesInContext: Story = {
    parameters: { layout: 'fullscreen' },
    render: () => (
        <div className="min-h-screen bg-[var(--band)] p-6 text-[var(--text-strong)]">
            <div className="mx-auto max-w-[48rem]">
                <h2>
                    <span className="block text-[1.75rem] leading-tight font-bold">New service</span>
                </h2>
                <div className="mt-5 grid gap-6 rounded-3xl bg-[var(--raised)] p-7 [--field-glass:var(--band)]">
                    <FormField label="Service name">
                        <Input defaultValue="Ceramic coating, 2 year" />
                    </FormField>
                    <div className="grid gap-2">
                        <p id="category-label" className="text-[0.875rem] font-medium">
                            Category
                        </p>
                        <CategoryLive start="protection" />
                        <p className="text-[0.8125rem] text-[var(--text-muted)]">
                            Customers find your service under this category.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    ),
}

function CategoryLive({ start = '' }: { start?: string }) {
    const [value, setValue] = useState(start)
    // On the white card the tiles take the room's tone (band), as the Stone rule asks.
    return (
        <ChoiceChips
            label="Category"
            labelledBy="category-label"
            layout="tiles"
            options={CATEGORY_TILES}
            value={value}
            onChange={setValue}
            testId="service-form-category"
        />
    )
}

/** A phone (390): the container is under 32rem, so one column; names wrap inside their tile. */
export const CategoryTilesPhone: Story = {
    render: () => (
        <div className="w-[390px] max-w-full">
            <Live label="Category" layout="tiles" options={CATEGORY_TILES} start="graphics" />
        </div>
    ),
}

/** One option off (struck through, its reason read out), and the form refused with nothing chosen. */
export const CategoryTilesEdgeCases: Story = {
    render: () => (
        <div className="max-w-[48rem]">
            <Live
                label="Category"
                layout="tiles"
                invalid
                options={[
                    ...CATEGORY_TILES.slice(0, 3),
                    { ...CATEGORY_TILES[3], disabled: true, reason: 'not offered by this business yet' },
                    { value: 'other', label: 'A category with no icon yet, its name set long enough to wrap onto two lines' },
                ]}
            />
        </div>
    ),
}

/** 200% text: one column in any normal container, the disc and icon scale, nothing cut off. */
export const CategoryTilesLargeText: Story = {
    render: () => (
        <LargeText>
            <div className="max-w-[48rem]">
                <Live label="Category" layout="tiles" options={CATEGORY_TILES.slice(0, 4)} start="interior" />
            </div>
        </LargeText>
    ),
}

