import type { Meta, StoryObj } from "@storybook/react-vite";
import { DeviceFrame } from "./DeviceFrame";

const meta: Meta<typeof DeviceFrame> = {
  title: "Marketing/DeviceFrame",
  component: DeviceFrame,
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj<typeof DeviceFrame>;

/* A stand-in screen: the stories cannot ship a product capture, so this is
 * a labelled block at the device's own aspect. Consumers put a real capture
 * here. */
function Screen({ text }: { text: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--surface-warm,#F3EFE6)] text-sm text-[var(--text-muted)]">
      {text}
    </div>
  );
}

export const Phone: Story = {
  name: "phone — 390x844",
  render: () => (
    <div className="w-[280px]">
      <DeviceFrame kind="phone" label="A merchant profile on Autara">
        <Screen text="390x844 capture" />
      </DeviceFrame>
    </div>
  ),
};

export const Tablet: Story = {
  name: "tablet — 1194x834",
  render: () => (
    <div className="w-[560px]">
      <DeviceFrame kind="tablet" label="The merchant Today screen">
        <Screen text="1194x834 capture" />
      </DeviceFrame>
    </div>
  ),
};

/** In context: the frame beside a claim on a dark band, the way the
 *  customer waitlist's business band uses it. */
export const OnInk: Story = {
  name: "in context — on the ink band",
  render: () => (
    <div className="flex items-center gap-10 rounded-3xl bg-[var(--text-strong)] p-10 text-[var(--background)]">
      <div className="max-w-xs">
        <h2 className="text-2xl font-bold tracking-[-0.02em]">Run a detailing business?</h2>
        <p className="mt-2 text-sm opacity-75">List your services, get verified, take bookings with the deposit paid up front.</p>
      </div>
      <div className="w-[420px]">
        <DeviceFrame kind="tablet">
          <Screen text="Today screen" />
        </DeviceFrame>
      </div>
    </div>
  ),
};
