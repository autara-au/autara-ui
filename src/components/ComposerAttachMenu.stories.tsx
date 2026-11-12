import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ComposerAttachMenu, attachMenuGlyphs, type AttachMenuItem } from "./ComposerAttachMenu";
import { MessageComposer } from "./MessageComposer";

/**
 * AUTM-1806 (U5). The plus in the composer's leading slot. Phase 1A passes
 * only the rows that work today (no photo rows until photos ship).
 */
const meta = {
  title: "Molecules/ComposerAttachMenu",
  component: ComposerAttachMenu,
  parameters: { layout: "fullscreen" },
  args: { items: [] },
} satisfies Meta<typeof ComposerAttachMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const MERCHANT_1A: AttachMenuItem[] = [
  {
    id: "extra",
    label: "Add an extra",
    description: "Price it and send it to Sam to approve",
    icon: attachMenuGlyphs.extra,
    onSelect: () => {},
  },
];

const CUSTOMER_1A: AttachMenuItem[] = [
  {
    id: "ask",
    label: "Ask about an extra",
    description: "Ask Kerbside to add something to the job",
    icon: attachMenuGlyphs.question,
    onSelect: () => {},
  },
];

/** What Phase 1B adds above the extra row. Shown for the layout only. */
const MERCHANT_1B: AttachMenuItem[] = [
  { id: "camera", label: "Take a photo", icon: attachMenuGlyphs.camera, onSelect: () => {} },
  { id: "photos", label: "Choose photos", icon: attachMenuGlyphs.photos, onSelect: () => {} },
  ...MERCHANT_1A,
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

function Dock({
  items,
  open,
  footnote,
  layout,
}: {
  items: AttachMenuItem[];
  open?: boolean;
  footnote?: string;
  layout?: "auto" | "menu" | "sheet";
}) {
  const [value, setValue] = useState("");
  const [isOpen, setOpen] = useState(open ?? false);
  return (
    <div className="flex h-[560px] flex-col justify-end bg-[var(--paper)]">
      <MessageComposer
        value={value}
        onChange={setValue}
        onSend={() => setValue("")}
        placeholder="Message Sam"
        leading={<ComposerAttachMenu items={items} open={isOpen} onOpenChange={setOpen} footnote={footnote} layout={layout} />}
      />
    </div>
  );
}

/** Closed: the plus sits in the composer's leading slot. */
export const InTheComposer: Story = {
  render: () => <Dock items={MERCHANT_1A} />,
};

/**
 * AUTM-1878 follow-up (Don, 2026-10-15): from 768px up the + opens a small
 * menu anchored just above it (WhatsApp Web, Slack), arrow keys between the
 * rows, Escape or a click outside to close. Below that, the sheet.
 */
export const AnchoredMenu: Story = {
  render: () => (
    <Dock
      layout="menu"
      open
      items={[
        { id: "extra", label: "Add an extra", description: "Confirm the booking first", icon: attachMenuGlyphs.extra, onSelect: () => {}, disabled: true },
        { id: "confirm", label: "Confirm the booking", description: "Accept Sam's request, then add extras here", icon: attachMenuGlyphs.question, onSelect: () => {} },
      ]}
    />
  ),
};

/** The pro's sheet in Phase 1A: Add an extra. */
export const MerchantOpen: Story = {
  render: () => <Dock items={MERCHANT_1A} open />,
};

/** The customer's sheet in Phase 1A: Ask about an extra. */
export const CustomerOpen: Story = {
  render: () => <Dock items={CUSTOMER_1A} open />,
};

/** Phase 1B, for the layout: three rows and the privacy line. */
export const WithPhotoRows: Story = {
  render: () => (
    <Dock items={MERCHANT_1B} open footnote="Only you and Sam can see photos in this chat." />
  ),
};

export const Dark: Story = {
  render: function DarkStory() {
    useEffect(() => {
      const prev = document.documentElement.getAttribute("data-theme");
      document.documentElement.setAttribute("data-theme", "dark");
      return () => {
        if (prev) document.documentElement.setAttribute("data-theme", prev);
      };
    }, []);
    return <Dock items={MERCHANT_1A} open />;
  },
};

export const LargeText: Story = {
  parameters: { viewport: { defaultViewport: "phoneSmall" } },
  render: function LargeTextStory() {
    useLargeText();
    return <Dock items={CUSTOMER_1A} open />;
  },
};
