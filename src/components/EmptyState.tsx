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
 * Copy guidance — recoverable + specific:
 *   - Bad: "No data"
 *   - Good: "No bookings yet — new requests will appear here as
 *     customers find your services."
 */
export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Typically a BrandButton or BrandButton-asChild link. */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col gap-2.5 rounded-[1.5rem] bg-[var(--band)] p-5 text-[var(--text-strong)] ${className}`}
    >
      {icon ? (
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
      {action ? <div className="flex flex-col">{action}</div> : null}
    </div>
  );
}
