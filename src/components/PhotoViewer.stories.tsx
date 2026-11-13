import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PhotoViewer, type PhotoViewerPhoto, type PhotoViewerProps } from './PhotoViewer'
import { Button } from './Button'

/**
 * AUTM-1882. A photo full screen. Partiful's and Reddit's viewers on Mobbin
 * (steal): close as a disc on the left, the count in words in the middle, a
 * black stage. Airbnb's "1 / 2" (adapt: we say "1 of 2", which reads aloud).
 *
 * Each story opens it; close it with the cross or Escape and reopen it from
 * the button, which is where focus returns. Arrow keys and a swipe (or a
 * mouse drag) move between photos.
 */
const meta: Meta<typeof PhotoViewer> = {
    title: 'Photos/PhotoViewer',
    component: PhotoViewer,
    parameters: {
        layout: 'padded',
        // A full-screen dialog per story: each in its own frame on the docs page.
        docs: { story: { inline: false, iframeHeight: 640 } },
    },
    args: { photos: [], open: true, onOpenChange: () => {} },
}

export default meta
type Story = StoryObj<typeof PhotoViewer>

const shot = (id: string, width: number, height: number, alt: string): PhotoViewerPhoto => ({
    id,
    width,
    height,
    alt,
    src: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=75`,
})
const PHOTOS: PhotoViewerPhoto[] = [
    shot('photo-1607860108855-64acf2078ed9', 1200, 900, 'The car on the driveway, front left'),
    shot('photo-1601362840469-51e4d8d58785', 900, 1200, 'Dog hair on the back seat'),
    shot('photo-1503376780353-7e6692767b70', 1200, 1200, 'A scuff on the rear bumper'),
]

function Opener(props: Partial<PhotoViewerProps> & { photos: PhotoViewerPhoto[] }) {
    const [open, setOpen] = useState(true)
    const [index, setIndex] = useState(props.index ?? 0)
    return (
        <>
            <Button variant="quiet" onClick={() => setOpen(true)}>
                Open photos
            </Button>
            <PhotoViewer {...props} open={open} onOpenChange={setOpen} index={index} onIndexChange={setIndex} />
        </>
    )
}

export const ThreePhotos: Story = { render: () => <Opener photos={PHOTOS} /> }
/** On the second: previous and next both show. */
export const Middle: Story = { render: () => <Opener photos={PHOTOS} index={1} /> }
/** On the last: no next. */
export const Last: Story = { render: () => <Opener photos={PHOTOS} index={2} /> }
/** One photo: no count, no arrows. */
export const OnePhoto: Story = { render: () => <Opener photos={[PHOTOS[1]]} /> }
/** An erased photo in the set says so in its place. */
export const ErasedPhoto: Story = {
    render: () => <Opener photos={[PHOTOS[0], { id: 'gone', state: 'unavailable' }, PHOTOS[2]]} index={1} />,
}
/** A signed URL that has run out: its alt text in its place, and `onImageError` asks for a new one. */
export const ExpiredUrl: Story = {
    render: () => (
        <Opener photos={[{ ...PHOTOS[0], src: 'https://images.unsplash.com/photo-0000000000000-broken?w=10' }, PHOTOS[1]]} />
    ),
}
/** A line under the photo, the caller's words. */
export const WithFooter: Story = { render: () => <Opener photos={PHOTOS} footer="From Alex, Fri 13 Nov" /> }
/** The stage is ink in both themes; the app's theme only shows behind it. */
export const Dark: Story = { globals: { theme: 'dark' }, render: () => <Opener photos={PHOTOS} index={1} /> }
