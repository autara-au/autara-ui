import { useId, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { Textarea } from "./Textarea";
import { cn } from "../lib/cn";

/**
 * MessageComposer — the docked input row beneath a conversation thread.
 *
 * Controlled + presentational: the parent owns `value` and the send
 * lifecycle (optimistic write, error handling). This component renders the
 * field + Send button + inline error and raises `onSend` on click or Enter
 * (Shift+Enter inserts a newline).
 *
 * Grammar:
 *   - Full-width dock — a hairline top border on the page surface, so it
 *     reads as one continuous edge across the screen while its content
 *     stays centered to the thread measure (`measureClassName`, shared with
 *     MessageThread).
 *   - Field uses the canonical `.field-textarea` focus signature (warm-cream
 *     tint + solid brand-purple border, no halo) via `Textarea`, forced to a
 *     compact single-row min height that grows to a cap.
 *   - Send is the house primary: `variant="primary"`. AUTM-1221 changed
 *     this from `variant="dark"` (Torph ink, matching the own-message
 *     bubble). Glass rule 5 is that purple acts, and send is the one
 *     action on the composer; the ink treatment left the only control on
 *     the surface reading as secondary.
 *   - Inline send errors use the brand error token, never raw `rose-*`.
 *   - Respects the iOS bottom safe-area inset.
 *
 * AUTM-1878 — `layout="inset"` (Don, 2026-10-14, on the booking record's
 * chat: "full width, the + inside the field, Send inside"). One field across
 * the whole panel: the `leading` control (the plus) sits inside its leading
 * edge, Send is the lime icon disc inside its trailing edge, and the text
 * grows with what is typed to about four lines, then scrolls. The field owns
 * the focus ring (`:focus-within`, the house 2px accent), so the plus and
 * Send read as part of it. The field stays editable while a message sends,
 * so the next one can be typed; only Send waits. Enter sends, Shift+Enter
 * adds a line, in both layouts. References: Notion's AI composer and Fi's
 * support chat (the attach and send controls inside one field: steal);
 * LinkedIn's separate attach glyph outside the field (avoid, it splits one
 * control into two).
 *
 * `layout="dock"` (the default) is unchanged.
 */
export interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  /** Raised on Send click or Enter (without Shift) when value is non-empty. */
  onSend: () => void;
  /**
   * While true the field disables and Send shows the library busy state: the
   * turning Autara mark over the label, which stays the button's name and
   * holds its width (AUTM-1708).
   */
  sending?: boolean;
  /** Inline error rendered below the field with role="alert". */
  error?: string | null;
  placeholder?: string;
  sendLabel?: string;
  /**
   * @deprecated AUTM-1708: ignored. Send keeps `sendLabel` while sending and
   * shows the turning mark instead; a "Sending…" relabel changed the width.
   * Kept so existing callers still compile.
   */
  sendingLabel?: string;
  /**
   * Optional control rendered to the LEFT of the field — e.g. an attach
   * / plus button. Aligned to the field's bottom edge (items-end); the
   * consumer owns its styling + handler.
   */
  leading?: ReactNode;
  /**
   * AUTM-1806: the longest message the API accepts (both APIs cap at 2,000
   * since AUTM-1807). The field stops there, and from 200 characters out a
   * line under it says how many are left, so nobody types past the cap and
   * learns about it from a failed send.
   */
  maxLength?: number;
  /** Centered-measure class shared with MessageThread. */
  measureClassName?: string;
  /**
   * AUTM-1878: `dock` (default) is the field with Send beside it on a
   * hairline-topped strip. `inset` is one full-width field with `leading`
   * and Send inside it, growing to about four lines.
   */
  layout?: "dock" | "inset";
  /** `data-testid` on Send. */
  sendTestId?: string;
  className?: string;
}

/** How close to the cap the "characters left" line appears. */
const NEAR_CAP = 200;

/**
 * Solar "Plain 2" in the Bold style, inlined (autara-ui has no icon dependency).
 * 20px in the inset disc; `1.25em` beside the dock layout's label (AUTM-1905), so
 * it grows with the text at 200%.
 */
function SendGlyph({ size = 20 }: { size?: number | string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className="shrink-0">
      <path d="M17.4975 18.4851L20.6281 9.09378C21.419 6.72107 21.9594 5.1 21.9978 3.97919C22.0108 3.60165 21.5845 3.47624 21.3173 3.74336L6.85855 18.2022C6.62519 18.4355 6.6807 18.8286 6.99826 18.9185C7.02946 18.9273 7.0609 18.9356 7.09257 18.9433C7.59254 19.0657 8.24578 18.977 9.5522 18.7997L9.62363 18.79C9.99191 18.74 10.1761 18.715 10.3529 18.7257C10.6738 18.7451 10.9838 18.8496 11.251 19.0286C11.3981 19.1271 11.5295 19.2586 11.7923 19.5213L12.0436 19.7726C13.5539 21.2828 14.309 22.0379 15.1101 21.9986C15.3309 21.9877 15.5479 21.9365 15.7503 21.8475C16.4844 21.5244 16.8221 20.5113 17.4975 18.4851Z" />
      <path d="M14.906 3.37194L5.57477 6.48223C3.49295 7.17615 2.45203 7.5231 2.13608 8.28642C2.06182 8.46582 2.01692 8.65601 2.00311 8.84968C1.94433 9.6737 2.72018 10.4495 4.27188 12.0012L4.55451 12.2838C4.80921 12.5385 4.93655 12.6658 5.03282 12.8076C5.22269 13.0871 5.33046 13.4143 5.34393 13.752C5.35076 13.9232 5.32403 14.1013 5.27057 14.4575C5.07488 15.7613 4.97703 16.4131 5.0923 16.9148C5.09632 16.9322 5.1005 16.9497 5.10484 16.967C5.18629 17.292 5.58551 17.3539 5.82242 17.117L20.2567 2.68271C20.5238 2.41559 20.3984 1.9893 20.0209 2.00224C18.9 2.04066 17.2788 2.58102 14.906 3.37194Z" />
    </svg>
  );
}

export function MessageComposer({
  value,
  onChange,
  onSend,
  sending = false,
  error,
  placeholder = "Type a message",
  sendLabel = "Send",
  leading,
  maxLength,
  measureClassName = "max-w-[680px]",
  layout = "dock",
  sendTestId,
  className,
}: MessageComposerProps) {
  const canSend = value.trim().length > 0 && !sending;
  const countId = useId();
  const left = maxLength != null ? maxLength - value.length : null;
  const showCount = left != null && left <= NEAR_CAP;
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  // Inset: the field is as tall as what is typed, to its max-height (about
  // four lines), then it scrolls. Measured, because `field-sizing: content`
  // is not in every WebView this ships to. AUTM-1899: it only becomes a
  // scroller once it is at that cap. `scrollHeight` is a whole number of
  // pixels and the content may not be, so a field that fits could overflow
  // by a fraction of a pixel and grow a bar where bars still draw (forced
  // colours, a finger's overlay bar).
  useLayoutEffect(() => {
    if (layout !== "inset") return;
    const el = fieldRef.current;
    if (!el) return;
    el.style.height = "auto";
    const needed = el.scrollHeight;
    el.style.height = `${needed}px`;
    el.style.overflowY = needed > el.clientHeight + 1 ? "auto" : "hidden";
  }, [value, layout]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // An IME composing a word uses Enter to accept it; that is not a send.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canSend) onSend();
    }
  }

  const count = showCount ? (
    <p
      id={countId}
      className={cn(
        "mx-auto mt-1.5 w-full text-right text-[0.8125rem] tabular-nums",
        left <= 0 ? "font-medium text-[var(--danger)]" : "text-[var(--text-subtle)]",
        measureClassName,
      )}
    >
      {left <= 0 ? "That's the limit for one message" : `${left} ${left === 1 ? "character" : "characters"} left`}
    </p>
  ) : null;
  const alert = error ? (
    <p
      role="alert"
      className={cn(
        "mx-auto mt-2 w-full rounded-lg border border-[rgba(221,56,56,0.25)] bg-[rgba(221,56,56,0.06)] px-3 py-2 text-sm text-[var(--color-autara-error)]",
        measureClassName,
      )}
    >
      {error}
    </p>
  ) : null;

  if (layout === "inset") {
    return (
      <div className={cn("px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+12px)]", className)}>
        <div
          data-composer-field=""
          aria-busy={sending || undefined}
          className={cn(
            "mx-auto flex w-full items-end gap-1 rounded-[1.625rem] border border-[var(--field-edge)] bg-[var(--paper)] p-1",
            "transition-[border-color,box-shadow] duration-150",
            "hover:border-[var(--text-muted)] focus-within:border-[var(--accent)] focus-within:shadow-[inset_0_0_0_1px_var(--accent)] focus-within:hover:border-[var(--accent)]",
            measureClassName,
          )}
        >
          {leading ? <div className="flex shrink-0 items-end">{leading}</div> : null}
          <textarea
            ref={fieldRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            maxLength={maxLength}
            aria-describedby={showCount ? countId : undefined}
            aria-label="Message"
            className={cn(
              "block min-h-11 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-2.5 py-[0.6875rem]",
              "text-[1.0625rem] leading-[1.4] text-[var(--text-strong)] placeholder:text-[var(--text-subtle)]",
              // About four lines of text and the field's own padding.
              "max-h-[calc(5.6em+1.375rem)]",
              "outline-none focus-visible:outline-none",
              !leading && "pl-3.5",
            )}
          />
          <IconButton
            variant="strong"
            icon={<SendGlyph />}
            label={sendLabel}
            busy={sending}
            disabled={!canSend}
            onClick={() => canSend && onSend()}
            data-testid={sendTestId}
            className="shrink-0"
          />
        </div>
        {count}
        {alert}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-t border-[var(--border-subtle)] bg-[var(--surface)] px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]",
        className,
      )}
    >
      <div className={cn("mx-auto flex w-full items-end gap-2", measureClassName)}>
        {leading}
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={sending}
          maxLength={maxLength}
          aria-describedby={showCount ? countId : undefined}
          aria-label="Message"
          className="max-h-32 min-h-[44px]! flex-1 resize-none!"
        />
        <Button
          /* AUTM-1221: the house primary. Rule 5: purple acts. AUTM-1905: the
             action-verb icon (AUTM-1900's ruling), hidden; the label names it. */
          variant="primary"
          size="md"
          leadingIcon={<SendGlyph size="1.25em" />}
          busy={sending}
          disabled={!canSend}
          onClick={() => canSend && onSend()}
          data-testid={sendTestId}
        >
          {sendLabel}
        </Button>
      </div>
      {count}
      {alert}
    </div>
  );
}
