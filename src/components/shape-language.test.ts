import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * AUTM-1594 — canvas v44's component sheet, approved by Don for Autara Web,
 * supersedes the rule below for BUTTONS: "Pills, 44px minimum". A button is a
 * pill again (radius half its height, in rem, so a wrapped label at 200% text
 * gives a rounded rectangle rather than a capsule), and the icon-only action
 * is a 44px disc. Fields keep 14px; the surfaces' ladder moves with their own
 * family. The rest of this file still guards everything the sheet has not
 * reached yet, and each family that lands updates its part here.
 *
 * THE SHAPE LANGUAGE — Don, 2026-09-01. Two families, and only two.
 *
 *   1. SHARED RADIUS — input, button, chip, card, panel. "A surface or a
 *      control." `--radius-autara-md` (14px) is the pair rung: a button and
 *      the field beside it are ONE control group (type, then act), so they
 *      take the same corner. A pill next to a rounded rectangle reads as two
 *      unrelated objects that happen to be adjacent. Cards go one step larger
 *      (16px); chips one step tighter (8px).
 *   2. ROUNDED PARALLELOGRAM — status, and only status. That is `Badge`.
 *
 * The point of buttons giving up the pill is what it leaves behind: the only
 * fully-round things are AVATARS, INDICATOR DOTS, and the small status
 * markers Don kept deliberately. Round therefore means "a person, a state
 * light, or a status marker" and never "an action".
 *
 * That meaning is a finite resource. Every new `rounded-full` spends it, so
 * this test makes spending it a deliberate act with a name attached rather
 * than a default reach.
 *
 * A source scan, in the shape of `default-variant.test.ts`, and for the same
 * reason: jsdom has no stylesheet, so a render assertion would pass while the
 * real app was wrong.
 */

const DIR = resolve(process.cwd(), 'src/components')

/**
 * Files allowed to use `rounded-full`, each with the reason. Two groups.
 *
 * KEEPS — these ARE the reserved meanings, and they are why the rule is worth
 * having. Removing an entry here would be the change that needs arguing.
 */
const KEEPS: Record<string, string> = {
    'Avatar.tsx': 'a person',
    'Radio.tsx': 'the selected dot and its ring — a state light',
    'Switch.tsx': 'a physical toggle: round track, round thumb. State, not an action',
    'Progress.tsx': 'a state bar; the round cap is what makes it read as fill',
    'AsyncSkeleton.tsx': 'shape-matches the avatar it stands in for while loading',
    'Badge.tsx': 'shape="pill" — kept deliberately by Don under AUTM-211 for dense rows where the tilt crowds. A small status object, not an action',
    // Arrived via AUTM-936, which merged after AUTM-948 was branched — this
    // guard caught it on the merge rather than after it shipped, which is the
    // whole reason the list exists.
    'ErrorCard.tsx': 'the optional icon disc (AUTM-1594 removed the default medallion); the retry is a pill Button',
    'InlineAlert.tsx': 'the 24px intent disc, the same state light as ErrorCard, never a control (AUTM-1185)',
    'Button.tsx': 'size="icon", the 44px icon disc on canvas v44 (AUTM-1594). Every other size is a pill by its own half-height radius',
    'Tabs.tsx': 'the segmented track and its pills, canvas v44 "Segmented" (AUTM-1594)',
    'FilterChipRow.tsx': 'filter chips are pills on canvas v44 (AUTM-1594), superseding the 8px chip rung',
    'ChoiceCard.tsx': 'the 40px icon disc beside the label, a glyph in a circle like StepCard (AUTM-1594)',
    'MetaChip.tsx': 'meta chips are 28px pills on canvas v44 (AUTM-1594), superseding the 8px chip rung',
    'StatusDot.tsx': 'the 8px state light itself (AUTM-1594), the meaning round was reserved for',
    'StatTile.tsx': 'the 28px icon disc beside the label (AUTM-1594)',
    'ListSection.tsx': 'the row icon disc and the 4px accent bar\'s round caps (AUTM-1594)',
    'Stepper.tsx': 'the 28px step discs and the bars\' round caps, canvas v44 "Steps and progress" (AUTM-1594)',
    'ProgressSteps.tsx': 'a state bar per step; the round cap is what makes it read as fill, as Progress. With icons, the 36px step discs and their joining line\'s caps, state lights like Stepper\'s (AUTM-1799)',
    'Countdown.tsx': 'the countdown is a 32px pill on canvas v44 (AUTM-1594), a status not an action',
    'Dialog.tsx': 'the 44px close disc, an icon disc like IconButton (AUTM-1594)',
    'Sheet.tsx': 'the close disc, drawn at 28px with a 44px hit area, the quiet sibling of Dialog\'s (AUTM-1594); the bottom sheet\'s grabber pill',
    'Toast.tsx': 'the status dot, and the action pill and dismiss disc on the capsule (AUTM-1594)',
    'EmptyState.tsx': 'the 44px icon disc, canvas v44 "Empty" (AUTM-1594)',
    'LockedFeature.tsx': 'the optional icon disc (AUTM-1594)',
    'SwatchRadioGroup.tsx': 'colour swatches are 44px circles on canvas v50, a choice of colour, not an action (AUTM-1591)',
    'DurationPicker.tsx': 'the Hours | Working days switch, canvas v44 "Segmented" drawn as Tabs draws it (AUTM-1575); the stepper uses Button\'s icon disc',
    'ServiceCard.tsx': 'the duration and working-days chips, MetaChip\'s 28px pill drawn on raised so it shows on the band card; the select indicator, a 24px state light like Radio\'s (AUTM-1694)',
    'AppTabBar.tsx': 'the customer app dock as designed (canvas AppBookings): an ink pill, the current tab a lime capsule (a state light), the count a disc (AUTM-1781)',
    'ActionBar.tsx': 'the customer app bar as designed (AppBookingDetail): pill buttons, the sheet\'s button shape, and 56px icon discs like IconButton (AUTM-1781)',
    'MediaFrame.tsx': 'the round shape is a person (a pro in a chat header or on the live booking), as Avatar (AUTM-1781)',
    'BookingPass.tsx': 'the tear line\'s two notches, half circles cut into the pass the way a ticket is cut, never a control; the face is MediaFrame\'s round person (AUTM-1799)',
    'FactRows.tsx': 'the 40px icon disc beside each value, a glyph in a circle like ChoiceCard and ListSection (AUTM-1799)',
    'VehiclePicker.tsx': 'the model and type chips are pills, as FilterChipRow\'s on canvas v44: a choice, not an action; the back control is the 44px icon disc (AUTM-1870)',
    'VehicleCard.tsx': 'Add a car\'s 48px lime disc, an icon in a circle like EmptyState\'s; the paint dot, a colour swatch like SwatchRadioGroup\'s (AUTM-1870)',
    'IconButton.tsx': 'the icon disc itself, canvas v44 "Icon disc" (AUTM-1594); filled on every tone, never a bare glyph (AUTM-1756)',
    'BackButton.tsx': 'the icon disc without a label, a pill with one: the chevron and the destination, as the merchant dock draws "< Invoice" (AUTM-1756)',
    'SplitPane.tsx': 'the splitter\'s grip, the sibling of Sheet\'s grabber pill: a 6px bar that says the line drags, never a button (AUTM-1755)',
}

/**
 * NOT YET MIGRATED. AUTM-948 moved the five primitives in its scope (Button,
 * Input, MetaChip, FilterChipRow, plus the `.btn-*` CSS classes). These are
 * the rest, listed rather than silently permitted so the remaining sweep is
 * visible and can only shrink.
 *
 * `Toast.tsx` came off this list under AUTM-1221. It was held for Don because
 * the Torph ink capsule is documented in the `autara-aesthetic` skill as
 * "Always rounded-full. Never rounded-xl for a capsule", and a floating status
 * capsule is arguably a status marker and arguably a surface. Don settled it
 * in the 2026-09-09 customer-web hardening plan, which puts the capsule on the
 * radius ladder; the skill's line is the one that is now stale.
 *
 * `Dialog.tsx`, `EmptyState.tsx` and `Stepper.tsx` also came off under
 * AUTM-1221 (the close control, the icon tile, the progress track).
 */
const PENDING: Record<string, string> = {
    'ImageCropDialog.tsx': 'range-slider track, a state bar, likely a keep',
    'MultiSelect.tsx': 'value chips + clear button, chips go to 8px',
    'StepCard.tsx': 'step numeral medallion, a numeral in a circle, likely a keep',
}

function sources(): { file: string; text: string }[] {
    return readdirSync(DIR)
        .filter(
            (f) =>
                f.endsWith('.tsx') &&
                !f.includes('.stories.') &&
                !f.includes('.test.')
        )
        .map((f) => ({ file: f, text: readFileSync(join(DIR, f), 'utf8') }))
}

/**
 * An INDICATOR DOT is a permitted round element anywhere, including inside a
 * component that is otherwise on the shared radius — a status dot on a chip
 * is precisely the meaning `rounded-full` is being reserved for.
 *
 * A dot is SQUARE and SMALL: matching `h-N w-N` at 0.75rem or under. Both
 * halves matter.
 *
 * The size test alone is not enough, and this is not hypothetical — the first
 * version of this helper matched on height only, and cleared
 * `ImageCropDialog`'s range-slider TRACK (`h-1.5 flex-1 rounded-full`) as a
 * dot. A 1.5-unit-tall bar stretched across a dialog is the opposite of a
 * dot; it only shared its height. Requiring the matching width is what tells
 * a state light apart from a track.
 */
function isDot(line: string): boolean {
    const h = /\bh-(\d+(?:\.\d+)?)\b/.exec(line)
    const w = /\bw-(\d+(?:\.\d+)?)\b/.exec(line)
    if (!h || !w || h[1] !== w[1]) return false
    return Number(h[1]) <= 3
}

/** Lines that use `rounded-full` on something that is not a dot. */
function roundNonDots(text: string): string[] {
    return code(text)
        .split('\n')
        .filter((l) => /\brounded-full\b/.test(l) && !isDot(l))
        .map((l) => l.trim())
}

/** Strip comments — they quote the banned class on purpose, as documentation. */
function code(text: string): string {
    let inBlock = false
    return text
        .split('\n')
        .filter((line) => {
            const t = line.trim()
            if (t.startsWith('/*')) inBlock = true
            const was = inBlock
            if (t.endsWith('*/')) inBlock = false
            return !was && !t.startsWith('//') && !t.startsWith('*')
        })
        .join('\n')
}

describe('round means a person, a state light, or a status marker — never an action', () => {
    it('no component reaches for rounded-full without being on a list', () => {
        const unlisted = sources()
            .filter(({ file, text }) => {
                if (file in KEEPS || file in PENDING) return false
                return roundNonDots(text).length > 0
            })
            .map(({ file }) => file)

        expect(
            unlisted,
            'add the file to KEEPS with a reason, or move it to the shared radius'
        ).toEqual([])
    })

    /**
     * The migrated set, pinned individually. A regression here is the exact
     * thing Don flagged: a fully-round purple button sitting next to a
     * rounded-rectangle input.
     */
    /* AUTM-1594: MetaChip and FilterChipRow, the last two on this list, are
     * pills on canvas v44 and are now in KEEPS with that reason. The list
     * is empty rather than deleted so the next family that pins a corner
     * here has the shape to follow. */
    it.each([] as Array<[string, string]>)('%s carries %s, and any round left on it is a dot', (file, radius) => {
        const text = readFileSync(join(DIR, file), 'utf8')
        expect(code(text)).toContain(radius)
        expect(roundNonDots(text)).toEqual([])
    })

    /**
     * AUTM-1594 — each Button size is a pill by a radius of HALF ITS HEIGHT.
     * 9999px would also draw a pill on one line, and is the tempting fix, but
     * at 200% text the label wraps, the box grows, and a 9999px radius makes
     * a capsule whose ends eat the label. Pinned per size so a later "just
     * use rounded-full" loses by name. `min-h-*`, never `h-*` (AUTM-915).
     */
    it.each([
        ['sm', 'min-h-11', '1.375rem'],
        ['md', 'min-h-12', '1.5rem'],
        ['lg', 'min-h-13', '1.625rem'],
    ])('Button size="%s" is %s with a %s radius', (size, height, radius) => {
        const text = code(readFileSync(join(DIR, 'Button.tsx'), 'utf8'))
        expect(text).toMatch(new RegExp(`${size}:\\s*"${height} rounded-\\[${radius.replace('.', '\\.')}\\]`))
    })

    /**
     * The list of pending files is allowed to shrink and never to grow. If
     * someone migrates one, this fails and tells them to delete the entry —
     * which is the only way a "we'll get to it" list ever gets shorter.
     */
    it('every PENDING file still actually uses rounded-full', () => {
        const stale = Object.keys(PENDING).filter(
            (f) => roundNonDots(readFileSync(join(DIR, f), 'utf8')).length === 0
        )
        expect(stale, 'migrated — remove these from PENDING').toEqual([])
    })
})

/**
 * The CSS side of the same rule. `.btn-*` are buttons and take the shared
 * control radius; `.section-pill*` are status/label markers and keep `full`.
 * The two live in one file, so a careless find-and-replace across it would
 * take out the carve-out along with the fix.
 */
describe('the CSS button classes follow the same rule', () => {
    const CSS = readFileSync(
        resolve(process.cwd(), 'src/utilities/buttons.css'),
        'utf8'
    )

    it.each(['.btn-primary', '.btn-outline', '.btn-outline-light'])(
        '%s uses the shared control radius',
        (sel) => {
            const block = CSS.slice(CSS.indexOf(`${sel} {`))
            expect(block.slice(0, block.indexOf('}'))).toContain(
                'var(--radius-autara-md)'
            )
        }
    )

    it.each(['.section-pill', '.section-pill-light'])(
        '%s keeps full — a status marker, not an action',
        (sel) => {
            const block = CSS.slice(CSS.indexOf(`${sel} {`))
            expect(block.slice(0, block.indexOf('}'))).toContain(
                'var(--radius-autara-full)'
            )
        }
    )
})
