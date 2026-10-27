"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type UIEvent } from "react";
import { AsyncSkeleton } from "./AsyncSkeleton";
import { ErrorCard } from "./ErrorCard";
import { MessageBubble, type MessageSide } from "./MessageBubble";
import { cn } from "../lib/cn";

/**
 * Where your own message is (AUTM-1806, U1). `sent` draws nothing: a thread
 * full of "Sent" says nothing a bubble does not. A bubble shows only what the
 * API confirmed, so a consumer sets `sending` while the call is in flight and
 * `failed` when it did not land, and never `sent` before it resolved.
 */
export type MessageSendStatus = "sending" | "failed" | "sent";

/**
 * A single normalized message. The thread is data-agnostic — consumers map
 * their own shape (GraphQL rows, etc.) onto this; autara-ui never imports an
 * app's data layer.
 */
export interface MessageItem {
  id: string;
  side: MessageSide;
  /** The message. Optional when `body` carries the row instead. */
  text?: string;
  /**
   * AUTM-1806: rich content in place of the text bubble, for example a
   * MessageCard (an extra to approve) or, later, a photo. Aligned to `side`
   * (own to the end, incoming to the start, system centred) and sorted and
   * time-stamped with the messages, so a card sits where it happened.
   */
  body?: ReactNode;
  /** ISO string, epoch ms, or Date — used for ordering + timestamp separators. */
  createdAt?: string | number | Date;
  /** Your own message's send state (own side only). */
  status?: MessageSendStatus;
  /**
   * Resend a failed message. With it the failed line is a 44px button,
   * "Not sent. Tap to retry."; without it the line says "Not sent." only.
   * The consumer keeps the text, so nothing typed is ever lost.
   */
  onRetry?: () => void;
  /** `data-testid` on the row. */
  testId?: string;
}

export interface MessageThreadProps {
  items: MessageItem[];
  loading?: boolean;
  error?: boolean;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  /** Rendered (centered) when there are no items and not loading/error. */
  emptyState?: ReactNode;
  /** Minimum gap between two messages before a timestamp separator shows. */
  timestampGapMs?: number;
  /** Override the separator copy. Default: "15 May · 9:17 AM" (locale-aware). */
  formatTimestamp?: (date: Date) => string;
  /** Centered-measure class shared with MessageComposer. */
  measureClassName?: string;
  /**
   * When set, the scroll area is a `role="log"` with this name ("Messages
   * with Sam"), which announces new rows politely. Leave it unset when the
   * consumer already wraps the thread in its own log, so the two do not nest.
   */
  logLabel?: string;
  /** Under a message in flight. Default "Sending". */
  sendingLabel?: string;
  /** The failed line when the item has `onRetry`. Default "Not sent. Tap to retry." */
  failedLabel?: string;
  /** The failed line without a retry. Default "Not sent." */
  failedNoRetryLabel?: string;
  /** Said politely once when a message fails. */
  failedAnnouncement?: string;
  /** `data-testid` on every retry button. */
  retryTestId?: string;
  /**
   * Read out while loading: the skeleton is decorative (aria-hidden), so
   * without this a screen reader hears nothing at all. Default "Loading messages".
   */
  loadingLabel?: string;
  /**
   * AUTM-1878: the scroll area's name when it is not a log (`logLabel`
   * unset), so the focusable region still says what it is. Default
   * "Messages".
   */
  label?: string;
  /**
   * AUTM-1878: `end` opens the thread on its newest row and keeps it there
   * as rows arrive (unless the reader has scrolled up to read history), the
   * way every messenger opens. `none` (default) leaves the first paint at the
   * top, as before.
   */
  anchor?: "end" | "none";
  /**
   * AUTM-1878: a soft fade at the top edge while there is more above, in
   * place of a bubble cut in half by the box's edge.
   */
  fadeTop?: boolean;
  /**
   * AUTM-1878: drawn above the first row inside the scroll area, on the
   * thread's measure: a "Load earlier" control, for example.
   */
  before?: ReactNode;
  className?: string;
}

const DEFAULT_GAP_MS = 5 * 60 * 1000;

function toDate(value: MessageItem["createdAt"]): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function defaultFormatTimestamp(date: Date): string {
  const day = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  }).format(date);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `${day} · ${time}`;
}

/**
 * MessageThread — the scrolling conversation surface.
 *
 * Owns the single centered measure (`measureClassName`), timestamp grouping,
 * and auto-scroll-if-near-bottom. The three non-success states render
 * *centered* in the available space rather than pinned to the top — that is
 * the fix for the stranded empty/error tile floating above a large void on
 * wide (iPad) viewports. Designed to sit as a `flex-1` child of a
 * `flex flex-col h-full` screen, with MessageComposer docked beneath.
 *
 * AUTM-1878: the scroll area takes keyboard focus (tab to it, then the arrow
 * keys and Page Up scroll the history), with the house focus ring, because a
 * thread of plain bubbles has nothing else focusable inside it and could not
 * be scrolled without a pointer (axe `scrollable-region-focusable`). It is a
 * named `log` with `logLabel`, otherwise a named region. Timestamps are at
 * the body-small step (13px), not 12. `anchor`, `fadeTop` and `before` are
 * opt-in, so a consumer that has not asked sees no change.
 */
export function MessageThread({
  items,
  loading = false,
  error = false,
  errorTitle = "Couldn't load messages",
  errorMessage = "Check your connection and tap retry.",
  onRetry,
  emptyState,
  timestampGapMs = DEFAULT_GAP_MS,
  formatTimestamp = defaultFormatTimestamp,
  measureClassName = "max-w-[680px]",
  logLabel,
  sendingLabel = "Sending",
  failedLabel = "Not sent. Tap to retry.",
  failedNoRetryLabel = "Not sent.",
  failedAnnouncement = "A message wasn't sent. It is still in the thread to retry.",
  retryTestId,
  loadingLabel = "Loading messages",
  label = "Messages",
  anchor = "none",
  fadeTop = false,
  before,
  className,
}: MessageThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(items.length);
  // Whether there is history above the visible rows (drives the fade).
  const [above, setAbove] = useState(false);
  // Anchored: the first paint with rows lands on the newest one, before the
  // reader sees it, so the thread never opens on its oldest message.
  const anchored = useRef(false);
  const hasRows = !loading && !error && items.length > 0;
  useLayoutEffect(() => {
    if (anchor !== "end" || !hasRows || anchored.current) return;
    const el = scrollRef.current;
    if (!el) return;
    anchored.current = true;
    el.scrollTop = el.scrollHeight;
    setAbove(el.scrollTop > 4);
  }, [anchor, hasRows]);
  const failedIds = useRef<Set<string>>(new Set());
  const [announcement, setAnnouncement] = useState("");

  // Say it once when a message newly fails. A failed send must never be
  // silent, and a screen reader user cannot see the line under the bubble.
  const failedKey = items
    .filter((m) => m.side === "own" && m.status === "failed")
    .map((m) => m.id)
    .join("|");
  useEffect(() => {
    const now = new Set(failedKey ? failedKey.split("|") : []);
    let fresh = false;
    now.forEach((id) => {
      if (!failedIds.current.has(id)) fresh = true;
    });
    failedIds.current = now;
    if (fresh) setAnnouncement(failedAnnouncement);
  }, [failedKey, failedAnnouncement]);

  // Auto-scroll to the bottom on new messages — but only if the user was
  // already near the bottom (within 80px), so we don't yank them away from
  // older history they're reading.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (items.length > prevCount.current) {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      if (nearBottom || prevCount.current === 0) {
        const reduce =
          typeof window !== "undefined" &&
          window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
      }
    }
    prevCount.current = items.length;
  }, [items.length]);

  function handleScroll(e: UIEvent<HTMLDivElement>) {
    if (!fadeTop) return;
    const next = e.currentTarget.scrollTop > 4;
    if (next !== above) setAbove(next);
  }

  if (loading) {
    return (
      <div className={cn("flex-1 overflow-y-auto overscroll-contain px-4 pt-4", className)}>
        <div className={cn("mx-auto w-full", measureClassName)}>
          <p role="status" className="sr-only">
            {loadingLabel}
          </p>
          <AsyncSkeleton variant="list" count={5} rowHeight="h-12" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex flex-1 items-center justify-center overflow-y-auto px-4 py-6",
          className,
        )}
      >
        <div className={cn("w-full", measureClassName)}>
          <ErrorCard
            title={errorTitle}
            message={errorMessage}
            onRetry={onRetry}
          />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-1 items-center justify-center overflow-y-auto px-4 py-6",
          className,
        )}
      >
        <div className={cn("w-full", measureClassName)}>{emptyState}</div>
      </div>
    );
  }

  // Sort oldest-first — the source order isn't guaranteed; sort on createdAt
  // so the visual order is deterministic (items without a date keep input order).
  const sorted = [...items].sort(
    (a, b) =>
      (toDate(a.createdAt)?.getTime() ?? 0) -
      (toDate(b.createdAt)?.getTime() ?? 0),
  );

  return (
    <div
      ref={scrollRef}
      role={logLabel ? "log" : "region"}
      aria-label={logLabel ?? label}
      tabIndex={0}
      onScroll={handleScroll}
      data-fade={fadeTop && above ? "top" : undefined}
      className={cn(
        // AUTM-1756: contained, so reaching the oldest message never scrolls
        // the page or the drawer behind the thread.
        "flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-4",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]",
        // A soft edge while there is history above: 3rem of fade, so a
        // bubble half out of view dissolves instead of being sliced.
        fadeTop && above && "[mask-image:linear-gradient(to_bottom,transparent_0,#000_3rem)]",
        className,
      )}
    >
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {before ? <div className={cn("mx-auto mb-3 flex w-full justify-center", measureClassName)}>{before}</div> : null}
      <ul className={cn("mx-auto flex w-full flex-col gap-2", measureClassName)}>
        {sorted.map((m, i) => {
          const prev = sorted[i - 1];
          const date = toDate(m.createdAt);
          const prevDate = toDate(prev?.createdAt);
          const showStamp =
            !!date &&
            (!prev ||
              prevDate == null ||
              date.getTime() - prevDate.getTime() > timestampGapMs);
          const status = m.side === "own" ? m.status : undefined;
          return (
            <li
              key={m.id}
              className="flex flex-col gap-1"
              data-testid={m.testId}
              data-status={status}
            >
              {/* AUTM-1221: the CSS forced uppercase and letterspacing over
                  whatever `formatTimestamp` returned, so a consumer that
                  sentence-cased its dates still rendered "TODAY · 9:17 AM"
                  (found on customer-web's booking chat, AUTM-1205). The
                  formatter is the source of truth now. */}
              {showStamp && date ? (
                <p className="mt-3 text-center text-[0.8125rem] font-medium text-[var(--text-subtle)]">
                  {formatTimestamp(date)}
                </p>
              ) : null}
              {m.body != null ? (
                <div
                  className={cn(
                    "flex w-full",
                    m.side === "own"
                      ? "justify-end"
                      : m.side === "incoming"
                        ? "justify-start"
                        : "justify-center",
                  )}
                >
                  {m.body}
                </div>
              ) : (
                <MessageBubble side={m.side}>{m.text}</MessageBubble>
              )}
              {status === "sending" ? (
                <p className="self-end text-[0.8125rem] leading-snug text-[var(--text-subtle)]">
                  {sendingLabel}
                </p>
              ) : null}
              {status === "failed" ? (
                <SendFailed
                  label={m.onRetry ? failedLabel : failedNoRetryLabel}
                  onRetry={m.onRetry}
                  testId={retryTestId}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Solar "Danger Circle" in the Bold style, inlined (no icon dependency). */
function FailedGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="shrink-0">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10ZM12 6.25a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0V7a.75.75 0 0 1 .75-.75ZM12 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
      />
    </svg>
  );
}

/**
 * The failed line under your own bubble: an icon AND words (never colour
 * alone), in danger text. With a retry it is a 44px button, so a thumb can
 * hit it on a phone; the bubble's text stays, so nothing is retyped.
 */
function SendFailed({
  label,
  onRetry,
  testId,
}: {
  label: string;
  onRetry?: () => void;
  testId?: string;
}) {
  const inner = (
    <>
      <FailedGlyph />
      <span>{label}</span>
    </>
  );
  if (!onRetry) {
    return (
      <p className="flex items-center gap-1.5 self-end text-[0.8125rem] font-medium leading-snug text-[var(--danger)]">
        {inner}
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={onRetry}
      data-testid={testId}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 self-end rounded-[0.75rem] px-2 text-left text-[0.8125rem] font-medium leading-snug text-[var(--danger)]",
        "cursor-pointer transition-colors duration-150 hover:bg-[var(--band)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
      )}
    >
      {inner}
    </button>
  );
}
