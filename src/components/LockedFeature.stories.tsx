import type { Meta, StoryObj } from "@storybook/react-vite";
import { LockedFeature } from "./LockedFeature";
import { BrandButton } from "./BrandButton";
import { Card } from "./Card";

/**
 * The copy in these stories is the copy a merchant would actually read, not
 * lorem. Two rules it follows, both from the brief:
 *
 *   - No price and no purchase wording anywhere. The native build cannot show
 *     one (App Store 3.1.3(f)), the plan screen that could is not built yet,
 *     and inventing a number here is how it ends up shipped.
 *   - It says what the merchant loses, not what we sell. "Send your customer
 *     a message" is their job; "Pro messaging" is our packaging.
 */
const meta = {
  title: "Molecules/LockedFeature",
  component: LockedFeature,
  parameters: { layout: "padded" },
  args: {
    locked: true,
    title: "Customer directory is on Pro",
    description:
      "See everyone who has booked with you, what they had done and when they were last in.",
  },
} satisfies Meta<typeof LockedFeature>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    action: <BrandButton size="sm">See plans</BrandButton>,
  },
};

/**
 * The row variant, for a list item or a menu entry where a full panel would
 * shout louder than the thing it is standing in for.
 */
export const Inline: Story = {
  args: {
    variant: "inline",
    title: "Earnings insights",
    description: "Trends, busiest days and repeat-customer rates.",
    action: <BrandButton size="sm">See plans</BrandButton>,
  },
};

/**
 * NOT LOCKED. The whole point of the wrapper: the caller passes the real
 * thing as children and an entitlement flag, so the unlocked path is the
 * default and nothing has to remember to render it.
 *
 * This is also what an unresolved or failed entitlement read looks like,
 * because those pass false. Hiding work from a merchant who is entitled to do
 * it is the expensive direction; an extra click is not.
 */
export const Unlocked: Story = {
  args: {
    locked: false,
    children: (
      <Card className="p-4">
        <p className="text-sm font-bold">Ava Mitchell</p>
        <p className="text-sm text-[var(--text-muted)]">
          6 bookings · last in 12 September
        </p>
      </Card>
    ),
  },
};

/**
 * In context: a settings section where one row is included and the next is
 * not. This is the story worth looking at, because the failure it guards
 * against is tonal rather than visual. A merchant opened this screen to do
 * something else, so the lock has to explain itself and then get out of the
 * way, rather than becoming the loudest thing on a screen they did not open
 * to be sold to.
 */
export const InContextSettingsList: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-2">
      <div className="rounded-autara-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3">
        <p className="text-sm font-bold text-[var(--text-strong)]">
          Blocked time
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Breaks, closures and holidays.
        </p>
      </div>
      <LockedFeature
        locked
        variant="inline"
        title="Packages"
        description="Bundle services together at a set price."
        action={<BrandButton size="sm">See plans</BrandButton>}
      />
      <div className="rounded-autara-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3">
        <p className="text-sm font-bold text-[var(--text-strong)]">
          Notifications
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Choose how we reach you.
        </p>
      </div>
    </div>
  ),
};

/**
 * Native: no price, no purchase button, no link out to one
 * (App Store 3.1.3(f)). The merchant still has to be told where to go, so the
 * action slot is empty and the description carries the route. A lock with no
 * way forward is a dead end, which is worse than the feature simply not
 * existing.
 */
export const NativeNoPurchaseRoute: Story = {
  args: {
    title: "Packages are on Pro",
    description:
      "Manage your plan from the merchant portal on the web, then packages will appear here.",
    action: undefined,
  },
};
