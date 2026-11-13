import { useRef, useState } from 'react'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PhotoTile, type PhotoItem } from './PhotoTile'
import { PhotoAttachTray, photosInFlight, photosReadyToSend } from './PhotoAttachTray'
import { PhotoSlots } from './PhotoSlots'
import { ChatPhotoBubble, chatPhotoLayout } from './ChatPhotoBubble'
import { PhotoViewer, type PhotoViewerPhoto } from './PhotoViewer'
import { MessageComposer } from './MessageComposer'
import { PHOTO_COPY } from '../lib/photo-copy'

/**
 * AUTM-1882: the photo components' names, states, words and keyboard paths,
 * in jsdom. What needs a real browser (44px measured, nothing shifting as a
 * photo loads, axe in both themes, 200% text, a real swipe) is in
 * Photos.browser.test.tsx.
 */

afterEach(cleanup)

const SRC = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='

describe('PhotoTile', () => {
    it('names its remove "Remove photo 2 of 3" and runs it', async () => {
        const onRemove = vi.fn()
        render(<PhotoTile state="ready" src={SRC} index={2} total={3} onRemove={onRemove} />)
        expect(screen.getByRole('group', { name: 'Photo 2 of 3' })).toBeInTheDocument()
        await userEvent.click(screen.getByRole('button', { name: 'Remove photo 2 of 3' }))
        expect(onRemove).toHaveBeenCalledOnce()
    })

    it('says "Remove photo" with no place, and takes a label of the caller', () => {
        const { rerender } = render(<PhotoTile state="ready" src={SRC} onRemove={() => {}} />)
        expect(screen.getByRole('button', { name: 'Remove photo' })).toBeInTheDocument()
        rerender(<PhotoTile state="ready" src={SRC} onRemove={() => {}} removeLabel="Remove the cover photo" />)
        expect(screen.getByRole('button', { name: 'Remove the cover photo' })).toBeInTheDocument()
    })

    it('draws the remove as a 44px target in every state', () => {
        for (const state of ['preparing', 'uploading', 'checking', 'ready', 'failed', 'refused', 'unavailable'] as const) {
            render(<PhotoTile state={state} src={SRC} onRemove={() => {}} onRetry={() => {}} />)
            expect(screen.getByRole('button', { name: 'Remove photo' })).toHaveClass('size-11')
            cleanup()
        }
    })

    it('says each state once, politely, in the plan words', () => {
        const said = (state: Parameters<typeof PhotoTile>[0]['state'], extra = {}) => {
            render(<PhotoTile state={state} src={SRC} {...extra} />)
            const text = screen.getByRole('status').textContent
            cleanup()
            return text
        }
        expect(said('preparing')).toBe('Preparing photo')
        expect(said('uploading')).toBe(PHOTO_COPY.uploading)
        expect(said('checking')).toBe(PHOTO_COPY.checking)
        expect(said('ready')).toBe('')
        expect(said('failed')).toBe("Upload didn't finish. Tap to retry.")
        expect(said('failed', { failure: 'check' })).toBe("We couldn't check this photo. Try again.")
        expect(said('refused')).toBe("This photo can't be sent. It breaks our photo rules.")
        expect(said('refused', { reason: "This photo can't be posted. It breaks our photo rules." })).toBe(
            "This photo can't be posted. It breaks our photo rules."
        )
        expect(said('unavailable')).toBe('Photo no longer available')
    })

    it('shows upload progress as a progressbar with its value, or none while it is unknown', () => {
        const { rerender } = render(<PhotoTile state="uploading" src={SRC} progress={0.42} index={1} total={2} />)
        const bar = screen.getByRole('progressbar', { name: 'Uploading photo, photo 1 of 2' })
        expect(bar).toHaveAttribute('aria-valuenow', '42')
        rerender(<PhotoTile state="uploading" src={SRC} progress={null} index={1} total={2} />)
        expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow')
        rerender(<PhotoTile state="uploading" src={SRC} progress={3} />)
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    })

    it('makes the whole tile the retry for a failure, and never for a refusal', async () => {
        const onRetry = vi.fn()
        const { rerender } = render(<PhotoTile state="failed" src={SRC} onRetry={onRetry} />)
        await userEvent.click(screen.getByRole('button', { name: "Upload didn't finish. Tap to retry." }))
        expect(onRetry).toHaveBeenCalledOnce()
        rerender(<PhotoTile state="failed" failure="check" src={SRC} onRetry={onRetry} />)
        expect(screen.getByRole('button', { name: "We couldn't check this photo. Try again." })).toBeInTheDocument()
        rerender(<PhotoTile state="refused" src={SRC} onRetry={onRetry} onRemove={() => {}} />)
        expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Remove photo'])
    })

    it('does not draw a refused photo again, nor an erased one', () => {
        const { container, rerender } = render(<PhotoTile state="refused" src={SRC} />)
        expect(container.querySelector('img')).toBeNull()
        rerender(<PhotoTile state="unavailable" src={SRC} />)
        expect(container.querySelector('img')).toBeNull()
        rerender(<PhotoTile state="ready" src={SRC} />)
        expect(container.querySelector('img')).not.toBeNull()
    })

    it('opens a ready photo from a button that says it opens a dialog', async () => {
        const onOpen = vi.fn()
        render(<PhotoTile state="ready" src={SRC} index={1} total={3} onOpen={onOpen} />)
        const open = screen.getByRole('button', { name: 'Open photo 1 of 3' })
        expect(open).toHaveAttribute('aria-haspopup', 'dialog')
        await userEvent.click(open)
        expect(onOpen).toHaveBeenCalledOnce()
    })

    it("gives the person's description of the photo to the open button, or to the tile", () => {
        const { rerender } = render(<PhotoTile state="ready" src={SRC} alt="Scuff on the rear bumper" onOpen={() => {}} />)
        expect(screen.getByRole('button', { name: 'Open photo' })).toHaveAccessibleDescription('Scuff on the rear bumper')
        rerender(<PhotoTile state="uploading" src={SRC} alt="Scuff on the rear bumper" />)
        expect(screen.getByRole('group', { name: 'Photo' })).toHaveAccessibleDescription('Scuff on the rear bumper')
    })

    it('falls back and asks for a fresh URL when the photo fails to load', () => {
        const onImageError = vi.fn()
        const { container } = render(<PhotoTile state="ready" src="https://example.invalid/x.jpg" onImageError={onImageError} onOpen={() => {}} />)
        fireEvent.error(container.querySelector('img')!)
        expect(onImageError).toHaveBeenCalledOnce()
        expect(container.querySelector('img')).toBeNull()
        expect(screen.queryByRole('button', { name: /^Open/ })).toBeNull()
    })
})

function Tray({ initial, onLast }: { initial: PhotoItem[]; onLast?: () => void }) {
    const [items, setItems] = useState(initial)
    const field = useRef<HTMLTextAreaElement>(null)
    return (
        <>
            <PhotoAttachTray
                items={items}
                onRemove={(id) => setItems((all) => all.filter((p) => p.id !== id))}
                focusAfterLast={() => {
                    onLast?.()
                    return field.current
                }}
            />
            <textarea ref={field} aria-label="Message" />
        </>
    )
}

describe('PhotoAttachTray', () => {
    const three: PhotoItem[] = [
        { id: 'a', state: 'ready', src: SRC },
        { id: 'b', state: 'uploading', src: SRC, progress: 0.5 },
        { id: 'c', state: 'checking', src: SRC },
    ]

    it('draws nothing with no photos and no message', () => {
        const { container } = render(<PhotoAttachTray items={[]} />)
        expect(container).toBeEmptyDOMElement()
    })

    it('is a named list of tiles, each with its place in its remove', () => {
        render(<PhotoAttachTray items={three} onRemove={() => {}} />)
        const list = screen.getByRole('list', { name: 'Photos to send' })
        expect(within(list).getAllByRole('listitem')).toHaveLength(3)
        expect(screen.getByRole('button', { name: 'Remove photo 1 of 3' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Remove photo 3 of 3' })).toBeInTheDocument()
    })

    it('prints each distinct failure and refusal once under the row, and announces its own message', () => {
        const { container } = render(
            <PhotoAttachTray
                items={[
                    { id: 'a', state: 'failed', src: SRC },
                    { id: 'b', state: 'failed', src: SRC },
                    { id: 'c', state: 'refused' },
                ]}
                message={PHOTO_COPY.overLimit(4)}
            />
        )
        // The lines under the row: drawn once each, not read (each tile says its own).
        const notes = Array.from(container.querySelectorAll('p[aria-hidden="true"]')).map((p) => p.textContent)
        expect(notes).toEqual(["Upload didn't finish. Tap to retry.", "This photo can't be sent. It breaks our photo rules."])
        const statuses = screen.getAllByRole('status').map((s) => s.textContent)
        expect(statuses).toContain('You can add up to 4 photos.')
    })

    it('moves focus to the remove now in that place, then the one before, then the message field', async () => {
        const onLast = vi.fn()
        render(<Tray initial={three} onLast={onLast} />)
        await userEvent.click(screen.getByRole('button', { name: 'Remove photo 2 of 3' }))
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove photo 2 of 2' }))
        await userEvent.click(screen.getByRole('button', { name: 'Remove photo 2 of 2' }))
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove photo 1 of 1' }))
        await userEvent.click(screen.getByRole('button', { name: 'Remove photo 1 of 1' }))
        expect(onLast).toHaveBeenCalled()
        expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Message' }))
    })

    it('says when Send may go', () => {
        expect(photosReadyToSend([])).toBe(false)
        expect(photosReadyToSend([{ state: 'ready' }, { state: 'ready' }])).toBe(true)
        expect(photosReadyToSend([{ state: 'ready' }, { state: 'checking' }])).toBe(false)
        expect(photosReadyToSend([{ state: 'ready' }, { state: 'refused' }])).toBe(false)
        expect(photosInFlight([{ state: 'ready' }, { state: 'uploading' }])).toBe(true)
        expect(photosInFlight([{ state: 'failed' }, { state: 'refused' }])).toBe(false)
    })
})

describe('PhotoSlots', () => {
    const file = (name: string) => new File(['x'], name, { type: 'image/jpeg' })

    it('makes the first empty slot "Add a photo" and draws the rest numbered and inert', () => {
        const { container } = render(<PhotoSlots slots={3} items={[]} label="Car photos" onFiles={() => {}} />)
        expect(screen.getByRole('list', { name: 'Car photos' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Add a photo' })).toBeInTheDocument()
        const empties = container.querySelectorAll('[data-photo-slot="empty"]')
        expect(empties).toHaveLength(2)
        expect(Array.from(empties).map((e) => e.textContent)).toEqual(['2', '3'])
        expect(empties[0]).toHaveAttribute('aria-hidden', 'true')
    })

    it('hands over only as many files as there are free slots, and says why', async () => {
        const onFiles = vi.fn()
        const { container } = render(
            <PhotoSlots slots={3} items={[{ id: 'a', state: 'ready', src: SRC }]} label="Car photos" onFiles={onFiles} />
        )
        const input = container.querySelector('input[type="file"]') as HTMLInputElement
        expect(input.accept).toContain('image/heic')
        expect(input.multiple).toBe(true)
        await userEvent.upload(input, [file('1.jpg'), file('2.jpg'), file('3.jpg'), file('4.jpg')])
        expect(onFiles).toHaveBeenCalledOnce()
        expect(onFiles.mock.calls[0][0].map((f: File) => f.name)).toEqual(['1.jpg', '2.jpg'])
        expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('You can add up to 3 photos.')
    })

    it('opens the picker from the add slot', async () => {
        const { container } = render(<PhotoSlots slots={3} items={[]} label="Car photos" onFiles={() => {}} />)
        const input = container.querySelector('input[type="file"]') as HTMLInputElement
        const click = vi.spyOn(input, 'click')
        await userEvent.click(screen.getByRole('button', { name: 'Add a photo' }))
        expect(click).toHaveBeenCalledOnce()
    })

    it('runs onAdd when the caller opens its own chooser', async () => {
        const onAdd = vi.fn()
        const { container } = render(<PhotoSlots slots={3} items={[]} label="Car photos" onAdd={onAdd} />)
        expect(container.querySelector('input[type="file"]')).toBeNull()
        await userEvent.click(screen.getByRole('button', { name: 'Add a photo' }))
        expect(onAdd).toHaveBeenCalledOnce()
    })

    it('has no add slot when full', () => {
        const full: PhotoItem[] = ['a', 'b', 'c'].map((id) => ({ id, state: 'ready', src: SRC }))
        render(<PhotoSlots slots={3} items={full} label="Car photos" onFiles={() => {}} />)
        expect(screen.queryByRole('button', { name: 'Add a photo' })).toBeNull()
    })

    it('sends focus to the add slot when the last photo goes', async () => {
        function Slots() {
            const [items, setItems] = useState<PhotoItem[]>([{ id: 'a', state: 'ready', src: SRC }])
            return (
                <PhotoSlots
                    slots={3}
                    items={items}
                    label="Car photos"
                    onFiles={() => {}}
                    onRemove={(id) => setItems((all) => all.filter((p) => p.id !== id))}
                />
            )
        }
        render(<Slots />)
        await userEvent.click(screen.getByRole('button', { name: 'Remove photo 1 of 1' }))
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Add a photo' }))
    })
})

describe('ChatPhotoBubble', () => {
    const p = (id: string, width: number, height: number) => ({ id, src: SRC, width, height })

    it('lays out one to four from their sizes, before anything loads', () => {
        expect(chatPhotoLayout([p('a', 800, 600)]).ratio).toBeCloseTo(4 / 3)
        expect(chatPhotoLayout([p('a', 600, 800)]).ratio).toBeCloseTo(3 / 4)
        expect(chatPhotoLayout([p('a', 600, 1600)]).ratio).toBeCloseTo(3 / 4)
        expect(chatPhotoLayout([p('a', 1600, 400)]).ratio).toBeCloseTo(16 / 9)
        expect(chatPhotoLayout([p('a', 1, 1), p('b', 1, 1)]).ratio).toBe(2)
        expect(chatPhotoLayout([p('a', 1, 1), p('b', 1, 1), p('c', 1, 1)]).template).toBe('"a b" "a c"')
        expect(chatPhotoLayout([p('a', 1, 1), p('b', 1, 1), p('c', 1, 1), p('d', 1, 1)]).template).toBe('"a b" "c d"')
    })

    it('sets the bubble shape on first render', () => {
        const { container } = render(<ChatPhotoBubble side="own" photos={[p('a', 600, 800)]} />)
        const grid = container.querySelector('.grid') as HTMLElement
        expect(grid.style.aspectRatio).toBe('0.75')
    })

    it('names the group and opens the photo tapped, with its alt text as the description', async () => {
        const onOpen = vi.fn()
        render(
            <ChatPhotoBubble
                side="incoming"
                photos={[p('a', 1, 1), { ...p('b', 1, 1), alt: 'Dog hair on the back seat' }, p('c', 1, 1)]}
                onOpen={onOpen}
            />
        )
        expect(screen.getByRole('group', { name: '3 photos' })).toBeInTheDocument()
        const second = screen.getByRole('button', { name: 'Open photo 2 of 3' })
        expect(second).toHaveAccessibleDescription('Dog hair on the back seat')
        await userEvent.click(second)
        expect(onOpen).toHaveBeenCalledWith(1)
    })

    it('keeps an erased photo in its place and says so, with nothing to open', () => {
        render(<ChatPhotoBubble side="own" photos={[p('a', 1, 1), { ...p('b', 1, 1), state: 'unavailable' }]} onOpen={() => {}} />)
        expect(screen.getByText('Photo no longer available')).toBeInTheDocument()
        expect(screen.getAllByRole('button')).toHaveLength(1)
    })

    it('draws at most four, the caption inside the bubble, and nothing for none', () => {
        const { container, rerender } = render(
            <ChatPhotoBubble side="own" photos={['a', 'b', 'c', 'd', 'e'].map((id) => p(id, 1, 1))} caption="Before and after" />
        )
        expect(container.querySelectorAll('[data-photo-cell]')).toHaveLength(4)
        expect(screen.getByText('Before and after')).toBeInTheDocument()
        rerender(<ChatPhotoBubble side="own" photos={[]} />)
        expect(container).toBeEmptyDOMElement()
    })

    it('fades a photo in on its own load, over a placeholder', () => {
        const { container } = render(<ChatPhotoBubble side="own" photos={[p('a', 1, 1)]} />)
        const cell = container.querySelector('[data-photo-cell]')!
        expect(cell).toHaveAttribute('data-photo-cell', 'loading')
        const img = cell.querySelector('img')!
        expect(img).toHaveClass('opacity-0')
        fireEvent.load(img)
        expect(cell).toHaveAttribute('data-photo-cell', 'loaded')
        expect(img).toHaveClass('opacity-100')
    })
})

describe('PhotoViewer', () => {
    const photos: PhotoViewerPhoto[] = [
        { id: 'a', src: SRC, alt: 'The car, front left', width: 4, height: 3 },
        { id: 'b', src: SRC, alt: 'The back seat', width: 3, height: 4 },
        { id: 'c', src: SRC, width: 1, height: 1 },
    ]

    function Viewer({ start = 0, onClose }: { start?: number; onClose?: () => void }) {
        const [open, setOpen] = useState(false)
        const [index, setIndex] = useState(start)
        return (
            <>
                <button type="button" onClick={() => setOpen(true)}>
                    Open the photos
                </button>
                <PhotoViewer
                    photos={photos}
                    open={open}
                    onOpenChange={(o) => {
                        setOpen(o)
                        if (!o) onClose?.()
                    }}
                    index={index}
                    onIndexChange={setIndex}
                />
            </>
        )
    }

    it('is a named dialog with its close, its count and the photo alt text', async () => {
        render(<Viewer />)
        await userEvent.click(screen.getByRole('button', { name: 'Open the photos' }))
        const dialog = screen.getByRole('dialog', { name: 'Photos' })
        expect(within(dialog).getByRole('button', { name: 'Close photos' })).toBeInTheDocument()
        expect(within(dialog).getByText('1 of 3')).toBeInTheDocument()
        expect(within(dialog).getByRole('img', { name: 'The car, front left' })).toBeInTheDocument()
        expect(within(dialog).queryByRole('button', { name: 'Previous photo' })).toBeNull()
        expect(within(dialog).getByRole('button', { name: 'Next photo' })).toBeInTheDocument()
    })

    it('moves with the arrow keys and says where it is, with "Photo 3 of 3" for a photo with no alt', async () => {
        render(<Viewer />)
        await userEvent.click(screen.getByRole('button', { name: 'Open the photos' }))
        await userEvent.keyboard('{ArrowRight}')
        expect(screen.getByText('2 of 3')).toBeInTheDocument()
        expect(screen.getByRole('img', { name: 'The back seat' })).toBeInTheDocument()
        await userEvent.keyboard('{ArrowRight}{ArrowRight}')
        expect(screen.getByText('3 of 3')).toBeInTheDocument()
        expect(screen.getByRole('img', { name: 'Photo 3 of 3' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Next photo' })).toBeNull()
        await userEvent.keyboard('{ArrowLeft}')
        expect(screen.getByText('2 of 3')).toBeInTheDocument()
    })

    it('puts focus on the other arrow when the one pressed is gone at the end', async () => {
        render(<Viewer start={1} />)
        await userEvent.click(screen.getByRole('button', { name: 'Open the photos' }))
        await userEvent.click(screen.getByRole('button', { name: 'Next photo' }))
        expect(screen.getByText('3 of 3')).toBeInTheDocument()
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Previous photo' }))
    })

    it('traps Tab inside, closes on Escape and gives focus back to what opened it', async () => {
        const onClose = vi.fn()
        render(<Viewer onClose={onClose} />)
        const opener = screen.getByRole('button', { name: 'Open the photos' })
        await userEvent.click(opener)
        const dialog = screen.getByRole('dialog')
        for (let i = 0; i < 4; i++) {
            await userEvent.tab()
            expect(dialog.contains(document.activeElement)).toBe(true)
        }
        await userEvent.keyboard('{Escape}')
        expect(onClose).toHaveBeenCalledOnce()
        await act(async () => {
            await new Promise((r) => setTimeout(r, 0))
        })
        expect(document.activeElement).toBe(opener)
    })

    it('says an erased photo is no longer available, and shows no count or arrows for one photo', () => {
        const { rerender } = render(
            <PhotoViewer open onOpenChange={() => {}} photos={[{ id: 'x', state: 'unavailable' }, photos[0]]} />
        )
        expect(screen.getByText('Photo no longer available')).toBeInTheDocument()
        rerender(<PhotoViewer open onOpenChange={() => {}} photos={[photos[0]]} />)
        expect(screen.queryByText(/of 1/)).toBeNull()
        expect(screen.queryByRole('button', { name: /photo$/ })).toBeNull()
    })
})

describe('MessageComposer with photos (AUTM-1882)', () => {
    it('lets Send go with no words when the caller says so, and holds it when told to', async () => {
        const onSend = vi.fn()
        const { rerender } = render(
            <MessageComposer layout="inset" value="" onChange={() => {}} onSend={onSend} canSend attachments={<p>tray</p>} />
        )
        await userEvent.click(screen.getByRole('button', { name: 'Send' }))
        expect(onSend).toHaveBeenCalledOnce()
        rerender(<MessageComposer layout="inset" value="Hello" onChange={() => {}} onSend={onSend} canSend={false} />)
        expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
    })

    it('puts the attachments inside the inset field, above the text, and above the row in dock', () => {
        const { container, rerender } = render(
            <MessageComposer layout="inset" value="" onChange={() => {}} onSend={() => {}} attachments={<p>tray</p>} />
        )
        const field = container.querySelector('[data-composer-field]')!
        expect(field.firstElementChild).toHaveAttribute('data-composer-attachments')
        expect(field).toHaveClass('flex-wrap')
        rerender(<MessageComposer value="" onChange={() => {}} onSend={() => {}} attachments={<p>tray</p>} />)
        expect(container.querySelector('[data-composer-attachments]')).toHaveTextContent('tray')
    })

    it('is unchanged without them', () => {
        const { container } = render(<MessageComposer layout="inset" value="" onChange={() => {}} onSend={() => {}} />)
        expect(container.querySelector('[data-composer-attachments]')).toBeNull()
        expect(container.querySelector('[data-composer-field]')).not.toHaveClass('flex-wrap')
        expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
    })
})
