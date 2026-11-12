import type { Meta, StoryObj } from "@storybook/react-vite";
import { CardGrid } from "./CardGrid";
import { ServiceCard } from "./ServiceCard";

/**
 * AUTM-1812: a grid that uses the width it is given. Columns follow the
 * grid's own width in rem (1, then 2 from 34rem, 3 from 51rem, 4 from 68rem),
 * so 200% text drops a column instead of crushing a card. Below, the same
 * grid in the content widths the portal measures at 390, 834 and 1440.
 */
const meta = {
  title: "Layout/CardGrid",
  component: CardGrid,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CardGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

function Cards({ n }: { n: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <li key={i}>
          <ServiceCard
            layout="vertical"
            name={`Service ${i + 1}`}
            priceLabel={`$${80 + i * 20}`}
            durationLabel={`${45 + i * 15}m`}
            status={{ label: "Active", tone: "live" }}
          />
        </li>
      ))}
    </>
  );
}

/** Content widths of the portal: 358px (phone), 786px (iPad portrait), 1120px (beside the rail). */
export const ByWidth: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-4">
      {[358, 786, 1120].map((w) => (
        <div key={w} style={{ width: w }} className="outline-dashed outline-1 outline-[var(--hairline)]">
          <p className="mb-2 text-sm font-medium text-[var(--text-muted)]">{w}px</p>
          <CardGrid aria-label={`Grid at ${w}px`}>
            <Cards n={4} />
          </CardGrid>
        </div>
      ))}
    </div>
  ),
};

/** Capped at two columns. */
export const MaxTwo: Story = {
  render: () => (
    <div className="p-4">
      <CardGrid maxColumns={2} aria-label="Two at most">
        <Cards n={4} />
      </CardGrid>
    </div>
  ),
};
