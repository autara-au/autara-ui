import type { Meta, StoryObj } from '@storybook/react-vite'
import type { CSSProperties, ReactNode } from 'react'
import { ScrollStory, type ScrollStoryStep } from './ScrollStory'

/**
 * # ScrollStory
 *
 * Steps that play while the page scrolls past them, then let go. AUTM-1679.
 *
 * Scroll the canvas: the stage pins under the bar, the chips say which step
 * is current and each chip's rail fills as its step scrolls by (where the
 * engine has scroll-driven animations; elsewhere a passed step's rail is
 * simply full). "1 of 4" counts along, and the first step's hint fades as its
 * scroll begins. After the last step the page scrolls on as normal. Click a
 * chip to scroll to its step.
 *
 * With reduced motion, or a canvas under 36rem tall, there is no pin: the
 * chips switch the step at once. Try it with the viewport toolbar or your
 * system's reduced motion setting.
 *
 * Nothing listens to wheel, touch or scroll. The current step comes from an
 * IntersectionObserver on one sentinel per step.
 */
const meta = {
    title: 'Marketing/ScrollStory',
    component: ScrollStory,
    parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ScrollStory>

export default meta
type Story = StoryObj<typeof meta>

/* A stand-in screen: a paper window with a few rows, sized by the stage
   (ScrollStory's shot is a size container, so cqw and cqh work inside). */
function Window({ title, rows, phase }: { title: string; rows: string[]; phase: string }) {
    return (
        <div
            style={{
                width: 'min(90cqw, 80cqh * 1.45)',
                aspectRatio: '1.45',
                marginTop: '6cqh',
                borderRadius: '1.25rem',
                background: 'var(--paper)',
                color: 'var(--strong)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                opacity: phase === 'idle' ? 0 : 1,
                transition: 'opacity var(--motion-crossfade) var(--motion-ease-out)',
            }}
        >
            <strong style={{ fontSize: '1.25rem' }}>{title}</strong>
            {rows.map((r) => (
                <div key={r} style={{ background: 'var(--band)', borderRadius: '1rem', padding: '0.875rem 1rem' }}>
                    {r}
                </div>
            ))}
        </div>
    )
}

const STEPS: ScrollStoryStep[] = [
    {
        id: 'today',
        label: 'Today',
        caption: "Today's jobs, the requests waiting on you and what you're owed.",
        render: ({ phase }) => <Window phase={phase} title="Good morning, Harper." rows={['08:00 Express Exterior Wash', '09:00 Full Interior Clean', '12:00 Cut & Polish']} />,
    },
    {
        id: 'schedule',
        label: 'Schedule',
        caption: 'Your week by day, each booking with its time and status.',
        render: ({ phase }) => <Window phase={phase} title="Your schedule" rows={['Mon 12: 2 booked', 'Tue 13: 4 booked', 'Wed 14: 2 booked']} />,
    },
    {
        id: 'inbox',
        label: 'Inbox',
        caption: 'Requests wait here until you confirm or decline.',
        render: ({ phase }) => <Window phase={phase} title="Needs your attention" rows={['Noor Rahman, $690', 'Sam Wu, $349', 'Elena Quinn, $189']} />,
    },
    {
        id: 'earnings',
        label: 'Earnings',
        caption: "What you've earned this month, and when it reaches your bank.",
        render: ({ phase }) => <Window phase={phase} title="Revenue & payouts" rows={['This month $3,412', 'Next payout $1,286', 'Paid Thu 8 Oct $1,118']} />,
    },
]

function Deep({ children }: { children: ReactNode }) {
    return <div style={{ background: 'var(--hero)', color: 'var(--on-deep)', minHeight: '100vh' }}>{children}</div>
}

export const Default: Story = {
    args: { steps: STEPS, label: 'Screens of the app', testId: 'story' },
    render: (args) => (
        <Deep>
            <p style={{ textAlign: 'center', padding: '4rem 1rem 1rem', margin: 0 }}>Scroll down.</p>
            <ScrollStory {...args} />
            <section style={{ background: 'var(--paper)', color: 'var(--strong)', padding: '6rem 2rem', minHeight: '60vh' }}>
                The pin has let go; this section scrolls as normal.
            </section>
        </Deep>
    ),
}

/** `tilt`: the stage turns a few degrees toward a mouse pointer. Never on touch. */
export const Tilt: Story = {
    ...Default,
    args: { ...Default.args!, tilt: true },
}

/** Long labels wrap the chips onto two rows, centred; nothing runs off the side. */
export const LongLabels: Story = {
    ...Default,
    args: {
        ...Default.args!,
        steps: STEPS.map((s) => ({ ...s, label: `${s.label} for the whole business` })),
    },
}

/** Two steps, a custom count and no hint. */
export const TwoSteps: Story = {
    ...Default,
    args: {
        ...Default.args!,
        steps: STEPS.slice(0, 2),
        hint: null,
        formatCount: (n, total) => `Step ${n} of ${total}`,
    },
}

/**
 * AUTM-1683 (Don, 2026-10-05): `indicator="track"`. The chips are one bar and
 * their rails one progress track, filling left to right as the page scrolls;
 * no "1 of 4" count and no hint. On the brand-deep ground, with the defaults.
 */
export const Track: Story = {
    ...Default,
    args: { ...Default.args!, indicator: 'track' },
}

/**
 * The track on a light ground, as autara.au draws it: a lavender card on the
 * warm band, a white bar, brand labels and a brand fill.
 */
export const TrackOnLight: Story = {
    args: { steps: STEPS, label: 'Screens of the app', testId: 'story', indicator: 'track' },
    render: (args) => (
        <div style={{ background: 'var(--band)', color: 'var(--strong)', minHeight: '100vh', padding: '0 1rem' }}>
            <p style={{ textAlign: 'center', padding: '4rem 1rem 1rem', margin: 0 }}>Scroll down.</p>
            <ScrollStory
                {...args}
                style={
                    {
                        maxWidth: '72rem',
                        margin: '0 auto',
                        borderRadius: '2rem',
                        background: 'color-mix(in srgb, var(--brand) 8%, var(--paper))',
                        '--scroll-story-track-bg': 'var(--paper)',
                        '--scroll-story-track-fg': 'var(--text-muted)',
                        '--scroll-story-track-active-fg': 'var(--brand)',
                        '--scroll-story-rail': 'color-mix(in srgb, var(--brand) 20%, var(--paper))',
                        '--scroll-story-fill': 'var(--brand)',
                        '--scroll-story-muted': 'var(--text-muted)',
                    } as CSSProperties
                }
            />
            <section style={{ padding: '6rem 2rem', minHeight: '60vh' }}>The pin has let go; this section scrolls as normal.</section>
        </div>
    ),
}

/**
 * In context: under a centred hero, with a fixed header's room at the pin's
 * top (`--scroll-story-top`). The pin starts at the very top, so a header
 * that hides and shows over that room never moves it.
 */
export const UnderAHero: Story = {
    args: { steps: STEPS, label: 'Screens of the app', tilt: true },
    render: (args) => (
        <Deep>
            <header
                style={{
                    position: 'fixed',
                    insetInline: 0,
                    top: 0,
                    height: '4rem',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 1.5rem',
                    background: 'var(--hero)',
                }}
            >
                Autara for business
            </header>
            <div style={{ textAlign: 'center', padding: '7rem 1.5rem 0', maxWidth: '48rem', margin: '0 auto' }}>
                <h1 style={{ margin: 0 }}>
                    {/* Type on an element inside the heading (CLAUDE.md, Known gotchas). */}
                    <span style={{ display: 'block', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 0.95, color: 'var(--on-deep)' }}>
                        Run your whole car care business on Autara
                    </span>
                </h1>
                <p style={{ color: 'var(--on-deep-muted)', fontSize: '1.125rem' }}>Bookings, schedule, customers and payouts, in one app.</p>
            </div>
            <ScrollStory {...args} style={{ '--scroll-story-top': '4rem' } as CSSProperties} />
            <section style={{ background: 'var(--paper)', color: 'var(--strong)', padding: '6rem 2rem', minHeight: '60vh' }}>
                The next section.
            </section>
        </Deep>
    ),
}
