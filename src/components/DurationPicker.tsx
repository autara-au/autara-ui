'use client'

import * as React from 'react'

import { cn } from '../lib/cn'
import { useLabelFor } from '../lib/use-label-for'
import { Button } from './Button'
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './Dialog'

/**
 * The platform ceiling, mirroring `MAX_DURATION_MINUTES` in
 * merchant-mobile's `src/lib/form-rules.ts`. 1440 minutes is 24 hours, and
 * `serviceDurationError` there refuses anything above it with "Duration
 * can't be more than 1440 minutes (24 hours)."
 *
 * That ceiling is why the sheet offers no hour above 24 and no days: a
 * longer duration is not something a merchant can save in hours. A job that
 * keeps the car for days is set in WORKING DAYS instead (AUTM-1575), which is
 * the `workingDays` mode below, not a longer sheet.
 */
export const DEFAULT_MAX_DURATION_MINUTES = 1440

/**
 * AUTM-1575: the working-days bounds, mirroring `MULTI_DAY_MIN_WORKING_DAYS`
 * and `MULTI_DAY_MAX_WORKING_DAYS` in `@autara-au/autara-contracts`, which is
 * what merchant-api refuses outside of. Don, 1 and 3 Oct 2026: a job of fewer
 * than 2 working days is set in hours, and no job takes more than 10.
 */
export const DEFAULT_MIN_WORKING_DAYS = 2
export const DEFAULT_MAX_WORKING_DAYS = 10

/** The minute column's step. The approved Services board draws 15. */
const DEFAULT_MINUTE_STEP = 15

/**
 * The common lengths, one tap each. Taken from what detailers actually sell
 * (a wash, an interior, a polish, a half day) and from the presets Pangea and
 * Structured put above their pickers (Mobbin, AUTM-1507).
 */
const DEFAULT_PRESETS = [30, 45, 60, 90, 120, 180, 240] as const

const MINUTES_PER_DAY = 1440

/**
 * Minutes as a merchant says them: 45 is "45 min", 90 is "1 hr 30 min",
 * 120 is "2 hr". The zero part is dropped, because "2 hr 0 min" is the
 * reading of a machine and not of a person.
 *
 * Whole days past the first read as days: 4320 is "3 days", not "72 hr".
 * Nothing above 24 hours can be saved today, but values stored before the
 * cap existed can still arrive, and a merchant should recognise their own
 * three-day coating in what the form shows them. 1440 itself stays "24 hr",
 * because that is the top of the picker it was chosen from.
 */
export function durationLabel(minutes: number): string {
    if (minutes > MINUTES_PER_DAY && minutes % MINUTES_PER_DAY === 0) {
        const days = minutes / MINUTES_PER_DAY
        return `${days} day${days === 1 ? '' : 's'}`
    }
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60
    if (hours === 0) return `${rest} min`
    if (rest === 0) return `${hours} hr`
    return `${hours} hr ${rest} min`
}

/**
 * The same value as a screen reader should say it: "2 hours 30 minutes".
 * "hr" and "min" are read letter by letter, or as "her", by some engines.
 */
export function durationSpoken(minutes: number): string {
    const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`
    if (minutes > MINUTES_PER_DAY && minutes % MINUTES_PER_DAY === 0) {
        return plural(minutes / MINUTES_PER_DAY, 'day')
    }
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60
    if (hours === 0) return plural(rest, 'minute')
    if (rest === 0) return plural(hours, 'hour')
    return `${plural(hours, 'hour')} ${plural(rest, 'minute')}`
}

const UNIT_MINUTES: Record<string, number> = {
    d: MINUTES_PER_DAY,
    day: MINUTES_PER_DAY,
    days: MINUTES_PER_DAY,
    h: 60,
    hr: 60,
    hrs: 60,
    hour: 60,
    hours: 60,
    m: 1,
    min: 1,
    mins: 1,
    minute: 1,
    minutes: 1,
}

/**
 * Text read as a whole number of minutes, or null when it is not one.
 *
 * Takes what a merchant would type: bare minutes (`90`), hours and minutes in
 * words or short units (`1 hr 30 min`, `1h30`, `1.5 hours`, `2 hrs`), a clock
 * reading (`1:30`), and days (`3 days`). A bare number after an hour amount is
 * minutes, as people say it (`1 hr 30`).
 *
 * Strict where it matters: a bare decimal (`12.5`), a negative, an exponent
 * or anything with a fraction of a minute is NOT a duration, so it comes back
 * null and the text reaches the consumer exactly as typed for its own
 * validator to refuse in its own words. A value above any cap still parses,
 * on purpose: reading 4320 back as "3 days" is how a merchant sees a stray
 * digit.
 */
export function parseDuration(text: string): number | null {
    const trimmed = text.trim().toLowerCase()
    if (trimmed.length === 0) return null
    if (/^\d+$/.test(trimmed)) {
        const minutes = Number(trimmed)
        return Number.isSafeInteger(minutes) ? minutes : null
    }
    const clock = /^(\d{1,2}):([0-5]\d)$/.exec(trimmed)
    if (clock) return Number(clock[1]) * 60 + Number(clock[2])

    const normalised = trimmed.replace(/,|\band\b/g, ' ').replace(/\s+/g, ' ').trim()
    const token = /(\d+(?:\.\d+)?)\s*([a-z]+)?\s*/y
    let total = 0
    let index = 0
    let sawHours = false
    const seen = new Set<number>()
    while (index < normalised.length) {
        token.lastIndex = index
        const match = token.exec(normalised)
        if (!match || match[0].length === 0) return null
        index = token.lastIndex
        const amount = Number(match[1])
        const unit = match[2]
        let per: number
        if (unit === undefined) {
            // A trailing bare number is minutes only after an hour amount
            // ("1 hr 30"); on its own a decimal was already refused above.
            if (!sawHours || index < normalised.length) return null
            per = 1
        } else {
            const resolved = UNIT_MINUTES[unit]
            if (resolved === undefined) return null
            per = resolved
        }
        if (seen.has(per)) return null
        seen.add(per)
        if (per === 60) sawHours = true
        total += amount * per
    }
    // "1.5 hours" is 90; "1.5 min" is not a whole minute and is refused.
    const rounded = Math.round(total)
    if (Math.abs(total - rounded) > 1e-9) return null
    return Number.isSafeInteger(rounded) ? rounded : null
}

/** A chevron, drawn inline (autara-ui carries no icon dependency), in `em`. */
function Chevron() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-[1.125em] shrink-0 text-[var(--text-muted)]"
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    )
}

/** A minus or a plus, drawn inline like the chevron, in `em`. */
function StepGlyph({ plus }: { plus: boolean }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
            className="size-[1.25em] shrink-0"
        >
            <path d="M5 12h14" />
            {plus ? <path d="M12 5v14" /> : null}
        </svg>
    )
}

/**
 * AUTM-1575: the duration in working days, for a job that keeps the car.
 *
 * Present only when the consumer offers it: a merchant who only travels to
 * the customer never sees the switch (Don, 1 Oct 2026), so the consumer
 * simply does not pass this.
 */
export interface DurationWorkingDays {
    /** Working days, or null while the duration is set in hours. */
    value: number | null
    /**
     * A whole number of days switches to (or stays in) working days; null
     * switches back to hours. The minutes `value` is left as it was, so
     * switching back and forth loses nothing.
     */
    onChange: (next: number | null) => void
    /** @default 2 */
    min?: number
    /** @default 10 */
    max?: number
}

export interface DurationPickerProps
    extends Omit<
        React.ComponentPropsWithoutRef<'button'>,
        'value' | 'onChange' | 'type' | 'id' | 'disabled' | 'className' | 'aria-invalid' | 'children'
    > {
    /** Minutes, as text. `''` when empty. A stored value it cannot read is shown as it is. */
    value: string
    /** Called with whole minutes as text when a length is chosen. */
    onChange: (value: string) => void
    /**
     * The longest duration the sheet allows, presets and typing included.
     * @default 1440 (24 hours)
     */
    maxMinutes?: number
    /** The minute column's step. Typing reaches the minutes in between. @default 15 */
    minuteStep?: number
    /** The one-tap lengths above the columns, in minutes. Lengths over the cap are dropped. */
    presets?: readonly number[]
    /** What the field says when there is no length yet. @default 'Choose a length' */
    placeholder?: string
    disabled?: boolean
    /** Paints the error edge and sets `aria-invalid`. Always the consumer's call. */
    invalid?: boolean
    /** Names the field when no `<label htmlFor>` points at `id`. @default 'Duration' */
    label?: string
    /** Goes on the field's BUTTON, so a caller's `<label htmlFor>` names it and a click on the label focuses it. */
    id?: string
    /** Submitted with a native form as minutes, through a hidden input. */
    name?: string
    /**
     * Lands on the field's button. The sheet's parts take `{testId}-sheet`,
     * `-reading`, `-hours`, `-minutes`, `-manual-open`, `-manual` (the text
     * field) and `-done`. With `workingDays`: `-unit` (the switch),
     * `-unit-hours`, `-unit-days`, `-days` (the stepper), `-days-reading`,
     * `-days-fewer` and `-days-more`.
     */
    testId?: string
    /**
     * AUTM-1575: offers "Hours | Working days" above the field, and a
     * working-days stepper in place of the field while it is chosen. Leave it
     * out and the control is exactly the hours field it always was.
     */
    workingDays?: DurationWorkingDays
    /** On the field's button, as before. */
    className?: string
}

/**
 * DurationPicker — how long a job takes.
 *
 * ── The field is a button ─────────────────────────────────────────────────
 *
 * Don, 2026-10-02, on the version with a typable field and a clock beside
 * it: the same value read twice ("2hrs 23min" typed, "2 hr 23 min" echoed).
 * So the field is one button that says the length in words, "2 hr 30 min",
 * or "Choose a length", and opens the sheet on a tap, Enter or Space. There
 * is no typing in the field and nothing beside it.
 *
 * It is still a labelled form control: a caller's `<label htmlFor={id}>`
 * names it and focuses it, its accessible name carries the value
 * ("Duration, 2 hr 30 min"), `invalid` sets `aria-invalid`, and a caller's
 * `aria-describedby` (the form's error) lands on it. With `name`, a hidden
 * input submits the minutes with a native form.
 *
 * ── The sheet ─────────────────────────────────────────────────────────────
 *
 * Tap-ready: the result in words at the top (announced, spoken in full),
 * the common lengths one tap each (they commit), then hours and minutes side
 * by side, both visible, as two labelled radio groups with arrow keys.
 * Done commits a column choice; Cancel, the scrim and Escape keep the value.
 *
 * "Type a length" swaps the columns for one text field that reads minutes or
 * words (90, 1h 30, 1.5 hours, 1:30), shows its reading live, and commits
 * with Done. That is where the minutes between the steps come from (2 hr 23
 * min). A length that is not a whole number of minutes, zero, or past the
 * cap is refused there, in words, with Done held, so the sheet never hands
 * the form a value it cannot save.
 *
 * Rejected on purpose: drilling from an hour into its minutes (the first
 * version: the minutes were hidden and it read as "hours only"), and wheels
 * (timespent, Wanderlog on Mobbin: a drag with no keyboard model and no 200%
 * text story).
 *
 * A stored value that is not on the steps (50 min, or 4320 from before the
 * cap) reads correctly on the field ("50 min", "3 days"), opens with nothing
 * chosen and a line saying so, and is kept unless the merchant picks again.
 *
 * ── Working days (AUTM-1575) ──────────────────────────────────────────────
 *
 * A ceramic coating or a paint correction keeps the car for two or three
 * days, and no number of hours says that. With `workingDays`, an "Hours |
 * Working days" switch sits ABOVE the field, as the approved v39 frame draws
 * it (not in the sheet's header, where this note used to plan it: a switch
 * inside the sheet would hide which unit the service is in until the sheet
 * was opened). Working days swaps the field for a stepper, "− 3 working days
 * +", bounded at 2 and 10. Pick-up is worked out by the server from the
 * merchant's hours, so the stepper counts days and nothing else.
 *
 * The two values stay separate on purpose: `value` is still minutes and
 * `workingDays.value` is days, so switching back to hours finds the minutes
 * where they were, and a consumer never has to encode days as minutes.
 *
 * Prior art (Mobbin, AUTM-1575): Tripadvisor's "Dates | Trip length" switch
 * over a count stepper is the steal: the same quantity said two ways, chosen
 * by a switch, with the count as a stepper rather than a typed number.
 */
export function DurationPicker({
    value,
    onChange,
    maxMinutes = DEFAULT_MAX_DURATION_MINUTES,
    minuteStep = DEFAULT_MINUTE_STEP,
    presets = DEFAULT_PRESETS,
    placeholder = 'Choose a length',
    disabled = false,
    invalid = false,
    label = 'Duration',
    id,
    name,
    testId,
    workingDays,
    className,
    'aria-describedby': describedBy,
    ...rest
}: DurationPickerProps) {
    const [open, setOpen] = React.useState(false)
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const stepperRef = React.useRef<HTMLDivElement>(null)
    const daysMode = workingDays !== undefined && workingDays.value !== null
    // A label click focuses the field, or in working days the stepper's first
    // live button, which is what a label click does for every other field.
    const labelledBy = useLabelFor(id, () =>
        daysMode
            ? stepperRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')
            : buttonRef.current,
    )
    const ownId = React.useId()
    const buttonId = id ?? `${ownId}-duration`

    const minutes = parseDuration(value)
    const reading = minutes === null ? (value.trim() === '' ? null : value) : durationLabel(minutes)
    const spoken = minutes === null ? reading : durationSpoken(minutes)

    // The last count chosen, so Hours then Working days again returns to it
    // rather than to the minimum.
    const lastDays = React.useRef<number | null>(null)
    if (workingDays?.value != null) lastDays.current = workingDays.value

    const hoursField = (
        <>
            <button
                {...rest}
                aria-describedby={describedBy}
                ref={buttonRef}
                id={buttonId}
                type="button"
                onClick={() => setOpen(true)}
                disabled={disabled}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-invalid={invalid || undefined}
                // Named by the caller's label AND its own text, so the value a
                // merchant sees is in the name (WCAG 2.5.3): "Duration, 2 hr
                // 30 min". With no label, its own `label` does the same.
                aria-labelledby={labelledBy ? `${labelledBy} ${buttonId}` : undefined}
                aria-label={labelledBy ? undefined : `${label}, ${spoken ?? placeholder}`}
                data-testid={testId}
                data-value={minutes ?? undefined}
                className={cn(
                    // AUTM-1594: the sheet's field, 52px, the field edge on
                    // paper. `min-h` so it grows at 200% text.
                    'flex min-h-13 w-full items-center justify-between gap-2 rounded-autara-md border bg-[var(--paper)] px-4 py-2 text-left',
                    'text-[1.0625rem] tabular-nums transition-colors',
                    'duration-[var(--motion-panel-in)] ease-[var(--motion-ease-out)]',
                    'focus-visible:outline-none focus-visible:border-[var(--accent)] focus-visible:shadow-[inset_0_0_0_1px_var(--accent)]',
                    'aria-expanded:border-[var(--accent)] aria-expanded:shadow-[inset_0_0_0_1px_var(--accent)]',
                    invalid
                        ? 'border-[var(--danger)] shadow-[inset_0_0_0_1px_var(--danger)]'
                        : ['border-[var(--field-edge)]', !disabled && 'hover:border-[var(--text-muted)]'],
                    'disabled:cursor-not-allowed disabled:border-[var(--hairline)] disabled:opacity-60',
                    className,
                )}
            >
                <span className={cn('min-w-0 flex-1', reading ? 'text-[var(--text-strong)]' : 'text-[var(--text-subtle)]')}>
                    {reading ?? placeholder}
                </span>
                <Chevron />
            </button>
            {name ? <input type="hidden" name={name} value={minutes ?? ''} /> : null}
            <DurationSheet
                open={open}
                onOpenChange={setOpen}
                current={minutes}
                maxMinutes={maxMinutes}
                minuteStep={minuteStep}
                presets={presets}
                testId={testId}
                onCommit={(next) => {
                    onChange(String(next))
                    setOpen(false)
                }}
            />
        </>
    )

    if (!workingDays) return hoursField

    const min = workingDays.min ?? DEFAULT_MIN_WORKING_DAYS
    const max = Math.max(min, workingDays.max ?? DEFAULT_MAX_WORKING_DAYS)
    return (
        <div className="space-y-3">
            <UnitSwitch
                label={label}
                daysMode={daysMode}
                disabled={disabled}
                testId={testId}
                onPick={(days) => {
                    if (days === daysMode) return
                    workingDays.onChange(days ? Math.min(max, Math.max(min, lastDays.current ?? min)) : null)
                }}
            />
            {daysMode ? (
                <DaysStepper
                    ref={stepperRef}
                    id={buttonId}
                    labelledBy={labelledBy}
                    label={label}
                    describedBy={describedBy}
                    days={workingDays.value as number}
                    min={min}
                    max={max}
                    disabled={disabled}
                    testId={testId}
                    onChange={workingDays.onChange}
                />
            ) : (
                hoursField
            )}
        </div>
    )
}

/**
 * "Hours | Working days": a radio group with one tab stop, arrows move AND
 * select (the ARIA radio pattern), drawn as the library's segmented control
 * (Tabs): a band track, the Selected fill on the chosen unit.
 *
 * Radios, not Tabs: this is a value the form saves, not a choice of panel.
 */
function UnitSwitch({
    label,
    daysMode,
    disabled,
    testId,
    onPick,
}: {
    label: string
    daysMode: boolean
    disabled: boolean
    testId?: string
    onPick: (days: boolean) => void
}) {
    const groupRef = React.useRef<HTMLDivElement>(null)
    const options = [
        { days: false, text: 'Hours', suffix: 'hours' },
        { days: true, text: 'Working days', suffix: 'days' },
    ] as const
    return (
        <div
            ref={groupRef}
            role="radiogroup"
            aria-label={`${label} unit`}
            aria-disabled={disabled || undefined}
            data-testid={testId ? `${testId}-unit` : undefined}
            onKeyDown={(event) => {
                if (disabled) return
                let next: boolean | null = null
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = true
                else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = false
                else if (event.key === 'Home') next = false
                else if (event.key === 'End') next = true
                if (next === null) return
                event.preventDefault()
                onPick(next)
                groupRef.current?.querySelector<HTMLElement>(`[data-unit="${next ? 'days' : 'hours'}"]`)?.focus()
            }}
            // `min-h`, never `h`: at 200% text the labels grow and the track
            // grows with them (AUTM-915). 20rem is the frame's width.
            className="grid min-h-12 w-full max-w-[20rem] grid-cols-2 gap-1 rounded-full bg-[var(--band)] p-1"
        >
            {options.map((option) => {
                const checked = option.days === daysMode
                return (
                    <button
                        key={option.suffix}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        tabIndex={checked ? 0 : -1}
                        disabled={disabled}
                        data-unit={option.suffix}
                        data-testid={testId ? `${testId}-unit-${option.suffix}` : undefined}
                        onClick={() => onPick(option.days)}
                        className={cn(
                            'inline-flex min-h-10 items-center justify-center rounded-full px-3 py-1.5 text-center text-[0.9375rem] leading-tight',
                            'transition-colors duration-[var(--motion-panel-in)] ease-[var(--motion-ease-out)]',
                            // Full-strength accent, offset in the track's own
                            // colour, as Tabs does: the band between ring and
                            // fill is what keeps a purple ring off a purple fill.
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--band)]',
                            'disabled:cursor-not-allowed disabled:opacity-60',
                            checked
                                ? 'bg-[var(--selected)] font-bold text-[var(--on-selected)]'
                                : 'font-medium text-[var(--text-muted)] not-disabled:hover:text-[var(--text-strong)]',
                        )}
                    >
                        {option.text}
                    </button>
                )
            })}
        </div>
    )
}

interface DaysStepperProps {
    id: string
    labelledBy: string | undefined
    label: string
    describedBy: string | undefined
    days: number
    min: number
    max: number
    disabled: boolean
    testId?: string
    onChange: (next: number) => void
}

/**
 * "− 3 working days +". The count is a display figure (Satoshi Black, as
 * autara-ui 7.x sets figures), announced politely as it changes. The minus
 * and plus are the library's icon disc (`Button size="icon"`, quiet), so the
 * stepper spends no new round shape. A stored
 * count outside the bounds still reads as it is, and the first press brings
 * it back inside them rather than one step further out.
 */
const DaysStepper = React.forwardRef<HTMLDivElement, DaysStepperProps>(function DaysStepper(
    { id, labelledBy, label, describedBy, days, min, max, disabled, testId, onChange },
    ref,
) {
    const readingId = `${id}-days-reading`
    const fewer = Math.min(days - 1, max)
    const more = Math.max(days + 1, min)
    return (
        <div
            ref={ref}
            id={id}
            role="group"
            aria-labelledby={labelledBy ? `${labelledBy} ${readingId}` : readingId}
            aria-label={labelledBy ? undefined : `${label}, ${days} working ${days === 1 ? 'day' : 'days'}`}
            aria-describedby={describedBy}
            data-testid={testId ? `${testId}-days` : undefined}
            data-value={days}
            className="flex flex-wrap items-center gap-x-5 gap-y-2"
        >
            <Button
                variant="quiet"
                size="icon"
                aria-label="Fewer working days"
                disabled={disabled || days <= min}
                onClick={() => onChange(fewer)}
                data-testid={testId ? `${testId}-days-fewer` : undefined}
            >
                <StepGlyph plus={false} />
            </Button>
            {/* The live region is the <output>; the NAME comes from the span
                inside it. Chrome leaves an <output> (role status) out of an
                aria-labelledby name, so pointing at it named the group
                "Duration" alone (measured in Chromium, AUTM-1575; jsdom
                includes it, which is why the unit test could not see it). */}
            <output
                aria-live="polite"
                data-testid={testId ? `${testId}-days-reading` : undefined}
                className="flex min-w-[8.5rem] justify-center text-[var(--text-strong)]"
            >
                <span id={readingId} className="flex items-baseline gap-1.5">
                    <span className="text-[1.75rem] leading-none font-black tabular-nums">{days}</span>
                    <span className="text-[1rem] font-medium">working {days === 1 ? 'day' : 'days'}</span>
                </span>
            </output>
            <Button
                variant="quiet"
                size="icon"
                aria-label="More working days"
                disabled={disabled || days >= max}
                onClick={() => onChange(more)}
                data-testid={testId ? `${testId}-days-more` : undefined}
            >
                <StepGlyph plus />
            </Button>
        </div>
    )
})

interface DurationSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    current: number | null
    maxMinutes: number
    minuteStep: number
    presets: readonly number[]
    testId?: string
    onCommit: (minutes: number) => void
}

/** Is `minutes` a value the two columns can express exactly? */
function onTheSteps(minutes: number | null, maxMinutes: number, step: number): minutes is number {
    return minutes !== null && minutes > 0 && minutes <= maxMinutes && minutes % step === 0
}

/** Why typed text cannot be committed, in words, or null when it can. */
function typedProblem(text: string, parsed: number | null, maxMinutes: number): string | null {
    if (text.trim() === '') return 'Type a length, like 90 or 1 hr 30.'
    if (parsed === null) return 'Use whole minutes (90) or hours and minutes (1 hr 30).'
    if (parsed <= 0) return 'A length has to be at least 1 min.'
    if (parsed > maxMinutes) return `That is ${durationLabel(parsed)}. The most is ${durationLabel(maxMinutes)}.`
    return null
}

function DurationSheet({
    open,
    onOpenChange,
    current,
    maxMinutes,
    minuteStep,
    presets,
    testId,
    onCommit,
}: DurationSheetProps) {
    const maxHours = Math.floor(maxMinutes / 60)
    const hourOptions = React.useMemo(
        () => Array.from({ length: maxHours + 1 }, (_, hour) => hour),
        [maxHours],
    )
    const minuteOptions = React.useMemo(
        () => Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep),
        [minuteStep],
    )
    const fits = onTheSteps(current, maxMinutes, minuteStep)

    // The draft, reset every time the sheet opens. null = not chosen yet.
    const [hours, setHours] = React.useState<number | null>(null)
    const [mins, setMins] = React.useState<number | null>(null)
    const [typing, setTyping] = React.useState(false)
    const [typed, setTyped] = React.useState('')
    const [wasOpen, setWasOpen] = React.useState(false)
    if (open !== wasOpen) {
        setWasOpen(open)
        if (open) {
            setHours(fits ? Math.floor(current / 60) : null)
            setMins(fits ? current % 60 : null)
            setTyping(false)
            setTyped(current !== null && current > 0 ? durationLabel(current) : '')
        }
    }

    const typedMinutes = parseDuration(typed)
    const problem = typing ? typedProblem(typed, typedMinutes, maxMinutes) : null

    const chosen = hours !== null || mins !== null
    const draft = typing ? typedMinutes : chosen ? (hours ?? 0) * 60 + (mins ?? 0) : null
    const shownTotal = draft ?? current
    const tooShort = !typing && draft !== null && draft <= 0
    const canDone = typing ? problem === null : draft !== null && draft > 0 && draft <= maxMinutes

    const ids = React.useId()
    const hoursLabelId = `${ids}-hours`
    const minutesLabelId = `${ids}-minutes`
    const typedId = `${ids}-typed`
    const typedHintId = `${ids}-typed-hint`
    const typedRef = React.useRef<HTMLInputElement>(null)

    function pickHour(hour: number) {
        setHours(hour)
        // The top hour has no minutes past it: 24 hr 15 min is over the cap.
        if (hour * 60 + (mins ?? 0) > maxMinutes) setMins(0)
        else if (mins === null) setMins(0)
    }
    function pickMinute(minute: number) {
        setMins(minute)
        if (hours === null) setHours(0)
    }
    function commit() {
        if (canDone && draft !== null) onCommit(draft)
    }

    const offeredPresets = presets.filter((p) => p > 0 && p <= maxMinutes)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                layout="responsive"
                data-testid={testId ? `${testId}-sheet` : undefined}
                // Focus the sheet itself, not its first control. Radix's
                // default lands on the first preset, and Safari draws that as
                // focus-visible on a tap, so "30 min" opened looking chosen
                // (seen on the iPad simulator). Tab still starts at the
                // presets, and Escape still closes.
                onOpenAutoFocus={(event) => {
                    event.preventDefault()
                    ;(event.currentTarget as HTMLElement | null)?.focus()
                }}
                // The sheet is a container, not a control: no focus ring on
                // it. Inline, because a consumer's unlayered
                // `*:focus-visible` outline (merchant-mobile has one) beats
                // any utility class, and the ring around the whole sheet read
                // as a selection.
                style={{ outline: 'none' }}
            >
                <DialogHeader>
                    <DialogTitle>Duration</DialogTitle>
                    <DialogDescription>
                        {typing
                            ? 'Type minutes, or hours and minutes.'
                            : 'Pick the hours and the minutes, or tap a common length.'}
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-5">
                    {/* The result in words, announced as it changes. The
                        spoken form says "hours", which "hr" is not. */}
                    <div className="rounded-2xl bg-[var(--band)] px-4 py-3.5">
                        <p
                            aria-live="polite"
                            data-testid={testId ? `${testId}-reading` : undefined}
                            className="text-[2rem] leading-tight font-black tabular-nums text-[var(--text-strong)]"
                        >
                            {shownTotal !== null && shownTotal > 0 ? (
                                <>
                                    <span aria-hidden="true">{durationLabel(shownTotal)}</span>
                                    <span className="sr-only">{durationSpoken(shownTotal)}</span>
                                </>
                            ) : (
                                <span className="text-[var(--text-muted)]">No length yet</span>
                            )}
                        </p>
                        {tooShort ? (
                            <p className="mt-1 text-[0.9375rem] text-[var(--danger)]">
                                Pick at least {durationLabel(minuteStep)}.
                            </p>
                        ) : !typing && current !== null && current > 0 && !fits && !chosen ? (
                            <p className="mt-1 text-[0.9375rem] leading-normal text-[var(--text-muted)]">
                                Not on the {minuteStep}-minute steps below. It stays as it is unless
                                you pick a new length.
                            </p>
                        ) : null}
                    </div>

                    {typing ? (
                        <div>
                            <label
                                htmlFor={typedId}
                                className="text-[0.9375rem] font-bold text-[var(--text-strong)]"
                            >
                                Type a length
                            </label>
                            <input
                                ref={typedRef}
                                id={typedId}
                                type="text"
                                autoComplete="off"
                                spellCheck={false}
                                value={typed}
                                onChange={(event) => setTyped(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault()
                                        commit()
                                    }
                                }}
                                placeholder="e.g. 2 hr 23 min, or 143"
                                aria-invalid={problem !== null && typed.trim() !== '' ? true : undefined}
                                aria-describedby={typedHintId}
                                data-testid={testId ? `${testId}-manual` : undefined}
                                className={cn(
                                    'mt-2 min-h-13 w-full rounded-autara-md border bg-[var(--paper)] px-4',
                                    'text-[1.0625rem] text-[var(--text-strong)] tabular-nums outline-none',
                                    'placeholder:text-[var(--text-subtle)]',
                                    problem !== null && typed.trim() !== ''
                                        ? 'border-[var(--danger)] shadow-[inset_0_0_0_1px_var(--danger)]'
                                        : 'border-[var(--field-edge)] focus:border-[var(--accent)] focus:shadow-[inset_0_0_0_1px_var(--accent)]',
                                )}
                            />
                            <p
                                id={typedHintId}
                                aria-live="polite"
                                className={cn(
                                    'mt-1.5 text-[0.9375rem] leading-normal',
                                    problem !== null && typed.trim() !== ''
                                        ? 'text-[var(--danger)]'
                                        : 'text-[var(--text-muted)]',
                                )}
                            >
                                {problem ?? `Up to ${durationLabel(maxMinutes)}.`}
                            </p>
                            <Button
                                variant="link"
                                size="sm"
                                className="mt-1 px-0"
                                onClick={() => setTyping(false)}
                            >
                                Pick from the list instead
                            </Button>
                        </div>
                    ) : (
                        <>
                            {offeredPresets.length > 0 ? (
                                <div role="group" aria-label="Common lengths" className="flex flex-wrap gap-2">
                                    {offeredPresets.map((preset) => {
                                        const pressed = shownTotal === preset
                                        return (
                                            <button
                                                key={preset}
                                                type="button"
                                                aria-pressed={pressed}
                                                onClick={() => onCommit(preset)}
                                                className={cn(
                                                    // A one-tap action, so the shared control
                                                    // radius (Button sm), not a status pill's.
                                                    'min-h-11 rounded-[1.375rem] px-4 text-[0.9375rem] font-medium',
                                                    'transition-[background-color,color,transform] duration-[var(--motion-panel-in)] ease-[var(--motion-ease-out)]',
                                                    'active:scale-[0.97] motion-reduce:active:scale-100',
                                                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
                                                    pressed
                                                        ? 'bg-[var(--selected)] text-[var(--on-selected)]'
                                                        : 'bg-[var(--band)] text-[var(--text-strong)] hover:bg-[var(--band-press)]',
                                                )}
                                            >
                                                {durationLabel(preset)}
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : null}

                            <div className="grid grid-cols-2 gap-3">
                                <Column
                                    labelId={hoursLabelId}
                                    heading="Hours"
                                    options={hourOptions}
                                    selected={hours}
                                    visible={(hour) => `${hour} hr`}
                                    spoken={(hour) => `${hour} ${hour === 1 ? 'hour' : 'hours'}`}
                                    disabledFor={() => false}
                                    onPick={pickHour}
                                    testId={testId ? `${testId}-hours` : undefined}
                                />
                                <Column
                                    labelId={minutesLabelId}
                                    heading="Minutes"
                                    options={minuteOptions}
                                    selected={mins}
                                    visible={(minute) => `${minute} min`}
                                    spoken={(minute) => `${minute} ${minute === 1 ? 'minute' : 'minutes'}`}
                                    disabledFor={(minute) => (hours ?? 0) * 60 + minute > maxMinutes}
                                    onPick={pickMinute}
                                    testId={testId ? `${testId}-minutes` : undefined}
                                />
                            </div>

                            <Button
                                variant="quiet"
                                size="sm"
                                data-testid={testId ? `${testId}-manual-open` : undefined}
                                onClick={() => {
                                    setTyping(true)
                                    requestAnimationFrame(() => typedRef.current?.focus())
                                }}
                            >
                                Type a length
                            </Button>
                        </>
                    )}
                </DialogBody>
                <DialogFooter>
                    <Button variant="quiet" size="md" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="md"
                        disabled={!canDone}
                        onClick={commit}
                        data-testid={testId ? `${testId}-done` : undefined}
                    >
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface ColumnProps {
    labelId: string
    heading: string
    options: number[]
    selected: number | null
    visible: (n: number) => string
    spoken: (n: number) => string
    disabledFor: (n: number) => boolean
    onPick: (n: number) => void
    testId?: string
}

/**
 * One column of the sheet: a radio group with a single tab stop. Up and Down
 * move AND select (the ARIA radio pattern), Home and End jump, and the chosen
 * row scrolls into view when the sheet opens, so "2 hr" is on screen for a
 * service that takes two hours.
 */
function Column({
    labelId,
    heading,
    options,
    selected,
    visible,
    spoken,
    disabledFor,
    onPick,
    testId,
}: ColumnProps) {
    const listRef = React.useRef<HTMLDivElement>(null)
    const enabled = options.filter((n) => !disabledFor(n))
    const tabStop = selected !== null && enabled.includes(selected) ? selected : enabled[0]

    React.useEffect(() => {
        const list = listRef.current
        if (!list || selected === null) return
        const row = list.querySelector<HTMLElement>(`[data-value="${selected}"]`)
        // Feature-detected: jsdom and older WebViews have none, and an effect
        // that throws takes the render down with it.
        if (row && typeof row.scrollIntoView === 'function') row.scrollIntoView({ block: 'nearest' })
        // On open only: following the selection as it changes would scroll
        // the column away from the finger that just tapped it.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function move(from: number, delta: number | 'first' | 'last') {
        if (enabled.length === 0) return
        const at = enabled.indexOf(from)
        const next =
            delta === 'first'
                ? enabled[0]
                : delta === 'last'
                  ? enabled[enabled.length - 1]
                  : enabled[Math.min(enabled.length - 1, Math.max(0, (at === -1 ? 0 : at) + delta))]
        onPick(next)
        listRef.current?.querySelector<HTMLElement>(`[data-value="${next}"]`)?.focus()
    }

    return (
        <div className="min-w-0">
            <p id={labelId} className="mb-2 text-[0.9375rem] font-bold text-[var(--text-strong)]">
                {heading}
            </p>
            <div
                ref={listRef}
                role="radiogroup"
                aria-labelledby={labelId}
                data-testid={testId}
                className="max-h-[17rem] space-y-1 overflow-y-auto overscroll-contain rounded-2xl bg-[var(--band)] p-1.5"
                onKeyDown={(event) => {
                    const from = selected ?? tabStop
                    if (from === undefined) return
                    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') move(from, 1)
                    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') move(from, -1)
                    else if (event.key === 'Home') move(from, 'first')
                    else if (event.key === 'End') move(from, 'last')
                    else return
                    event.preventDefault()
                }}
            >
                {options.map((n) => {
                    const checked = selected === n
                    const off = disabledFor(n)
                    return (
                        <button
                            key={n}
                            type="button"
                            role="radio"
                            aria-checked={checked}
                            aria-label={spoken(n)}
                            disabled={off}
                            tabIndex={n === tabStop ? 0 : -1}
                            data-value={n}
                            onClick={() => onPick(n)}
                            className={cn(
                                'flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-left',
                                'text-[1.0625rem] tabular-nums',
                                'transition-[background-color,color,transform] duration-[var(--motion-panel-in)] ease-[var(--motion-ease-out)]',
                                'active:scale-[0.985] motion-reduce:active:scale-100',
                                'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)]',
                                'disabled:cursor-not-allowed disabled:opacity-45',
                                checked
                                    ? 'bg-[var(--selected)] font-bold text-[var(--on-selected)]'
                                    : 'text-[var(--text-strong)] not-disabled:hover:bg-[var(--band-press)]',
                            )}
                        >
                            <span aria-hidden="true">{visible(n)}</span>
                            {checked ? (
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                    className="size-[1.1em] shrink-0"
                                >
                                    <path
                                        d="m5 12.5 4.5 4.5L19 7.5"
                                        stroke="currentColor"
                                        strokeWidth="2.4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            ) : null}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
