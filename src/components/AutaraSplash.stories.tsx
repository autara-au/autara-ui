import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AutaraSplash, type AutaraSplashOn } from './AutaraSplash'
import { Button } from './Button'

/**
 * AutaraSplash: the Autara mark arriving, then holding while an app starts
 * (Don, 2026-11-05). For whole screens that wait on the app: a boot shell, a
 * boot gate, a sign-in landing. Inline and in-page waits keep `AutaraLoader`.
 *
 * The arrival plays once, about one second: the rays drift in and settle
 * clockwise as the set turns into place, then the ring lands. The hold: one
 * ray at a time lights and drifts a touch outward, flowing round. LIME on
 * deep and dark grounds only.
 *
 * To see the reduced-motion form for real: DevTools, Rendering, emulate
 * `prefers-reduced-motion: reduce`, then press Replay.
 */
const meta = {
    title: 'Atoms/AutaraSplash',
    component: AutaraSplash,
    parameters: { layout: 'fullscreen' },
    args: { size: 96, on: 'deep', intro: true, label: 'Loading Autara' },
    argTypes: {
        size: { control: 'select', options: [64, 80, 96, 112, 128] },
        on: { control: 'inline-radio', options: ['deep', 'dark', 'paper', 'theme'] },
    },
} satisfies Meta<typeof AutaraSplash>

export default meta
type Story = StoryObj<typeof meta>

const GROUND: Record<AutaraSplashOn, string> = {
    deep: 'bg-[var(--brand-deep)] text-[var(--on-deep-muted)]',
    dark: 'bg-[#0e0a1a] text-white/70',
    paper: 'bg-[var(--paper)] text-[var(--text-muted)]',
    theme: 'bg-[var(--paper)] text-[var(--text-muted)]',
}

/** A ground of its own, with Replay, since the arrival only plays on mount. */
function Stage({ on, children, height = 'min-h-[28rem]' }: { on: AutaraSplashOn; children: (key: number) => React.ReactNode; height?: string }) {
    const [key, setKey] = React.useState(0)
    return (
        <div className={`relative grid place-items-center ${height} ${GROUND[on]}`}>
            {children(key)}
            <div className="absolute bottom-4 right-4">
                <Button variant="quiet" size="sm" onClick={() => setKey((k) => k + 1)}>
                    Replay
                </Button>
            </div>
        </div>
    )
}

export const Deep: Story = {
    name: 'On business deep',
    render: (args) => <Stage on="deep">{(k) => <AutaraSplash key={k} {...args} on="deep" />}</Stage>,
}

export const Dark: Story = {
    name: 'On dark',
    render: (args) => <Stage on="dark">{(k) => <AutaraSplash key={k} {...args} on="dark" />}</Stage>,
}

export const Paper: Story = {
    name: 'On paper (no lime)',
    render: (args) => <Stage on="paper">{(k) => <AutaraSplash key={k} {...args} on="paper" />}</Stage>,
}

/** What a boot screen draws: the mark at the centre and the caption hanging below it, out of flow. */
export const BootScreen: Story = {
    name: 'Boot screen',
    render: (args) => (
        <Stage on="deep" height="min-h-[40rem]">
            {(k) => (
                <div key={k} className="relative flex flex-col items-center" role="status" aria-busy="true">
                    <AutaraSplash {...args} on="deep" decorative />
                    <p className="absolute left-1/2 top-full mt-6 w-max -translate-x-1/2 text-[0.9375rem]">
                        Getting things ready…
                    </p>
                    <span className="sr-only">Loading Autara</span>
                </div>
            )}
        </Stage>
    ),
}

/** `elapsed` past the arrival: a second copy continues the hold instead of replaying the intro. */
export const Continuing: Story = {
    name: 'Continuing (intro already played)',
    args: { elapsed: 2400 },
    render: (args) => <Stage on="deep">{(k) => <AutaraSplash key={k} {...args} on="deep" />}</Stage>,
}
