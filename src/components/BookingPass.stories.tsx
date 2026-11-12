import type { Meta, StoryObj } from '@storybook/react-vite'
import { BookingPass } from './BookingPass'
import { WhenBlock, DateTile } from './DateTile'
import { FactRows } from './FactRows'
import { MoneyBreakdown } from './MoneyBreakdown'
import { ProgressSteps } from './ProgressSteps'
import { ChatGlyph, CardGlyph } from './_shellGlyphs'

/**
 * AUTM-1797 / AUTM-1799: a booking drawn, not told. Don, 2026-10-09, on the
 * customer booking screen: "still a lot of text vibe". The pass answers who,
 * what and when; the icon rows where and which car; the chips the money;
 * the track where it is. Every story is the customer app at 390.
 */
const meta: Meta<typeof BookingPass> = {
    title: 'App shell/BookingPass',
    component: BookingPass,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <div style={{ maxWidth: 390 }}>{Story()}</div>],
}
export default meta
type Story = StoryObj<typeof BookingPass>

/** Saturday 17 October 2026, 9:00 am in Melbourne. */
const AT = '2026-10-16T22:00:00.000Z'
const TZ = 'Australia/Melbourne'

const PinGlyph = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
        <circle cx="12" cy="9.5" r="2.5" />
    </svg>
)
const CarGlyph = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path d="M4 15.5V12l2-5h12l2 5v3.5M4 15.5h16M4 15.5V18h3v-2.5M20 15.5V18h-3v-2.5" />
    </svg>
)
const SendGlyph = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path d="M7 17 17 7M9 7h8v8" />
    </svg>
)
const ShopGlyph = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path d="M4 10v9h16v-9M3 6l1.5-3h15L21 6v1a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z" />
    </svg>
)
const SparkGlyph = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
)

const messageDisc = (
    <button
        type="button"
        aria-label="Message Fitzroy Paint Co"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--paper)] text-[var(--text-strong)] [&_svg]:size-5"
    >
        <ChatGlyph />
    </button>
)

const when = <WhenBlock iso={AT} timeZone={TZ} dayLabel="Sat 17 Oct" time="9:00 am" sub="3 hr" />

/** The pass as the booking screen draws it: initials on brand, the message disc, when. */
export const Default: Story = {
    args: {
        name: 'Fitzroy Paint Co',
        href: '#',
        sub: 'Paint correction, single stage',
        action: messageDisc,
        when,
    },
}

/** The pro has given a photo. */
export const WithPhoto: Story = {
    args: {
        ...Default.args,
        name: 'Northside Ceramic Works',
        photo:
            'data:image/svg+xml;utf8,' +
            encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#4ceaff"/><circle cx="4" cy="4" r="2.5" fill="#d4ff4f"/></svg>',
            ),
    },
}

/** A long name and service wrap at a word; nothing is cut. Messaging not open yet: no disc. */
export const LongNames: Story = {
    args: {
        name: 'The Eastern Suburbs Ceramic Coating and Paint Protection Studio',
        sub: 'Two-stage paint correction with a three-year ceramic coating and wheel faces',
        when: <WhenBlock iso={AT} timeZone={TZ} dayLabel="Sat 17 Oct" time="10:30 am AEDT" sub="1 day" />,
    },
}

/** A multi-day job: its drop-off and pick-up are a card of their own, so the pass has no time. */
export const NoTime: Story = {
    args: { name: 'Fitzroy Paint Co', sub: 'Paint correction, 3 working days', action: messageDisc },
}

/** The date tile alone, in its two sizes; the date is the pro's clock (the last, 11 pm Friday in Perth). */
export const Tiles: Story = {
    args: { name: 'Fitzroy Paint Co' },
    render: () => (
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--band)] p-4">
            <DateTile iso={AT} timeZone={TZ} />
            <DateTile iso={AT} timeZone={TZ} size="sm" />
            <DateTile iso="2026-10-16T15:00:00.000Z" timeZone="Australia/Perth" size="sm" />
        </div>
    ),
}

/**
 * In context, a request on the booking screen at 390: the track (only the
 * current word drawn), the pass, place and car as icon rows, the money as
 * chips, a hold in flight in aqua.
 */
export const RequestScreen: Story = {
    args: { name: 'Fitzroy Paint Co' },
    render: () => (
        <div className="flex flex-col gap-4 bg-[var(--paper)] p-1 text-[var(--text-strong)]">
            <ProgressSteps
                steps={['Sent', 'Accepted', 'The job', 'Paid']}
                current={1}
                label="Where your booking is"
                icons={[<SendGlyph key="s" />, <ShopGlyph key="a" />, <SparkGlyph key="j" />, <CardGlyph key="p" />]}
            />
            <BookingPass name="Fitzroy Paint Co" href="#" sub="Paint correction, single stage" action={messageDisc} when={when} />
            <FactRows
                rows={[
                    { key: 'where', icon: <PinGlyph />, label: 'Where', value: 'Their workshop', note: 'Street address once your deposit is charged' },
                    { key: 'car', icon: <CarGlyph />, label: 'Vehicle', value: '2021 Toyota LandCruiser, white, BXY41K' },
                ]}
            />
            <MoneyBreakdown
                variant="chips"
                label="When you pay"
                title="Payment"
                rows={[
                    { label: 'On hold', value: '$54', tone: 'flight' },
                    { label: 'After the job', value: '$126' },
                ]}
            />
        </div>
    ),
}
