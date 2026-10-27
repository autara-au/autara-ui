"use client";

import { cn } from "../lib/cn";
import { Button } from "./Button";
import { ChipRow, type ChipRowArrows } from "./ChipRow";

/**
 * QuickReplies — one-tap messages for the moments that repeat (AUTM-1806, U4).
 *
 * "I'm running late", "I'm here", "15 minutes away": a row of 44px band
 * chips above the composer. A chip FILLS the composer, it never sends: the
 * consumer puts `reply.value ?? reply.label` in the field and focuses it, so
 * the person can add a word or change their mind (Uber's driver chips, steal;
 * a bot answering for them, avoid).
 *
 * The chips WRAP onto a second line rather than scrolling sideways or
 * clipping, so every one is visible and reachable at 200% text. That is why
 * this is not FilterChipRow, whose chips are about 32px and scroll (AUTM-622).
 * Each chip is the library's quiet Button at `sm`: 44px tall, pill by its own
 * half-height radius, a label that wraps inside the box when it must.
 *
 * `role="group"` with a label, so a screen reader hears "Quick replies,
 * group" before the chips; keyboard order is the reading order.
 *
 * AUTM-1878 — `layout="row"`: ONE line that scrolls sideways (Uber's driver
 * chips, LinkedIn's suggested replies), for a composer that must keep its
 * thread in view. The edge that has more chips past it fades out (a mask,
 * so it works on any surface), and only that edge: the reader sees there is
 * more and which way. The group keeps its name, and the chips are buttons,
 * so Tab walks them and the browser scrolls each one into view. Use `wrap`
 * (the default) where every chip must be visible at once, such as at 200%
 * text.
 *
 * AUTM-1756 follow-up: the row is a `ChipRow`. No scrollbar (Don,
 * 2026-10-15: "instead of scrollbar can add an chevron arrow in the ending,
 * to move it. also dragable"); a round chevron on the fade at the end that
 * has more ("Show more replies"), one at the start once it has moved, a
 * mouse or pen drag that never sends a chip's click, and a finger's own
 * swipe. `className` still lands on the row of chips; `rootClassName` on the
 * box around it.
 */
export interface QuickReply {
  id: string;
  /** The chip's words. */
  label: string;
  /** What goes in the composer, when it differs from the label. */
  value?: string;
  /** AUTM-1878: this chip's own `data-testid`, in place of `chipTestId`. */
  testId?: string;
}

export interface QuickRepliesProps {
  replies: QuickReply[];
  onSelect: (reply: QuickReply) => void;
  /** The group's accessible name. Default "Quick replies". */
  label?: string;
  /** `data-testid` on every chip; each also carries `data-reply-id`. */
  chipTestId?: string;
  disabled?: boolean;
  /** `wrap` (default): chips wrap onto more lines. `row`: one line that scrolls sideways, with edge fades and chevrons. */
  layout?: "wrap" | "row";
  /** `row` only: the chevrons, as ChipRow takes them. Default `auto` (where a fine pointer exists). */
  arrows?: ChipRowArrows;
  /** `row` only: the end chevron's accessible name. Default "Show more replies". */
  nextLabel?: string;
  /** `row` only: the start chevron's accessible name. Default "Show earlier replies". */
  previousLabel?: string;
  /** `row` only: classes for the box around the row (margins, flex sizing). */
  rootClassName?: string;
  className?: string;
}

export function QuickReplies({
  replies,
  onSelect,
  label = "Quick replies",
  chipTestId,
  disabled,
  layout = "wrap",
  arrows = "auto",
  nextLabel = "Show more replies",
  previousLabel = "Show earlier replies",
  rootClassName,
  className,
}: QuickRepliesProps) {
  if (replies.length === 0) return null;

  if (layout === "row") {
    return (
      <ChipRow
        label={label}
        data-layout="row"
        arrows={arrows}
        nextLabel={nextLabel}
        previousLabel={previousLabel}
        rootClassName={rootClassName}
        className={cn("gap-2", className)}
      >
        {replies.map((reply) => (
          <Button
            key={reply.id}
            variant="quiet"
            size="sm"
            disabled={disabled}
            onClick={() => onSelect(reply)}
            data-testid={reply.testId ?? chipTestId}
            data-reply-id={reply.id}
            className="shrink-0 whitespace-nowrap"
          >
            {reply.label}
          </Button>
        ))}
      </ChipRow>
    );
  }

  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {replies.map((reply) => (
        <Button
          key={reply.id}
          variant="quiet"
          size="sm"
          disabled={disabled}
          onClick={() => onSelect(reply)}
          data-testid={reply.testId ?? chipTestId}
          data-reply-id={reply.id}
          className="max-w-full"
        >
          {reply.label}
        </Button>
      ))}
    </div>
  );
}
