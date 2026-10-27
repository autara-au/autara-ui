import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { IconButton } from "./IconButton";

/**
 * CarouselHeader — the eyebrow + heading + arrow-nav + "See all" pattern
 * used above every homepage rail ("Top-rated pros near you", "Just joined",
 * "Trending in your city").
 *
 * Composition:
 *   - Left block: editorial eyebrow + bold heading + muted subhead
 *   - Right block: prev/next circular buttons + optional "See all ↗"
 *
 * Heading on the bookmark-style rails uses the SectionHeading non-editorial
 * treatment (smaller). The lime "How it works" surface uses
 * `SectionHeading editorial`. This component is for the smaller carousel
 * rails — for the marquee section, compose SectionHeading + the rail
 * separately.
 */

export interface CarouselHeaderProps {
  /**
   * Short sentence-case label, rendered as written, e.g. "Recommended",
   * "New on Autara". Pass natural case: nothing transforms it (AUTM-1483).
   */
  eyebrow: string;
  title: string;
  description?: string;
  /** Handler for the left arrow. If omitted, the button is hidden. */
  onPrev?: () => void;
  /** Handler for the right arrow. If omitted, the button is hidden. */
  onNext?: () => void;
  /** Disable the prev arrow (e.g. at the start of the rail). */
  prevDisabled?: boolean;
  /** Disable the next arrow (e.g. at the end). */
  nextDisabled?: boolean;
  /** "See all" link slot — pass an `<a>` or framework `<Link>` element. */
  seeAll?: ReactNode;
  className?: string;
}

export function CarouselHeader({
  eyebrow,
  title,
  description,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  seeAll,
  className,
}: CarouselHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {/* v3: eyebrow with no tick (Don 2026-08-26). AUTM-1483: sentence
            case at 0.8125rem, weight 500, no letterspacing. */}
        <p className="inline-flex items-center gap-3 text-[0.8125rem] font-medium text-[var(--text-muted)]">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-[1.75rem] font-bold leading-tight tracking-[-0.025em] text-[var(--text-strong)] sm:text-[2.125rem]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 max-w-xl text-sm text-[var(--text-muted)] sm:text-[0.9375rem]">
            {description}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        {(onPrev || onNext) && (
          <div className="flex items-center gap-2">
            <NavArrow
              direction="left"
              onClick={onPrev}
              disabled={prevDisabled}
            />
            <NavArrow
              direction="right"
              onClick={onNext}
              disabled={nextDisabled}
            />
          </div>
        )}
        {seeAll ? (
          <div className="text-[0.8125rem] font-medium text-[var(--text-strong)]">
            {seeAll}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function NavArrow({
  direction,
  onClick,
  disabled,
}: {
  direction: "left" | "right";
  onClick?: () => void;
  disabled?: boolean;
}) {
  if (!onClick) return null;
  /* AUTM-1756: the library's icon disc, filled, 44px (48px to a finger). It
     was a 40px hairline ring on the surface. Disabled keeps its colour
     (AUTM-1719); the rail's end is said by aria-disabled. */
  return (
    <IconButton
      onClick={onClick}
      disabled={disabled}
      label={direction === "left" ? "Previous" : "Next"}
      icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {direction === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
        </svg>
      }
    />
  );
}
