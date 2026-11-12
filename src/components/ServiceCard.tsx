'use client'

import {
  Fragment,
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "../lib/cn";
import { Badge } from "./Badge";
import { buttonVariants } from "./Button";

/**
 * ServiceCard: one bookable service, the same card on the merchant page's
 * service list and on the booking flow's "Pick a service" step, so the two
 * never disagree about what a service looks like.
 *
 * AUTM-1694 (Don, 2026-10-03, on the booking picker): "the service cards
 * aren't properly layout and feels empty, the thumbnails should be visible
 * not a small square, make a proper service card, more dynamic." So:
 *
 *   - The photo is the card's lead, at a fixed 4:3 with a cover crop, inset
 *     10px in a band card at 24px corners (canvas v50's menu tile, the shape
 *     merchant-mobile's Services board already draws).
 *   - A service with no photo gets a designed panel, not an empty slot and
 *     not a repeated placeholder glyph. AUTM-1211 removed the glyph because
 *     a column of identical glyphs reads as failed images; this panel shows
 *     the service's own duration or working days as a figure, so no two
 *     read alike and none reads as a broken picture. A photo that fails to
 *     load falls back to the same panel.
 *   - Two lines of description, with More to read the rest in place.
 *   - Duration, working days and anything else the consumer adds as chips.
 *   - The price block takes a headline and optional lines under it. The
 *     consumer decides what is true for its environment ("Service" and
 *     "Booking fee" when a fee is charged, a single price when it is not);
 *     the card never words a fee itself.
 *
 * Three modes, chosen by the props passed:
 *
 *   - link   (`href`, optionally `as={Link}`): the merchant page. The name is
 *            the link and its hit area stretches over the whole card.
 *   - select (`onSelect`): the booking picker. A real radio, visually hidden,
 *            labelled by the name, so cards sharing `groupName` are a radio
 *            group: arrow keys move, Space selects, a screen reader hears
 *            "radio, 2 of 6". The chosen card takes the selected colour, as
 *            ChoiceCard does.
 *   - static (neither): a card that is not bookable.
 *
 * In every mode the description's More toggle sits above the stretched hit
 * area, so reading more never books or selects anything.
 *
 * A press anywhere else on the card is the card's, by mouse, touch or pen,
 * even under a consumer's own press styles (AUTM-1786; see `HIT`).
 *
 * Layouts: `horizontal` (a list row, photo left), `vertical` (a grid tile,
 * photo on top), `adaptive` (a row on a phone, a tile from 640px). A
 * horizontal card that is narrower than 19rem stacks, which is what keeps a
 * row legible at 200% text: rem in a container query follows the user's text
 * size.
 *
 * The card is an inline-size container (`@container`), so it must get its
 * width from its parent (a list, a grid cell). Inside a shrink-to-fit parent
 * it collapses.
 *
 * AUTM-1812 (Don, 2026-10-09, on the merchant portal's Packages screen:
 * "redesign the package card as well with the discount and beautiful UI",
 * then "services card also"). The same card is the merchant's catalogue tile,
 * so a pro sees their menu the way a customer will. Five optional parts, none
 * of which changes a card that does not pass them:
 *
 *   - `status`: a solid pill on the photo's corner (Active lime, Draft amber,
 *     Inactive band, the tones the service editor already uses), read with
 *     the card by a screen reader.
 *   - `noPhotoLabel`: words on the no-photo panel, e.g. "No photo yet" in the
 *     catalogue, where the missing cover is what stands between a draft and
 *     Publish.
 *   - `includes`: what a package holds, by name, three then "+ N more".
 *   - `compareAtPriceLabel` and `savingLabel`: a figure struck through after
 *     the headline and a solid brand "Save $X" pill beside it. The card draws
 *     the saving only beside a struck figure, and never works one out:
 *     `packageSaving` (lib/package-listing) does, from the server's figures.
 *
 * `PackageCard` is this card with a package's words; reach for it first.
 *
 * AUTM-1866 (Don, 2026-10-14, after Mobbin: Fresha's plain rows; Careem,
 * Swiggy and foodpanda with the text left and the photo right; Wise's one line
 * plus one detail line). The customer's menu row is `layout="menu"`:
 *
 *   - Text left, a square-ish photo right. No photo, no placeholder: the text
 *     takes the full width (`fallback` and `noPhotoLabel` are not drawn).
 *   - The name (Satoshi 500), then ONE meta line: duration or working days,
 *     where (`locationLabel`: "At the workshop", "Comes to you"), and any
 *     chips, as plain text joined by a middle dot. No chip pills, no icons.
 *   - Two lines of description, clamped, with no More: the card itself opens
 *     the service (link mode, or `onOpen` for a sheet).
 *   - The all-in total as the headline, and `priceNote` on one small line
 *     under it ("incl. $0.99 booking fee", from `listingPrice().note`).
 *   - Book, a quiet pill under the photo, at least 44px. With `bookHref` or
 *     `onBook` it is a control of its own, a second focus target that the
 *     card's click never swallows.
 *
 * Under 16rem of card (200% text on a phone) the row reflows: the photo on
 * top at full width, the text under it, so the name is never crushed.
 *
 * Every other layout is unchanged, and so is every existing prop.
 */

export type ServiceCardLayout = "horizontal" | "vertical" | "adaptive" | "menu";

/** A chip on the meta row. `icon` should be a Solar glyph, decorative. */
export interface ServiceCardChip {
  label: ReactNode;
  icon?: ReactNode;
  testId?: string;
}

/** One line under the price headline, e.g. `{ label: "Service", value: "$80.00" }`. */
export interface ServiceCardPriceLine {
  label: ReactNode;
  value: ReactNode;
}

/**
 * The tones a catalogue status takes, the service editor's own (AUTM-1567):
 * `live` lime (Active), `draft` amber, `off` band (Inactive, paused).
 */
export type ServiceCardStatusTone = "live" | "draft" | "off";

/** A status pill on the photo's corner. The consumer words it, e.g. `{ label: "Draft", tone: "draft" }`. */
export interface ServiceCardStatus {
  label: string;
  tone: ServiceCardStatusTone;
}

const STATUS_BADGE: Record<ServiceCardStatusTone, "lime" | "amber" | "band"> = {
  live: "lime",
  draft: "amber",
  off: "band",
};

/** `data-testid`s for the parts E2E locates. Treat each as public API. */
export interface ServiceCardTestIds {
  /** The link (link mode) or the radio input (select mode). */
  action?: string;
  /** The status pill. */
  status?: string;
  /** The included names list. */
  includes?: string;
  /** The struck-through figure after the headline. */
  compareAtPrice?: string;
  /** The saving pill. */
  saving?: string;
  /** The price headline. */
  price?: string;
  /**
   * The list of price lines. Also lands on the `priceNote` line when no
   * `priceNote` id is given, so a locator keeps finding what sits under the
   * headline when a consumer moves from lines to the note.
   */
  priceLines?: string;
  /** The one line under the headline (`priceNote`). Defaults to `priceLines`. */
  priceNote?: string;
  /** The duration chip, or its part of the `menu` meta line. */
  duration?: string;
  /** The working-days chip, or its part of the `menu` meta line. */
  workingDays?: string;
  /** Where the service is done (`locationLabel`), on the meta line. */
  location?: string;
  /** The description's More / Less toggle. Never drawn by `layout="menu"`. */
  descriptionToggle?: string;
  /** The Book control (`bookHref` or `onBook`). */
  book?: string;
  /**
   * Select mode with `onOpen`: the name's open control. `action` stays on the
   * radio, so a locator that read the radio keeps finding it.
   */
  open?: string;
}

export interface ServiceCardProps {
  name: string;
  /** Heading element for the name. Default `h3`; use `h2` under a page `h1`. */
  nameAs?: "h2" | "h3" | "h4" | "p";
  /** Clamped at two lines, with More to expand in place when it runs longer. */
  description?: string | null;
  /** The headline price, pre-formatted, e.g. "$83.92". */
  priceLabel: string;
  /** Optional prefix before the headline, e.g. "From". */
  pricePrefix?: string;
  /**
   * Lines under the headline, e.g. Service and Booking fee. The consumer owns
   * the wording; pass nothing to show the headline alone.
   */
  priceLines?: ReadonlyArray<ServiceCardPriceLine> | null;
  /**
   * AUTM-1866: ONE small line under the headline, e.g. "incl. $0.99 booking
   * fee" (`listingPrice().note`). Drawn in place of `priceLines` when both
   * are passed. The consumer owns the words; the card adds none.
   */
  priceNote?: string | null;
  /** Pre-formatted duration, e.g. "45 min". Renders as a chip with a clock. */
  durationLabel?: string | null;
  /**
   * AUTM-1866: where the service is done, e.g. "At the workshop" or "Comes to
   * you" (`serviceLocationLabel`). Joins the meta line after the duration.
   */
  locationLabel?: string | null;
  /** Multi-day jobs, e.g. "3 working days". Renders as a chip with a calendar. */
  workingDaysLabel?: string | null;
  /** More chips after duration and working days, e.g. a drop-off tag. */
  chips?: ReadonlyArray<ServiceCardChip>;
  /** Optional hint like "+2 add-ons available", rendered as a chip. */
  addonsHint?: string | null;
  /** CDN URL for the photo, rendered in a plain <img>. Prefer `media` in Next. */
  coverImageUrl?: string | null;
  /**
   * The consumer's own image element (e.g. next/image with `fill`). Wins over
   * `coverImageUrl`. It is placed in a positioned 4:3 box.
   */
  media?: ReactNode;
  /** Replaces the designed no-photo panel. */
  fallback?: ReactNode;
  /** Decoration over the photo's top-left corner, e.g. a Badge. Drawn after `status`. */
  badge?: ReactNode;
  /**
   * A solid status pill on the photo's top-left corner, for a merchant's own
   * catalogue. Part of the card's accessible description.
   */
  status?: ServiceCardStatus | null;
  /**
   * Words on the designed no-photo panel, e.g. "No photo yet". Shown only
   * when there is no photo; part of the card's accessible description then.
   */
  noPhotoLabel?: string | null;
  /**
   * What the card includes, by name: a package's services. The first
   * `includesShown` are listed, then "+ N more". Full names stay in the DOM.
   */
  includes?: ReadonlyArray<string> | null;
  /** How many of `includes` are listed before "+ N more". Default 3. */
  includesShown?: number;
  /**
   * A higher figure the headline is measured against, struck through after
   * it: a package's services booked separately. Pre-formatted.
   */
  compareAtPriceLabel?: string | null;
  /**
   * Read before the struck figure, because screen readers do not announce a
   * strike-through. Default "Usually".
   */
  compareAtPriceDescription?: string;
  /**
   * A solid brand pill beside the price, e.g. "Save $52". Drawn only with
   * `compareAtPriceLabel`, so a saving never stands without what it is
   * measured against. Work it out with `packageSaving`, never by hand.
   */
  savingLabel?: string | null;
  /** Default `horizontal`. */
  layout?: ServiceCardLayout;

  /** Link mode: where the card goes. */
  href?: string;
  /** Link mode: the link component, e.g. Next's `Link`. Default `a`. */
  as?: ElementType;
  /**
   * The pill's words, e.g. "Book". Without `bookHref` or `onBook` it is a
   * picture of the card's own action (link or open mode): the whole card is
   * the target. With either, it is a control of its own. Default "Book" then.
   */
  actionLabel?: string;
  /** @deprecated use `actionLabel`. */
  trailingLabel?: string;

  /**
   * Open mode (AUTM-1866): the card is a button, e.g. to open the service's
   * detail in a sheet. `href` wins when both are passed. With `onSelect` (the
   * booking picker) the card opens and the radio's state light becomes a
   * control of its own, 44px, that chooses without opening.
   */
  onOpen?: () => void;
  /**
   * AUTM-1866: Book as its own control, a link (through `as`) separate from
   * the card's target. Its own focus stop, its own click; the card never
   * takes it. Named "Book <service>" for a screen reader.
   */
  bookHref?: string;
  /** AUTM-1866: Book as its own button. `bookHref` wins when both are passed. */
  onBook?: () => void;

  /** Select mode: called when the card is chosen. Passing it turns select mode on. */
  onSelect?: () => void;
  /** Whether this card is the chosen one. Paints the selected state in any mode. */
  selected?: boolean;
  /** Select mode: the radio group name. Cards sharing it form one group. */
  groupName?: string;
  /** Select mode: the radio value, e.g. the service id. */
  value?: string;

  /**
   * Staggered entrance: the card's position in its list. Fades and rises in
   * on the motion tokens, 40ms after the one before, capped at the eighth.
   * Nothing moves under reduced motion.
   */
  revealIndex?: number;

  /** `data-testid` on the card root. */
  testId?: string;
  testIds?: ServiceCardTestIds;
  className?: string;
}

type Mode = "link" | "button" | "select" | "static";

/* The grid, per layout. Four parts: the photo, the content (name and
 * description), the chips, and the foot (price, then the Book pill or the
 * radio).
 *
 *   vertical    a tile: photo over content over foot, the foot rowed to the
 *               bottom so tiles in one grid row line their prices up.
 *   horizontal  a row, shaped by the card's own width (container queries in
 *               rem, so they follow the reader's text size):
 *                 under 19rem   stacked like a tile. About 304px at default
 *                               text, so every phone keeps the row; 608px at
 *                               200% text, where a row would crush the name.
 *                 19 to 40rem   the photo beside the name and description;
 *                               chips and price run across the full width
 *                               under both, so there is no dead band under
 *                               the photo (a phone)
 *                 40rem up      photo, content, foot in three columns, the
 *                               price and the action on the right (a list on
 *                               a tablet or desktop)
 *   adaptive    the horizontal row on a phone, the vertical tile from 640px.
 *               Its classes are the horizontal ones behind `max-sm:`.
 *
 * In the 19 to 40rem band the content wrapper is `display: contents`, so the
 * name, the description and the chips are grid cells of their own. Every
 * class is written out in full, never built from a prefix, because the
 * consumer's Tailwind finds classes by scanning this file's output.
 *
 * Unprefixed classes are the stacked tile, which is what vertical, a narrow
 * horizontal card and adaptive from 640px all share.
 *
 * Only a tile fills its cell's height (`h-full`, the foot on the last row),
 * because tiles share grid rows and their prices should line up. A row takes
 * its own height: stretched beside a taller tile, its rows would spread apart
 * and open gaps between the name and the description.
 *
 *   menu        (AUTM-1866) the customer's menu row, text left and photo
 *               right. Under 16rem of card it is a column: the photo on top,
 *               the text, then the foot pushed to the bottom (`mt-auto`). From
 *               16rem it is a two-column grid: the text and the photo on the
 *               first row, the foot on the second, which is a subgrid so the
 *               Book pill takes exactly the photo's column. 16rem is about
 *               256px at default text, so every phone from 320px keeps the
 *               row; at 150% and 200% text a phone gets the column. The menu
 *               fills its cell's height, so a grid of rows lines up its
 *               prices and pills. */
const ROW: Record<ServiceCardLayout, string> = {
  vertical: "grid h-full grid-cols-1 grid-rows-[auto_1fr_auto] gap-3",
  horizontal:
    "grid grid-cols-1 gap-3 @min-[19rem]:grid-cols-[auto_minmax(0,1fr)] @min-[19rem]:gap-x-3 @min-[19rem]:gap-y-2 @min-[40rem]:grid-cols-[auto_minmax(0,1fr)_auto]",
  adaptive:
    "grid grid-cols-1 gap-3 sm:h-full sm:grid-rows-[auto_1fr_auto] max-sm:@min-[19rem]:grid-cols-[auto_minmax(0,1fr)] max-sm:@min-[19rem]:gap-x-3 max-sm:@min-[19rem]:gap-y-2",
  menu: "flex h-full flex-col gap-3 @min-[16rem]:grid @min-[16rem]:grid-cols-[minmax(0,1fr)_auto] @min-[16rem]:grid-rows-[1fr_auto] @min-[16rem]:gap-x-4",
};

/* The photo box. The 4:3 tile everywhere but the menu row, whose photo is a
 * square at 30% of the card (container units, so it follows the card, not the
 * text size, and the text column keeps its share at 200%), at most 8.5rem. */
const MEDIA_BOX: Record<ServiceCardLayout, string> = {
  vertical: "aspect-[4/3] w-full",
  horizontal:
    "aspect-[4/3] w-full @min-[19rem]:w-32 @min-[19rem]:self-start @min-[30rem]:w-40 @min-[44rem]:w-48 @min-[19rem]:@max-[40rem]:row-span-2",
  adaptive:
    "aspect-[4/3] w-full max-sm:@min-[19rem]:w-32 max-sm:@min-[19rem]:self-start max-sm:@min-[19rem]:row-span-2",
  menu: "aspect-[16/9] w-full @min-[16rem]:col-start-2 @min-[16rem]:row-start-1 @min-[16rem]:aspect-square @min-[16rem]:w-[min(30cqi,8.5rem)] @min-[16rem]:self-start @min-[16rem]:justify-self-end",
};

const CONTENT: Record<ServiceCardLayout, string> = {
  vertical: "px-1.5",
  horizontal: "px-1.5 @min-[19rem]:@max-[40rem]:contents @min-[40rem]:py-1 @min-[40rem]:pl-0",
  adaptive: "px-1.5 max-sm:@min-[19rem]:contents",
  menu: "gap-1 px-1.5 pt-1 @min-[16rem]:col-start-1 @min-[16rem]:row-start-1 @min-[16rem]:pr-0",
};

/* The menu row's text with no photo beside it: across both columns. */
const MENU_CONTENT_FULL = "@min-[16rem]:col-span-2 @min-[16rem]:pr-1.5";

const NAME: Record<ServiceCardLayout, string> = {
  vertical: "",
  horizontal:
    "@min-[19rem]:@max-[40rem]:col-start-2 @min-[19rem]:@max-[40rem]:pt-1 @min-[19rem]:@max-[40rem]:pr-1.5",
  adaptive: "max-sm:@min-[19rem]:col-start-2 max-sm:@min-[19rem]:pt-1 max-sm:@min-[19rem]:pr-1.5",
  menu: "",
};

const DESC: Record<ServiceCardLayout, string> = {
  vertical: "",
  horizontal: "@min-[19rem]:@max-[40rem]:col-start-2 @min-[19rem]:@max-[40rem]:pr-1.5",
  adaptive: "max-sm:@min-[19rem]:col-start-2 max-sm:@min-[19rem]:pr-1.5",
  menu: "",
};

const CHIPS: Record<ServiceCardLayout, string> = {
  vertical: "",
  horizontal: "@min-[19rem]:@max-[40rem]:col-span-2 @min-[19rem]:@max-[40rem]:px-1.5",
  adaptive: "max-sm:@min-[19rem]:col-span-2 max-sm:@min-[19rem]:px-1.5",
  menu: "",
};

/* The menu's foot: the price in the text column, the action in the photo's
 * column (a subgrid), so Book sits under the photo at its width. No bottom or
 * right pad: the pill is inset by the card's own padding, as the photo is. */
const FOOT: Record<ServiceCardLayout, string> = {
  vertical: "px-1.5 pb-1.5",
  horizontal:
    "px-1.5 pb-1.5 @min-[19rem]:@max-[40rem]:col-span-2 @min-[40rem]:flex-col @min-[40rem]:items-end @min-[40rem]:pl-0 @min-[40rem]:pt-1 @min-[40rem]:text-right",
  adaptive: "px-1.5 pb-1.5 max-sm:@min-[19rem]:col-span-2",
  menu: "mt-auto items-center pl-1.5 @min-[16rem]:col-span-2 @min-[16rem]:row-start-2 @min-[16rem]:mt-0 @min-[16rem]:grid @min-[16rem]:grid-cols-subgrid @min-[16rem]:gap-x-4",
};

/* The price row (headline, struck figure, saving) when a deal is drawn. It
 * follows the foot's own alignment: right-aligned only where the foot is the
 * right-hand column of a wide horizontal row. */
const DEAL_ROW: Record<ServiceCardLayout, string> = {
  vertical: "",
  horizontal: "@min-[40rem]:justify-end",
  adaptive: "",
  menu: "",
};

/* With both a description and an included list, the photo of a 19 to 40rem
 * row spans three rows (name, description, list), not two, so no empty cell
 * opens under it. */
const MEDIA_SPAN_THREE: Record<ServiceCardLayout, string> = {
  vertical: "",
  horizontal: "@min-[19rem]:@max-[40rem]:row-span-3",
  adaptive: "max-sm:@min-[19rem]:row-span-3",
  menu: "",
};

/* The name's type, on the element inside the heading (see the note there).
 * The menu row sets it in Satoshi 500 (AUTM-1866); the price carries the
 * row's weight. */
const NAME_TEXT = "block text-base font-bold leading-snug tracking-normal [overflow-wrap:anywhere]";
const NAME_TEXT_MENU = "block text-base font-medium leading-snug tracking-normal [overflow-wrap:anywhere]";

/* AUTM-1866: the Book pill. Don, 2026-10-14, revised ("Book should stand
 * out"): a SOLID brand purple pill with a white label and a small trailing
 * arrow, at Button's 44px size. The fill is `--accent-fill` under
 * `--on-accent`, the fill-grade pair that holds 4.5:1 in both themes (9.6:1);
 * `--accent` is text grade and lifts to lavender in dark, where a white label
 * would measure under 2:1. Never lime: lime stays the page's one primary.
 * `relative z-[2]` lifts a real control above the card's stretched hit area,
 * as More is lifted. The drawn-only pill (no `bookHref`/`onBook`) darkens with
 * the card's hover, because the card is its target; a real Book darkens with
 * its own. */
const BOOK_PILL =
  "min-h-11 gap-1.5 bg-[var(--accent-fill)] text-[var(--on-accent)] not-disabled:hover:bg-[var(--accent-fill-hover)]";
const BOOK_PILL_DRAWN = "group-hover/service:bg-[var(--accent-fill-hover)]";
const BOOK_PILL_SELECTED = "min-h-11 bg-[var(--on-selected)] text-[var(--selected)]";

/* The stretched hit area: the link or label's ::after covers the card. It
 * covers the card only while the card root is its containing block, so every
 * element between the two stays unpositioned and untransformed.
 *
 * AUTM-1786: a press on the photo opened nothing on qa.autara.au, because
 * customer-web scales every `a[href]` to 98.5% while it is pressed, and a
 * scaled element is the containing block of its own ::after: mid-press the hit
 * area shrank from the card to the name, the release landed on the photo, and
 * the browser sent the click to a plain element. So:
 *
 *   - The link or label itself is pinned with `!` (an important declaration
 *     in a layer beats a consumer's unlayered rule): static, and no
 *     transform, scale, translate or rotate. The card presses as a whole;
 *     its name does not press on its own.
 *   - The card's own press shrinks it to 98.5%, the ::after with it, so a
 *     press held at the very edge would end just outside. While pressed, the
 *     ::after reaches out by exactly what the press takes in, (1 - 1/0.985)/2
 *     of each side (about 0.76%), so even fully pressed it covers every point
 *     of the card at rest. Only while pressed, so a card flush with a
 *     viewport edge never scrolls sideways by a few invisible pixels. Change
 *     the two numbers together.
 *
 * `forwardStrayClick` below is the backstop for anything else that confines
 * the ::after. ServiceCard.browser.test.tsx holds all three in a real browser;
 * jsdom cannot hit-test. */
const HIT =
  "cursor-pointer outline-none static! transform-none! scale-none! translate-none! rotate-none! after:absolute after:inset-0 motion-safe:active:after:inset-[calc((1_-_1/0.985)*50%)] after:z-[1] after:rounded-[1.5rem] after:content-['']";

/* Controls in the card that own their clicks: the link, the label and the
 * radio, More, and anything interactive a consumer puts in a slot. */
const OWNS_CLICK = 'a[href], button, input, label, select, textarea, summary, [role="button"], [role="link"]';

/**
 * AUTM-1786, the backstop: a click that lands anywhere on the card but on
 * none of its controls is the card's, so it goes to the link or the label.
 *
 * The browser sends a click to the element the press both began and ended on,
 * or to their nearest common ancestor. When the stretched ::after is confined
 * by CSS this component cannot see (a consumer that positions or transforms
 * the heading, say), a press on the photo begins or ends on the photo, the
 * click lands on a plain element of the card, and nothing opens. Here it
 * still does. A link gets a click carrying the same modifier keys, so the
 * consumer's link component (Next's Link reads them) sees the press it was
 * given; a label is clicked, which selects its radio.
 *
 * Never for a click a control already took (no second navigation), nor after
 * a text selection inside the card.
 */
function forwardStrayClick(event: ReactMouseEvent<HTMLDivElement>) {
  const card = event.currentTarget;
  const hit = card.querySelector<HTMLElement>("[data-hit]");
  if (!hit || event.defaultPrevented) return;
  // By node type, not `instanceof Element`, which fails across documents.
  const target = event.target as Node;
  const el = target.nodeType === 1 ? (target as Element) : target.parentElement;
  const owner = el ? el.closest(OWNS_CLICK) : null;
  if (owner && card.contains(owner)) return;
  const selection = card.ownerDocument.getSelection();
  if (selection && !selection.isCollapsed && card.contains(selection.anchorNode)) return;
  // A label selects its radio; a button (open mode) opens. Neither needs the
  // pointer's coordinates or modifiers.
  if (hit.tagName === "LABEL" || hit.tagName === "BUTTON") {
    hit.click();
    return;
  }
  // The card's own window, not the global one, so this holds in an iframe.
  const view = card.ownerDocument.defaultView;
  if (!view) return;
  hit.dispatchEvent(
    new view.MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      detail: event.detail,
      screenX: event.screenX,
      screenY: event.screenY,
      clientX: event.clientX,
      clientY: event.clientY,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      button: event.button,
      buttons: event.buttons,
    }),
  );
}

export const ServiceCard = forwardRef<HTMLElement, ServiceCardProps>(
  function ServiceCard(
    {
      name,
      nameAs = "h3",
      description,
      priceLabel,
      pricePrefix,
      priceLines,
      priceNote,
      durationLabel,
      locationLabel,
      workingDaysLabel,
      chips,
      addonsHint,
      coverImageUrl,
      media,
      fallback,
      badge,
      status,
      noPhotoLabel,
      includes,
      includesShown = 3,
      compareAtPriceLabel,
      compareAtPriceDescription = "Usually",
      savingLabel,
      layout = "horizontal",
      href,
      as,
      actionLabel,
      trailingLabel,
      onOpen,
      bookHref,
      onBook,
      onSelect,
      selected = false,
      groupName,
      value,
      revealIndex,
      testId,
      testIds,
      className,
    },
    ref,
  ) {
    const mode: Mode = onSelect ? "select" : href ? "link" : onOpen ? "button" : "static";
    const interactive = mode !== "static";
    const isMenu = layout === "menu";
    const hasBook = Boolean(bookHref) || Boolean(onBook);
    // The picker's card that opens the service: the name opens, the state
    // light chooses (AUTM-1866).
    const selectOpens = mode === "select" && Boolean(onOpen);
    const hasOwnTarget = hasBook || selectOpens;
    const uid = useId();
    const nameId = `${uid}-name`;
    const metaId = `${uid}-meta`;
    const priceId = `${uid}-price`;
    const descId = `${uid}-desc`;
    const inputId = `${uid}-input`;
    const statusId = `${uid}-status`;
    const includesId = `${uid}-includes`;
    const noPhotoId = `${uid}-no-photo`;

    // Which URL failed, rather than a flag: a new URL gets its own chance to
    // load without an effect to reset anything.
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    const imageFailed = Boolean(coverImageUrl) && failedUrl === coverImageUrl;
    const hasPhoto = Boolean(media) || (Boolean(coverImageUrl) && !imageFailed);
    // The menu row draws no placeholder at all (AUTM-1866): no photo, no box.
    const drawsMedia = !isMenu || hasPhoto;
    const showsNoPhoto = !isMenu && !media && !fallback && (!coverImageUrl || imageFailed);
    const hasNoPhotoLabel = showsNoPhoto && Boolean(noPhotoLabel);

    const included = includes ? includes.filter((n) => n.trim().length > 0) : [];
    const shownCount = Math.max(1, Math.floor(includesShown));
    const includedShown = included.slice(0, shownCount);
    const includedMore = included.length - includedShown.length;
    // A saving never stands alone: no struck figure, no pill.
    const showSaving = Boolean(compareAtPriceLabel) && Boolean(savingLabel);
    const hasDeal = Boolean(compareAtPriceLabel);

    const allChips: ServiceCardChip[] = [];
    if (workingDaysLabel) {
      allChips.push({ label: workingDaysLabel, icon: <CalendarIcon />, testId: testIds?.workingDays });
    }
    if (durationLabel) {
      allChips.push({ label: durationLabel, icon: <ClockIcon />, testId: testIds?.duration });
    }
    if (locationLabel) {
      allChips.push({ label: locationLabel, icon: <PinIcon />, testId: testIds?.location });
    }
    if (chips) allChips.push(...chips);
    if (addonsHint) allChips.push({ label: addonsHint, icon: <PlusIcon /> });

    const describedBy = [
      status ? statusId : null,
      hasNoPhotoLabel ? noPhotoId : null,
      included.length > 0 ? includesId : null,
      allChips.length > 0 ? metaId : null,
      priceId,
    ]
      .filter(Boolean)
      .join(" ");

    const Heading = nameAs as ElementType;
    const LinkComp = (as ?? "a") as ElementType;
    const action = actionLabel ?? trailingLabel;
    const bookLabel = action ?? "Book";
    const nameInk = selected ? "text-[var(--on-selected)]" : "text-[var(--text-strong)]";
    const nameText = cn(isMenu ? NAME_TEXT_MENU : NAME_TEXT, nameInk);
    const muted = selected ? "text-[var(--on-selected)]" : "text-[var(--text-muted)]";
    const hasPriceLines = !priceNote && Boolean(priceLines && priceLines.length > 0);
    const hasUnderPrice = Boolean(priceNote) || hasPriceLines;

    /* The status pill and the consumer badge sit on the photo's corner. A menu
       row with no photo has no corner, so they lead the text instead. */
    const corner =
      status || badge ? (
        <>
          {status ? (
            <Badge
              id={statusId}
              variant={STATUS_BADGE[status.tone]}
              data-slot="status"
              data-tone={status.tone}
              data-testid={testIds?.status}
            >
              {status.label}
              {/* A full stop the eye never sees, so the description
                  reads "Draft. 45 min" rather than "Draft 45 min". */}
              <span className="sr-only">.</span>
            </Badge>
          ) : null}
          {badge ? <div className="flex">{badge}</div> : null}
        </>
      ) : null;

    let mediaContent: ReactNode;
    if (media) {
      mediaContent = media;
    } else if (coverImageUrl && !imageFailed) {
      mediaContent = (
        <img
          src={coverImageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(coverImageUrl)}
          className="h-full w-full object-cover"
        />
      );
    } else {
      mediaContent = fallback ?? (
        <NoPhotoPanel
          figure={workingDaysLabel ?? durationLabel}
          multiDay={Boolean(workingDaysLabel)}
          label={noPhotoLabel}
          labelId={noPhotoId}
          // A badge alone keeps the old panel, so existing consumers render as before.
          cornerTaken={Boolean(status) || (Boolean(badge) && Boolean(noPhotoLabel))}
        />
      );
    }

    const style =
      revealIndex != null
        ? ({ "--service-card-index": Math.max(0, Math.floor(revealIndex)) } as CSSProperties)
        : undefined;

    /* The foot's right-hand parts: the radio's state light, or the picture of
       the card's own action, then Book when it is a control of its own. */
    const actionParts: ReactNode[] = [];
    if (mode === "select") {
      const light = (
        <span
          aria-hidden="true"
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-full transition-colors duration-[var(--motion-panel-in)]",
            selected
              ? "bg-[var(--on-selected)] text-[var(--selected)]"
              : "border-2 border-[var(--field-edge)] bg-[var(--paper)]",
            // The radio's own ring, when the card opens and the light chooses.
            selectOpens &&
              "group-has-[[data-slot=choice]:focus-visible]/service:outline-2 group-has-[[data-slot=choice]:focus-visible]/service:outline-offset-2 group-has-[[data-slot=choice]:focus-visible]/service:outline-[var(--accent)]",
          )}
        >
          {selected ? <CheckIcon /> : null}
        </span>
      );
      actionParts.push(
        selectOpens ? (
          /* AUTM-1866: the card opens the service, so choosing needs a target
             of its own: the radio's label, 44px around the 24px light, above
             the stretched hit area. It names the radio (sr-only), so the
             radio is still "Interior steam clean, radio". */
          <label
            key="indicator"
            htmlFor={inputId}
            data-own=""
            data-slot="choice-target"
            className="relative z-[2] -m-2.5 grid size-11 shrink-0 cursor-pointer place-items-center rounded-full"
          >
            <span className="sr-only">{name}</span>
            {light}
          </label>
        ) : (
          <Fragment key="indicator">{light}</Fragment>
        ),
      );
    } else if ((mode === "link" || mode === "button") && action && !hasBook) {
      actionParts.push(
        isMenu ? (
          /* AUTM-1866: the same quiet pill as a real Book, drawn only. The
             card is the target, so it changes with the card's hover. */
          <span
            key="pill"
            aria-hidden="true"
            data-slot="action-pill"
            className={cn(
              buttonVariants({ variant: "quiet", size: "sm", press: false }),
              "cursor-pointer",
              selected ? BOOK_PILL_SELECTED : cn(BOOK_PILL, BOOK_PILL_DRAWN),
              hasPhoto && "@min-[16rem]:flex-1",
            )}
          >
            {action}
            <ArrowRightIcon />
          </span>
        ) : (
          /* AUTM-1838 (Don, 2026-10-12: no black buttons, the rest are
             quiet): a list repeats this pill on every card, so it is the
             quiet secondary, raised on the band card. The page's one lime
             action lives outside the list. */
          <span
            key="pill"
            aria-hidden="true"
            className="inline-flex min-h-9 shrink-0 items-center rounded-[1.125rem] bg-[var(--raised)] px-4 text-[0.9375rem] font-medium leading-tight text-[var(--text-strong)] transition-colors duration-[var(--motion-panel-in)]"
          >
            {action}
          </span>
        ),
      );
    }
    if (hasBook) {
      /* AUTM-1866: Book is its own control. A second focus stop with its own
         ring, named "Book <service>" and described by the price; above the
         stretched hit area, and an `a[href]` or a `button`, so the card's
         stray-click forwarding leaves its click alone. */
      const bookClass = cn(
        buttonVariants({ variant: "quiet", size: "sm" }),
        "relative z-[2]",
        selected ? BOOK_PILL_SELECTED : BOOK_PILL,
        isMenu && hasPhoto && "@min-[16rem]:flex-1",
      );
      const bookText = (
        <>
          {bookLabel}
          <ArrowRightIcon />
          <span className="sr-only"> {name}</span>
        </>
      );
      actionParts.push(
        bookHref ? (
          <LinkComp
            key="book"
            href={bookHref}
            aria-describedby={priceId}
            data-slot="book"
            data-own=""
            data-testid={testIds?.book}
            className={bookClass}
          >
            {bookText}
          </LinkComp>
        ) : (
          <button
            key="book"
            type="button"
            onClick={() => onBook?.()}
            aria-describedby={priceId}
            data-slot="book"
            data-own=""
            data-testid={testIds?.book}
            className={bookClass}
          >
            {bookText}
          </button>
        ),
      );
    }

    return (
      <div
        ref={ref as Ref<HTMLDivElement>}
        data-slot="service-card"
        data-layout={layout}
        data-mode={mode}
        data-selected={selected || undefined}
        data-testid={testId}
        style={style}
        onClick={interactive ? forwardStrayClick : undefined}
        className={cn(
          "group/service relative flex h-full flex-col rounded-[1.5rem] p-2.5 text-left @container",
          "transition-[background-color,scale] duration-[var(--motion-panel-in)] ease-[var(--motion-ease-out)]",
          // The focus ring is the card's, drawn when its own control (the
          // link or the radio) is keyboard-focused, never for the More toggle,
          // which draws its own.
          "has-[[data-slot=action]:focus-visible]:outline-2 has-[[data-slot=action]:focus-visible]:outline-offset-2 has-[[data-slot=action]:focus-visible]:outline-[var(--accent)]",
          selected
            ? "bg-[var(--selected)] text-[var(--on-selected)]"
            : "bg-[var(--band)] text-[var(--text-strong)]",
          // A pointer on Book is Book's (AUTM-1866): the card does not light
          // up as if the press would open it.
          interactive &&
            !selected &&
            (hasOwnTarget
              ? "[&:hover:not(:has([data-own]:hover))]:bg-[var(--band-press)]"
              : "hover:bg-[var(--band-press)]"),
          interactive && "cursor-pointer motion-safe:has-[[data-hit]:active]:scale-[0.985]",
          revealIndex != null && 'service-card-reveal',
          className,
        )}
      >
        {mode === "select" ? (
          <input
            id={inputId}
            type="radio"
            name={groupName ?? uid}
            value={value ?? name}
            checked={selected}
            onChange={() => onSelect?.()}
            aria-describedby={describedBy}
            data-slot={selectOpens ? "choice" : "action"}
            data-testid={testIds?.action}
            className="sr-only"
          />
        ) : null}

        <div className={ROW[layout]}>
          {drawsMedia ? (
            <div
              data-slot="media"
              className={cn(
                "relative overflow-hidden rounded-2xl bg-[var(--paper)] @container/media",
                MEDIA_BOX[layout],
                description && included.length > 0 && MEDIA_SPAN_THREE[layout],
              )}
            >
              <div
                className={cn(
                  "absolute inset-0",
                  interactive &&
                    "transition-[scale] duration-[var(--motion-sheet-in)] ease-[var(--motion-ease-out)] motion-safe:group-hover/service:scale-[1.04]",
                )}
              >
                {mediaContent}
              </div>
              {status ? (
                <div className="absolute left-2 right-2 top-2 flex flex-wrap items-start gap-1.5">{corner}</div>
              ) : badge ? (
                <div className="absolute left-2 top-2 flex">{badge}</div>
              ) : null}
            </div>
          ) : null}

          <div className={cn("flex min-w-0 flex-col gap-2", CONTENT[layout], isMenu && !hasPhoto && MENU_CONTENT_FULL)}>
            {!drawsMedia && corner ? (
              <div className="mb-1 flex flex-wrap items-start gap-1.5">{corner}</div>
            ) : null}
            {/* The heading carries placement only. Its type and colour sit on
                the element inside it, because merchant-mobile and customer-web
                both style h1 to h6 with an UNLAYERED rule (colour
                --text-strong, line-height 1.1, -0.02em), and unlayered CSS
                beats every Tailwind utility on the same element. A class on
                the heading would lose, and the name on a selected card would
                be ink on deep purple. */}
            <Heading id={nameId} className={NAME[layout]}>
              {mode === "link" ? (
                <LinkComp
                  href={href}
                  aria-describedby={describedBy}
                  data-slot="action"
                  data-hit=""
                  data-testid={testIds?.action}
                  className={cn(HIT, nameText)}
                >
                  {name}
                </LinkComp>
              ) : mode === "button" ? (
                <button
                  type="button"
                  onClick={() => onOpen?.()}
                  aria-describedby={describedBy}
                  data-slot="action"
                  data-hit=""
                  data-testid={testIds?.action}
                  className={cn(HIT, nameText, "w-full text-start")}
                >
                  {name}
                </button>
              ) : mode === "select" && selectOpens ? (
                <button
                  type="button"
                  onClick={() => onOpen?.()}
                  aria-describedby={describedBy}
                  data-slot="action"
                  data-hit=""
                  data-testid={testIds?.open}
                  className={cn(HIT, nameText, "w-full text-start")}
                >
                  {name}
                </button>
              ) : mode === "select" ? (
                <label htmlFor={inputId} data-hit="" className={cn(HIT, nameText)}>
                  {name}
                </label>
              ) : (
                <span className={nameText}>{name}</span>
              )}
            </Heading>

            {isMenu && allChips.length > 0 ? (
              /* AUTM-1866: ONE meta line, as Wise writes a detail line:
                 "15 min · At the workshop". Plain text and a visible middle
                 dot, which a screen reader takes as a pause; each part keeps
                 its own test id, so its text is exactly its label. No chip
                 pills and no icons: a chip's `icon` is not drawn here. */
              <p
                id={metaId}
                data-slot="meta"
                className={cn("text-sm leading-snug [overflow-wrap:anywhere]", muted)}
              >
                {allChips.map((chip, i) => (
                  <Fragment key={i}>
                    {i > 0 ? " · " : null}
                    <span data-testid={chip.testId}>{chip.label}</span>
                  </Fragment>
                ))}
              </p>
            ) : null}

            {description ? (
              isMenu ? (
                /* Two lines, clamped, and no More (AUTM-1866): the card opens
                   the service, where the rest is read. The full text stays in
                   the DOM for a screen reader. */
                <p
                  id={descId}
                  data-slot="description"
                  className={cn("mt-0.5 line-clamp-2 text-sm leading-normal [overflow-wrap:anywhere]", muted)}
                >
                  {description}
                </p>
              ) : (
                <Description
                  id={descId}
                  className={DESC[layout]}
                  text={description}
                  name={name}
                  selected={selected}
                  toggleTestId={testIds?.descriptionToggle}
                />
              )
            ) : null}

            {included.length > 0 ? (
              /* What the package holds, one name a line with a check, cut to
                 one line each so a long name never pushes the price out of
                 line with the next tile's; the full name stays in the DOM for
                 a screen reader. "Includes" is said, not drawn: the checks
                 say it to the eye. */
              <div id={includesId} data-testid={testIds?.includes} className={cn("min-w-0", DESC[layout])}>
                <span className="sr-only">Includes </span>
                <ul className="flex flex-col gap-1">
                  {includedShown.map((name, i) => (
                    <li
                      key={`${i}-${name}`}
                      className={cn(
                        "flex min-w-0 items-center gap-1.5 text-sm leading-snug",
                        selected ? "text-[var(--on-selected)]" : "text-[var(--text-strong)]",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex shrink-0",
                          selected ? "text-[var(--on-selected)]" : "text-[var(--text-muted)]",
                        )}
                      >
                        <CheckIcon small />
                      </span>
                      <span className="min-w-0 truncate">{name}</span>
                      {i < includedShown.length - 1 || includedMore > 0 ? <span className="sr-only">, </span> : null}
                    </li>
                  ))}
                  {includedMore > 0 ? (
                    <li
                      className={cn(
                        "pl-5 text-sm font-medium leading-snug",
                        selected ? "text-[var(--on-selected)]" : "text-[var(--text-muted)]",
                      )}
                    >
                      + {includedMore} more
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}

            {!isMenu && allChips.length > 0 ? (
              <div id={metaId} className={cn("flex flex-wrap content-start gap-1.5", CHIPS[layout])}>
                {allChips.map((chip, i) => (
                  <Fragment key={i}>
                    {/* The separator is text, hidden from sight: a screen
                        reader pauses between chips, and the row's text reads
                        "3 working days · Drop off at the workshop", the way
                        the product writes it in prose. It sits between the
                        chips, never inside one, so each chip's own text is
                        exactly its label. */}
                    {i > 0 ? <span className="sr-only"> · </span> : null}
                    <span
                      data-testid={chip.testId}
                      className="inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-full bg-[var(--raised)] px-2.5 py-0.5 text-[0.8125rem] font-medium leading-tight text-[var(--text-strong)] [overflow-wrap:anywhere]"
                    >
                      {chip.icon ? (
                        <span aria-hidden="true" className="flex shrink-0 text-[var(--text-muted)]">
                          {chip.icon}
                        </span>
                      ) : null}
                      {chip.label}
                    </span>
                  </Fragment>
                ))}
              </div>
            ) : null}
          </div>

          <div className={cn("flex flex-wrap items-end justify-between gap-x-3 gap-y-2", FOOT[layout])}>
            <div id={priceId} className="min-w-0">
              {hasDeal ? (
                /* AUTM-1812: the deal reads left to right as the eye does the
                   sum. The price large, what the parts cost separately struck
                   through beside it, the saving as a solid brand pill. One
                   wrapping row, so at 200% text the pill drops under the
                   figures rather than squeezing them. */
                <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1.5", DEAL_ROW[layout])}>
                  <p className="text-xl font-bold leading-tight tabular-nums">
                    {pricePrefix ? (
                      <span
                        className={cn(
                          "mr-1 text-sm font-medium",
                          selected ? "text-[var(--on-selected)]" : "text-[var(--text-muted)]",
                        )}
                      >
                        {pricePrefix}
                      </span>
                    ) : null}
                    <span data-testid={testIds?.price}>{priceLabel}</span>
                    <span className="sr-only">, </span>
                  </p>
                  <p
                    className={cn(
                      "text-[0.9375rem] font-medium leading-tight tabular-nums",
                      selected ? "text-[var(--on-selected)]" : "text-[var(--text-muted)]",
                    )}
                  >
                    <span className="sr-only">{compareAtPriceDescription} </span>
                    <s data-slot="compare-at" data-testid={testIds?.compareAtPrice}>
                      {compareAtPriceLabel}
                    </s>
                    {showSaving || hasUnderPrice ? <span className="sr-only">, </span> : null}
                  </p>
                  {showSaving ? (
                    <Badge variant="brand" data-slot="saving" data-testid={testIds?.saving}>
                      {savingLabel}
                    </Badge>
                  ) : null}
                </div>
              ) : (
                /* The menu row's total is the size of the name, in bold: it
                   leads the foot without shouting over the service. */
                <p className={isMenu ? "text-base font-bold leading-tight tabular-nums" : "text-lg font-bold leading-tight tabular-nums"}>
                  {pricePrefix ? (
                    <span
                      className={cn(
                        "mr-1 text-sm font-medium",
                        selected ? "text-[var(--on-selected)]" : "text-[var(--text-muted)]",
                      )}
                    >
                      {pricePrefix}
                    </span>
                  ) : null}
                  <span data-testid={testIds?.price}>{priceLabel}</span>
                  {hasUnderPrice ? <span className="sr-only">, </span> : null}
                </p>
              )}
              {priceNote ? (
                /* AUTM-1866: ONE small line under the all-in total, e.g.
                   "incl. $0.99 booking fee". The total stays the prominent
                   figure (Australian Consumer Law s48, AUTM-1320). It takes
                   the price-lines test id unless it has its own, so a locator
                   that read the lines still finds what sits under the total. */
                <p
                  data-slot="price-note"
                  data-testid={testIds?.priceNote ?? testIds?.priceLines}
                  className={cn("mt-0.5 text-[0.8125rem] leading-snug tabular-nums", muted)}
                >
                  {priceNote}
                </p>
              ) : hasPriceLines && priceLines ? (
                /* One line per part, stacked under the total. The spaces
                   are real text, so the block reads as one sentence to a
                   screen reader and to a test: "Service $80 + booking fee
                   $3.92" when the consumer words its lines that way. */
                <p
                  data-testid={testIds?.priceLines}
                  className={cn(
                    "mt-1 text-[0.8125rem] leading-snug tabular-nums",
                    selected ? "text-[var(--on-selected)]" : "text-[var(--text-muted)]",
                  )}
                >
                  {priceLines.map((line, i) => (
                    <Fragment key={i}>
                      {i > 0 ? " " : null}
                      <span className="block">
                        {line.label} {line.value}
                      </span>
                    </Fragment>
                  ))}
                </p>
              ) : null}
            </div>

            {isMenu ? (
              actionParts.length > 0 ? (
                /* The photo's column of the foot's subgrid: Book sits under
                   the photo, at its width. */
                <div className="flex min-w-0 items-center justify-end gap-2 @min-[16rem]:col-start-2">
                  {actionParts}
                </div>
              ) : null
            ) : (
              actionParts
            )}
          </div>
        </div>
      </div>
    );
  },
);

/**
 * Two lines, then More. The toggle only appears when the text is actually cut,
 * measured rather than guessed from its length, and it sits above the card's
 * stretched hit area so it never books or selects. The full text is always in
 * the DOM, so a screen reader reads all of it either way.
 *
 * AUTM-1848: the measurement can only run in the browser, after hydration, so
 * the server never draws More. While collapsed it therefore takes no room of
 * its own: it sits over the end of the second line, which fades out under it
 * (a mask, so it works on any card colour, selected, hovered or dark), and
 * the card's box is the same before and after the script decides. It joins
 * the flow below the text only once the reader opens it, as "Less", and a
 * shift the reader caused is not a layout shift. Before this, More appeared
 * as its own row after hydration and moved the price down (CLS on every /m
 * with a long description).
 */
function Description({
  id,
  className,
  text,
  name,
  selected,
  toggleTestId,
}: {
  id: string;
  className?: string;
  text: string;
  name: string;
  selected: boolean;
  toggleTestId?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    const measure = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded]);

  const overlaid = clamped && !expanded;

  return (
    // The outer box is the layout's cell, which a row layout stretches to the
    // photo's height; the inner one hugs the text, so "the second line's end"
    // is the paragraph's corner and not the cell's.
    <div className={className}>
      <div className="relative flex flex-col items-start gap-1">
        <p
          ref={ref}
          id={id}
          data-clamped={overlaid || undefined}
          style={overlaid ? MORE_FADE : undefined}
          className={cn(
            "text-sm leading-normal [overflow-wrap:anywhere]",
            !expanded && "line-clamp-2",
            selected ? "text-[var(--on-selected)]" : "text-[var(--text-muted)]",
          )}
        >
          {text}
        </p>
        {clamped || expanded ? (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={id}
            data-testid={toggleTestId}
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              "z-[2] cursor-pointer rounded-md text-sm font-medium leading-normal underline underline-offset-4",
              // Collapsed, on the second line's end (see above); open, in the
              // flow under the whole text.
              overlaid ? "absolute bottom-0 end-0" : "relative",
              // A 44px hit area around a one-line label, without adding the
              // height to the card.
              "before:absolute before:left-1/2 before:top-1/2 before:h-11 before:w-full before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
              selected ? "text-[var(--on-selected)]" : "text-[var(--accent)]",
            )}
          >
            {expanded ? "Less" : "More"}
            <span className="sr-only"> about {name}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* The clamped paragraph's second line fades out where More sits over it:
 * every line but the last fully drawn, the last clear for the label's width
 * (about 2.4em of "More" at text-sm medium, plus room) and soft before it.
 * A mask rather than a scrim, so no colour has to match the card's. Paint
 * only, never layout. */
const MORE_FADE_IMAGE = "linear-gradient(#000, #000), linear-gradient(to left, transparent 3.25em, #000 5em)";
const MORE_FADE_SIZE = "100% calc(100% - 1lh), 100% 1lh";
const MORE_FADE_POSITION = "0 0, 0 100%";
const MORE_FADE: CSSProperties = {
  maskImage: MORE_FADE_IMAGE,
  maskSize: MORE_FADE_SIZE,
  maskPosition: MORE_FADE_POSITION,
  maskRepeat: "no-repeat",
  WebkitMaskImage: MORE_FADE_IMAGE,
  WebkitMaskSize: MORE_FADE_SIZE,
  WebkitMaskPosition: MORE_FADE_POSITION,
  WebkitMaskRepeat: "no-repeat",
};

/**
 * The no-photo panel: paper, one tonal step from the band card in both
 * themes and under hover, with the service's own duration or working days set
 * as a figure. Decorative; the same facts are in the chips.
 */
function NoPhotoPanel({
  figure,
  multiDay,
  label,
  labelId,
  cornerTaken,
}: {
  figure?: string | null;
  multiDay: boolean;
  /** AUTM-1812: e.g. "No photo yet". Read through the card's description. */
  label?: string | null;
  labelId: string;
  /**
   * A status or badge holds the top-left corner. The glyph steps aside and
   * the words go under the figure, so the pill never lands on them.
   */
  cornerTaken: boolean;
}) {
  /* Hidden with the panel, yet still read: the card's link names this id in
     aria-describedby, and a node referenced that way is read even when
     hidden. */
  const words = label ? (
    <span id={labelId} className="text-[0.8125rem] font-medium leading-tight text-[var(--text-muted)]">
      {label}
      <span className="sr-only">.</span>
    </span>
  ) : null;
  return (
    <div
      aria-hidden="true"
      data-slot="media-fallback"
      className="flex h-full w-full flex-col justify-between bg-[var(--paper)] p-3 text-[var(--text-strong)]"
    >
      {cornerTaken ? (
        <span />
      ) : (
        <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
          {figure ? multiDay ? <CalendarIcon large /> : <ClockIcon large /> : <SparkleIcon />}
          {words}
        </span>
      )}
      {figure || (cornerTaken && words) ? (
        <span className="flex flex-col gap-1">
          {figure ? (
            <span className="line-clamp-2 text-sm font-bold leading-tight @min-[11rem]/media:text-2xl @min-[11rem]/media:font-black @min-[16rem]/media:text-4xl">
              {figure}
            </span>
          ) : null}
          {cornerTaken ? words : null}
        </span>
      ) : null}
    </div>
  );
}

/* Solar-style glyphs: 24 grid, round caps and joins. */

function ClockIcon({ large }: { large?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={large ? "size-6" : "size-3.5"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function CalendarIcon({ large }: { large?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={large ? "size-6" : "size-3.5"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

/* Solar's arrow-right, linear: the Book pill's trailing arrow. Decorative. */
export function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12h16m0 0-6-6m6 6-6 6" />
    </svg>
  );
}

/* Solar's map-point, linear: where a service is done (`locationLabel`). */
function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21c-.6 0-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-6.4 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 4c.7 3.6 2.4 5.3 6 6-3.6.7-5.3 2.4-6 6-.7-3.6-2.4-5.3-6-6 3.6-.7 5.3-2.4 6-6Z" />
      <path d="M18.5 15.5c.3 1.4.9 2 2.3 2.3-1.4.3-2 .9-2.3 2.3-.3-1.4-.9-2-2.3-2.3 1.4-.3 2-.9 2.3-2.3Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CheckIcon({ small }: { small?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={small ? "size-3.5" : "size-4"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6.5 12.5l3.5 3.5 7.5-8" />
    </svg>
  );
}

/**
 * The card's loading shape, for the same layout. Silent by default, because a
 * list renders several; pass `label` on one of them (or announce from the
 * list) so a screen reader hears that services are loading.
 */
export interface ServiceCardSkeletonProps {
  layout?: ServiceCardLayout;
  /** Announced via role="status" when set, e.g. "Loading services". */
  label?: string | null;
  testId?: string;
  className?: string;
}

const BLOCK = "motion-skeleton bg-[var(--band-press)]";

export function ServiceCardSkeleton({
  layout = "horizontal",
  label = null,
  testId,
  className,
}: ServiceCardSkeletonProps) {
  return (
    <div
      data-slot="service-card-skeleton"
      data-testid={testId}
      {...(label ? { role: "status", "aria-live": "polite" as const } : { "aria-hidden": true })}
      className={cn("flex h-full flex-col rounded-[1.5rem] bg-[var(--band)] p-2.5 @container", className)}
    >
      {layout === "menu" ? (
        /* AUTM-1866: the menu row's shape. The name, the meta line, two
           lines of description; the photo's square on the right; the price
           and the Book pill in the foot. */
        <div className={ROW.menu}>
          <div className={cn("rounded-2xl", BLOCK, MEDIA_BOX.menu)} />
          <div className={cn("flex min-w-0 flex-col gap-2", CONTENT.menu)}>
            <div className={cn("h-5 w-3/4 rounded-lg", BLOCK)} />
            <div className={cn("h-4 w-1/2 rounded-lg", BLOCK)} />
            <div className={cn("mt-1 h-4 w-full rounded-lg", BLOCK)} />
            <div className={cn("h-4 w-2/3 rounded-lg", BLOCK)} />
          </div>
          <div className={cn("flex flex-wrap justify-between gap-x-3 gap-y-2", FOOT.menu)}>
            <div className="flex flex-col gap-1.5">
              <div className={cn("h-5 w-16 rounded-lg", BLOCK)} />
              <div className={cn("h-3.5 w-28 rounded-lg", BLOCK)} />
            </div>
            <div className={cn("h-11 w-20 rounded-[1.375rem] @min-[16rem]:col-start-2 @min-[16rem]:w-full", BLOCK)} />
          </div>
        </div>
      ) : (
      <div className={ROW[layout]}>
        <div className={cn("rounded-2xl", BLOCK, MEDIA_BOX[layout])} />
        <div className={cn("flex min-w-0 flex-col gap-2", CONTENT[layout])}>
          <div className={cn("h-5 w-3/4 rounded-lg", BLOCK, NAME[layout])} />
          <div className={cn("flex flex-col gap-2", DESC[layout])}>
            <div className={cn("h-4 w-full rounded-lg", BLOCK)} />
            <div className={cn("h-4 w-2/3 rounded-lg", BLOCK)} />
          </div>
          <div className={cn("flex gap-1.5", CHIPS[layout])}>
            <div className={cn("h-7 w-16 rounded-full", BLOCK)} />
            <div className={cn("h-7 w-24 rounded-full", BLOCK)} />
          </div>
        </div>
        <div className={cn("flex flex-wrap items-end justify-between gap-x-3 gap-y-2", FOOT[layout])}>
          <div className={cn("h-6 w-20 rounded-lg", BLOCK)} />
        </div>
      </div>
      )}
      {label ? <span className="sr-only">{label}</span> : null}
    </div>
  );
}
