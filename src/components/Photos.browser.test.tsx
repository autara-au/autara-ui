/// <reference types="@vitest/browser/providers/playwright" />
/**
 * AUTM-1882: the photo components in a real Chromium, with the library's own
 * stylesheet: axe (WCAG 2.2 A and AA) on every state in light and dark, the
 * 44px targets measured, nothing moving as a photo loads, 200% text, a real
 * swipe in the viewer, and the pulses stopping under reduced motion.
 */
import '../../.storybook/storybook.css'
import axe from 'axe-core'
import { useState, type ReactNode } from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { commands } from '@vitest/browser/context'
import { afterEach, describe, expect, it } from 'vitest'
import { PhotoTile, type PhotoItem } from './PhotoTile'
import { PhotoAttachTray } from './PhotoAttachTray'
import { PhotoSlots } from './PhotoSlots'
import { ChatPhotoBubble, type ChatPhoto } from './ChatPhotoBubble'
import { PhotoViewer, type PhotoViewerPhoto } from './PhotoViewer'
import { MessageComposer } from './MessageComposer'
import { PHOTO_COPY } from '../lib/photo-copy'

const { dragAcross, reducedMotion } = commands as unknown as {
    dragAcross: (selector: string, dx: number) => Promise<void>
    reducedMotion: (on: boolean) => Promise<void>
}

afterEach(async () => {
    cleanup()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.fontSize = ''
    await reducedMotion(false)
})

/** A photo as a data URL, so nothing waits on the network. */
const photo = (fill: string, w = 400, h = 300) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${fill}"/><circle cx="${w / 2}" cy="${h / 2}" r="${h / 4}" fill="#333"/></svg>`
    )}`
const WHITE = photo('#ffffff')
const BLUE = photo('#2f6bd8')

const EVERY_STATE: PhotoItem[] = [
    { id: 'p', state: 'preparing' },
    { id: 'u', state: 'uploading', src: WHITE, progress: 0.4 },
    { id: 'n', state: 'uploading', src: BLUE, progress: null },
    { id: 'c', state: 'checking', src: WHITE },
    { id: 'r', state: 'ready', src: BLUE },
    { id: 'f', state: 'failed', failure: 'upload', src: WHITE },
    { id: 'k', state: 'failed', failure: 'check', src: BLUE },
    { id: 'x', state: 'refused' },
    { id: 'e', state: 'unavailable' },
]

async function violations(root: Element | Document = document): Promise<string[]> {
    const result = await axe.run(root as Element, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
        resultTypes: ['violations'],
    })
    return result.violations.map(
        (v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')})`
    )
}

function Page({ children }: { children: ReactNode }) {
    return <main className="bg-[var(--background)] p-4 text-[var(--text-strong)]">{children}</main>
}

const rect = (el: Element) => el.getBoundingClientRect()

describe('the axe harness', () => {
    it('does catch what it is here to catch (a nameless button, faint grey on white)', async () => {
        render(
            <Page>
                <button type="button" className="size-11" />
                <p style={{ color: '#bbbbbb', background: '#ffffff' }}>Too faint</p>
            </Page>
        )
        const found = (await violations()).join('\n')
        expect(found).toContain('button-name')
        expect(found).toContain('color-contrast')
    })
})

describe.each(['light', 'dark'] as const)('axe, %s', (theme) => {
    it('every tile state at each size has no WCAG A or AA violations', async () => {
        document.documentElement.setAttribute('data-theme', theme)
        render(
            <Page>
                {['4.5rem', '7rem', '11rem'].map((size) => (
                    <div key={size} className="flex flex-wrap gap-3">
                        {EVERY_STATE.map((item, i) => (
                            <div key={item.id} style={{ width: size }}>
                                <PhotoTile
                                    {...item}
                                    index={i + 1}
                                    total={EVERY_STATE.length}
                                    onRemove={() => {}}
                                    onRetry={() => {}}
                                    onOpen={() => {}}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </Page>
        )
        expect(await violations()).toEqual([])
    })

    it('the tray in the composer, with its lines, has none', async () => {
        document.documentElement.setAttribute('data-theme', theme)
        render(
            <Page>
                <MessageComposer
                    layout="inset"
                    value=""
                    onChange={() => {}}
                    onSend={() => {}}
                    canSend={false}
                    attachments={
                        <PhotoAttachTray
                            items={EVERY_STATE.slice(0, 8)}
                            message={PHOTO_COPY.overLimit(4)}
                            onRemove={() => {}}
                            onRetry={() => {}}
                            onOpen={() => {}}
                        />
                    }
                />
            </Page>
        )
        expect(await violations()).toEqual([])
    })

    it('the slots, empty and in use, have none', async () => {
        document.documentElement.setAttribute('data-theme', theme)
        render(
            <Page>
                <PhotoSlots slots={3} items={[]} label="Car photos" onFiles={() => {}} />
                <PhotoSlots
                    slots={5}
                    items={EVERY_STATE.slice(1, 5)}
                    label="Photos for Sam"
                    message={PHOTO_COPY.tooLarge}
                    onFiles={() => {}}
                    onRemove={() => {}}
                    onRetry={() => {}}
                    onOpen={() => {}}
                />
            </Page>
        )
        expect(await violations()).toEqual([])
    })

    it('the bubbles, one to four, both sides, with an erased photo, have none', async () => {
        document.documentElement.setAttribute('data-theme', theme)
        const shots: ChatPhoto[] = [
            { id: 'a', src: BLUE, width: 400, height: 300, alt: 'The car, front left' },
            { id: 'b', src: WHITE, width: 300, height: 400 },
            { id: 'c', state: 'unavailable', width: 1, height: 1 },
            { id: 'd', src: BLUE, width: 400, height: 400 },
        ]
        render(
            <Page>
                <div className="flex flex-col gap-3">
                    {[1, 2, 3, 4].map((n) => (
                        <ChatPhotoBubble key={`own-${n}`} side="own" photos={shots.slice(0, n)} caption="With words" onOpen={() => {}} />
                    ))}
                    {[1, 2, 3, 4].map((n) => (
                        <ChatPhotoBubble key={`in-${n}`} side="incoming" photos={shots.slice(0, n)} onOpen={() => {}} />
                    ))}
                </div>
            </Page>
        )
        expect(await violations()).toEqual([])
    })

    it('the viewer, open, has none', async () => {
        document.documentElement.setAttribute('data-theme', theme)
        render(
            <PhotoViewer
                open
                onOpenChange={() => {}}
                index={1}
                photos={[
                    { id: 'a', src: BLUE, width: 400, height: 300, alt: 'The car, front left' },
                    { id: 'b', src: WHITE, width: 400, height: 300 },
                    { id: 'c', state: 'unavailable' },
                ]}
                footer="From Alex, Fri 13 Nov"
            />
        )
        await screen.findByRole('dialog')
        expect(await violations()).toEqual([])
    })
})

describe('targets', () => {
    it('the remove is 44 x 44 on a 4.5rem tray tile, and every other control is at least 44px', async () => {
        render(
            <Page>
                <PhotoAttachTray items={EVERY_STATE.slice(0, 4)} onRemove={() => {}} />
                <PhotoSlots slots={3} items={[]} label="Car photos" onFiles={() => {}} />
            </Page>
        )
        for (const button of screen.getAllByRole('button', { name: /^Remove photo/ })) {
            const r = rect(button)
            expect(Math.round(r.width)).toBeGreaterThanOrEqual(44)
            expect(Math.round(r.height)).toBeGreaterThanOrEqual(44)
        }
        expect(rect(screen.getByRole('button', { name: 'Add a photo' })).height).toBeGreaterThanOrEqual(44)
    })

    it("the viewer's close, previous and next are at least 44px", async () => {
        render(
            <PhotoViewer
                open
                onOpenChange={() => {}}
                index={1}
                photos={['a', 'b', 'c'].map((id) => ({ id, src: BLUE, width: 400, height: 300 }))}
            />
        )
        for (const name of ['Close photos', 'Previous photo', 'Next photo']) {
            const r = rect(await screen.findByRole('button', { name }))
            expect(Math.round(r.width), name).toBeGreaterThanOrEqual(44)
            expect(Math.round(r.height), name).toBeGreaterThanOrEqual(44)
        }
    })
})

describe('no shift', () => {
    it('a bubble has its final size before its photos load, and keeps it after', async () => {
        const shots: ChatPhoto[] = [
            { id: 'a', src: photo('#2f6bd8', 600, 800), width: 600, height: 800 },
            { id: 'b', src: photo('#d82f6b', 800, 600), width: 800, height: 600 },
            { id: 'c', src: photo('#6bd82f', 800, 800), width: 800, height: 800 },
        ]
        const { container } = render(
            <div style={{ width: 390 }}>
                <ChatPhotoBubble side="own" photos={[shots[0]]} />
                <ChatPhotoBubble side="incoming" photos={shots} />
            </div>
        )
        const bubbles = Array.from(container.querySelectorAll('[role="group"]'))
        const before = bubbles.map((b) => [rect(b).width, rect(b).height])
        expect(before[0][1], 'a 3:4 photo is taller than wide').toBeGreaterThan(before[0][0])
        await waitFor(() => expect(container.querySelectorAll('[data-photo-cell="loaded"]')).toHaveLength(4))
        expect(bubbles.map((b) => [rect(b).width, rect(b).height])).toEqual(before)
    })

    it("the viewer's photo has its box before it loads", async () => {
        render(<PhotoViewer open onOpenChange={() => {}} photos={[{ id: 'a', src: photo('#2f6bd8', 800, 400), width: 800, height: 400 }]} />)
        const dialog = await screen.findByRole('dialog')
        const img = dialog.querySelector('img[alt="Photo 1 of 1"]') as HTMLImageElement
        const box = img.parentElement!
        const before = rect(box)
        expect(before.width / before.height).toBeCloseTo(2, 1)
        await img.decode()
        expect(rect(box).width).toBeCloseTo(before.width, 0)
        expect(rect(box).height).toBeCloseTo(before.height, 0)
    })
})

describe('200% text', () => {
    it('the tray tiles grow with the text and nothing is cut', async () => {
        document.documentElement.style.fontSize = '200%'
        render(<PhotoAttachTray items={EVERY_STATE.slice(0, 4)} message={PHOTO_COPY.overLimit(4)} onRemove={() => {}} />)
        const tiles = screen.getAllByRole('group')
        expect(Math.round(rect(tiles[0]).width)).toBe(144)
        for (const tile of tiles) expect(tile.scrollWidth).toBeLessThanOrEqual(tile.clientWidth + 1)
        expect(screen.getByText('You can add up to 4 photos.')).toBeVisible()
    })

    it('a 7rem slot still shows its short words in full', async () => {
        document.documentElement.style.fontSize = '200%'
        render(
            <div style={{ width: '7rem' }}>
                <PhotoTile state="uploading" src={BLUE} progress={0.5} />
            </div>
        )
        const caption = screen.getByText('Uploading photo', { selector: 'span[aria-hidden="true"]' })
        expect(caption).toBeVisible()
        const tile = screen.getByRole('group')
        expect(rect(caption).bottom).toBeLessThanOrEqual(rect(tile).bottom + 0.5)
    })
})

function SwipeViewer({ photos }: { photos: PhotoViewerPhoto[] }) {
    const [index, setIndex] = useState(0)
    return <PhotoViewer open onOpenChange={() => {}} photos={photos} index={index} onIndexChange={setIndex} />
}

describe('swipe', () => {
    const three = ['a', 'b', 'c'].map((id) => ({ id, src: BLUE, width: 400, height: 300 }))

    it('a drag past a fifth of the width goes to the next photo and back; a short one settles', async () => {
        render(<SwipeViewer photos={three} />)
        await screen.findByText('1 of 3')
        await dragAcross('[data-photo-stage]', -220)
        await screen.findByText('2 of 3')
        await dragAcross('[data-photo-stage]', 220)
        await screen.findByText('1 of 3')
        await dragAcross('[data-photo-stage]', -20)
        expect(screen.getByText('1 of 3')).toBeInTheDocument()
        // Past the first photo there is nothing to go to.
        await dragAcross('[data-photo-stage]', 260)
        expect(screen.getByText('1 of 3')).toBeInTheDocument()
    })
})

describe('reduced motion', () => {
    it('the skeleton and the breathing ring stand still', async () => {
        await reducedMotion(true)
        const { container } = render(
            <div className="flex gap-2">
                <div className="w-[7rem]">
                    <PhotoTile state="preparing" />
                </div>
                <div className="w-[7rem]">
                    <PhotoTile state="uploading" src={BLUE} progress={null} />
                </div>
            </div>
        )
        for (const el of Array.from(container.querySelectorAll('.motion-skeleton'))) {
            const style = getComputedStyle(el)
            expect(style.animationName === 'none' || parseFloat(style.animationDuration) < 0.02).toBe(true)
        }
    })
})
