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
| Build | `tsc` (no bundler — autara-ui ships .js + .d.ts + .css as-is; NO fonts, AUTM-1724) |
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
pnpm test            # vitest in jsdom
pnpm test:browser    # vitest in real Chromium (*.browser.test.tsx); first run:
                     # pnpm exec playwright install chromium
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
│   ├── typography.css      # --font-brand + type scale (no @font-face, AUTM-1724)
│   └── index.css           # @import all
├── utilities/              # CSS utility classes
│   ├── forms.css           # .field-input, .field-textarea, .input-light alias
│   ├── glass.css           # .glass-card, .nav-glass, .service-card (no shadows)
│   ├── editorial.css       # .hairline-grid, .editorial-eyebrow, .counter-huge
│   ├── noise.css           # .noise-overlay
│   ├── buttons.css, gradients.css, sections.css, animations.css
│   └── index.css
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
- **Satoshi typography** — NOT bundled since AUTM-1724: the tokens name the
  family and every consumer self-hosts the faces (see Known gotchas). Use
  weights 400 / 500 / 700 for body and UI; 700 is Satoshi Bold. 900 is
  Satoshi Black, for display figures and dialog and sheet titles (Don,
  2026-10-02). Never 300, 600 or 800. *Corrected 2026-10-01 (AUTM-1568): this said "Black mapped to 700",
  and the package did exactly that, so every bold label in every consumer
  rendered Black and a 900 heading had no face of its own. The weight to
  file mapping now lives in each consumer's own @font-face.*
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

- **Never commit a font file to this repo, and never add an @font-face that
  points at one** (AUTM-1724, Don 2026-10-04). This repository is PUBLIC and
  Satoshi's licence (ITF FFL v2.0, section 02) forbids making the files
  available to anyone else; section 01 lets each app self-host its own copy.
  So the package names the family `"Satoshi"` in `--font-brand` and nothing
  more, and every consumer declares its own faces for 400, 500, 700 and 900
  from Fontshare's official files, unaltered, in a PRIVATE repo. A consumer
  that declares only some weights draws every weight with the nearest face it
  has (only Black declared means body text in Black). Old commits still
  contain the .otf files; purging history needs a force-push and is Don's
  call. `src/tokens/typography.test.ts` fails if a font file or a font URL
  comes back. Storybook renders the system stack unless you drop your own
  WOFF2s into the gitignored `.storybook/local-fonts/`, which only
  `storybook dev` serves; `storybook build` never includes them.

- **`BloomField` is GPU work and belongs on a hero and a footer only**
  (AUTM-1475, Don 2026-09-28). It is `GradientGround` with a WebGL2 canvas
  over it; the shader READS the bloom tokens from the element's computed
  style, so never pass it a colour. Half resolution, 30 fps cap, stops when
  off-screen, one frame under reduced motion, static ground without WebGL2.
  Consumer budget is under 2 ms a frame on the iPad Pro 11", measured on the
  device: over that, ship `GradientGround`. Count live fields on a page with
  `document.querySelectorAll('[data-ground="live"]')`.
- **`GlassSurface lit` does nothing outside a `LitGroup`.** The group is the
  one pointer listener; it sets `--lx` / `--ly` / `--lo` on every `[data-lit]`
  descendant. Nine tiles, one handler. Touch pointers are ignored, so a
  phone sees the flat highlight.
- **`Reveal` (scroll-driven) is not `ScrollReveal` (observer).** `Reveal`
  is a server component whose class does nothing until `@supports
  (animation-timeline: view())` and `prefers-reduced-motion: no-preference`
  both hold, so nothing is ever held at `opacity: 0` waiting for a script.
  Prefer it for new marketing work; `ScrollReveal` stays for consumers that
  already use it.
- **Scrollbars are styled in the base layer for every consumer** (AUTM-1739,
  AUTM-1756, utilities/scrollbars.css): a thin rounded `--accent` thumb, drawn
  with `::-webkit-scrollbar` in Blink and WebKit and with the standard
  properties in Firefox ONLY (`@supports not selector(::-webkit-scrollbar)`):
  Chromium 121+ ignores the drawn thumb on any element whose `scrollbar-color`
  or `scrollbar-width` is not `auto`, and `scrollbar-color` inherits. Mouse and
  trackpad only; a finger keeps the platform's overlay bar. A consumer rule
  wins, so a stray `scrollbar-width: none` still hides one. Chromium does NOT
  repaint a thumb when only its scroller's `:hover`/`:focus-within` changes,
  nor on scroll for a composited scroller (a page's `<main>`): so the thumb
  shows at rest everywhere, and only regions marked by ScrollArea or
  `useScrollbarReveal` hide it at rest; they repaint it by toggling
  `data-scrollbar-tick`. Never make a thumb transparent at rest without that
  hook. Playwright's headless shell starts with `--hide-scrollbars`: to shoot
  a bar, use `channel: "chromium"` and `ignoreDefaultArgs: ["--hide-scrollbars"]`.
  On a brand-deep page put `.scroll-on-deep` on <html> AND give <html> the
  deep background: the page's scrollbar belongs to the root, and its
  transparent track shows the canvas behind it.
- **A row of chips is a `ChipRow`, and it never draws a scrollbar** (AUTM-1756
  follow-up, Don 2026-10-15: "instead of scrollbar can add an chevron arrow in
  the ending ... also dragable"). FilterChipRow, QuickReplies `row`, ChoiceChips
  `row` and DatePicker's day rail are all built on it; never a horizontal
  ScrollArea or a bare `overflow-x-auto` row for chips. The chevrons follow
  `arrows="auto"`: shown where `(any-pointer: fine)` matches, so a finger-only
  phone gets the fade and the native swipe, and the Vitest browser context
  (`hasTouch: true`) matches nothing fine: browser tests that press a chevron
  pass `arrows="always"`. `--chip-row-edge` is both the scroll padding and the
  end of the fade; the mask is clear under the disc (`--chip-row-solid`), so
  change the two together. A mouse or pen drag swallows the click its release
  would fire (capture phase on the row), so a chip's own `onClick` never sees a
  drag. The chevrons are `tabIndex={-1}` (Tab walks the chips) and keep
  DatePicker's QA test ids `-earlier` / `-later`.
- **`PageContainer` / `.page-container` is the page track** (AUTM-1739):
  1440px of content (`--page-max`) between a fluid `--page-gutter` (16px to
  96px). Sections, grids and product visuals take the full track; running
  text takes `.page-measure` (30em, about 67 characters of Satoshi). Never
  `ch` for a measure here: Satoshi's "0" is wide, so 68ch set ~103
  characters a line. Change the tokens, not the class.
- **`ScrollStory` pins at `top: 0`, never under a header offset** (AUTM-1679).
  The room for a fixed header is padding inside the pin
  (`--scroll-story-top`), so a header that hides and shows on scroll
  (`useAutoHideHeader`) slides over that padding and the stage never moves.
  Its chip rails fill on CSS scroll-driven animations, one named view timeline
  per step sentinel, which the chips can only reach because the root sets
  `timeline-scope` to every step's name; drop that and every rail sits empty
  with no error. The sentinels' `view-timeline-inset: 50% 50%` is what makes
  a rail fill over exactly its step (top crossing the middle line to bottom
  crossing it).
- **`Disclosure` keeps the answer in the HTML, open or closed** (AUTM-1679).
  It is `<details>`; Radix `Accordion` unmounts a closed answer, which drops
  it from the server render a FAQ is indexed by. Use `Disclosure` for a
  marketing FAQ, `Accordion` inside an app.
- **Loading has three answers, and they are not interchangeable** (AUTM-1706).
  `AutaraLoader` (the mark, turning) for app boot, a route with nothing to show
  yet, and a button's busy state; `Skeleton` / `AsyncSkeleton` for content
  whose shape is known; `Spinner` for work on something already on screen
  (since AUTM-1708 it draws the same mark, same API). No component draws its
  own ring or relabels itself "Saving…" while busy; `busy-and-press.test.tsx`
  greps for it.
  `Button busy` draws the mark OVER the label: the label and icons stay in the
  layout at opacity 0, so the width holds and the accessible name is unchanged.
  A test that looks for the label by visible text still finds it in the DOM;
  one that expected the leading icon to be removed while busy will not.
- **Buttons never mute** (AUTM-1719, Don 2026-10-04: "don't mute the button
  colours even if disabled, show the real colour, everywhere, also loading").
  Button, IconButton and SocialButton keep the variant's real fill and text
  when disabled or busy: no opacity, no filter. Disabled is said by
  `aria-disabled`, the not-allowed cursor and no hover or press; busy by
  `aria-busy` and the mark. So a form's primary button is never disabled: it
  validates on press (the "Validate on press" story). `Button.colour.test.ts`
  holds every variant label to 4.5:1 on its fill in both themes, which is now
  also its disabled and busy contrast.
- **Button presses by default** (AUTM-1708): `motion-press`, or
  `motion-press-row` when `fullWidth`, never on `link`; `press={false}` opts
  out, and `buttonVariants` carries the same. So do IconButton (through
  Button), SocialButton, tappable ListSectionRows and FilterChipRow chips. Do
  not add a local `transform: scale` press to anything built on these: it
  multiplies with the library's `scale` (97% x 97% is about 94%).

- **Page motion has tokens; never type a duration or a curve** (AUTM-1678).
  `--motion-reveal/-stagger/-settle/-hover/-press/-page-in/-page-out/-skeleton/-crossfade`
  in `utilities/animations.css`, typed in `lib/motion-tokens.ts`, with classes
  `.motion-stagger`, `.motion-settle`, `.motion-press`, `.motion-press-row`,
  `.motion-hover-lift`, `.motion-page`, `.motion-skeleton`, `.motion-crossfade`
  and `Reveal stagger`. Two traps behind them: under Tailwind v4,
  `transition-[transform] active:scale-[0.97]` never animates, because
  `scale-*` compiles to the standalone `scale` property; and the global
  reduced-motion clamp shortens duration but not delay, so a staggered rule
  outside `prefers-reduced-motion: no-preference` leaves a reduced-motion user
  staring at invisible items. `motion-system.test.ts` holds both.
- **One motion vocabulary for every app** (AUTM-1792 and AUTM-1781, built in
  parallel and merged into one before either shipped). One ease-out
  (`--motion-ease-out`; no "soft" second curve), `--motion-ease-pop` only for
  a menu's movement; `--motion-tab` is every 450ms slide (TabsList's pill,
  AppTabBar's pill, `.motion-screen`); sheets and dialogs are the plain Sheet
  and Dialog on `--motion-sheet-in`/`-modal-in`, no opt-in class; one
  `CountUp` (`format` for client code, `text` plus `formatOptions` from a
  server component). `.motion-pop` plays when the class is put on: add it at
  the moment of choice (FilterChipRow), never on every option of a group, or
  the one already chosen pops on arrival. Before adding a motion token or
  class, search `animations.css` for the job: a second name for the same
  move is the failure this rule exists for. `app-motion.test.ts` holds it.
- **A stretched hit area dies the moment anything between it and its card
  becomes a containing block** (AUTM-1786). ServiceCard is one link (or one
  radio label) whose `::after` covers the card; a transform, `scale`,
  `translate`, `filter` or `position` on the link, the heading or any wrapper
  shrinks that `::after` to the element. On qa.autara.au customer-web's press
  rule scaled every `a[href]` to 98.5% while pressed, so mid-press the hit area
  became the name and a tap on the photo opened nothing. The card now pins its
  link with important resets, reaches its `::after` out by what its own 98.5%
  press takes in (only while pressed), and forwards any other click on the card
  to the link (`forwardStrayClick`). jsdom cannot hit-test: the guard is
  `ServiceCard.browser.test.tsx` (`pnpm test:browser`, real Chromium, run in
  CI), which runs the card under customer-web's actual rule. Never add a
  transform or a position to anything between a `[data-hit]` and its card.
- **ServiceCard `layout="menu"` is the customer's menu row (AUTM-1866), and
  its foot is a subgrid.** Text left, photo right (30% of the card in `cqi`,
  at most 8.5rem), no placeholder without a photo, one meta line, no More,
  `priceNote` for the fee, and Book as its own control (`bookHref` /
  `onBook`, `data-slot="book"`, above the stretched hit area): a solid
  `--accent-fill` pill under `--on-accent` with a trailing arrow (Don,
  revised). Never `--accent` for that fill: it is text grade and lifts to
  lavender in dark, under 2:1 with a white label. `onOpen` makes the card open
  `ServiceDetailSheet`; with `onSelect` too (the picker) the name opens and the
  radio's state light becomes its own 44px control, the radio keeping its
  test id and its name. The foot is
  `grid-cols-subgrid` so Book takes exactly the photo's column; a subgrid
  with its own column gap shifts its items by half the difference from the
  parent's gap, so the foot must carry the row's `gap-x-4` (Book sat 2px off
  the photo until it did). The other layouts render byte-for-byte as before;
  the catalogue tile and PackageCard depend on that.
- **The vehicle catalog is a copy of customer-api's, by name** (AUTM-1870).
  `src/lib/vehicle-catalog.ts` holds customer-api's
  `src/functions/vehicles/vehicleData.ts` makes and models spelled the same
  ("HiLux", "Mercedes-Benz"), plus a body type per model and the popular
  tiles. The server decides `is_custom_make` / `is_custom_model` from its own
  list (case-insensitive), so a name changed here alone turns picked cars into
  "custom" ones. Change both lists in the same week; `vehicle-catalog.test.ts`
  pins the make names. VehiclePicker searches this copy because one box over
  make AND model needs every model at once, which the API serves one make at
  a time and without bodies. Its messages keep the old form's words
  byte for byte ("Pick the type that's closest.", ASCII apostrophe): QA's
  AUTM-TC-700 matches them. The make marks (`src/lib/vehicle-make-logos.ts`)
  are GENERATED from a Simple Icons package on disk by
  `scripts/gen-vehicle-make-logos.mjs` (23 makes; the rest draw a monogram in
  `VehicleMakeMark`). Simple Icons is deliberately not a dependency (3,400
  icons for 23), and the marks are never hotlinked. Its data is CC0; the marks
  are their makers' trademarks, shown only to name the customer's car.
- **Never put type or colour classes on an `h1` to `h6`; put them on an
  element inside it.** merchant-mobile (`src/main.css`) and customer-web
  (`src/app/globals.css`) both style headings with an UNLAYERED rule (colour
  `--text-strong`, line-height 1.1, -0.02em tracking), and unlayered CSS beats
  every Tailwind utility on the same element. Storybook's own heading rule is
  layered, so a story looks right while a consumer paints, for example,
  ServiceCard's selected name ink on deep purple. Found under AUTM-1694;
  `ServiceCard.test.tsx` pins it.
- **Toast (AUTM-1871, AUTM-1813): the capsule has NO live role.** The provider
  keeps one polite `role="status"` region (and one `role="alert"` for errors)
  in a persistent "Notifications" region and renders each toast INSIDE its
  region, so QA's `getByRole('status').filter({ hasText })` finds the region
  holding the toast; style or measure the capsule by `[data-toast]`. Never a
  hidden copy of the words beside the capsule: every `getByText` on a toast
  then finds two elements (it broke the portal's specs the first time). `groupKey` collapses a burst into one toast in place (the
  merchant portal passes the booking). Defaults: 6 s, pausing on hover, focus
  and a hidden page; three at most; `position="auto"` (top centre under 40rem,
  bottom right from it). `variant` is a no-op now (one raised token surface).
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
