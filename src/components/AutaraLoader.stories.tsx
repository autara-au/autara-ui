import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AutaraLoader, type AutaraLoaderSize } from './AutaraLoader'
import { Button } from './Button'
import { Skeleton } from './Skeleton'

/**
 * AutaraLoader: the Autara mark, turning, for "this is loading" (AUTM-1706).
 *
 * 48 to 96 for app boot and a page with nothing to show yet; 16 to 24 inline,
 * which is what Button's busy state uses. Content areas keep shape-matched
 * skeletons: they make a page feel faster than any loader.
 *
 * Check every story in both themes with the Theme toolbar. To see the
 * reduced-motion form for real: DevTools, Rendering, emulate
 * `prefers-reduced-motion: reduce`, then reload.
 */
const meta = {
    title: 'Atoms/AutaraLoader',
    component: AutaraLoader,
    parameters: { layout: 'padded' },
    args: { size: 48, tone: 'accent', label: 'Loading' },
    argTypes: {
        size: { control: 'select', options: [16, 20, 24, 48, 64, 80, 96] },
        tone: { control: 'inline-radio', options: ['accent', 'current', 'on-photo'] },
    },
} satisfies Meta<typeof AutaraLoader>

export default meta
type Story = StoryObj<typeof meta>

const SIZES: AutaraLoaderSize[] = [16, 20, 24, 48, 64, 80, 96]

export const Default: Story = {}

export const EverySize: Story = {
    name: 'Every size',
    render: () => (
        <div className="flex flex-col gap-6">
            <div className="flex items-end gap-8">
                {SIZES.slice(0, 3).map((s) => (
                    <figure key={s} className="m-0 flex flex-col items-center gap-2">
                        <AutaraLoader size={s} label={`Loading, ${s} pixels`} />
                        <figcaption className="text-sm text-[var(--text-muted)]">{s} inline</figcaption>
                    </figure>
                ))}
            </div>
            <div className="flex flex-wrap items-end gap-10">
                {SIZES.slice(3).map((s) => (
                    <figure key={s} className="m-0 flex flex-col items-center gap-2">
                        <AutaraLoader size={s} label={`Loading, ${s} pixels`} />
                        <figcaption className="text-sm text-[var(--text-muted)]">{s} page</figcaption>
                    </figure>
                ))}
            </div>
        </div>
    ),
}

/** Light and dark side by side; `--accent` lifts in dark so the mark never disappears. */
export const BothThemes: Story = {
    name: 'Light and dark',
    render: () => (
        <div className="grid gap-4 sm:grid-cols-2">
            {[
                { label: 'Light', theme: undefined },
                { label: 'Dark', theme: 'dark' as const },
            ].map((col) => (
                <div
                    key={col.label}
                    data-theme={col.theme}
                    className="flex flex-col items-center gap-5 rounded-autara-lg bg-[var(--background)] p-8"
                >
                    <p className="m-0 text-sm font-medium text-[var(--text-muted)]">{col.label}</p>
                    <AutaraLoader size={64} label={`Loading, ${col.label.toLowerCase()} theme`} />
                    <div className="flex items-center gap-3 text-[var(--text-strong)]">
                        <AutaraLoader size={20} tone="current" decorative />
                        <span className="text-[0.9375rem]">Saving your hours</span>
                    </div>
                    <div className="flex gap-2">
                        <Button busy>Save</Button>
                        <Button busy>
                            Save
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    ),
}

export const OnPhoto: Story = {
    name: 'On a photo',
    render: () => (
        <div className="relative grid h-56 w-80 place-items-center overflow-hidden rounded-autara-lg bg-[var(--hero)]">
            <div className="grid size-24 place-items-center rounded-full bg-black/60">
                <AutaraLoader size={48} tone="on-photo" label="Loading photo" />
            </div>
        </div>
    ),
}

/**
 * What a reduced-motion user sees: the true mark, all rays at full strength,
 * breathing between 100% and 55% opacity. Shown here as a still picture of
 * that state; emulate the media query to see it breathe.
 */
export const ReducedMotion: Story = {
    name: 'A11y: prefers-reduced-motion',
    render: () => (
        <div className="flex max-w-xl flex-col gap-4 rounded-autara-lg bg-[var(--surface)] p-6 text-[var(--text-strong)]">
            <div className="flex items-center gap-6">
                <span className="inline-flex size-16 text-[var(--accent)]" aria-hidden>
                    <svg viewBox="0.2 0.3 500 500" className="block size-full" fill="currentColor">
                        <circle cx="250.2" cy="250.3" r="100.6" fill="none" stroke="currentColor" strokeWidth="67.1" />
                        <path d="M176.3 15h147.8l-73.9 76.4zM364.3 31.7l104.5 104.5-106.3 1.8zM485.4 176.3v147.8l-76.4-73.9zM468.8 364.3l-104.5 104.5-1.8-106.3zM324.2 485.5H176.4l73.9-76.4zM136.2 468.8L31.7 364.3l106.3-1.8zM15 324.2V176.4l76.4 73.9zM31.6 136.2L136.2 31.7l1.8 106.3z" />
                    </svg>
                </span>
                <p className="m-0 text-sm leading-relaxed text-[var(--text-muted)]">
                    No turning. Every ray at full strength, so it is the logo standing still, and it breathes in
                    opacity on the same 1400ms the skeletons pulse on. A frozen, graded mark would look like a stuck
                    loader.
                </p>
            </div>
            <p className="m-0 text-sm text-[var(--text-muted)]">
                The live loader, in whatever your browser prefers: <AutaraLoader size={24} />
            </p>
        </div>
    ),
}

/** App boot or a route with nothing to show yet: the mark alone, centred, on the page ground. */
export const PageBoot: Story = {
    name: 'In context: app boot',
    parameters: { layout: 'fullscreen' },
    render: () => (
        <div className="grid min-h-[70vh] place-items-center bg-[var(--background)]">
            <AutaraLoader size={64} label="Loading Autara" />
        </div>
    ),
}

/**
 * The loader is for the boot; the page that follows keeps skeletons for its
 * content, because a known shape feels faster than any loader.
 */
export const BootThenSkeleton: Story = {
    name: 'In context: boot, then skeletons',
    render: function BootStory() {
        const [stage, setStage] = React.useState<'boot' | 'content'>('boot')
        return (
            <div className="flex max-w-md flex-col gap-4">
                <div>
                    <Button size="sm" variant="quiet" onClick={() => setStage((s) => (s === 'boot' ? 'content' : 'boot'))}>
                        {stage === 'boot' ? 'Shell ready' : 'Boot again'}
                    </Button>
                </div>
                <div className="grid min-h-56 rounded-autara-lg bg-[var(--surface)] p-5">
                    {stage === 'boot' ? (
                        <div className="grid place-items-center">
                            <AutaraLoader size={48} label="Loading your workspace" />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3" role="status" aria-live="polite">
                            <span className="sr-only">Fetching your bookings</span>
                            <Skeleton label={null} className="h-6 w-40" />
                            <Skeleton label={null} className="h-16 w-full" />
                            <Skeleton label={null} className="h-16 w-full" />
                        </div>
                    )}
                </div>
            </div>
        )
    },
}

/**
 * Button's busy state, every size and the main variants. The mark turns in
 * the label's colour where the label was; the label is still there,
 * transparent, so the width does not move and a screen reader still hears
 * the button's name, with aria-busy.
 */
export const ButtonLoading: Story = {
    name: 'Button loading',
    render: function ButtonLoadingStory() {
        const [busy, setBusy] = React.useState(true)
        return (
            <div className="flex flex-col gap-5">
                <div>
                    <Button size="sm" variant="quiet" onClick={() => setBusy((b) => !b)}>
                        {busy ? 'Show resting' : 'Show busy'}
                    </Button>
                </div>
                {(['sm', 'md', 'lg'] as const).map((size) => (
                    <div key={size} className="flex flex-wrap items-center gap-3">
                        <span className="w-8 text-sm text-[var(--text-muted)]">{size}</span>
                        <Button size={size} busy={busy}>
                            Book and pay
                        </Button>
                        <Button size={size} busy={busy}>
                            Confirm booking
                        </Button>
                        <Button size={size} variant="quiet" busy={busy}>
                            Save
                        </Button>
                    </div>
                ))}
                <div className="max-w-xs">
                    <Button fullWidth size="lg" busy={busy}>
                        Pay the deposit
                    </Button>
                </div>
            </div>
        )
    },
}

/** A real submit: tap, the button goes busy for two seconds, and nothing around it moves. */
export const ButtonInContext: Story = {
    name: 'In context: submitting a form',
    render: function SubmitStory() {
        const [busy, setBusy] = React.useState(false)
        const [done, setDone] = React.useState(false)
        return (
            <form
                className="flex max-w-sm flex-col gap-3 rounded-autara-lg bg-[var(--surface)] p-5 text-[var(--text-strong)]"
                onSubmit={(e) => {
                    e.preventDefault()
                    setDone(false)
                    setBusy(true)
                    window.setTimeout(() => {
                        setBusy(false)
                        setDone(true)
                    }, 2000)
                }}
            >
                <p className="m-0 text-base font-medium">Express wash, Saturday 09:00</p>
                <p className="m-0 text-sm text-[var(--text-muted)]">$20 deposit now, $45 on the day.</p>
                <div className="flex items-center gap-3">
                    <Button type="submit" busy={busy}>
                        Book and pay
                    </Button>
                    <span className="text-sm text-[var(--text-muted)]" aria-live="polite">
                        {done ? 'Booked. We sent the details to your email.' : ''}
                    </span>
                </div>
            </form>
        )
    },
}

/** At 200% text the loader grows with the text, because its size is in rem. */
export const TextScale200: Story = {
    name: 'Edge: 200% text',
    render: function TextScaleStory() {
        React.useLayoutEffect(() => {
            const html = document.documentElement
            const before = html.style.fontSize
            html.style.fontSize = '200%'
            return () => {
                html.style.fontSize = before
            }
        }, [])
        return (
            <div className="flex flex-wrap items-center gap-4">
                <AutaraLoader size={24} />
                <AutaraLoader size={48} />
                <Button busy>Book and pay</Button>
            </div>
        )
    },
}
