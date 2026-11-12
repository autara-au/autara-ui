/**
 * The `--motion-*` tokens from `utilities/animations.css`, as typed values
 * for motion driven from JavaScript (framer-motion, `motion/react`, the Web
 * Animations API). AUTM-1594.
 *
 * Why: merchant-web read these off the page with `getComputedStyle` and kept
 * a hard-coded fallback for the server render (its `src/utils/motion.ts`,
 * AUTM-1601). A copy like that drifts the day a token moves. These are the
 * same numbers, shipped with the stylesheet that defines them, and
 * `motion-tokens.test.ts` fails if the two ever disagree.
 *
 * Pairing, as the stylesheet does it: an EXIT (`*Out`) runs on the ease-in
 * curve and everything else (every enter, and hover and press) on ease-out. Enters are slower than
 * exits on purpose: an opening surface is asking for attention and a closing
 * one is getting out of the way. `motionTransition()` applies the pairing.
 *
 *     import { motionTransition } from '@autara-au/autara-ui'
 *     <motion.div
 *         initial={{ y: '100%' }}
 *         animate={{ y: 0, transition: motionTransition('sheetIn') }}
 *         exit={{ y: '100%', transition: motionTransition('sheetOut') }}
 *     />
 *
 * Reduced motion: the stylesheet clamps every CSS animation for a user who
 * asked for less motion, and that clamp cannot reach an animation driven from
 * JS. Honour it where the animation is defined, for framer-motion with
 * `<MotionConfig reducedMotion="user">` or `useReducedMotion()`. Animate
 * `transform` and `opacity` only, as the CSS does.
 */

/** A cubic-bezier as four control-point numbers, framer-motion's `ease`. */
export type MotionBezier = readonly [number, number, number, number]

/**
 * Durations in MILLISECONDS, as the stylesheet declares them. Key is the CSS
 * name in camelCase: `--motion-sheet-in` is `sheetIn`.
 */
export const motionDurations = {
    panelIn: 160,
    panelOut: 120,
    // AUTM-1792: dialogs and sheets at 350ms in, per Don's 2026-10-09 reference.
    modalIn: 350,
    modalOut: 150,
    scrimIn: 200,
    scrimOut: 150,
    sheetIn: 350,
    sheetOut: 200,
    navIn: 250,
    navOut: 200,
    // AUTM-1678: page content. Uses and the reduced-motion form of each are
    // in the "Page content motion" header of utilities/animations.css.
    reveal: 480,
    stagger: 60,
    settle: 280,
    settleDelay: 120,
    hover: 160,
    press: 120,
    pageIn: 200,
    pageOut: 120,
    skeleton: 1400,
    crossfade: 160,
    // AUTM-1792: pops, rows and counts. Uses in the "Pops, rows and counts"
    // block of utilities/animations.css.
    menuIn: 300,
    menuOut: 150,
    pop: 450,
    tab: 450,
    row: 400,
    rowStagger: 30,
    count: 900,
    // AUTM-1799: a step track's current disc breathing (`.motion-breathe`).
    breathe: 2400,
    // AUTM-1819: a small pill arriving (`.motion-badge-in`).
    badgeIn: 240,
    // AUTM-1781: a screen's sections arriving (`.motion-rise`), one
    // `stagger` apart. The rest of the customer app's vocabulary is the
    // AUTM-1792 set above: `tab` is every 450ms slide (a tab pill, the
    // dock's pill, a screen pushed), `sheetIn` and `modalIn` every sheet and
    // dialog.
    enter: 550,
} as const

/**
 * `--motion-ease-out` (enters) and `--motion-ease-in` (exits), and
 * `--motion-ease-pop` (AUTM-1792), the small overshoot for things that pop:
 * a menu opening, a chip chosen. Transform only; never a sheet, a dialog or
 * a page. `motionTransition()` never picks it, so ask for it by name.
 *
 * One ease-out for everything that arrives (AUTM-1781): the customer app's
 * vocabulary was drafted on its own soft curve, (0.22, 1, 0.36, 1), and runs
 * on `out` instead, so a menu, a sheet and a screen feel like one product.
 */
export const motionEasings = {
    out: [0.16, 1, 0.3, 1],
    in: [0.4, 0, 1, 1],
    pop: [0.34, 1.56, 0.64, 1],
} as const satisfies Record<string, MotionBezier>

export type MotionDurationName = keyof typeof motionDurations

/**
 * The tokens that time a transition, which `motionTransition()` takes. The
 * others are not transitions: `stagger`, `rowStagger` and `settleDelay` are DELAYS
 * (use `motionStaggerDelay()` and `motionDurations.settleDelay`), and
 * `skeleton` is a loop on `ease-in-out`, not an enter or an exit.
 */
export type MotionTransitionName = Exclude<MotionDurationName, 'stagger' | 'settleDelay' | 'skeleton' | 'rowStagger'>

/**
 * Children 1 to 6 step by `--motion-stagger`; the seventh onward share the
 * sixth's delay, so no more than six things are ever moving at once.
 */
export const MOTION_STAGGER_CAP = 6

/** Every token in one object, for consumers that want a single import. */
export const motionTokens = {
    durationMs: motionDurations,
    ease: motionEasings,
} as const

/**
 * A framer-motion transition for a token: the duration in SECONDS (the unit
 * framer-motion takes) and the curve the stylesheet pairs it with. Exits
 * (`*Out`) run on ease-in; enters and interactive responses (reveal, settle,
 * hover, press, crossfade) on ease-out.
 *
 *     <motion.div transition={{ ...motionTransition('settle'), delay: motionDurations.settleDelay / 1000 }} />
 */
export function motionTransition(name: MotionTransitionName): {
    duration: number
    ease: MotionBezier
} {
    return {
        duration: motionDurations[name] / 1000,
        ease: name.endsWith('Out') ? motionEasings.in : motionEasings.out,
    }
}

/**
 * The stagger delay in MILLISECONDS for the child at `index` (0-based), as
 * `.motion-stagger` and `Reveal stagger` apply it: 0, 60, 120 ... 300, then
 * 300 for every child after the sixth. Divide by 1000 for framer-motion.
 */
export function motionStaggerDelay(index: number): number {
    const step = Math.min(Math.max(Math.floor(index), 0), MOTION_STAGGER_CAP - 1)
    return step * motionDurations.stagger
}

/**
 * The same token as a Web Animations timing (AUTM-1781): the duration in
 * MILLISECONDS, which `element.animate()` takes, and the curve as a CSS
 * string, paired exactly as `motionTransition()` pairs it (exits on ease-in,
 * everything else on ease-out).
 *
 *     el.animate(keyframes, motionTiming('tab'))
 */
export function motionTiming(name: MotionTransitionName): {
    duration: number
    easing: string
} {
    const curve = name.endsWith('Out') ? motionEasings.in : motionEasings.out
    return { duration: motionDurations[name], easing: `cubic-bezier(${curve.join(', ')})` }
}
