"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconButton } from "./IconButton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "./DropdownMenu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./Sheet";
import { cn } from "../lib/cn";

/**
 * ComposerAttachMenu — the plus in MessageComposer's `leading` slot and the
 * short sheet it opens (AUTM-1806, U5).
 *
 * The sheet lists what can go into the conversation besides text: Take a
 * photo, Choose photos and Add an extra for a pro; Ask about an extra for a
 * customer. The consumer passes only the rows it can do today, so the photo
 * rows stay out until photos ship (Phase 1B), and the plus never promises
 * something that does nothing (it replaces the "Photo attachments are coming
 * soon" toast).
 *
 *   - The trigger is the library's 44px icon disc with a REQUIRED name
 *     (default "Add a photo or an extra").
 *   - Rows are 56px buttons with an icon disc, a label and an optional line
 *     of explanation. Choosing one closes the sheet FIRST and runs the row's
 *     `onSelect` once the sheet has let go of focus, so a row can open the
 *     next sheet (the Extras form) without two dialogs fighting over it.
 *   - `footnote` sits under the rows ("Only you and Sam can see photos in
 *     this chat.").
 *
 * Glyphs for the usual rows are exported as `attachMenuGlyphs` (Solar Bold
 * style, inlined: autara-ui has no icon dependency).
 *
 * AUTM-1878 follow-up (Don, 2026-10-15): from 48rem (768px) up it is not a
 * bottom sheet but a small menu anchored just above the +, the way WhatsApp
 * Web and Slack's attach menu open: `role="menu"`, arrow keys between the
 * rows, Escape and a click outside close it, focus back on the +, one soft
 * rise from the anchor (`.floating-panel--pop`, still under reduced motion).
 * Below that it stays the sheet. `layout` forces either.
 */
export interface AttachMenuItem {
  id: string;
  label: string;
  /** One line under the label ("Price it and send it for approval"). */
  description?: string;
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  testId?: string;
}

export interface ComposerAttachMenuProps {
  items: AttachMenuItem[];
  /** The plus button's accessible name. */
  label?: string;
  /** The sheet's title. */
  title?: string;
  /** Read out with the title; visible under it when given. */
  description?: string;
  footnote?: ReactNode;
  triggerTestId?: string;
  disabled?: boolean;
  /** Controlled open state, when the consumer needs it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  /**
   * `auto` (default): the menu from 48rem up, the sheet below. `menu` and
   * `sheet` force one.
   */
  layout?: "auto" | "menu" | "sheet";
}

function PlusGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/** Solar Bold-style glyphs for the usual rows. Decorative: the label names the row. */
export const attachMenuGlyphs = {
  camera: (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.778 21h4.444c3.121 0 4.682 0 5.803-.735a4.4 4.4 0 0 0 1.226-1.204c.749-1.1.749-2.633.749-5.697 0-3.065 0-4.597-.749-5.697a4.4 4.4 0 0 0-1.226-1.204c-.72-.473-1.622-.642-3.003-.702-.659 0-1.226-.49-1.355-1.125A2.064 2.064 0 0 0 13.634 3h-3.268c-.988 0-1.839.685-2.033 1.636-.129.635-.696 1.125-1.355 1.125-1.38.06-2.282.23-3.003.702A4.4 4.4 0 0 0 2.75 7.667C2 8.767 2 10.299 2 13.364c0 3.064 0 4.596.749 5.697.324.476.74.885 1.226 1.204C5.096 21 6.657 21 9.778 21ZM12 9.273c-2.301 0-4.167 1.831-4.167 4.09S9.7 17.456 12 17.456s4.167-1.832 4.167-4.091c0-2.26-1.866-4.091-4.167-4.091Z"
      />
    </svg>
  ),
  photos: (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2c4.714 0 7.071 0 8.535 1.464C22 4.93 22 7.286 22 12c0 4.714 0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12Zm14.5-3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM4 15.42l2.97-2.62a2.25 2.25 0 0 1 3.07.1l4.79 4.79a1.75 1.75 0 0 0 2.24.2l.33-.24a2.75 2.75 0 0 1 3.4.2L21 18.1c-.07.72-.22 1.2-.53 1.6-.57.73-1.6.87-3.66.87H7.19c-2.06 0-3.09-.14-3.66-.87C3.1 19.17 3 18.42 3 17.03v-.93Z"
      />
    </svg>
  ),
  extra: (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Zm.75-16a.75.75 0 0 0-1.5 0v.32c-1.63.29-3 1.47-3 3.18 0 1.96 1.8 3.25 3.75 3.25 1.33 0 2.25.84 2.25 1.75S13.33 16.25 12 16.25c-1.33 0-2.25-.84-2.25-1.75a.75.75 0 0 0-1.5 0c0 1.71 1.37 2.89 3 3.18V18a.75.75 0 0 0 1.5 0v-.32c1.63-.29 3-1.47 3-3.18 0-1.96-1.8-3.25-3.75-3.25-1.33 0-2.25-.84-2.25-1.75S10.67 7.75 12 7.75c1.33 0 2.25.84 2.25 1.75a.75.75 0 0 0 1.5 0c0-1.71-1.37-2.89-3-3.18V6Z"
      />
    </svg>
  ),
  question: (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10ZM12 7.75c-.621 0-1.125.504-1.125 1.125a.75.75 0 0 1-1.5 0 2.625 2.625 0 1 1 4.508 1.829c-.092.095-.18.183-.264.267a6.666 6.666 0 0 0-.571.617c-.22.282-.298.489-.298.662V13a.75.75 0 0 1-1.5 0v-.75c0-.655.305-1.186.614-1.583.229-.294.516-.58.75-.814.07-.07.136-.135.193-.194A1.125 1.125 0 0 0 12 7.75ZM12 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
      />
    </svg>
  ),
} as const;

export function ComposerAttachMenu({
  items,
  label = "Add a photo or an extra",
  title = "Add to the conversation",
  description,
  footnote,
  triggerTestId,
  disabled,
  open: openProp,
  onOpenChange,
  className,
  layout = "auto",
}: ComposerAttachMenuProps) {
  const wide = useWide(layout === "auto");
  const asMenu = layout === "menu" || (layout === "auto" && wide);
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
  };
  // The row chosen, run once the sheet has closed and returned focus.
  const pending = useRef<(() => void) | null>(null);

  function choose(item: AttachMenuItem) {
    pending.current = item.onSelect;
    setOpen(false);
  }

  function runPending() {
    const run = pending.current;
    pending.current = null;
    run?.();
  }

  if (asMenu) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <IconButton
            icon={<PlusGlyph />}
            label={label}
            disabled={disabled}
            data-testid={triggerTestId}
            className={className}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="w-[min(22rem,calc(100vw-2rem))] p-1.5"
          onCloseAutoFocus={() => {
            // Radix has put focus back on the +; the row runs after that.
            queueMicrotask(runPending);
          }}
        >
          <DropdownMenuLabel>{title}</DropdownMenuLabel>
          {items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              disabled={item.disabled}
              data-testid={item.testId}
              onSelect={() => {
                pending.current = item.onSelect;
              }}
              className="min-h-14 items-center gap-3 rounded-[0.75rem] px-2"
            >
              {item.icon ? (
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-[0.75rem] bg-[var(--band)] text-[var(--text-strong)]"
                >
                  {item.icon}
                </span>
              ) : null}
              <span className="flex min-w-0 flex-col">
                <span className="text-[0.9375rem] font-medium leading-snug text-[var(--text-strong)]">{item.label}</span>
                {item.description ? (
                  <span className="text-[0.8125rem] leading-snug text-[var(--text-muted)]">{item.description}</span>
                ) : null}
              </span>
            </DropdownMenuItem>
          ))}
          {footnote ? (
            <p className="px-2 pb-1 pt-2 text-[0.75rem] leading-snug text-[var(--text-subtle)]">{footnote}</p>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <IconButton
        icon={<PlusGlyph />}
        label={label}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        data-testid={triggerTestId}
        className={className}
      />
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[85dvh] w-full max-w-[34rem] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+16px)]"
        onCloseAutoFocus={() => {
          // After useReturnFocus has its turn: the next sheet, if any, opens
          // from a settled page.
          queueMicrotask(runPending);
        }}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <ul className="flex flex-col gap-1 px-3">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                disabled={item.disabled}
                aria-disabled={item.disabled || undefined}
                onClick={() => choose(item)}
                data-testid={item.testId}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 rounded-[1rem] px-2 py-2 text-left",
                  "cursor-pointer transition-colors duration-150 not-disabled:hover:bg-[var(--band)] disabled:cursor-not-allowed",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]",
                )}
              >
                {item.icon ? (
                  <span
                    aria-hidden="true"
                    className="grid size-11 shrink-0 place-items-center rounded-[0.875rem] bg-[var(--band)] text-[var(--text-strong)]"
                  >
                    {item.icon}
                  </span>
                ) : null}
                <span className="flex min-w-0 flex-col">
                  <span className="text-base font-medium leading-snug text-[var(--text-strong)]">{item.label}</span>
                  {item.description ? (
                    <span className="text-[0.875rem] leading-snug text-[var(--text-muted)]">{item.description}</span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {footnote ? (
          <p className="px-5 pt-3 text-[0.8125rem] leading-snug text-[var(--text-subtle)]">{footnote}</p>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

/** True from 48rem (768px at a 16px root) up, read live; false on the server. */
function useWide(active: boolean): boolean {
  const query = "(min-width: 48rem)";
  const [wide, setWide] = useState(
    () => active && typeof window !== "undefined" && !!window.matchMedia?.(query).matches,
  );
  useEffect(() => {
    if (!active || typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(query);
    const read = () => setWide(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, [active]);
  return wide;
}
