# autara-ui: Autara design system

The shared component library, tokens and Tailwind v4 preset for every Autara
surface, published as `@autara-au/autara-ui` on GitHub Packages. PR-only: no push
to `main`, semantic-release publishes on merge. Detail for any line below:
`docs/claude-reference.md` (not loaded automatically; read the section named).

## Commands

```sh
pnpm install --frozen-lockfile
pnpm storybook        # http://localhost:6006
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest, jsdom
pnpm test:browser     # vitest in real Chromium (*.browser.test.tsx); first run: pnpm exec playwright install chromium
pnpm build            # tsc + scripts/fix-esm-extensions.mjs -> dist/ (no bundler; ships .js, .d.ts, .css; NO fonts)
pnpm build-storybook  # storybook-static/
```

Before a PR: `typecheck`, `build` and `storybook` clean. Commits are conventional:
`feat:` minor, `fix:` patch, `feat!:` or `BREAKING CHANGE:` major.

## Stack and layout

React 19, Radix primitives, CVA, tailwind-merge; tokens are CSS custom properties
via Tailwind v4 `@theme inline`; Storybook 10 (`@storybook/react-vite`).
`src/components/` (one component per file, `<Component>.stories.tsx` beside it),
`src/tokens/` (colors, shadows, radii, typography, `stone.css`), `src/utilities/`,
`src/preset/index.mjs`, `src/lib/`, `src/icons/` (also the `/icons` subpath),
`.storybook/`, `docs/`. Full tree: reference, "File layout".

## Conventions

- **Adding a component** (reference, "Adding a new component"): grep
  `src/components/` for the closest primitive and extend it; semantic tokens
  never raw hex; polymorphism through Radix `Slot` (`asChild`), never import
  `next/link` or `react-router-dom`; a story (Default, each variant, an edge
  case, an in-context story); export from `src/components/index.ts` AND
  `src/index.ts`. A component reaches this repo only when Don asks (workspace
  rule); once here it needs its story before any consumer imports it.
- **Tokens are two-layer** (AUTM-734): themed values in the `:root` and
  `:root[data-theme="dark"]` blocks of `colors.css`, Tailwind names in
  `@theme inline` pointing at them with `var()`. A themed token goes in BOTH root
  blocks; a bare hex in `@theme inline` means static in both themes.
- **Dark mode** is `data-theme="dark"` on `<html>`, never `prefers-color-scheme`.
  Text and link purple is `var(--accent)`, solid fills `var(--accent-fill)`;
  never hardcode `#4E1BBD` for text or borders (about 1:1 on dark). Check every
  story in both themes.
- **Paper and band:** `--background` / `--surface` `#ffffff`, `band` `#f4f2ec`
  cards, one `brand-deep` hero per screen (AUTM-1594). Cards are set apart by
  fill, not border; dividers are hairlines at `rgba(17,24,39,0.08)`.
- **No shadows:** every `--shadow-*` is `none`; only `--float-shadow` on floating
  sheets and popovers. Lift is a border-colour shift, never `box-shadow`, never
  `translateY` on a static surface.
- **Buttons:** `Button variant="primary"` is lime with an ink label, the one
  primary; everything else `quiet`; no black buttons (AUTM-1838). Shape is a pill
  (`Button.tsx` radius = half the size's height in rem). Buttons never mute
  (AUTM-1719) and press by default (AUTM-1708).
- **Labels are sentence case**, never letterspaced uppercase (Don, 2026-11-20).
  `.editorial-eyebrow` and its hairline tick are superseded; do not use them.
- **Badges:** solid pills (default `shape="pill"`); `parallelogram` is the
  optional skewed shape, only for status.
- **Fields are glass, still** (AUTM-2140, Don 2026-11-14): the merchant web app's
  glass fields are correct. Everything else on product surfaces: no glass, no
  gradients (`glass.css`, `gradients.css` ship for old consumers only).
- **Focus signature** (AUTM-2140): a field's 1px edge in the accent at 75% plus a
  faint accent tint, no halo, no outline; a keyboard-focused button keeps a 2px
  accent outline 3px out. The rule is in `src/utilities/forms.css`; read it, not
  prose.
- **Motion:** one ease-out `--motion-ease-out`, transform and opacity only,
  durations from `--motion-*` (`src/lib/motion-tokens.ts` in JS), reduced motion
  honoured (a JS animation calls `useReducedMotion` itself). Never type a
  duration or curve; search `animations.css` before adding a token or class.
- **Satoshi:** weights 400 / 500 / 700 for body and UI, 900 for display figures,
  page titles and dialog and sheet titles. Never 300, 600 or 800.
- **Stone** (`tokens/stone.css`, opt-in, AUTM-2137) is the merchant apps' look and
  lives here, never in an app. A Stone value changes here, in `au.css` and in
  autara-ios `Tokens.swift` together.
- Do not import `motion/react` for layout-critical visuals (flaky on Next 16 +
  React 19 + motion v12); use IntersectionObserver or scroll-driven
  `useMotionValue`.
- Storybook's canvas is forced to the paper ground with `!important` in
  `.storybook/storybook.css`; extend the selector list for new chrome, never
  remove it.

## Gotchas (each one has caused breakage; detail in the reference, under "Known gotchas")

- **Never commit a font file or an @font-face that points at one** (AUTM-1724):
  the repo is PUBLIC and Satoshi's licence forbids it. Every consumer self-hosts
  400, 500, 700 and 900 in a private repo. `typography.test.ts` guards it.
- **A field is `.field-shell` around a borderless `.field-shell-control`:**
  `className` and `style` go on the shell, ref/id/aria/`data-testid` on the
  control. `<GlassEdgeTracker />` once at the app root or the glint parks.
- **OtpInput is one pill with six slots** (AUTM-2140): delete consumer CSS written
  for six boxes; slots keep "Digit N of 6" and `maxlength="1"` (QA asserts it).
- **Autara icons are function declarations**, never `icon(...)` factory calls or
  top-level JSX (breaks `side-effects.test.ts`, AUTM-1688); a glyph never names a
  colour (`AutaraIcons.test.tsx`). Category glyphs are generated: regenerate,
  never hand-edit.
- **Never type or colour classes on `h1` to `h6`;** put them on an inner element
  (consumers style headings unlayered; AUTM-1694).
- **Unlayered CSS beats Tailwind layers:** keep the Storybook `*:focus-visible`
  rule in `@layer base` (`solid-emphasis.test.ts`, AUTM-977).
- **`theme` prop defaults can be TypeScript parameter defaults** that
  `default-variant.test.ts` must resolve; `theme="light"` means "tracks the
  theme", `theme="dark"` is a static opt-in (AUTM-975).
- **Never put a transform or position between a `[data-hit]` and its card**
  (ServiceCard stretched hit area, AUTM-1786); guard is
  `ServiceCard.browser.test.tsx`. ServiceCard `layout="menu"` foot is a subgrid
  that must carry `gap-x-4` (AUTM-1866).
- **Vehicle catalog is a copy of customer-api's, by name** (AUTM-1870, AUTM-2005):
  change `src/lib/vehicle-catalog.ts` and customer-api's `vehicleData.ts` in one
  change; both tests pin a fingerprint. Make logos are generated by
  `scripts/gen-vehicle-make-logos.mjs`; never hotlink; `simple-icons` stays an
  exact-pinned devDependency.
- **`ChatShareCard`:** no map key, no place sent anywhere (AUTM-2199);
  `parseChatShare` mirrors autara-contracts `parseAttachmentLine` byte for byte
  and the native ChatPieces.swift parsers (catalogued contract).
- **Toast:** the capsule has no live role; the provider's `role="status"` and
  `role="alert"` regions hold it. Never a hidden duplicate of the words.
- **Scrollbars:** nothing in a page draws one; the page keeps its brand bar
  (AUTM-1899). Never a `::-webkit-scrollbar` rule on `<body>`.
- **Chips rows are `ChipRow`,** never a scrollbar or bare `overflow-x-auto`
  (AUTM-1756); browser tests that press a chevron pass `arrows="always"`.
- **Loading has three answers** (AUTM-1706): `AutaraLoader`, `Skeleton`,
  `Spinner`; no component draws its own ring or relabels itself "Saving...".
- **`BloomField` is GPU work:** a hero and a footer only (AUTM-1475).
- **Layout traps:** `PageContainer` measure in `em`, never `ch` (AUTM-1739);
  `ScrollStory` pins at `top: 0` and needs `timeline-scope` (AUTM-1679);
  `Disclosure` (marketing FAQ) vs `Accordion` (app); `Reveal` vs `ScrollReveal`;
  `GlassSurface lit` needs a `LitGroup`.
- **Photos:** `preparePhoto` is on `/photo` and the root, never `/utilities`
  (AUTM-1882); jsdom cannot test it, use the browser test.
- **Press and motion:** no local `transform: scale` press on Button-based things
  (it multiplies); under Tailwind v4 `transition-[transform] active:scale-*`
  never animates; stagger rules go inside `prefers-reduced-motion: no-preference`.
