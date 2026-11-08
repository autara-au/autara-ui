import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import { Button } from './Button'
import { ImageCropDialog } from './ImageCropDialog'

/**
 * ImageCropDialog — pick-then-crop for any uploaded image.
 *
 * - Pan + zoom inside a fixed-aspect window; confirm exports a JPEG `File`.
 * - Shape-agnostic: pass `aspect` (and `cropShape="round"` for avatars).
 * - Drive `open` + `src` from the consumer; the demo wires a sample image
 *   and an "upload your own" picker so you can feel the real interaction.
 */

// Self-contained 1200×800 sample so the story needs no network.
const SAMPLE_IMAGE =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
            <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#4E1BBD"/>
                    <stop offset="1" stop-color="#22d3a6"/>
                </linearGradient>
            </defs>
            <rect width="1200" height="800" fill="url(#g)"/>
            <circle cx="360" cy="300" r="160" fill="#ffffff" opacity="0.85"/>
            <rect x="700" y="440" width="360" height="240" rx="24" fill="#0c0a14" opacity="0.6"/>
            <text x="60" y="740" font-family="sans-serif" font-size="48" fill="#ffffff">1200 × 800 sample</text>
        </svg>`,
    )

const meta: Meta<typeof ImageCropDialog> = {
    title: 'Components/ImageCropDialog',
    component: ImageCropDialog,
    parameters: { layout: 'centered' },
}
export default meta
type Story = StoryObj<typeof meta>

function Demo({
    aspect,
    cropShape,
    title,
    defaultOpen = false,
}: {
    aspect: number
    cropShape?: 'rect' | 'round'
    title: string
    /** Open on load, so the dialog's own chrome is visible without a click. */
    defaultOpen?: boolean
}) {
    const [open, setOpen] = React.useState(defaultOpen)
    const [src, setSrc] = React.useState<string | null>(SAMPLE_IMAGE)
    const [resultUrl, setResultUrl] = React.useState<string | null>(null)
    const fileRef = React.useRef<HTMLInputElement>(null)

    function pickOwn(file: File) {
        const url = URL.createObjectURL(file)
        setSrc(url)
        setOpen(true)
    }

    return (
        <div className="flex w-[420px] flex-col items-start gap-4">
            <div className="flex gap-2">
                <Button variant="primary" size="md" onClick={() => setOpen(true)}>
                    Crop sample
                </Button>
                <Button
                    variant="outline"
                    size="md"
                    onClick={() => fileRef.current?.click()}
                >
                    Upload your own
                </Button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) pickOwn(f)
                        e.target.value = ''
                    }}
                />
            </div>

            {resultUrl ? (
                <figure className="flex flex-col gap-2">
                    <figcaption className="text-[0.75rem] font-medium text-[var(--text-subtle)]">
                        Cropped result
                    </figcaption>
                    <img
                        src={resultUrl}
                        alt="cropped"
                        className={
                            cropShape === 'round'
                                ? 'h-28 w-28 rounded-full object-cover'
                                : 'w-[360px] rounded-xl object-cover'
                        }
                    />
                </figure>
            ) : null}

            <ImageCropDialog
                open={open}
                src={src}
                aspect={aspect}
                cropShape={cropShape}
                title={title}
                onCropComplete={(file) => {
                    if (resultUrl) URL.revokeObjectURL(resultUrl)
                    setResultUrl(URL.createObjectURL(file))
                    setOpen(false)
                }}
                onCancel={() => setOpen(false)}
            />
        </div>
    )
}

export const ProfilePicture: Story = {
    render: () => (
        <Demo aspect={1} cropShape="round" title="Crop your profile photo" />
    ),
}

export const CoverBanner: Story = {
    render: () => <Demo aspect={16 / 9} title="Crop your cover photo" />,
}

/**
 * AUTM-1483: opens on load so the zoom control's label is on screen without a
 * click. It reads "Zoom" in sentence case at 0.75rem and weight 500, with no
 * letterspacing; it used to render as letterspaced ZOOM at a fixed 11px.
 *
 * Kept off the docs page (`!autodocs`): an open modal there would cover the
 * page and trap focus in it. Open it from the sidebar, and check both themes.
 */
export const OpenZoomLabel: Story = {
    name: 'Open: the zoom label (AUTM-1483)',
    tags: ['!autodocs'],
    render: () => <Demo aspect={4 / 3} title="Crop your photo" defaultOpen />,
}

/**
 * AUTM-776 — the three ratios the product actually uses, side by side.
 *
 * The client reported that cropping a profile or cover photo felt cramped
 * while the services picker felt fine. Same dialog, same code — only the
 * ratio differed. The stage was a fixed-height box, so a wide ratio was
 * limited by width and left dead bands above and below, while 4/3 filled it.
 *
 * Open these three in order. Before the fix the cover window was visibly the
 * smallest of the three despite being the widest image; now each one gets the
 * full width and its natural height.
 */
export const ServicePhoto: Story = {
    render: () => <Demo aspect={4 / 3} title="Crop your photo" />,
}

export const RatioComparison: Story = {
    name: 'Ratio comparison (AUTM-776)',
    render: () => (
        <div className="flex flex-wrap gap-4">
            <Demo aspect={1} cropShape="round" title="Avatar — 1:1" />
            <Demo aspect={4 / 3} title="Service — 4:3" />
            <Demo aspect={16 / 9} title="Cover — 16:9" />
        </div>
    ),
}

/**
 * A portrait ratio is the case the old fixed height was really protecting:
 * without a cap, a tall stage pushes Cancel/Save off a short screen. The
 * max-height clamp still holds that line — check the actions stay reachable.
 */
export const TallRatioStaysUsable: Story = {
    render: () => <Demo aspect={3 / 4} title="Portrait — 3:4" />,
}
