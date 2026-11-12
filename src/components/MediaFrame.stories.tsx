import type { Meta, StoryObj } from '@storybook/react-vite'
import { MediaFrame } from './MediaFrame'
import { BackGlyph } from './_shellGlyphs'

/**
 * AUTM-1781: where a screen shows its subject. A photo when the pro has given
 * one, a map on the day, and their initials on deep purple otherwise.
 */
const meta: Meta<typeof MediaFrame> = {
    title: 'App shell/MediaFrame',
    component: MediaFrame,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <div style={{ maxWidth: 390 }}>{Story()}</div>],
}
export default meta
type Story = StoryObj<typeof MediaFrame>

const PHOTO =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2e1070"/><stop offset="1" stop-color="#4ceaff"/></linearGradient></defs><rect width="16" height="9" fill="url(#g)"/></svg>',
    )

/** A service photo heading the booking. */
export const Photo: Story = { args: { src: PHOTO, alt: 'Paint correction on a white LandCruiser' } }

/** No photo yet: the pro's initials on deep purple, never a grey box. */
export const Initials: Story = { args: { initials: 'FP', label: 'Fitzroy Paint Co' } }

/** The day of a workshop visit: the caller's map fills the frame, with a back control over it. */
export const Map: Story = {
    args: {
        ratio: '4 / 3',
        children: (
            <div
                style={{
                    background:
                        'repeating-linear-gradient(45deg, #f4f2ec 0 12px, #e9e6dc 12px 24px)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#0e0a1a',
                    fontWeight: 700,
                }}
            >
                The caller's map
            </div>
        ),
        overlay: (
            <button
                type="button"
                aria-label="Back"
                className="grid size-11 place-items-center rounded-full bg-[var(--paper)] text-[var(--text-strong)]"
            >
                <BackGlyph />
            </button>
        ),
    },
}

/** Loading: the frame at its final size, so nothing moves when the media lands. */
export const Loading: Story = { args: { loading: true } }

/** The pro card's 52px tile and the live booking's round pro, beside a name. */
export const TileAndRound: Story = {
    render: () => (
        <div className="flex items-center gap-4">
            <MediaFrame shape="tile" initials="FP" className="size-[52px]" />
            <MediaFrame shape="tile" src={PHOTO} alt="" className="size-[52px]" />
            <MediaFrame shape="round" initials="BM" className="size-[52px]" />
            <MediaFrame shape="round" initials="BM" className="size-10" />
        </div>
    ),
}
