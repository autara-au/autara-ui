'use client'

import * as React from 'react'
import { cn } from '../lib/cn'
import { IconButton } from './IconButton'
import {
    AU_VEHICLE_CATALOG,
    VEHICLE_BODIES,
    VEHICLE_PAINTS,
    findVehicleMake,
    findVehicleModel,
    otherVehicleMakes,
    popularVehicleMakes,
    searchVehicleCatalog,
    vehicleBodyLabel,
    vehiclePaint,
    vehicleSlug,
    type VehicleBody,
    type VehicleCatalog,
    type VehicleSearchResult,
} from '../lib/vehicle-catalog'
import { FormField } from './FormField'
import { Input } from './Input'
import { SearchInput } from './SearchInput'
import { SwatchRadioGroup } from './SwatchRadioGroup'
import { VehicleMakeMark } from './VehicleMakeMark'
import { VehiclePaintDot } from './VehicleCard'

/**
 * VehiclePicker: add a car in a few taps (AUTM-1870, Don 2026-10-14).
 *
 * Replaces customer-web's Add a vehicle form (ten type chips, a make select,
 * a typed or selected model, year, rego). Three steps, one soft move between
 * them:
 *
 *   1. Find. One search box that matches make OR model, so "Hilux" is one tap
 *      to Toyota HiLux. Empty, it shows the popular Australian makes as name
 *      tiles (names, never manufacturer logos), More makes, and Not listed.
 *   2. Model. That make's models as chips, best sellers first, and Not listed.
 *   3. Details. The car as its make's mark (logo or monogram) with a dot of
 *      the paint tapped, the type its model implies (a HiLux is a ute) with
 *      Change; the colour swatches large; then rego and year, both optional.
 *      Don, 2026-10-15: no car illustrations, Wise-simple, one obvious step.
 *
 * A listed car is search, result, colour: the consumer's button (Add car,
 * or checkout's Continue) is the third tap. A car the catalog does not know
 * stays possible at both steps: Not listed opens the details with the make
 * and model as text and the type chips open, because nothing can be inferred.
 *
 * Controlled. The value is plain strings (`year` as typed); the consumer maps
 * it to its API. The step is the picker's own unless `step` and
 * `onStepChange` are passed (a dialog that pins its button may want to know).
 * The picker draws no submit button: the consumer's primary action submits,
 * validating on press (AUTM-1719) with `validateVehiclePicker`, and passes
 * the messages back as `errors`; each one is drawn where it can be fixed and
 * announced (role="alert", the AUTM-1538 rule for every message).
 *
 * Every control carries a `data-field` (`vehicleMake`, `vehicleModel`,
 * `vehicleType`, `vehicleYear`) for a consumer's focus-first-invalid, and a
 * test id under `testIdPrefix`. The type radios are named by their visible
 * label, never the enum (AUTM-1539).
 */

export type VehiclePickerStep = 'make' | 'model' | 'details'

export interface VehiclePickerValue {
    make: string
    model: string
    /** The `VehicleType` enum value, or '' when not known yet. */
    body: VehicleBody | ''
    /** The paint's label ("White"), or ''. Optional. */
    color: string
    /** As typed. Optional. */
    year: string
    /** As typed, upper-cased. Optional. */
    registrationPlate: string
}

export const EMPTY_VEHICLE_PICKER_VALUE: VehiclePickerValue = {
    make: '',
    model: '',
    body: '',
    color: '',
    year: '',
    registrationPlate: '',
}

export type VehiclePickerField = 'make' | 'model' | 'body' | 'year'
export type VehiclePickerErrors = Partial<Record<VehiclePickerField, string>>

/** The messages, kept word for word where the old form had them (AUTM-1538). */
export const VEHICLE_PICKER_MESSAGES = {
    make: 'Enter the make.',
    model: 'Enter the model.',
    /* The old form's words exactly, ASCII apostrophe and all: QA's
       AUTM-TC-700 matches this text (AUTM-1538). */
    body: "Pick the type that's closest.",
    year: (max: number) => `Enter a year between 1950 and ${max}.`,
} as const

/**
 * What every consumer requires before it saves: a make, a model and a type,
 * and a believable year when one is given. Empty means valid.
 */
export function validateVehiclePicker(v: VehiclePickerValue, now: Date = new Date()): VehiclePickerErrors {
    const errors: VehiclePickerErrors = {}
    if (!v.make.trim()) errors.make = VEHICLE_PICKER_MESSAGES.make
    if (!v.model.trim()) errors.model = VEHICLE_PICKER_MESSAGES.model
    if (!v.body) errors.body = VEHICLE_PICKER_MESSAGES.body
    if (v.year.trim()) {
        const n = Number(v.year)
        const max = now.getFullYear() + 1
        if (!Number.isInteger(n) || n < 1950 || n > max) errors.year = VEHICLE_PICKER_MESSAGES.year(max)
    }
    return errors
}

/** Where a picker opens for a value: a named car opens on its details. */
export function vehiclePickerStepFor(v: VehiclePickerValue, catalog: VehicleCatalog = AU_VEHICLE_CATALOG): VehiclePickerStep {
    if (v.make.trim() && v.model.trim()) return 'details'
    if (v.make.trim()) return findVehicleMake(v.make, catalog) ? 'model' : 'details'
    return 'make'
}

export interface VehiclePickerProps {
    value: VehiclePickerValue
    onChange: (next: VehiclePickerValue) => void
    errors?: VehiclePickerErrors
    catalog?: VehicleCatalog
    /** Controlled step. Pass with `onStepChange`, or leave both out. */
    step?: VehiclePickerStep
    onStepChange?: (step: VehiclePickerStep) => void
    /** Heading level of each step's title. Default 3 (under a dialog's h2). */
    headingLevel?: 2 | 3 | 4
    /** Focus the search box when the picker first draws on the Find step. */
    autoFocusSearch?: boolean
    disabled?: boolean
    /** e.g. "account-vehicles-form": `${prefix}-search`, `${prefix}-type-UTE`. */
    testIdPrefix?: string
    className?: string
}

/* ── Glyphs (Solar Linear, inlined: autara-ui does not depend on the set) ── */

const stroke = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
}
const BackGlyph = () => (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden="true" focusable="false">
        <path {...stroke} d="M15 19l-7-7 7-7" />
    </svg>
)
const TickGlyph = () => (
    <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true" focusable="false">
        <path {...stroke} strokeWidth={2.4} d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
)
const ChevronGlyph = () => (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" focusable="false">
        <path {...stroke} d="m9 5 7 7-7 7" />
    </svg>
)

/* ── Shared classes ───────────────────────────────────────────────────── */

const FOCUS =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]'
/* A make tile: the make's mark over its name, an 80px control on the shared
   control radius, band with ink (the mark takes the ink too). */
const TILE = cn(
    'flex min-h-20 min-w-0 flex-col items-center justify-center gap-1.5 rounded-[var(--radius-autara-md)] px-3 py-2.5 text-center',
    'bg-[var(--band)] text-[0.9375rem] font-medium text-[var(--text-strong)] hover:bg-[var(--band-press)]',
    'motion-press disabled:cursor-not-allowed',
    FOCUS
)
/* A chip: a 44px pill, as FilterChipRow draws its chips (canvas v44). */
const CHIP = cn(
    'inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full px-4 py-2 text-left',
    'text-[0.9375rem] font-medium motion-press disabled:cursor-not-allowed',
    FOCUS
)
const CHIP_IDLE = 'bg-[var(--band)] text-[var(--text-strong)] hover:bg-[var(--band-press)]'
const CHIP_ON = 'bg-[var(--selected)] text-[var(--on-selected)]'
/* A link-grade text action with a 44px target. */
const LINK = cn(
    'inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-autara-sm)] px-1 text-[0.9375rem] font-medium',
    'text-[var(--accent)] underline-offset-4 hover:underline disabled:cursor-not-allowed',
    FOCUS
)
const ERROR = 'm-0 text-sm text-[var(--danger)]'

function Heading({
    level,
    id,
    children,
    headingRef,
}: {
    level: 2 | 3 | 4
    id: string
    children: React.ReactNode
    headingRef: React.Ref<HTMLHeadingElement>
}) {
    const Tag = `h${level}` as 'h2' | 'h3' | 'h4'
    /* Type classes on the span, never the heading: customer-web and the
       merchant app style headings with an unlayered rule that beats them. */
    return (
        <Tag id={id} ref={headingRef} tabIndex={-1} className="m-0 outline-none">
            <span className="block text-[1.0625rem] font-bold leading-snug text-[var(--text-strong)]">{children}</span>
        </Tag>
    )
}

export function VehiclePicker({
    value,
    onChange,
    errors = {},
    catalog = AU_VEHICLE_CATALOG,
    step: stepProp,
    onStepChange,
    headingLevel = 3,
    autoFocusSearch = false,
    disabled = false,
    testIdPrefix = 'vehicle-picker',
    className,
}: VehiclePickerProps) {
    const p = testIdPrefix
    const uid = React.useId()
    const [ownStep, setOwnStep] = React.useState<VehiclePickerStep>(() => vehiclePickerStepFor(value, catalog))
    const step = stepProp ?? ownStep
    /* The direction the step that arrives slides from; null on first draw, so
       nothing moves until the customer moves. */
    const [dir, setDir] = React.useState<'forward' | 'back' | null>(null)
    const [query, setQuery] = React.useState('')
    const [allMakes, setAllMakes] = React.useState(false)
    /* The customer chose Not listed: the make or the model is typed. */
    const [typedMake, setTypedMake] = React.useState(false)
    const [typedModel, setTypedModel] = React.useState(false)
    const [typeOpen, setTypeOpen] = React.useState(false)
    /* The type chip the customer just chose pops (`.motion-pop`), only at
       the moment of choice: never the one already chosen when the step arrives. */
    const [poppedBody, setPoppedBody] = React.useState<VehicleBody | null>(null)
    const headingRef = React.useRef<HTMLHeadingElement>(null)
    const firstMoreRef = React.useRef<HTMLButtonElement>(null)
    const moved = React.useRef(false)

    function go(next: VehiclePickerStep, direction: 'forward' | 'back') {
        moved.current = true
        setDir(direction)
        if (stepProp === undefined) setOwnStep(next)
        onStepChange?.(next)
    }

    /* A new step takes focus at its title, so a screen reader says where the
       customer is and Tab continues from there. Never on the first draw. */
    React.useEffect(() => {
        if (moved.current) headingRef.current?.focus({ preventScroll: false })
    }, [step])

    const catalogMake = findVehicleMake(value.make, catalog)
    const catalogModel = findVehicleModel(value.make, value.model, catalog)
    const makeIsTyped = typedMake || (!!value.make.trim() && !catalogMake)
    const modelIsTyped = makeIsTyped || typedModel || (!!value.model.trim() && !catalogModel)

    function set(patch: Partial<VehiclePickerValue>) {
        onChange({ ...value, ...patch })
    }

    function chooseMake(make: string) {
        setTypedMake(false)
        setTypedModel(false)
        const same = catalogMake?.name === make
        set({ make, ...(same ? {} : { model: '', body: '' }) })
        go('model', 'forward')
    }

    function chooseModel(make: string, model: string, body: VehicleBody) {
        setTypedMake(false)
        setTypedModel(false)
        setTypeOpen(false)
        setPoppedBody(null)
        set({ make, model, body })
        go('details', 'forward')
    }

    function typeMake(prefill: string) {
        setTypedMake(true)
        setTypedModel(true)
        setTypeOpen(true)
        set({ make: prefill, model: '', body: '' })
        go('details', 'forward')
    }

    function typeModel() {
        setTypedModel(true)
        setTypeOpen(true)
        set({ model: '', body: '' })
        go('details', 'forward')
    }

    function backToFind() {
        setTypedMake(false)
        setTypedModel(false)
        setQuery('')
        go('make', 'back')
    }

    const results = React.useMemo(() => searchVehicleCatalog(query, catalog), [query, catalog])
    /* The listbox's active option (the one Enter takes): the best match
       until the arrows move it, and back to it whenever the query changes. */
    const [active, setActive] = React.useState(0)
    const activeIndex = results.length ? Math.min(active, results.length - 1) : -1
    const popular = popularVehicleMakes(catalog)
    const others = otherVehicleMakes(catalog)

    function resultId(r: VehicleSearchResult): string {
        return r.kind === 'model'
            ? `${p}-result-${vehicleSlug(r.make)}-${vehicleSlug(r.model)}`
            : `${p}-result-make-${vehicleSlug(r.make)}`
    }
    function chooseResult(r: VehicleSearchResult) {
        if (r.kind === 'model') chooseModel(r.make, r.model, r.body)
        else chooseMake(r.make)
    }

    const titleId = `${uid}-title`
    const searchId = `${uid}-search`
    const statusId = `${uid}-status`
    const listboxId = `${uid}-listbox`
    const optionId = (i: number) => `${uid}-option-${i}`
    const makeErrorId = `${uid}-make-error`
    const modelErrorId = `${uid}-model-error`
    const typeErrorId = `${uid}-type-error`

    let content: React.ReactNode
    if (step === 'make') {
        /* Nothing chosen yet: whichever field the consumer flagged, the fix
           here is the same, so the Find step says it once, in its own words. */
        const findError = errors.make ?? errors.model ?? errors.body
        content = (
            <div className="flex flex-col gap-4">
                <Heading level={headingLevel} id={titleId} headingRef={headingRef}>
                    Find your car
                </Heading>
                <div className="flex flex-col gap-2">
                    {/* One field that matches make or model as the customer types:
                        an ARIA 1.2 combobox over a listbox of matches. Focus stays
                        in the field; Up and Down move the active match, Enter takes
                        it (the best one until the arrows move), Escape clears. */}
                    <SearchInput
                        id={searchId}
                        type="search"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded={results.length > 0}
                        aria-controls={listboxId}
                        aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
                        value={query}
                        disabled={disabled}
                        autoFocus={autoFocusSearch}
                        autoComplete="off"
                        enterKeyHint="go"
                        aria-label="Search make or model"
                        aria-describedby={[statusId, findError ? makeErrorId : ''].filter(Boolean).join(' ')}
                        aria-invalid={findError ? true : undefined}
                        placeholder="Search make or model, like Hilux"
                        data-field="vehicleMake"
                        data-testid={`${p}-search`}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setActive(0)
                        }}
                        onKeyDown={(e) => {
                            if (!results.length) return
                            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                e.preventDefault()
                                const step = e.key === 'ArrowDown' ? 1 : -1
                                setActive((activeIndex + step + results.length) % results.length)
                            } else if (e.key === 'Enter' && activeIndex >= 0) {
                                e.preventDefault()
                                chooseResult(results[activeIndex]!)
                            } else if (e.key === 'Escape' && query) {
                                /* Clear the search first; a second Escape is the dialog's. */
                                e.preventDefault()
                                e.stopPropagation()
                                setQuery('')
                                setActive(0)
                            }
                        }}
                    />
                    {findError ? (
                        <p id={makeErrorId} role="alert" className={ERROR} data-testid={`${p}-make-error`}>
                            Search for your car, or pick its make.
                        </p>
                    ) : null}
                </div>
                <p id={statusId} aria-live="polite" className="sr-only">
                    {query.trim()
                        ? results.length
                            ? `${results.length} ${results.length === 1 ? 'match' : 'matches'}`
                            : 'No matches'
                        : ''}
                </p>
                {query.trim() ? (
                    <div className="flex flex-col gap-2">
                        {results.length ? (
                            <ul
                                id={listboxId}
                                role="listbox"
                                aria-label="Matches"
                                className="m-0 flex list-none flex-col gap-1 p-0"
                                data-testid={`${p}-results`}
                            >
                                {results.map((r, i) => {
                                    const on = i === activeIndex
                                    const name = r.kind === 'model' ? `${r.make} ${r.model}` : r.make
                                    return (
                                        <li
                                            key={resultId(r)}
                                            id={optionId(i)}
                                            role="option"
                                            aria-selected={on}
                                            aria-disabled={disabled || undefined}
                                            data-testid={resultId(r)}
                                            /* Keep focus in the field: the field owns the keys. */
                                            onMouseDown={(e) => e.preventDefault()}
                                            onMouseMove={() => (on ? undefined : setActive(i))}
                                            onClick={() => (disabled ? undefined : chooseResult(r))}
                                            className={cn(
                                                'flex min-h-14 w-full min-w-0 cursor-pointer items-center gap-3 rounded-[var(--radius-autara-md)] px-3 py-2 text-left motion-press-row',
                                                on ? 'bg-[var(--band)]' : 'hover:bg-[var(--band)]',
                                                disabled && 'cursor-not-allowed'
                                            )}
                                        >
                                            {/* The make's mark, then the name: "Toyota HiLux", with
                                                what it is under it (Don, 2026-10-14). */}
                                            <span
                                                className={cn(
                                                    'grid size-10 shrink-0 place-items-center rounded-[var(--radius-autara-sm)] text-[var(--text-strong)]',
                                                    /* The mark's plate stays apart from the active row's band. */
                                                    on ? 'bg-[var(--paper)]' : 'bg-[var(--band)]'
                                                )}
                                            >
                                                <VehicleMakeMark make={r.make} className="size-6" />
                                            </span>
                                            <span className="flex min-w-0 flex-1 flex-col">
                                                <span className="text-[0.9375rem] font-medium text-[var(--text-strong)] [overflow-wrap:anywhere]">
                                                    {name}
                                                </span>
                                                <span className="text-[0.8125rem] text-[var(--text-muted)]">
                                                    {r.kind === 'model' ? vehicleBodyLabel(r.body) : 'All models'}
                                                </span>
                                            </span>
                                            <span className="shrink-0 text-[var(--text-subtle)]" aria-hidden="true">
                                                <ChevronGlyph />
                                            </span>
                                        </li>
                                    )
                                })}
                            </ul>
                        ) : (
                            <p className="m-0 text-[0.9375rem] text-[var(--text-muted)]" data-testid={`${p}-no-results`}>
                                Nothing called &ldquo;{query.trim()}&rdquo; in our list.
                            </p>
                        )}
                        <div>
                            <button
                                type="button"
                                disabled={disabled}
                                className={LINK}
                                onClick={() => typeMake(query.trim())}
                                data-testid={`${p}-result-custom`}
                            >
                                Not listed? Type it in
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <p className="m-0 text-[0.8125rem] font-medium text-[var(--text-muted)]" id={`${uid}-popular`}>
                            Popular makes
                        </p>
                        <div
                            role="group"
                            aria-labelledby={`${uid}-popular`}
                            className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,7rem),1fr))] gap-2"
                        >
                            {popular.map((m) => (
                                <button
                                    key={m.name}
                                    type="button"
                                    disabled={disabled}
                                    className={TILE}
                                    onClick={() => chooseMake(m.name)}
                                    data-testid={`${p}-make-option-${vehicleSlug(m.name)}`}
                                >
                                    <VehicleMakeMark make={m.name} className="size-7" />
                                    <span className="[overflow-wrap:anywhere]">{m.name}</span>
                                </button>
                            ))}
                        </div>
                        {allMakes ? (
                            <div
                                role="group"
                                aria-label="More makes"
                                className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,7rem),1fr))] gap-2"
                            >
                                {others.map((m, i) => (
                                    <button
                                        key={m.name}
                                        ref={i === 0 ? firstMoreRef : undefined}
                                        type="button"
                                        disabled={disabled}
                                        className={TILE}
                                        onClick={() => chooseMake(m.name)}
                                        data-testid={`${p}-make-option-${vehicleSlug(m.name)}`}
                                    >
                                        <VehicleMakeMark make={m.name} className="size-7" />
                                        <span className="[overflow-wrap:anywhere]">{m.name}</span>
                                    </button>
                                ))}
                            </div>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-x-4">
                            {allMakes ? null : (
                                <button
                                    type="button"
                                    disabled={disabled}
                                    className={LINK}
                                    onClick={() => {
                                        setAllMakes(true)
                                        /* The button goes; focus goes to the first make it showed. */
                                        requestAnimationFrame(() => firstMoreRef.current?.focus())
                                    }}
                                    data-testid={`${p}-make-more`}
                                >
                                    More makes
                                </button>
                            )}
                            <button
                                type="button"
                                disabled={disabled}
                                className={LINK}
                                onClick={() => typeMake('')}
                                data-testid={`${p}-make-custom`}
                            >
                                Not listed? Type it in
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )
    } else if (step === 'model') {
        const make = catalogMake
        content = (
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    {/* AUTM-1756: the library's back disc, which shows on
                        band as well as paper (band on band vanished). */}
                    <IconButton
                        disabled={disabled}
                        onClick={backToFind}
                        label="Back to makes"
                        data-testid={`${p}-back`}
                        icon={<BackGlyph />}
                        className="shrink-0"
                    />
                    <VehicleMakeMark make={make?.name ?? value.make} className="size-7 text-[var(--text-strong)]" />
                    <Heading level={headingLevel} id={titleId} headingRef={headingRef}>
                        {make?.name ?? value.make}
                    </Heading>
                </div>
                <div
                    role="group"
                    aria-labelledby={titleId}
                    aria-describedby={errors.model ? modelErrorId : undefined}
                    className="flex flex-wrap gap-2"
                    data-testid={`${p}-models`}
                >
                    {(make?.models ?? []).map((m, i) => {
                        const on = catalogModel?.name === m.name
                        return (
                            <button
                                key={m.name}
                                type="button"
                                disabled={disabled}
                                aria-current={on ? 'true' : undefined}
                                data-field={i === 0 ? 'vehicleModel' : undefined}
                                className={cn(CHIP, on ? CHIP_ON : CHIP_IDLE)}
                                onClick={() => chooseModel(make!.name, m.name, m.body)}
                                data-testid={`${p}-model-option-${vehicleSlug(m.name)}`}
                            >
                                {on ? <TickGlyph /> : null}
                                <span className="[overflow-wrap:anywhere]">{m.name}</span>
                            </button>
                        )
                    })}
                    <button
                        type="button"
                        disabled={disabled}
                        className={cn(CHIP, CHIP_IDLE)}
                        onClick={typeModel}
                        data-testid={`${p}-model-custom`}
                    >
                        Not listed
                    </button>
                </div>
                {errors.model ? (
                    <p id={modelErrorId} role="alert" className={ERROR} data-testid={`${p}-model-error`}>
                        Pick the model, or choose Not listed.
                    </p>
                ) : null}
            </div>
        )
    } else {
        const bodyLabel = vehicleBodyLabel(value.body)
        const showTypes = typeOpen || !value.body || !!errors.body
        const paint = vehiclePaint(value.color)
        const carName = `${value.make} ${value.model}`.trim()
        /* The car's image slot: the make's mark (logo or monogram), large, and
           a dot of the paint once one is tapped. */
        const carSlot = (
            <span className="relative grid size-20 shrink-0 place-items-center rounded-[var(--radius-autara-md)] bg-[var(--paper)] text-[var(--text-strong)]">
                {value.make.trim() ? (
                    <VehicleMakeMark make={value.make} className="size-12" testId={`${p}-car-mark`} />
                ) : null}
                {paint ? (
                    <VehiclePaintDot
                        paint={paint}
                        ringOn="var(--band)"
                        className="absolute -bottom-1.5 -right-1.5 size-7"
                        testId={`${p}-car-paint`}
                    />
                ) : null}
            </span>
        )
        content = (
            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-3 rounded-[var(--radius-autara-lg)] bg-[var(--band)] p-4">
                    {modelIsTyped ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                {carSlot}
                                <Heading level={headingLevel} id={titleId} headingRef={headingRef}>
                                    Your car
                                </Heading>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {makeIsTyped ? (
                                    <FormField label="Make" required error={errors.make}>
                                        <Input
                                            value={value.make}
                                            disabled={disabled}
                                            autoComplete="off"
                                            placeholder="e.g. Toyota"
                                            data-field="vehicleMake"
                                            data-testid={`${p}-make`}
                                            onChange={(e) => set({ make: e.target.value })}
                                        />
                                    </FormField>
                                ) : (
                                    <div className="flex min-h-11 flex-col justify-end">
                                        <span className="text-[0.8125rem] font-medium text-[var(--text-muted)]">Make</span>
                                        <span className="text-[0.9375rem] font-medium text-[var(--text-strong)]">{value.make}</span>
                                    </div>
                                )}
                                <FormField label="Model" required error={errors.model}>
                                    <Input
                                        value={value.model}
                                        disabled={disabled}
                                        autoComplete="off"
                                        placeholder="e.g. Camry"
                                        data-field="vehicleModel"
                                        data-testid={`${p}-model`}
                                        onChange={(e) => set({ model: e.target.value })}
                                    />
                                </FormField>
                            </div>
                            <div>
                                <button
                                    type="button"
                                    disabled={disabled}
                                    className={LINK}
                                    onClick={backToFind}
                                    data-testid={`${p}-list`}
                                >
                                    Pick from the list instead
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Wraps: at 200% text the rem-sized slot leaves the words no
                           room beside it, so they drop under it instead of clipping. */
                        <div className="flex min-w-0 flex-wrap items-center gap-4" data-testid={`${p}-car`}>
                            {/* The chosen car: its make's mark, large, with a dot of its paint
                                (Don, 2026-10-15: no car illustrations). */}
                            {carSlot}
                            <div className="flex min-w-[min(100%,12rem)] flex-1 flex-col gap-0.5">
                                <div className="flex flex-wrap items-center justify-between gap-x-3">
                                    <Heading level={headingLevel} id={titleId} headingRef={headingRef}>
                                        {carName}
                                    </Heading>
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        className={LINK}
                                        onClick={backToFind}
                                        aria-label={`Change car, ${carName}`}
                                        data-testid={`${p}-change`}
                                    >
                                        Change car
                                    </button>
                                </div>
                                {/* The type the model implies, said once, with its Change
                                    (Don, 2026-10-14: the ten type chips go). */}
                                {!showTypes ? (
                                    <p className="m-0 flex flex-wrap items-center gap-x-2 text-[0.9375rem] text-[var(--text-muted)]">
                                        <span data-testid={`${p}-type-current`}>{bodyLabel}</span>
                                        <button
                                            type="button"
                                            disabled={disabled}
                                            className={LINK}
                                            aria-expanded={false}
                                            aria-label={`Change type, ${bodyLabel}`}
                                            onClick={() => setTypeOpen(true)}
                                            data-testid={`${p}-type-change`}
                                        >
                                            Change type
                                        </button>
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>

                {showTypes ? (
                    <fieldset
                        className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0"
                        aria-invalid={errors.body ? true : undefined}
                        aria-describedby={errors.body ? typeErrorId : undefined}
                        data-testid={`${p}-type`}
                    >
                        <legend className="pb-2 text-[0.9375rem] font-medium text-[var(--text-strong)]">
                            Type
                            <span aria-hidden="true" className="text-[var(--danger)]">
                                {' '}
                                *
                            </span>
                            <span className="sr-only"> (required)</span>
                        </legend>
                        <div className="flex flex-wrap gap-2">
                            {VEHICLE_BODIES.map((b, i) => {
                                const on = value.body === b.value
                                return (
                                    <label
                                        key={b.value}
                                        data-testid={`${p}-type-${b.value}`}
                                        data-selected={on || undefined}
                                        className={cn(
                                            CHIP,
                                            'cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--accent)] has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-[var(--background)]',
                                            on ? CHIP_ON : CHIP_IDLE,
                                            on && poppedBody === b.value && 'motion-pop'
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name={`${uid}-type`}
                                            value={b.value}
                                            checked={on}
                                            disabled={disabled}
                                            data-field={i === 0 ? 'vehicleType' : undefined}
                                            onChange={() => {
                                                /* The chips stay open once opened: closing them
                                                   on change would drop a keyboard user's focus
                                                   on the first arrow key. */
                                                setPoppedBody(b.value)
                                                set({ body: b.value })
                                            }}
                                            className="sr-only"
                                        />
                                        {on ? <TickGlyph /> : null}
                                        {b.label}
                                    </label>
                                )
                            })}
                        </div>
                        {errors.body ? (
                            <p id={typeErrorId} role="alert" className={ERROR} data-testid={`${p}-type-error`}>
                                {errors.body}
                            </p>
                        ) : null}
                    </fieldset>
                ) : null}

                <SwatchRadioGroup
                    name={`${uid}-colour`}
                    label="Colour (optional)"
                    options={VEHICLE_PAINTS.map((x) => ({
                        value: x.value,
                        label: x.label,
                        color: x.color,
                        ink: x.ink,
                        edge: x.edge,
                    }))}
                    value={paint?.value ?? null}
                    onChange={(v) => set({ color: VEHICLE_PAINTS.find((x) => x.value === v)?.label ?? '' })}
                    disabled={disabled}
                    columns={5}
                    compactColumns={5}
                    size="lg"
                    testId={`${p}-colour`}
                    /* The swatch says itself (its name is the radio's); only a saved
                       colour the palette has no swatch for is said in words. */
                    description={!paint && value.color.trim() ? `Saved as ${value.color.trim()}` : undefined}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label="Rego (optional)" description="Only your pro sees it.">
                        <Input
                            value={value.registrationPlate}
                            disabled={disabled}
                            autoComplete="off"
                            autoCapitalize="characters"
                            spellCheck={false}
                            placeholder="e.g. ABC123"
                            data-field="vehicleRegistration"
                            data-testid={`${p}-rego`}
                            onChange={(e) => set({ registrationPlate: e.target.value.toUpperCase() })}
                        />
                    </FormField>
                    <FormField label="Year (optional)" error={errors.year}>
                        <Input
                            value={value.year}
                            disabled={disabled}
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={4}
                            placeholder="e.g. 2021"
                            data-field="vehicleYear"
                            data-testid={`${p}-year`}
                            onChange={(e) => set({ year: e.target.value.replace(/[^0-9]/g, '') })}
                        />
                    </FormField>
                </div>
            </div>
        )
    }

    return (
        <div
            className={cn('-mx-1 overflow-x-clip px-1 py-1', className)}
            data-testid={`${p}-picker`}
            data-step={step}
            aria-busy={disabled || undefined}
        >
            {/* AUTM-1870: one soft move between steps (`.motion-step`, the
                screen's 6% slide on the house ease-out); keyed, so only a
                step that changes moves, and never on the first draw. */}
            <div key={step} className="motion-step" data-step-dir={dir ?? undefined}>
                {content}
            </div>
        </div>
    )
}
