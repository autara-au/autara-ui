import { useLayoutEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PackageCard } from "./PackageCard";
import { ServiceCard, ServiceCardSkeleton } from "./ServiceCard";
import { CardGrid } from "./CardGrid";
import { Badge } from "./Badge";
import { formatPriceCents } from "../lib/service-listing";
import { packageSaving } from "../lib/package-listing";

/**
 * AUTM-1812: a package as a card that sells the deal. ServiceCard with a
 * package's words: what is included by name, the price large, the services'
 * own total struck through and a solid brand "Save $X". The saving comes from
 * `packageSaving` over the server's figures and is drawn only when positive.
 */
const meta = {
  title: "Marketplace/PackageCard",
  component: PackageCard,
  parameters: { layout: "padded" },
  args: {
    name: "Value Pack",
    priceLabel: "$470",
    layout: "vertical",
    href: "#edit",
  },
} satisfies Meta<typeof PackageCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const PHOTO = {
  wash: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=900&q=70",
  sport: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=70",
  bay: "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=70",
  interior: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=900&q=70",
};

/** A package as the server describes it: its price and each included line, in cents. */
interface PackageFixture {
  name: string;
  priceCents: number;
  lines: Array<{ name: string; cents: number }>;
  durationLabel?: string;
  coverImageUrl?: string;
}

/** The words a consumer passes, worked out the one way both apps do it. */
function dealProps(p: PackageFixture) {
  const saving = packageSaving({
    packagePriceCents: p.priceCents,
    includedPriceCents: p.lines.map((l) => l.cents),
  });
  return {
    name: p.name,
    priceLabel: formatPriceCents(p.priceCents),
    includedServices: p.lines.map((l) => l.name),
    servicesTotalLabel: saving ? formatPriceCents(saving.servicesTotalCents) : null,
    savingLabel: saving ? `Save ${formatPriceCents(saving.savingCents)}` : null,
    durationLabel: p.durationLabel,
    coverImageUrl: p.coverImageUrl,
  };
}

const VALUE_PACK: PackageFixture = {
  name: "Value Pack",
  priceCents: 47_000,
  lines: [
    { name: "Exterior hand wash", cents: 8_000 },
    { name: "Interior deep clean", cents: 20_000 },
    { name: "Clay bar and sealant", cents: 24_200 },
  ],
  durationLabel: "4h 30m",
  coverImageUrl: PHOTO.wash,
};

const FULL_WORKS: PackageFixture = {
  name: "Full Works",
  priceCents: 129_900,
  lines: [
    { name: "Exterior hand wash", cents: 8_000 },
    { name: "Clay bar decontamination", cents: 12_000 },
    { name: "Two-stage paint correction", cents: 65_000 },
    { name: "Ceramic coating, one layer", cents: 45_000 },
    { name: "Interior steam clean", cents: 18_000 },
  ],
  durationLabel: "9h",
  coverImageUrl: PHOTO.sport,
};

const AT_COST: PackageFixture = {
  name: "Wash and vac",
  priceCents: 14_000,
  lines: [
    { name: "Exterior hand wash", cents: 8_000 },
    { name: "Interior vacuum", cents: 6_000 },
  ],
  durationLabel: "1h 30m",
  coverImageUrl: PHOTO.interior,
};

const NO_PHOTO: PackageFixture = {
  name: "Fleet monthly, four vehicles",
  priceCents: 52_000,
  lines: [
    { name: "Exterior hand wash x4", cents: 32_000 },
    { name: "Interior vacuum x4", cents: 24_000 },
  ],
  durationLabel: "6h",
};

/** The deal: price, the services on their own struck through, Save. */
export const Default: Story = {
  args: dealProps(VALUE_PACK),
  render: (args) => (
    <div className="max-w-xs">
      <PackageCard {...args} />
    </div>
  ),
};

/** Priced at exactly the services' total: no struck figure, no Save. `packageSaving` is null. */
export const NoSaving: Story = {
  args: dealProps(AT_COST),
  render: (args) => (
    <div className="max-w-xs">
      <PackageCard {...args} />
    </div>
  ),
};

/** Five services: three by name, then "+ 2 more". */
export const ManyServices: Story = {
  args: dealProps(FULL_WORKS),
  render: (args) => (
    <div className="max-w-xs">
      <PackageCard {...args} />
    </div>
  ),
};

/** No cover: the designed panel with the package's length, and the catalogue's "No photo yet". */
export const NoPhoto: Story = {
  args: { ...dealProps(NO_PHOTO), noPhotoLabel: "No photo yet" },
  render: (args) => (
    <div className="max-w-xs">
      <PackageCard {...args} />
    </div>
  ),
};

/** The cover's review state in the photo corner, as the portal shows it today. */
export const CoverPending: Story = {
  args: {
    ...dealProps(VALUE_PACK),
    badge: <Badge variant="amber">Cover pending</Badge>,
  },
  render: (args) => (
    <div className="max-w-xs">
      <PackageCard {...args} />
    </div>
  ),
};

/** Long names wrap the title and cut each included name to one line; the full names stay in the DOM. */
export const LongNames: Story = {
  args: dealProps({
    name: "New-car protection package with two-stage paint correction and a ceramic top coat",
    priceCents: 189_950,
    lines: [
      { name: "Two-stage machine paint correction with refined finishing polish", cents: 95_000 },
      { name: "Ceramic coating, two layers, nine-year rated, wheels included", cents: 110_000 },
      { name: "Leather clean and conditioning with fabric protection", cents: 15_000 },
    ],
    durationLabel: "3 working days",
    coverImageUrl: PHOTO.bay,
  }),
  render: (args) => (
    <div className="max-w-xs">
      <PackageCard {...args} />
    </div>
  ),
};

/** While the included services load: the card without them, no saving yet, never "$0". */
export const IncludesLoading: Story = {
  args: { name: VALUE_PACK.name, priceLabel: "$470", coverImageUrl: PHOTO.wash, includedServices: null },
  render: (args) => (
    <div className="max-w-xs">
      <PackageCard {...args} />
    </div>
  ),
};

/** A list row, photo left, for a narrow column or a phone. */
export const Row: Story = {
  args: { ...dealProps(VALUE_PACK), layout: "horizontal" },
  render: (args) => (
    <div className="max-w-2xl">
      <PackageCard {...args} />
    </div>
  ),
};

/**
 * In a grid: the portal's Packages screen. CardGrid gives 1 column on a
 * phone, 2 on an iPad in portrait, 4 in landscape and beside the rail.
 */
export const InAGrid: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="p-4">
      <CardGrid aria-label="Packages" className="motion-rows">
        {[VALUE_PACK, FULL_WORKS, AT_COST, NO_PHOTO].map((p, i) => (
          <li key={p.name}>
            <PackageCard
              {...dealProps(p)}
              layout="vertical"
              href="#edit"
              noPhotoLabel="No photo yet"
              badge={i === 1 ? <Badge variant="amber">Cover pending</Badge> : undefined}
            />
          </li>
        ))}
      </CardGrid>
    </div>
  ),
};

/** The same grid in dark. */
export const InAGridDark: Story = {
  ...InAGrid,
  globals: { theme: "dark" },
  parameters: { layout: "fullscreen", backgrounds: { default: "Paper, dark" } },
};

/** Services and packages side by side read as one menu: same card, same rhythm. */
export const WithServices: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="p-4">
      <CardGrid aria-label="Menu">
        <li>
          <ServiceCard
            layout="vertical"
            href="#edit"
            name="Exterior hand wash"
            priceLabel="$80"
            durationLabel="45m"
            coverImageUrl={PHOTO.wash}
            status={{ label: "Active", tone: "live" }}
          />
        </li>
        <li>
          <ServiceCard
            layout="vertical"
            href="#edit"
            name="Interior deep clean"
            priceLabel="$200"
            durationLabel="2h"
            noPhotoLabel="No photo yet"
            status={{ label: "Draft", tone: "draft" }}
          />
        </li>
        <li>
          <PackageCard {...dealProps(VALUE_PACK)} layout="vertical" href="#edit" />
        </li>
        <li>
          <PackageCard {...dealProps(FULL_WORKS)} layout="vertical" href="#edit" />
        </li>
      </CardGrid>
    </div>
  ),
};

/** Loading: the card's own skeleton, in the same grid. */
export const Loading: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="p-4">
      <CardGrid aria-hidden as="div">
        {[0, 1, 2, 3].map((i) => (
          <ServiceCardSkeleton key={i} layout="vertical" />
        ))}
      </CardGrid>
    </div>
  ),
};

/** At 200% text the grid drops columns (its steps are rem) and the deal row wraps under the price. */
export const TextScale200: Story = {
  name: "Edge: 200% text",
  parameters: { layout: "fullscreen" },
  render: function TextScaleStory() {
    useLayoutEffect(() => {
      const html = document.documentElement;
      const before = html.style.fontSize;
      html.style.fontSize = "200%";
      return () => {
        html.style.fontSize = before;
      };
    }, []);
    return (
      <div className="p-4">
        <CardGrid aria-label="Packages">
          {[VALUE_PACK, FULL_WORKS].map((p) => (
            <li key={p.name}>
              <PackageCard {...dealProps(p)} layout="vertical" href="#edit" />
            </li>
          ))}
        </CardGrid>
      </div>
    );
  },
};
