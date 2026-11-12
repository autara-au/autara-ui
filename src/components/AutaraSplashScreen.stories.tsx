import type { Meta, StoryObj } from '@storybook/react-vite'
import { AutaraSplashScreen } from './AutaraSplashScreen'

/**
 * AutaraSplashScreen: a whole screen waiting on the app, on the business deep
 * purple in both themes (Don, 2026-11-05). The mark is at the exact centre and
 * the caption hangs below it, so a shell that draws the mark alone hands over
 * without a jump. Back-to-back waits share one timeline (`useSplashElapsed`).
 */
const meta = {
    title: 'Molecules/AutaraSplashScreen',
    component: AutaraSplashScreen,
    parameters: { layout: 'fullscreen' },
    args: { caption: 'Getting things ready…', position: 'fill' },
} satisfies Meta<typeof AutaraSplashScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Boot: Story = {}

export const WithDetail: Story = {
    name: 'With a detail line',
    args: { caption: 'Connecting to Stripe…', detail: 'This takes a few seconds. Keep this tab open.' },
}

export const MarkOnly: Story = {
    name: 'Mark only (a route chunk arriving)',
    args: { caption: undefined, label: 'Loading' },
}

export const LongCaptionAtLargeText: Story = {
    name: 'Long caption, 200% text',
    args: {
        caption: 'Signing you in and bringing your bookings, messages and payouts up to date…',
        detail: 'If this takes more than a minute, check your connection.',
    },
    decorators: [(S) => <div style={{ fontSize: '200%', height: 480 }}><S /></div>],
}
