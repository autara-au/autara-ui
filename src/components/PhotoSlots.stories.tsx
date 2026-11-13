import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PhotoSlots } from './PhotoSlots'
import type { PhotoItem } from './PhotoTile'
import { VehicleCard } from './VehicleCard'
import { PhotoViewer, type PhotoViewerPhoto } from './PhotoViewer'
import { PHOTO_COPY, photoErrorMessage } from '../lib/photo-copy'
import { isPreparePhotoError, preparePhoto } from '../lib/prepare-photo'

/**
 * AUTM-1882. A fixed number of places for photos: the car's 3 in the garage
 * (the first is the cover, as Lloyds leads a car with its photo) and a
 * booking request's 5. Bumble's numbered slots on Mobbin (steal): the limit
 * is visible before anyone reaches it.
 */
const meta: Meta<typeof PhotoSlots> = {
    title: 'Photos/PhotoSlots',
    component: PhotoSlots,
    parameters: { layout: 'padded' },
    args: {
        slots: 3,
        items: [],
        label: 'Car photos',
        onFiles: () => {},
        onRemove: () => {},
        onRetry: () => {},
        onOpen: () => {},
    },
    decorators: [
        (Story) => (
            <div className="max-w-[24rem]">
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof PhotoSlots>

const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&h=400&q=70`
const CAR = U('photo-1607860108855-64acf2078ed9')
const SPORT = U('photo-1503376780353-7e6692767b70')
const INTERIOR = U('photo-1601362840469-51e4d8d58785')
const BAY = U('photo-1542362567-b07e54358753')

/** No photos yet: the first slot is "Add a photo", the other two are numbered and still. */
export const Empty: Story = {}
export const OnePhoto: Story = { args: { items: [{ id: 'a', state: 'ready', src: CAR }] } }
/** All three used: no add slot. */
export const Full: Story = {
    args: {
        items: [
            { id: 'a', state: 'ready', src: CAR },
            { id: 'b', state: 'ready', src: SPORT },
            { id: 'c', state: 'ready', src: INTERIOR },
        ],
    },
}

const REQUEST: PhotoItem[] = [
    { id: 'a', state: 'ready', src: CAR },
    { id: 'b', state: 'uploading', src: SPORT, progress: 0.55 },
    { id: 'c', state: 'checking', src: INTERIOR },
    { id: 'd', state: 'failed', failure: 'upload', src: BAY },
]

/** A booking request's 5, mid-flight, light. */
export const BookingRequestLight: Story = {
    globals: { theme: 'light' },
    args: { slots: 5, items: REQUEST, label: 'Photos for Sam', columns: 3 },
}
export const BookingRequestDark: Story = {
    globals: { theme: 'dark' },
    args: { slots: 5, items: REQUEST, label: 'Photos for Sam', columns: 3 },
}

const EVERY_STATE: PhotoItem[] = [
    { id: 'p', state: 'preparing' },
    { id: 'u', state: 'uploading', src: SPORT, progress: 0.3 },
    { id: 'c', state: 'checking', src: INTERIOR },
    { id: 'r', state: 'ready', src: CAR },
    { id: 'f', state: 'failed', failure: 'upload', src: BAY },
    { id: 'k', state: 'failed', failure: 'check', src: SPORT },
    { id: 'x', state: 'refused' },
    { id: 'e', state: 'unavailable' },
]

/** Every tile state in one set of slots (more than any kind allows, to show them together). */
export const EveryStateLight: Story = {
    globals: { theme: 'light' },
    args: { slots: 9, items: EVERY_STATE, label: 'Photos', columns: 3 },
}
export const EveryStateDark: Story = {
    globals: { theme: 'dark' },
    args: { slots: 9, items: EVERY_STATE, label: 'Photos', columns: 3 },
}

export const WrongType: Story = { args: { message: photoErrorMessage('NOT_IMAGE') } }
export const TooLarge: Story = { args: { items: [{ id: 'a', state: 'ready', src: CAR }], message: photoErrorMessage('TOO_LARGE') } }
export const TooSmall: Story = { args: { message: photoErrorMessage('TOO_SMALL') } }
/** Four picked for three slots: three went in, and the slots say why the fourth did not. */
export const OverTheLimit: Story = {
    args: {
        items: [
            { id: 'a', state: 'ready', src: CAR },
            { id: 'b', state: 'uploading', src: SPORT, progress: 0.4 },
            { id: 'c', state: 'preparing' },
        ],
        message: PHOTO_COPY.overLimit(3),
    },
}
/** The car is still saving. The slot keeps its colour (buttons never mute) and says so to assistive tech. */
export const Disabled: Story = { args: { disabled: true } }

/* ─── In context: the car in the garage, live ───────────────────────────── */

type SlotPhoto = PhotoItem & { width?: number; height?: number }

function Garage() {
    const [photos, setPhotos] = useState<SlotPhoto[]>([])
    const [line, setLine] = useState<string | null>(null)
    const [viewer, setViewer] = useState<{ photos: PhotoViewerPhoto[]; index: number } | null>(null)
    const timers = useRef<number[]>([])
    useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
    const update = (id: string, patch: Partial<SlotPhoto>) =>
        setPhotos((all) => all.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    const later = (ms: number, run: () => void) => timers.current.push(window.setTimeout(run, ms))

    async function onFiles(files: File[]) {
        setLine(null)
        for (const file of files) {
            const id = Math.random().toString(36).slice(2)
            setPhotos((all) => [...all, { id, state: 'preparing' }])
            try {
                const prepared = await preparePhoto(file)
                update(id, {
                    state: 'uploading',
                    progress: 0.3,
                    src: URL.createObjectURL(prepared.blob),
                    width: prepared.width,
                    height: prepared.height,
                })
                later(400, () => update(id, { progress: 0.8 }))
                later(800, () => update(id, { state: 'checking' }))
                later(1700, () => update(id, { state: 'ready' }))
            } catch (error) {
                setPhotos((all) => all.filter((p) => p.id !== id))
                setLine(isPreparePhotoError(error) ? photoErrorMessage(error.code) : PHOTO_COPY.wrongType)
            }
        }
    }

    const cover = photos.find((p) => p.state === 'ready')?.src ?? null
    return (
        <div className="flex max-w-[26rem] flex-col gap-4 rounded-[1.5rem] bg-[var(--paper)] p-6">
            <VehicleCard make="Toyota" model="HiLux" body="UTE" color="White" year={2021} registrationPlate="ABC123" photoUrl={cover} />
            <PhotoSlots
                slots={3}
                items={photos}
                label="Car photos"
                message={line}
                onFiles={onFiles}
                onRemove={(id) => setPhotos((all) => all.filter((p) => p.id !== id))}
                onRetry={(id) => update(id, { state: 'ready' })}
                onOpen={(_, index) =>
                    setViewer({ photos: photos.map((p) => ({ id: p.id, src: p.src, width: p.width, height: p.height })), index })
                }
            />
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

const live = [(Story: () => ReactNode) => <div className="max-w-[30rem]">{Story()}</div>]

/**
 * The car dialog's photos, live: Add a photo opens the system picker, a real
 * preparePhoto runs, and the first ready photo becomes the car's cover in
 * VehicleCard's `photoUrl` slot. Pick four to see the over-the-limit line.
 */
export const InContextGarageLight: Story = { globals: { theme: 'light' }, decorators: live, render: () => <Garage /> }
export const InContextGarageDark: Story = { globals: { theme: 'dark' }, decorators: live, render: () => <Garage /> }
