/**
 * Autara brand + semantic palette for the Tailwind preset.
 *
 * AUTM-713 — every value here USED to be a hardcoded hex, duplicating
 * src/tokens/colors.css. Two sources for one palette drifted, as they always
 * do: six of the seven surface/border entries disagreed with the tokens by
 * the time anyone looked.
 *
 *     bg      '#f7f7f7'  vs  --background        #fbfaf6
 *     fg      '#0a0a0a'  vs  --foreground        #0e0a1a
 *     border  '#e5e5e5'  vs  --border-subtle     rgba(17,24,39,.08)
 *     track   '#eeeeee'  vs  --surface-elevated  #f4f2ec
 *     fg-muted / fg-subtle likewise
 *
 * The drift was invisible because the preset and the tokens emit DIFFERENT
 * class names for the same idea (`bg-autara-bg` vs `bg-[var(--background)]`),
 * so nothing ever rendered them side by side.
 *
 * Every entry now points at the token instead of copying it. The value lives
 * in colors.css and nowhere else, so this file cannot drift again — and
 * colors.test.ts fails if an entry stops resolving to a real token.
 *
 * KNOWN LIMIT — `var()` colours do not support Tailwind's slash opacity
 * modifier (`bg-autara-bg/50`), which needs a bare channel triple. Accepted
 * deliberately: `presets` is a Tailwind v3 mechanism, v4 replaced it with
 * `@theme`, and all three current consumers (merchant-mobile, customer-web,
 * merchant-web) are on v4 and import `@autara-au/autara-ui/tokens` rather than
 * this preset. Correctness beats an opacity modifier no live consumer can
 * reach. If a v3 consumer ever needs it, split the channels in colors.css —
 * do NOT reintroduce a second copy of the numbers here.
 */

/** @type {Record<string, unknown>} */
export const colors = {
    purple: {
        DEFAULT: 'var(--color-autara-purple)',
        dark: 'var(--color-autara-purple-dark)',
        darker: 'var(--color-autara-purple-darker)',
        light: 'var(--color-autara-purple-light)',
        lighter: 'var(--color-autara-purple-lighter)',
        50: 'var(--color-autara-purple-50)',
        100: 'var(--color-autara-purple-100)',
    },
    'sky-aqua': 'var(--color-autara-sky-aqua)',
    'lime-drive': 'var(--color-autara-lime-drive)',
    'lime-bright': 'var(--color-autara-lime-bright)',
    gray: {
        50: 'var(--color-autara-gray-50)',
        100: 'var(--color-autara-gray-100)',
        200: 'var(--color-autara-gray-200)',
        300: 'var(--color-autara-gray-300)',
        400: 'var(--color-autara-gray-400)',
        500: 'var(--color-autara-gray-500)',
        600: 'var(--color-autara-gray-600)',
        700: 'var(--color-autara-gray-700)',
        800: 'var(--color-autara-gray-800)',
        900: 'var(--color-autara-gray-900)',
    },

    /* The semantic surface stack — these six are the ones that had drifted. */
    bg: 'var(--background)',
    surface: 'var(--surface)',
    fg: 'var(--foreground)',
    'fg-muted': 'var(--text-muted)',
    'fg-subtle': 'var(--text-subtle)',
    border: 'var(--border-subtle)',
    track: 'var(--surface-elevated)',

    /* AUTM-948 — the semantic accent trio and the glass material.
     * Defined in tokens/glass.css, which is why colors.test.ts scans both
     * sheets. Pointer layer, same as everything else here: no numbers. */
    act: 'var(--act)',
    'act-fill': 'var(--act-fill)',
    'on-act': 'var(--on-act)',
    flight: 'var(--flight)',
    'flight-fill': 'var(--flight-fill)',
    'on-flight': 'var(--on-flight)',
    money: 'var(--money)',
    'money-fill': 'var(--money-fill)',
    'on-money': 'var(--on-money)',
    glass: 'var(--glass-fill)',
    'glass-strong': 'var(--glass-fill-strong)',
    'glass-edge': 'var(--glass-edge)',

    error: 'var(--color-autara-error)',
    success: 'var(--color-autara-success)',
    warning: 'var(--color-autara-warning)',
    'warning-text': 'var(--color-autara-warning-text)',
    info: 'var(--color-autara-info)',
}
