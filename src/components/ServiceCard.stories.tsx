import { createContext, forwardRef, useContext, useState, type AnchorHTMLAttributes } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ServiceCard, ServiceCardSkeleton } from "./ServiceCard";
import { CardGrid } from "./CardGrid";
import { Badge } from "./Badge";
import { Button } from "./Button";
import {
  listingPrice,
  serviceDurationLabel,
  serviceLocationLabel,
  workingDaysLabel,
  DROP_OFF_TAG,
} from "../lib/service-listing";

/**
 * AUTM-1694: one card for the merchant page's service list and the booking
 * flow's "Pick a service" step. Photo-led at 4:3, a designed panel when there
 * is no photo, two lines of description with More, chips for duration and
 * working days, a price block the consumer words. Link mode for the merchant
 * page, select mode (a real radio) for the picker.
 */
const meta = {
  title: "Marketplace/ServiceCard",
  component: ServiceCard,
  parameters: { layout: "padded" },
  args: {
    name: "Exterior hand wash",
    description:
      "Two-bucket hand wash, wheel faces, door shuts and a spray sealant. Dried with a blower so nothing drags across the paint.",
    priceLabel: "$80",
    durationLabel: "45 min",
    coverImageUrl: undefined,
  },
} satisfies Meta<typeof ServiceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const PHOTO = {
  wash: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=900&q=70",
  sport: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=70",
  wrap: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=900&q=70",
  bay: "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=70",
  interior: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=900&q=70",
};

/** The fee on: the total leads and its parts sit under it, worded by the consumer. */
const withFee = (service: string, fee: string) => [
  { label: "Service", value: service },
  { label: "+ booking fee", value: fee },
];

const DROP_OFF = { label: "Drop off at the workshop", icon: <DropOffIcon /> };

/** A grid tile with a photo, as a link. */
export const Default: Story = {
  args: { coverImageUrl: PHOTO.wash, layout: "vertical", href: "#book", actionLabel: "Book" },
  render: (args) => (
    <div className="max-w-xs">
      <ServiceCard {...args} />
    </div>
  ),
};

/** The same service as a list row: the photo on the left, still large enough to read. */
export const Row: Story = {
  args: { coverImageUrl: PHOTO.wash, layout: "horizontal", href: "#book", actionLabel: "Book" },
  render: (args) => (
    <div className="max-w-2xl">
      <ServiceCard {...args} />
    </div>
  ),
};

/**
 * No photo. The panel carries the service's own duration or working days as a
 * figure, so a menu with no photos is not a column of identical placeholders,
 * and none of them reads as a picture that failed. With neither, a quiet glyph.
 */
export const NoPhoto: Story = {
  render: (args) => (
    <div className="grid max-w-4xl gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <ServiceCard {...args} layout="vertical" />
        <ServiceCard
          {...args}
          layout="vertical"
          name="Ceramic coating, two layers"
          durationLabel={null}
          workingDaysLabel="3 working days"
          chips={[DROP_OFF]}
          priceLabel="$900"
        />
        <ServiceCard {...args} layout="vertical" name="Headlight restoration" durationLabel={null} priceLabel="$120" />
      </div>
      <ServiceCard {...args} layout="horizontal" />
      <ServiceCard
        {...args}
        layout="horizontal"
        coverImageUrl="https://images.unsplash.com/photo-0000000000000-broken?w=10"
        name="A photo that fails to load falls back to the same panel"
      />
    </div>
  ),
};

/** Long names wrap in full; the price and the action stay on the card. */
export const LongName: Story = {
  args: {
    name: "Ceramic coating, stage two, with single-stage paint correction and wheel faces sealed",
    coverImageUrl: PHOTO.sport,
    pricePrefix: "From",
    priceLabel: "$1,250",
    durationLabel: "6 hr 30 min",
    href: "#",
    actionLabel: "Book",
  },
  render: (args) => (
    <div className="grid max-w-4xl items-start gap-4 sm:grid-cols-[18rem_1fr]">
      <ServiceCard {...args} layout="vertical" />
      <ServiceCard {...args} layout="horizontal" />
    </div>
  ),
};

/** Two lines, then More over the second line's end, in place. More never books or selects. */
export const LongDescription: Story = {
  args: {
    coverImageUrl: PHOTO.interior,
    name: "Interior steam clean",
    description:
      "Hot-water extraction on carpets and cloth seats, leather cleaned and conditioned, headliner spot-cleaned, every vent and seam steamed, glass inside and out, and the boot done the same way. We bring our own water and power, so it can be done in a driveway or a car park. Allow the seats an hour to dry before a long drive.",
    priceLabel: "$180",
    durationLabel: "2 hr",
    href: "#",
    actionLabel: "Book",
  },
  render: (args) => (
    <div className="grid max-w-4xl items-start gap-4 sm:grid-cols-[18rem_1fr]">
      <ServiceCard {...args} layout="vertical" />
      <ServiceCard {...args} layout="horizontal" />
    </div>
  ),
};

/**
 * AUTM-1848: More takes no room of its own. It can only be decided in the
 * browser, after hydration, so it sits over the clamped second line's end (the
 * line fades out under it) instead of adding a row: the card is the same
 * height before and after it appears, and the price never moves. Open, Less
 * sits under the text. A phone's rows, a long and a short description, plain
 * and selected; the short one has no More.
 */
export const MoreTakesNoRoom: Story = {
  args: {
    coverImageUrl: PHOTO.interior,
    name: "Interior steam clean",
    description:
      "Hot-water extraction on carpets and cloth seats, leather cleaned and conditioned, headliner spot-cleaned, every vent and seam steamed, glass inside and out.",
    priceLabel: "$188.82",
    priceLines: withFee("$180", "$8.82"),
    durationLabel: "2 hr",
  },
  parameters: { viewport: { defaultViewport: "phone" } },
  render: (args) => (
    <div className="grid max-w-[24rem] gap-3">
      <ServiceCard {...args} layout="adaptive" href="#book" testIds={{ descriptionToggle: "more-long" }} />
      <ServiceCard
        {...args}
        layout="adaptive"
        name="Exterior hand wash"
        description="Two-bucket hand wash and a blower dry."
        coverImageUrl={PHOTO.wash}
        href="#book"
      />
      <div role="radiogroup" aria-label="Services">
        <ServiceCard {...args} layout="adaptive" groupName="more-demo" value="interior" selected onSelect={() => {}} />
      </div>
    </div>
  ),
};

/** The same in dark: the fade is a mask, so it needs no colour to match the card. */
export const MoreTakesNoRoomDark: Story = {
  ...MoreTakesNoRoom,
  globals: { theme: "dark" },
  parameters: { ...MoreTakesNoRoom.parameters, backgrounds: { default: "Paper, dark" } },
};

/** A job measured in working days, left at the workshop. The consumer adds the drop-off chip. */
export const MultiDay: Story = {
  args: {
    name: "Ceramic coating, two layers",
    description: "Decontamination, a single-stage polish and two layers of coating, cured overnight between them.",
    coverImageUrl: PHOTO.bay,
    durationLabel: null,
    workingDaysLabel: "3 working days",
    chips: [DROP_OFF],
    priceLabel: "$943.65",
    priceLines: withFee("$900", "$43.65"),
    href: "#",
    actionLabel: "Book",
  },
  render: (args) => (
    <div className="grid max-w-4xl items-start gap-4 sm:grid-cols-[18rem_1fr]">
      <ServiceCard {...args} layout="vertical" />
      <ServiceCard {...args} layout="horizontal" />
    </div>
  ),
};

/** The price block: a single price where no fee is charged, the total and its parts where one is. */
export const Prices: Story = {
  render: (args) => (
    <div className="grid max-w-4xl items-start gap-4 sm:grid-cols-3">
      <ServiceCard {...args} layout="vertical" coverImageUrl={PHOTO.wash} />
      <ServiceCard
        {...args}
        layout="vertical"
        coverImageUrl={PHOTO.wash}
        priceLabel="$83.92"
        priceLines={withFee("$80", "$3.92")}
      />
      <ServiceCard {...args} layout="vertical" coverImageUrl={PHOTO.wash} pricePrefix="From" priceLabel="$80" />
    </div>
  ),
};

/** Select mode. The chosen card takes the selected colour, as ChoiceCard does, and its radio fills. */
export const Selected: Story = {
  render: (args) => (
    <div role="radiogroup" aria-label="Services" className="grid max-w-3xl items-start gap-4 sm:grid-cols-2">
      <ServiceCard
        {...args}
        layout="vertical"
        coverImageUrl={PHOTO.wash}
        groupName="selected-demo"
        value="wash"
        selected
        onSelect={() => {}}
        priceLabel="$83.92"
        priceLines={withFee("$80", "$3.92")}
      />
      <ServiceCard
        {...args}
        layout="vertical"
        name="Ceramic coating, two layers"
        coverImageUrl={undefined}
        durationLabel={null}
        workingDaysLabel="3 working days"
        chips={[DROP_OFF]}
        groupName="selected-demo"
        value="ceramic"
        onSelect={() => {}}
        priceLabel="$943.65"
        priceLines={withFee("$900", "$43.65")}
      />
    </div>
  ),
};

/** A Badge over the photo's corner. */
export const WithBadge: Story = {
  args: {
    coverImageUrl: PHOTO.wrap,
    badge: <Badge variant="brand" shape="parallelogram">Most booked</Badge>,
    addonsHint: "+2 add-ons available",
    href: "#",
    actionLabel: "Book",
  },
  render: (args) => (
    <div className="max-w-xs">
      <ServiceCard {...args} layout="vertical" />
    </div>
  ),
};

/** Not bookable (no price yet): no link, no pill, no hover. */
export const Static: Story = {
  args: { coverImageUrl: PHOTO.wash, priceLabel: "Price on request" },
  render: (args) => (
    <div className="max-w-2xl">
      <ServiceCard {...args} layout="horizontal" />
    </div>
  ),
};

/** Loading, in both layouts. Silent by default; announce once from the list. */
export const Skeleton: Story = {
  render: () => (
    <div className="grid max-w-4xl gap-6">
      <div role="status" aria-live="polite" className="grid gap-4 sm:grid-cols-3">
        <span className="sr-only">Loading services</span>
        <ServiceCardSkeleton layout="vertical" />
        <ServiceCardSkeleton layout="vertical" />
        <ServiceCardSkeleton layout="vertical" />
      </div>
      <div className="grid gap-3">
        <ServiceCardSkeleton layout="horizontal" />
        <ServiceCardSkeleton layout="horizontal" />
      </div>
    </div>
  ),
};

/* ─── In context ──────────────────────────────────────────────────────── */

type DemoService = {
  id: string;
  name: string;
  description?: string;
  photo?: string;
  duration?: string;
  workingDays?: string;
  price: string;
  parts?: { label: string; value: string }[];
};

const MENU: DemoService[] = [
  {
    id: "wash",
    name: "Exterior hand wash",
    description: "Two-bucket hand wash, wheel faces, door shuts and a spray sealant.",
    photo: PHOTO.wash,
    duration: "45 min",
    price: "$83.92",
    parts: withFee("$80", "$3.92"),
  },
  {
    id: "interior",
    name: "Interior steam clean",
    description:
      "Hot-water extraction on carpets and cloth seats, leather cleaned and conditioned, headliner spot-cleaned, every vent and seam steamed, glass inside and out.",
    photo: PHOTO.interior,
    duration: "2 hr",
    price: "$188.82",
    parts: withFee("$180", "$8.82"),
  },
  {
    id: "ceramic",
    name: "Ceramic coating, two layers",
    description: "Decontamination, a single-stage polish and two layers of coating, cured overnight.",
    workingDays: "3 working days",
    price: "$943.65",
    parts: withFee("$900", "$43.65"),
  },
  {
    id: "paint",
    name: "Paint correction, single stage",
    description: "Machine polish to lift swirls and light scratches, finished with a sealant.",
    photo: PHOTO.sport,
    duration: "5 hr",
    price: "$471.83",
    parts: withFee("$450", "$21.83"),
  },
  {
    id: "headlights",
    name: "Headlight restoration",
    duration: "1 hr",
    price: "$125.82",
    parts: withFee("$120", "$5.82"),
  },
  {
    id: "wheels",
    name: "Wheels off, barrels and calipers",
    description: "Each wheel off the car, cleaned front and back, sealed, refitted to torque.",
    photo: PHOTO.bay,
    duration: "1 hr 30 min",
    price: "$157.28",
    parts: withFee("$150", "$7.28"),
  },
];

/**
 * The booking picker: a radio group of tiles, one column on a phone (rows)
 * and a grid from 640px. Choosing a card fills it; Continue moves on. Cards
 * reveal in a stagger on the motion tokens, and not at all under reduced
 * motion. Run at the phone, tablet and desktop viewports.
 */
export const BookingPickerGrid: Story = {
  parameters: { layout: "fullscreen" },
  render: function Render() {
    const [chosen, setChosen] = useState<string | null>(null);
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 id="pick-heading" className="text-[1.75rem] font-black leading-tight text-[var(--text-strong)]">
          Pick a service
        </h1>
        <p className="mt-2 text-[var(--text-muted)]">Choose what you would like done. Next: your vehicle, where, and when.</p>
        {/* A fieldset makes the cards one radio group (arrow keys move, a
            screen reader says "2 of 6") while the list keeps its own
            semantics; the testid stays on the <li>, as QA locates it. */}
        <fieldset aria-labelledby="pick-heading" className="m-0 mt-6 min-w-0 border-0 p-0">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MENU.map((s, i) => (
            <li key={s.id} data-testid="booking-service-select">
              <ServiceCard
                layout="adaptive"
                nameAs="h2"
                name={s.name}
                description={s.description}
                coverImageUrl={s.photo}
                durationLabel={s.duration}
                workingDaysLabel={s.workingDays}
                chips={s.workingDays ? [DROP_OFF] : undefined}
                priceLabel={s.price}
                priceLines={s.parts}
                groupName="service"
                value={s.id}
                selected={chosen === s.id}
                onSelect={() => setChosen(s.id)}
                revealIndex={i}
                testIds={{ price: "booking-service-price", priceLines: "booking-service-price-parts" }}
              />
            </li>
          ))}
        </ul>
        </fieldset>
        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)]" aria-live="polite">
            {chosen ? `${MENU.find((s) => s.id === chosen)?.name} selected` : "Choose a service to continue"}
          </p>
          <Button disabled={!chosen}>
            Continue
          </Button>
        </div>
      </div>
    );
  },
};

/**
 * The merchant page: a section of rows, each a link to booking with a Book
 * pill, one not bookable yet. The same card as the picker, so the two never
 * disagree.
 */
export const MerchantPageList: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <section aria-labelledby="services-heading" className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id="services-heading" className="text-xl font-bold text-[var(--text-strong)]">
          Services
        </h2>
        <span className="text-sm text-[var(--text-muted)]">{MENU.length + 1} services</span>
      </div>
      <ul className="grid gap-3">
        {MENU.map((s, i) => (
          <li key={s.id} data-testid={`merchant-profile-service-${s.id}`}>
            <ServiceCard
              layout="horizontal"
              name={s.name}
              description={s.description}
              coverImageUrl={s.photo}
              durationLabel={s.duration}
              workingDaysLabel={s.workingDays}
              chips={s.workingDays ? [DROP_OFF] : undefined}
              priceLabel={s.price}
              priceLines={s.parts}
              href={`#book-${s.id}`}
              actionLabel="Book"
              revealIndex={i}
              testIds={{
                action: "merchant-profile-service-book",
                price: "merchant-profile-service-price",
                priceLines: "merchant-profile-service-price-parts",
              }}
            />
          </li>
        ))}
        <li data-testid="merchant-profile-service-quote">
          <ServiceCard
            layout="horizontal"
            name="Fleet wash, five cars or more"
            description="Priced per visit once we have seen the fleet."
            durationLabel="Half a day"
            priceLabel="Price on request"
          />
        </li>
      </ul>
    </section>
  ),
};

/* customer-web's own press rule (src/components/waitlist-aw/waitlist.css),
 * scoped to the story: every link and radio label scales to 98.5% while
 * pressed. It is what shrank the card's hit area to the name on QA. */
const CONSUMER_PRESS = `
.consumer-press :is(a[href], button, summary, [role="button"], label:has(input[type="radio"], input[type="checkbox"])) {
  transition-property: color, background-color, border-color, text-decoration-color, opacity, translate, scale;
  transition-duration: var(--motion-hover), var(--motion-hover), var(--motion-hover), var(--motion-hover), var(--motion-hover), var(--motion-hover), var(--motion-press);
}
@media (prefers-reduced-motion: no-preference) {
  .consumer-press :is(button:not(:disabled), [role="button"]:not([aria-disabled="true"])):active { scale: 0.97; }
  .consumer-press :is(a[href], summary, label:has(input[type="radio"]:not(:disabled), input[type="checkbox"]:not(:disabled))):active { scale: 0.985; }
}`;

/* A link that handles its own click, as Next's Link does, and says where it went. */
const OpenedContext = createContext<(href: string) => void>(() => {});
const DemoLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(function DemoLink(
  { onClick, ...props },
  ref,
) {
  const onOpen = useContext(OpenedContext);
  return (
    <a
      ref={ref}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        event.preventDefault();
        onOpen(props.href ?? "");
      }}
    />
  );
});

/**
 * AUTM-1786: a press anywhere on the card is the card's. Tap the photo, the
 * description, the chips or the price: on the pro's page the line under the
 * list names the booking it opened, in the picker the service it selected.
 * More only expands. The keyboard is unchanged: Tab to a card, then Enter (a
 * link) or Space (a radio).
 *
 * Both lists sit under customer-web's own press rule, which scales every link
 * and radio label to 98.5% while pressed; on qa.autara.au that shrank the hit
 * area to the name, so only a tap on the name opened booking. The same press,
 * with real pointer input at 390, 834 and 1440, is ServiceCard.browser.test.tsx.
 */
export const TapAnywhere: Story = {
  parameters: { layout: "fullscreen" },
  render: function Render() {
    const [opened, setOpened] = useState<string | null>(null);
    const [chosen, setChosen] = useState<string | null>(null);
    const services = MENU.slice(0, 3);
    const nameOf = (id: string | null) => services.find((s) => s.id === id)?.name;
    return (
      <div className="consumer-press mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8 sm:px-6">
        <style>{CONSUMER_PRESS}</style>
        <section aria-labelledby="tap-page-heading">
          <h2 id="tap-page-heading" className="text-xl font-bold text-[var(--text-strong)]">
            On the pro&apos;s page
          </h2>
          <OpenedContext.Provider value={(href) => setOpened(href.replace("#book-", ""))}>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <li key={s.id} className="flex flex-col">
                  <ServiceCard
                    layout="adaptive"
                    name={s.name}
                    description={s.description}
                    coverImageUrl={s.photo}
                    durationLabel={s.duration}
                    workingDaysLabel={s.workingDays}
                    chips={s.workingDays ? [DROP_OFF] : undefined}
                    priceLabel={s.price}
                    priceLines={s.parts}
                    href={`#book-${s.id}`}
                    as={DemoLink}
                    actionLabel="Book"
                  />
                </li>
              ))}
            </ul>
          </OpenedContext.Provider>
          <p className="mt-3 text-sm text-[var(--text-muted)]" aria-live="polite">
            {opened ? `Opened booking for ${nameOf(opened)}` : "Tap anywhere on a card"}
          </p>
        </section>
        <section aria-labelledby="tap-picker-heading">
          <h2 id="tap-picker-heading" className="text-xl font-bold text-[var(--text-strong)]">
            In the booking picker
          </h2>
          <fieldset aria-labelledby="tap-picker-heading" className="m-0 mt-4 min-w-0 border-0 p-0">
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <li key={s.id} className="flex flex-col">
                  <ServiceCard
                    layout="adaptive"
                    nameAs="h3"
                    name={s.name}
                    description={s.description}
                    coverImageUrl={s.photo}
                    durationLabel={s.duration}
                    workingDaysLabel={s.workingDays}
                    chips={s.workingDays ? [DROP_OFF] : undefined}
                    priceLabel={s.price}
                    priceLines={s.parts}
                    groupName="tap-anywhere"
                    value={s.id}
                    selected={chosen === s.id}
                    onSelect={() => setChosen(s.id)}
                  />
                </li>
              ))}
            </ul>
          </fieldset>
          <p className="mt-3 text-sm text-[var(--text-muted)]" aria-live="polite">
            {chosen ? `${nameOf(chosen)} selected` : "Tap anywhere on a card to choose it"}
          </p>
        </section>
      </div>
    );
  },
};

/** Dark: the band card on dark paper, the selected fill, and the no-photo panel. */
export const Dark: Story = {
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "Paper, dark" } },
  render: (args) => (
    <div role="radiogroup" aria-label="Services" className="grid max-w-5xl items-start gap-4 sm:grid-cols-3">
      <ServiceCard
        {...args}
        layout="vertical"
        coverImageUrl={PHOTO.wash}
        groupName="dark-demo"
        value="wash"
        selected
        onSelect={() => {}}
        priceLabel="$83.92"
        priceLines={withFee("$80", "$3.92")}
      />
      <ServiceCard
        {...args}
        layout="vertical"
        name="Ceramic coating, two layers"
        durationLabel={null}
        workingDaysLabel="3 working days"
        chips={[DROP_OFF]}
        groupName="dark-demo"
        value="ceramic"
        onSelect={() => {}}
        priceLabel="$943.65"
        priceLines={withFee("$900", "$43.65")}
      />
      <ServiceCard {...args} layout="vertical" coverImageUrl={PHOTO.interior} href="#" actionLabel="Book" />
      <div className="sm:col-span-3">
        <ServiceCard {...args} layout="horizontal" coverImageUrl={PHOTO.bay} href="#" actionLabel="Book" />
      </div>
    </div>
  ),
};

/**
 * AUTM-1812: the merchant's own catalogue. Every card says where it stands,
 * as a solid pill on the photo, in the service editor's own words and tones:
 * Active lime, Draft amber, Inactive band. A draft with no cover says so on
 * the panel, because the cover is what stands between it and Publish. An
 * add-on hint is the existing `addonsHint` chip.
 */
export const CatalogueGrid: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="p-4">
      <CardGrid aria-label="Services">
        <li>
          <ServiceCard
            layout="vertical"
            href="#edit"
            name="Exterior hand wash"
            description="Two-bucket hand wash, wheel faces, door shuts and a spray sealant."
            priceLabel="$80"
            durationLabel="45m"
            coverImageUrl={PHOTO.wash}
            status={{ label: "Active", tone: "live" }}
            addonsHint="2 add-ons"
          />
        </li>
        <li>
          <ServiceCard
            layout="vertical"
            href="#edit"
            name="Interior deep clean"
            description="Steam, extraction and a leather wipe-down."
            priceLabel="$200"
            durationLabel="2h 30m"
            noPhotoLabel="No photo yet"
            status={{ label: "Draft", tone: "draft" }}
          />
        </li>
        <li>
          <ServiceCard
            layout="vertical"
            href="#edit"
            name="Ceramic coating, two layers"
            priceLabel="$900"
            workingDaysLabel="3 working days"
            coverImageUrl={PHOTO.sport}
            status={{ label: "Active", tone: "live" }}
          />
        </li>
        <li>
          <ServiceCard
            layout="vertical"
            href="#edit"
            name="Headlight restoration"
            priceLabel="$120"
            durationLabel="1h"
            coverImageUrl={PHOTO.bay}
            status={{ label: "Inactive", tone: "off" }}
          />
        </li>
      </CardGrid>
    </div>
  ),
};

/** The catalogue in dark. */
export const CatalogueGridDark: Story = {
  ...CatalogueGrid,
  globals: { theme: "dark" },
  parameters: { layout: "fullscreen", backgrounds: { default: "Paper, dark" } },
};

/** The same words as the page (AUTM-1800): what the server quoted, through `listingPrice`, `serviceDurationLabel` and the multi-day labels. Fee above the minimum, the 99c minimum, fee off, and a multi-day job. */
const quoteOf = (service: number, fee: number) => ({
  bookingFeeLabel: "Booking fee",
  serviceTotalCents: service,
  bookingFeeTotalCents: fee,
  totalCents: service + fee,
});

export const PricedFromAQuote: Story = {
  name: "Priced from a server quote",
  render: (args) => {
    const rows = [
      { name: "Exterior hand wash", priceCents: 8000, quote: quoteOf(8000, 392), minutes: 45, days: null },
      { name: "Tyre shine", priceCents: 1000, quote: quoteOf(1000, 99), minutes: 15, days: null },
      { name: "Interior vacuum", priceCents: 6000, quote: quoteOf(6000, 0), minutes: 60, days: null },
      { name: "Ceramic coating", priceCents: 120000, quote: quoteOf(120000, 5880), minutes: 4320, days: 3 },
    ];
    return (
      <ul className="service-card-grid" role="list" style={{ maxWidth: 390 }}>
        {rows.map((row) => {
          const price = listingPrice({ priceCents: row.priceCents, priceBreakdown: row.quote });
          const multiDay = row.days !== null;
          return (
            <li key={row.name}>
              <ServiceCard
                {...args}
                layout="horizontal"
                name={row.name}
                priceLabel={price.headline}
                priceLines={price.lines ?? undefined}
                durationLabel={multiDay ? null : serviceDurationLabel(row.minutes)}
                workingDaysLabel={multiDay ? workingDaysLabel(row.days as number) : null}
                chips={multiDay ? [{ label: DROP_OFF_TAG, icon: <DropOffIcon /> }] : undefined}
              />
            </li>
          );
        })}
      </ul>
    );
  },
};

/* ─── AUTM-1866: the menu row ────────────────────────────────────────────
 *
 * Don, 2026-10-14, after Mobbin (Fresha's plain rows; Careem, Swiggy and
 * foodpanda with the text left and the photo right; Wise's one line plus one
 * detail line): text left, a square-ish photo right and no placeholder
 * without one; the name, then ONE meta line; two lines of description and no
 * More, because the card opens the service; the all-in total with the fee on
 * one small line; a quiet Book of its own, 44px. Check each at the phone and
 * desktop viewports, and in the Theme toolbar's dark.
 */

/** The figures the page has: the server's quote through `listingPrice`. */
const TYRE = listingPrice({
  priceCents: 1000,
  priceBreakdown: { bookingFeeLabel: "Booking fee", serviceTotalCents: 1000, bookingFeeTotalCents: 99, totalCents: 1099 },
});

const MENU_ARGS = {
  layout: "menu" as const,
  name: "Tyre shine",
  description: "Tyres cleaned and dressed with a water-based shine that dries to a satin finish, never greasy.",
  durationLabel: "15 min",
  locationLabel: "At the workshop",
  priceLabel: TYRE.headline,
  priceNote: TYRE.note,
  href: "#open-tyre-shine",
  bookHref: "#book-tyre-shine",
};

/** The menu row with a photo: the card opens the service, Book books. Two focus stops. */
export const Menu: Story = {
  args: { ...MENU_ARGS, coverImageUrl: PHOTO.wash },
  render: (args) => (
    <div className="max-w-md">
      <ServiceCard {...args} />
    </div>
  ),
};

/** No photo, no placeholder: the text takes the full width, Book stays at the foot's end. */
export const MenuNoPhoto: Story = {
  args: { ...MENU_ARGS, coverImageUrl: null },
  render: (args) => (
    <div className="max-w-md">
      <ServiceCard {...args} />
    </div>
  ),
};

/** A long name wraps in full beside the photo; the price and Book hold their places. */
export const MenuLongName: Story = {
  args: {
    ...MENU_ARGS,
    name: "Ceramic coating, stage two, with single-stage paint correction and wheel faces sealed",
    coverImageUrl: PHOTO.sport,
    durationLabel: "6 hr 30 min",
    pricePrefix: "From",
    priceLabel: "$1,309.88",
    priceNote: "incl. $59.88 booking fee",
  },
  render: (args) => (
    <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
      <ServiceCard {...args} />
      <ServiceCard {...args} coverImageUrl={null} />
    </div>
  ),
};

/** A long description stops at two lines, with no More: the card opens the service to read the rest. */
export const MenuLongDescription: Story = {
  args: {
    ...MENU_ARGS,
    name: "Interior steam clean",
    description:
      "Hot-water extraction on carpets and cloth seats, leather cleaned and conditioned, headliner spot-cleaned, every vent and seam steamed, glass inside and out, and the boot done the same way. We bring our own water and power.",
    coverImageUrl: PHOTO.interior,
    durationLabel: "2 hr",
    priceLabel: "$188.82",
    priceNote: "incl. $8.82 booking fee",
  },
  render: (args) => (
    <div className="max-w-md">
      <ServiceCard {...args} />
    </div>
  ),
};

/** No fee charged (the fee off, as on prod before 1.2.2): the price alone, no note. */
export const MenuNoFee: Story = {
  args: { ...MENU_ARGS, coverImageUrl: PHOTO.wash, priceLabel: "$10", priceNote: null },
  render: (args) => (
    <div className="max-w-md">
      <ServiceCard {...args} />
    </div>
  ),
};

/** A mobile pro: "Comes to you", worded by `serviceLocationLabel` from the pro's booking modes. */
export const MenuComesToYou: Story = {
  args: {
    ...MENU_ARGS,
    name: "Maintenance wash",
    description: "A two-bucket hand wash at your home or work, wheels and door shuts included.",
    coverImageUrl: PHOTO.bay,
    durationLabel: "1 hr",
    locationLabel: serviceLocationLabel(["MOBILE"]),
    priceLabel: "$83.92",
    priceNote: "incl. $3.92 booking fee",
  },
  render: (args) => (
    <div className="max-w-md">
      <ServiceCard {...args} />
    </div>
  ),
};

type MenuDemo = {
  id: string;
  name: string;
  description?: string;
  photo?: string;
  minutes: number;
  days?: number;
  serviceCents: number;
  feeCents: number;
};

const MENU_ROWS: MenuDemo[] = [
  { id: "tyre", name: "Tyre shine", description: "Tyres cleaned and dressed with a water-based shine that dries to a satin finish.", photo: PHOTO.wash, minutes: 15, serviceCents: 1000, feeCents: 99 },
  { id: "interior", name: "Interior steam clean", description: "Hot-water extraction on carpets and cloth seats, leather cleaned and conditioned, headliner spot-cleaned, every vent and seam steamed.", photo: PHOTO.interior, minutes: 120, serviceCents: 18000, feeCents: 882 },
  { id: "ceramic", name: "Ceramic coating, two layers", description: "Decontamination, a single-stage polish and two layers of coating, cured overnight.", minutes: 4320, days: 3, serviceCents: 90000, feeCents: 4410 },
  { id: "paint", name: "Paint correction, single stage", description: "Machine polish to lift swirls and light scratches, finished with a sealant.", photo: PHOTO.sport, minutes: 300, serviceCents: 45000, feeCents: 2205 },
  { id: "headlights", name: "Headlight restoration", minutes: 60, serviceCents: 12000, feeCents: 588 },
];

const quoted = (row: MenuDemo) =>
  listingPrice({
    priceCents: row.serviceCents,
    priceBreakdown: {
      bookingFeeLabel: "Booking fee",
      serviceTotalCents: row.serviceCents,
      bookingFeeTotalCents: row.feeCents,
      totalCents: row.serviceCents + row.feeCents,
    },
  });

/**
 * In context, the pro's page: the menu in the library's `.service-card-grid`,
 * worded by the library's helpers (`listingPrice().note`,
 * `serviceDurationLabel`, `serviceLocationLabel`, the multi-day words). The
 * whole card opens the service; Book goes to checkout; the page's one lime
 * action stays outside the list. Run at the phone, tablet and desktop
 * viewports.
 */
export const MenuProPage: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <section aria-labelledby="menu-heading" className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id="menu-heading" className="text-xl font-bold text-[var(--text-strong)]">
          Services
        </h2>
        <span className="text-sm text-[var(--text-muted)]">{MENU_ROWS.length} services</span>
      </div>
      <ul className="service-card-grid service-card-grid--adaptive" role="list">
        {MENU_ROWS.map((row, i) => {
          const price = quoted(row);
          const multiDay = row.days != null;
          return (
            <li key={row.id} data-testid={`merchant-profile-service-${row.id}`}>
              <ServiceCard
                layout="menu"
                name={row.name}
                description={row.description}
                coverImageUrl={row.photo}
                durationLabel={multiDay ? null : serviceDurationLabel(row.minutes)}
                workingDaysLabel={multiDay ? workingDaysLabel(row.days as number) : null}
                locationLabel={multiDay ? null : serviceLocationLabel(["WORKSHOP"])}
                chips={multiDay ? [{ label: DROP_OFF_TAG, testId: "merchant-profile-service-dropoff-tag" }] : undefined}
                priceLabel={price.headline}
                priceNote={price.note}
                href={`#open-${row.id}`}
                bookHref={`#book-${row.id}`}
                revealIndex={i}
                testId="merchant-profile-service-row"
                testIds={{
                  action: "merchant-profile-service-open",
                  book: "merchant-profile-service-book",
                  price: "merchant-profile-service-price",
                  priceLines: "merchant-profile-service-price-parts",
                  duration: "merchant-profile-service-duration",
                  workingDays: "merchant-profile-service-working-days",
                }}
              />
            </li>
          );
        })}
      </ul>
    </section>
  ),
};

/** The pro's page in dark: the band card on dark paper, the pill one tonal step off it. */
export const MenuProPageDark: Story = {
  ...MenuProPage,
  globals: { theme: "dark" },
  parameters: { layout: "fullscreen", backgrounds: { default: "Paper, dark" } },
};

/**
 * In context, the booking picker: the same row in select mode, one radio
 * group. A tap anywhere chooses; the state light sits under the photo where
 * Book sits on the page; Continue lives outside the list.
 */
export const MenuPicker: Story = {
  parameters: { layout: "fullscreen" },
  render: function Render() {
    const [chosen, setChosen] = useState<string | null>("interior");
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 id="menu-pick-heading" className="text-[1.75rem] font-black leading-tight text-[var(--text-strong)]">
          Pick a service
        </h1>
        <fieldset aria-labelledby="menu-pick-heading" className="m-0 mt-6 min-w-0 border-0 p-0">
          <ul className="service-card-grid service-card-grid--adaptive" role="list">
            {MENU_ROWS.map((row, i) => {
              const price = quoted(row);
              const multiDay = row.days != null;
              return (
                <li key={row.id} data-testid="booking-service-select">
                  <ServiceCard
                    layout="menu"
                    nameAs="h2"
                    name={row.name}
                    description={row.description}
                    coverImageUrl={row.photo}
                    durationLabel={multiDay ? null : serviceDurationLabel(row.minutes)}
                    workingDaysLabel={multiDay ? workingDaysLabel(row.days as number) : null}
                    locationLabel={multiDay ? null : serviceLocationLabel(["MOBILE", "WORKSHOP"])}
                    chips={multiDay ? [{ label: DROP_OFF_TAG }] : undefined}
                    priceLabel={price.headline}
                    priceNote={price.note}
                    groupName="menu-picker"
                    value={row.id}
                    selected={chosen === row.id}
                    onSelect={() => setChosen(row.id)}
                    revealIndex={i}
                    testIds={{
                      action: "booking-service-radio",
                      price: "booking-service-price",
                      priceLines: "booking-service-price-parts",
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </fieldset>
        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)]" aria-live="polite">
            {chosen ? `${MENU_ROWS.find((r) => r.id === chosen)?.name} selected` : "Choose a service to continue"}
          </p>
          <Button>Continue</Button>
        </div>
      </div>
    );
  },
};

/** The picker in dark, with the chosen row in the selected colour. */
export const MenuPickerDark: Story = {
  ...MenuPicker,
  globals: { theme: "dark" },
  parameters: { layout: "fullscreen", backgrounds: { default: "Paper, dark" } },
};

/** The menu row loading. Silent by default; announce once from the list. */
export const MenuSkeleton: Story = {
  render: () => (
    <div role="status" aria-live="polite" className="grid max-w-3xl gap-3 sm:grid-cols-2">
      <span className="sr-only">Loading services</span>
      <ServiceCardSkeleton layout="menu" />
      <ServiceCardSkeleton layout="menu" />
    </div>
  ),
};

/** Solar-style drop-off glyph for the consumer chip in these stories. */
function DropOffIcon() {
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
      <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-8.5Z" />
      <path d="M9.5 20.5v-5h5v5" />
    </svg>
  );
}
