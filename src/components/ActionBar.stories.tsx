import type { Meta, StoryObj } from '@storybook/react-vite'
import { ActionBar, type ActionBarAction } from './ActionBar'
import { ArrowGlyph, CardGlyph, ChatGlyph, ClockGlyph, CloseGlyph, HelpGlyph, PhoneGlyph } from './_shellGlyphs'

/**
 * AUTM-1781: what a person can do next, under the thumb. One lime primary,
 * then two icon actions OR one secondary (canvas AppBookingDetail and
 * AppBookingLive). Cancel, Change time and Help never go here.
 */
const meta: Meta<typeof ActionBar> = {
    title: 'App shell/ActionBar',
    component: ActionBar,
    parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof ActionBar>

/** The 8.4 list, kept for the deprecated `actions` prop's stories. */
const confirmed: ActionBarAction[] = [
    { key: 'message', label: 'Message', icon: <ChatGlyph />, primary: true, onSelect: () => {} },
    { key: 'directions', label: 'Directions', icon: <ArrowGlyph />, href: 'https://maps.google.com', external: true },
    { key: 'change', label: 'Change time', icon: <ClockGlyph />, description: 'Ask the pro to move it', onSelect: () => {} },
    { key: 'cancel', label: 'Cancel', icon: <CloseGlyph />, tone: 'danger', onSelect: () => {} },
    { key: 'help', label: 'Help', icon: <HelpGlyph />, onSelect: () => {} },
]

const Page = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-[32rem] bg-[var(--surface)] p-4 pb-32 lg:grid lg:grid-cols-[1fr_20rem] lg:gap-8">
        <div className="text-[var(--text-muted)]">The booking reads here. On a phone the bar is docked below.</div>
        <aside className="lg:sticky lg:top-4 lg:self-start">{children}</aside>
    </div>
)

/** A confirmed booking, days before: Message is the one thing. */
export const Primary: Story = {
    parameters: { viewport: { defaultViewport: 'phone' } },
    render: () => (
        <Page>
            <ActionBar label="Booking actions" primary={{ key: 'message', label: 'Message', onSelect: () => {} }} />
        </Page>
    ),
}

/** The day of, at a workshop: Directions leads, Message and Call beside it. */
export const PrimaryWithIcons: Story = {
    parameters: { viewport: { defaultViewport: 'phone' } },
    render: () => (
        <Page>
            <ActionBar
                label="Booking actions"
                primary={{ key: 'directions', label: 'Directions', href: 'https://maps.google.com', external: true }}
                icons={[
                    { key: 'message', label: 'Message Fitzroy Paint Co', icon: <ChatGlyph />, onSelect: () => {} },
                    { key: 'call', label: 'Call Fitzroy Paint Co', icon: <PhoneGlyph />, href: 'tel:+61400000000' },
                ]}
            />
        </Page>
    ),
}

/** A decision: the pro asked to move it. Keep the booked time, or accept theirs. */
export const PrimaryWithSecondary: Story = {
    parameters: { viewport: { defaultViewport: 'phone' } },
    render: () => (
        <Page>
            <ActionBar
                label="Answer the new time"
                secondary={{ key: 'keep', label: 'Keep Saturday', onSelect: () => {} }}
                primary={{ key: 'accept', label: 'Accept Sunday', onSelect: () => {} }}
            />
        </Page>
    ),
}

/** From lg, the same controls in the flow of a side panel, names shown. */
export const InAPanel: Story = {
    parameters: { viewport: { defaultViewport: 'desktop' } },
    render: () => (
        <Page>
            <ActionBar
                label="Booking actions"
                primary={{ key: 'directions', label: 'Get directions', href: 'https://maps.google.com', external: true }}
                icons={[
                    { key: 'message', label: 'Message', icon: <ChatGlyph />, onSelect: () => {} },
                    { key: 'call', label: 'Call', icon: <PhoneGlyph />, href: 'tel:+61400000000' },
                ]}
            />
        </Page>
    ),
}

/** Edge: 200% text on a small phone. Pills grow and names wrap between words. */
export const AtLargeText: Story = {
    parameters: { viewport: { defaultViewport: 'phoneSmall' } },
    render: () => (
        <div className="text-[200%]">
            <Page>
                <ActionBar
                    label="Booking actions"
                    secondary={{ key: 'keep', label: 'Keep Saturday', onSelect: () => {} }}
                    primary={{ key: 'accept', label: 'Accept Sunday', onSelect: () => {} }}
                />
            </Page>
        </div>
    ),
}

/** Deprecated `actions` (8.4): a confirmed booking's list. */
export const Default: Story = {
    parameters: { viewport: { defaultViewport: 'phone' } },
    render: () => (
        <Page>
            <ActionBar label="Booking actions" actions={confirmed} />
        </Page>
    ),
}

/** Deprecated `actions` (8.4): the desktop side panel's list. */
export const Panel: Story = {
    parameters: { viewport: { defaultViewport: 'desktop' } },
    render: () => (
        <Page>
            <ActionBar label="Booking actions" actions={confirmed} />
        </Page>
    ),
}

/** Deprecated `actions` (8.4): on the day. */
export const OnTheDay: Story = {
    parameters: { viewport: { defaultViewport: 'phone' } },
    render: () => (
        <Page>
            <ActionBar
                label="Booking actions"
                actions={[
                    confirmed[0],
                    { key: 'call', label: 'Call', icon: <PhoneGlyph />, href: 'tel:+61400000000' },
                    confirmed[1],
                ]}
            />
        </Page>
    ),
}

/** Deprecated `actions` (8.4): two pills. */
export const TwoActions: Story = {
    parameters: { viewport: { defaultViewport: 'phone' } },
    render: () => (
        <Page>
            <ActionBar
                label="Booking actions"
                actions={[
                    { key: 'pay', label: 'Pay $126.00', icon: <CardGlyph />, primary: true, href: '#' },
                    { key: 'help', label: 'Help', icon: <HelpGlyph />, onSelect: () => {} },
                ]}
            />
        </Page>
    ),
}

/** Deprecated `actions` (8.4): 200% text. */
export const LargeText: Story = {
    parameters: { viewport: { defaultViewport: 'phoneSmall' } },
    render: () => (
        <div className="text-[200%]">
            <Page>
                <ActionBar label="Booking actions" actions={confirmed.slice(0, 4)} />
            </Page>
        </div>
    ),
}
