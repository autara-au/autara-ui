import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * AUTM-1017 — `.gradient-ground > * { position: relative }` silently defeated
 * Tailwind's `.fixed`, `.absolute` and `.sticky` on any DIRECT child.
 *
 * This file is UNLAYERED, and unlayered CSS beats anything in
 * `@layer utilities` regardless of specificity — so the child kept its class
 * in the markup and lost the behaviour. merchant-mobile's app shell rendered
 * 1194x0: in the DOM, correct background-image, painting nothing.
 *
 * The rule was never needed. The ground is a `background-image` on the
 * element, and CSS paints a background below its own content unconditionally.
 *
 * Read as text rather than through a DOM, deliberately: jsdom does not
 * implement the cascade well enough to distinguish "unlayered beats layered"
 * from "specificity", so a DOM test here would pass for the wrong reason.
 */
const GLASS = readFileSync(resolve(process.cwd(), 'src/utilities/glass.css'), 'utf8')

/** Strip comments — the block explaining the removal names the rule, and a
 *  naive scan matches its own explanation. Exactly the failure mode that let
 *  an earlier guard in this repo pass against the defect it was written for. */
const CODE = GLASS.replace(/\/\*[\s\S]*?\*\//g, '')

describe('gradient-ground does not clobber a child position', () => {
    it('declares no blanket position on direct children', () => {
        expect(CODE).not.toMatch(/\.gradient-ground\s*>\s*\*/)
    })

    it('still paints the ground as a background-image, which is why the rule was unnecessary', () => {
        // If the blooms ever move to a ::before overlay, children WILL need a
        // stacking fix again — but a scoped one, not a blanket child rule.
        expect(CODE).toMatch(/\.gradient-ground\s*\{[^}]*background-image:/)
        expect(CODE).not.toMatch(/\.gradient-ground::(before|after)/)
    })
})

/**
 * AUTM-1376 — each bloom used to fall from its peak straight to `transparent`
 * at 60% of the ellipse in one linear stop. A linear ramp that stops dead is
 * a slope discontinuity, which the eye reads as a ring, so at 2560px the
 * merchant landing's hero showed a hard circular edge where the teal bloom
 * ended. The fix is an eased falloff that reaches zero only at the ellipse
 * edge, on an ellipse that grows with the viewport. Pinned here because the
 * ring is invisible at 1440 and nobody reviews a PR at 2560.
 */
describe('gradient-ground blooms fade out without a hard edge', () => {
    const ground = CODE.match(/\.gradient-ground\s*\{([^}]*)\}/)?.[1] ?? ''
    const blooms = ground.match(/radial-gradient\([\s\S]*?\n\s*\)/g) ?? []

    it('paints three blooms', () => {
        expect(blooms).toHaveLength(3)
    })

    it.each(blooms.map((b, i) => [i, b]))('bloom %i only reaches transparent at the ellipse edge', (_i, bloom) => {
        // The last stop is `transparent 100%`, never `transparent 60%`.
        expect(bloom).toMatch(/transparent\s+100%\s*\)\s*$/)
        expect(bloom).not.toMatch(/transparent\s+[1-9]?\d%/)
    })

    it.each(blooms.map((b, i) => [i, b]))('bloom %i steps its alpha down through intermediate stops', (_i, bloom) => {
        // A bell-shaped ramp needs stops between the peak and the edge; one
        // peak stop plus `transparent` is the linear ramp this guards against.
        const alphaStops = bloom.match(/--bloom-alpha\)\s*\*\s*\d+%/g) ?? []
        expect(alphaStops.length).toBeGreaterThanOrEqual(4)
        expect(alphaStops[0]).toMatch(/\*\s*100%/)
    })

    it.each(blooms.map((b, i) => [i, b]))('bloom %i grows with the viewport', (_i, bloom) => {
        expect(bloom).toMatch(/max\(\d+rem,\s*\d+vw\)\s+max\(\d+rem,\s*\d+vw\)\s+at/)
    })
})
