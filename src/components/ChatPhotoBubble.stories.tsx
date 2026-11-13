import { useState, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatPhotoBubble, type ChatPhoto } from './ChatPhotoBubble'
import { MessageThread, type MessageItem } from './MessageThread'
import { PhotoViewer } from './PhotoViewer'

/**
 * AUTM-1882. Photos in the booking thread, one to four in a bubble, sized
 * from each photo's width and height so nothing moves as they load. Messages'
 * photo bubble on Mobbin (steal); Agoda's disclaimer bubble in the thread
 * (avoid: who can see the photos is said once, in the + menu).
 */
const meta: Meta<typeof ChatPhotoBubble> = {
    title: 'Photos/ChatPhotoBubble',
    component: ChatPhotoBubble,
    parameters: { layout: 'padded' },
    args: { side: 'own', photos: [], onOpen: () => {} },
    decorators: [
        (Story) => (
            <div className="flex max-w-[26rem] flex-col">
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof ChatPhotoBubble>

const shot = (id: string, width: number, height: number, alt?: string): ChatPhoto => ({
    id,
    width,
    height,
    alt,
    src: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=70`,
})
const LANDSCAPE = shot('photo-1607860108855-64acf2078ed9', 800, 600, 'The car on the driveway, front left')
const PORTRAIT = shot('photo-1601362840469-51e4d8d58785', 600, 800, 'Dog hair on the back seat')
const SQUARE = shot('photo-1503376780353-7e6692767b70', 600, 600)
const WIDE = shot('photo-1542362567-b07e54358753', 1600, 600)

export const OneLandscape: Story = { args: { photos: [LANDSCAPE] } }
/** A phone's 3:4 portrait keeps its shape. */
export const OnePortrait: Story = { args: { photos: [PORTRAIT] } }
/** A panorama is held at 16:9 and cropped to fill. */
export const OneWide: Story = { args: { photos: [WIDE] } }
export const Two: Story = { args: { photos: [LANDSCAPE, PORTRAIT] } }
export const Three: Story = { args: { photos: [PORTRAIT, LANDSCAPE, SQUARE] } }
export const Four: Story = { args: { photos: [LANDSCAPE, PORTRAIT, SQUARE, WIDE] } }
export const WithCaption: Story = {
    args: { photos: [LANDSCAPE, PORTRAIT], caption: "Here's the scuff on the rear bumper, and the back seat." },
}
export const Incoming: Story = { args: { side: 'incoming', photos: [SQUARE], caption: 'All done. Before and after.' } }
/** One of three erased: it keeps its place and says so. */
export const OneErased: Story = { args: { photos: [LANDSCAPE, { ...PORTRAIT, state: 'unavailable', src: null }, SQUARE] } }
/** A signed URL that has run out: the placeholder holds the place and `onImageError` asks for a new one. */
export const ExpiredUrl: Story = {
    args: { photos: [{ ...LANDSCAPE, src: 'https://images.unsplash.com/photo-0000000000000-broken?w=10' }] },
}

function Every({ side }: { side: 'own' | 'incoming' }) {
    return (
        <div className={side === 'own' ? 'flex flex-col items-end gap-3' : 'flex flex-col items-start gap-3'}>
            <ChatPhotoBubble side={side} photos={[LANDSCAPE]} onOpen={() => {}} />
            <ChatPhotoBubble side={side} photos={[PORTRAIT, SQUARE]} caption="Two of them" onOpen={() => {}} />
            <ChatPhotoBubble side={side} photos={[PORTRAIT, LANDSCAPE, SQUARE]} onOpen={() => {}} />
            <ChatPhotoBubble side={side} photos={[LANDSCAPE, { ...PORTRAIT, state: 'unavailable', src: null }, SQUARE, WIDE]} onOpen={() => {}} />
        </div>
    )
}

/** One to four, both sides, with an erased photo, light. */
export const EveryShapeLight: Story = {
    globals: { theme: 'light' },
    render: () => (
        <div className="flex flex-col gap-6">
            <Every side="own" />
            <Every side="incoming" />
        </div>
    ),
}
export const EveryShapeDark: Story = {
    globals: { theme: 'dark' },
    render: () => (
        <div className="flex flex-col gap-6">
            <Every side="own" />
            <Every side="incoming" />
        </div>
    ),
}

function Thread() {
    const [viewer, setViewer] = useState<{ photos: ChatPhoto[]; index: number } | null>(null)
    const open = (photos: ChatPhoto[]) => (index: number) => setViewer({ photos, index })
    const mine = [LANDSCAPE, PORTRAIT]
    const theirs = [SQUARE, WIDE, LANDSCAPE]
    const items: MessageItem[] = [
        { id: '1', side: 'incoming', text: 'Hi Alex, see you Saturday at 9. Anything I should know?', createdAt: '2026-11-13T09:02:00+11:00' },
        {
            id: '2',
            side: 'own',
            createdAt: '2026-11-13T09:04:00+11:00',
            body: <ChatPhotoBubble side="own" photos={mine} caption="A scuff on the bumper, and the dog's seat." onOpen={open(mine)} />,
        },
        { id: '3', side: 'incoming', text: 'No problem, I will bring the pet hair tool.', createdAt: '2026-11-13T09:05:00+11:00' },
        {
            id: '4',
            side: 'incoming',
            createdAt: '2026-11-15T11:40:00+11:00',
            body: <ChatPhotoBubble side="incoming" photos={theirs} caption="All done. Before and after." onOpen={open(theirs)} />,
        },
    ]
    return (
        <div className="flex h-[40rem] max-w-[27.5rem] flex-col rounded-[1.25rem] bg-[var(--paper)]">
            <MessageThread items={items} anchor="end" logLabel="Messages with Sam" />
            {viewer ? (
                <PhotoViewer
                    open
                    onOpenChange={(o) => !o && setViewer(null)}
                    photos={viewer.photos}
                    index={viewer.index}
                    onIndexChange={(index) => setViewer((v) => (v ? { ...v, index } : v))}
                />
            ) : null}
        </div>
    )
}

const inThread = [(Story: () => ReactNode) => <div className="max-w-[30rem]">{Story()}</div>]

/** In the thread as `MessageItem.body`, aligned and time-stamped with the messages. Tap a photo to open the viewer. */
export const InThreadLight: Story = { globals: { theme: 'light' }, decorators: inThread, render: () => <Thread /> }
export const InThreadDark: Story = { globals: { theme: 'dark' }, decorators: inThread, render: () => <Thread /> }
