import { useLayoutEffect, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChatShareCard, type ChatShareCardProps } from "./ChatShareCard";
import { MessageThread, type MessageItem } from "./MessageThread";
import { parseChatShare, type ChatShareAttachment } from "../lib/chat-share";

/**
 * AUTM-2199 (from AUTM-2181). A car, an address, a shop or a booking shared
 * in the chat, the same card as the native apps' (autara-ios
 * Customer/ChatPieces.swift ChatCard, Don's simulator capture of 15 Nov):
 * 252 wide, a 132 picture, the title and one line, at most Directions.
 * Reference is the native card Don approved, not Mobbin: the brief was
 * "copy the native card", and the Mobbin connector was not authorised in
 * this session.
 */
const meta: Meta<typeof ChatShareCard> = {
  title: "Molecules/ChatShareCard",
  component: ChatShareCard,
  parameters: { layout: "padded" },
  decorators: [
    // `frame: "wide"` for the grids and the thread; a single card sits in a
    // 26rem column, a flex column so mine aligns to the end as in a thread.
    (Story, { parameters }) => (
      <div className={parameters.frame === "wide" ? "max-w-[42rem]" : "flex max-w-[26rem] flex-col"}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatShareCard>;

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&h=320&q=70`;
const CAR_PHOTO = photo("photo-1503376780353-7e6692767b70");
const SERVICE_PHOTO = photo("photo-1607860108855-64acf2078ed9");
const COVER_PHOTO = photo("photo-1542362567-b07e54358753");
/** A stand-in pro logo, drawn here so the story makes no extra request. */
const LOGO = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#fff"/><text x="38" y="54" font-family="Arial, sans-serif" font-weight="900" font-size="40" text-anchor="middle" fill="#0e0a1a">M</text><circle cx="58" cy="52" r="4.5" fill="#e11d48"/></svg>',
)}`;
const PRO = "Mo Auto";

const CAR: ChatShareAttachment = { kind: "CAR", title: "Ferrari 12Cilindri", detail: "ABG12V · Red" };
const HOME: ChatShareAttachment = {
  kind: "HOME",
  title: "14 Rae Street",
  detail: "Fitzroy North VIC 3068",
  address: "14 Rae Street, Fitzroy North VIC 3068",
  lat: -37.785,
  lng: 144.981,
};
const SHOP: ChatShareAttachment = {
  kind: "SHOP",
  title: "Ground Floor",
  detail: "52 York Street, Sydney NSW 2000",
  address: "Ground Floor, 52 York Street, Sydney NSW 2000",
  lat: -33.8668,
  lng: 151.2044,
};
const BOOKING: ChatShareAttachment = {
  kind: "BOOKING",
  title: "Tyre shine and dressing",
  detail: "Tue 17 Nov, 10:30 am · Mobile",
  imageUrl: SERVICE_PHOTO,
};
const DIRECTIONS = "https://maps.apple.com/?daddr=-33.8668,151.2044";

/** The default: a customer's own car, with its photo. */
export const Car: Story = { args: { attachment: { ...CAR, imageUrl: CAR_PHOTO }, mine: true } };
/** No photo: the native apps' 3D car, with the rego read from the detail on a plate. */
export const CarWithoutPhoto: Story = { args: { attachment: CAR, mine: true } };
/** The pro's view of the same car: the incoming bubble. */
export const CarTheirs: Story = { args: { attachment: { ...CAR, imageUrl: CAR_PHOTO } } };
/** The customer's home: our own drawn town, the purple house pin, no map provider. */
export const Home: Story = { args: { attachment: HOME, mine: true } };
/** The pro sees it with Directions (the consumer builds the link). */
export const HomeTheirs: Story = {
  args: { attachment: HOME, directionsHref: "https://maps.apple.com/?daddr=14+Rae+Street" },
};
/** The pro's shop, as the customer sees it: the logo is the pin, and Directions. */
export const Shop: Story = {
  args: { attachment: SHOP, logoUrl: LOGO, proName: PRO, directionsHref: DIRECTIONS },
};
/** The pro's own view of their shop: mine, so the Directions pill is the on-brand one. */
export const ShopMine: Story = {
  args: { attachment: SHOP, mine: true, logoUrl: LOGO, proName: PRO, directionsHref: DIRECTIONS },
};
/** No logo: the pro's initials on deep purple stand as the pin. */
export const ShopWithoutLogo: Story = { args: { attachment: SHOP, proName: PRO, directionsHref: DIRECTIONS } };
/** The map is a slot: a consumer may draw its own image under the pin (never a third party for a home). */
export const ShopWithMapImage: Story = {
  args: { attachment: SHOP, logoUrl: LOGO, proName: PRO, mapImageUrl: COVER_PHOTO, directionsHref: DIRECTIONS },
};
/** A booking the pro shared: the service's photo with their logo as a badge. */
export const Booking: Story = { args: { attachment: BOOKING, logoUrl: LOGO, proName: PRO } };
/** No service photo: the pro's cover stands in. */
export const BookingCover: Story = {
  args: { attachment: { ...BOOKING, imageUrl: null }, coverUrl: COVER_PHOTO, logoUrl: LOGO, proName: PRO },
};
/** Neither photo nor cover: a quiet glyph, the logo still in its corner. */
export const BookingWithoutImage: Story = {
  args: { attachment: { ...BOOKING, imageUrl: null }, logoUrl: LOGO, proName: PRO, mine: true },
};
/** Sending: 55% until the send lands, as native. */
export const Sending: Story = { args: { attachment: { ...CAR, imageUrl: CAR_PHOTO }, mine: true, sending: true } };
/** A signed URL past its life: the 3D car stands in and `onImageError` asks for a fresh one. */
export const ExpiredPhoto: Story = {
  args: { attachment: { ...CAR, imageUrl: "https://images.unsplash.com/photo-0000000000000-broken?w=10" }, mine: true },
};
/** Edge: long words clamp at two lines each; the picture never moves. */
export const LongWords: Story = {
  args: {
    attachment: {
      kind: "SHOP",
      title: "Shop 12, Level 2, Westfield Bondi Junction Car Park, Entrance via Newland Street",
      detail: "500 Oxford Street, Bondi Junction NSW 2022, behind the car wash bays near lift C",
    },
    proName: "Bondi Junction Premium Car Care and Paint Protection",
    directionsHref: DIRECTIONS,
  },
};
/** Edge: an older message with only its text line, read back by parseChatShare. No picture data. */
export const FromATextLine: Story = {
  args: { attachment: parseChatShare("Your booking: Interior · Today, 10:30 am · Mobile")!, proName: PRO },
};
/** Edge: a kind this build does not know draws the words only. */
export const UnknownKind: Story = { args: { attachment: { kind: "INVOICE", title: "Invoice 1042", detail: "$180.00 due" } } };

function Every({ sending = false }: { sending?: boolean }) {
  const cards: Array<[string, ChatShareCardProps]> = [
    ["Car, photo", { attachment: { ...CAR, imageUrl: CAR_PHOTO }, mine: true }],
    ["Car, no photo", { attachment: CAR }],
    ["Home", { attachment: HOME, mine: true }],
    ["Home, theirs", { attachment: HOME, directionsHref: DIRECTIONS }],
    ["Shop", { attachment: SHOP, logoUrl: LOGO, proName: PRO, directionsHref: DIRECTIONS }],
    ["Shop, mine", { attachment: SHOP, mine: true, logoUrl: LOGO, proName: PRO, directionsHref: DIRECTIONS }],
    ["Booking", { attachment: BOOKING, logoUrl: LOGO, proName: PRO }],
    ["Booking, no photo", { attachment: { ...BOOKING, imageUrl: null }, mine: true, logoUrl: LOGO, proName: PRO }],
  ];
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-x-6 gap-y-8">
      {cards.map(([label, props]) => (
        <div key={label} className="flex flex-col gap-2">
          <p className="text-[0.8125rem] font-medium text-[var(--text-muted)]">{label}</p>
          <ChatShareCard {...props} sending={sending} />
        </div>
      ))}
    </div>
  );
}

/** All four kinds, mine and theirs, with and without a picture, light. */
export const EveryKindLight: Story = {
  globals: { theme: "light" },
  parameters: { frame: "wide" },
  render: () => <Every />,
};
/** All four kinds, mine and theirs, with and without a picture, dark. */
export const EveryKindDark: Story = {
  globals: { theme: "dark" },
  parameters: { frame: "wide" },
  render: () => <Every />,
};
/** Every card sending, light: 55%. */
export const EverySendingLight: Story = {
  globals: { theme: "light" },
  parameters: { frame: "wide" },
  render: () => <Every sending />,
};
/** Every card sending, dark. */
export const EverySendingDark: Story = {
  globals: { theme: "dark" },
  parameters: { frame: "wide" },
  render: () => <Every sending />,
};

/**
 * 200% text the way a phone gives it: the ROOT font size doubles, so every
 * rem in the card grows (a wrapper's `font-size: 200%` scales none of them).
 * Restored when the story unmounts.
 */
function RootFontSize({ size, children }: { size: string; children: ReactNode }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const before = root.style.fontSize;
    root.style.fontSize = size;
    return () => {
      root.style.fontSize = before;
    };
  }, [size]);
  return <>{children}</>;
}

/** 200% text on a phone: the card grows to the thread's 80%, the picture keeps its shape, nothing clips. */
export const Text200: Story = {
  parameters: { viewport: { defaultViewport: "phone" } },
  render: () => (
    <RootFontSize size="200%">
      <div className="flex flex-col gap-6">
        <ChatShareCard attachment={CAR} mine />
        <ChatShareCard attachment={SHOP} logoUrl={LOGO} proName={PRO} directionsHref={DIRECTIONS} />
        <ChatShareCard attachment={BOOKING} logoUrl={LOGO} proName={PRO} />
      </div>
    </RootFontSize>
  ),
};

function Thread() {
  const items: MessageItem[] = [
    {
      id: "1",
      side: "incoming",
      text: "Hi Alex, see you Tuesday at 10:30. Which car is it?",
      createdAt: "2026-11-15T09:02:00+11:00",
    },
    {
      id: "2",
      side: "own",
      createdAt: "2026-11-15T09:04:00+11:00",
      body: <ChatShareCard attachment={{ ...CAR, imageUrl: CAR_PHOTO }} mine testId="chat-share-card-2" />,
    },
    {
      id: "3",
      side: "own",
      createdAt: "2026-11-15T09:04:30+11:00",
      body: <ChatShareCard attachment={HOME} mine testId="chat-share-card-3" />,
    },
    {
      id: "4",
      side: "incoming",
      text: "Got it. If it is easier, you can drop it at the shop instead.",
      createdAt: "2026-11-15T09:06:00+11:00",
    },
    {
      id: "5",
      side: "incoming",
      createdAt: "2026-11-15T09:06:20+11:00",
      body: (
        <ChatShareCard
          attachment={SHOP}
          logoUrl={LOGO}
          proName={PRO}
          directionsHref={DIRECTIONS}
          testId="chat-share-card-5"
        />
      ),
    },
    {
      id: "6",
      side: "incoming",
      createdAt: "2026-11-15T09:07:00+11:00",
      body: <ChatShareCard attachment={BOOKING} logoUrl={LOGO} proName={PRO} testId="chat-share-card-6" />,
    },
    {
      id: "7",
      side: "own",
      status: "sending",
      createdAt: "2026-11-15T09:08:00+11:00",
      body: <ChatShareCard attachment={CAR} mine sending testId="chat-share-card-7" />,
    },
  ];
  return (
    <div className="flex h-[52rem] max-w-[27.5rem] flex-col rounded-[1.25rem] bg-[var(--paper)]">
      <MessageThread items={items} anchor="end" logLabel={`Messages with ${PRO}`} />
    </div>
  );
}

/** In context: the booking thread, a car and a home shared, the shop and a booking back, one still sending. */
export const InTheThread: Story = {
  parameters: { frame: "wide" },
  render: () => <Thread />,
};
/** The same thread, dark. */
export const InTheThreadDark: Story = {
  globals: { theme: "dark" },
  parameters: { frame: "wide" },
  render: () => <Thread />,
};
