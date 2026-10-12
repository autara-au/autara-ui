import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton } from "./IconButton";

/**
 * IconButton — canvas v44's icon disc (AUTM-1594). A 44px round action with
 * an icon and nothing else. `label` is required and is the accessible name.
 *
 * AUTM-1838: `strong` is the lime disc (no black buttons), for the one icon
 * action that leads, such as Send. Utility controls (pause, close) stay
 * `quiet`.
 */
const meta = {
  title: "Atoms/IconButton",
  component: IconButton,
  parameters: { layout: "centered" },
  argTypes: {
    variant: { control: "inline-radio", options: ["quiet", "strong", "ondeep", "ghost"] },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const Doc = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 3.5h7l4 4v13H7z" />
    <path d="M14 3.5v4h4" />
    <path d="M10 13h5M10 16.5h5" />
  </svg>
);
const Send = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12l16-8-6 16-2.5-6.5z" />
    <path d="M11.5 13.5L20 4" />
  </svg>
);
const Bell = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2h-14z" />
    <path d="M10 20.5h4" />
  </svg>
);
/* Stand-in for Badge variant="count" until the status family lands. */
const Count = (
  <span className="inline-flex h-[1.375rem] min-w-[1.375rem] items-center justify-center rounded-full bg-[#e11d48] px-[0.4375rem] text-xs font-bold text-white">
    12
  </span>
);

export const Quiet: Story = { args: { icon: Doc, label: "Remove" } };
/** The lime disc: the one icon action that leads. */
export const Strong: Story = { args: { icon: Send, label: "Send message", variant: "strong" } };
export const WithCount: Story = { args: { icon: Bell, label: "Notifications, 12 unread", badge: Count } };
export const OnBrandDeep: Story = {
  args: { icon: Bell, label: "Notifications", variant: "ondeep" },
  render: (args) => (
    <div className="rounded-[1.25rem] bg-[var(--hero)] p-3.5">
      <IconButton {...args} />
    </div>
  ),
};
export const Disabled: Story = { args: { icon: Doc, label: "Remove", disabled: true } };
