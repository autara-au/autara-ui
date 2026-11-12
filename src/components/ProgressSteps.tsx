import type { CSSProperties, ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * ProgressSteps — where a booking is, as named steps (AUTM-1594, canvas v44
 * "Booking progress"). Four steps everywhere: one 4px bar per step, 8px
 * apart, brand up to and including the current step and band after it, with
 * the step's name under its bar at 13px. Reached steps are ink, the current
 * one Bold, the rest at 58% ink.
 *
 * An ordered list, with the current step marked `aria-current="step"`, so a
 * screen reader hears where the booking is, not a row of bars. With `icons`
 * it is the customer booking screen's track (AUTM-1797).
 */
export interface ProgressStepsProps {
  steps: string[];
  /** 0-indexed. */
  current: number;
  /** Accessible name, e.g. "Booking progress". */
  label?: string;
  /**
   * AUTM-1797 / AUTM-1799: one icon per step draws the steps as a track of
   * discs on a joining line (DoorDash's order tracker): reached steps lime
   * with `doneIcon`, the current one aqua and breathing (in flight), the rest
   * band. Only the current step's word is drawn; every word stays for a
   * screen reader. The icons are the caller's (about 18px, decorative).
   */
  icons?: ReactNode[];
  /** With `icons`: what a reached step shows. A tick by default. */
  doneIcon?: ReactNode;
  className?: string;
}

/** The default tick for a reached disc. */
function Tick() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function ProgressSteps({ steps, current, label = "Progress", icons, doneIcon, className }: ProgressStepsProps) {
  const at = Math.min(Math.max(current, 0), Math.max(steps.length - 1, 0));
  if (icons) {
    return (
      <ol
        aria-label={label}
        data-variant="track"
        // The count rides in a variable, not an inline grid-template-columns:
        // an inline style beats the class, so at very large text the track
        // stayed one row of four and "Accepted" broke mid-word.
        className={cn(
          "m-0 grid w-full list-none grid-cols-[repeat(var(--steps),minmax(0,1fr))] p-0 @max-[20rem]:grid-cols-2 @max-[20rem]:gap-y-3",
          className,
        )}
        style={{ "--steps": steps.length } as CSSProperties}
      >
        {steps.map((step, i) => {
          const state = i < at ? "done" : i === at ? "current" : "todo";
          return (
            <li
              key={step}
              data-state={state}
              aria-current={i === at ? "step" : undefined}
              className={cn(
                "relative flex min-w-0 flex-col items-center gap-1.5 text-center",
                // The line from the previous disc to this one: lime once both are reached.
                i > 0 &&
                  "motion-draw-x before:absolute before:top-[1.0625rem] before:right-1/2 before:h-[0.1875rem] before:w-full before:rounded-full before:content-[''] @max-[20rem]:before:hidden",
                i > 0 && (i <= at ? "before:bg-[var(--lime)]" : "before:bg-[var(--band)]"),
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "relative z-[1] grid size-9 place-items-center rounded-full [&_svg]:size-[1.125rem]",
                  state === "done" && "bg-[var(--lime)] text-[var(--on-lime)]",
                  state === "current" && "motion-breathe bg-[var(--aqua)] text-[var(--on-aqua)]",
                  state === "todo" && "bg-[var(--band)] text-[var(--text-muted)]",
                )}
              >
                {state === "done" ? (doneIcon ?? <Tick />) : icons[i]}
              </span>
              <span
                className={
                  state === "current"
                    ? "text-sm leading-tight font-bold text-[var(--text-strong)] [overflow-wrap:anywhere]"
                    : "sr-only"
                }
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    );
  }
  return (
    <ol aria-label={label} className={cn("m-0 flex w-full list-none gap-2 p-0", className)}>
      {steps.map((step, i) => (
        <li key={step} aria-current={i === at ? "step" : undefined} className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span
            aria-hidden="true"
            className={cn("h-1 rounded-full", i <= at ? "bg-[var(--brand)]" : "bg-[var(--band)]")}
          />
          <span
            className={cn(
              "text-[0.8125rem]",
              i < at && "font-medium text-[var(--text-strong)]",
              i === at && "font-bold text-[var(--text-strong)]",
              i > at && "font-medium text-[var(--text-subtle)]",
            )}
          >
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}
