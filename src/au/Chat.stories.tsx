import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'
import { Bubble, ChatEvent, Composer } from './Chat'
import { CircleButton } from './CircleButton'
import { RemotePhoto } from './Photo'
import { CameraIcon, SendIcon } from '../icons'
import { Room } from './_story'

/** AU/Chat: bubbles, an event line and the one-field composer whose send turns lime. */
const meta: Meta<typeof Composer> = { title: 'AU/Chat', component: Composer }
export default meta
type Story = StoryObj<typeof Composer>

function Thread() {
    const [draft, setDraft] = React.useState('')
    const [sent, setSent] = React.useState<string[]>([])
    return (
        <Room>
            <div className="au-thread">
                <Bubble>On my way, about 10 minutes.</Bubble>
                <Bubble mine>Great, the gate is open.</Bubble>
                <ChatEvent>Started, 11:58 am</ChatEvent>
                <Bubble photos={<><RemotePhoto name="A" radius={14} style={{ width: 118, height: 96 }} /><RemotePhoto name="B" radius={14} style={{ width: 118, height: 96 }} /></>}>
                    Photos are up, nearly done
                </Bubble>
                {sent.map((text, i) => <Bubble key={i} mine meta="Sent">{text}</Bubble>)}
            </div>
            <Composer
                value={draft}
                onChange={setDraft}
                onSend={(text) => { setSent((s) => [...s, text]); setDraft('') }}
                leading={<CircleButton icon={<CameraIcon />} label="Add a photo" size={48} />}
                sendIcon={<SendIcon size={20} active />}
            />
        </Room>
    )
}

export const Conversation: Story = { render: () => <Thread /> }
