import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * PickerTrigger — the field that opens a PickerSheet (AUTM-1594, canvas v44
 * "Picker trigger (replaces Select)").
 *
 * It looks like Input (AUTM-2140: the 52px glass pill with the lit hairline,
 * 17px text, a chevron at the end) because to the person filling the form it
 * IS a field: here is the value, tap to change it. It is a button underneath,
 * announced as opening a dialog, because a picker opens a sheet, never a
 * native dropdown, in the merchant app.
 *
 * Controlled from outside: pass `open` (it becomes `aria-expanded`) and wire
 * `onClick` to the PickerSheet's `onOpenChange`. Pair it with a `<Label
 * htmlFor>` the way an input is paired; FormField wires it the same way.
 */
export interface PickerTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value" | "children"> {
  /** The chosen value as it should read. Empty shows the placeholder. */
  value?: ReactNode;
  placeholder?: string;
  /** Whether the sheet it opens is open; sets `aria-expanded`. */
  open?: boolean;
  invalid?: boolean;
}

const Chevron = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="shrink-0 text-[var(--text-muted)]"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const PickerTrigger = forwardRef<HTMLButtonElement, PickerTriggerProps>(
  function PickerTrigger(
    { value, placeholder = "Choose", open, invalid, className, type, ...rest },
    ref,
  ) {
    const empty = value == null || value === "";
    const ariaInvalid = rest["aria-invalid"] ?? (invalid || undefined);
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        aria-haspopup="dialog"
        aria-expanded={open ?? false}
        {...rest}
        aria-invalid={ariaInvalid}
        data-placeholder={empty ? "" : undefined}
        className={cn(
          // AUTM-2140: `glass-edge` is the glass and lit hairline,
          // `field-trigger` the states (focus-visible or expanded: the accent
          // edge and tint; aria-invalid: the danger edge; disabled: dims).
          "glass-edge field-trigger flex min-h-13 w-full items-center justify-between gap-2 rounded-full px-[var(--field-pad)] py-2 text-left text-[1.0625rem] text-[var(--text-strong)]",
          "focus-visible:outline-none disabled:cursor-not-allowed",
          className,
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", empty && "text-[var(--text-subtle)]")}>
          {empty ? placeholder : value}
        </span>
        <Chevron />
      </button>
    );
  },
);

PickerTrigger.displayName = "PickerTrigger";
