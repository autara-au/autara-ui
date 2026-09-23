# autara-ui — Autara Design System

> The canonical UI package. Every reusable component, design token, and
> Tailwind preset for every Autara surface lives here. Published as
> `@autara-au/autara-ui` on GitHub Packages.

Read the workspace [`CLAUDE.md`](../CLAUDE.md) end-to-end before any work
in this repo — three gates apply, "Storybook-first" is a hard rule, and
the Cross-Repo Contracts Catalog is the source of truth.

## The hard rule that brought v1.1.0 into being

**If a component is reusable, it lives here, with a Storybook story,
before any consumer imports it.**

This rule is non-negotiable. It exists because customer-web spent six
months evolving an editorial aesthetic that took the v1.1.0 harvest
project to recover into the shared package — six months of consumer
drift. Don't reintroduce that drift.

Full rule + workflow: workspace [`CLAUDE.md` §
Component architecture](../CLAUDE.md#component-architecture--storybook-first-always).

## Stack

| Layer | Choice |
|---|---|
| Build | `tsc` (no bundler — autara-ui ships .js + .d.ts + .css + fonts as-is) |
| Components | React 19 + Radix primitives + CVA + tailwind-merge |
| Tokens | CSS custom properties via Tailwind v4 `@theme inline` |
| Storybook | v10 + `@storybook/react-vite` + Tailwind v4 via `@tailwindcss/vite` |
| Release | semantic-release on PR merge → GitHub Packages |
| Distribution | `@autara-au/autara-ui` (consumer pins via `package.json`) |

## Local dev

```sh
pnpm install
pnpm storybook       # http://localhost:6006
pnpm build           # tsc → dist/
pnpm build-storybook # storybook-static/ — deployable to Vercel
pnpm typecheck       # tsc --noEmit
```

## File layout

```
src/
├── components/             # React components — one per file
│   ├── <Component>.tsx
│   ├── <Component>.stories.tsx   ← REQUIRED for new components
│   └── index.ts            # bulk re-export
├── tokens/                 # CSS custom properties
│   ├── colors.css          # semantic surface stack + brand colors
│   ├── shadows.css         # ALL evaluate to `none` (Autara house rule)
│   ├── radii.css
│   ├── typography.css      # @font-face + --font-brand
│   └── index.css           # @import all
├── utilities/              # CSS utility classes
│   ├── forms.css           # .field-input, .field-textarea, .input-light alias
│   ├── glass.css           # .glass-card, .nav-glass, .service-card (no shadows)
│   ├── editorial.css       # .hairline-grid, .editorial-eyebrow, .counter-huge
│   ├── noise.css           # .noise-overlay
│   ├── buttons.css, gradients.css, sections.css, animations.css
│   └── index.css
├── fonts/                  # Satoshi .otf — bundled in v1.1.0+
├── preset/index.mjs        # Tailwind v4 preset (consumers import this)
├── lib/cn.ts               # clsx + tailwind-merge helper
└── index.ts                # public package surface

.storybook/
├── main.ts                 # framework + viteFinal
├── preview.ts              # global decorator + viewports
└── storybook.css           # loads tokens + utilities + forces warm-cream canvas

docs/
├── Introduction.mdx
└── Tokens.mdx              # visual token explorer
```

## Adding a new component — the checklist

1. **Audit first.** Grep `src/components/` for the closest existing
   primitive. Extend rather than duplicate when possible.
2. **Read the [`globals.css`](../autara-customer-web/src/app/globals.css)
   philosophy comment.** *"NO DROP SHADOWS. The brand reads as solid,
   editorial, hairline-edged — never floating-card."* Honor it. Lift
   comes from border-color shifts on hover, never `box-shadow`, never
   `translateY` on static surfaces (interactive buttons may translate).
3. **Use semantic tokens, never raw hex.** `var(--text-strong)` not
   `#0E0A1A`. `var(--surface)` not `#FFFFFF`. The exceptions are when
   you genuinely need a one-off color (rare — almost always wrong).
4. **Polymorphism via Radix Slot (`asChild`)**, not by importing the
   consumer's framework. autara-ui must NEVER `import "next/link"` or
   `from "react-router-dom"`. Slot composes with anything.
5. **Write the story alongside the component.**
   - Default
   - Each meaningful variant
   - At least one edge case (long text, missing optional fields, error
     state)
   - An "in context" story showing real consumer usage when the
     component composes others (see `MerchantCard.stories.tsx`'s
     `TopRatedRail` story for the canonical example)
6. **Export from `src/components/index.ts` AND `src/index.ts`.**
7. **Run `pnpm typecheck`, `pnpm build`, and `pnpm storybook`** — all
   three must be clean before opening a PR.
8. **Commit message follows semantic-release conventions:**
   - `feat: add MerchantCard` → minor bump (v1.1 → v1.2)
   - `fix: ...` → patch bump
   - `feat!: ...` or `BREAKING CHANGE:` in body → major bump

## Aesthetic invariants — the things that make Autara look like Autara

- **Warm cream** `#FBFAF6` — page background, never clinical white
- **Hairline borders** at `rgba(17,24,39,0.08)` — the primary depth signal
- **NO drop shadows** — `--shadow-*` tokens all evaluate to `none`
- **Brand purple `#4E1BBD` is an ACCENT** — used for rating stars,
  brand badges, focus rings, link underlines. Primary CTAs on cream
  surfaces are **solid black** (`BrandButton variant="dark"`), not
  purple. Purple primary is reserved for dark/photo surfaces.
  Since AUTM-734 this rule is *encoded*, not just documented:
  `variant="dark"` paints `--cta-fill`, which is ink in light theme and
  brand purple in dark. Don't reach for `--surface-inverse` on a CTA —
  that token inverts (correct for a Tooltip/Toast capsule, wrong for a
  button, which turned into a white slab on dark before this landed).
- **Satoshi typography** — bundled. Use weights 400 / 500 / 700 only
  (Black mapped to 700). Never 300, 600, 800, 900.
- **Focus signature (v2.4): warm-cream tint + solid brand-purple border, NO
  halo** on focused inputs (`.field-input`). Corrected 2026-09-01 — this line
  used to claim a "4px brand-purple halo", and `src/utilities/forms.css` says
  in its own rule: "a clean, symmetric ring, no outer halo and no one-sided
  bar". The stale claim propagated into merchant-mobile's CLAUDE.md and into an
  agent brief before the code was checked. Read the rule, not the prose.
  signature focus ring
- **Editorial eyebrow** — uppercase 11px, `letter-spacing: 0.22em`,
  with a hairline tick (`::before`) — anchors every section heading

## Known gotchas

- Storybook 10's default canvas is dark; `storybook.css` forces
  warm-cream via `!important` on `html`, `body`, `#storybook-root`,
  `.docs-story`, `.sb-show-main`, `.sbdocs-*` so stories render in the
  canonical background. If you add a new Storybook chrome surface that
  ignores this, extend the selector list rather than removing the
  `!important`.
- Tokens are two-layer since AUTM-734: raw *themed* values live on
  `:root` / `:root[data-theme="dark"]` blocks in `colors.css`, and the
  `@theme inline` block maps Tailwind-facing names onto them with
  `var()` references. Add a themed token to BOTH root blocks; add a
  Tailwind-utility name only in `@theme inline`. A bare hex directly in
  `@theme inline` means "static in both themes" (brand hexes, grays,
  intent fills) — that's a deliberate choice, not an omission.
- Dark mode keys off `data-theme="dark"` on `<html>` — never
  `prefers-color-scheme` (the app owns switching/persistence). A
  `dark` custom variant is declared in `tokens/index.css`; prefer
  token-driven theming over `dark:` classes. Interactive/text purple
  must use `var(--accent)` (readable in both themes), solid fills use
  `var(--accent-fill)`; the `--color-autara-purple` alias resolves to
  the fill. `#4E1BBD` measures ~1:1 against dark surfaces — never
  hardcode it for text/borders. The Storybook toolbar has a Theme
  switcher — check every story in both modes.
- **A `theme` prop's default may be a TypeScript PARAMETER default, and
  `default-variant.test.ts`'s cva scan cannot see one.** That scan reads
  `defaultVariants:` out of a `cva()` call, so `({ theme = 'dark' })` is not
  merely missed by it — it is unreachable by that technique. Three components
  defaulted to the static ink treatment for months behind that blind spot
  (`Table`, `Avatar`'s fallback, `Progress`'s track); a bare `<Table>`
  measured **1.00:1** on the cream canvas. AUTM-975 extended the test to
  resolve parameter defaults, including the `const isDark = theme === 'dark'`
  alias form. Related trap in the naming: on these components `theme="light"`
  means *"the branch built from semantic tokens"*, i.e. the one that TRACKS
  the theme in both directions — `theme="dark"` is the static opt-in for a
  photo or marketing surface, not dark mode. The value names are published
  API and are not being renamed.
- The Tailwind preset (`src/preset/index.mjs`) maps `bg-autara-purple`
  and friends. Consumers must include the preset in their Tailwind
  config OR import the CSS tokens — pick one consistent path per app.
- **Storybook can paint over the focus ring you are trying to check.**
  `.storybook/storybook.css` carries a `*:focus-visible` fallback outline. It
  used to sit UNLAYERED right after `@import "tailwindcss"`, and unlayered CSS
  beats layered CSS regardless of specificity — Tailwind v4 puts utilities in
  `@layer utilities`, so that one rule overrode `focus-visible:outline-none`
  on every component in the library. A focused `Button` computed
  `outline: rgb(78, 27, 189) solid 2px` from Storybook while its own ring sat
  at 35% alpha underneath, and no consumer ever rendered that outline because
  `.storybook/` ships nowhere. That is how 27 focus rings drifted below the
  WCAG 2.4.11 floor while every story looked right (AUTM-977). It is now in
  `@layer base` and `solid-emphasis.test.ts` fails if it leaves the layer.
  Corollary when measuring anything focus-related: `Button`'s BASE carries
  `transition-all duration-200`, so screenshotting straight after a `Tab`
  samples frame 1 and reports a ~0px ring at ~0.004 alpha. Settle first.
- Components must NOT import `motion/react` for layout-critical
  visuals — `whileInView` + variants are flaky on Next 16 + React 19 +
  motion v12 in customer-web. Use IntersectionObserver or direct
  scroll-driven `useMotionValue` if motion is unavoidable. See
  `HowItWorks.tsx` in customer-web for the working pattern.

## Versioning

semantic-release fires on PR merge to `main`. The current major is
v1; v1.1.0 introduces the customer-web aesthetic + Storybook + 8
promoted components (MerchantCard, SectionHeading, CarouselHeader,
BrandButton, MetaChip, RatingStars, EmptyState, plus the existing
Card/Input/Button etc.). v1.2.0 is reserved for the remaining
component promotions (ServiceCard horizontal-thumb variant, TrustItem,
HowItWorks step-card pattern).
