import { useId, type HTMLAttributes, type ReactNode } from "react";
import { Button } from "./Button";
import { cn } from "../lib/cn";

/**
 * ChatEventCard: a booking event from Autara, in the booking chat (AUTM-1881).
 *
 * Don, 2026-10-15: when a booking's status changes, both the customer and the
 * pro see it in the chat as a compact card from Autara, never as a bubble from
 * the pro. One status disc, a one-line title, one detail line, the time, and
 * at most one action. The server owns every word and figure: the consumer
 * passes the copy the API rendered for this reader (customer or pro) from the
 * stored event, and the card draws nothing it was not given.
 *
 * The tone is the disc, in the brand's three working colours plus a quiet one:
 *
 *   action    purple   this reader has something to do (Pay, Review new time)
 *   progress  aqua     in flight (request sent, job started, payment processing)
 *   done      lime     finished (confirmed, paid, refunded, new time agreed)
 *   closed    raised   over without an outcome (declined, expired, cancelled);
 *                      never a warning colour, as MessageCard's declined chip
 *
 * The glyph carries the tone's ink on its fill (white on purple 9.5:1, ink on
 * aqua and lime, ink on raised), so the disc reads where the fill alone would
 * not (lime on band). The title says what happened in words, so colour is
 * never the only signal.
 *
 * Surface: the thread's card ground, `--message-card` (band, raised in dark),
 * as MessageCard: a solid fill, no outline (rule 4). It sits centred in
 * MessageThread as a `side: "system"` item, so it is plainly not either
 * person's message. The one action is the lime primary when the tone is
 * `action` and a raised quiet button otherwise (AUTM-1838: no black buttons),
 * 44px tall at every text size.
 *
 * Arrival: `arrived` marks a card that came in live while the thread was open
 * (never the cards of a first load, which are history). Its disc and text then
 * rise in with `.motion-rows`, the library's row arrival (opacity and a 4px
 * translate on the one ease-out), declared only under
 * `prefers-reduced-motion: no-preference`, so a reader who asked for less
 * motion sees it in place. The card adds no other motion; the button's press
 * is Button's own.
 */
export type ChatEventTone = "action" | "progress" | "done" | "closed";

export interface ChatEventAction {
  label: string;
  onClick: () => void;
  /** The Autara mark over the label while the action is in flight. */
  busy?: boolean;
  /**
   * The full name when the label alone is ambiguous between cards
   * ("Pay the $80.00 balance for Exterior wash").
   */
  ariaLabel?: string;
  /** Overrides the tone's choice: `primary` (lime) or `quiet` (raised). */
  variant?: "primary" | "quiet";
  testId?: string;
}

export interface ChatEventCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  tone: ChatEventTone;
  /** A glyph from `chatEventGlyphs`; defaults to the tone's own. */
  icon?: ReactNode;
  /** One line: what happened ("Booking confirmed"). */
  title: ReactNode;
  /** One line: the figure or the next step ("$40.00 deposit charged. See you Sat 18 Oct, 9:00 am."). */
  detail?: ReactNode;
  /** The time as the reader should see it ("9:41 am"). */
  time: string;
  /** The same moment as an ISO string, for `<time dateTime>`. */
  dateTime?: string;
  /** Who it is from, said before the title. Default "Autara". */
  from?: string;
  action?: ChatEventAction;
  /**
   * The action failed, said plainly in danger text with an icon ("We couldn't
   * open the payment page. Nothing was charged. Try again."). The action stays.
   */
  error?: ReactNode;
  /** True for a card that arrived live while the thread was open: it rises in once. */
  arrived?: boolean;
  testId?: string;
}

const DISC: Record<ChatEventTone, string> = {
  action: "bg-[var(--accent-fill)] text-[var(--on-accent)]",
  progress: "bg-[var(--aqua)] text-[var(--on-aqua)]",
  done: "bg-[var(--lime)] text-[var(--on-lime)]",
  closed: "bg-[var(--message-card-action)] text-[var(--text-strong)]",
};

export const chatEventGlyphs = {
  /** Solar "Hourglass", Bold: a request waiting for an answer. */
  requested: (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M5.19825 3.29918C5.80046 2 7.86697 2 12 2C16.133 2 18.1995 2 18.8017 3.29918C18.8535 3.41086 18.8972 3.52686 18.9323 3.6461C19.3414 5.0333 17.8802 6.64111 14.9577 9.85674L13 12L14.9577 14.1433C17.8802 17.3589 19.3414 18.9667 18.9323 20.3539C18.8972 20.4731 18.8535 20.5891 18.8017 20.7008C18.1995 22 16.133 22 12 22C7.86697 22 5.80046 22 5.19825 20.7008C5.14649 20.5891 5.10282 20.4731 5.06765 20.3539C4.65857 18.9667 6.11981 17.3589 9.0423 14.1433L11 12L9.0423 9.85674C6.11981 6.64111 4.65857 5.0333 5.06765 3.6461C5.10282 3.52686 5.14649 3.41086 5.19825 3.29918Z" />
    </svg>
  ),
  /** Solar "Calendar Mark", Bold: a booking confirmed. */
  confirmed: (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M7.75 2.5C7.75 2.08579 7.41421 1.75 7 1.75C6.58579 1.75 6.25 2.08579 6.25 2.5V4.07926C4.81067 4.19451 3.86577 4.47737 3.17157 5.17157C2.47737 5.86577 2.19451 6.81067 2.07926 8.25H21.9207C21.8055 6.81067 21.5226 5.86577 20.8284 5.17157C20.1342 4.47737 19.1893 4.19451 17.75 4.07926V2.5C17.75 2.08579 17.4142 1.75 17 1.75C16.5858 1.75 16.25 2.08579 16.25 2.5V4.0129C15.5847 4 14.839 4 14 4H10C9.16097 4 8.41527 4 7.75 4.0129V2.5Z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M22 12V14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14V12C2 11.161 2 10.4153 2.0129 9.75H21.9871C22 10.4153 22 11.161 22 12ZM16.5 18C17.3284 18 18 17.3284 18 16.5C18 15.6716 17.3284 15 16.5 15C15.6716 15 15 15.6716 15 16.5C15 17.3284 15.6716 18 16.5 18Z" />
    </svg>
  ),
  /** Solar "Calendar", Bold: a new time asked, accepted or declined. */
  time: (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M7.75 2.5C7.75 2.08579 7.41421 1.75 7 1.75C6.58579 1.75 6.25 2.08579 6.25 2.5V4.07926C4.81067 4.19451 3.86577 4.47737 3.17157 5.17157C2.47737 5.86577 2.19451 6.81067 2.07926 8.25H21.9207C21.8055 6.81067 21.5226 5.86577 20.8284 5.17157C20.1342 4.47737 19.1893 4.19451 17.75 4.07926V2.5C17.75 2.08579 17.4142 1.75 17 1.75C16.5858 1.75 16.25 2.08579 16.25 2.5V4.0129C15.5847 4 14.839 4 14 4H10C9.16097 4 8.41527 4 7.75 4.0129V2.5Z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M2 12C2 11.161 2 10.4153 2.0129 9.75H21.9871C22 10.4153 22 11.161 22 12V14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14V12ZM17 14C17.5523 14 18 13.5523 18 13C18 12.4477 17.5523 12 17 12C16.4477 12 16 12.4477 16 13C16 13.5523 16.4477 14 17 14ZM17 18C17.5523 18 18 17.5523 18 17C18 16.4477 17.5523 16 17 16C16.4477 16 16 16.4477 16 17C16 17.5523 16.4477 18 17 18ZM13 13C13 13.5523 12.5523 14 12 14C11.4477 14 11 13.5523 11 13C11 12.4477 11.4477 12 12 12C12.5523 12 13 12.4477 13 13ZM13 17C13 17.5523 12.5523 18 12 18C11.4477 18 11 17.5523 11 17C11 16.4477 11.4477 16 12 16C12.5523 16 13 16.4477 13 17ZM7 14C7.55228 14 8 13.5523 8 13C8 12.4477 7.55228 12 7 12C6.44772 12 6 12.4477 6 13C6 13.5523 6.44772 14 7 14ZM7 18C7.55228 18 8 17.5523 8 17C8 16.4477 7.55228 16 7 16C6.44772 16 6 16.4477 6 17C6 17.5523 6.44772 18 7 18Z" />
    </svg>
  ),
  /** Solar "Stopwatch Play", Bold: the job under way. */
  started: (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M9.25 2.75C9.25 2.33579 9.58579 2 10 2H14C14.4142 2 14.75 2.33579 14.75 2.75C14.75 3.16421 14.4142 3.5 14 3.5H10C9.58579 3.5 9.25 3.16421 9.25 2.75Z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M21 13.75C21 18.7206 16.9706 22.75 12 22.75C7.02944 22.75 3 18.7206 3 13.75C3 8.77944 7.02944 4.75 12 4.75C16.9706 4.75 21 8.77944 21 13.75ZM13.0261 11.0249C12.7888 10.8583 12.5201 10.686 12.2419 10.5168C11.1695 9.86466 10.6333 9.53859 10.1524 9.8996C9.6715 10.2606 9.62779 11.0164 9.54038 12.5278C9.51566 12.9553 9.5 13.3743 9.5 13.75C9.5 14.1257 9.51566 14.5447 9.54038 14.9722C9.62779 16.4836 9.6715 17.2394 10.1524 17.6004C10.6333 17.9614 11.1695 17.6353 12.2419 16.9832C12.5201 16.814 12.7888 16.6417 13.0261 16.4751C13.2966 16.2852 13.5909 16.0573 13.8876 15.8152C14.9625 14.9383 15.5 14.4999 15.5 13.75C15.5 13.0001 14.9625 12.5617 13.8876 11.6848C13.5909 11.4427 13.2966 11.2148 13.0261 11.0249Z" />
    </svg>
  ),
  /** Solar "Check Circle", Bold: the job complete or paid. */
  done: (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM16.0303 8.96967C16.3232 9.26256 16.3232 9.73744 16.0303 10.0303L11.0303 15.0303C10.7374 15.3232 10.2626 15.3232 9.96967 15.0303L7.96967 13.0303C7.67678 12.7374 7.67678 12.2626 7.96967 11.9697C8.26256 11.6768 8.73744 11.6768 9.03033 11.9697L10.5 13.4393L12.7348 11.2045L14.9697 8.96967C15.2626 8.67678 15.7374 8.67678 16.0303 8.96967Z" />
    </svg>
  ),
  /** Solar "Card", Bold: a balance to pay, a deposit charged. */
  payment: (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M14 4H10C6.22876 4 4.34315 4 3.17157 5.17157C2.32803 6.01511 2.09185 7.22882 2.02572 9.25H21.9743C21.9082 7.22882 21.672 6.01511 20.8284 5.17157C19.6569 4 17.7712 4 14 4Z" />
      <path d="M10 20H14C17.7712 20 19.6569 20 20.8284 18.8284C22 17.6569 22 15.7712 22 12C22 11.5581 22 11.142 21.9981 10.75H2.00189C2 11.142 2 11.5581 2 12C2 15.7712 2 17.6569 3.17157 18.8284C4.34315 20 6.22876 20 10 20Z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M5.25 16C5.25 15.5858 5.58579 15.25 6 15.25H10C10.4142 15.25 10.75 15.5858 10.75 16C10.75 16.4142 10.4142 16.75 10 16.75H6C5.58579 16.75 5.25 16.4142 5.25 16Z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M11.75 16C11.75 15.5858 12.0858 15.25 12.5 15.25H14C14.4142 15.25 14.75 15.5858 14.75 16C14.75 16.4142 14.4142 16.75 14 16.75H12.5C12.0858 16.75 11.75 16.4142 11.75 16Z" />
    </svg>
  ),
  /** Solar "Card Receive", Bold: money back to the card. */
  refund: (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M18.4697 20.5303C18.7626 20.8232 19.2374 20.8232 19.5303 20.5303L21.5303 18.5303C21.8232 18.2374 21.8232 17.7626 21.5303 17.4697C21.2374 17.1768 20.7626 17.1768 20.4697 17.4697L19.75 18.1893V14C19.75 13.5858 19.4142 13.25 19 13.25C18.5858 13.25 18.25 13.5858 18.25 14V18.1893L17.5303 17.4697C17.2374 17.1768 16.7626 17.1768 16.4697 17.4697C16.1768 17.7626 16.1768 18.2374 16.4697 18.5303L18.4697 20.5303Z" />
      <path d="M10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C21.672 6.01511 21.9082 7.22882 21.9743 9.25H2.02572C2.09185 7.22882 2.32803 6.01511 3.17157 5.17157C4.34315 4 6.22876 4 10 4Z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M10 20H14C14.6595 20 15.2613 20 15.8118 19.9937L15.409 19.591C14.5303 18.7123 14.5303 17.2877 15.409 16.409C15.7847 16.0334 16.2601 15.8183 16.75 15.7638V14C16.75 12.7574 17.7574 11.75 19 11.75C20.2426 11.75 21.25 12.7574 21.25 14V15.7638C21.4739 15.7887 21.6947 15.8471 21.9044 15.9391C22 14.9172 22 13.636 22 12C22 11.5581 22 11.142 21.9981 10.75H2.00189C2 11.142 2 11.5581 2 12C2 15.7712 2 17.6569 3.17157 18.8284C4.34315 20 6.22876 20 10 20ZM6 15.25C5.58579 15.25 5.25 15.5858 5.25 16C5.25 16.4142 5.58579 16.75 6 16.75H10C10.4142 16.75 10.75 16.4142 10.75 16C10.75 15.5858 10.4142 15.25 10 15.25H6ZM12.5 15.25C12.0858 15.25 11.75 15.5858 11.75 16C11.75 16.4142 12.0858 16.75 12.5 16.75H14C14.4142 16.75 14.75 16.4142 14.75 16C14.75 15.5858 14.4142 15.25 14 15.25H12.5Z" />
    </svg>
  ),
  /** Solar "Close Circle", Bold: declined, expired or cancelled. */
  cancelled: (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM8.96963 8.96965C9.26252 8.67676 9.73739 8.67676 10.0303 8.96965L12 10.9393L13.9696 8.96967C14.2625 8.67678 14.7374 8.67678 15.0303 8.96967C15.3232 9.26256 15.3232 9.73744 15.0303 10.0303L13.0606 12L15.0303 13.9696C15.3232 14.2625 15.3232 14.7374 15.0303 15.0303C14.7374 15.3232 14.2625 15.3232 13.9696 15.0303L12 13.0607L10.0303 15.0303C9.73742 15.3232 9.26254 15.3232 8.96965 15.0303C8.67676 14.7374 8.67676 14.2625 8.96965 13.9697L10.9393 12L8.96963 10.0303C8.67673 9.73742 8.67673 9.26254 8.96963 8.96965Z" />
    </svg>
  ),
  /** Solar "Danger Triangle", Bold: a payment that did not go through. */
  problem: (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M5.31171 10.7615C8.23007 5.58716 9.68925 3 12 3C14.3107 3 15.7699 5.58716 18.6883 10.7615L19.0519 11.4063C21.4771 15.7061 22.6897 17.856 21.5937 19.428C20.4978 21 17.7864 21 12.3637 21H11.6363C6.21356 21 3.50217 21 2.40626 19.428C1.31034 17.856 2.52291 15.7061 4.94805 11.4063L5.31171 10.7615ZM12 7.25C12.4142 7.25 12.75 7.58579 12.75 8V13C12.75 13.4142 12.4142 13.75 12 13.75C11.5858 13.75 11.25 13.4142 11.25 13V8C11.25 7.58579 11.5858 7.25 12 7.25ZM12 17C12.5523 17 13 16.5523 13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17Z" />
    </svg>
  ),
  /** Solar "Star", Bold: a review asked for. */
  review: (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M9.15316 5.40838C10.4198 3.13613 11.0531 2 12 2C12.9469 2 13.5802 3.13612 14.8468 5.40837L15.1745 5.99623C15.5345 6.64193 15.7144 6.96479 15.9951 7.17781C16.2757 7.39083 16.6251 7.4699 17.3241 7.62805L17.9605 7.77203C20.4201 8.32856 21.65 8.60682 21.9426 9.54773C22.2352 10.4886 21.3968 11.4691 19.7199 13.4299L19.2861 13.9372C18.8096 14.4944 18.5713 14.773 18.4641 15.1177C18.357 15.4624 18.393 15.8341 18.465 16.5776L18.5306 17.2544C18.7841 19.8706 18.9109 21.1787 18.1449 21.7602C17.3788 22.3417 16.2273 21.8115 13.9243 20.7512L13.3285 20.4768C12.6741 20.1755 12.3469 20.0248 12 20.0248C11.6531 20.0248 11.3259 20.1755 10.6715 20.4768L10.0757 20.7512C7.77268 21.8115 6.62118 22.3417 5.85515 21.7602C5.08912 21.1787 5.21588 19.8706 5.4694 17.2544L5.53498 16.5776C5.60703 15.8341 5.64305 15.4624 5.53586 15.1177C5.42868 14.773 5.19043 14.4944 4.71392 13.9372L4.2801 13.4299C2.60325 11.4691 1.76482 10.4886 2.05742 9.54773C2.35002 8.60682 3.57986 8.32856 6.03954 7.77203L6.67589 7.62805C7.37485 7.4699 7.72433 7.39083 8.00494 7.17781C8.28555 6.96479 8.46553 6.64194 8.82547 5.99623L9.15316 5.40838Z" />
    </svg>
  ),
} satisfies Record<string, ReactNode>;

/** Solar "Danger Circle", Bold, inlined, as MessageCard's error line. */
function ErrorGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="mt-0.5 shrink-0">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10ZM12 6.25a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0V7a.75.75 0 0 1 .75-.75ZM12 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
      />
    </svg>
  );
}

const TONE_GLYPH: Record<ChatEventTone, ReactNode> = {
  action: chatEventGlyphs.payment,
  progress: chatEventGlyphs.requested,
  done: chatEventGlyphs.done,
  closed: chatEventGlyphs.cancelled,
};

export function ChatEventCard({
  tone,
  icon,
  title,
  detail,
  time,
  dateTime,
  from = "Autara",
  action,
  error,
  arrived,
  testId,
  className,
  ...rest
}: ChatEventCardProps) {
  const titleId = useId();
  const detailId = useId();
  const variant = action?.variant ?? (tone === "action" ? "primary" : "quiet");

  return (
    <article
      aria-labelledby={titleId}
      aria-describedby={detail ? detailId : undefined}
      aria-busy={action?.busy || undefined}
      data-tone={tone}
      data-testid={testId}
      className={cn(
        "flex w-full max-w-[26rem] flex-wrap gap-3 rounded-[1.25rem] bg-[var(--message-card)] p-3.5 text-[var(--text-strong)]",
        arrived && "motion-rows",
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        data-slot="disc"
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full [&>svg]:h-5 [&>svg]:w-5",
          DISC[tone],
        )}
      >
        {icon ?? TONE_GLYPH[tone]}
      </span>

      {/* 12rem before it wraps: beside the disc at normal sizes, under it at
          large text, where a column beside a 72px disc left four words a line. */}
      <div className="flex min-w-0 flex-1 basis-[12rem] flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p id={titleId} className="min-w-0 text-[0.9375rem] font-bold leading-snug">
            <span className="sr-only">{`From ${from}: `}</span>
            {title}
          </p>
          <p className="shrink-0 text-[0.8125rem] leading-snug text-[var(--text-muted)]">
            <span aria-hidden="true">{`${from} · `}</span>
            <time dateTime={dateTime}>{time}</time>
          </p>
        </div>

        {detail ? (
          <p id={detailId} className="text-[0.875rem] leading-normal text-[var(--text-muted)]">
            {detail}
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="flex items-start gap-1.5 text-[0.875rem] font-medium leading-snug text-[var(--danger)]"
          >
            <ErrorGlyph />
            <span>{error}</span>
          </p>
        ) : null}

        {action ? (
          <div className="mt-1.5 flex">
            <Button
              variant={variant}
              size="sm"
              busy={action.busy}
              onClick={action.onClick}
              aria-label={action.ariaLabel}
              data-testid={action.testId}
              className={cn(
                variant === "quiet" &&
                  "bg-[var(--message-card-action)] not-disabled:hover:bg-[var(--message-card-action-hover)]",
              )}
            >
              {action.label}
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
