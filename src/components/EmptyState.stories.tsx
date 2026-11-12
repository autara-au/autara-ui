import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyState } from "./EmptyState";
import { BrandButton } from "./BrandButton";

/* A stand-in for the real art, which lives in merchant-mobile: a flat block cut
   out on transparency, 320px square for a 10rem box at 2x. Through a URL, so
   tsc needs no image module. */
const CUTOUT = new URL("./story-assets/empty-state-cutout.png", import.meta.url).href;

const meta = {
  title: "Molecules/EmptyState",
  component: EmptyState,
  parameters: { layout: "padded" },
  args: {
    title: "No bookings yet",
    description:
      "New requests from customers will appear here. We'll send you a push notification when one comes in.",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

const CalendarIcon = (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);

export const NoBookings: Story = {
  render: () => (
    <div className="max-w-md">
      <EmptyState
        icon={CalendarIcon}
        title="No bookings yet"
        description="New requests from customers will appear here. We'll send you a push notification the moment one comes in."
      />
    </div>
  ),
};

export const WithAction: Story = {
  render: () => (
    <div className="max-w-md">
      <EmptyState
        icon={CalendarIcon}
        title="Nothing on the calendar"
        description="Add your first service so customers can start booking."
        action={<BrandButton>Add a service</BrandButton>}
      />
    </div>
  ),
};

export const NoIcon: Story = {
  render: () => (
    <div className="max-w-md">
      <EmptyState
        title="No results"
        description="Try a different search term or broaden your filters."
      />
    </div>
  ),
};

export const Minimal: Story = {
  render: () => (
    <div className="max-w-md">
      <EmptyState title="No services yet" />
    </div>
  ),
};

/**
 * AUTM-2042 (Don, 2026-11-08): "the cut-out object on the grey band tile".
 * The same band card, centred: the picture about 10rem square, then the title,
 * the description and the action at its own width. The picture is decorative,
 * so pass `alt=""`.
 */
export const WithIllustration: Story = {
  render: () => (
    <div className="max-w-md">
      <EmptyState
        illustration={<img src={CUTOUT} alt="" />}
        title="No bookings yet"
        description="New requests from customers will appear here. We'll send you a push notification the moment one comes in."
        action={<BrandButton>Share your booking link</BrandButton>}
      />
    </div>
  ),
};

/** The same in the dark theme: the band and the ink follow the tokens. */
export const WithIllustrationDark: Story = {
  name: "With illustration (dark)",
  globals: { theme: "dark" },
  render: WithIllustration.render,
};

/** Edge cases: a phone-width column, a long title, no action, and both props (the illustration wins). */
export const WithIllustrationEdgeCases: Story = {
  name: "With illustration, edge cases",
  render: () => (
    <div className="grid max-w-[22rem] gap-4">
      <EmptyState
        illustration={<img src={CUTOUT} alt="" />}
        title="No packages yet, so customers can only book your services one at a time"
        description="Bundle two or more services into a package to sell them together."
      />
      <EmptyState
        icon={CalendarIcon}
        illustration={<img src={CUTOUT} alt="" />}
        title="Nothing on the calendar"
        action={<BrandButton>Add a service</BrandButton>}
      />
    </div>
  ),
};
