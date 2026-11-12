import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InstallOffer, InstallSteps } from './InstallOffer'

/* AUTM-1906 — the one-time install offer's card. */

describe('InstallOffer', () => {
    it('is a region named by its heading, at the level the surface asks for', () => {
        render(<InstallOffer path="prompt" title="Add Autara to your Home Screen" body="One tap." onDismiss={() => {}} headingLevel={3} />)
        const region = screen.getByRole('region', { name: 'Add Autara to your Home Screen' })
        expect(region).toHaveAttribute('data-testid', 'install-offer')
        expect(screen.getByRole('heading', { level: 3, name: 'Add Autara to your Home Screen' })).toBeInTheDocument()
        expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('offers Install and Not now when the browser can install', async () => {
        const onInstall = vi.fn()
        const onDismiss = vi.fn()
        render(
            <InstallOffer path="prompt" title="Install" body="One tap." onInstall={onInstall} onDismiss={onDismiss} testId="today-install" />,
        )
        await userEvent.click(screen.getByTestId('today-install-install'))
        await userEvent.click(screen.getByTestId('today-install-dismiss'))
        expect(onInstall).toHaveBeenCalledTimes(1)
        expect(onDismiss).toHaveBeenCalledTimes(1)
        expect(screen.queryByTestId('today-install-steps')).toBeNull()
    })

    it('explains Share, then Add to Home Screen on an iPhone or iPad, with no Install button', () => {
        render(<InstallOffer path="apple-mobile" title="Install" body="Two steps." onDismiss={() => {}} testId="today-install" />)
        expect(screen.queryByTestId('today-install-install')).toBeNull()
        const steps = screen.getByTestId('today-install-steps')
        expect(steps.tagName).toBe('OL')
        expect(steps).toHaveTextContent('Share')
        expect(steps).toHaveTextContent('Add to Home Screen')
        expect(screen.getByRole('button', { name: 'Not now' })).toBeInTheDocument()
    })

    it('draws the app icon it is given, decoratively', () => {
        render(
            <InstallOffer path="prompt" title="Install" body="x" onDismiss={() => {}} icon={<img src="/icons/icon-192.png" alt="" />} />,
        )
        const img = document.querySelector('img[src="/icons/icon-192.png"]')
        expect(img?.closest('[aria-hidden]')).not.toBeNull()
    })

    it('keeps type classes off the heading element (unlayered h1 to h6 rules in both apps)', () => {
        render(<InstallOffer path="prompt" title="Install" body="x" onDismiss={() => {}} />)
        expect(screen.getByRole('heading').className).toBe('')
    })
})

/* AUTM-2048 — the slim row. Same contract as the card: the region, the test
   ids, the two paths; the dismiss is a close disc named by dismissLabel. */
describe('InstallOffer layout="row"', () => {
    it('keeps the region, the test ids and the heading, and marks the layout', () => {
        render(
            <InstallOffer layout="row" path="prompt" title="Install Autara for business" body="Opens to Today in its own window." onDismiss={() => {}} testId="today-install-offer" />,
        )
        const region = screen.getByRole('region', { name: 'Install Autara for business' })
        expect(region).toHaveAttribute('data-testid', 'today-install-offer')
        expect(region).toHaveAttribute('data-layout', 'row')
        expect(region).toHaveAttribute('data-path', 'prompt')
        expect(screen.getByRole('heading', { level: 2, name: 'Install Autara for business' }).className).toBe('')
        expect(screen.getByText('Opens to Today in its own window.')).toBeInTheDocument()
    })

    it('Install installs; the close disc is named by dismissLabel and dismisses', async () => {
        const onInstall = vi.fn()
        const onDismiss = vi.fn()
        render(
            <InstallOffer layout="row" path="prompt" title="Install" body="x" dismissLabel="No thanks" onInstall={onInstall} onDismiss={onDismiss} testId="today-install-offer" />,
        )
        await userEvent.click(screen.getByTestId('today-install-offer-install'))
        expect(onInstall).toHaveBeenCalledTimes(1)
        const close = screen.getByRole('button', { name: 'No thanks' })
        expect(close).toHaveAttribute('data-testid', 'today-install-offer-dismiss')
        await userEvent.click(close)
        expect(onDismiss).toHaveBeenCalledTimes(1)
        expect(screen.queryByRole('button', { name: 'Not now' })).toBeNull()
    })

    it('on an iPhone or iPad: the Share steps, no Install', () => {
        render(<InstallOffer layout="row" path="apple-mobile" title="Add" body="x" onDismiss={() => {}} testId="today-install-offer" />)
        expect(screen.queryByTestId('today-install-offer-install')).toBeNull()
        expect(screen.getByTestId('today-install-offer-steps')).toHaveTextContent('Add to Home Screen')
        expect(screen.getByRole('button', { name: 'Not now' })).toHaveAttribute('data-testid', 'today-install-offer-dismiss')
    })

    it('draws the phone glyph when no icon is passed, decoratively', () => {
        render(<InstallOffer layout="row" path="prompt" title="Install" body="x" onDismiss={() => {}} />)
        const mark = document.querySelector('section > div > span[aria-hidden]')
        expect(mark?.querySelector('svg')).not.toBeNull()
    })

    it('leaves the card as the default', () => {
        render(<InstallOffer path="prompt" title="Install" body="x" onDismiss={() => {}} />)
        expect(screen.getByRole('region')).not.toHaveAttribute('data-layout')
        expect(screen.getByRole('button', { name: 'Not now' })).toBeInTheDocument()
    })
})

describe('InstallSteps', () => {
    it.each([
        ['apple-mobile', 'Add to Home Screen'],
        ['mac-safari', 'Add to Dock'],
        ['android', 'Install app'],
        ['desktop', 'address bar'],
        ['other', 'Chrome, Edge or Safari'],
    ] as const)('%s names what the person will see', (platform, words) => {
        render(<InstallSteps platform={platform} testId="steps" />)
        expect(screen.getByTestId('steps')).toHaveTextContent(words)
        expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })

    it('has no em dashes in its copy', () => {
        for (const platform of ['apple-mobile', 'mac-safari', 'android', 'desktop', 'other'] as const) {
            const { unmount } = render(<InstallSteps platform={platform} testId="steps" />)
            expect(screen.getByTestId('steps').textContent).not.toMatch(/—/)
            unmount()
        }
    })
})
