import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Button } from "./Button";

/**
 * ErrorCard — the "we couldn't load this, here's why, try again" surface.
 *
 * Use on every async surface that can fail. Pair with `AsyncSkeleton`
 * (loading) and `EmptyState` (empty) to satisfy the workspace cross-stack
 * rule: every async surface honors success / loading / error / empty.
 *
 * AUTM-936 — this was built out of raw Tailwind `rose-*` / `amber-*`,
 * which are static values on a themed canvas. On the dark canvas the
 * tinted fill composited to a muddy grey and the title landed at 1.82:1,
 * while the retry button (`bg-white text-rose-900`) punched a white slab
 * into a dark page. merchant-mobile renders this inside AppErrorBoundary,
 * so the app-wide crash screen was the surface that failed — the worst
 * possible place for the copy to be unreadable, because the retry control
 * is the only way out.
 *
 * The rebuild followed the house grammar rather than re-tinting. AUTM-1594
 * moved it to canvas v44's band card (see the render below): no intent disc
 * and no hairline, the words and the ink Retry carry it. Every value is a
 * token, so both themes track the ladder.
 *
 * Copy guidance — recoverable + specific:
 *   - Bad: "Something went wrong" (Autara house rule: don't ship this)
 *   - Good: "We couldn't load your bookings — check your connection and
 *     tap retry."
 *
 * Tone:
 *   - `error` (default) — real failure, action expected.
 *   - `warning` — soft failure, may recover on its own.
 */
type Tone = "error" | "warning";

export interface ErrorCardProps {
  /** Short headline. Default: "Couldn't load this". */
  title?: string;
  /** Main user-facing copy. */
  message: string;
  /** Optional secondary copy — typically dev info (error.message) shown
   *  only in development builds. */
  detail?: string;
  /** Retry handler. If omitted, no retry button renders. */
  onRetry?: () => void;
  /** Override the retry button label. Default: "Retry". */
  retryLabel?: string;
  tone?: Tone;
  /**
   * Optional icon glyph. Defaults to the Solar Bold alert glyph for the
   * tone — an error surface should not depend on the caller remembering
   * to pass one.
   */
  icon?: ReactNode;
  className?: string;
}

/**
 * Intent FILL tokens are static solids by design (see colors.css) — the
 * same ones Badge's status tones use. They read on cream and on ink, which
 * is exactly what a tone marker has to do.
 */
/*
 * AUTM-1594 — canvas v44 "Error": a band card, 24px radius, 20px in; an
 * 18px Bold title that names the thing, a 15px line that says the way out,
 * and Retry as the lime action across the card (AUTM-1838: no black buttons).
 * No intent medallion: the words carry it. `icon` still renders, in a raised
 * disc, for a consumer that wants one. `tone` is kept on the element as
 * data-tone for consumers and tests that read it.
 */
export function ErrorCard({
  title = "Couldn't load this",
  message,
  detail,
  onRetry,
  retryLabel = "Retry",
  tone = "error",
  icon,
  className,
}: ErrorCardProps) {
  return (
    <div
      role="alert"
      data-tone={tone}
      className={cn(
        "flex flex-col gap-2.5 rounded-[1.5rem] bg-[var(--band)] p-5 text-[var(--text-strong)]",
        className,
      )}
    >
      {icon ? (
        <span
          aria-hidden
          className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--raised)] text-[var(--danger)]"
        >
          {icon}
        </span>
      ) : null}
      <p className="text-lg leading-snug font-bold">{title}</p>
      <p className="text-[0.9375rem] leading-normal text-[var(--text-muted)]">{message}</p>
      {detail ? (
        <p className="text-[0.8125rem] text-[var(--text-subtle)]">{detail}</p>
      ) : null}
      {onRetry ? (
        <Button variant="primary" size="sm" fullWidth onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
