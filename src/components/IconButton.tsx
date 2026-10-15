import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { Button, type ButtonProps } from "./Button";
import { cn } from "../lib/cn";

/**
 * IconButton — the icon disc (AUTM-1594, canvas v44 "Icon disc"; AUTM-1756).
 *
 * A round action holding an icon and nothing else. `label` is required by the
 * type and becomes the accessible name (and the tooltip), because every
 * icon-only control needs one and an optional prop is one that gets
 * forgotten.
 *
 * AUTM-1756 (Don, 2026-10-05: "make it large and highlight it like a rounded
 * one, not only a cross"; 2026-10-15: "Icon buttons are less accessible, can
 * we make it better, and smooth"). The disc is always FILLED, never a bare
 * glyph and never a faint ring, as Wise draws its back and close:
 *
 *   - `tone="neutral"` (default): `--icon-disc`, a soft lavender grey with an
 *     ink glyph in light, a disc a step lighter than the surface with a white
 *     glyph in dark. Shows on paper, band and raised.
 *   - `tone="primary"`: lime, for the one icon action that leads (Send).
 *     AUTM-1838: lime is the one primary; there are no black buttons.
 *   - `tone="danger"`: the neutral disc with the glyph in `--danger`, for a
 *     destructive icon action (remove a car). Never a red fill.
 *   - `tone="ondark"`: a translucent white disc with a white glyph, for brand,
 *     brand-deep, hero, ink and photo-free dark grounds in either theme.
 *   - `tone="inverse"`: the disc for `--surface-inverse` (the ink toast,
 *     which turns white in dark), so it follows that surface, not the page.
 *
 * Sizes, all with at least a 44px target:
 *   - `md` (default) 44px, 48px under a coarse pointer (a finger); 20px glyph;
 *   - `lg` 52px (Button's `lg` height); 24px glyph;
 *   - `sm` a 36px disc for dense rows and toolbars, with an unpainted 44px
 *     touch area around it (`.icon-disc-hit`); 18px glyph.
 * The glyph is drawn at the size's own size whatever size the caller drew
 * it at, so a 14px cross cannot creep back.
 *
 * Motion (`.icon-disc` in utilities/icon-disc.css, `.motion-press` from
 * Button): hover lays the glyph's colour over the fill at 8%, press at 14%
 * and 97% scale, opacity and scale only, on the one ease-out, the scale off
 * under reduced motion. Focus is Button's ring: full `--accent`, 2px offset.
 * Disabled and busy keep the real colour (AUTM-1719).
 *
 * `asChild` composes with a framework link. Pass the link EMPTY and the disc
 * fills it, as BackButton does:
 *
 *     <IconButton asChild icon={<Pen />} label="Edit service">
 *       <Link to="/services/1/edit" />
 *     </IconButton>
 *
 * `variant` is the pre-1756 name and still works: `quiet` and `ghost` draw
 * the neutral disc (ghost was a bare glyph until AUTM-1756), `strong` the
 * lime one, `ondeep` the on-dark one.
 *
 * `badge` sits on the disc's top-right edge, for a count on the bell. Say the
 * count in `label` too ("Notifications, 12 unread"): the badge is drawn, the
 * label is what is heard.
 */
export type IconButtonTone = "neutral" | "primary" | "danger" | "ondark" | "inverse";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps
  extends Omit<ButtonProps, "children" | "size" | "leadingIcon" | "trailingIcon" | "fullWidth" | "variant"> {
  /** The icon. Drawn at 18, 20 or 24px by `size`, whatever its own size. */
  icon: ReactNode;
  /** Accessible name and tooltip. Required: the disc has no visible text. */
  label: string;
  /** The disc's fill. Default `neutral`. */
  tone?: IconButtonTone;
  /** `sm` 36px disc (44px target), `md` 44px (48px to a finger), `lg` 52px. Default `md`. */
  size?: IconButtonSize;
  /** @deprecated Use `tone`. `quiet` and `ghost` draw `neutral`, `strong` `primary`, `ondeep` `ondark`. */
  variant?: "quiet" | "strong" | "ondeep" | "ghost";
  /** A count or dot drawn on the disc's top-right edge. */
  badge?: ReactNode;
  /** With `asChild`, the element to render as (a framework link), passed empty. */
  children?: ReactElement;
}

/* Each tone repeats its fill on `not-disabled:hover:`, which replaces Button's
   ghost hover (band) through tailwind-merge: the hover is the `.icon-disc`
   layer, never a second fill. */
const TONE: Record<IconButtonTone, string> = {
  neutral:
    "bg-[var(--icon-disc)] text-[var(--on-icon-disc)] not-disabled:hover:bg-[var(--icon-disc)]",
  primary: "bg-[var(--lime)] text-[var(--on-lime)] not-disabled:hover:bg-[var(--lime)]",
  danger: "bg-[var(--icon-disc)] text-[var(--danger)] not-disabled:hover:bg-[var(--icon-disc)]",
  ondark:
    "bg-[var(--icon-disc-ondark)] text-[var(--on-icon-disc-ondark)] not-disabled:hover:bg-[var(--icon-disc-ondark)]",
  inverse:
    "bg-[var(--icon-disc-inverse)] text-[var(--on-icon-disc-inverse)] not-disabled:hover:bg-[var(--icon-disc-inverse)]",
};

/* The disc and the glyph inside it. `pointer-coarse:` is Tailwind 4.1's
   `@media (pointer: coarse)`: a finger gets 48px where a mouse gets 44. */
const SIZE: Record<IconButtonSize, string> = {
  sm: "size-9 icon-disc-hit [&_svg]:size-[1.125rem]",
  md: "size-11 pointer-coarse:size-12 [&_svg]:size-5",
  lg: "size-13 [&_svg]:size-6",
};

/** The tone a pre-1756 `variant` draws, when no `tone` is given. */
export function resolveIconButtonTone(
  tone: IconButtonTone | undefined,
  variant: IconButtonProps["variant"],
): IconButtonTone {
  if (tone) return tone;
  if (variant === "strong") return "primary";
  if (variant === "ondeep") return "ondark";
  return "neutral";
}

/** The classes of an icon disc, for a control that cannot be an IconButton. */
export function iconDiscClasses(opts?: { tone?: IconButtonTone; size?: IconButtonSize; className?: string }): string {
  const { tone = "neutral", size = "md", className } = opts ?? {};
  return cn("icon-disc relative isolate inline-flex items-center justify-center rounded-full", TONE[tone], SIZE[size], className);
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { icon, label, tone, size = "md", variant, badge, className, title, asChild, children, ...rest },
    ref,
  ) {
    const resolved = resolveIconButtonTone(tone, variant);
    const content = (
      <>
        {icon}
        {badge != null && (
          <span aria-hidden="true" className="pointer-events-none absolute -right-1 -top-0.5">
            {badge}
          </span>
        )}
      </>
    );
    /* With asChild the caller passes the link EMPTY; the disc's content
       becomes its children so Slot can merge the root props onto it. */
    const slotted =
      asChild && isValidElement(children)
        ? cloneElement(children as ReactElement<{ children?: ReactNode }>, undefined, content)
        : content;
    return (
      <Button
        ref={ref}
        // The transparent base; the tone paints it.
        variant="ghost"
        size="icon"
        asChild={asChild}
        aria-label={label}
        title={title ?? label}
        data-tone={resolved}
        data-size={size}
        className={cn(
          "icon-disc relative isolate",
          TONE[resolved],
          SIZE[size],
          className,
        )}
        {...rest}
      >
        {slotted}
      </Button>
    );
  },
);

IconButton.displayName = "IconButton";

/** The cross, on a 24 grid; the disc sizes it. */
export function CloseGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export interface CloseButtonProps extends Omit<IconButtonProps, "icon" | "label"> {
  /** Accessible name. Default "Close"; overlays pass their own. */
  label?: string;
}

/**
 * CloseButton — the one close control (AUTM-1756). An IconButton with the
 * cross: a filled 44px disc (48px to a finger) with a 20px cross. Dialog,
 * Sheet, Toast and PWAInstallBanner draw it, and so should any consumer
 * overlay. Compose with Radix's Close through `asChild`:
 *
 *     <DialogPrimitive.Close asChild>
 *       <CloseButton label="Close dialog" className="absolute right-3 top-3" />
 *     </DialogPrimitive.Close>
 */
export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  function CloseButton({ label = "Close", ...rest }, ref) {
    return <IconButton ref={ref} icon={<CloseGlyph />} label={label} {...rest} />;
  },
);

CloseButton.displayName = "CloseButton";
