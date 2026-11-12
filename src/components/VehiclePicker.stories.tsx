import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './Dialog'
import {
    EMPTY_VEHICLE_PICKER_VALUE,
    VehiclePicker,
    validateVehiclePicker,
    type VehiclePickerErrors,
    type VehiclePickerValue,
} from './VehiclePicker'

/**
 * VehiclePicker (AUTM-1870, Don 2026-10-14, after Mobbin: Lloyds, BlaBlaCar,
 * PayPal). Find (search make or model, popular makes as logo tiles), Model
 * (chips), Details (the make's mark with a dot of the tapped paint, the
 * inferred type with Change, large colour swatches, rego and year; no car
 * illustrations, Don 2026-10-15). The consumer owns the button and validates
 * on press. "Hilux", the result, White, then Add car: three taps.
 */
const meta = {
    title: 'Molecules/VehiclePicker',
    component: VehiclePicker,
    parameters: { layout: 'padded' },
    args: { value: EMPTY_VEHICLE_PICKER_VALUE, onChange: () => {} },
} satisfies Meta<typeof VehiclePicker>

export default meta
type Story = StoryObj<typeof meta>

function Controlled({ initial = EMPTY_VEHICLE_PICKER_VALUE, errors }: { initial?: VehiclePickerValue; errors?: VehiclePickerErrors }) {
    const [value, setValue] = useState(initial)
    return (
        <div className="max-w-lg">
            <VehiclePicker value={value} onChange={setValue} errors={errors} testIdPrefix="story-vehicle" />
            <pre className="mt-6 text-[0.75rem] text-[var(--text-muted)]">{JSON.stringify(value, null, 2)}</pre>
        </div>
    )
}

/** The first step: search, twelve popular makes, More makes, Not listed. Try "Hilux", "cx5", "VW". */
export const Find: Story = { render: () => <Controlled /> }

/** A saved car opens on its details: Toyota HiLux, the ute inferred, White. */
export const SavedCar: Story = {
    render: () => (
        <Controlled
            initial={{ make: 'Toyota', model: 'HiLux', body: 'UTE', color: 'White', year: '2021', registrationPlate: 'ABC123' }}
        />
    ),
}

/** A car the catalog does not know: typed, and the type chips open because nothing can be inferred. */
export const NotListed: Story = {
    render: () => <Controlled initial={{ ...EMPTY_VEHICLE_PICKER_VALUE, make: 'Lada', model: 'Niva' }} />,
}

/** Pressed with nothing chosen, and a typed car with no type and a bad year: each message where it is fixed. */
export const Errors: Story = {
    render: () => (
        <div className="grid gap-10 md:grid-cols-2">
            <Controlled errors={validateVehiclePicker(EMPTY_VEHICLE_PICKER_VALUE)} />
            <Controlled
                initial={{ ...EMPTY_VEHICLE_PICKER_VALUE, make: 'Lada', model: 'Niva', year: '1890' }}
                errors={validateVehiclePicker({ ...EMPTY_VEHICLE_PICKER_VALUE, make: 'Lada', model: 'Niva', year: '1890' })}
            />
        </div>
    ),
}

function InDialog() {
    const [open, setOpen] = useState(true)
    const [value, setValue] = useState(EMPTY_VEHICLE_PICKER_VALUE)
    const [pressed, setPressed] = useState(false)
    const [saved, setSaved] = useState<VehiclePickerValue | null>(null)
    const errors = pressed ? validateVehiclePicker(value) : {}
    return (
        <>
            <Button onClick={() => setOpen(true)}>Add a car</Button>
            {saved ? <p className="mt-3 text-[var(--text-muted)]">Added {saved.make} {saved.model}</p> : null}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent layout="responsive">
                    <DialogHeader>
                        <DialogTitle>Add a car</DialogTitle>
                        <DialogDescription>Only your pro sees the rego.</DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <VehiclePicker value={value} onChange={setValue} errors={errors} autoFocusSearch testIdPrefix="story-add" />
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="quiet" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                setPressed(true)
                                if (Object.keys(validateVehiclePicker(value)).length) return
                                setSaved(value)
                                setOpen(false)
                            }}
                        >
                            Add car
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

/** In the library's responsive Dialog: a sheet on a phone. Add car is the footer's one lime, validating on press. */
export const InADialog: Story = { render: () => <InDialog /> }

/** Inside a page that owns its own Continue (checkout): headings one level up, no button of its own. */
export const Embedded: Story = {
    render: () => {
        const Embed = () => {
            const [value, setValue] = useState(EMPTY_VEHICLE_PICKER_VALUE)
            return (
                <section className="max-w-xl">
                    <h1 className="m-0">
                        <span className="text-[1.5rem] font-bold text-[var(--text-strong)]">Which car needs care?</span>
                    </h1>
                    <div className="mt-4">
                        <VehiclePicker value={value} onChange={setValue} headingLevel={2} testIdPrefix="checkout-vehicle" />
                    </div>
                </section>
            )
        }
        return <Embed />
    },
}
