import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './Dialog'

/**
 * AUTM-1594 — `layout="responsive"`: a bottom sheet below `sm`, a centred
 * card from `sm`, header and actions pinned, the body scrolling.
 *
 * jsdom has no layout engine and no media queries, so the geometry is pinned
 * by the classes that produce it (the same stance as tap-targets.test.tsx).
 * What jsdom CAN prove is behaviour: focus moves in, stays in, goes back to
 * the trigger, and Escape closes. Those are the parts a consumer would
 * otherwise have to rebuild, and they are Radix's at both widths because the
 * layout is one tree.
 */

function Responsive({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
    return (
        <Dialog onOpenChange={onOpenChange}>
            <DialogTrigger>Edit business address</DialogTrigger>
            <DialogContent layout="responsive" size="lg" data-testid="panel">
                <DialogHeader data-testid="head">
                    <DialogTitle>Business address</DialogTitle>
                    <DialogDescription>Where customers find you.</DialogDescription>
                </DialogHeader>
                <DialogBody data-testid="body">
                    <label>
                        Street address
                        <input defaultValue="14 Pitt Street" />
                    </label>
                </DialogBody>
                <DialogFooter data-testid="foot">
                    <button type="button">Cancel</button>
                    <button type="button">Confirm address</button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

describe('Dialog layout="responsive"', () => {
    it('is a bottom sheet below sm and a centred card from sm', async () => {
        render(<Responsive />)
        await userEvent.click(screen.getByRole('button', { name: 'Edit business address' }))
        const panel = screen.getByTestId('panel')
        expect(panel.getAttribute('data-layout')).toBe('responsive')
        const c = panel.className
        // Phone: pinned to the foot, full width, round top corners, capped
        // under the dynamic viewport, home indicator kept clear.
        for (const cls of ['bottom-0', 'inset-x-0', 'w-full', 'rounded-t-[1.5rem]', 'max-h-[calc(100dvh-1.5rem)]', 'pb-[env(safe-area-inset-bottom)]']) {
            expect(c).toContain(cls)
        }
        // From sm: centred, every corner round, 1rem off the viewport.
        for (const cls of ['sm:top-1/2', 'sm:left-1/2', 'sm:-translate-x-1/2', 'sm:-translate-y-1/2', 'sm:rounded-[1.5rem]', 'sm:max-h-[calc(100dvh-2rem)]', 'sm:max-w-[44rem]']) {
            expect(c).toContain(cls)
        }
        // One column, and only the body scrolls.
        expect(c).toContain('flex-col')
        expect(c).toContain('overflow-hidden')
        expect(c).toContain('dialog-panel--responsive')
        expect(c).not.toContain('modal-panel')
    })

    it('pins the header and the actions, and scrolls only the body', async () => {
        render(<Responsive />)
        await userEvent.click(screen.getByRole('button', { name: 'Edit business address' }))
        expect(screen.getByTestId('head').className).toContain('shrink-0')
        expect(screen.getByTestId('foot').className).toContain('shrink-0')
        const body = screen.getByTestId('body').className
        expect(body).toContain('flex-1')
        expect(body).toContain('min-h-0')
        expect(body).toContain('overflow-y-auto')
        expect(body).toContain('overscroll-contain')
    })

    it('draws the hairline under the header only once the body has scrolled', async () => {
        render(<Responsive />)
        await userEvent.click(screen.getByRole('button', { name: 'Edit business address' }))
        const head = screen.getByTestId('head')
        const body = screen.getByTestId('body')
        expect(head.hasAttribute('data-scrolled')).toBe(false)
        body.scrollTop = 40
        fireEvent.scroll(body)
        expect(head.hasAttribute('data-scrolled')).toBe(true)
        body.scrollTop = 0
        fireEvent.scroll(body)
        expect(head.hasAttribute('data-scrolled')).toBe(false)
    })

    it('keeps a long title clear of the 44px close control', async () => {
        render(<Responsive />)
        await userEvent.click(screen.getByRole('button', { name: 'Edit business address' }))
        expect(screen.getByTestId('head').className).toContain('[&>:first-child]:pr-11')
        const close = screen.getByRole('button', { name: 'Close dialog' })
        // AUTM-1756: the filled 44px disc, 48px to a finger.
        expect(close.className).toContain('size-11')
        expect(close.className).toContain('pointer-coarse:size-12')
        expect(close.className).toContain('bg-[var(--icon-disc)]')
    })

    it('lays the actions side by side, stacking primary-on-top when they do not fit', async () => {
        render(<Responsive />)
        await userEvent.click(screen.getByRole('button', { name: 'Edit business address' }))
        const foot = screen.getByTestId('foot').className
        expect(foot).toContain('flex-row')
        expect(foot).toContain('flex-wrap-reverse')
        expect(foot).toContain('[&>*]:flex-[1_1_0%]')
        expect(foot).toContain('[&>*]:min-w-fit')
        expect(foot).toContain('sm:justify-end')
    })

    it('moves focus in, traps it, closes on Escape and returns focus to the trigger', async () => {
        const user = userEvent.setup()
        const changes: boolean[] = []
        render(<Responsive onOpenChange={(open) => changes.push(open)} />)
        const trigger = screen.getByRole('button', { name: 'Edit business address' })
        await user.click(trigger)

        const dialog = screen.getByRole('dialog', { name: 'Business address' })
        await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))

        // Six tabs through four stops: focus wraps and never leaves.
        for (let i = 0; i < 6; i += 1) {
            await user.tab()
            expect(dialog.contains(document.activeElement)).toBe(true)
        }

        await user.keyboard('{Escape}')
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
        expect(changes).toEqual([true, false])
        await waitFor(() => expect(document.activeElement).toBe(trigger))
    })
})

describe('Dialog layout="responsive" when the pinned parts crowd the screen', () => {
    /*
     * jsdom lays nothing out, so the heights are stubbed: the header and the
     * action row report the size they would have at 200% text on a phone.
     */
    function stubHeights(head: number, foot: number) {
        const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
            configurable: true,
            get(this: HTMLElement) {
                if (this.hasAttribute('data-dialog-header')) return head
                if (this.hasAttribute('data-dialog-footer')) return foot
                return 0
            },
        })
        return () => {
            if (original) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', original)
        }
    }

    function setViewportHeight(h: number) {
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: h })
        window.dispatchEvent(new Event('resize'))
    }

    it('lets the header scroll away and keeps the actions pinned', async () => {
        const restore = stubHeights(470, 240)
        const initial = window.innerHeight
        try {
            setViewportHeight(740)
            render(<Responsive />)
            await userEvent.click(screen.getByRole('button', { name: 'Edit business address' }))
            const panel = screen.getByTestId('panel')
            await waitFor(() => expect(panel.hasAttribute('data-cramped')).toBe(true))
            expect(panel.className).toContain('data-[cramped]:overflow-y-auto')
            expect(screen.getByTestId('body').className).toContain('flex-none')
            expect(screen.getByTestId('body').className).not.toContain('overflow-y-auto')
            expect(screen.getByTestId('foot').className).toContain('sticky')
            expect(screen.getByTestId('foot').className).toContain('bottom-0')

            // Room again (the phone turned upright, or text scale came down).
            setViewportHeight(2000)
            await waitFor(() => expect(panel.hasAttribute('data-cramped')).toBe(false))
            expect(screen.getByTestId('body').className).toContain('overflow-y-auto')
            expect(screen.getByTestId('foot').className).not.toContain('sticky')
        } finally {
            restore()
            setViewportHeight(initial)
        }
    })

    it('stays pinned at ordinary sizes', async () => {
        const restore = stubHeights(120, 80)
        const initial = window.innerHeight
        try {
            setViewportHeight(740)
            render(<Responsive />)
            await userEvent.click(screen.getByRole('button', { name: 'Edit business address' }))
            expect(screen.getByTestId('panel').hasAttribute('data-cramped')).toBe(false)
        } finally {
            restore()
            setViewportHeight(initial)
        }
    })

    it('keeps the home-indicator inset on the action row, not under it', async () => {
        render(<Responsive />)
        await userEvent.click(screen.getByRole('button', { name: 'Edit business address' }))
        expect(screen.getByTestId('panel').className).toContain('has-[[data-dialog-footer]]:pb-0')
        expect(screen.getByTestId('foot').className).toContain('pb-[calc(1rem+env(safe-area-inset-bottom))]')
    })
})

describe('Dialog default layout is unchanged', () => {
    it('stays a centred card with the existing parts', async () => {
        render(
            <Dialog defaultOpen>
                <DialogContent data-testid="panel">
                    <DialogHeader data-testid="head">
                        <DialogTitle>Cancel this booking?</DialogTitle>
                        <DialogDescription>The deposit is refunded.</DialogDescription>
                    </DialogHeader>
                    <DialogBody data-testid="body">Body</DialogBody>
                    <DialogFooter data-testid="foot">
                        <button type="button">Keep booking</button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>,
        )
        const panel = screen.getByTestId('panel')
        expect(panel.getAttribute('data-layout')).toBe('centered')
        for (const cls of ['left-1/2', 'top-1/2', 'max-w-lg', 'p-6', 'modal-panel']) {
            expect(panel.className).toContain(cls)
        }
        expect(panel.className).not.toContain('dialog-panel--responsive')
        // AUTM-1756: the header keeps clear of the drawn close disc.
        expect(screen.getByTestId('head').className).toBe('flex flex-col space-y-1.5 pr-8 text-left')
        expect(screen.getByTestId('foot').className).toBe('flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end')
        expect(screen.getByTestId('body').className).toBe('min-w-0')
    })

    it('takes a wider card with size="lg" and a consumer width still wins', () => {
        render(
            <Dialog defaultOpen>
                <DialogContent size="lg" className="max-w-md" data-testid="panel">
                    <DialogTitle>Title</DialogTitle>
                    <DialogDescription>Text</DialogDescription>
                </DialogContent>
            </Dialog>,
        )
        const c = screen.getByTestId('panel').className
        expect(c).toContain('max-w-md')
        expect(c).not.toContain('max-w-[44rem]')
    })

    it('names the close control, and takes another name', () => {
        render(
            <Dialog defaultOpen>
                <DialogContent closeLabel="Close address">
                    <DialogTitle>Title</DialogTitle>
                    <DialogDescription>Text</DialogDescription>
                </DialogContent>
            </Dialog>,
        )
        expect(screen.getByRole('button', { name: 'Close address' })).toBeTruthy()
    })
})

// Parts used outside a DialogContent fall back to the centred grammar rather
// than throwing: they read a default context.
describe('Dialog parts outside a DialogContent', () => {
    it('render as the centred parts', () => {
        const { container } = render(
            <React.Fragment>
                <DialogHeader />
                <DialogBody />
                <DialogFooter />
            </React.Fragment>,
        )
        expect(container.querySelectorAll('div')).toHaveLength(3)
    })
})
