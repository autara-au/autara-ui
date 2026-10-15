"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "../lib/cn";
import { Button } from "./Button";
import { useScrollbarReveal } from "./ScrollArea";

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
  /** `wrap` (default): chips wrap onto more lines. `row`: one line that scrolls sideways, with edge fades. */
  layout?: "wrap" | "row";
  className?: string;
}

/** The mask for whichever edges have chips past them. 2rem of fade. */
function edgeMask(start: boolean, end: boolean): CSSProperties | undefined {
  if (!start && !end) return undefined;
  const from = start ? "transparent 0, #000 2rem" : "#000 0";
  const to = end ? "#000 calc(100% - 2rem), transparent 100%" : "#000 100%";
  const image = `linear-gradient(to right, ${from}, ${to})`;
  return { maskImage: image, WebkitMaskImage: image };
}

export function QuickReplies({
  replies,
  onSelect,
  label = "Quick replies",
  chipTestId,
  disabled,
  layout = "wrap",
  className,
}: QuickRepliesProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const row = layout === "row";
  // AUTM-1756: the row's bar shows while it is used; the fade already says
  // there is more (only the row layout attaches the ref).
  useScrollbarReveal(scroller);

  useEffect(() => {
    if (!row) return;
    const el = scroller.current;
    if (!el) return;
    const measure = () => {
      // Logical edges: in a right-to-left page scrollLeft runs negative.
      const left = Math.abs(el.scrollLeft);
      const room = el.scrollWidth - el.clientWidth;
      const next = { start: left > 2, end: room - left > 2 };
      setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    if (typeof ResizeObserver === "undefined") return () => el.removeEventListener("scroll", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [row, replies.length]);

  if (replies.length === 0) return null;

  if (row) {
    return (
      <div
        ref={scroller}
        role="group"
        aria-label={label}
        data-layout="row"
        data-more-start={edges.start || undefined}
        data-more-end={edges.end || undefined}
        style={edgeMask(edges.start, edges.end)}
        className={cn("flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain pb-1", className)}
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
      </div>
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
