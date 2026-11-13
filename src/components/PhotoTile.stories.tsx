import { useEffect, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PhotoTile, type PhotoTileProps } from './PhotoTile'

/**
 * AUTM-1882. One photo on its way in, in every state of the plan's states
 * table (knowledge/project_photos_plan_2026_11_13.md, section 6). The words
 * come from PHOTO_COPY; nothing here is typed by the story.
 *
 * Sizes: 4.5rem is the composer's tray (glyph only, words read out), 7rem a
 * car slot on a phone (the short words show), 11rem a roomy slot (every word
 * shows). "On a white photo" is the worst case for the scrim.
 */
const meta: Meta<typeof PhotoTile> = {
    title: 'Photos/PhotoTile',
    component: PhotoTile,
    parameters: { layout: 'padded' },
    args: {
        state: 'ready',
        src: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=600&h=600&q=70',
        index: 2,
        total: 3,
        onRemove: () => {},
        onRetry: () => {},
        onOpen: () => {},
    },
    // One tile at a roomy slot's width; the grids set `parameters.grid` and take the page.
    decorators: [
        (Story, ctx) =>
            ctx.parameters.grid ? (
                <Story />
            ) : (
                <div className="w-[11rem]">
                    <Story />
                </div>
            ),
    ],
}

export default meta
type Story = StoryObj<typeof PhotoTile>

const CAR = 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=600&h=600&q=70'
const INTERIOR = 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=600&h=600&q=70'
/** A pure white photo: what the scrim is held against. */
const WHITE =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><rect width='600' height='600' fill='white'/></svg>"

export const Preparing: Story = { args: { state: 'preparing', src: null } }
export const Uploading: Story = { args: { state: 'uploading', progress: 0.42 } }
/** No progress events yet: the full ring breathes in opacity (still under reduced motion). */
export const UploadingWithoutProgress: Story = { args: { state: 'uploading', progress: null } }
export const Checking: Story = { args: { state: 'checking' } }
export const Ready: Story = { args: { state: 'ready' } }
export const UploadFailed: Story = { args: { state: 'failed', failure: 'upload' } }
export const CheckUnavailable: Story = { args: { state: 'failed', failure: 'check', src: INTERIOR } }
/** The refused photo is not drawn again. Remove only. */
export const Refused: Story = { args: { state: 'refused' } }
/** Erased: "Photo no longer available". */
export const Unavailable: Story = { args: { state: 'unavailable', src: null } }
/** A signed URL that has run out: the placeholder, and `onImageError` asks for a new one. */
export const ExpiredUrl: Story = {
    args: { state: 'ready', src: 'https://images.unsplash.com/photo-0000000000000-broken?w=10' },
}
/** Without `onRemove` and `onOpen`: a photo shown, nothing to do. */
export const ReadOnly: Story = { args: { state: 'ready', onRemove: undefined, onOpen: undefined } }

const STATES: Array<[string, Partial<PhotoTileProps> & Pick<PhotoTileProps, 'state'>]> = [
    ['Preparing', { state: 'preparing', src: null }],
    ['Uploading', { state: 'uploading', progress: 0.42 }],
    ['Checking', { state: 'checking', src: INTERIOR }],
    ['Ready', { state: 'ready' }],
    ['Upload failed', { state: 'failed', failure: 'upload' }],
    ['Check unavailable', { state: 'failed', failure: 'check', src: INTERIOR }],
    ['Refused', { state: 'refused' }],
    ['Erased', { state: 'unavailable', src: null }],
]

function Grid({ size, src = CAR, captions }: { size: string; src?: string; captions?: 'all' | 'short' }): ReactNode {
    return (
        <div className="flex flex-wrap gap-4">
            {STATES.map(([name, props], i) => (
                <figure key={name} className="flex flex-col gap-1.5" style={{ width: size }}>
                    <PhotoTile
                        src={src}
                        index={i + 1}
                        total={STATES.length}
                        captions={captions}
                        onRemove={() => {}}
                        onRetry={() => {}}
                        onOpen={() => {}}
                        {...props}
                    />
                    <figcaption className="text-[0.8125rem] text-[var(--text-muted)]">{name}</figcaption>
                </figure>
            ))}
        </div>
    )
}

const wide = [(Story: () => ReactNode) => <div className="max-w-[60rem]">{Story()}</div>]
const grid = { grid: true }

/** Every state at the three sizes it is used at, light. */
export const EveryStateLight: Story = {
    parameters: grid,
    globals: { theme: 'light' },
    decorators: wide,
    render: () => (
        <div className="flex flex-col gap-8">
            <Grid size="4.5rem" />
            <Grid size="7rem" />
            <Grid size="11rem" />
        </div>
    ),
}

/** Every state at the three sizes, dark. Photos and the scrim do not change with the theme; the band tiles do. */
export const EveryStateDark: Story = {
    parameters: grid,
    globals: { theme: 'dark' },
    decorators: wide,
    render: () => (
        <div className="flex flex-col gap-8">
            <Grid size="4.5rem" />
            <Grid size="7rem" />
            <Grid size="11rem" />
        </div>
    ),
}

/** On a pure white photo: the remove cross, the ring and the words still read at 4.5:1 on the scrim. */
export const OnAWhitePhoto: Story = {
    parameters: grid,
    decorators: wide,
    render: () => <Grid size="11rem" src={WHITE} />,
}

/** Sets the root to 200%, as a reader's text size does, while the story is open. */
function LargeTextRoot({ children }: { children: ReactNode }) {
    useEffect(() => {
        const before = document.documentElement.style.fontSize
        document.documentElement.style.fontSize = '200%'
        return () => {
            document.documentElement.style.fontSize = before
        }
    }, [])
    return <>{children}</>
}

/** At 200% text: the tiles are in rem, so they grow with the words and nothing is cut. */
export const LargeText: Story = {
    parameters: grid,
    decorators: wide,
    render: () => (
        <LargeTextRoot>
            <Grid size="7rem" />
        </LargeTextRoot>
    ),
}
