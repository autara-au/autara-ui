import { AutaraIcon, BODY, DETAIL, type AutaraIconProps } from './AutaraIcon'

/**
 * AUTM-2114: the object icons. Duotone: a body in the icon's own colour at
 * `--icon-body` behind 1.7 line art (see AutaraIcon.tsx for the grammar).
 *
 * The first block is the set Don approved in merchant-mobile on 2026-11-08
 * (AUTM-2042), ported unchanged: Today is a small Autara mark (the ring and
 * its eight rays), Settings a mechanic's hex nut, Services a car care spray
 * bottle, Packages a tied gift box. Everything after it is drawn to match.
 *
 * Car care where it is honest: Vehicle is a car, Workshop a garage,
 * Directions a road sign.
 */

/* ─── Approved in merchant-mobile, ported unchanged ─────────────────────── */

const RAY = 'M10.4 3.4h3.2L12 5.3z'
const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

/** The Autara mark: Today, home. */
export function TodayIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="today" {...props}>
            <circle cx="12" cy="12" r="3.9" style={BODY} />
            <g style={DETAIL} strokeWidth={1.1} stroke="none">
                {RAY_ANGLES.map((deg) => (
                    <path key={deg} d={RAY} transform={deg ? `rotate(${deg} 12 12)` : undefined} />
                ))}
            </g>
        </AutaraIcon>
    )
}

/** A calendar with the booked slot: bookings, a date, availability. */
export function BookingsIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="bookings" {...props}>
            <rect x="3.6" y="5.2" width="16.8" height="15.2" rx="4" style={BODY} />
            <path d="M8.2 3.4v3.4M15.8 3.4v3.4" />
            <rect x="12.6" y="13.2" width="4.2" height="3.8" rx="1.2" stroke="none" style={DETAIL} />
        </AutaraIcon>
    )
}

/** A conversation: the Inbox. */
export function InboxIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="inbox" {...props}>
            <path
                d="M7.6 4.4h8.8a4 4 0 0 1 4 4v5.2a4 4 0 0 1-4 4H11l-4.6 3v-3a4 4 0 0 1-2.8-3.8V8.4a4 4 0 0 1 4-4z"
                style={BODY}
            />
            <path d="M8.6 9.8h6.8M8.6 13h4" />
        </AutaraIcon>
    )
}

/** Two people: Customers. */
export function CustomersIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="customers" {...props}>
            <circle cx="9.4" cy="8.4" r="3.4" style={BODY} />
            <path d="M3.4 19.6c.6-3.2 3-5.2 6-5.2s5.4 2 6 5.2z" style={BODY} />
            <path d="M15.6 5.4a3.2 3.2 0 0 1 0 6.2M17.6 14.6c1.6.7 2.7 2.4 3 4.9" />
        </AutaraIcon>
    )
}

/** A car care spray bottle: Services. */
export function ServicesIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="services" {...props}>
            <path
                d="M7.4 11.2c0-1.3 1-2.3 2.3-2.3h3.4c1.3 0 2.3 1 2.3 2.3v8.1a1.6 1.6 0 0 1-1.6 1.6H9a1.6 1.6 0 0 1-1.6-1.6z"
                style={BODY}
            />
            <path d="M9.6 8.9V6.4h3.6v2.5M9.6 6.4V4.2h5.2l1.6 2.2" />
            <g stroke="none" style={DETAIL}>
                <circle cx="19.2" cy="4.4" r=".9" />
                <circle cx="20.4" cy="7.2" r=".9" />
                <circle cx="19.2" cy="10" r=".9" />
            </g>
        </AutaraIcon>
    )
}

/** A tied gift box: Packages, bundles. */
export function PackagesIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="packages" {...props}>
            <rect x="5" y="11.4" width="14" height="9" rx="2.4" style={BODY} />
            <rect x="3.6" y="7.6" width="16.8" height="3.8" rx="1.6" style={BODY} />
            <path d="M12 7.6v12.8" />
            <path d="M12 7.6c-.9-2.6-4.4-3.3-4.4-1.3 0 1.1 1.6 1.3 4.4 1.3zM12 7.6c.9-2.6 4.4-3.3 4.4-1.3 0 1.1-1.6 1.3-4.4 1.3z" />
        </AutaraIcon>
    )
}

/** A stack of coins and a rising arrow: Earnings, money in. */
export function EarningsIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="earnings" {...props}>
            <path d="M3.8 7.4v9.2c0 1.3 2.5 2.4 5.6 2.4s5.6-1.1 5.6-2.4V7.4" style={BODY} />
            <ellipse cx="9.4" cy="7.4" rx="5.6" ry="2.4" style={BODY} />
            <path d="M3.8 12c0 1.3 2.5 2.4 5.6 2.4s5.6-1.1 5.6-2.4" />
            <path d="M18.8 13.6V5.2M16 8l2.8-2.8L21.6 8" />
        </AutaraIcon>
    )
}

/** A receipt: Invoices, a bill. */
export function InvoicesIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="invoices" {...props}>
            <path
                d="M6.6 3.6h10.8a2 2 0 0 1 2 2v14.8l-2.4-1.5-2.5 1.5-2.5-1.5-2.5 1.5-2.5-1.5-2.4 1.5V5.6a2 2 0 0 1 2-2z"
                style={BODY}
            />
            <path d="M8.6 8.6h6.8M8.6 12h6.8M8.6 15.4h3.6" />
        </AutaraIcon>
    )
}

/** A mechanic's hex nut: Settings. */
export function SettingsIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="settings" {...props}>
            <path
                d="M10.5 3.4a3 3 0 0 1 3 0l5.4 3.1a3 3 0 0 1 1.5 2.6v5.8a3 3 0 0 1-1.5 2.6l-5.4 3.1a3 3 0 0 1-3 0l-5.4-3.1a3 3 0 0 1-1.5-2.6V9.1a3 3 0 0 1 1.5-2.6z"
                style={BODY}
            />
            <circle cx="12" cy="12" r="2.9" />
        </AutaraIcon>
    )
}

/** A person in a ring: the signed-in account, one customer. */
export function AccountIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="account" {...props}>
            <circle cx="12" cy="12" r="8.6" />
            <circle cx="12" cy="10" r="3" style={BODY} />
            <path d="M6.9 18.2c1.1-2 3-3.1 5.1-3.1s4 1.1 5.1 3.1" />
        </AutaraIcon>
    )
}

/** A question in a disc: Help and support. */
export function HelpIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="help" {...props}>
            <circle cx="12" cy="12" r="8.6" style={BODY} />
            <path d="M9.7 9.5a2.4 2.4 0 1 1 3.4 2.2c-.7.3-1.1.8-1.1 1.5v.4" />
            <circle cx="12" cy="16.3" r=".95" stroke="none" style={DETAIL} />
        </AutaraIcon>
    )
}

/** A door and an arrow out: Sign out. */
export function SignOutIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="sign-out" {...props}>
            <path d="M13.4 4H8a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h5.4" />
            <path d="M10.4 12h10M17.2 8.6l3.4 3.4-3.4 3.4" />
        </AutaraIcon>
    )
}

/** Half light, half dark: the Appearance setting. */
export function AppearanceIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="appearance" {...props}>
            <circle cx="12" cy="12" r="8.4" />
            <path d="M12 3.6a8.4 8.4 0 0 1 0 16.8z" fill="currentColor" stroke="none" />
        </AutaraIcon>
    )
}

/** A bell: Notifications, a reminder sent. */
export function NotificationsIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="notifications" {...props}>
            <path d="M6.4 16.4v-5.2a5.6 5.6 0 0 1 11.2 0v5.2l1.4 1.8H5z" style={BODY} />
            <path d="M10 20.6a2.3 2.3 0 0 0 4 0" />
        </AutaraIcon>
    )
}

/** A tray and an arrow up: Share, the platform share sheet. */
export function ShareIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="share" {...props}>
            <path d="M8.6 8.4H7.4a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h9.2a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3h-1.2" />
            <path d="M12 14.4V3.6M8.8 6.8 12 3.6l3.2 3.2" />
        </AutaraIcon>
    )
}

/* The Appearance switch's three choices (Don, 2026-11-08: "there's no icons
   in the appearance options"). */

/** A sun: the light appearance. */
export function LightIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="light" {...props}>
            <circle cx="12" cy="12" r="4.2" style={BODY} />
            <path d="M12 2.8v1.8M12 19.4v1.8M2.8 12h1.8M19.4 12h1.8M5.5 5.5l1.3 1.3M17.2 17.2l1.3 1.3M5.5 18.5l1.3-1.3M17.2 6.8l1.3-1.3" />
        </AutaraIcon>
    )
}

/** A moon and a spark: the dark appearance. */
export function DarkIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="dark" {...props}>
            <path d="M19.6 14.6A8 8 0 0 1 9.4 4.4a8 8 0 1 0 10.2 10.2z" style={BODY} />
            <path d="M16.4 4.2v2.6M15.1 5.5h2.6" />
        </AutaraIcon>
    )
}

/** A monitor: follow the system appearance. */
export function SystemIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="system" {...props}>
            <rect x="3.4" y="4.6" width="17.2" height="11.6" rx="2.6" style={BODY} />
            <path d="M9 20h6M12 16.2V20" />
        </AutaraIcon>
    )
}

/* ─── Bookings and time ─────────────────────────────────────────────────── */

/** The Bookings calendar with a plus: a new booking, a booking requested. */
export function CalendarAddIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="calendar-add" {...props}>
            <rect x="3.6" y="5.2" width="16.8" height="15.2" rx="4" style={BODY} />
            <path d="M8.2 3.4v3.4M15.8 3.4v3.4" />
            <path d="M12 10.2v6.4M8.8 13.4h6.4" />
        </AutaraIcon>
    )
}

/** A clock face: a time, a reminder, running late. */
export function ClockIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="clock" {...props}>
            <circle cx="12" cy="12" r="8.6" style={BODY} />
            <path d="M12 7.4V12l3.2 2" />
        </AutaraIcon>
    )
}

/** An hourglass with the sand run through: waiting on someone else (the waitlist). */
export function PendingIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="pending" {...props}>
            <path d="M7.6 3.6v1.6c0 2.4 1.5 4.3 4.4 6.8 2.9-2.5 4.4-4.4 4.4-6.8V3.6z" style={BODY} />
            <path d="M7.6 20.4v-1.6c0-2.4 1.5-4.3 4.4-6.8 2.9 2.5 4.4 4.4 4.4 6.8v1.6" />
            <path d="M9.4 20.2c.4-1.7 1.3-2.8 2.6-3.6 1.3.8 2.2 1.9 2.6 3.6z" stroke="none" style={DETAIL} />
            <path d="M6 3.6h12M6 20.4h12" />
        </AutaraIcon>
    )
}

/* ─── Talking to customers ──────────────────────────────────────────────── */

/** A round speech bubble with three dots: message, text, a note in a thread. */
export function ChatIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="chat" {...props}>
            <path d="M12 19.8a8.2 8.2 0 1 0-8.2-8.2v5.8a2.4 2.4 0 0 0 2.4 2.4z" style={BODY} />
            <g stroke="none" style={DETAIL}>
                <circle cx="8.4" cy="11.6" r="1.05" />
                <circle cx="12" cy="11.6" r="1.05" />
                <circle cx="15.6" cy="11.6" r="1.05" />
            </g>
        </AutaraIcon>
    )
}

/** An envelope: email. */
export function EmailIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="email" {...props}>
            <rect x="3.4" y="5.2" width="17.2" height="13.6" rx="3.2" style={BODY} />
            <path d="m4.8 7.8 5.7 4.3a2.5 2.5 0 0 0 3 0l5.7-4.3" />
        </AutaraIcon>
    )
}

/** A handset with a call wave: call. */
export function PhoneIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="phone" {...props}>
            <path
                d="M6.3 3.6h1.6c.7 0 1.3.5 1.5 1.1l.8 2.8c.2.6 0 1.3-.5 1.7l-1.3 1.1c1 2.2 2.6 3.8 4.8 4.8l1.1-1.3c.4-.5 1.1-.7 1.7-.5l2.8.8c.7.2 1.1.8 1.1 1.5v1.6a2.6 2.6 0 0 1-2.8 2.6C10.4 19.3 4.7 13.6 3.7 6.4a2.6 2.6 0 0 1 2.6-2.8z"
                style={BODY}
            />
            <path d="M14.4 3.8a5.8 5.8 0 0 1 5.8 5.8" />
        </AutaraIcon>
    )
}

/** A paper plane: send (a link, a reminder, a booking). */
export function SendIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="send" {...props}>
            <path d="M20.2 3.8 3.8 10.3l6.6 3.3 3.3 6.6z" style={BODY} />
            <path d="m20.2 3.8-9.8 9.8" />
        </AutaraIcon>
    )
}

/** A star: reviews, a rating. `style={{ '--icon-body': 1 }}` fills it for a rated star. */
export function StarIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="star" {...props}>
            <path
                d="M11 4.4a1.1 1.1 0 0 1 2 0l1.9 4 4.4.6a1.1 1.1 0 0 1 .6 1.9l-3.2 3.1.8 4.4a1.1 1.1 0 0 1-1.6 1.2L12 17.5l-3.9 2.1a1.1 1.1 0 0 1-1.6-1.2l.8-4.4-3.2-3.1a1.1 1.1 0 0 1 .6-1.9l4.4-.6z"
                style={BODY}
            />
        </AutaraIcon>
    )
}

/* ─── Places ────────────────────────────────────────────────────────────── */

/** A map pin: where, an address, a mobile job. */
export function LocationIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="location" {...props}>
            <path d="M12 20.4c-3.4-3-6.4-6.4-6.4-10.4a6.4 6.4 0 0 1 12.8 0c0 4-3 7.4-6.4 10.4z" style={BODY} />
            <circle cx="12" cy="10" r="2.4" />
        </AutaraIcon>
    )
}

/** A road sign with a turn: directions. */
export function DirectionsIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="directions" {...props}>
            <path
                d="M10.6 4.8a2 2 0 0 1 2.8 0l5.8 5.8a2 2 0 0 1 0 2.8l-5.8 5.8a2 2 0 0 1-2.8 0l-5.8-5.8a2 2 0 0 1 0-2.8z"
                style={BODY}
            />
            <path d="M9.4 15v-1.6a2 2 0 0 1 2-2h3.8M13.4 9.6l1.8 1.8-1.8 1.8" />
        </AutaraIcon>
    )
}

/** A garage: the merchant's workshop, as against a mobile job. */
export function WorkshopIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="workshop" {...props}>
            <path
                d="M3.6 10.1a2 2 0 0 1 1-1.7l6.4-3.9a2 2 0 0 1 2 0l6.4 3.9a2 2 0 0 1 1 1.7v8.1a2.4 2.4 0 0 1-2.4 2.4H6a2.4 2.4 0 0 1-2.4-2.4zM7.8 20.6v-6.2a1.2 1.2 0 0 1 1.2-1.2h6a1.2 1.2 0 0 1 1.2 1.2v6.2z"
                fillRule="evenodd"
                style={BODY}
            />
            <path d="M7.8 16.8h8.4" />
        </AutaraIcon>
    )
}

/** A shopfront with an awning: the business, its public profile. */
export function BusinessIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="business" {...props}>
            <path
                d="M3.6 8.4 5 4.9a2 2 0 0 1 1.9-1.3h10.2a2 2 0 0 1 1.9 1.3l1.4 3.5a2.8 2.8 0 0 1-5.6 0 2.8 2.8 0 0 1-5.6 0 2.8 2.8 0 0 1-5.6 0z"
                style={BODY}
            />
            <path d="M5 12.6v5.6a2.4 2.4 0 0 0 2.4 2.4h9.2a2.4 2.4 0 0 0 2.4-2.4v-5.6M10 20.6v-3a2 2 0 0 1 4 0v3" />
        </AutaraIcon>
    )
}

/* ─── The car ───────────────────────────────────────────────────────────── */

/** A car in profile: the customer's vehicle. */
export function VehicleIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="vehicle" {...props}>
            <path
                d="M4.6 16.8a1.2 1.2 0 0 1-1.2-1.2v-2.8c0-1.1.8-2 1.9-2.2l1.9-.3 2.3-3.5a2.6 2.6 0 0 1 2.2-1.2h2.4a2.6 2.6 0 0 1 2.1 1.1l2.2 3.5c1.3.2 2.2 1.3 2.2 2.6v2.8a1.2 1.2 0 0 1-1.2 1.2 3 3 0 0 0-6 0h-2.8a3 3 0 0 0-6 0z"
                style={BODY}
            />
            <path d="M7.2 10.3h11.2M12.8 5.6v4.7" />
            <circle cx="7.6" cy="16.8" r="2.3" style={BODY} />
            <circle cx="16.4" cy="16.8" r="2.3" style={BODY} />
        </AutaraIcon>
    )
}

/* ─── Money ─────────────────────────────────────────────────────────────── */

/** A card: the plan and fees, a card on file. */
export function CardIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="card" {...props}>
            <rect x="3.4" y="5.8" width="17.2" height="12.4" rx="3" style={BODY} />
            <path d="M3.4 10h17.2M7 14.6h3.4" />
        </AutaraIcon>
    )
}

/** A bank: payouts, the payout account. */
export function PayoutIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="payout" {...props}>
            <path
                d="M11 4a1.9 1.9 0 0 1 2 0l6.8 4.3c.4.3.6.7.6 1.1a.8.8 0 0 1-.8.8H4.4a.8.8 0 0 1-.8-.8c0-.4.2-.8.6-1.1z"
                style={BODY}
            />
            <path d="M6.8 13.2v3.8M12 13.2v3.8M17.2 13.2v3.8M3.8 20.2h16.4" />
            <circle cx="12" cy="7.4" r="1" stroke="none" style={DETAIL} />
        </AutaraIcon>
    )
}

/* ─── People ────────────────────────────────────────────────────────────── */

/* A person whose right shoulder stops short, so a mark can sit in the
   corner (the same corner as the photo marks). */
const PERSON_HEAD = { cx: 9.4, cy: 8.4, r: 3.4 }
const PERSON_SHOULDERS = 'M12.6 19.6H3.4c.6-3.2 3-5.2 6-5.2 1.3 0 2.5.3 3.5.9'

/** A person struck off: a no-show recorded, someone removed. */
export function UserRemoveIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="user-remove" {...props}>
            <circle {...PERSON_HEAD} style={BODY} />
            <path d={PERSON_SHOULDERS} style={BODY} />
            <path d="m15.6 15.6 3.6 3.6M19.2 15.6l-3.6 3.6" />
        </AutaraIcon>
    )
}

/** A person and a no-entry sign: mark a no-show, block. */
export function UserBlockIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="user-block" {...props}>
            <circle {...PERSON_HEAD} style={BODY} />
            <path d={PERSON_SHOULDERS} style={BODY} />
            <circle cx="17.4" cy="17.2" r="3.2" />
            <path d="m15.1 19.5 4.6-4.6" />
        </AutaraIcon>
    )
}

/* ─── Photos ────────────────────────────────────────────────────────────── */

/** A picture: a photo, a gallery, no photo yet. */
export function PhotoIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="photo" {...props}>
            <rect x="3.4" y="4.2" width="17.2" height="15.6" rx="3.4" style={BODY} />
            <path d="m3.8 16.4 4.1-4.1a1.9 1.9 0 0 1 2.7 0l5.4 5.4M13.6 15.2l1.4-1.4a1.9 1.9 0 0 1 2.7 0l2.6 2.6" />
            <circle cx="15.4" cy="8.8" r="1.6" stroke="none" style={DETAIL} />
        </AutaraIcon>
    )
}

/** The picture, its corner given to a mark (Wise's corner-badge pattern). */
function PhotoWithMark({ glyph, mark, ...props }: AutaraIconProps & { glyph: string; mark: string }) {
    return (
        <AutaraIcon glyph={glyph} {...props}>
            <path
                d="M20.6 12.4V7.6a3.4 3.4 0 0 0-3.4-3.4H6.8a3.4 3.4 0 0 0-3.4 3.4v9a3.4 3.4 0 0 0 3.4 3.4h5.6"
                style={BODY}
            />
            <path d="m3.8 15.6 3.7-3.7a1.9 1.9 0 0 1 2.7 0l3 3" />
            <circle cx="14.4" cy="8.6" r="1.5" stroke="none" style={DETAIL} />
            <path d={mark} />
        </AutaraIcon>
    )
}

/** Add a photo. */
export function PhotoAddIcon(props: AutaraIconProps) {
    return <PhotoWithMark glyph="photo-add" mark="M17.6 14.6v6M14.6 17.6h6" {...props} />
}

/** A photo approved. */
export function PhotoCheckIcon(props: AutaraIconProps) {
    return <PhotoWithMark glyph="photo-check" mark="m14.8 17.8 1.9 1.9 3.7-3.8" {...props} />
}

/** A photo removed or turned down. */
export function PhotoRemoveIcon(props: AutaraIconProps) {
    return <PhotoWithMark glyph="photo-remove" mark="m15.4 15.4 4.2 4.2M19.6 15.4l-4.2 4.2" {...props} />
}

const CAMERA_BODY =
    'M3.4 9.6a2.8 2.8 0 0 1 2.8-2.8h1.5l1.2-1.9a1.8 1.8 0 0 1 1.5-.8h3.2a1.8 1.8 0 0 1 1.5.8l1.2 1.9h1.5a2.8 2.8 0 0 1 2.8 2.8v7.6a2.8 2.8 0 0 1-2.8 2.8H6.2a2.8 2.8 0 0 1-2.8-2.8z'

/** A camera: Instagram, a photo taken. */
export function CameraIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="camera" {...props}>
            <path d={CAMERA_BODY} style={BODY} />
            <circle cx="12" cy="13.2" r="3.4" />
            <circle cx="17.3" cy="9.6" r=".9" stroke="none" style={DETAIL} />
        </AutaraIcon>
    )
}

/** A camera with a plus in its lens: take a photo to add. */
export function CameraAddIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="camera-add" {...props}>
            <path d={CAMERA_BODY} style={BODY} />
            <circle cx="12" cy="13.2" r="3.7" />
            <path d="M12 11.6v3.2M10.4 13.2h3.2" />
        </AutaraIcon>
    )
}

/* ─── Paper ─────────────────────────────────────────────────────────────── */

const PAGE = 'M7.6 3.4h6L19 8.8V18a2.6 2.6 0 0 1-2.6 2.6H7.6A2.6 2.6 0 0 1 5 18V6a2.6 2.6 0 0 1 2.6-2.6z'
const PAGE_FOLD = 'M13.6 3.4V7a1.8 1.8 0 0 0 1.8 1.8H19'

/** A page with a folded corner: a document, the terms. */
export function DocumentIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="document" {...props}>
            <path d={PAGE} style={BODY} />
            <path d={PAGE_FOLD} />
            <path d="M8.6 13h6.8M8.6 16.4h4.2" />
        </AutaraIcon>
    )
}

/** A page with a plus: a new invoice, a new document. */
export function DocumentAddIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="document-add" {...props}>
            <path d={PAGE} style={BODY} />
            <path d={PAGE_FOLD} />
            <path d="M12 11.6v6M9 14.6h6" />
        </AutaraIcon>
    )
}

/** A sticky note with its corner lifted: a note. */
export function NotesIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="notes" {...props}>
            <path d="M6.4 3.6h11.2a2.8 2.8 0 0 1 2.8 2.8v7.8l-6.2 6.2H6.4a2.8 2.8 0 0 1-2.8-2.8V6.4a2.8 2.8 0 0 1 2.8-2.8z" style={BODY} />
            <path d="M20.4 14.2h-3.4a2.8 2.8 0 0 0-2.8 2.8v3.4M7.6 8.6h8.8M7.6 12h5" />
        </AutaraIcon>
    )
}

/** A clipboard with ticked rows: a checklist, an application to finish. */
export function ChecklistIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="checklist" {...props}>
            <path d="M8.8 5H7.8a3 3 0 0 0-3 3v9.6a3 3 0 0 0 3 3h8.4a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3h-1" style={BODY} />
            <rect x="8.8" y="3.4" width="6.4" height="3.2" rx="1.4" />
            <path d="m8 11.6 1.3 1.3 2.3-2.3M8 16l1.3 1.3 2.3-2.3M13.8 12h2.4M13.8 16.4h2.4" />
        </AutaraIcon>
    )
}

/* ─── The app and its account ───────────────────────────────────────────── */

/** A monitor and a phone: install the app, devices. */
export function DevicesIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="devices" {...props}>
            <path d="M13.4 15H6a2.6 2.6 0 0 1-2.6-2.6V7.2A2.6 2.6 0 0 1 6 4.6h8.6a2.6 2.6 0 0 1 2.6 2.6v.6H14V15z" stroke="none" style={BODY} />
            <path d="M12.6 15H6a2.6 2.6 0 0 1-2.6-2.6V7.2A2.6 2.6 0 0 1 6 4.6h8.6a2.6 2.6 0 0 1 2.6 2.6v.6M6.8 19.4h4.4M9 15v4.4" />
            <rect x="15" y="9.6" width="5.6" height="11" rx="1.8" style={BODY} />
            <path d="M17.2 18.2h1.2" />
        </AutaraIcon>
    )
}

/** A wand and sparkles: the work happening, a service done well. */
export function MagicIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="magic" {...props}>
            <rect x="-1.5" y="-6.6" width="3" height="13.2" rx="1.5" transform="translate(9.1 14.9) rotate(45)" style={BODY} />
            <path d="m10.9 11 2.1 2.1" />
            <path
                d="M17.4 3.4c.4 1.6 1.5 2.7 3.2 3.2-1.7.4-2.8 1.5-3.2 3.2-.4-1.7-1.5-2.8-3.2-3.2 1.6-.5 2.8-1.6 3.2-3.2z"
                stroke="none"
                style={DETAIL}
            />
            <path d="M19.2 12.8v2.6M17.9 14.1h2.6" />
        </AutaraIcon>
    )
}

const SHIELD =
    'M11.5 3.6a1.4 1.4 0 0 1 1 0l6 2.2a1.4 1.4 0 0 1 .9 1.3v4.5c0 4.3-2.9 7.5-7.4 8.9-4.5-1.4-7.4-4.6-7.4-8.9V7.1a1.4 1.4 0 0 1 .9-1.3z'

/** A shield with a tick: verified, privacy. */
export function VerifiedIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="verified" {...props}>
            <path d={SHIELD} style={BODY} />
            <path d="m8.9 12.1 2.2 2.2 4.1-4.2" />
        </AutaraIcon>
    )
}

/** A shield with a person: identity, verification, account security. */
export function SecurityIcon(props: AutaraIconProps) {
    return (
        <AutaraIcon glyph="security" {...props}>
            <path d={SHIELD} style={BODY} />
            <circle cx="12" cy="10" r="2.2" />
            <path d="M8.6 16.2c.8-1.6 2-2.4 3.4-2.4s2.6.8 3.4 2.4" />
        </AutaraIcon>
    )
}
