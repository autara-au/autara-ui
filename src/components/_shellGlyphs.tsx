/**
 * Solar Linear and Bold glyphs for the AUTM-1781 shell stories, inlined
 * because autara-ui does not depend on @solar-icons/react. Story-only:
 * consumers pass their own icons.
 */
const s = { stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }

export const CalendarGlyph = () => (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden>
        <path {...s} d="M7 4V2.5M17 4V2.5M2.5 9h19M4.5 4h15a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    </svg>
)
export const ChatGlyph = () => (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden>
        <path {...s} d="M12 21a9 9 0 1 0-8-4.9L3 21l4.9-1A9 9 0 0 0 12 21ZM8 12h.01M12 12h.01M16 12h.01" />
    </svg>
)
export const UserGlyph = () => (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden>
        <path {...s} d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" />
    </svg>
)
export const ArrowGlyph = () => (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
        <path {...s} d="M3 11 21 3l-8 18-2-8-8-2Z" />
    </svg>
)
export const ClockGlyph = () => (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
        <path {...s} d="M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
    </svg>
)
export const CloseGlyph = () => (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
        <path {...s} d="M15 9l-6 6M9 9l6 6M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
    </svg>
)
export const HelpGlyph = () => (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
        <path {...s} d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
    </svg>
)
export const PhoneGlyph = () => (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
        <path {...s} d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z" />
    </svg>
)
export const CardGlyph = () => (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
        <path {...s} d="M2.5 9.5h19M6 15h4M4.5 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    </svg>
)
export const BackGlyph = () => (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
        <path {...s} d="M15 19l-7-7 7-7" />
    </svg>
)
