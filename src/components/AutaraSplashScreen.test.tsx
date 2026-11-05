import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AutaraSplashScreen } from './AutaraSplashScreen'

describe('AutaraSplashScreen', () => {
    it('is a status named by its caption, with a decorative mark', () => {
        const { container } = render(<AutaraSplashScreen caption="Getting things ready…" testId="boot" />)
        const status = screen.getByRole('status', { name: 'Getting things ready…' })
        expect(status).toHaveAttribute('data-testid', 'boot')
        expect(status).toHaveAttribute('aria-busy', 'true')
        expect(container.querySelector('.autara-splash')).toHaveAttribute('aria-hidden', 'true')
        expect(screen.getByText('Getting things ready…').tagName).toBe('P')
    })

    it('falls back to "Loading" with no text caption, or takes a label', () => {
        render(<AutaraSplashScreen />)
        expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
        render(<AutaraSplashScreen caption={<span>Hi</span>} label="Signing you in" />)
        expect(screen.getByRole('status', { name: 'Signing you in' })).toBeInTheDocument()
    })

    it('is the deep ground, fixed over the page by default or filling its parent', () => {
        render(<AutaraSplashScreen testId="a" />)
        expect(screen.getByTestId('a').className).toMatch(/bg-\[var\(--brand-deep\)\]/)
        expect(screen.getByTestId('a').className).toMatch(/\bfixed\b/)
        render(<AutaraSplashScreen testId="b" position="fill" />)
        expect(screen.getByTestId('b').className).not.toMatch(/\bfixed\b/)
    })

    it('starts at the hold when the intro is off', () => {
        const { container } = render(<AutaraSplashScreen intro={false} />)
        const mark = container.querySelector('.autara-splash') as HTMLElement
        expect(mark.style.getPropertyValue('--autara-splash-t0')).toBe('-1000ms')
    })
})
