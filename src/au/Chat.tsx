'use client'

import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * The conversation, as ChatView in Customer/InboxView.swift: bubbles
 * anchored to the bottom, photos inline, events as a quiet line, and one
 * composer field whose send turns lime once there is something to send.
 */
export interface BubbleProps extends React.HTMLAttributes<HTMLDivElement> {
    mine?: boolean
    /** Photos above the text (each a RemotePhoto or an img). */
    photos?: React.ReactNode
    /** Under the text, small: the time, "Seen". */
    meta?: React.ReactNode
}

export function Bubble({ mine, photos, meta, className, children, ...rest }: BubbleProps) {
    return (
        <div className="au-bubble-row" data-mine={mine ? '' : undefined}>
            <div
                className={cn('au-bubble', className)}
                data-mine={mine ? '' : undefined}
                data-photos={photos ? '' : undefined}
                {...rest}
            >
                {photos ? <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{photos}</div> : null}
                {children ? <div style={photos ? { padding: '0 0.25rem 0.25rem' } : undefined}>{children}</div> : null}
                {meta ? <div className="au-bubble__meta">{meta}</div> : null}
            </div>
        </div>
    )
}

/** An event in the thread: "Started, 11:58 am". */
export function ChatEvent({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('au-event', className)} {...rest} />
}

export interface ComposerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
    value: string
    onChange: (value: string) => void
    /** Called with the trimmed text on Send or Enter (Shift+Enter is a new line). */
    onSend: (text: string) => void
    placeholder?: string
    /** The leading control (add a photo): the consumer's CircleButton or menu. */
    leading?: React.ReactNode
    /** Sending: Send says so and does not send twice. */
    busy?: boolean
    /** The field's accessible name. */
    fieldLabel?: string
    sendLabel?: string
    /** Props for the field and Send (test ids, ids, aria). */
    fieldProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement> & Record<`data-${string}`, string>
    sendProps?: React.ButtonHTMLAttributes<HTMLButtonElement> & Record<`data-${string}`, string>
    sendIcon: React.ReactNode
}

export const Composer = React.forwardRef<HTMLTextAreaElement, ComposerProps>(function Composer(
    {
        value,
        onChange,
        onSend,
        placeholder = 'Message',
        leading,
        busy,
        fieldLabel = 'Message',
        sendLabel = 'Send',
        fieldProps,
        sendProps,
        sendIcon,
        className,
        ...rest
    },
    ref,
) {
    const ready = value.trim().length > 0
    const send = () => {
        if (!ready || busy) return
        onSend(value.trim())
    }
    return (
        <div className={cn('au-composer', className)} {...rest}>
            {leading}
            <textarea
                ref={ref}
                rows={1}
                className="au-composer__field"
                aria-label={fieldLabel}
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                        event.preventDefault()
                        send()
                    }
                }}
                {...fieldProps}
            />
            <button
                type="button"
                className="au-composer__send"
                aria-label={sendLabel}
                aria-disabled={!ready || busy ? 'true' : undefined}
                aria-busy={busy ? 'true' : undefined}
                data-ready={ready ? '' : undefined}
                onClick={send}
                {...sendProps}
            >
                {sendIcon}
            </button>
        </div>
    )
})
