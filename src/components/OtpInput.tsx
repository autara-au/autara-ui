"use client";

import {
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

/**
 * OtpInput — segmented one-time-code entry (six boxes by default).
 *
 * Controlled: the consumer owns the `value` string and gets `onChange` on
 * every edit plus `onComplete` once every box is filled (drives auto-submit).
 *
 * Behaviour:
 *   - One digit per box; typing auto-advances, Backspace retreats.
 *   - Paste / iOS SMS autofill (`autocomplete="one-time-code"` on box 0)
 *     drops the whole code in and it's split across the boxes.
 *   - Arrow keys move between boxes.
 *
 * Aesthetic (AUTM-2140): each 44 x 56 box is its own glass field, the
 * shell and lit hairline of Input (`.field-shell.glass-edge`), rounded to
 * the pill's corner; the digit is 22px Bold. Focus is the accent edge and
 * tint, an error the danger edge, no halo, no shadow. The digit size is set
 * inline in `rem` so it (a) survives a consumer's global
 * `input[type]{font-size}` rule and (b) still scales with OS Dynamic Type.
 * Each box keeps its own `<input>` (and its aria-label), as before.
 *
 * Reset pattern: change the React `key` to remount — clears the boxes and
 * refocuses the first one (e.g. after a rejected code).
 */
export interface OtpInputProps {
  /** Current code, 0..length digits. */
  value: string;
  /** Fires on every edit with the sanitised digit string. */
  onChange: (code: string) => void;
  /** Fires once all boxes are filled. */
  onComplete?: (code: string) => void;
  /** Number of boxes. Default 6. */
  length?: number;
  disabled?: boolean;
  /** Paints the boxes in the error tone. */
  invalid?: boolean;
  /** Focus the first box on mount. Default true. */
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

  useEffect(() => {
    if (autoFocus) inputsRef.current[0]?.focus();
  }, [autoFocus]);

  function commit(next: string) {
    const code = next.replace(/\D/g, "").slice(0, length);
    onChange(code);
    if (code.length === length) onComplete?.(code);
    return code;
  }

  function handleChange(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, "");
    const chars = value.split("");

    if (!cleaned) {
      chars[index] = "";
      onChange(chars.join(""));
      return;
    }

    // One char → set + advance. Multiple (paste / autofill into one box) →
    // spread across the remaining boxes from here.
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
        onChange(chars.join(""));
      } else if (index > 0) {
        chars[index - 1] = "";
        onChange(chars.join(""));
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

  const digits = value.split("");

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex items-center justify-center gap-2.5"
    >
      {Array.from({ length }).map((_, i) => (
        <span
          // Index key is stable — the box set never reorders.
          key={i}
          data-slot="field"
          data-invalid={invalid ? "" : undefined}
          data-disabled={disabled ? "" : undefined}
          // Type on the shell: the control inherits it (forms.css), and an
          // unlayered control rule would outrank a utility on the input.
          className="field-shell glass-edge h-14 w-11 shrink-0 text-center font-bold tabular-nums"
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
            value={digits[i] ?? ""}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.currentTarget.select()}
            style={{ fontSize: "1.375rem", paddingInline: 0 }}
            className="field-shell-control"
          />
        </span>
      ))}
    </div>
  );
}
