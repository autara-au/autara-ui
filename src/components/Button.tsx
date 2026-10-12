import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../lib/cn";
import { AutaraLoader, type AutaraLoaderSize } from "./AutaraLoader";

/**
 * Button — the single canonical Autara CTA primitive.
 *
 * Merged from the v1.0.x `Button` and the v1.1.0-alpha `BrandButton`
 * (the latter was discovered to be doing the same job, so it's now
 * just a re-export of this component — see `BrandButton.tsx`).
 *
 * AUTM-1594 — canvas v44's component sheet ("Buttons"), approved by Don, as
 * amended by AUTM-1838 (Don, 2026-10-12: "no black buttons anywhere. Lime is
 * the one primary action on a screen, the rest are quiet secondaries"):
 *
 *   - `primary`  lime with ink text. The one action on a screen, on paper,
 *                on band, in sheets and dialogs alike. The ink label is what
 *                identifies it (16.9:1); lime on paper is already 1.15:1 and
 *                on band 1.03:1, so no surface needs a darker action.
 *   - `quiet`    band. Secondary choices; never competes with the primary.
 *   - `danger`   band with the label in `--danger`. The DESTRUCTIVE action:
 *                cancel, void, delete, discard, remove. Never lime, which says
 *                go; never a red fill (AUTM-1594 "no red buttons"). It is
 *                Apple's destructive style, red words on the same surface, and
 *                a ConfirmDialog asks first.
 *   - `ondeep`   translucent white on a brand-deep hero; lime leads there.
 *   - `link`     brand text, 44px tall, no fill.
 *   - `ghost`    no fill, ink text, band on hover. Not on the sheet: kept for
 *                toolbars where a band pill would be one too many.
 *
 * `strong` was the ink (black) button. Since AUTM-1838 it is a name for
 * `primary`, so every consumer's `variant="strong"` turns lime on its next
 * bump. A screen that used `strong` BESIDE a lime primary now has two limes:
 * the second one is `quiet`. A destructive `strong` is `danger`.
 *
 * Sizes: `sm` 44 → `md`/`default` 48 → `lg` 52; `icon` is a 44px disc
 * (prefer `IconButton`, which requires the label an icon-only control needs).
 *
 * `busy` (AUTM-1706) shows the Autara mark, turning, in the label's colour and
 * centred where the label was. The label and icons stay in the layout and in
 * the accessibility tree, only transparent, so the button keeps its exact
 * width and a screen reader still hears its name, with `aria-busy`. The
 * button is disabled but stays at full strength. (Until AUTM-1706 a generic
 * ring took the leading icon's place, or was added beside the label, which
 * widened the button by the ring and a gap.)
 *
 * AUTM-1719 — disabled keeps the variant's REAL fill and text colour (Don,
 * 2026-10-04: "don't mute the button colours even if disabled, show the real
 * colour, everywhere, also loading"). It was a 45% wash, which on lime read
 * as a pale, broken button. A disabled button is now marked by
 * `aria-disabled`, a not-allowed cursor, no hover step and no press, and it
 * must say why beside it or in its label: a full-colour button that silently
 * does nothing is worse than a pale one. So:
 *   - A form's PRIMARY button is not disabled at all. It stays enabled and
 *     validates on press: an inline message, announced, and focus on the
 *     first field that needs attention. See the "Validate on press" story.
 *   - A button that is genuinely unavailable keeps its colour, is disabled,
 *     and carries the reason as text beside it (a `title` alone does not
 *     reach touch or keyboard users).
 *
 * The legacy variant names still render, each as its sheet equivalent (see
 * LEGACY below), so a consumer bump changes the look and nothing else.
 *
 * Polymorphic via Radix `Slot` (asChild). Compose with a framework Link
 * via `asChild`. autara-ui never imports next/link or react-router-dom.
 */

type SheetVariant = "primary" | "quiet" | "danger" | "ondeep" | "link" | "ghost";

type LegacyVariant =
  | "strong"
  | "dark"
  | "outline"
  | "secondary"
  | "destructive"
  | "acid"
  | "glass"
  | "light"
  | "light-primary"
  | "light-outline"
  | "light-ghost"
  | "light-secondary"
  | "light-destructive"
  | "light-link";

type Variant = SheetVariant | LegacyVariant;

type Size = "sm" | "md" | "lg" | "icon" | "default";

/**
 * AUTM-1594 — every legacy name resolves to the sheet variant that does its
 * job. `glass`, `outline` and `secondary` are `quiet` because band is the only
 * secondary fill left (no outlines, no translucent panels on paper).
 *
 * AUTM-1838 — `strong` and `dark` (the ink button) are `primary`: there are
 * no black buttons. `destructive` is `danger`, never lime.
 */
const LEGACY: Record<LegacyVariant, SheetVariant> = {
  strong: "primary",
  dark: "primary",
  destructive: "danger",
  "light-destructive": "danger",
  acid: "primary",
  "light-primary": "primary",
  outline: "quiet",
  secondary: "quiet",
  glass: "quiet",
  light: "quiet",
  "light-outline": "quiet",
  "light-secondary": "quiet",
  "light-ghost": "ghost",
  "light-link": "link",
};

/**
 * THE SHAPE — a pill (canvas v44: "Pills, 44px minimum"). This reverses the
 * 2026-09-01 shared-radius rule (a 14px button beside a 14px field), which
 * the sheet Don approved for Autara Web supersedes.
 *
 * The radius is HALF THE SIZE'S HEIGHT, in rem, rather than 9999px. On one
 * line that is exactly a pill. When the label wraps at 200% text (AUTM-915)
 * the box grows and becomes a rounded rectangle, where a 9999px radius would
 * make a capsule whose ends eat the label. SocialButton learned this first.
 *
 * AUTM-915 still holds: `min-h-*` and a vertical pad, never a fixed `h-*`, and
 * no `whitespace-nowrap` by default, so a label wraps and the box grows rather
 * than running off screen. `min-w-fit` (AUTM-955) keeps a short label on one
 * line while the row has room. Horizontal padding is clamped against the
 * viewport so at 200% text on a phone the padding does not crowd out the
 * label.
 *
 * AUTM-977 — the focus ring lives on BASE: full-strength `--accent`, a 2px
 * offset band painted in `--background`. One signature for every variant;
 * `solid-emphasis.test.ts` enforces it.
 *
 * No lift on hover and no shadow: depth on the sheet is only the step between
 * paper, band and raised. Hover moves the fill one step; `not-disabled:` keeps
 * a disabled button still while working on `asChild` links too.
 *
 * AUTM-1708 — every Button presses by default: the library's `motion-press`
 * (97% under the finger, on `--motion-press`, colour on `--motion-hover`), or
 * `motion-press-row` (98.5%) when `fullWidth`, where 97% of a full-width
 * button would move its edges by a fingertip. Not on `variant="link"`: a text
 * action does not shrink. Off under reduced motion and while disabled or
 * busy. `press={false}` opts out. The classes are unlayered CSS, so their
 * transition list replaces BASE's `transition-colors` in every consumer.
 */
const BASE =
  "inline-flex select-none items-center justify-center gap-2 text-center break-words min-w-fit font-medium leading-tight transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed aria-disabled:cursor-not-allowed aria-busy:cursor-progress";

const SIZES: Record<Exclude<Size, "default">, string> = {
  sm: "min-h-11 rounded-[1.375rem] px-[min(1.125rem,5vw)] py-2 text-[0.9375rem]",
  md: "min-h-12 rounded-[1.5rem] px-[min(1.375rem,6vw)] py-2 text-base",
  lg: "min-h-13 rounded-[1.625rem] px-[min(1.75rem,7vw)] py-2.5 text-[1.0625rem]",
  icon: "size-11 shrink-0 rounded-full p-0",
};

const VARIANT_CLASSES: Record<SheetVariant, string> = {
  primary:
    "bg-[var(--lime)] text-[var(--on-lime)] not-disabled:hover:bg-[var(--lime-press)]",
  quiet:
    "bg-[var(--band)] text-[var(--text-strong)] not-disabled:hover:bg-[var(--band-press)]",
  // AUTM-1838: quiet's fill, the label in danger red (5.9:1 on band light,
  // 8.0:1 dark). Never lime, never a red fill.
  danger:
    "bg-[var(--band)] text-[var(--danger)] not-disabled:hover:bg-[var(--band-press)]",
  ondeep:
    "bg-[rgba(255,255,255,0.14)] text-[var(--on-deep)] not-disabled:hover:bg-[rgba(255,255,255,0.22)]",
  // No padding: a text action sits on the line it belongs to. Still 44px
  // tall from `sm`, so the tap target holds.
  link: "bg-transparent px-0 text-[var(--accent)] underline-offset-4 not-disabled:hover:underline",
  ghost:
    "bg-transparent text-[var(--text-strong)] not-disabled:hover:bg-[var(--band)]",
};

/** The busy mark per size: 20px in a 44 or 48px button, 24px in the 52px one. */
const BUSY_LOADER: Record<Exclude<Size, "default">, AutaraLoaderSize> = {
  sm: 20,
  md: 20,
  lg: 24,
  icon: 20,
};

/** Resolve a legacy name to the sheet variant that does its job. */
export function resolveButtonVariant(variant: Variant): SheetVariant {
  return (LEGACY as Record<string, SheetVariant>)[variant] ?? (variant as SheetVariant);
}

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: Variant;
  size?: Size;
  /** Stretch to fill the container's width. */
  fullWidth?: boolean;
  /** Icon rendered before the label. */
  leadingIcon?: ReactNode;
  /** Icon rendered after the label. */
  trailingIcon?: ReactNode;
  children: ReactNode;
  /** Compose with another component (e.g. framework Link) via Radix Slot. */
  asChild?: boolean;
  /**
   * Work in progress: the Autara mark turns where the label was, the label
   * stays for screen readers and holds the width, `aria-busy` is set and the
   * button is disabled at full strength.
   */
  busy?: boolean;
  /**
   * Scale under the finger: 97%, or 98.5% when `fullWidth`. Default true;
   * never on `variant="link"`. Pass `false` where the control must not move.
   */
  press?: boolean;
}

/** The press class for a variant and width, or nothing (AUTM-1708). */
function pressClass(variant: SheetVariant, fullWidth: boolean | undefined, press: boolean): string | false {
  if (!press || variant === "link") return false;
  return fullWidth ? "motion-press-row" : "motion-press";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      fullWidth,
      leadingIcon,
      trailingIcon,
      asChild,
      busy,
      press = true,
      children,
      className,
      type,
      disabled,
      ...rest
    },
    ref,
  ) {
    const Comp = asChild ? Slot : "button";
    const resolvedSize = size === "default" ? "md" : size;
    const resolvedVariant = resolveButtonVariant(variant);
    const busyProps = busy ? { "aria-busy": true } : {};
    return (
      <Comp
        ref={ref}
        className={cn(
          BASE,
          SIZES[resolvedSize],
          VARIANT_CLASSES[resolvedVariant],
          pressClass(resolvedVariant, fullWidth, press),
          fullWidth && "w-full",
          busy && !asChild && "relative",
          className,
        )}
        {...busyProps}
        {...(asChild
          ? rest
          : {
              type: type ?? "button",
              disabled: disabled || busy,
              // AUTM-1719: said out loud, since the colour no longer says it.
              // Busy is said by aria-busy instead (and keeps its progress
              // cursor), though it is natively disabled too.
              "aria-disabled": disabled ? true : undefined,
              ...rest,
            })}
      >
        {asChild ? (
          children
        ) : busy ? (
          <>
            {/* The resting content, transparent: it holds the width and stays
                the button's accessible name. `gap-[inherit]` keeps the same
                spacing it had as direct children. */}
            <span className="inline-flex min-w-0 items-center justify-center gap-[inherit] opacity-0">
              {leadingIcon}
              {children}
              {trailingIcon}
            </span>
            <span className="absolute inset-0 flex items-center justify-center">
              <AutaraLoader size={BUSY_LOADER[resolvedSize]} tone="current" decorative />
            </span>
          </>
        ) : (
          <>
            {leadingIcon}
            {children}
            {trailingIcon}
          </>
        )}
      </Comp>
    );
  },
);

Button.displayName = "Button";

/**
 * Legacy CVA-style `buttonVariants` helper — preserved for v1.0.x
 * consumers. Returns the className for a variant + size combination.
 */
export function buttonVariants(opts?: {
  variant?: Variant;
  size?: Size;
  /** As Button's: the full-width press (98.5%). Does not add `w-full`. */
  fullWidth?: boolean;
  /** As Button's: default true, never on `link`. */
  press?: boolean;
  className?: string;
}): string {
  const { variant = "primary", size = "md", fullWidth, press = true, className } = opts ?? {};
  const resolvedSize = size === "default" ? "md" : size;
  const resolvedVariant = resolveButtonVariant(variant);
  return cn(
    BASE,
    SIZES[resolvedSize],
    VARIANT_CLASSES[resolvedVariant],
    pressClass(resolvedVariant, fullWidth, press),
    className,
  );
}
