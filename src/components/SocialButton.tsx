import * as React from 'react'

import { cn } from '../lib/cn'
import { AutaraLoader } from './AutaraLoader'

/**
 * AUTM-1513 — the one social sign-in button (canvas v49, UiSocialAuth,
 * approved by Don 1 Oct). Replaces merchant-web's band-filled, double-height
 * pills and customer-web sign-in's own pair.
 *
 * - 52px (3.25rem, so it grows with text), the pill, a 17px Medium label:
 *   the same height as the primary button and the input above it.
 * - A 20px mark 12px from the label, the two centred together as one unit.
 * - Google is the field's glass (AUTM-2140, Don 2026-11-14): the same
 *   `.glass-edge` fill and lit hairline as the input above it, with Google's
 *   own G. Apple stays the one solid button, black in light and white in
 *   dark (house rule: no other black button). Mobile is Autara's own: paper
 *   with the field's 1px edge and a phone mark.
 * - Keyboard focus is a 2px accent outline 3px out, on every provider.
 * - Busy: the pressed button swaps its mark for the turning Autara mark
 *   (AutaraLoader, 20px, in the label's colour) and keeps its label, so the
 *   width and the accessible name hold; it is aria-busy and disabled at full
 *   strength, so a second tap cannot start a second sign-in. The caller
 *   disables the others. (AUTM-1708: it used to be a plain CSS ring.)
 * - Disabled and busy keep the provider's real colours (AUTM-1719): no 50%
 *   wash. Disabled is said by aria-disabled and a not-allowed cursor, busy by
 *   aria-busy and the turning mark.
 * - Press: 97% under the finger on the library's `motion-press`, as Button
 *   does by default (AUTM-1708). `press={false}` opts out.
 *
 * Styled by `utilities/social.css` (classes, not Tailwind), so the look is
 * one file and the provider hexes stay out of the TSX. The label defaults to
 * "Continue with …", used in sign-up and sign-in alike.
 */

export type SocialButtonProvider = 'google' | 'apple' | 'mobile'

export interface SocialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    provider: SocialButtonProvider
    /** Dark surfaces (the merchant landing, the app's dark theme). */
    theme?: 'light' | 'dark'
    /** The pressed button: the turning Autara mark replaces the provider mark, the label stays. */
    busy?: boolean
    /** Scale to 97% under the finger (`motion-press`). Default true. */
    press?: boolean
    /** Overrides the default "Continue with …" label. */
    label?: React.ReactNode
    /**
     * Overrides the provider mark, for the same slot doing a related job:
     * customer-web's mobile button becomes "Continue with email" with a mail
     * mark once the phone form is open. 20px, inherits the label's colour.
     */
    icon?: React.ReactNode
}

const DEFAULT_LABEL: Record<SocialButtonProvider, string> = {
    google: 'Continue with Google',
    apple: 'Continue with Apple',
    mobile: 'Continue with mobile',
}

function GoogleMark() {
    return (
        <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
    )
}

function AppleMark() {
    return (
        <svg viewBox="0 0 17 20" aria-hidden="true" focusable="false">
            <path
                fill="currentColor"
                d="M14.1 10.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8C4.2 5.1 2.6 6.1 1.7 7.6c-1.8 3.2-.5 7.9 1.3 10.4.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.3.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.7-1-2.7-4.1zM11.7 3.4c.7-.8 1.2-2 1-3.2-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3.1 1.1.1 2.2-.6 2.9-1.4z"
            />
        </svg>
    )
}

function MobileMark() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <rect x="7" y="3" width="10" height="18" rx="2.5" />
            <path d="M11 17.5h2" />
        </svg>
    )
}

const MARKS: Record<SocialButtonProvider, () => React.ReactElement> = {
    google: GoogleMark,
    apple: AppleMark,
    mobile: MobileMark,
}

export const SocialButton = React.forwardRef<HTMLButtonElement, SocialButtonProps>(function SocialButton(
    { provider, theme = 'light', busy = false, press = true, label, icon, className, type = 'button', disabled, children, ...props },
    ref,
) {
    const Mark = MARKS[provider]
    return (
        <button
            ref={ref}
            type={type}
            disabled={disabled || busy}
            aria-busy={busy || undefined}
            aria-disabled={disabled || undefined}
            data-provider={provider}
            data-theme={theme}
            className={cn('social-btn', provider === 'google' && 'glass-edge', press && 'motion-press', className)}
            {...props}
        >
            <span className="social-btn__inner">
                <span className="social-btn__mark">
                    {busy ? <AutaraLoader size={20} tone="current" decorative /> : (icon ?? <Mark />)}
                </span>
                <span className="social-btn__label">{children ?? label ?? DEFAULT_LABEL[provider]}</span>
            </span>
        </button>
    )
})
