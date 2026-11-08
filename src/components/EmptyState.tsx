import type { ReactNode } from "react";

/**
 * EmptyState — the "nothing-here-yet" surface. Every list, table, and
 * results area should render this when length === 0 (per the workspace
 * cross-stack non-negotiable: "Every list (e.g. uploaded documents) has
 * a designed empty state with icon, headline, body, primary action").
 *
 * Layout (AUTM-1594, canvas v44 "Empty"): a band card, 24px radius, 20px
 * in, left-aligned, 10px between parts:
 *   - Optional 44px icon disc (raised)
 *   - 18px Bold title + 15px description at 72% ink
 *   - Optional action, full width: the lime primary, `Button size="sm"`
 *     (AUTM-1838: no black buttons, on band as on paper).
 *
 * With an `illustration` (AUTM-2042, Don 2026-11-08: "the cut-out object on
 * the grey band tile"), the same band card centres its content, after Wise's
 * empty lists: the picture about 10rem square above the title, the title and
 * description centred, and the action at its own width, centred, not
 * stretched. The picture is decorative (the title says what is empty), so its
 * box is hidden from assistive tech; pass an `<img alt="">`, typically a
 * transparent WebP of a 3D object, and it is fitted inside the box whole.
 *
 * Copy guidance — recoverable + specific:
 *   - Bad: "No data"
 *   - Good: "No bookings yet — new requests will appear here as
 *     customers find your services."
 */
export interface EmptyStateProps {
  /** A small icon in the 44px disc, for the left-aligned card. Ignored when `illustration` is set. */
  icon?: ReactNode;
  /**
   * A large decorative picture, usually `<img src="…webp" alt="" />` of a 3D
   * object cut out on transparency. Centres the card. Takes the place of
   * `icon`: pass one or the other; with both, the illustration wins.
   */
  illustration?: ReactNode;
  title: string;
  description?: string;
  /** Typically a BrandButton or BrandButton-asChild link. */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  const pictured = illustration != null && illustration !== false;
  return (
    <div
      data-layout={pictured ? "illustrated" : undefined}
      className={`flex flex-col gap-2.5 rounded-[1.5rem] bg-[var(--band)] p-5 text-[var(--text-strong)] ${
        pictured ? "items-center text-center " : ""
      }${className}`}
    >
      {pictured ? (
        <div
          aria-hidden="true"
          data-slot="illustration"
          className="mb-2 grid aspect-square w-40 max-w-full shrink-0 place-items-center [&>img]:size-full [&>img]:object-contain [&>svg]:size-full"
        >
          {illustration}
        </div>
      ) : icon ? (
        <div
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--raised)] text-[var(--text-strong)]"
        >
          {icon}
        </div>
      ) : null}
      <p className="text-lg leading-snug font-bold">{title}</p>
      {description ? (
        <p className="text-[0.9375rem] leading-normal text-[var(--text-muted)]">{description}</p>
      ) : null}
      {action ? (
        <div className={pictured ? "flex flex-col items-center pt-1" : "flex flex-col"}>{action}</div>
      ) : null}
    </div>
  );
}
