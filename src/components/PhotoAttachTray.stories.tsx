import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PhotoAttachTray, photosInFlight, photosReadyToSend } from './PhotoAttachTray'
import type { PhotoItem } from './PhotoTile'
import { MessageComposer } from './MessageComposer'
import { MessageThread, type MessageItem } from './MessageThread'
import { ComposerAttachMenu, attachMenuGlyphs } from './ComposerAttachMenu'
import { ChatPhotoBubble, type ChatPhoto } from './ChatPhotoBubble'
import { PhotoViewer, type PhotoViewerPhoto } from './PhotoViewer'
import { PHOTO_COPY, photoErrorMessage } from '../lib/photo-copy'
import { PHOTO_ACCEPT, isPreparePhotoError, preparePhoto } from '../lib/prepare-photo'

/**
 * AUTM-1882. The photos waiting to go with a message, checked in the tray
 * before Send. Every state and every refusal line of the plan's states table,
 * in light and dark, and the whole chat moment live ("In context: the
 * booking chat"), with the real preparePhoto on a photo you pick.
 *
 * Mobbin: Substack's thumbnail in the composer and Cursor's tiles inside the
 * field (steal); their small corner crosses (avoid: ours is a 44px target).
 */
const meta: Meta<typeof PhotoAttachTray> = {
    title: 'Photos/PhotoAttachTray',
    component: PhotoAttachTray,
    parameters: { layout: 'padded' },
    args: { items: [], onRemove: () => {}, onRetry: () => {}, onOpen: () => {} },
    decorators: [
        (Story) => (
            <div className="max-w-[26rem]">
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof PhotoAttachTray>

const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&h=400&q=70`
const CAR = U('photo-1607860108855-64acf2078ed9')
const SPORT = U('photo-1503376780353-7e6692767b70')
const INTERIOR = U('photo-1601362840469-51e4d8d58785')
const BAY = U('photo-1542362567-b07e54358753')

export const ThreeOnTheirWay: Story = {
    args: {
        items: [
            { id: 'a', state: 'ready', src: CAR },
            { id: 'b', state: 'uploading', src: SPORT, progress: 0.6 },
            { id: 'c', state: 'checking', src: INTERIOR },
        ],
    },
}

const EVERY_STATE: PhotoItem[] = [
    { id: 'p', state: 'preparing' },
    { id: 'u', state: 'uploading', src: SPORT, progress: 0.35 },
    { id: 'c', state: 'checking', src: INTERIOR },
    { id: 'r', state: 'ready', src: CAR },
    { id: 'f', state: 'failed', failure: 'upload', src: BAY },
    { id: 'k', state: 'failed', failure: 'check', src: SPORT },
    { id: 'x', state: 'refused' },
    { id: 'e', state: 'unavailable' },
]

/** One tile in each state. The failure and refusal words go once under the row. */
export const EveryStateLight: Story = { globals: { theme: 'light' }, args: { items: EVERY_STATE } }
export const EveryStateDark: Story = { globals: { theme: 'dark' }, args: { items: EVERY_STATE } }

/** preparePhoto said NOT_IMAGE or CANT_OPEN (a HEIC in Chrome). */
export const WrongType: Story = {
    args: { items: [{ id: 'a', state: 'ready', src: CAR }], message: photoErrorMessage('CANT_OPEN') },
}
/** preparePhoto said TOO_LARGE. */
export const TooLarge: Story = {
    args: { items: [{ id: 'a', state: 'ready', src: CAR }], message: photoErrorMessage('TOO_LARGE') },
}
/** preparePhoto said TOO_SMALL. */
export const TooSmall: Story = { args: { items: [], message: photoErrorMessage('TOO_SMALL') } }
/** Five picked, four allowed: the four went in, and the line says why the fifth did not. */
export const OverTheLimit: Story = {
    args: {
        items: [
            { id: 'a', state: 'ready', src: CAR },
            { id: 'b', state: 'ready', src: SPORT },
            { id: 'c', state: 'ready', src: INTERIOR },
            { id: 'd', state: 'uploading', src: BAY, progress: 0.2 },
        ],
        message: PHOTO_COPY.overLimit(4),
    },
}
/** Every refusal line at once, dark. */
export const RefusalLinesDark: Story = {
    globals: { theme: 'dark' },
    render: () => (
        <div className="flex flex-col gap-6">
            {(['CANT_OPEN', 'TOO_LARGE', 'TOO_SMALL'] as const).map((code) => (
                <PhotoAttachTray key={code} items={[]} message={photoErrorMessage(code)} />
            ))}
            <PhotoAttachTray items={[{ id: 'a', state: 'ready', src: CAR }]} message={PHOTO_COPY.overLimit(4)} />
        </div>
    ),
}

function Composer({ items, text = '' }: { items: PhotoItem[]; text?: string }) {
    const [value, setValue] = useState(text)
    return (
        <MessageComposer
            layout="inset"
            value={value}
            onChange={setValue}
            onSend={() => {}}
            placeholder="Message Sam"
            leading={
                <ComposerAttachMenu
                    items={[
                        { id: 'camera', label: 'Take a photo', icon: attachMenuGlyphs.camera, onSelect: () => {} },
                        { id: 'photos', label: 'Choose photos', icon: attachMenuGlyphs.photos, onSelect: () => {} },
                    ]}
                    footnote="Only you and Sam can see photos in this chat."
                />
            }
            attachments={<PhotoAttachTray items={items} onRemove={() => {}} onRetry={() => {}} />}
            canSend={photosReadyToSend(items) || (value.trim() !== '' && !photosInFlight(items))}
        />
    )
}

/** Inside the composer's field, above the text. Send waits: one photo is still being checked. */
export const InComposerLight: Story = {
    globals: { theme: 'light' },
    render: () => (
        <Composer
            items={[
                { id: 'a', state: 'ready', src: CAR },
                { id: 'b', state: 'checking', src: INTERIOR },
            ]}
            text="Here's the scuff I mentioned"
        />
    ),
}
export const InComposerDark: Story = {
    globals: { theme: 'dark' },
    render: () => <Composer items={[{ id: 'a', state: 'ready', src: CAR }, { id: 'b', state: 'refused' }]} />,
}

/* ─── In context: the booking chat, live ────────────────────────────────── */

type Outcome = 'ok' | 'upload' | 'check' | 'refused'
type TrayPhoto = PhotoItem & { width?: number; height?: number }

const SEED: MessageItem[] = [
    { id: 'm1', side: 'incoming', text: 'Hi Alex, see you Saturday at 9. Anything I should know about the car?', createdAt: '2026-11-13T09:02:00+11:00' },
]

function ChatWithPhotos() {
    const MAX = 4
    const [photos, setPhotos] = useState<TrayPhoto[]>([])
    const [text, setText] = useState('')
    const [line, setLine] = useState<string | null>(null)
    const [thread, setThread] = useState<MessageItem[]>(SEED)
    const [viewer, setViewer] = useState<{ photos: PhotoViewerPhoto[]; index: number } | null>(null)
    const [next, setNext] = useState<Outcome>('ok')
    const nextRef = useRef<Outcome>('ok')
    nextRef.current = next
    const camera = useRef<HTMLInputElement>(null)
    const library = useRef<HTMLInputElement>(null)
    const field = useRef<HTMLDivElement>(null)
    const timers = useRef<number[]>([])
    useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

    const update = (id: string, patch: Partial<TrayPhoto>) =>
        setPhotos((all) => all.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    const later = (ms: number, run: () => void) => timers.current.push(window.setTimeout(run, ms))

    // Stands in for requestPhotoUpload, the PUT and confirmPhotoUpload.
    function upload(id: string, outcome: Outcome) {
        update(id, { state: 'uploading', progress: 0, failure: undefined })
        let p = 0
        const step = () => {
            p += 0.2
            if (outcome === 'upload' && p >= 0.6) return update(id, { state: 'failed', failure: 'upload' })
            if (p < 1) {
                update(id, { progress: p })
                return later(220, step)
            }
            update(id, { state: 'checking' })
            later(900, () => {
                if (outcome === 'check') update(id, { state: 'failed', failure: 'check' })
                else if (outcome === 'refused') update(id, { state: 'refused', src: null })
                else update(id, { state: 'ready' })
            })
        }
        later(220, step)
    }

    async function add(files: File[]) {
        setLine(null)
        const room = MAX - photos.length
        if (files.length > room) setLine(PHOTO_COPY.overLimit(MAX))
        for (const file of files.slice(0, room)) {
            const id = Math.random().toString(36).slice(2)
            setPhotos((all) => [...all, { id, state: 'preparing' }])
            try {
                const prepared = await preparePhoto(file)
                update(id, { src: URL.createObjectURL(prepared.blob), width: prepared.width, height: prepared.height })
                upload(id, nextRef.current)
            } catch (error) {
                setPhotos((all) => all.filter((p) => p.id !== id))
                setLine(isPreparePhotoError(error) ? photoErrorMessage(error.code) : PHOTO_COPY.wrongType)
            }
        }
    }

    function send() {
        const ready = photos.filter((p) => p.state === 'ready')
        const shots: ChatPhoto[] = ready.map((p) => ({ id: p.id, src: p.src, width: p.width ?? 1, height: p.height ?? 1 }))
        const caption = text.trim() || undefined
        const id = `m${thread.length + 1}`
        setThread((all) => [
            ...all,
            {
                id,
                side: 'own',
                createdAt: new Date(),
                ...(shots.length
                    ? {
                          body: (
                              <ChatPhotoBubble
                                  side="own"
                                  photos={shots}
                                  caption={caption}
                                  onOpen={(index) => setViewer({ photos: shots, index })}
                              />
                          ),
                      }
                    : { text: caption }),
            },
        ])
        setPhotos([])
        setText('')
        setLine(null)
    }

    const canSend = photosReadyToSend(photos) || (text.trim() !== '' && !photosInFlight(photos))

    return (
        <div className="flex flex-col gap-3">
            <fieldset className="flex flex-wrap items-center gap-2 text-[0.8125rem] text-[var(--text-muted)]">
                <legend className="mb-1 font-medium text-[var(--text-strong)]">The next photo you add (story control)</legend>
                {(
                    [
                        ['ok', 'Goes through'],
                        ['upload', 'Upload fails'],
                        ['check', 'Check unavailable'],
                        ['refused', 'Is refused'],
                    ] as const
                ).map(([value, name]) => (
                    <label key={value} className="flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--band)] px-3">
                        <input type="radio" name="outcome" checked={next === value} onChange={() => setNext(value)} />
                        {name}
                    </label>
                ))}
            </fieldset>
            <div className="flex h-[40rem] max-w-[27.5rem] flex-col rounded-[1.25rem] bg-[var(--paper)]">
                <MessageThread items={thread} anchor="end" fadeTop logLabel="Messages with Sam" />
                <div ref={field}>
                    <MessageComposer
                        layout="inset"
                        value={text}
                        onChange={setText}
                        onSend={send}
                        placeholder="Message Sam"
                        canSend={canSend}
                        leading={
                            <ComposerAttachMenu
                                items={[
                                    {
                                        id: 'camera',
                                        label: 'Take a photo',
                                        icon: attachMenuGlyphs.camera,
                                        onSelect: () => camera.current?.click(),
                                    },
                                    {
                                        id: 'photos',
                                        label: 'Choose photos',
                                        icon: attachMenuGlyphs.photos,
                                        onSelect: () => library.current?.click(),
                                    },
                                ]}
                                footnote="Only you and Sam can see photos in this chat."
                            />
                        }
                        attachments={
                            photos.length || line ? (
                                <PhotoAttachTray
                                    items={photos}
                                    message={line}
                                    onRemove={(id) => setPhotos((all) => all.filter((p) => p.id !== id))}
                                    onRetry={(id) => upload(id, 'ok')}
                                    onOpen={(_, index) =>
                                        setViewer({
                                            photos: photos.map((p) => ({ id: p.id, src: p.src, width: p.width, height: p.height })),
                                            index,
                                        })
                                    }
                                    focusAfterLast={() => field.current?.querySelector('textarea')}
                                />
                            ) : undefined
                        }
                    />
                </div>
                <input
                    ref={camera}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={(e) => {
                        void add(Array.from(e.target.files ?? []))
                        e.target.value = ''
                    }}
                />
                <input
                    ref={library}
                    type="file"
                    accept={PHOTO_ACCEPT}
                    multiple
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={(e) => {
                        void add(Array.from(e.target.files ?? []))
                        e.target.value = ''
                    }}
                />
            </div>
            {viewer ? (
                <PhotoViewer
                    open
                    onOpenChange={(open) => !open && setViewer(null)}
                    photos={viewer.photos}
                    index={viewer.index}
                    onIndexChange={(index) => setViewer((v) => (v ? { ...v, index } : v))}
                />
            ) : null}
        </div>
    )
}

const live = [(Story: () => ReactNode) => <div className="max-w-[40rem]">{Story()}</div>]

/**
 * The whole moment, live: + then Choose photos, pick up to four (a real
 * preparePhoto runs on each), watch them upload and be checked, Send, and
 * tap a sent photo to open it. Pick the next photo's fate above to see the
 * failure, the check failure and the refusal. A PDF says the wrong-type line,
 * five photos the over-the-limit line.
 */
export const InContextChatLight: Story = { globals: { theme: 'light' }, decorators: live, render: () => <ChatWithPhotos /> }
export const InContextChatDark: Story = { globals: { theme: 'dark' }, decorators: live, render: () => <ChatWithPhotos /> }
