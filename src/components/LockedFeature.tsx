import type { ReactNode } from "react";

/**
 * LockedFeature — what a merchant sees where a feature their plan does not
 * include would have been.
 *
 * WHY IT IS A WRAPPER RATHER THAN A PANEL YOU PLACE BY HAND. The caller passes
 * the real thing as children and a `locked` flag, so the unlocked path is the
 * default and the locked path is the exception. Written the other way round,
 * every call site has to remember to render the feature when it is allowed,
 * and the failure mode of forgetting is hiding work from a merchant who is
 * entitled to do it. That is the expensive direction: an extra click costs a
 * second, an invisible feature costs the job.
 *
 * FAIL OPEN. `locked={false}` renders children untouched. A caller whose
 * entitlement read has not resolved, or has failed, passes false and the
 * merchant keeps working.
 *
 * IT NEVER RENDERS THE CHILDREN WHEN LOCKED. No blur, no overlay, no preview
 * behind frosted glass. Two reasons, and the first is not aesthetic: the
 * content would still be in the DOM, so a paywall drawn over real customer
 * data is a data leak wearing a design. The second is that teasing a merchant
 * with their own data is a worse experience than telling them plainly.
 *
 * IT NEVER RENDERS A PRICE, AND IT HAS NO BUTTON OF ITS OWN. The `action` slot
 * is the caller's, because only the caller knows whether it is running in the
 * native app, where App Store guideline 3.1.3(f) forbids a price, a purchase
 * button and a link out to one, or on the web portal where the route to
 * managing a plan is allowed. Deciding that here, by screen width or by
 * guesswork, is how a build gets rejected.
 *
 * WHAT MOBBIN SAYS AND WHY WE DIVERGE (2026-09-20). Every comparable pattern
 * found is a price-led paywall SCREEN: Deepstash, Splitwise, Moonlitt, Feeld,
 * Fixtured, Grok, Bevel. Plan tables, strike-through pricing, countdowns, a
 * takeover with a Continue button.
 *
 *   steal        Neuecast's inline lock: the locked thing sits in place, with
 *                a lock, one line of reason, and a way onward. No takeover.
 *   adapt        Splitwise and Grok list what the plan would give you. We
 *                allow one line of that in `description`, never a feature grid.
 *   avoid        The price-led takeover, on both counts: we cannot show a
 *                price on native, and a full-screen upsell in front of a
 *                merchant who is mid-job on a work tool is hostile.
 *   differentiate  These are consumer apps interrupting leisure. This is a
 *                work tool: the merchant opened this screen to do a job, so
 *                the lock explains and gets out of the way.
 */

export interface LockedFeatureProps {
  /**
   * Whether the merchant's plan excludes this feature. False renders children
   * untouched, which is also the correct value while the answer is unknown.
   */
  locked: boolean;
  /** What is locked, in the merchant's words rather than the feature key. */
  title: string;
  /** One line: what it does, or what having it would change. Never a price. */
  description?: string;
  /**
   * The route onward, supplied by the caller. On native this must not be a
   * price, a purchase button or a link to one (App Store 3.1.3(f)).
   */
  action?: ReactNode;
  /**
   * `panel` replaces a section or a card. `inline` replaces a single row, for
   * a list item or a menu entry, where a panel would be louder than the thing
   * it is standing in for.
   */
  variant?: "panel" | "inline";
  /** Defaults to a lock. Pass a Solar icon to match the surrounding screen. */
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

function LockGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
    </svg>
  );
}

export function LockedFeature({
  locked,
  title,
  description,
  action,
  variant = "panel",
  icon,
  children,
  className = "",
}: LockedFeatureProps) {
  if (!locked) return <>{children}</>;

  const glyph = (
    <span
      aria-hidden="true"
      className="grid h-9 w-9 shrink-0 place-items-center rounded-autara bg-[var(--color-autara-purple-static)] text-white"
    >
      {icon ?? <LockGlyph />}
    </span>
  );

  if (variant === "inline") {
    return (
      <div
        className={`flex items-center gap-3 rounded-autara-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 ${className}`}
      >
        {glyph}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[var(--text-strong)]">
            {title}
          </p>
          {description ? (
            <p className="truncate text-sm text-[var(--text-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    );
  }

  return (
    <section
      /* Named by its own title, so a screen reader announces what is locked
         rather than reaching an unlabelled region. */
      aria-label={title}
      className={`flex flex-col items-center justify-center rounded-autara-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-6 py-10 text-center ${className}`}
    >
      <div className="mb-4">{glyph}</div>
      <p className="text-sm font-bold text-[var(--text-strong)]">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-xs text-sm text-[var(--text-muted)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
