"use client";

import { useId, useState, type HTMLAttributes, type ReactNode } from "react";
import { BookingsIcon, BusinessIcon, DirectionsIcon, HomeIcon } from "../icons";
import { chatSharePlate, type ChatShareAttachment, type ChatShareKind } from "../lib/chat-share";
import { CHAT_SHARE_CAR_ART } from "../lib/chat-share-car-art";
import { cn } from "../lib/cn";
import { initialsOf } from "../lib/initials";
import { buttonVariants } from "./Button";
import { MediaFrame } from "./MediaFrame";

/**
 * ChatShareCard: a car, an address, a shop or a booking someone shared in a
 * chat (AUTM-2199, from AUTM-2181). Don, 2026-11-15: "make widgets univarsal.
 * and keep it on all surfaces web and mobile", so this draws what the native
 * card draws (autara-ios Customer/ChatPieces.swift ChatCard): 252 wide, a
 * picture 132 tall on top, the title and one line under it, at most one
 * action.
 *
 * It draws a GraphQL `MessageAttachment` as given (autara-contracts
 * `src/chat/attachment.ts`, built by the server from the sender's own rows),
 * or, for an older message that has only its text line, what
 * `parseChatShare` reads from that line. So the customer app, the merchant
 * app, autara.au and the merchant portal draw one card from one row. It goes
 * in `MessageItem.body` (MessageThread aligns it to its side), like
 * ChatPhotoBubble.
 *
 * The picture, by kind:
 *   - CAR: the car's photo; else the native apps' 3D car with the rego (the
 *     first plate-shaped part of the detail) on a plate, bottom left.
 *   - BOOKING: the service's photo, else the pro's cover (`coverUrl`), with
 *     the pro's logo as a badge, top left.
 *   - HOME and SHOP: a map preview with our pin, a purple house for HOME and
 *     the pro's logo for SHOP. The map is a slot (`mapImageUrl`, e.g. a
 *     static map the consumer renders), so the card holds no key; without one
 *     it is OUR OWN drawing (TownMap below, the native app's Town at half
 *     scale), never tiles. That default makes no request at all, which is
 *     the point: a customer's home must not leave the page. A consumer that
 *     fills the slot for HOME from a third party sends that home to it; don't.
 *   - Any other kind: no picture, the words only.
 *
 * The bubble is the speaker's, as MessageBubble: `mine` is the brand purple
 * fill with white words (`--message-own`), theirs the incoming fill; the tail
 * is one tighter corner on the speaker's side. `sending` draws it at 55%
 * until the send lands, as native. No shadow (the native pin's drop shadow is
 * a 1px edge here), no border, no gradient.
 *
 * A photo fades in on its own load over a still pulse, opacity only; one that
 * fails (a signed URL past its life) falls back and calls `onImageError`, so
 * the caller can fetch a fresh URL. Directions is a 36px pill, as native,
 * with a 44px hit area, and says it opens a new tab. The kind is said to a
 * screen reader before the title ("Car: Ferrari 12Cilindri"), since only the
 * picture says it to the eye. Type and width are rem, so it grows with the
 * reader's text size, and the words wrap rather than clamp, so 200% text
 * loses none of them; the picture keeps its 252:132 shape.
 */
export interface ChatShareCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  attachment: ChatShareAttachment;
  /** The reader sent it: the brand purple bubble, at the end of the thread. */
  mine?: boolean;
  /** Still sending: the card at 55% until the send lands. */
  sending?: boolean;
  /** The pro's logo: the pin on SHOP, the badge on BOOKING. */
  logoUrl?: string | null;
  /** The pro's name: the logo's alt text, and its initials when there is no logo. */
  proName?: string | null;
  /** BOOKING: the pro's cover photo, when the service has none. */
  coverUrl?: string | null;
  /** HOME and SHOP: a map image the consumer renders for the place; the drawn town without one. */
  mapImageUrl?: string | null;
  /** HOME and SHOP: a Directions pill to this link (opens in a new tab). */
  directionsHref?: string | null;
  /** Overrides the photo's alt text. @default "Photo of {title}" for a car, "" for a service cover */
  imageAlt?: string;
  /** The photo failed to load (a signed URL past its life): fetch a fresh one. */
  onImageError?: () => void;
  /** `data-testid` on the card; its parts take it as a prefix. @default "chat-share-card" */
  testId?: string;
}

/** Said before the title to a screen reader, since the picture says it to the eye. */
const KIND_LABEL: Record<ChatShareKind, string> = {
  CAR: "Car",
  HOME: "Address",
  BOOKING: "Booking",
  SHOP: "Address",
};

const isKind = (kind: string): kind is ChatShareKind => Object.prototype.hasOwnProperty.call(KIND_LABEL, kind);

export function ChatShareCard({
  attachment,
  mine = false,
  sending = false,
  logoUrl,
  proName,
  coverUrl,
  mapImageUrl,
  directionsHref,
  imageAlt,
  onImageError,
  testId = "chat-share-card",
  className,
  ...rest
}: ChatShareCardProps) {
  const titleId = useId();
  const kind = isKind(attachment.kind) ? attachment.kind : null;
  const place = kind === "HOME" || kind === "SHOP";
  const title = attachment.title;
  const detail = attachment.detail?.trim() ? attachment.detail : null;

  return (
    <article
      aria-labelledby={titleId}
      data-kind={attachment.kind}
      data-mine={mine ? "" : undefined}
      data-sending={sending ? "" : undefined}
      data-testid={testId}
      className={cn(
        "flex w-[15.75rem] max-w-[80%] flex-col overflow-hidden rounded-[1.25rem] transition-opacity duration-(--motion-crossfade) ease-(--motion-ease-out)",
        mine
          ? "self-end rounded-br-md bg-[var(--message-own)] text-[var(--on-message-own)]"
          : "self-start rounded-bl-md bg-[var(--message-incoming)] text-[var(--on-message-incoming)]",
        sending && "opacity-55",
        className,
      )}
      {...rest}
    >
      {kind ? (
        <Picture
          kind={kind}
          mine={mine}
          title={title}
          imageUrl={attachment.imageUrl || (kind === "BOOKING" ? coverUrl : null)}
          imageAlt={imageAlt}
          plate={kind === "CAR" ? chatSharePlate(attachment.detail) : null}
          logoUrl={logoUrl}
          proName={proName}
          mapImageUrl={mapImageUrl}
          onImageError={onImageError}
          testId={testId}
        />
      ) : null}

      <div className="flex flex-col gap-2 p-3">
        <div className="flex min-w-0 flex-col gap-px">
          <p
            id={titleId}
            data-testid={`${testId}-title`}
            className="break-words text-base font-bold leading-snug"
          >
            {kind ? <span className="sr-only">{`${KIND_LABEL[kind]}: `}</span> : null}
            {title}
          </p>
          {detail ? (
            <p
              data-testid={`${testId}-detail`}
              className={cn(
                "break-words text-[0.8125rem] leading-snug",
                mine ? "text-[var(--message-own-meta)]" : "text-[var(--message-incoming-meta)]",
              )}
            >
              {detail}
            </p>
          ) : null}
        </div>

        {place && directionsHref ? (
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`${testId}-directions`}
            className={buttonVariants({
              variant: mine ? "ondeep" : "quiet",
              size: "sm",
              className: cn(
                // Drawn 36px tall as native; the 44px hit area is the
                // unpainted pseudo-element, 4px either side. The side padding
                // is held by the viewport (as Button's sizes), so at 200% text
                // the pill still fits a phone's card.
                "relative min-h-9 max-w-full gap-1.5 self-start px-[min(0.875rem,3.5vw)] py-1.5 before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']",
                !mine &&
                  "bg-[var(--message-card-action)] text-[var(--accent)] not-disabled:hover:bg-[var(--message-card-action-hover)]",
              ),
            })}
          >
            <DirectionsIcon size="1.0625em" />
            <span>
              Directions
              <span className="sr-only">{` to ${attachment.address?.trim() || title} (opens in a new tab)`}</span>
            </span>
          </a>
        ) : null}
      </div>
    </article>
  );
}

interface PictureProps {
  kind: ChatShareKind;
  mine: boolean;
  title: string;
  imageUrl?: string | null;
  imageAlt?: string;
  plate: string | null;
  logoUrl?: string | null;
  proName?: string | null;
  mapImageUrl?: string | null;
  onImageError?: () => void;
  testId: string;
}

/** The 252 x 132 picture on top, as a ratio so it narrows with a narrow thread. */
function Picture({
  kind,
  mine,
  title,
  imageUrl,
  imageAlt,
  plate,
  logoUrl,
  proName,
  mapImageUrl,
  onImageError,
  testId,
}: PictureProps) {
  const name = proName?.trim() || "";
  const hasLogo = Boolean(logoUrl || name);
  const logo = (className: string) => (
    <MediaFrame
      shape="round"
      src={logoUrl}
      alt={name ? `${name} logo` : ""}
      initials={initialsOf(name)}
      label={name || undefined}
      className={className}
      testId={`${testId}-logo`}
    />
  );

  let body: ReactNode;
  let drawn: "photo" | "art" | "map" | "town";
  if (kind === "CAR") {
    // The native apps' 3D car, inset as the native card insets it (30 by 12),
    // with the rego on a plate. Decorative: the detail line says the plate.
    const art = (
      <>
        <img
          src={CHAT_SHARE_CAR_ART}
          alt=""
          draggable={false}
          data-testid={`${testId}-art`}
          className="absolute inset-0 size-full object-contain px-[11.9cqi] py-[4.75cqi]"
        />
        {plate ? (
          // The native RegoPlate (au), on its tokens, drawn here rather than
          // through `.au-rego`: that rule is unlayered, so it would hold the
          // plate at 0.75rem and swamp the picture at 200% text.
          <span
            aria-hidden="true"
            data-testid={`${testId}-plate`}
            className="absolute bottom-[4cqi] left-[4cqi] inline-flex items-center whitespace-nowrap rounded-[5px] border-[1.5px] border-[var(--au-rego-ink)] bg-[var(--au-rego)] px-[0.58em] py-[0.33em] font-mono text-[min(0.75rem,4.75cqi)] font-bold leading-none tracking-[0.09em] text-[var(--au-rego-ink)]"
          >
            {plate}
          </span>
        ) : null}
      </>
    );
    drawn = imageUrl ? "photo" : "art";
    body = imageUrl ? (
      <Photo
        src={imageUrl}
        alt={imageAlt ?? `Photo of ${title}`}
        mine={mine}
        fallback={art}
        onError={onImageError}
        testId={`${testId}-image`}
      />
    ) : (
      art
    );
  } else if (kind === "BOOKING") {
    const glyph = (
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 grid place-items-center",
          mine ? "text-[var(--message-own-meta)]" : "text-[var(--text-subtle)]",
        )}
      >
        <BookingsIcon size="3.5rem" />
      </span>
    );
    drawn = imageUrl ? "photo" : "art";
    body = (
      <>
        {imageUrl ? (
          <Photo
            src={imageUrl}
            alt={imageAlt ?? ""}
            mine={mine}
            fallback={glyph}
            onError={onImageError}
            testId={`${testId}-image`}
          />
        ) : (
          glyph
        )}
        {hasLogo ? logo("absolute left-[4cqi] top-[4cqi] size-[13.5cqi]") : null}
      </>
    );
  } else {
    drawn = mapImageUrl ? "map" : "town";
    body = (
      <>
        {mapImageUrl ? (
          <Photo src={mapImageUrl} alt="" mine={mine} fallback={<TownMap />} testId={`${testId}-map`} />
        ) : (
          <TownMap />
        )}
        <span
          data-testid={`${testId}-pin`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          {kind === "SHOP" && hasLogo ? (
            <span className="block rounded-full bg-[var(--map-pin)] p-[3px] ring-1 ring-[var(--map-pin-edge)]">
              {logo("size-[15.9cqi]")}
            </span>
          ) : (
            <span
              aria-hidden="true"
              className="grid size-[12.7cqi] place-items-center rounded-full border-[3px] border-[var(--map-pin)] bg-[var(--accent-fill)] text-[var(--on-accent)] ring-1 ring-[var(--map-pin-edge)]"
            >
              {kind === "HOME" ? (
                <HomeIcon active className="size-[6cqi]" />
              ) : (
                <BusinessIcon active className="size-[6cqi]" />
              )}
            </span>
          )}
        </span>
      </>
    );
  }

  return (
    <div
      data-testid={`${testId}-picture`}
      data-picture={drawn}
      className={cn(
        // A size container: what sits ON the picture (the pins, the badge, the
        // plate, the car) is sized in cqi, in step with the picture as native
        // draws it, so at 200% text it grows with the card, not past it. It is
        // drawn, never read: the words under it carry the text size.
        "relative aspect-[252/132] w-full shrink-0 overflow-hidden [container-type:inline-size]",
        // The ground: the town's land under a map; else a step off the
        // bubble in its own ink, white at 12% over the brand fill (as native),
        // ink or white at 6% over the incoming fill. Never paper: the thread
        // is paper, so the card's top edge would melt into the page.
        drawn === "map" || drawn === "town"
          ? "bg-[var(--map-land)]"
          : mine
            ? "bg-[var(--on-message-own)]/12"
            : "bg-[var(--on-message-incoming)]/6",
      )}
    >
      {body}
    </div>
  );
}

/**
 * A photo that fades in on its own load over a still pulse. Keyed by the URL,
 * not reset in an effect (as ChatPhotoBubble): a cached photo can load before
 * a mount effect runs. A new `src` is tried again.
 */
function Photo({
  src,
  alt,
  mine,
  fallback,
  onError,
  testId,
}: {
  src: string;
  alt: string;
  mine: boolean;
  fallback: ReactNode;
  onError?: () => void;
  testId: string;
}) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  if (brokenSrc === src) return <>{fallback}</>;
  const loaded = loadedSrc === src;
  return (
    <>
      {!loaded ? (
        <span
          aria-hidden="true"
          className={cn(
            "motion-skeleton absolute inset-0",
            mine ? "bg-[var(--on-message-own)]/12" : "bg-[var(--on-message-incoming)]/6",
          )}
        />
      ) : null}
      <img
        src={src}
        alt={alt}
        decoding="async"
        loading="lazy"
        draggable={false}
        data-testid={testId}
        onLoad={() => setLoadedSrc(src)}
        onError={() => {
          setBrokenSrc(src);
          onError?.();
        }}
        className={cn(
          "absolute inset-0 size-full object-cover transition-opacity duration-(--motion-crossfade) ease-(--motion-ease-out)",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </>
  );
}

/*
 * The town (autara-ios Customer/Town.swift, TownPlan): an inner suburb in the
 * manner of Melbourne's north, two main roads, rows of houses along each
 * block, a garden with a pond. Drawn at half scale and centred on
 * TownPlan.home, as the native card's fallback draws it, and clipped to that
 * 252 x 132 window (the viewBox is the window in the town's own units, so
 * every width below is the native one). The houses were generated from
 * TownPlan's blocks and widths; segments wholly outside the window are left
 * out. No street names: they would be made up, and a made-up "Park St" under
 * a real address reads as a claim. Colours are the `--map-*` tokens, TownInk's
 * light and dark.
 */
const TOWN_VIEWBOX = "18 220 504 264";
const TOWN_ROADS = "M30 200V500M92 200V500M214 200V500M270 200V500M332 200V500M396 200V404M460 200V404M0 318H540M0 404H540";
const TOWN_MAIN = "M150 200V500M0 236H540";
const TOWN_GARDEN_PATH = "M430 404C410 470 440 520 470 548";
const TOWN_TREES: ReadonlyArray<readonly [number, number]> = [
  [352, 430],
  [368, 452],
  [350, 476],
  [400, 432],
];
const TOWN_HOUSES =
  "M3.5 244h17v13h-17zM38 215h10v13h-10zM50.5 215h12v13h-12zM65 215h11v13h-11zM38 244h12v13h-12zM52.5 244h11v13h-11zM66 244h15v13h-15zM38 297h13v13h-13zM53.5 297h17v13h-17zM73 297h10v13h-10zM38 326h17v13h-17zM57.5 326h10v13h-10zM70 326h12v13h-12zM38 383h15v13h-15zM55.5 383h9v13h-9zM67 383h13v13h-13zM38 412h9v13h-9zM49.5 412h13v13h-13zM65 412h17v13h-17zM38 469h12v13h-12zM52.5 469h11v13h-11zM66 469h15v13h-15z" +
  "M100 215h11v13h-11zM113.5 215h15v13h-15zM131 215h9v13h-9zM100 244h9v13h-9zM111.5 244h13v13h-13zM100 297h10v13h-10zM112.5 297h12v13h-12zM127 297h11v13h-11zM100 326h11v13h-11zM113.5 326h15v13h-15zM131 326h9v13h-9zM100 383h17v13h-17zM119.5 383h10v13h-10zM100 412h10v13h-10zM112.5 412h12v13h-12zM127 412h11v13h-11zM100 469h9v13h-9zM111.5 469h13v13h-13z" +
  "M158 215h17v13h-17zM177.5 215h10v13h-10zM190 215h12v13h-12zM158 244h10v13h-10zM170.5 244h12v13h-12zM185 244h11v13h-11zM158 297h9v13h-9zM169.5 297h13v13h-13zM185 297h17v13h-17zM158 326h13v13h-13zM173.5 326h17v13h-17zM193 326h10v13h-10zM158 383h11v13h-11zM171.5 383h15v13h-15zM189 383h9v13h-9zM158 412h15v13h-15zM175.5 412h9v13h-9zM187 412h13v13h-13zM158 469h10v13h-10zM170.5 469h12v13h-12zM185 469h11v13h-11z" +
  "M222 215h12v13h-12zM236.5 215h11v13h-11zM222 244h15v13h-15zM239.5 244h9v13h-9zM222 297h17v13h-17zM241.5 297h10v13h-10zM222 326h12v13h-12zM236.5 326h11v13h-11zM222 383h9v13h-9zM233.5 383h13v13h-13zM222 412h17v13h-17zM241.5 412h10v13h-10zM222 469h11v13h-11zM235.5 469h15v13h-15zM253 469h9v13h-9z" +
  "M278 215h13v13h-13zM293.5 215h17v13h-17zM313 215h10v13h-10zM278 244h17v13h-17zM297.5 244h10v13h-10zM310 244h12v13h-12zM278 297h15v13h-15zM295.5 297h9v13h-9zM307 297h13v13h-13zM278 326h9v13h-9zM289.5 326h13v13h-13zM305 326h17v13h-17zM278 383h12v13h-12zM292.5 383h11v13h-11zM306 383h15v13h-15zM278 412h11v13h-11zM291.5 412h15v13h-15zM309 412h9v13h-9zM278 469h17v13h-17zM297.5 469h10v13h-10zM310 469h12v13h-12z" +
  "M340 215h12v13h-12zM354.5 215h11v13h-11zM368 215h15v13h-15zM340 244h11v13h-11zM353.5 244h15v13h-15zM371 244h9v13h-9zM340 297h17v13h-17zM359.5 297h10v13h-10zM372 297h12v13h-12zM340 326h10v13h-10zM352.5 326h12v13h-12zM367 326h11v13h-11zM340 383h9v13h-9zM351.5 383h13v13h-13zM367 383h17v13h-17z" +
  "M404 215h9v13h-9zM415.5 215h13v13h-13zM431 215h17v13h-17zM404 244h13v13h-13zM419.5 244h17v13h-17zM439 244h10v13h-10zM404 297h11v13h-11zM417.5 297h15v13h-15zM435 297h9v13h-9zM404 326h15v13h-15zM421.5 326h9v13h-9zM433 326h13v13h-13zM404 383h10v13h-10zM416.5 383h12v13h-12zM431 383h11v13h-11z" +
  "M468 215h10v13h-10zM480.5 215h12v13h-12zM495 215h11v13h-11zM468 244h12v13h-12zM482.5 244h11v13h-11zM496 244h15v13h-15zM468 297h13v13h-13zM483.5 297h17v13h-17zM503 297h10v13h-10zM468 326h17v13h-17zM487.5 326h10v13h-10zM500 326h12v13h-12zM468 383h15v13h-15zM485.5 383h9v13h-9zM497 383h13v13h-13z";

/** The town, drawn once: land, houses, the garden, then the roads over them. */
function TownMap() {
  return (
    <svg
      viewBox={TOWN_VIEWBOX}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      data-map="town"
      className="absolute inset-0 size-full"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="18" y="220" width="504" height="264" style={{ fill: "var(--map-land)" }} />
      <path d={TOWN_HOUSES} style={{ fill: "var(--map-house)" }} />
      <rect x="339" y="411" width="254" height="252" rx="22" style={{ fill: "var(--map-garden)" }} />
      <path d={TOWN_GARDEN_PATH} strokeWidth="3" style={{ stroke: "var(--map-garden-path)" }} />
      <rect x="424" y="470" width="92" height="54" rx="27" style={{ fill: "var(--map-water)" }} />
      {TOWN_TREES.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="7" style={{ fill: "var(--map-tree)" }} />
      ))}
      {/* Casings first, then the roads, so every crossing joins cleanly. */}
      <path d={TOWN_ROADS} strokeWidth="9" style={{ stroke: "var(--map-road-edge)" }} />
      <path d={TOWN_MAIN} strokeWidth="16" style={{ stroke: "var(--map-road-edge)" }} />
      <path d={TOWN_ROADS} strokeWidth="7" style={{ stroke: "var(--map-road)" }} />
      <path d={TOWN_MAIN} strokeWidth="14" style={{ stroke: "var(--map-road-main)" }} />
      {/* The tram line down the middle of the main roads. */}
      <path d={TOWN_MAIN} strokeWidth="1" strokeDasharray="5 4" strokeLinecap="butt" style={{ stroke: "var(--map-tram)" }} />
    </svg>
  );
}
