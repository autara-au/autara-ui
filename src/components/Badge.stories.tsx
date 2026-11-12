import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './Badge'
import { GradientGround } from './GlassSurface'

/**
 * Badge — inline pill for status, category, and credibility markers.
 *
 * AUTAA-UI-006 folded the standalone `TrendingPill` into Badge as a
 * `shape` variant:
 *
 *   - `pill` (default) — the original capsule, rounded-full.
 *   - `parallelogram` — the editorial tilted slab; wrapper skews
 *     -12deg, the children counter-skew so the label sits upright.
 *
 * Marker tones (`trending` / `new` / `new-light` / `featured`) and
 * status tones (`info` / `success` / `warning` / `destructive` /
 * `neutral`) were pulled across at the same time. The legacy palette
 * (`default`, `primary`, `light-*` etc.) is still exported for
 * backward compatibility — prefer the marker/status vocab for new
 * code.
 */
const meta = {
    title: 'Atoms/Badge',
    component: Badge,
    parameters: { layout: 'centered' },
    argTypes: {
        variant: {
            control: { type: 'select' },
            options: [
                // default
                'default',
                // semantic status — AUTM-948
                'act',
                'flight',
                'money',
                // marker tones — the retired `trending` / `new` /
                // `new-light` / `featured` names were still listed here
                // long after v1.2.0 collapsed them into three accents,
                // so the control offered variants that render nothing.
                'purple',
                'aqua',
                'lime',
                // status tones
                'info',
                'success',
                'warning',
                'destructive',
                'neutral',
                // legacy dark
                'dark-default',
                'dark-aqua',
                'dark-lime',
                'primary',
                'live',
                // legacy light
                'light-default',
                'light-primary',
                'light-success',
                'light-warning',
                'light-destructive',
            ],
        },
        shape: {
            control: { type: 'radio' },
            options: ['pill', 'parallelogram'],
        },
    },
    args: { children: 'Verified', shape: 'pill' },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

// ─── Light theme variants (cream canvas) ───────────────────────────
export const LightDefault: Story = {
    args: { variant: 'light-default', children: '15+ years' },
}
export const LightPrimary: Story = {
    args: { variant: 'light-primary', children: 'Highly rated' },
}
export const LightSuccess: Story = {
    args: { variant: 'light-success', children: 'Open today' },
}
export const LightWarning: Story = {
    args: { variant: 'light-warning', children: 'Closing soon' },
}
export const LightDestructive: Story = {
    args: { variant: 'light-destructive', children: 'Closed' },
}

// ─── Marker tones — parallelogram (corner-of-card use case) ────────
// Three Autara accent colors. The label is consumer-supplied — the
// same `purple` tone might say "FEATURED" on one rail and "VERIFIED"
// on another. Stories below show one canonical label per tone.
export const MarkerPurple: Story = {
    name: 'Marker — purple (parallelogram)',
    args: { variant: 'purple', shape: 'parallelogram', children: 'Featured' },
}
export const MarkerAqua: Story = {
    name: 'Marker — aqua (parallelogram)',
    args: { variant: 'aqua', shape: 'parallelogram', children: 'New' },
}
export const MarkerLime: Story = {
    name: 'Marker — lime (parallelogram)',
    args: { variant: 'lime', shape: 'parallelogram', children: 'Trending' },
}

// ─── Shape comparison — same tone, different silhouette ────────────
export const ShapeComparison: Story = {
    name: 'Shape — pill vs parallelogram',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="space-y-6 rounded-xl bg-[var(--background)] p-6 ring-1 ring-inset ring-[var(--border-subtle)]">
            <div>
                <div className="mb-2 text-[0.75rem] text-[var(--text-muted)]">
                    pill
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="purple">Featured</Badge>
                    <Badge variant="aqua">New</Badge>
                    <Badge variant="lime">Trending</Badge>
                </div>
            </div>
            <div>
                <div className="mb-2 text-[0.75rem] text-[var(--text-muted)]">
                    parallelogram (marketing default)
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="purple" shape="parallelogram">
                        Featured
                    </Badge>
                    <Badge variant="aqua" shape="parallelogram">
                        New
                    </Badge>
                    <Badge variant="lime" shape="parallelogram">
                        Trending
                    </Badge>
                </div>
            </div>
        </div>
    ),
}

// ─── Status tones — SOLID, booking + availability state (AUTM-211) ─
// Solid semantic fills in both shapes. Pill = standalone status; the
// parallelogram row is the preferred Autara silhouette for status pills
// on a card corner / row.
export const StatusTones: Story = {
    name: 'Vocabulary — status tones (solid)',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="flex max-w-xl flex-col gap-4 rounded-xl bg-[var(--background)] p-6 ring-1 ring-inset ring-[var(--border-subtle)]">
            <div className="flex flex-wrap gap-2">
                <Badge variant="info">In review</Badge>
                <Badge variant="success">Confirmed</Badge>
                <Badge variant="warning">Pending</Badge>
                <Badge variant="destructive">Cancelled</Badge>
                <Badge variant="neutral">Archived</Badge>
            </div>
            <div className="flex flex-wrap gap-2.5">
                <Badge variant="info" shape="parallelogram">In review</Badge>
                <Badge variant="success" shape="parallelogram">Confirmed</Badge>
                <Badge variant="warning" shape="parallelogram">Pending</Badge>
                <Badge variant="destructive" shape="parallelogram">Cancelled</Badge>
                <Badge variant="neutral" shape="parallelogram">Archived</Badge>
            </div>
        </div>
    ),
}

// ─── Vocabulary — every light variant on the cream canvas ──────────
export const LightVocabulary: Story = {
    name: 'Vocabulary — legacy light theme',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="flex max-w-xl flex-wrap gap-1.5 rounded-xl bg-[var(--background)] p-6 ring-1 ring-inset ring-[var(--border-subtle)]">
            <Badge variant="light-default">15+ years</Badge>
            <Badge variant="light-primary">Highly rated</Badge>
            <Badge variant="light-success">Open today</Badge>
            <Badge variant="light-warning">Closing soon</Badge>
            <Badge variant="light-destructive">Closed</Badge>
        </div>
    ),
}

// ─── The bare default (AUTM-934, finished in AUTM-974) ─────────────
/**
 * `<Badge>` with no `variant`. This is the story that did not exist,
 * which is how the default went unnoticed: the meta `args` pinned
 * `light-default`, so every control-driven story rendered a variant
 * nobody was actually getting by accident.
 *
 * Until AUTM-934 this measured 1.03:1 against the cream canvas —
 * `text-white/60` on `bg-white/[0.04]`. That fix made it READ; it left it
 * as `--surface-elevated` with a hairline border, which is a fill 1.05:1
 * from the card with the border doing the work. AUTM-974 gave it
 * `--neutral-fill`, the achromatic solid: 10.98:1 under its label in light,
 * 8.18:1 in dark, and a 9.8–11.0:1 step from every ground it can sit on.
 * Flip the Storybook theme toolbar; it is a solid object in both.
 */
export const BareDefault: Story = {
    name: 'Default — no variant passed',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="flex max-w-xl flex-wrap items-center gap-3 rounded-xl bg-[var(--background)] p-6 ring-1 ring-inset ring-[var(--border-subtle)]">
            <Badge>Verified</Badge>
            <Badge shape="pill">Verified</Badge>
            <Badge>Mobile car care</Badge>
        </div>
    ),
}

/**
 * Edge case — a long label, and a label alongside the tones it sits
 * next to in a real row. The parallelogram skew is what breaks first
 * when a label runs long, so it is worth looking at.
 */
export const LongLabel: Story = {
    name: 'Edge — long label beside status tones',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="flex max-w-sm flex-wrap items-center gap-2 rounded-xl bg-[var(--background)] p-6 ring-1 ring-inset ring-[var(--border-subtle)]">
            <Badge>Interior and exterior full detail</Badge>
            <Badge variant="success">Confirmed</Badge>
            <Badge variant="warning">Pending</Badge>
        </div>
    ),
}

/**
 * In context — a marketplace card corner, which is where Badge earns
 * its keep. The default neutral carries the category, a status tone
 * carries the state.
 */
export const InCardContext: Story = {
    name: 'In context — marketplace card',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="max-w-sm rounded-[1.5rem] bg-[var(--band)] p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="text-[0.9375rem] font-bold text-[var(--text-strong)]">
                    Northside Mobile Car Care
                </h3>
                <Badge variant="success">Open now</Badge>
            </div>
            <p className="mb-4 text-sm text-[var(--text-muted)]">
                Comes to you across the inner north. Two-hour minimum.
            </p>
            <div className="flex flex-wrap gap-2">
                <Badge>Mobile</Badge>
                <Badge>Interior</Badge>
                <Badge>Ceramic coating</Badge>
            </div>
        </div>
    ),
}

// ─── AUTM-948 ──────────────────────────────────────────────────────
/**
 * **The regression this story exists for.**
 *
 * `<Badge>` with no `shape` prop rendered its label SKEWED. The cva
 * `defaultVariants` applied `skewX(-12deg)` to the wrapper, and the render
 * branch tested the raw `shape` prop — which is `undefined` when you pass
 * nothing — so the counter-skew `<span>` was never emitted. Passing
 * `shape="parallelogram"` explicitly worked; using the documented default did
 * not.
 *
 * Rule 1 of the Autara Glass direction is explicit that the label is
 * counter-skewed. The geometry was right and the render was not, and it was
 * invisible in Storybook because `Badge.stories.tsx` pinned
 * `shape: 'pill'` in its meta args.
 *
 * All three below must read upright. If the first one leans, the bug is back.
 */
export const DefaultShapeCounterSkew: Story = {
    name: 'Regression — the default label must sit upright',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="flex max-w-xl flex-wrap items-center gap-3">
            <Badge variant="success">No shape prop</Badge>
            <Badge variant="success" shape="parallelogram">
                shape=&quot;parallelogram&quot;
            </Badge>
            <Badge variant="success" shape="pill">
                shape=&quot;pill&quot;
            </Badge>
        </div>
    ),
}

/**
 * The semantic trio — rule 4. **Purple ACTS · aqua IN FLIGHT · lime DONE and
 * money-in.** One accent per zone; aqua and lime never compete inside the
 * same block.
 *
 * Before this the two of them existed only as 3px dashes above KPI labels —
 * two of three brand colours were decoration, which is why the product read
 * as "a purple app" rather than as Autara.
 *
 * Solid fills, per rule 3: never a tint, even against glass. Each pairs with
 * the on-colour its fill guarantees at least 4.5:1 for.
 */
export const SemanticTones: Story = {
    name: 'Semantic — act / flight / money',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="max-w-xl space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <Badge variant="act">Awaiting you</Badge>
                <Badge variant="flight">On the way</Badge>
                <Badge variant="money">Paid</Badge>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
                The lifecycle reads left to right: something needs the
                merchant, then it is running, then the money is in.
            </p>
        </div>
    ),
}

/**
 * On the gradient ground, both themes. Status has to stay solid against
 * glass — a tinted status pill over a bloom picks up whatever colour happens
 * to be behind it, which is the argument rule 3 is making.
 */
export const OnTheGradientGround: Story = {
    name: 'In context — status on glass, both themes',
    parameters: { layout: 'fullscreen' },
    render: () => (
        <div className="grid sm:grid-cols-2">
            {(['light', 'dark'] as const).map((theme) => (
                <div key={theme} data-theme={theme}>
                    <GradientGround className="min-h-[20rem] p-8">
                        <p className="mb-4 text-[0.75rem] font-medium text-[var(--text-subtle)]">
                            {theme === 'dark' ? 'Dark' : 'Light'}
                        </p>
                        <div className="glass-surface p-5">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="act">Awaiting you</Badge>
                                <Badge variant="flight">On the way</Badge>
                                <Badge variant="money">Paid</Badge>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Badge variant="success">Confirmed</Badge>
                                <Badge variant="warning">Pending</Badge>
                                <Badge variant="destructive">Cancelled</Badge>
                                <Badge>Mobile</Badge>
                            </div>
                        </div>
                    </GradientGround>
                </div>
            ))}
        </div>
    ),
}

// ─── AUTM-974 ──────────────────────────────────────────────────────
/**
 * The two rings this sweep removed, and the fill that replaced an outline.
 *
 * `lime` carried `ring-1 ring-inset ring-[#0E0A1A]/15` "for a hairline
 * against light heros". Acid lime measures 12.89:1 under its own ink and is
 * not hard to find on a photograph; rule 4 of the Autara Glass direction only
 * exempts a hairline that is the material of a TRANSLUCENT surface, and this
 * fill is opaque. Compare the marker over the pale hero below.
 *
 * Both themes at once — the default's fill themes, the marker tones
 * deliberately do not (they sit over arbitrary imagery, not over a canvas).
 */
export const SolidNoRings: Story = {
    name: 'AUTM-974 — solid markers, no rings, both themes',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="grid gap-6 lg:grid-cols-2">
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
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge>Mobile car care</Badge>
                        <Badge variant="purple">Featured</Badge>
                        <Badge variant="aqua">New</Badge>
                        <Badge variant="lime">Trending</Badge>
                    </div>
                    {/* Stands in for the merchant-mobile onboarding hero, which is
                        the one live call site for the lime marker. */}
                    <div className="relative h-28 overflow-hidden rounded-autara-lg bg-[linear-gradient(120deg,#e9e4f6,#f7f5ee_60%,#dfeccd)]">
                        <Badge variant="lime" className="absolute left-3 top-3">
                            Trending
                        </Badge>
                    </div>
                </div>
            ))}
        </div>
    ),
}

/**
 * AUTM-1753: a count on an ACTIVE or SELECTED row is lime with ink
 * (`count-selected`), in both themes; an inactive row keeps `count`. Don,
 * 2026-10-09, on the merchant portal in dark mode: the current rail item
 * showed "99+" as a dark pill on purple, and the chosen notifications
 * category "49" as a dark pill on lavender. Lime on ink measures 16.9:1.
 */
function CountRows() {
    const row =
        'flex min-h-11 w-60 items-center gap-3 rounded-[var(--radius-autara-md,14px)] px-3 text-[0.9375rem]'
    const chip = 'inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[0.8125rem] font-medium'
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1">
                <div className={`${row} bg-[var(--accent-fill)] font-bold text-white`}>
                    <span className="flex-1">Notifications</span>
                    <Badge variant="count-selected">99+</Badge>
                </div>
                <div className={`${row} font-medium text-[var(--text-muted)]`}>
                    <span className="flex-1">Inbox</span>
                    <Badge variant="count">2</Badge>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <span className={`${chip} bg-[var(--selected)] text-[var(--on-selected)]`}>
                    All <Badge variant="count-selected">49</Badge>
                </span>
                <span className={`${chip} bg-[var(--band)] text-[var(--text-strong)]`}>
                    Bookings <Badge variant="count">12</Badge>
                </span>
            </div>
        </div>
    )
}

export const CountOnSelectedRows: Story = {
    name: 'Counts — on a selected row, both themes',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl bg-[var(--paper)] p-5">
                <CountRows />
            </div>
            <div data-theme="dark" className="rounded-3xl bg-[var(--paper)] p-5">
                <CountRows />
            </div>
        </div>
    ),
}

/**
 * AUTM-1812: the quiet count on unselected filter chips, in both themes. It
 * painted --brand-deep, the same dark purple in both themes, so in dark the
 * number all but vanished (about 1.4:1). It is --accent now: 9.5:1 in light,
 * 10.3:1 in dark (Badge.contrast.test.ts). The chosen chip keeps lime.
 */
function QuietCountChips() {
    const chip = 'inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[0.8125rem] font-medium'
    return (
        <div className="flex flex-wrap gap-2">
            <span className={`${chip} bg-[var(--selected)] text-[var(--on-selected)]`}>
                All <Badge variant="count-selected">5</Badge>
            </span>
            <span className={`${chip} bg-[var(--band)] text-[var(--text-strong)]`}>
                Active <Badge variant="count-quiet">3</Badge>
            </span>
            <span className={`${chip} bg-[var(--band)] text-[var(--text-strong)]`}>
                Drafts <Badge variant="count-quiet">1</Badge>
            </span>
            <span className={`${chip} bg-[var(--band)] text-[var(--text-strong)]`}>
                Inactive <Badge variant="count-quiet">12</Badge>
            </span>
        </div>
    )
}

export const QuietCountOnChips: Story = {
    name: 'Counts — quiet on unselected chips, both themes',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="grid gap-6">
            <div className="rounded-3xl bg-[var(--paper)] p-5">
                <QuietCountChips />
            </div>
            <div data-theme="dark" className="rounded-3xl bg-[var(--paper)] p-5">
                <QuietCountChips />
            </div>
        </div>
    ),
}

export const QuietCountOnChipsDark: Story = {
    name: 'Counts — quiet on unselected chips, dark',
    globals: { theme: 'dark' },
    parameters: { layout: 'padded', backgrounds: { default: 'Paper, dark' } },
    render: () => (
        <div className="rounded-3xl bg-[var(--paper)] p-5">
            <QuietCountChips />
        </div>
    ),
}
