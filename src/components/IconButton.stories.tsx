import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { CloseButton, IconButton } from "./IconButton";
import { BackButton } from "./BackButton";

/**
 * IconButton — the icon disc (AUTM-1594; AUTM-1756).
 *
 * Don, 2026-10-15: "Icon buttons are less accessible, can we make it better,
 * and smooth." Every icon-only control is a FILLED disc with at least a 44px
 * target (48px to a finger), a visible focus ring (Tab to see it), a label
 * the type requires, and a soft hover and press: the glyph's colour laid over
 * the fill, and a 97% press, opacity and scale only, the scale off under
 * reduced motion.
 *
 * Tones: `neutral` (default), `primary` (lime, the one icon action that
 * leads, such as Send), `danger` (a destructive icon action), `ondark`
 * (brand, brand-deep and ink grounds), `inverse` (the ink toast).
 * Sizes: `sm` 36px with a 44px target, `md` 44px, `lg` 52px.
 *
 * `CloseButton` is the one close control: every Dialog, Sheet, Toast and
 * PWAInstallBanner draws it.
 *
 * Use the Theme switcher in the toolbar to check both themes.
 */
const meta = {
  title: "Atoms/IconButton",
  component: IconButton,
  parameters: { layout: "centered" },
  argTypes: {
    tone: { control: "inline-radio", options: ["neutral", "primary", "danger", "ondark", "inverse"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/* Solar-style Linear glyphs, inlined so the story has no icon dependency. */
const glyph = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const Pen = glyph(<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />);
const Send = glyph(
  <>
    <path d="M4 12l16-8-6 16-2.5-6.5z" />
    <path d="M11.5 13.5L20 4" />
  </>,
);
const Bell = glyph(
  <>
    <path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2h-14z" />
    <path d="M10 20.5h4" />
  </>,
);
const Trash = glyph(
  <>
    <path d="M4.5 6.5h15M9.5 6.5V4.5h5v2M6.5 6.5l1 13h9l1-13" />
  </>,
);
const Dots = glyph(
  <>
    <circle cx="5.5" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="18.5" cy="12" r="1" fill="currentColor" />
  </>,
);
const Count = (
  <span className="inline-flex h-[1.375rem] min-w-[1.375rem] items-center justify-center rounded-full bg-[var(--alert)] px-[0.4375rem] text-xs font-bold text-[var(--on-alert)]">
    12
  </span>
);

export const Default: Story = { args: { icon: Pen, label: "Edit service" } };

/** The lime disc: the one icon action that leads. */
export const Primary: Story = { args: { icon: Send, label: "Send message", tone: "primary" } };

/** Red glyph on the neutral disc: never a red fill. */
export const Danger: Story = { args: { icon: Trash, label: "Remove vehicle", tone: "danger" } };

export const WithCount: Story = { args: { icon: Bell, label: "Notifications, 12 unread", badge: Count } };

/** Disabled keeps the real colour (AUTM-1719): no hover layer, no press. */
export const Disabled: Story = { args: { icon: Pen, label: "Edit service", disabled: true } };

export const Busy: Story = { args: { icon: Send, label: "Send message", tone: "primary", busy: true } };

/** `sm` is drawn at 36px for dense rows; its touch area is still 44px. */
export const Sizes: Story = {
  args: { icon: Dots, label: "More actions" },
  render: (args) => (
    <div className="flex items-center gap-4">
      <IconButton {...args} size="sm" />
      <IconButton {...args} size="md" />
      <IconButton {...args} size="lg" />
    </div>
  ),
};

const GROUNDS: { name: string; bg: string; ink: string; tone: "neutral" | "ondark" | "inverse" }[] = [
  { name: "Paper", bg: "var(--paper)", ink: "var(--text-strong)", tone: "neutral" },
  { name: "Band", bg: "var(--band)", ink: "var(--text-strong)", tone: "neutral" },
  { name: "Raised on band", bg: "var(--raised)", ink: "var(--text-strong)", tone: "neutral" },
  { name: "Brand deep", bg: "var(--brand-deep)", ink: "var(--on-deep)", tone: "ondark" },
  { name: "Brand", bg: "var(--brand)", ink: "var(--on-brand)", tone: "ondark" },
  { name: "Inverse (the ink toast)", bg: "var(--surface-inverse)", ink: "var(--text-on-inverse)", tone: "inverse" },
];

function Grounds() {
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {GROUNDS.map((g) => (
        <div key={g.name} className="flex items-center gap-3 rounded-2xl p-4" style={{ background: g.bg, color: g.ink }}>
          <IconButton icon={Pen} label="Edit" tone={g.tone} />
          <CloseButton tone={g.tone} />
          {g.tone !== "inverse" ? <BackButton tone={g.tone === "ondark" ? "ondark" : "neutral"} /> : null}
          <span className="text-sm font-medium">{g.name}</span>
        </div>
      ))}
    </div>
  );
}

/** Every ground the disc sits on, in light and dark side by side. */
export const EveryGround: Story = {
  args: { icon: Pen, label: "Edit" },
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="grid gap-0 lg:grid-cols-2">
      <div data-theme="light" className="bg-[var(--background)] p-6 text-[var(--text-strong)]">
        <Grounds />
      </div>
      <div data-theme="dark" className="bg-[var(--background)] p-6 text-[var(--text-strong)]">
        <Grounds />
      </div>
    </div>
  ),
};

/** The close every overlay draws. */
export const Close: Story = {
  args: { icon: Pen, label: "Close" },
  render: () => (
    <div className="flex items-center gap-4">
      <CloseButton label="Close dialog" />
      <CloseButton label="Dismiss notification" size="sm" />
      <CloseButton label="Close" size="lg" />
    </div>
  ),
};

/** A framework link: pass it empty, the disc fills it. */
export const AsLink: Story = {
  args: { icon: Pen, label: "Edit service" },
  render: (args) => (
    <IconButton {...args} asChild>
      <a href="#edit" />
    </IconButton>
  ),
};

/** In context: a record header, back pill left, actions right, at phone width too. */
export const InContext: Story = {
  args: { icon: Pen, label: "Edit" },
  parameters: { layout: "padded" },
  render: () => (
    <div className="mx-auto w-full max-w-xl">
      <div className="flex items-center justify-between gap-3">
        <BackButton label="Invoices" compact="phone" />
        <div className="flex items-center gap-2">
          <IconButton icon={Bell} label="Notifications, 12 unread" badge={Count} />
          <IconButton icon={Dots} label="More actions for this invoice" />
        </div>
      </div>
      <p className="mt-6 text-[0.8125rem] font-medium text-[var(--text-muted)]">Invoice INV-0042</p>
      <p className="mt-1 text-3xl font-bold tracking-[-0.03em] text-[var(--text-strong)]">$189.00</p>
      <div className="mt-6 flex items-center gap-3 rounded-[1.25rem] bg-[var(--band)] p-3">
        <input
          aria-label="Message"
          placeholder="Message Alex"
          className="min-h-11 flex-1 rounded-full bg-[var(--paper)] px-4 text-[var(--text-strong)] outline-none"
        />
        <IconButton icon={Send} label="Send message" tone="primary" />
      </div>
    </div>
  ),
};
