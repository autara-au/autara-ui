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
