import * as React from 'react'
import { Input, type InputProps } from './Input'

/**
 * SearchInput — `Input` with a leading Solar Linear magnifier glyph.
 *
 * Consolidates the inline pattern that was duplicated across every
 * "filtered list" screen (merchant Bookings / Services / Customers /
 * Notifications; customer marketplace search) where each consumer
 * was rolling its own absolute-positioned icon + `pl-9` Input.
 *
 * Forwards every standard `InputProps` so it composes with form
 * libraries unchanged. The glyph is inlined SVG (Solar Linear style)
 * so autara-ui doesn't have to depend on @solar-icons/react.
 */

export interface SearchInputProps extends Omit<InputProps, 'icon'> {
    /** Override the placeholder. Defaults to "Search". */
    placeholder?: string
}

const MagniferGlyph = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
    >
        <circle
            cx="11"
            cy="11"
            r="7"
            stroke="currentColor"
            strokeWidth="1.8"
        />
        <path
            d="m20 20-3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
        />
    </svg>
)

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
    ({ placeholder = 'Search', leadingIcon, ...props }, ref) => {
        // AUTM-2140: the glyph is Input's `leadingIcon`, inside the glass
        // pill, so the old absolute glyph and its `pl-9!` override are gone.
        return <Input ref={ref} placeholder={placeholder} leadingIcon={leadingIcon ?? <MagniferGlyph />} {...props} />
    },
)
SearchInput.displayName = 'SearchInput'
