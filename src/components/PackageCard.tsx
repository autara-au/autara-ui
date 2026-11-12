'use client'

import { forwardRef } from "react";
import { ServiceCard, type ServiceCardProps } from "./ServiceCard";

/**
 * PackageCard: a package (services sold together at one price) as a card that
 * sells the deal. AUTM-1812, Don 2026-10-09 on the merchant portal's Packages
 * screen, where the card was a photo, a name and "$522.00": "redesign the
 * package card as well with the discount and beautiful UI".
 *
 * It is ServiceCard with a package's words, not a second card: the same
 * photo, fallback panel, layouts, stretched hit area (AUTM-1786), press and
 * skeleton (`ServiceCardSkeleton`), so a package and a service side by side
 * read as one menu. What it adds:
 *
 *   - What is included, by service name, three then "+ N more".
 *   - The package's price large, the services' own total struck through
 *     beside it ("Booked separately" to a screen reader), and a solid brand
 *     "Save $X" pill. Pass both labels or neither: the struck total and the
 *     pill are drawn only together, because a saving with nothing beside it
 *     is a claim, and a struck total with no saving says nothing.
 *
 * Neither figure is worked out here. `packageSaving` (lib/package-listing)
 * takes the server's figures in cents and returns null whenever there is no
 * saving to show; format what it returns with `formatPriceCents`.
 *
 * Mobbin, for the record (AUTM-1812): Urban Company's combo card (included
 * items as a list, the old total struck through) and Uber Eats / Etsy (the
 * saving beside the price) are what this steals; Fresha's "normally $X" per
 * line is adapted into the one struck total; the photo-corner "$10 Off" is
 * avoided, because the corner is where the catalogue's status sits.
 */

export interface PackageCardProps
  extends Omit<ServiceCardProps, "includes" | "compareAtPriceLabel" | "compareAtPriceDescription" | "savingLabel"> {
  /** The names of the services the package includes, in its own order. */
  includedServices?: ReadonlyArray<string> | null;
  /** What those services cost booked separately, pre-formatted, e.g. "$522". */
  servicesTotalLabel?: string | null;
  /** The saving, pre-formatted and worded, e.g. "Save $52". */
  savingLabel?: string | null;
}

export const PackageCard = forwardRef<HTMLElement, PackageCardProps>(function PackageCard(
  { includedServices, servicesTotalLabel, savingLabel, ...rest },
  ref,
) {
  const deal = Boolean(servicesTotalLabel) && Boolean(savingLabel);
  return (
    <ServiceCard
      ref={ref}
      {...rest}
      includes={includedServices}
      compareAtPriceLabel={deal ? servicesTotalLabel : null}
      compareAtPriceDescription="Booked separately"
      savingLabel={deal ? savingLabel : null}
    />
  );
});
