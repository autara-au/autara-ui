import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { GlassEdgeTracker, GlassField } from './GlassEdge'
import { Input } from './Input'
import { Textarea } from './Textarea'
import { SearchInput } from './SearchInput'
import { PhoneInput } from './PhoneInput'
import { OtpInput } from './OtpInput'
import { NativeSelect } from './NativeSelect'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'
import { PickerTrigger } from './PickerTrigger'
import { MultiSelect } from './MultiSelect'
import { DatePicker } from './DatePicker'
import { TimePicker } from './TimePicker'
import { SocialButton } from './SocialButton'
import { Button } from './Button'
import { FormField } from './FormField'

/**
 * AUTM-2140 (Don, 2026-11-14) — the glass pill, every field in the library.
 *
 * "the new UI input should something like glassy and shiniing hairline when
 * scrolling, with premium look and rounded corners like others. see the jump
 * to search. all the input should be change to that." Shape A of the inputs
 * concept: fully round, glass with a 1px top lip, no ring at rest; the
 * hairline lights under the cursor and follows it from field to field; a soft
 * glint travels round each edge as the page scrolls; focus is the accent edge
 * and a faint tint with no halo; an error is the danger edge.
 *
 * `<GlassEdgeTracker />` (once, at the app's root) moves the light. These
 * stories install it, so move the cursor over the fields and scroll.
 * "States" forces each look with `data-field-hover` / `data-field-focus` and
 * a parked light, so every state reads at once.
 */
const meta = {
    title: 'Foundations/Glass fields',
    component: GlassField,
    parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof GlassField>

export default meta
type Story = StoryObj<typeof meta>

const TODAY = '2026-11-12'

function Theme({ theme, children, bloom = false }: { theme: 'light' | 'dark'; children: React.ReactNode; bloom?: boolean }) {
    return (
        <div data-theme={theme} className="relative min-w-0 flex-1 overflow-hidden bg-[var(--paper)] p-8 text-[var(--text-strong)]">
            {bloom ? (
                <div
                    aria-hidden
                    className="pointer-events-none absolute -right-24 -top-24 aspect-square w-[70%] rounded-full blur-[30px]"
                    style={{ background: 'radial-gradient(closest-side, color-mix(in srgb, var(--accent) 38%, transparent), transparent)' }}
                />
            ) : null}
            <div className="relative">{children}</div>
        </div>
    )
}

/** Both themes side by side, each its own `data-theme` island. */
function Both({ children, bloom }: { children: (theme: 'light' | 'dark') => React.ReactNode; bloom?: boolean }) {
    return (
        <div className="flex min-h-screen flex-wrap">
            <GlassEdgeTracker />
            <Theme theme="light" bloom={bloom}>
                {children('light')}
            </Theme>
            <Theme theme="dark" bloom={bloom}>
                {children('dark')}
            </Theme>
        </div>
    )
}

type State = 'rest' | 'hover' | 'focus' | 'filled' | 'error' | 'disabled'
const STATES: State[] = ['rest', 'hover', 'focus', 'filled', 'error', 'disabled']

/** Forces a look on every `.glass-edge` inside: the light parked a third along the top edge. */
function Force({ state, children }: { state: State; children: React.ReactNode }) {
    const ref = React.useRef<HTMLDivElement>(null)
    React.useLayoutEffect(() => {
        ref.current?.querySelectorAll<HTMLElement>('.glass-edge').forEach((el) => {
            if (state === 'hover') {
                el.setAttribute('data-field-hover', '')
                el.style.setProperty('--edge-x', `${Math.round(el.offsetWidth * 0.33)}px`)
                el.style.setProperty('--edge-y', '0px')
                el.style.setProperty('--edge-spot', 'var(--field-shine)')
            }
            if (state === 'focus') el.setAttribute('data-field-focus', '')
        })
    })
    return (
        <div ref={ref} className="min-w-0">
            {children}
        </div>
    )
}

const noop = () => {}

function row(state: State) {
    const invalid = state === 'error' || undefined
    const disabled = state === 'disabled'
    const filled = state === 'filled' || state === 'error'
    return {
        Input: (
            <Input
                aria-label="Business name"
                placeholder="Business name"
                defaultValue={filled ? (state === 'error' ? '0491 57' : 'McRaven Auto') : undefined}
                aria-invalid={invalid}
                disabled={disabled}
            />
        ),
        Textarea: (
            <Textarea
                aria-label="Notes"
                placeholder="Gate code, where to park"
                rows={2}
                defaultValue={filled ? 'Gate code 4417, park on the street.' : undefined}
                aria-invalid={invalid}
                disabled={disabled}
            />
        ),
        SearchInput: <SearchInput aria-label="Search" defaultValue={filled ? 'Corolla' : undefined} aria-invalid={invalid} disabled={disabled} />,
        PhoneInput: (
            <PhoneInput aria-label="Mobile" defaultValue={filled ? '0491570156' : undefined} aria-invalid={invalid} disabled={disabled} />
        ),
        NativeSelect: (
            <NativeSelect aria-label="State" placeholder="State" defaultValue={filled ? 'VIC' : undefined} aria-invalid={invalid} disabled={disabled}>
                <option value="VIC">VIC</option>
                <option value="NSW">NSW</option>
            </NativeSelect>
        ),
        Select: (
            <Select defaultValue={filled ? 'ext' : undefined} disabled={disabled}>
                <SelectTrigger aria-label="Service" aria-invalid={invalid}>
                    <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ext">Exterior car care</SelectItem>
                    <SelectItem value="int">Interior car care</SelectItem>
                </SelectContent>
            </Select>
        ),
        PickerTrigger: (
            <PickerTrigger aria-label="Vehicle" placeholder="Choose a vehicle" value={filled ? 'Toyota Corolla' : ''} invalid={invalid} disabled={disabled} />
        ),
        MultiSelect: (
            <MultiSelect
                aria-label="Suburbs"
                placeholder="Suburbs you cover"
                options={[
                    { value: 'fitzroy', label: 'Fitzroy' },
                    { value: 'collingwood', label: 'Collingwood' },
                ]}
                value={filled ? ['fitzroy', 'collingwood'] : []}
                aria-invalid={invalid}
                disabled={disabled}
            />
        ),
        OtpInput: <OtpInput value={filled ? '123456' : ''} onChange={noop} invalid={invalid} disabled={disabled} autoFocus={false} />,
        Google: <SocialButton provider="google" disabled={disabled} />,
    }
}

export const States: Story = {
    render: () => (
        <Both>
            {(theme) => (
                <div className="grid gap-6">
                    <h2 className="text-[1.25rem] font-bold">{theme === 'light' ? 'Light' : 'Dark'}</h2>
                    {Object.keys(row('rest')).map((name) => (
                        <section key={name} className="grid gap-2">
                            <p className="text-[0.8125rem] text-[var(--text-muted)]">{name}</p>
                            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                                {STATES.map((state) => (
                                    <div key={state} className="grid gap-1.5">
                                        <span className="text-[0.75rem] text-[var(--text-subtle)]">{state}</span>
                                        <Force state={state}>{row(state)[name as keyof ReturnType<typeof row>]}</Force>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </Both>
    ),
}

/** The sign-in card of the concept: the field, lime Continue, glass Google, solid Apple. */
export const SignIn: Story = {
    render: () => (
        <Both bloom>
            {(theme) => (
                <div className="mx-auto grid max-w-[26rem] gap-4">
                    <h2 className="text-[2rem] font-bold leading-tight">Sign in or create an account</h2>
                    <FormField label="Email or phone number" description="Already with Autara? Use the email or mobile you joined with.">
                        <Input placeholder="Email or phone number" />
                    </FormField>
                    <Button variant="primary" size="lg" fullWidth>
                        Continue
                    </Button>
                    <p className="text-center text-[0.875rem] text-[var(--text-muted)]">or</p>
                    <SocialButton provider="google" theme={theme} />
                    <SocialButton provider="apple" theme={theme} />
                    <p className="text-[0.875rem] text-[var(--text-muted)]">Code entry</p>
                    <OtpInput value="12" onChange={noop} autoFocus={false} />
                </div>
            )}
        </Both>
    ),
}

/** Glass on a bloom: the blur reads only with something behind it. Scroll to move the glint. */
export const GlassOnABloom: Story = {
    render: () => (
        <Both bloom>
            {() => (
                <div className="grid max-w-[30rem] gap-4 pb-[60vh]">
                    <SearchInput placeholder="Jump to…" trailing={<kbd className="rounded-md px-1.5 text-xs">⌘K</kbd>} />
                    <FormField label="Business name">
                        <Input defaultValue="McRaven Auto" />
                    </FormField>
                    <FormField label="Mobile" error="Enter the full mobile, 10 digits.">
                        <Input defaultValue="0491 57" />
                    </FormField>
                    <FormField label="Notes">
                        <Textarea placeholder="Gate code, where to park, anything to remember" />
                    </FormField>
                    <PickerTrigger placeholder="Choose a vehicle" />
                    <DatePicker value={TODAY} onChange={noop} today={TODAY} label="Day" />
                    <TimePicker value="13:00" onChange={noop} startTime="09:00" endTime="12:00" />
                </div>
            )}
        </Both>
    ),
}
