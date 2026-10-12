import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { flushSync } from 'react-dom'
import {
    motionDurations,
    motionEasings,
    motionStaggerDelay,
    motionTransition,
    type MotionDurationName,
    type MotionTransitionName,
} from '../lib/motion-tokens'
import { Reveal } from './Reveal'
import { Skeleton } from './Skeleton'
import { Button } from './Button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './Dialog'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from './Sheet'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from './Tooltip'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './DropdownMenu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './Select'
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from './Popover'
import { PhoneInput } from './PhoneInput'
import { FilterChipRow } from './FilterChipRow'

/**
 * MOTION — every enter and exit in the package, on one page (AUTM-967).
 *
 * ─── Why this page exists ───────────────────────────────────────────────
 *
 * Seven components styled their transitions with `animate-in`, `fade-in-0`,
 * `zoom-in-95` and `slide-in-from-*`. Those are `tailwindcss-animate`
 * utilities, and the plugin is not a dependency of this package or of
 * merchant-mobile, merchant-web or customer-web. **They emitted nothing.**
 * Every dialog, sheet, tooltip, dropdown, select, phone-input country list
 * and nav menu across all three web surfaces appeared and disappeared on the
 * frame it was asked for.
 *
 * The reason it survived from the first Radix wrapper until now is that
 * nothing errored, nothing warned, and the source read as though it was
 * handled. The only symptom was a product that felt abrupt — Perceived
 * Performance failing on the most repeated interaction there is.
 *
 * A page rather than one story per component, because the thing worth
 * reviewing is whether they feel like ONE product. Open a dialog, then a
 * sheet, then a dropdown: enters run on the same easing and exits are
 * shorter than enters everywhere, because an opening surface is asking for
 * attention and a closing one is getting out of the way.
 *
 * ─── What to check ──────────────────────────────────────────────────────
 *
 * 1. Every surface animates BOTH ways. Radix keeps an exiting node mounted
 *    until `animationend`, so a missing exit shows up as a snap on close.
 * 2. The Sheet's direction matches its edge. That slide is the affordance —
 *    it says where dismissing the panel will send it.
 * 3. Turn on "Reduce motion" in your OS and reload. Everything should appear
 *    and dismiss instantly, and nothing should be left parked off-screen.
 * 4. Both themes, from the toolbar.
 */
const meta: Meta = {
    title: 'Design System/Motion',
    parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj

function Row({
    label,
    note,
    children,
}: {
    label: string
    note: string
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-2 rounded-autara-lg bg-[var(--surface)] p-5">
            <p className="text-[0.75rem] font-medium text-[var(--text-muted)]">
                {label}
            </p>
            <div className="flex flex-wrap items-center gap-3">{children}</div>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">{note}</p>
        </div>
    )
}

function Surfaces() {
    const [phone, setPhone] = React.useState('')
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <Row
                label="Dialog"
                note="Scrim fades, panel scales from 96%. 200ms in, 150ms out."
            >
                <Dialog>
                    <DialogTrigger asChild>
                        <Button size="sm">Open dialog</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Cancel this booking?</DialogTitle>
                            <DialogDescription>
                                Priya N is expecting you at 09:00. She will be
                                notified and her deposit refunded.
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            </Row>

            <Row
                label="Sheet"
                note="Slides from its own edge. 280ms in, 200ms out — the longest in the set, because it travels the furthest."
            >
                {(['right', 'left', 'bottom', 'top'] as const).map((side) => (
                    <Sheet key={side}>
                        <SheetTrigger asChild>
                            <Button size="sm" variant="light">
                                {side}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side={side} className="p-6">
                            <SheetHeader>
                                <SheetTitle>From the {side}</SheetTitle>
                                <SheetDescription>
                                    Dismiss it and it goes back the way it came.
                                </SheetDescription>
                            </SheetHeader>
                        </SheetContent>
                    </Sheet>
                ))}
            </Row>

            <Row
                label="Tooltip"
                note="Hover and wait. Its open states are `delayed-open` and `instant-open`, never `open` — a rule written against `open` would give it an exit and no entrance."
            >
                <TooltipProvider>
                    {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
                        <Tooltip key={side}>
                            <TooltipTrigger asChild>
                                <Button size="sm" variant="light">
                                    {side}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side={side}>
                                Grows out of the {side} edge
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </Row>

            <Row
                label="DropdownMenu"
                note="Scales from the trigger — the origin comes from Radix's own transform-origin variable, so it is correct on every side and alignment without a rule per side."
            >
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="light">
                            Booking actions
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>Message customer</DropdownMenuItem>
                        <DropdownMenuItem>Reschedule</DropdownMenuItem>
                        <DropdownMenuItem>Cancel booking</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </Row>

            <Row
                label="Select"
                note="Same floating-panel treatment. The popper nudge still applies: Tailwind v4 compiles `translate-*` to the standalone `translate:` property, so it composes with the keyframes instead of fighting them."
            >
                <Select>
                    {/* The accessible name is the CONSUMER's job — a trigger
                        whose only content is a placeholder has none, which
                        axe flags as critical. A story without one models the
                        thing a consumer would then ship. */}
                    <SelectTrigger className="w-56" aria-label="Service">
                        <SelectValue placeholder="Choose a service" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ppf">Full-body PPF</SelectItem>
                        <SelectItem value="ceramic">Ceramic coating</SelectItem>
                        <SelectItem value="wash">Express wash</SelectItem>
                    </SelectContent>
                </Select>
            </Row>

            <Row
                label="PhoneInput country list"
                note="The one nobody thinks of, opened on the first screen of merchant onboarding."
            >
                <div className="w-full max-w-sm">
                    <PhoneInput value={phone} onChange={setPhone} />
                </div>
            </Row>

            <Row
                label="Popover"
                note="Shipped with real CSS in v5.1.0 and was the component that found this bug. It now shares the one implementation rather than carrying a near-duplicate."
            >
                <Popover>
                    <PopoverTrigger asChild>
                        <Button size="sm" variant="light">
                            Notifications
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <PopoverHeader>
                            <div>
                                <PopoverTitle>Notifications</PopoverTitle>
                                <PopoverDescription>
                                    Two new booking requests
                                </PopoverDescription>
                            </div>
                        </PopoverHeader>
                    </PopoverContent>
                </Popover>
            </Row>
        </div>
    )
}

export const EverySurface: Story = {
    name: 'Every animated surface',
    render: () => <Surfaces />,
}

export const BothThemes: Story = {
    name: 'In context — light and dark canvas',
    render: () => (
        <div className="grid gap-6 2xl:grid-cols-2">
            {[
                { label: 'Light', theme: undefined },
                { label: 'Dark', theme: 'dark' as const },
            ].map((col) => (
                <div
                    key={col.label}
                    data-theme={col.theme}
                    className="space-y-4 rounded-autara-lg bg-[var(--background)] p-5"
                >
                    <p className="text-[0.75rem] font-medium text-[var(--text-muted)]">
                        {col.label}
                    </p>
                    {/* Dialogs, sheets, tooltips and menus all PORTAL to
                        document.body, so they escape this themed island and
                        render in whatever the toolbar is set to. That is
                        correct — the app stamps `data-theme` on <html> — but
                        it means the dark column's panels follow the toolbar,
                        not the column. Use the toolbar to review them. */}
                    <Surfaces />
                </div>
            ))}
        </div>
    ),
}

/**
 * The reason this ticket was not simply "add transitions".
 *
 * Storybook cannot emulate `prefers-reduced-motion`, so this story states the
 * contract and tells you how to check it for real: turn on Reduce Motion in
 * macOS System Settings → Accessibility → Display (or Chrome DevTools →
 * Rendering → Emulate CSS prefers-reduced-motion), reload, and open anything
 * above.
 */
export const ReducedMotion: Story = {
    name: 'A11y — prefers-reduced-motion',
    render: () => (
        <div className="max-w-2xl space-y-3 rounded-autara-lg bg-[var(--surface)] p-6">
            <h3 className="text-base font-medium text-[var(--text-strong)]">
                What a reduced-motion user gets
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--text-muted)]">
                <li>
                    Every animation is clamped to 0.01ms by the global block in
                    <code className="px-1">utilities/animations.css</code>, so
                    surfaces appear and dismiss instantly.
                </li>
                <li>
                    Unmounting still works. Radix waits for{' '}
                    <code className="px-1">animationend</code> before removing an
                    exiting node, and a 0.01ms animation still fires it — which
                    is why the answer is a clamp and not{' '}
                    <code className="px-1">animation: none</code>.
                </li>
                <li>
                    Every motion offset is reset as well as clamped. A sheet
                    left parked at <code className="px-1">translateX(100%)</code>{' '}
                    is an invisible modal with a focus trap inside it, which is
                    worse than an unanimated one.
                </li>
            </ul>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                To check: DevTools → Rendering → Emulate CSS media feature
                prefers-reduced-motion → reduce, then reload and open anything
                in “Every animated surface”.
            </p>
        </div>
    ),
}

/* ─── AUTM-1594: the same tokens, for motion driven from JavaScript ─────
 *
 * `motionTokens`, `motionDurations`, `motionEasings` and `motionTransition`
 * carry the `--motion-*` values for framer-motion. The table is read from
 * the JS object and the swatch beside each row from the CSS custom property
 * on this page, so a mismatch would show here as well as fail
 * `motion-tokens.test.ts`. The panel below animates with framer-motion on
 * `motionTransition('sheetIn')` / `('sheetOut')`, beside the CSS sheet.
 */
function JsTokenRow({ name }: { name: MotionDurationName }) {
    const cssName = `--motion-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`
    const [cssValue, setCssValue] = React.useState('')
    React.useEffect(() => {
        setCssValue(getComputedStyle(document.documentElement).getPropertyValue(cssName).trim())
    }, [cssName])
    const NOT_A_TRANSITION: Partial<Record<MotionDurationName, string>> = {
        stagger: `delay: motionStaggerDelay(i), ${[0, 1, 5, 6].map(motionStaggerDelay).join(', ')}...`,
        settleDelay: 'delay before settle',
        skeleton: 'loop, ease-in-out',
    }
    const t = NOT_A_TRANSITION[name] ? null : motionTransition(name as MotionTransitionName)
    return (
        <tr className="border-t border-[var(--hairline)]">
            <td className="py-2 pr-4 font-mono text-sm">{name}</td>
            <td className="py-2 pr-4 font-mono text-sm text-[var(--text-muted)]">{cssName}</td>
            <td className="py-2 pr-4 text-sm">{motionDurations[name]}ms</td>
            <td className="py-2 pr-4 text-sm text-[var(--text-muted)]">{cssValue || 'not on this page'}</td>
            <td className="py-2 font-mono text-sm text-[var(--text-muted)]">
                {t ? `{ duration: ${t.duration}, ease: [${t.ease.join(', ')}] }` : NOT_A_TRANSITION[name]}
            </td>
        </tr>
    )
}

export const JsTokens: Story = {
    name: 'JS motion tokens (framer-motion)',
    render: function JsTokensStory() {
        const [open, setOpen] = React.useState(false)
        return (
            <MotionConfig reducedMotion="user">
                <div className="flex max-w-4xl flex-col gap-6 rounded-autara-lg bg-[var(--surface)] p-6 text-[var(--text-strong)]">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="text-[0.8125rem] text-[var(--text-muted)]">
                                    <th className="pb-2 pr-4 font-medium">JS name</th>
                                    <th className="pb-2 pr-4 font-medium">CSS token</th>
                                    <th className="pb-2 pr-4 font-medium">JS value</th>
                                    <th className="pb-2 pr-4 font-medium">CSS on this page</th>
                                    <th className="pb-2 font-medium">motionTransition()</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(Object.keys(motionDurations) as MotionDurationName[]).map((name) => (
                                    <JsTokenRow key={name} name={name} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="m-0 text-[0.9375rem] text-[var(--text-muted)]">
                        Enters, hover and press run on ease-out [{motionEasings.out.join(', ')}], exits on
                        ease-in [{motionEasings.in.join(', ')}].
                    </p>
                    <div className="flex flex-col gap-3">
                        <div>
                            <Button onClick={() => setOpen((v) => !v)}>
                                {open ? 'Hide the panel' : 'Show the panel'}
                            </Button>
                        </div>
                        <div className="relative h-40 overflow-hidden rounded-2xl bg-[var(--band)]">
                            <AnimatePresence>
                                {open ? (
                                    <motion.div
                                        key="panel"
                                        initial={{ y: '100%' }}
                                        animate={{ y: 0, transition: motionTransition('sheetIn') }}
                                        exit={{ y: '100%', transition: motionTransition('sheetOut') }}
                                        className="absolute inset-x-0 bottom-0 rounded-t-[1.5rem] bg-[var(--paper)] p-5 text-base"
                                    >
                                        Rises on sheetIn, 280ms, and leaves on sheetOut, 200ms.
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </MotionConfig>
        )
    },
}

/* ─── AUTM-1678: page content motion ────────────────────────────────────
 *
 * The overlay stories above cover panels, dialogs and sheets. The stories
 * below cover what a PAGE does: reveal, stagger, settle, hover, press, a
 * route change, a skeleton and the crossfade out of it. One story per token
 * family, each with its token printed beside it and a Replay where the
 * motion is one-shot. The values and the reduced-motion form of each are the
 * header of `utilities/animations.css`.
 */

const PAGE_TOKENS: {
    token: string
    js: MotionDurationName
    use: string
    reduced: string
}[] = [
    { token: '--motion-reveal', js: 'reveal', use: 'A section or a group rising 16px into place', reduced: 'None, content at rest' },
    { token: '--motion-stagger', js: 'stagger', use: 'Per child, children 1 to 6; the rest share 300ms', reduced: 'None' },
    { token: '--motion-settle', js: 'settle', use: 'A plate under the hero, up from 2.5rem and 98.5%', reduced: 'None' },
    { token: '--motion-settle-delay', js: 'settleDelay', use: 'Waits for the hero copy to paint first', reduced: 'None' },
    { token: '--motion-hover', js: 'hover', use: 'Colour, and a 2px lift on a card (pointer only)', reduced: 'Colour only' },
    { token: '--motion-press', js: 'press', use: '97% on a button or tile, 98.5% on a full-width row', reduced: 'None, the fill change is the feedback' },
    { token: '--motion-page-in', js: 'pageIn', use: 'The new route rises 8px and fades in', reduced: 'None, instant swap' },
    { token: '--motion-page-out', js: 'pageOut', use: 'The old route fades out', reduced: 'None, instant swap' },
    { token: '--motion-skeleton', js: 'skeleton', use: 'Skeleton pulse to 55%, ease-in-out, loops', reduced: 'Pulse off' },
    { token: '--motion-crossfade', js: 'crossfade', use: 'Content fading in where the skeleton was', reduced: 'Kept, opacity only' },
]

function CssValue({ name }: { name: string }) {
    const [value, setValue] = React.useState('')
    React.useEffect(() => {
        setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim())
    }, [name])
    return <>{value || 'missing'}</>
}

function Panel({ title, token, children }: { title: string; token: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-4 rounded-autara-lg bg-[var(--surface)] p-5 text-[var(--text-strong)]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="m-0 text-base font-medium">{title}</h3>
                <code className="text-sm text-[var(--text-muted)]">{token}</code>
            </div>
            {children}
        </section>
    )
}

function useReplay(): [number, () => void] {
    const [run, setRun] = React.useState(0)
    return [run, () => setRun((n) => n + 1)]
}

export const PageTokens: Story = {
    name: 'Page content tokens (AUTM-1678)',
    render: () => (
        <div className="max-w-5xl overflow-x-auto rounded-autara-lg bg-[var(--surface)] p-6 text-[var(--text-strong)]">
            <table className="w-full border-collapse text-left">
                <thead>
                    <tr className="text-[0.8125rem] text-[var(--text-muted)]">
                        <th className="pb-2 pr-4 font-medium">CSS token</th>
                        <th className="pb-2 pr-4 font-medium">On this page</th>
                        <th className="pb-2 pr-4 font-medium">JS</th>
                        <th className="pb-2 pr-4 font-medium">Use</th>
                        <th className="pb-2 font-medium">Reduced motion</th>
                    </tr>
                </thead>
                <tbody>
                    {PAGE_TOKENS.map((t) => (
                        <tr key={t.token} className="border-t border-[var(--hairline)] align-top">
                            <td className="py-2 pr-4 font-mono text-sm">{t.token}</td>
                            <td className="py-2 pr-4 text-sm">
                                <CssValue name={t.token} />
                            </td>
                            <td className="py-2 pr-4 font-mono text-sm text-[var(--text-muted)]">
                                motionDurations.{t.js} = {motionDurations[t.js]}
                            </td>
                            <td className="py-2 pr-4 text-sm">{t.use}</td>
                            <td className="py-2 text-sm text-[var(--text-muted)]">{t.reduced}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    ),
}

const STEPS = ['Choose a service', 'Pick a time', 'Pay the deposit', 'Get a reminder', 'Pull in', 'Drive off clean', 'Leave a review', 'Book again']

export const StaggerTimed: Story = {
    name: 'Reveal and stagger, on first paint',
    render: function StaggerTimedStory() {
        const [run, replay] = useReplay()
        return (
            <Panel title="motion-stagger: eight children, six steps" token="--motion-reveal 480ms, --motion-stagger 60ms">
                <div>
                    <Button size="sm" variant="quiet" onClick={replay}>
                        Replay
                    </Button>
                </div>
                <ol key={run} className="motion-stagger m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
                    {STEPS.map((s, i) => (
                        <li key={s} className="rounded-autara-md bg-[var(--band)] px-4 py-3 text-[0.9375rem]">
                            <span className="mr-2 tabular-nums text-[var(--text-muted)]">{i + 1}</span>
                            {s}
                            <span className="ml-2 text-sm text-[var(--text-muted)]">{motionStaggerDelay(i)}ms</span>
                        </li>
                    ))}
                </ol>
                <p className="m-0 text-sm text-[var(--text-muted)]">
                    Children seven and eight start with the sixth, so no more than six are ever moving. The group is
                    done within 780ms.
                </p>
            </Panel>
        )
    },
}

export const StaggerOnScroll: Story = {
    name: 'Reveal stagger, on scroll',
    parameters: { layout: 'fullscreen' },
    render: () => (
        <div className="p-6 text-[var(--text-strong)]">
            <p className="mb-[80vh] text-sm text-[var(--text-muted)]">
                Scroll down. Each card rises on its own progress through the viewport, one step later than the one
                before. Chromium 115+ and Safari 26+; elsewhere, and under reduced motion, the cards are simply there.
            </p>
            <Reveal as="ul" stagger className="m-0 grid max-w-4xl list-none gap-3 p-0 sm:grid-cols-3">
                {['Express wash', 'Interior refresh', 'Ceramic coating'].map((s) => (
                    <li key={s} className="rounded-autara-lg bg-[var(--band)] p-5">
                        <h4 className="m-0 text-base font-medium">{s}</h4>
                        <p className="m-0 mt-1 text-sm text-[var(--text-muted)]">At your place or theirs.</p>
                    </li>
                ))}
            </Reveal>
            <div className="h-[60vh]" />
        </div>
    ),
}

export const Settle: Story = {
    name: 'Settle',
    render: function SettleStory() {
        const [run, replay] = useReplay()
        return (
            <Panel title="motion-settle" token="--motion-settle 280ms after --motion-settle-delay 120ms">
                <div>
                    <Button size="sm" variant="quiet" onClick={replay}>
                        Replay
                    </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
                    <div>
                        <p className="m-0 text-xl font-bold">Your book, filled.</p>
                        <p className="m-0 mt-1 text-[0.9375rem] text-[var(--text-muted)]">
                            The headline does not move: it is the first paint. The plate settles under it.
                        </p>
                    </div>
                    <div
                        key={run}
                        className="motion-settle grid h-56 place-items-center rounded-[1.75rem] bg-[var(--band)] text-sm text-[var(--text-muted)]"
                    >
                        Device plate
                    </div>
                </div>
            </Panel>
        )
    },
}

export const HoverAndPress: Story = {
    name: 'Hover and press',
    render: () => (
        <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="motion-press on buttons and tiles" token="--motion-press 120ms, 97%">
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        className="motion-press min-h-11 rounded-full bg-[var(--band)] px-4 text-[0.9375rem] font-medium hover:bg-[var(--band-press)]"
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        className="motion-press min-h-11 rounded-full bg-[var(--band)] px-4 text-[0.9375rem] font-medium hover:bg-[var(--band-press)]"
                    >
                        This week
                    </button>
                    <button
                        type="button"
                        disabled
                        className="motion-press min-h-11 rounded-full bg-[var(--band)] px-4 text-[0.9375rem] font-medium opacity-45"
                    >
                        Disabled stays still
                    </button>
                </div>
                <p className="m-0 text-sm text-[var(--text-muted)]">
                    Hold the pointer down. The fill moves on --motion-hover, the scale on --motion-press.
                </p>
            </Panel>
            <Panel title="motion-press-row on full-width rows" token="--motion-press 120ms, 98.5%">
                <div className="flex flex-col gap-2">
                    {['Block time', 'New booking', 'Send an invoice'].map((r) => (
                        <button
                            key={r}
                            type="button"
                            className="motion-press-row flex min-h-11 w-full items-center rounded-xl px-3 py-2 text-left text-[0.9375rem] font-medium hover:bg-[var(--band)]"
                        >
                            {r}
                        </button>
                    ))}
                </div>
                <p className="m-0 text-sm text-[var(--text-muted)]">
                    98.5% on a row, because 97% of a full-width row moves its edge by a fingertip.
                </p>
            </Panel>
            <Panel title="motion-hover-lift on a link card" token="--motion-hover 160ms, 2px">
                <div className="grid gap-3 sm:grid-cols-2">
                    {['Express wash', 'Ceramic coating'].map((s) => (
                        <a
                            key={s}
                            href="#"
                            onClick={(e) => e.preventDefault()}
                            className="motion-hover-lift motion-press flex flex-col gap-1 rounded-autara-lg bg-[var(--band)] p-4 text-[var(--text-strong)] no-underline hover:bg-[var(--band-press)]"
                        >
                            <span className="motion-hover-icon inline-grid size-9 place-items-center rounded-full bg-[var(--surface)] text-sm font-bold">
                                {s[0]}
                            </span>
                            <span className="text-base font-medium">{s}</span>
                            <span className="text-sm text-[var(--text-muted)]">From $45</span>
                        </a>
                    ))}
                </div>
                <p className="m-0 text-sm text-[var(--text-muted)]">
                    Mouse and trackpad only: on an iPad a tap would leave the card lifted. Lift and press combine,
                    because one moves translate and the other scale.
                </p>
            </Panel>
        </div>
    ),
}

const ROUTES = {
    today: { title: 'Today', rows: ['09:00 Express wash, Priya N', '11:30 Interior refresh, Sam K'] },
    week: { title: 'This week', rows: ['Mon 4 bookings', 'Tue 2 bookings', 'Wed 5 bookings', 'Thu 3 bookings'] },
} as const

export const PageTransition: Story = {
    name: 'Page, a route change',
    render: function PageTransitionStory() {
        const [route, setRoute] = React.useState<keyof typeof ROUTES>('today')
        const supported = typeof document !== 'undefined' && 'startViewTransition' in document
        const go = (next: keyof typeof ROUTES) => {
            if (next === route) return
            const doc = document as Document & { startViewTransition?: (update: () => void) => unknown }
            if (!doc.startViewTransition) {
                setRoute(next)
                return
            }
            doc.startViewTransition(() => flushSync(() => setRoute(next)))
        }
        const r = ROUTES[route]
        return (
            <Panel title="motion-page" token="--motion-page-in 200ms, --motion-page-out 120ms">
                <nav className="flex gap-2" aria-label="Story routes">
                    {(Object.keys(ROUTES) as (keyof typeof ROUTES)[]).map((k) => (
                        <Button
                            key={k}
                            size="sm"
                            variant={k === route ? 'strong' : 'quiet'}
                            aria-current={k === route ? 'page' : undefined}
                            onClick={() => go(k)}
                        >
                            {ROUTES[k].title}
                        </Button>
                    ))}
                </nav>
                <main className="motion-page rounded-autara-md bg-[var(--band)] p-4">
                    <h4 className="m-0 text-lg font-bold">{r.title}</h4>
                    <ul className="m-0 mt-2 list-none p-0">
                        {r.rows.map((row) => (
                            <li key={row} className="py-1 text-[0.9375rem]">
                                {row}
                            </li>
                        ))}
                    </ul>
                </main>
                <p className="m-0 text-sm text-[var(--text-muted)]">
                    {supported
                        ? 'This browser supports view transitions: the old view fades out, the new one rises 8px and fades in.'
                        : 'No view transitions in this browser, so the route swaps instantly, which is the intended fallback.'}{' '}
                    Only the main column carries motion-page; the shell around it stays still.
                </p>
            </Panel>
        )
    },
}

export const SkeletonAndCrossfade: Story = {
    name: 'Skeleton and the crossfade out of it',
    render: function SkeletonStory() {
        const [loading, setLoading] = React.useState(true)
        return (
            <Panel title="motion-skeleton, then motion-crossfade" token="--motion-skeleton 1400ms, --motion-crossfade 160ms">
                <div>
                    <Button size="sm" variant="quiet" onClick={() => setLoading((v) => !v)}>
                        {loading ? 'Finish loading' : 'Load again'}
                    </Button>
                </div>
                <div className="min-h-28">
                    {loading ? (
                        <div className="flex flex-col gap-2" role="status" aria-live="polite">
                            <span className="sr-only">Fetching your bookings</span>
                            <Skeleton label={null} className="h-6 w-40" />
                            <Skeleton label={null} className="h-4 w-full" />
                            <Skeleton label={null} className="h-4 w-3/4" />
                        </div>
                    ) : (
                        <div className="motion-crossfade flex flex-col gap-2">
                            <p className="m-0 text-lg font-bold">2 bookings today</p>
                            <p className="m-0 text-[0.9375rem]">09:00 Express wash, Priya N</p>
                            <p className="m-0 text-[0.9375rem]">11:30 Interior refresh, Sam K</p>
                        </div>
                    )}
                </div>
                <p className="m-0 text-sm text-[var(--text-muted)]">
                    The content takes the skeleton&apos;s place in the same box, so nothing below it moves.
                </p>
            </Panel>
        )
    },
}

/**
 * Storybook cannot switch `prefers-reduced-motion` itself. To check for
 * real: DevTools, Rendering, "Emulate CSS media feature
 * prefers-reduced-motion: reduce", then reload this story.
 */
export const PageMotionReduced: Story = {
    name: 'A11y: page motion under prefers-reduced-motion',
    render: () => (
        <div className="max-w-3xl space-y-3 rounded-autara-lg bg-[var(--surface)] p-6 text-[var(--text-strong)]">
            <h3 className="m-0 text-base font-medium">What a reduced-motion user gets</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--text-muted)]">
                <li>Reveal, stagger, settle and route changes: the end state, at once. No element waits out a delay.</li>
                <li>Hover: the colour changes, the card does not lift.</li>
                <li>Press: no scale. The fill change is the feedback.</li>
                <li>Skeleton: a still placeholder, no pulse.</li>
                <li>Crossfade: kept, because it is opacity only and 160ms.</li>
            </ul>
            <p className="m-0 text-sm leading-relaxed text-[var(--text-muted)]">
                Every moving rule sits inside prefers-reduced-motion: no-preference, so this is the absence of a rule,
                not a shortened animation. motion-system.test.ts holds every rule to it.
            </p>
            <p className="m-0 text-sm text-[var(--text-muted)]">
                Your browser reports:{' '}
                <strong className="font-medium text-[var(--text-strong)]">
                    <ReducedMotionState />
                </strong>
            </p>
        </div>
    ),
}

function ReducedMotionState() {
    const [reduce, setReduce] = React.useState<boolean | null>(null)
    React.useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        setReduce(mq.matches)
        const on = () => setReduce(mq.matches)
        mq.addEventListener('change', on)
        return () => mq.removeEventListener('change', on)
    }, [])
    if (reduce === null) return <>checking</>
    return <>{reduce ? 'reduce (page motion is off)' : 'no preference (page motion is on)'}</>
}

/**
 * The whole page at 200% text: the root font size doubles while this story is
 * mounted, as it does under system text scaling. The settle travels 2.5rem, so
 * it travels twice as far in pixels and still reads as the same gesture; the
 * press rows grow and wrap, and the scale still applies to the row as a whole.
 */
export const TextScale200: Story = {
    name: 'Edge: page motion at 200% text',
    render: function TextScaleStory() {
        React.useLayoutEffect(() => {
            const html = document.documentElement
            const before = html.style.fontSize
            html.style.fontSize = '200%'
            return () => {
                html.style.fontSize = before
            }
        }, [])
        const [run, replay] = useReplay()
        return (
            <div className="flex max-w-2xl flex-col gap-4">
                <div>
                    <Button size="sm" variant="quiet" onClick={replay}>
                        Replay
                    </Button>
                </div>
                <ol key={`s${run}`} className="motion-stagger m-0 grid list-none gap-2 p-0">
                    {STEPS.slice(0, 4).map((s) => (
                        <li key={s} className="rounded-autara-md bg-[var(--band)] px-4 py-3 text-[0.9375rem]">
                            {s}
                        </li>
                    ))}
                </ol>
                <div
                    key={`p${run}`}
                    className="motion-settle grid h-40 place-items-center rounded-[1.75rem] bg-[var(--band)] text-sm text-[var(--text-muted)]"
                >
                    Device plate
                </div>
                <button
                    type="button"
                    className="motion-press-row flex min-h-11 w-full items-center rounded-xl bg-[var(--band)] px-3 py-2 text-left text-[0.9375rem] font-medium"
                >
                    Send the customer a reminder about tomorrow&apos;s booking
                </button>
            </div>
        )
    },
}

/* ─── AUTM-1792: pops, rows and the shimmer ──────────────────────────────
 *
 * Don, 2026-10-09: "can you see this smooth animation, can we apply slight
 * animation in our app too". The vocabulary of the dashboard he pointed at,
 * on this package's tokens. Open the menu, choose a chip, replay the rows,
 * and watch the shimmer; then turn on reduced motion in the OS and every one
 * of them is still.
 */
const CHIPS = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled']
const ROWS = ['09:00  Alex Chen, Express wash', '11:30  Priya Nandakumar, Cut and polish', '13:00  Marcus Bell, Ceramic coating', '15:30  Jo Lee, Headlight restoration', '17:00  Tom Whitfield, Full clean']

export const PopsRowsAndShimmer: Story = {
    name: 'Pops, rows and shimmer (AUTM-1792)',
    render: function PopsRowsAndShimmerStory() {
        const [chip, setChip] = React.useState<string>('All')
        const [run, replay] = useReplay()
        return (
            <div className="grid max-w-5xl gap-4 md:grid-cols-2">
                <Panel title="A menu pops: 92%, 6px, a small overshoot" token="--motion-menu-in 300ms, --motion-ease-pop">
                    <div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="quiet">Open the menu</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem>Your account</DropdownMenuItem>
                                <DropdownMenuItem>Settings</DropdownMenuItem>
                                <DropdownMenuItem>Sign out</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <p className="m-0 text-sm text-[var(--text-muted)]">Closes on --motion-menu-out (150ms), faster than it opened.</p>
                </Panel>
                <Panel title="A chosen chip pops" token="--motion-pop 450ms">
                    <FilterChipRow
                        options={CHIPS.map((c) => ({ value: c, label: c }))}
                        value={chip}
                        onChange={setChip}
                        ariaLabel="Filter bookings"
                    />
                    <p className="m-0 text-sm text-[var(--text-muted)]">100, 104, 99, 100%. The chip on at first paint stays still.</p>
                </Panel>
                <Panel title="Rows rise in, 30ms apart" token="--motion-row 400ms, --motion-row-stagger 30ms">
                    <div>
                        <Button size="sm" variant="quiet" onClick={replay}>
                            Replay
                        </Button>
                    </div>
                    <ul key={run} className="motion-rows m-0 list-none divide-y divide-[var(--hairline)] rounded-autara-md bg-[var(--paper)] p-0">
                        {ROWS.map((r) => (
                            <li key={r} className="px-4 py-3 text-[0.9375rem]">
                                {r}
                            </li>
                        ))}
                    </ul>
                </Panel>
                <Panel title="A skeleton shimmers" token="--motion-skeleton, .motion-shimmer">
                    <div className="motion-shimmer rounded-autara-md bg-[var(--paper)] p-4" role="status" aria-live="polite">
                        <span className="sr-only">Loading your bookings</span>
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="flex items-center gap-4 py-2">
                                <Skeleton pulse={false} label={null} className="h-10 w-16" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton pulse={false} label={null} className="h-3.5 w-3/5" />
                                    <Skeleton pulse={false} label={null} className="h-3 w-2/5" />
                                </div>
                                <Skeleton pulse={false} label={null} className="h-7 w-20 rounded-full" />
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>
        )
    },
}
