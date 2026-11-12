import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

/**
 * AUTM-2025: with reduced motion the MotionDiv helpers render in place. The
 * stylesheet's reduced-motion clamp cannot reach a JS animation, so a reader
 * who asked for less motion still got a 20 to 30px slide before this.
 */

const reduced = vi.hoisted(() => ({ value: false }))
vi.mock('motion/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('motion/react')>()
    return { ...actual, useReducedMotion: () => reduced.value }
})

import { FadeIn, FadeInView, ScaleIn, StaggerContainer, StaggerItem } from './MotionDiv'

// FadeInView's whileInView needs it; jsdom has none.
vi.stubGlobal(
    'IntersectionObserver',
    class {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
)

afterEach(() => {
    reduced.value = false
})

const style = (id: string) => screen.getByTestId(id).getAttribute('style') ?? ''

describe('MotionDiv and reduced motion (AUTM-2025)', () => {
    it('starts hidden and lowered when motion is allowed', () => {
        render(<FadeIn data-testid="fade">Hello</FadeIn>)
        expect(style('fade')).toMatch(/opacity: 0/)
        expect(style('fade')).toMatch(/translateY\(16px\)/)
    })

    it('renders every helper in place when the reader asked for less motion', () => {
        reduced.value = true
        render(
            <>
                <FadeIn data-testid="fade">a</FadeIn>
                <FadeInView data-testid="view">b</FadeInView>
                <ScaleIn data-testid="scale">c</ScaleIn>
                <StaggerContainer>
                    <StaggerItem data-testid="item">d</StaggerItem>
                </StaggerContainer>
            </>
        )
        for (const id of ['fade', 'view', 'scale', 'item']) {
            expect(style(id)).not.toMatch(/opacity: 0/)
            expect(style(id)).not.toMatch(/translateY\(16px\)|scale\(0\.95\)/)
        }
    })
})
