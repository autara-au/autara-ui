import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SplitPane } from "./SplitPane";

/**
 * SplitPane (AUTM-1755): a list beside its record, with a splitter. Drag the
 * line between them, or Tab to it and use Left, Right, Home and End.
 * Double-click resets. The default scales with the split (30%, held between
 * 25rem and 36rem); a drag stays between 20rem and 48rem and always leaves
 * the record 36rem.
 *
 * Built for the merchant portal's Inbox and Customers, where the list was a
 * fixed 400px at every window size.
 */
const meta = {
  title: "Molecules/SplitPane",
  component: SplitPane,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SplitPane>;

export default meta;
type Story = StoryObj<typeof meta>;

const ROWS = [
  ["Fri, 9 Oct 13:00", "Ceramic coating, stage two with paint correction", "Marcus Bellingham-Fitzgerald", "$640.00", "Pending"],
  ["Sun, 11 Oct 11:00", "New-car protection package", "Jo Lee", "$180.00", "Pending"],
  ["Fri, 9 Oct 16:30", "Express wash", "Priya Nandakumar", "$60.00", "In progress"],
  ["Mon, 12 Oct 09:00", "Full interior and exterior clean", "Tom Whitfield", "$189.00", "Payment due"],
] as const;

function List() {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto py-4 pl-6 pr-6">
      {ROWS.map(([when, service, customer, price, status], i) => (
        <button
          key={service}
          type="button"
          className={
            "flex min-h-11 flex-col gap-1 rounded-2xl px-4 py-3 text-left " +
            (i === 0 ? "bg-[var(--band)]" : "bg-[var(--paper)] hover:bg-[var(--band)]")
          }
        >
          <span className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate font-medium text-[var(--text-strong)]">{service}</span>
            <span className="font-bold tabular-nums text-[var(--text-strong)]">{price}</span>
          </span>
          <span className="truncate text-[0.875rem] text-[var(--text-muted)]">
            {when} · {customer}
          </span>
          <span className="text-[0.8125rem] font-medium text-[var(--accent)]">{status}</span>
        </button>
      ))}
    </div>
  );
}

function Record() {
  return (
    <div className="h-full overflow-y-auto px-10 py-8">
      <p className="text-[0.8125rem] font-medium text-[var(--text-muted)]">Fri, 9 Oct, 13:00 to 16:00</p>
      <h2 className="mt-1 text-[1.75rem] font-bold text-[var(--text-strong)]">Marcus Bellingham-Fitzgerald</h2>
      <p className="mt-4 max-w-[36rem] text-[var(--text-muted)]">
        Ceramic coating, stage two with paint correction. Workshop drop-off, Volkswagen Golf GTI. Accept or decline
        before the request runs out.
      </p>
    </div>
  );
}

function Frame({ width, children }: { width: number | string; children: ReactNode }) {
  return (
    <div style={{ width, height: 560 }} className="border-y border-[var(--hairline)] bg-[var(--paper)]">
      {children}
    </div>
  );
}

const base = {
  label: "Resize the list",
  primary: <List />,
  secondary: <Record />,
  primaryClassName: "h-full",
  secondaryClassName: "h-full",
  testId: "inbox-split",
};

/** A laptop window less the rail: the list keeps the 400px it always had. */
export const Laptop: Story = {
  args: base,
  render: (args) => (
    <Frame width={1200}>
      <SplitPane {...args} />
    </Frame>
  ),
};

/** A 2560 monitor less the rail: the default list grows to 36rem. */
export const WideWindow: Story = {
  args: base,
  render: (args) => (
    <Frame width={2320}>
      <SplitPane {...args} />
    </Frame>
  ),
};

/** Remembers a dragged width on this device. Drag, then reload the story. */
export const Remembered: Story = {
  args: { ...base, storageKey: "autara-ui.story.split" },
  render: (args) => (
    <Frame width={1600}>
      <SplitPane {...args} />
    </Frame>
  ),
};

/** Too narrow for both bounds: the list keeps its 20rem floor and the record gives way. */
export const Cramped: Story = {
  args: base,
  render: (args) => (
    <Frame width={760}>
      <SplitPane {...args} />
    </Frame>
  ),
};

/** Dark: the line is a hairline at rest and the accent on hover, focus and drag. */
export const Dark: Story = {
  args: base,
  render: (args) => (
    <div data-theme="dark" className="bg-[var(--canvas)]">
      <Frame width={1200}>
        <SplitPane {...args} />
      </Frame>
    </div>
  ),
};

function Conversation() {
  return (
    <div className="flex h-full flex-col justify-end gap-3 overflow-y-auto px-8 py-6">
      <div className="mx-auto flex w-full max-w-[46rem] flex-col gap-3">
        <p className="max-w-[80%] self-start rounded-2xl bg-[var(--band)] px-4 py-2.5 text-[var(--text-strong)]">
          Hi Sam, is Saturday at 9:40 still OK?
        </p>
        <p className="max-w-[80%] self-end rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-[var(--on-accent)]">
          Yes, see you then.
        </p>
      </div>
    </div>
  );
}

function BookingPanel() {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-5">
      <p className="text-[1.0625rem] font-bold text-[var(--text-strong)]">Booking</p>
      <p className="break-words text-[var(--text-strong)]">Exterior Car Care &amp; Detailing, with a two-stage machine polish</p>
      <p className="text-[0.875rem] text-[var(--text-muted)]">Sat, 17 Oct, 09:40 · 14 Australia St, Camperdown</p>
    </div>
  );
}

/**
 * AUTM-1878 follow-up: `side="end"` sizes the END pane, a booking panel beside
 * a conversation. Default 24rem, between 20rem and 36rem, and the
 * conversation never under 30rem. Left widens the panel (the line moves
 * left), Right narrows it, Home and End are its bounds, double-click resets.
 */
export const SidePanel: Story = {
  args: {
    ...base,
    side: "end",
    label: "Resize the booking panel",
    primary: <Conversation />,
    secondary: <BookingPanel />,
    testId: "inbox-panel-split",
    defaultFraction: 0,
    defaultMinRem: 24,
    defaultMaxRem: 24,
    minRem: 20,
    maxRem: 36,
    secondaryMinRem: 30,
  },
  render: (args) => (
    <Frame width={1200}>
      <SplitPane {...args} />
    </Frame>
  ),
};
