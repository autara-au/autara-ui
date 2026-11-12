import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { QuickReplies, type QuickReply } from "./QuickReplies";
import { MessageComposer } from "./MessageComposer";

/** AUTM-1806 (U4). A chip fills the composer; it never sends. */
const meta = {
  title: "Molecules/QuickReplies",
  component: QuickReplies,
  parameters: { layout: "padded" },
  args: { replies: [], onSelect: () => {} },
} satisfies Meta<typeof QuickReplies>;

export default meta;
type Story = StoryObj<typeof meta>;

const CUSTOMER: QuickReply[] = [
  { id: "late", label: "I'm running late" },
  { id: "here", label: "I'm here" },
  { id: "park", label: "Where do I park?" },
  { id: "extra", label: "Ask about an extra" },
];

const MERCHANT: QuickReply[] = [
  { id: "omw", label: "On my way" },
  { id: "15", label: "15 minutes away" },
  { id: "arrived", label: "I've arrived" },
  { id: "done", label: "All done, ready to collect" },
];

function useLargeText() {
  useEffect(() => {
    const prev = document.documentElement.style.fontSize;
    document.documentElement.style.fontSize = "200%";
    return () => {
      document.documentElement.style.fontSize = prev;
    };
  }, []);
}

export const Customer: Story = {
  args: { replies: CUSTOMER },
  render: (args) => (
    <div className="max-w-[390px]">
      <QuickReplies {...args} />
    </div>
  ),
};

export const Merchant: Story = {
  args: { replies: MERCHANT },
  render: (args) => (
    <div className="max-w-[390px]">
      <QuickReplies {...args} />
    </div>
  ),
};

/** In context: the chip puts its words in the field and focuses it. */
export const FillsTheComposer: Story = {
  parameters: { layout: "fullscreen" },
  render: function FillsTheComposerStory() {
    const [value, setValue] = useState("");
    return (
      <div className="flex h-[360px] flex-col justify-end bg-[var(--paper)]">
        <div className="mx-auto w-full max-w-[680px] px-4 pb-3">
          <QuickReplies
            replies={CUSTOMER}
            onSelect={(r) => {
              setValue(r.value ?? r.label);
              requestAnimationFrame(() =>
                document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Message"]')?.focus(),
              );
            }}
          />
        </div>
        <MessageComposer value={value} onChange={setValue} onSend={() => setValue("")} />
      </div>
    );
  },
};

export const Dark: Story = {
  args: { replies: MERCHANT },
  render: (args) => (
    <div data-theme="dark" className="max-w-[390px] rounded-3xl bg-[var(--paper)] p-5">
      <QuickReplies {...args} />
    </div>
  ),
};

/** 200% text on a small phone: the chips wrap onto new lines, none clip. */
export const LargeText: Story = {
  args: { replies: MERCHANT },
  parameters: { viewport: { defaultViewport: "phoneSmall" } },
  render: function LargeTextStory(args) {
    useLargeText();
    return <QuickReplies {...args} />;
  },
};

/**
 * AUTM-1878 — `layout="row"`: one line that scrolls sideways, in a narrow
 * panel. The edge with more chips past it fades; scroll and the other edge
 * fades in.
 */
export const Row: Story = {
  args: {
    layout: "row",
    replies: [
      ...MERCHANT,
      { id: "running-over", label: "Running about 15 minutes over" },
      { id: "gate", label: "What's the gate code?" },
    ],
  },
  render: (args) => (
    <div className="max-w-[360px] rounded-3xl bg-[var(--surface-warm)] p-4">
      <QuickReplies {...args} />
    </div>
  ),
};

