"use client";

import {
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

/**
 * OtpInput: one-time-code entry, one field with six slots by default.
 *
 * Controlled: the consumer owns the `value` string and gets `onChange` on
 * every edit plus `onComplete` once every slot is filled (drives auto-submit).
 *
 * Behaviour:
 *   - One digit per slot; typing auto-advances, Backspace retreats.
 *   - Paste / iOS SMS autofill (`autocomplete="one-time-code"` on slot 1)
 *     drops the whole code in and it's split across the slots.
 *   - Arrow keys move between slots.
 *   - A press on the pill between slots, or on a slot past the first empty
 *     one, lands on the first empty slot, so the code has no holes.
 *
 * Aesthetic (AUTM-2140 R2, Don's pick A1 "One field, six slots",
 * 2026-11-14): ONE glass pill the width of its container, the Input shell
 * (`.field-shell.glass-edge`), holding six borderless slots split 3 and 3 by
 * a small dash. The whole pill takes the accent focus edge
 * (`:focus-within`) and the danger edge when `invalid`; the current slot
 * takes a soft accent tint and a caret; an empty slot shows a dot. The rules
 * are `.otp-*` in `utilities/forms.css`. The digit (28px Bold) is set inline
 * in `rem` so it (a) survives a consumer's global `input[type]{font-size}`
 * rule and (b) still scales with OS Dynamic Type; the slots shrink to 44px
 * and stack 3 over 3 when the container is too narrow for one row.
 *
 * Markup: `role="group"` (named by `ariaLabel`) is a plain block wrapper,
 * the pill inside it, and each slot keeps its own `<input>` with
 * `aria-label="Digit N of 6"` and `maxlength="1"`, as before (QA locates and
 * asserts both).
 *
 * Reset pattern: change the React `key` to remount; it clears the slots and
 * refocuses the first one (e.g. after a rejected code).
 */
export interface OtpInputProps {
  /** Current code, 0..length digits. */
  value: string;
  /** Fires on every edit with the sanitised digit string. */
  onChange: (code: string) => void;
  /** Fires once all slots are filled. */
  onComplete?: (code: string) => void;
  /** Number of slots. Default 6. */
  length?: number;
  disabled?: boolean;
  /** Paints the field in the error tone. */
  invalid?: boolean;
  /** Focus the first slot on mount. Default true. */
  autoFocus?: boolean;
  /** Group label for assistive tech. Default "Verification code". */
  ariaLabel?: string;
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled,
  invalid,
  autoFocus = true,
  ariaLabel = "Verification code",
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  // The code as of the last edit. A focus moved inside a handler runs before
  // the consumer re-renders with the new `value`, so the redirect to the
  // first empty slot reads this rather than the prop.
  const latestRef = useRef(value);
  latestRef.current = value;

  useEffect(() => {
    if (autoFocus) inputsRef.current[0]?.focus();
  }, [autoFocus]);

  function emit(code: string) {
    latestRef.current = code;
    onChange(code);
  }

  function commit(next: string) {
    const code = next.replace(/\D/g, "").slice(0, length);
    emit(code);
    if (code.length === length) onComplete?.(code);
    return code;
  }

  /** The slot the next digit lands in: the first empty one, or the last. */
  function current() {
    return Math.min(latestRef.current.length, length - 1);
  }

  function handleChange(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, "");
    const chars = value.split("");

    if (!cleaned) {
      chars[index] = "";
      emit(chars.join(""));
      return;
    }

    // One char: set and advance. Multiple (paste / autofill into one slot):
    // spread across the remaining slots from here.
    const incoming = cleaned.split("").slice(0, length - index);
    incoming.forEach((c, i) => {
      chars[index + i] = c;
    });
    commit(chars.join(""));
    const focusIndex = Math.min(index + incoming.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
    inputsRef.current[focusIndex]?.select();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const chars = value.split("");
      if (chars[index]) {
        chars[index] = "";
        emit(chars.join(""));
      } else if (index > 0) {
        chars[index - 1] = "";
        emit(chars.join(""));
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!text) return;
    const code = commit(text);
    inputsRef.current[Math.min(code.length, length - 1)]?.focus();
  }

  function handleFocus(index: number, el: HTMLInputElement) {
    // A slot past the first empty one would leave a hole the string cannot
    // hold (the digit would land one slot early), so focus goes there.
    const at = current();
    if (index > at) {
      inputsRef.current[at]?.focus();
      return;
    }
    el.select();
  }

  // The whole pill is the field: a press between slots or on its padding
  // lands in the slot the next digit goes to, as a press on an Input does.
  function handlePillMouseDown(e: MouseEvent<HTMLDivElement>) {
    if (disabled || e.target instanceof HTMLInputElement) return;
    e.preventDefault();
    inputsRef.current[current()]?.focus();
  }

  const digits = value.split("");
  // 3 and 3 for six; any length of four or more splits in half, and a
  // shorter code is one run.
  const split = length >= 4 ? Math.ceil(length / 2) : length;

  function slot(i: number) {
    const digit = digits[i] ?? "";
    return (
      <span
        // Index key is stable: the slot set never reorders.
        key={i}
        className="otp-slot"
        data-filled={digit ? "" : undefined}
      >
        <input
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => handleFocus(i, e.currentTarget)}
          style={{ fontSize: "1.75rem" }}
          className="otp-slot-control"
        />
        <span aria-hidden className="otp-caret" />
      </span>
    );
  }

  const indexes = Array.from({ length }, (_, i) => i);

  return (
    <div role="group" aria-label={ariaLabel} className="otp">
      <div
        data-slot="field"
        data-invalid={invalid ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        className="field-shell glass-edge otp-field"
        onMouseDown={handlePillMouseDown}
      >
        <div className="otp-slots">
          <span className="otp-group">{indexes.slice(0, split).map(slot)}</span>
          {split < length ? (
            <>
              <span aria-hidden className="otp-sep" />
              <span className="otp-group">
                {indexes.slice(split).map(slot)}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
