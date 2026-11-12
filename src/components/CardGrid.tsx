import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../lib/cn";

/**
 * CardGrid: a grid of cards that uses the width it is given. AUTM-1812, for
 * the merchant portal's Services and Packages, where a lone card sat under a
 * lot of empty page.
 *
 * Columns follow the grid's OWN width, not the window's: one card at least
 * 16.25rem wide, a 1rem gap, so
 *
 *   under 34rem   1 column    a phone (358px of content at 390)
 *   34rem         2           an iPad in portrait (786px at 834)
 *   51rem         3           a narrower landscape or split view
 *   68rem         4           an iPad in landscape (1130px at 1194) and the
 *                             portal beside its rail (1120px at 1440)
 *
 * In rem inside a container query, so the steps follow the reader's text
 * size: at 200% text a card needs twice the room and the grid drops a column
 * rather than crushing a name. A media query could not do this; it resolves
 * rem against the initial size.
 *
 * The grid is the list (`ul` by default, so it announces its count); the
 * query container is a plain div around it, because an element cannot query
 * its own width. `maxColumns` caps the widest step.
 */

export type CardGridColumns = 2 | 3 | 4;

const COLUMNS: Record<CardGridColumns, string> = {
  2: "grid-cols-1 @min-[34rem]:grid-cols-2",
  3: "grid-cols-1 @min-[34rem]:grid-cols-2 @min-[51rem]:grid-cols-3",
  4: "grid-cols-1 @min-[34rem]:grid-cols-2 @min-[51rem]:grid-cols-3 @min-[68rem]:grid-cols-4",
};

export interface CardGridProps extends HTMLAttributes<HTMLElement> {
  /** The most columns, at the widest. Default 4. */
  maxColumns?: CardGridColumns;
  /** `ul` (default, give it `li` children) or `div`. */
  as?: "ul" | "div";
  /** Classes for the outer query container. */
  containerClassName?: string;
}

export const CardGrid = forwardRef<HTMLElement, CardGridProps>(function CardGrid(
  { maxColumns = 4, as = "ul", className, containerClassName, children, ...rest },
  ref,
) {
  const Grid = as;
  return (
    <div data-slot="card-grid" className={cn("@container", containerClassName)}>
      <Grid
        // The two element types share every attribute passed here.
        ref={ref as never}
        className={cn("grid items-stretch gap-4", COLUMNS[maxColumns], className)}
        {...rest}
      >
        {children}
      </Grid>
    </div>
  );
});
