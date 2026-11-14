import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PhotoPickers, useCanTakePhoto, type PhotoPickersHandle } from './PhotoPickers'
import { ComposerAttachMenu, attachMenuGlyphs } from './ComposerAttachMenu'
import { Button } from './Button'

/**
 * AUTM-2165, AUTM-2166. The hidden pickers behind "Take a photo" and "Choose
 * photos", opened from a chooser of the consumer's (the booking chat's plus).
 * "Take a photo" is offered only on a touch screen: open this story on a phone
 * or with touch emulation to see it. Nothing is drawn by the pickers
 * themselves; the stories show what they hand over.
 */
const meta: Meta<typeof PhotoPickers> = {
    title: 'Photos/PhotoPickers',
    component: PhotoPickers,
    parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof PhotoPickers>

function Picked({ files }: { files: File[] }) {
    return (
        <p role="status" className="text-[0.875rem] text-[var(--text-muted)]">
            {files.length === 0 ? 'Nothing picked yet.' : `${files.length} picked: ${files.map((f) => f.name).join(', ')}`}
        </p>
    )
}

export const Default: Story = {
    render: () => {
        const pickers = useRef<PhotoPickersHandle>(null)
        const canTakePhoto = useCanTakePhoto()
        const [files, setFiles] = useState<File[]>([])
        return (
            <div className="flex max-w-[26rem] flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                    {canTakePhoto ? (
                        <Button variant="quiet" onClick={() => pickers.current?.openCamera()}>
                            Take a photo
                        </Button>
                    ) : null}
                    <Button variant="quiet" onClick={() => pickers.current?.openLibrary()}>
                        Choose photos
                    </Button>
                </div>
                <Picked files={files} />
                <PhotoPickers ref={pickers} onFiles={setFiles} />
            </div>
        )
    },
}

/** As the booking chat uses it: the rows in ComposerAttachMenu, the footnote saying who sees the photos. */
export const InTheAttachMenu: Story = {
    name: 'In context: the chat plus',
    render: () => {
        const pickers = useRef<PhotoPickersHandle>(null)
        const canTakePhoto = useCanTakePhoto()
        const [files, setFiles] = useState<File[]>([])
        return (
            <div className="flex max-w-[26rem] flex-col gap-3">
                <ComposerAttachMenu
                    label="Add a photo or ask about an extra"
                    footnote="Only you and Wish Car Care can see photos in this chat."
                    items={[
                        ...(canTakePhoto
                            ? [{ id: 'camera', label: 'Take a photo', icon: attachMenuGlyphs.camera, onSelect: () => pickers.current?.openCamera() }]
                            : []),
                        {
                            id: 'photos',
                            label: 'Choose photos',
                            description: 'Up to 4 at a time',
                            icon: attachMenuGlyphs.photos,
                            onSelect: () => pickers.current?.openLibrary(),
                        },
                    ]}
                />
                <Picked files={files} />
                <PhotoPickers ref={pickers} onFiles={setFiles} />
            </div>
        )
    },
}
