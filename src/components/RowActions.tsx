import type { ReactNode } from "react";
import { Button, buttonVariants } from "./Button";
import { IconButton } from "./IconButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./DropdownMenu";
import { cn } from "../lib/cn";

/**
 * RowActions: a list row's everyday actions, without opening the record
 * (AUTM-1787, graduated from the merchant portal's AUTM-1777).
 *
 * Del's ask on the Invoices list was a Download on every row; the CTO sweep
 * found the same shape on Customers (Call, Text). The action a merchant wants
 * most from a list sat only inside the record, so every use cost an open and
 * a back.
 *
 * The actions sit BESIDE the row's own control, never inside it: the row tap
 * still opens the record, and there is never a button inside a button. How
 * they show follows the room the ROW has, by container query in `em` (so 200%
 * text counts as less room). The caller puts `row-actions-host` on the row:
 *
 *   under 36em   one "More" disc opening a menu (a phone)
 *   36em to 60em a 44px icon disc per action, its name in aria-label and title
 *   60em and up  icon and visible label (iPad landscape, a desktop list)
 *
 * An action is a button (`onSelect`) or a link (`href`, for `tel:` and `sms:`,
 * which hand off to the OS as plain links). Every control carries an
 * accessible name that names its object ("Download invoice INV-0001", "Call
 * Alex Chen"), a 44px target and a test id.
 */
export interface RowAction {
  /** Stable key. */
  id: string;
  /** Short visible label: "Download", "Call". */
  label: string;
  /** Full accessible name: "Download invoice INV-0001". */
  accessibleLabel: string;
  icon: ReactNode;
  onSelect?: () => void;
  href?: string;
  busy?: boolean;
  /** The inline control's test id. */
  testId?: string;
  /** The menu item's test id. */
  menuTestId?: string;
}

export interface RowActionsProps {
  actions: RowAction[];
  /** The More disc's accessible name: "More actions for invoice INV-0001". */
  menuLabel: string;
  menuTestId?: string;
  className?: string;
}

const MoreDots = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="5" cy="12" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="19" cy="12" r="1.8" />
  </svg>
);

export function RowActions({ actions, menuLabel, menuTestId, className }: RowActionsProps) {
  if (actions.length === 0) return null;
  return (
    <div className={cn("row-actions flex flex-none items-center", className)}>
      <div className="row-actions-inline items-center gap-2">
        {actions.map((a) =>
          a.href ? (
            <a
              key={a.id}
              href={a.href}
              aria-label={a.accessibleLabel}
              title={a.accessibleLabel}
              data-testid={a.testId}
              onClick={a.onSelect}
              // The quiet small Button's own look, focus ring and radius, so a
              // link and a button side by side are one control family.
              className={cn(
                buttonVariants({ variant: "quiet", size: "sm" }),
                "row-action icon-disc relative isolate motion-press min-h-11 min-w-11 gap-1.5 px-3",
              )}
            >
              <span aria-hidden="true" className="inline-flex">{a.icon}</span>
              <span className="row-action-label">{a.label}</span>
            </a>
          ) : (
            <Button
              key={a.id}
              variant="quiet"
              size="sm"
              aria-label={a.accessibleLabel}
              title={a.accessibleLabel}
              data-testid={a.testId}
              busy={a.busy}
              onClick={a.onSelect}
              className="row-action icon-disc relative isolate motion-press min-h-11 min-w-11 gap-1.5 px-3"
            >
              <span aria-hidden="true" className="inline-flex">{a.icon}</span>
              <span className="row-action-label">{a.label}</span>
            </Button>
          ),
        )}
      </div>
      <div className="row-actions-menu">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton
              variant="ghost"
              icon={MoreDots}
              label={menuLabel}
              data-testid={menuTestId}
              className="motion-press"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions.map((a) =>
              a.href ? (
                <DropdownMenuItem key={a.id} asChild data-testid={a.menuTestId}>
                  <a href={a.href} onClick={a.onSelect} aria-label={a.accessibleLabel}>
                    <span aria-hidden="true" className="mr-2 inline-flex">{a.icon}</span>
                    {a.label}
                  </a>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  key={a.id}
                  data-testid={a.menuTestId}
                  disabled={a.busy}
                  aria-label={a.accessibleLabel}
                  onSelect={() => a.onSelect?.()}
                >
                  <span aria-hidden="true" className="mr-2 inline-flex">{a.icon}</span>
                  {a.label}
                </DropdownMenuItem>
              ),
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
