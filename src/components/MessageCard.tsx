import { useId, type HTMLAttributes, type ReactNode } from "react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { cn } from "../lib/cn";

/**
 * MessageCard — a structured row in a conversation thread (AUTM-1806, U3).
 *
 * One shell for every card the thread will carry: an extra to approve now,
 * a time change and a payment later. It is a WINDOW onto a record the server
 * owns, never a number typed into chat: every figure, the state and the
 * balance line come from the consumer's live row (booking_addons for an
 * extra), and the card draws nothing it was not given.
 *
 * Anatomy, top to bottom: kicker (who and what kind), title with the figure
 * beside it, body (the pro's reason), the balance line (the server's
 * balanceIfApproved, never computed here), the state chip, an error line, two
 * EQUAL actions, a footnote and a footer slot for a link.
 *
 *   - The two actions weigh the same: same size, same row, no confirm step,
 *     no countdown, no warning colour (AUTM-1203, as ExtrasReview). The
 *     secondary one comes first, as on ExtrasReview ("No thanks", then
 *     "Approve"). At large text they stack instead of squeezing.
 *   - The state chip is solid (Badge): waiting is brand (pending), approved
 *     is lime (done), declined and expired are band. Declined and expired
 *     never wear a warning colour. The chip sits in a polite status region,
 *     so when the row changes ("Approved") it is read out once.
 *   - A failed answer says so in words with an icon, in danger text, and the
 *     actions stay (nothing changed, try again).
 *
 * Surface: the band card of the Autara Web palette (raised in dark, where
 * band on dark paper is 1.1:1), via `--message-card`. Actions on it are
 * the lime primary and a raised quiet (AUTM-1838: no black buttons; the ink
 * label on lime is what identifies it, on band as on paper).
 */
export type MessageCardState = "waiting" | "approved" | "declined" | "expired";

export interface MessageCardAction {
  label: string;
  onClick: () => void;
  /** The Autara mark over the label while the answer is in flight. */
  busy?: boolean;
  disabled?: boolean;
  /**
   * The full name, naming the thing and its price ("Approve Pet hair removal,
   * $40.00"), so a screen reader user tabbing between cards knows which one.
   */
  ariaLabel?: string;
  testId?: string;
  /**
   * AUTM-1878 follow-up: a destructive answer (Remove an extra). Drawn as the
   * library's `danger`, red words on the quiet pill, never as the primary.
   */
  destructive?: boolean;
  /**
   * AUTM-1905: the action verb's icon (AUTM-1900's ruling: Remind, Approve and
   * peers), about 1.25em and `aria-hidden`; the label stays the accessible name.
   */
  leadingIcon?: ReactNode;
}

export interface MessageCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** Who and what kind: "Extra to approve, from Kerbside Car Care". */
  kicker?: ReactNode;
  title: ReactNode;
  /** The amount beside the title, from the server ("+$40.00"). */
  figure?: ReactNode;
  /** The reason, as body copy. */
  body?: ReactNode;
  /** The server's balance sentence ("If you approve, your balance becomes $190.00."). */
  balance?: ReactNode;
  state?: MessageCardState;
  /** Overrides the chip's word ("Waiting for Sam"). */
  stateLabel?: string;
  primaryAction?: MessageCardAction;
  secondaryAction?: MessageCardAction;
  /** A failed action, said plainly ("We couldn't save your answer. Nothing has changed. Try again."). */
  error?: ReactNode;
  /** Small print under the actions ("You are not charged unless you approve."). */
  footnote?: ReactNode;
  /** A link or text action at the foot ("Message Kerbside about this"). */
  footer?: ReactNode;
  testId?: string;
}

const STATE_TONE: Record<MessageCardState, "brand" | "lime" | "band"> = {
  waiting: "brand",
  approved: "lime",
  declined: "band",
  expired: "band",
};

const STATE_LABEL: Record<MessageCardState, string> = {
  waiting: "Waiting",
  approved: "Approved",
  declined: "Declined",
  expired: "Expired",
};

/** Solar "Danger Circle", Bold style, inlined. */
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

export function MessageCard({
  kicker,
  title,
  figure,
  body,
  balance,
  state,
  stateLabel,
  primaryAction,
  secondaryAction,
  error,
  footnote,
  footer,
  testId,
  className,
  ...rest
}: MessageCardProps) {
  const titleId = useId();
  const busy = Boolean(primaryAction?.busy || secondaryAction?.busy);
  const actions = [secondaryAction, primaryAction].filter(
    (a): a is MessageCardAction => Boolean(a),
  );

  return (
    <article
      aria-labelledby={titleId}
      aria-busy={busy || undefined}
      data-state={state}
      data-testid={testId}
      className={cn(
        "flex w-full max-w-[26rem] flex-col gap-2.5 rounded-[1.25rem] bg-[var(--message-card)] p-4 text-[var(--text-strong)]",
        className,
      )}
      {...rest}
    >
      {kicker ? (
        <p className="text-[0.8125rem] font-medium leading-snug text-[var(--text-muted)]">{kicker}</p>
      ) : null}

      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p id={titleId} className="min-w-0 text-base font-bold leading-snug">
          {title}
        </p>
        {figure ? (
          <p className="shrink-0 text-[1.0625rem] font-bold leading-snug tabular-nums">{figure}</p>
        ) : null}
      </div>

      {body ? <div className="text-[0.9375rem] leading-normal text-[var(--text-muted)]">{body}</div> : null}

      {balance ? <p className="text-[0.9375rem] font-medium leading-normal">{balance}</p> : null}

      {state ? (
        <div role="status" className="flex">
          <Badge variant={STATE_TONE[state]}>{stateLabel ?? STATE_LABEL[state]}</Badge>
        </div>
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

      {actions.length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-2">
          {actions.map((a, i) => {
            const isPrimary = a === primaryAction;
            return (
              <Button
                key={i}
                variant={isPrimary ? "primary" : a.destructive ? "danger" : "quiet"}
                size="md"
                leadingIcon={a.leadingIcon}
                busy={a.busy}
                disabled={a.disabled || (busy && !a.busy)}
                onClick={a.onClick}
                aria-label={a.ariaLabel}
                data-testid={a.testId}
                className={cn(
                  "flex-1 basis-[8rem]",
                  !isPrimary &&
                    "bg-[var(--message-card-action)] not-disabled:hover:bg-[var(--message-card-action-hover)]",
                )}
              >
                {a.label}
              </Button>
            );
          })}
        </div>
      ) : null}

      {footnote ? (
        <p className="text-[0.8125rem] leading-snug text-[var(--text-subtle)]">{footnote}</p>
      ) : null}

      {footer ? <div className="flex flex-wrap items-center gap-2">{footer}</div> : null}
    </article>
  );
}
