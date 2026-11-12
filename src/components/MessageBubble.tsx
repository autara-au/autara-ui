import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * MessageBubble — a single message in an Autara conversation thread.
 *
 * Three sides, three grammars:
 *   - own       the current user's message. AUTM-1806 (U7): the canvas v53
 *               AppChat board, which Don made the visual source of truth on
 *               2026-10-09, draws it as a brand purple bubble with white text,
 *               and Send beside it as the lime primary. Until AUTM-1806 this
 *               was the ink capsule, on the older rule that purple is never a
 *               bubble fill; the board supersedes that rule for the thread.
 *   - incoming  the other party's message. Band (cream) with ink, no edge.
 *   - system    a centered, muted status line ("Booking confirmed") — no
 *               bubble, no side.
 *
 * Colours come from the `--message-*` tokens (tokens/colors.css), defined in
 * both themes, so the thread moves in one place. No drop shadow (house rule).
 * The tail is one tighter corner on the speaker's side (20px, 6px), as the
 * board draws it. Type is rem, so it grows with the reader's text size.
 * Newlines in `children` are preserved; long unbroken tokens wrap.
 */
export type MessageSide = "own" | "incoming" | "system";

export interface MessageBubbleProps {
  side: MessageSide;
  children: ReactNode;
  className?: string;
}

export function MessageBubble({ side, children, className }: MessageBubbleProps) {
  if (side === "system") {
    return (
      <p
        className={cn(
          "self-center text-balance px-4 text-center text-[0.8125rem] leading-snug text-[var(--text-muted)]",
          className,
        )}
      >
        {children}
      </p>
    );
  }

  const isOwn = side === "own";
  return (
    <div
      data-side={side}
      className={cn(
        "max-w-[80%] whitespace-pre-wrap break-words rounded-[1.25rem] px-4 py-2.5 text-base leading-[1.45]",
        isOwn
          ? "self-end rounded-br-md bg-[var(--message-own)] text-[var(--on-message-own)]"
          : "self-start rounded-bl-md bg-[var(--message-incoming)] text-[var(--on-message-incoming)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
