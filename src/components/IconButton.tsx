import { forwardRef, type ReactNode } from "react";
import { Button, type ButtonProps } from "./Button";
import { cn } from "../lib/cn";

/**
 * IconButton — the icon disc (AUTM-1594, canvas v44 "Icon disc").
 *
 * A 44px round action holding an icon and nothing else: band by default,
 * `strong` or `ondeep` where the surface asks for it. Since AUTM-1838 (no
 * black buttons, Don 2026-10-12) `strong` is the lime disc: the one icon
 * action that leads, such as Send. A utility control (pause, play, close)
 * is `quiet` (or `ondeep` on a brand-deep hero), never lime. `label` is required and
 * becomes the accessible name, because every icon-only control needs one and
 * an optional prop is one that gets forgotten.
 *
 * `badge` sits on the disc's top-right edge, for a count on the bell (the
 * sheet's red count). Say the count in `label` too ("Notifications, 12
 * unread"): the badge is drawn, the label is what is heard.
 */
export interface IconButtonProps
  extends Omit<ButtonProps, "children" | "size" | "leadingIcon" | "trailingIcon" | "fullWidth" | "variant"> {
  /** The icon, sized by the caller (the sheet draws 18 to 20px). */
  icon: ReactNode;
  /** Accessible name. Required: the disc has no visible text. */
  label: string;
  variant?: "quiet" | "strong" | "ondeep" | "ghost";
  /** A count or dot drawn on the disc's top-right edge. */
  badge?: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { icon, label, variant = "quiet", badge, className, title, ...rest },
    ref,
  ) {
    return (
      <Button
        ref={ref}
        variant={variant}
        size="icon"
        aria-label={label}
        title={title ?? label}
        className={cn(badge != null && "relative", className)}
        {...rest}
      >
        {icon}
        {badge != null && (
          <span aria-hidden="true" className="pointer-events-none absolute -right-1 -top-0.5">
            {badge}
          </span>
        )}
      </Button>
    );
  },
);

IconButton.displayName = "IconButton";
